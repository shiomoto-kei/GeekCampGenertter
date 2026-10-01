-- db_setup.sql の後に、正しい Supabase プロジェクトの SQL Editor で実行する。
-- 通知はサーバー側 API からのみ読み書き可能にする。
-- posts 自体の RLS は変更しない。返信・リアクション時に通知トリガーが動く。

BEGIN;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_reply_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recipient BIGINT;
BEGIN
  IF NEW.parent_post_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT parent.author_id INTO recipient
  FROM public.posts AS parent
  JOIN public.users AS owner ON owner.id = parent.author_id
  WHERE parent.id = NEW.parent_post_id AND owner.google_sub IS NOT NULL;

  IF recipient IS NOT NULL AND recipient <> NEW.author_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, notification_type, post_id)
    VALUES (recipient, NEW.author_id, 'reply', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_reply_notification_trigger ON public.posts;
CREATE TRIGGER create_reply_notification_trigger
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.create_reply_notification();

CREATE OR REPLACE FUNCTION public.create_reaction_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recipient BIGINT;
BEGIN
  -- 同じリアクションの更新では通知を重ねて作らない。
  IF TG_OP = 'UPDATE' AND OLD.reaction_type_id IS NOT DISTINCT FROM NEW.reaction_type_id THEN
    RETURN NEW;
  END IF;

  SELECT post.author_id INTO recipient
  FROM public.posts AS post
  JOIN public.users AS owner ON owner.id = post.author_id
  WHERE post.id = NEW.post_id AND owner.google_sub IS NOT NULL;

  IF recipient IS NOT NULL AND recipient <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, notification_type, post_id)
    VALUES (recipient, NEW.user_id, 'reaction', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_reaction_notification_trigger ON public.post_reactions;
CREATE TRIGGER create_reaction_notification_trigger
AFTER INSERT OR UPDATE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.create_reaction_notification();

COMMIT;
