import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, UUID_PATTERN, getAdminClient, getGoogleSub, getPublicClient } from "@/lib/auth/server";

export async function GET() {
  const supabase = getPublicClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabaseの接続設定がありません。" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("style_profiles")
    .select("id,name")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "スタイル一覧を取得できませんでした。" }, { status: 503 });
  }

  return NextResponse.json({ styles: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "このリクエストは許可されていません。" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "JSON形式で送信してください。" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "入力内容を読み取れませんでした。" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "入力内容が不正です。" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const styleId = input.styleId;
  const mode = input.mode;

  if (!name || name.length > 50 || typeof styleId !== "number" || !Number.isSafeInteger(styleId) || styleId <= 0 || (mode !== "google" && mode !== "guest")) {
    return NextResponse.json({ error: "名前とスタイルを確認してください。" }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503 });
  }

  const { data: style, error: styleError } = await admin
    .from("style_profiles")
    .select("id")
    .eq("id", styleId)
    .maybeSingle();
  if (styleError || !style) {
    return NextResponse.json({ error: "選択されたスタイルが見つかりません。" }, { status: 400 });
  }

  if (mode === "google") {
    const accessToken = input.accessToken;
    if (typeof accessToken !== "string" || !accessToken) {
      return NextResponse.json({ error: "Googleログインが必要です。" }, { status: 401 });
    }

    const googleSub = await getGoogleSub(accessToken);
    if (!googleSub) {
      return NextResponse.json({ error: "Googleログインを確認できませんでした。" }, { status: 401 });
    }

    const { data, error } = await admin
      .from("users")
      .upsert({ google_sub: googleSub, name, default_style_id: styleId }, { onConflict: "google_sub" })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: "プロフィールを保存できませんでした。" }, { status: 503 });
    }
    return NextResponse.json({ userId: data.id });
  }

  const cookieValue = request.cookies.get(GUEST_COOKIE)?.value;
  const guestUuid = cookieValue && UUID_PATTERN.test(cookieValue) ? cookieValue : randomUUID();
  const { data, error } = await admin
    .from("users")
    .upsert({ guest_uuid: guestUuid, name, default_style_id: styleId }, { onConflict: "guest_uuid" })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "プロフィールを保存できませんでした。" }, { status: 503 });
  }

  const response = NextResponse.json({ userId: data.id });
  response.cookies.set(GUEST_COOKIE, guestUuid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
