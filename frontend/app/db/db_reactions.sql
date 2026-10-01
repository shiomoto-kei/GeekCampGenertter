-- db_setup.sql の後に実行する。
-- アプリ側APIが本人確認した public.users.id を指定してリアクションを更新する。

BEGIN;

CREATE OR REPLACE FUNCTION public.toggle_post_reaction_for_user(
  p_post_id BIGINT,
  p_user_id BIGINT,
  p_reaction_code TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_type_id BIGINT;
  previous_code TEXT;
  selected_count INTEGER;
BEGIN
  SELECT id INTO selected_type_id
  FROM public.reaction_types
  WHERE code = p_reaction_code
    AND code IN ('like', 'laugh', 'sad');

  IF selected_type_id IS NULL THEN
    RAISE EXCEPTION 'Invalid reaction type';
  END IF;

  -- 同一投稿への同時更新を直列化し、カウントのずれを防ぐ。
  PERFORM 1 FROM public.posts WHERE id = p_post_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  SELECT types.code INTO previous_code
  FROM public.post_reactions AS reactions
  JOIN public.reaction_types AS types ON types.id = reactions.reaction_type_id
  WHERE reactions.post_id = p_post_id AND reactions.user_id = p_user_id
  FOR UPDATE OF reactions;

  IF previous_code = p_reaction_code THEN
    DELETE FROM public.post_reactions
    WHERE post_id = p_post_id AND user_id = p_user_id;
  ELSIF previous_code IS NULL THEN
    INSERT INTO public.post_reactions (post_id, user_id, reaction_type_id)
    VALUES (p_post_id, p_user_id, selected_type_id);
  ELSE
    UPDATE public.post_reactions
    SET reaction_type_id = selected_type_id
    WHERE post_id = p_post_id AND user_id = p_user_id;
  END IF;

  UPDATE public.posts AS post
  SET like_count = counts.like_count,
      laugh_count = counts.laugh_count,
      sad_count = counts.sad_count
  FROM (
    SELECT
      count(*) FILTER (WHERE types.code = 'like')::INTEGER AS like_count,
      count(*) FILTER (WHERE types.code = 'laugh')::INTEGER AS laugh_count,
      count(*) FILTER (WHERE types.code = 'sad')::INTEGER AS sad_count
    FROM public.post_reactions AS reactions
    JOIN public.reaction_types AS types ON types.id = reactions.reaction_type_id
    WHERE reactions.post_id = p_post_id
  ) AS counts
  WHERE post.id = p_post_id;

  SELECT count(*)::INTEGER INTO selected_count
  FROM public.post_reactions AS reactions
  JOIN public.reaction_types AS types ON types.id = reactions.reaction_type_id
  WHERE reactions.post_id = p_post_id AND types.code = p_reaction_code;

  RETURN selected_count;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_post_reaction_for_user(BIGINT, BIGINT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_post_reaction_for_user(BIGINT, BIGINT, TEXT)
  TO service_role;

COMMIT;
