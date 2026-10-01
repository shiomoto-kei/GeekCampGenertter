import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth/server";

export async function GET() {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("icons")
    .select("id,name,gender,generation,image_path")
    .order("id", { ascending: true });
  if (error) {
    return NextResponse.json({ error: "アイコン一覧を取得できませんでした。DBの追加設定を確認してください。" }, { status: 503 });
  }

  return NextResponse.json({ icons: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
