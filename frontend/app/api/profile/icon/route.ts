import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, UUID_PATTERN, getAdminClient, getGoogleSub } from "@/lib/auth/server";

const noStore = { "Cache-Control": "no-store" };

export async function PATCH(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 403, headers: noStore });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "JSON形式で送信してください。" }, { status: 415, headers: noStore });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "入力内容を読み取れませんでした。" }, { status: 400, headers: noStore });
  }
  const iconId = body && typeof body === "object" ? (body as { iconId?: unknown }).iconId : null;
  if (typeof iconId !== "number" || !Number.isSafeInteger(iconId) || iconId <= 0) {
    return NextResponse.json({ error: "アイコンを選び直してください。" }, { status: 400, headers: noStore });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503, headers: noStore });
  }
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const googleSub = accessToken ? await getGoogleSub(accessToken) : null;
  if (authorization && !googleSub) {
    return NextResponse.json({ error: "Googleログインを確認できませんでした。" }, { status: 401, headers: noStore });
  }
  const guestUuid = request.cookies.get(GUEST_COOKIE)?.value;
  const identityColumn = googleSub ? "google_sub" : "guest_uuid";
  const identity = googleSub ?? (guestUuid && UUID_PATTERN.test(guestUuid) ? guestUuid : null);
  if (!identity) {
    return NextResponse.json({ error: "ログイン情報を確認できませんでした。" }, { status: 401, headers: noStore });
  }

  const { data: icon, error: iconError } = await admin.from("icons").select("id,image_path").eq("id", iconId).maybeSingle();
  if (iconError || !icon) {
    return NextResponse.json({ error: "選択したアイコンが見つかりません。" }, { status: 400, headers: noStore });
  }

  const { data: user, error: updateError } = await admin.from("users")
    .update({ icon_id: icon.id })
    .eq(identityColumn, identity)
    .select("id")
    .maybeSingle();
  if (updateError) {
    return NextResponse.json({ error: "アイコンを保存できませんでした。" }, { status: 503, headers: noStore });
  }
  if (!user) {
    return NextResponse.json({ error: "プロフィールが見つかりません。" }, { status: 404, headers: noStore });
  }

  return NextResponse.json({ iconId: icon.id, imagePath: icon.image_path }, { headers: noStore });
}
