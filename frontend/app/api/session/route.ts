import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, UUID_PATTERN, getAdminClient, getGoogleSub } from "@/lib/auth/server";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");
  if (mode !== "google" && mode !== "guest") {
    return NextResponse.json({ error: "ログイン方法が不正です。" }, { status: 400, headers: noStore });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503, headers: noStore });
  }

  let column: "google_sub" | "guest_uuid";
  let identity: string;

  if (mode === "google") {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) {
      return NextResponse.json({ error: "Googleログインが必要です。" }, { status: 401, headers: noStore });
    }

    const googleSub = await getGoogleSub(accessToken);
    if (!googleSub) {
      return NextResponse.json({ error: "Googleログインを確認できませんでした。" }, { status: 401, headers: noStore });
    }
    column = "google_sub";
    identity = googleSub;
  } else {
    const guestUuid = request.cookies.get(GUEST_COOKIE)?.value;
    if (!guestUuid || !UUID_PATTERN.test(guestUuid)) {
      return NextResponse.json({ exists: false }, { headers: noStore });
    }
    column = "guest_uuid";
    identity = guestUuid;
  }

  const { data, error } = await admin
    .from("users")
    .select("id,name,default_style_id,icon_id")
    .eq(column, identity)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "プロフィールを確認できませんでした。" }, { status: 503, headers: noStore });
  }

  return NextResponse.json(data ? { exists: true, profile: data } : { exists: false }, { headers: noStore });
}
