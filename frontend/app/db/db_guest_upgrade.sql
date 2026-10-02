-- db_setup.sql / db_reactions.sql / db_notifications.sql の後に SQL Editor で実行する。
-- API が確認した Google sub と HttpOnly ゲスト Cookie だけを受け取り、
-- 一つのトランザクション内でゲストのプロフィールと関連データを移す。

BEGIN;

CREATE OR REPLACE FUNCTION public.merge_guest_into_google(
  p_guest_uuid UUID,
  p_google_sub TEXT
)
RETURNS TABLE (guest_user_id BIGINT, google_user_id BIGINT, google_profile_existed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_guest_id BIGINT;
  v_google_id BIGINT;
  v_reacted_post_ids BIGINT[];
BEGIN
  IF p_guest_uuid IS NULL OR NULLIF(btrim(p_google_sub), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid identities';
  END IF;

  SELECT id INTO v_guest_id
  FROM public.users
  WHERE guest_uuid = p_guest_uuid AND google_sub IS NULL
  FOR UPDATE;
  IF v_guest_id IS NULL THEN
    RAISE EXCEPTION 'Guest profile not found';
  END IF;

  SELECT id INTO v_google_id
  FROM public.users
  WHERE google_sub = p_google_sub
  FOR UPDATE;

  IF v_google_id IS NULL THEN
    -- users_identity_check を一回の UPDATE で満たし、投稿等の参照先 ID は変えない。
    UPDATE public.users
    SET google_sub = p_google_sub, guest_uuid = NULL
    WHERE id = v_guest_id;
    RETURN QUERY SELECT v_guest_id, v_guest_id, FALSE;
    RETURN;
  END IF;

  -- 既存 Google プロフィールの名前・年代・アイコンは維持する。
  -- 競合したリアクションは Google 側を残し、ゲスト側だけを削除する。
  SELECT array_agg(post_id) INTO v_reacted_post_ids
  FROM public.post_reactions WHERE user_id = v_guest_id;

  -- 通常のリアクション更新と同じ投稿行ロックで直列化する。
  IF v_reacted_post_ids IS NOT NULL THEN
    PERFORM 1 FROM public.posts
    WHERE id = ANY(v_reacted_post_ids)
    ORDER BY id FOR UPDATE;
  END IF;

  DELETE FROM public.post_reactions AS guest_reaction
  USING public.post_reactions AS google_reaction
  WHERE guest_reaction.user_id = v_guest_id
    AND google_reaction.user_id = v_google_id
    AND google_reaction.post_id = guest_reaction.post_id;

  UPDATE public.post_reactions
  SET user_id = v_google_id
  WHERE user_id = v_guest_id;

  UPDATE public.posts
  SET author_id = v_google_id
  WHERE author_id = v_guest_id;

  -- 移行で自分自身への通知になるものは消し、それ以外の通知は引き継ぐ。
  DELETE FROM public.notifications
  WHERE (recipient_id = v_google_id AND actor_id = v_guest_id)
     OR (recipient_id = v_guest_id AND actor_id = v_google_id);

  UPDATE public.notifications
  SET actor_id = v_google_id
  WHERE actor_id = v_guest_id;

  UPDATE public.notifications
  SET recipient_id = v_google_id
  WHERE recipient_id = v_guest_id;

  -- リアクションの重複削除を反映し、キャッシュされたカウントを実数に合わせる。
  IF v_reacted_post_ids IS NOT NULL THEN
    UPDATE public.posts AS post
    SET like_count = counts.like_count,
        laugh_count = counts.laugh_count,
        sad_count = counts.sad_count
    FROM (
      SELECT reaction.post_id,
        count(*) FILTER (WHERE reaction_type.code = 'like')::INTEGER AS like_count,
        count(*) FILTER (WHERE reaction_type.code = 'laugh')::INTEGER AS laugh_count,
        count(*) FILTER (WHERE reaction_type.code = 'sad')::INTEGER AS sad_count
      FROM public.post_reactions AS reaction
      JOIN public.reaction_types AS reaction_type ON reaction_type.id = reaction.reaction_type_id
      WHERE reaction.post_id = ANY(v_reacted_post_ids)
      GROUP BY reaction.post_id
    ) AS counts
    WHERE post.id = counts.post_id;
  END IF;

  DELETE FROM public.users WHERE id = v_guest_id;
  RETURN QUERY SELECT v_guest_id, v_google_id, TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_guest_into_google(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_guest_into_google(UUID, TEXT)
  TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
