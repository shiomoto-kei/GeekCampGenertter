-- db_add_table.sql の実行後に適用する。アイコンは公開読み取りのみ許可する。
ALTER TABLE public.icons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.icons FROM anon, authenticated;
GRANT SELECT ON TABLE public.icons TO anon, authenticated;

CREATE POLICY "read icons" ON public.icons
  FOR SELECT TO anon, authenticated USING (true);
