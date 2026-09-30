-- db_setup.sql を実行した後に、正しい Supabase プロジェクトで適用する追加設定。
-- 既存データは削除しない。適用するとブラウザからの直接書き込みは拒否される。
-- Home / 通知で直接 Supabase を呼ぶ実装がある場合は、適用前に担当者と確認すること。

BEGIN;

ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.style_profiles, public.users, public.reaction_types, public.posts,
  public.post_reactions, public.images_paths, public.hashtags,
  public.post_hashtags, public.notifications
FROM anon, authenticated;

-- タイムライン表示に必要な公開情報だけを読み取り可能にする。
GRANT SELECT ON TABLE
  public.style_profiles, public.reaction_types, public.posts,
  public.images_paths, public.hashtags, public.post_hashtags
TO anon, authenticated;

-- users の google_sub / guest_uuid は公開しない。
GRANT SELECT (id, name, default_style_id) ON TABLE public.users TO anon, authenticated;

CREATE POLICY "read style profiles" ON public.style_profiles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read public user profiles" ON public.users
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read reaction types" ON public.reaction_types
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read posts" ON public.posts
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read image paths" ON public.images_paths
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read hashtags" ON public.hashtags
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read post hashtags" ON public.post_hashtags
  FOR SELECT TO anon, authenticated USING (true);

-- post_reactions と notifications は、現在はサーバー側 API 以外から読ませない。
-- 投稿やリアクションの書き込みもサーバー側 API で本人確認してから行う。

COMMIT;
