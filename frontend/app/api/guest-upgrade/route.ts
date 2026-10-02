import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, UUID_PATTERN, getAdminClient, getGoogleSub } from "@/lib/auth/server";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "このリクエストは許可されていません。" }, { status: 403, headers: noStore });
  }

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const googleSub = token ? await getGoogleSub(token) : null;
  if (!googleSub) {
    return NextResponse.json({ error: "Googleログインを確認できませんでした。" }, { status: 401, headers: noStore });
  }

  const guestUuid = request.cookies.get(GUEST_COOKIE)?.value;
  if (!guestUuid || !UUID_PATTERN.test(guestUuid)) {
    return NextResponse.json({ error: "引き継ぐゲスト情報が見つかりません。" }, { status: 404, headers: noStore });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503, headers: noStore });
  }

  const { data, error } = await admin.rpc("merge_guest_into_google", {
    p_guest_uuid: guestUuid,
    p_google_sub: googleSub,
  }).single();
  if (error || !data) {
    return NextResponse.json({ error: "引き継ぎに失敗しました。DBの移行設定を確認して再試行してください。" }, { status: 503, headers: noStore });
  }
  const merged = data as { guest_user_id: number; google_user_id: number; google_profile_existed: boolean };

  const response = NextResponse.json({
    guestUserId: merged.guest_user_id,
    googleUserId: merged.google_user_id,
    googleProfileExisted: merged.google_profile_existed,
  }, { headers: noStore });
  response.cookies.delete(GUEST_COOKIE);
  return response;
}
