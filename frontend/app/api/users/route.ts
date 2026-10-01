import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth/server";

type UserRow = { id: number; name: string; icon_id: number | null };

async function withIconPaths(admin: NonNullable<ReturnType<typeof getAdminClient>>, users: UserRow[]) {
  const iconIds = [...new Set(users.map((user) => user.icon_id).filter((id): id is number => id !== null))];
  if (iconIds.length === 0) return users.map(({ id, name }) => ({ id, name, iconPath: null }));

  const { data, error } = await admin.from("icons").select("id,image_path").in("id", iconIds);
  if (error) throw error;
  const pathById = new Map((data ?? []).map((icon) => [icon.id, icon.image_path]));
  return users.map(({ id, name, icon_id }) => ({ id, name, iconPath: icon_id === null ? null : pathById.get(icon_id) ?? null }));
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q");
  if (rawQuery !== null) {
    const query = rawQuery.trim();
    if (!query || query.length > 100) {
      return NextResponse.json({ users: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const safeQuery = query.replace(/[\\%_]/g, "\\$&");
    const { data: nameMatches, error } = await admin.from("users").select("id,name,icon_id").ilike("name", `%${safeQuery}%`).limit(50);
    if (error) {
      return NextResponse.json({ error: "ユーザーを検索できませんでした。" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const usersById = new Map((nameMatches ?? []).map((user) => [user.id, user]));
    if (/^\d+$/.test(query)) {
      const id = Number(query);
      if (Number.isSafeInteger(id) && id > 0) {
        const { data: idMatch } = await admin.from("users").select("id,name,icon_id").eq("id", id).maybeSingle();
        if (idMatch) usersById.set(idMatch.id, idMatch);
      }
    }

    try {
      return NextResponse.json({ users: await withIconPaths(admin, [...usersById.values()]) }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ error: "アイコン情報を取得できませんでした。" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  }

  const rawIds = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = [...new Set(rawIds.split(",").map((value) => Number(value)).filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (ids.length === 0 || ids.length > 50) {
    return NextResponse.json({ error: "ユーザーIDが不正です。" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await admin.from("users").select("id,name,icon_id").in("id", ids);
  if (error) {
    return NextResponse.json({ error: "ユーザー名を取得できませんでした。" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    return NextResponse.json({ users: await withIconPaths(admin, data ?? []) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "アイコン情報を取得できませんでした。" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
