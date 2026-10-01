import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const rawIds = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = [...new Set(rawIds.split(",").map((value) => Number(value)).filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (ids.length === 0 || ids.length > 50) {
    return NextResponse.json({ error: "ユーザーIDが不正です。" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await admin.from("users").select("id,name").in("id", ids);
  if (error) {
    return NextResponse.json({ error: "ユーザー名を取得できませんでした。" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ users: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
