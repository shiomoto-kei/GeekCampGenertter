import { createClient } from "@supabase/supabase-js";

export const GUEST_COOKIE = "genertter_guest_uuid";
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getGoogleSub(accessToken: string) {
  const supabase = getPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) return null;

  const identity = data.user?.identities?.find((item) => item.provider === "google");
  const providerId = (identity as { provider_id?: string } | undefined)?.provider_id;
  return providerId ?? (typeof identity?.identity_data?.sub === "string" ? identity.identity_data.sub : null);
}
