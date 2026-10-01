import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getGoogleSub } from "@/lib/auth/server";

const noStore = { "Cache-Control": "no-store" };

async function getRecipient(request: NextRequest) {
  const admin = getAdminClient();
  if (!admin) return { error: "サーバー側のSupabaseキーが未設定です。", status: 503 } as const;

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const googleSub = token ? await getGoogleSub(token) : null;
  if (!googleSub) return { error: "Googleログインが必要です。", status: 401 } as const;

  const { data, error } = await admin.from("users").select("id").eq("google_sub", googleSub).maybeSingle();
  if (error) return { error: "ユーザー情報を確認できませんでした。", status: 503 } as const;
  if (!data) return { error: "プロフィール設定が必要です。", status: 403 } as const;
  return { admin, recipientId: data.id } as const;
}

export async function GET(request: NextRequest) {
  const recipient = await getRecipient(request);
  if ("error" in recipient) {
    return NextResponse.json({ error: recipient.error }, { status: recipient.status, headers: noStore });
  }

  const countOnly = request.nextUrl.searchParams.get("count") === "unread";
  const { count, error: countError } = await recipient.admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", recipient.recipientId)
    .eq("is_read", false);
  if (countError) {
    return NextResponse.json({ error: "通知を取得できませんでした。" }, { status: 503, headers: noStore });
  }
  if (countOnly) return NextResponse.json({ unreadCount: count ?? 0 }, { headers: noStore });

  const { data, error } = await recipient.admin
    .from("notifications")
    .select("id,actor_id,notification_type,post_id,is_read,created_at")
    .eq("recipient_id", recipient.recipientId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: "通知を取得できませんでした。" }, { status: 503, headers: noStore });
  }

  const actorIds = [...new Set((data ?? []).flatMap((item) => item.actor_id == null ? [] : [item.actor_id]))];
  const actorProfiles = new Map<number, { name: string; iconPath: string | null }>();
  if (actorIds.length) {
    const { data: actors, error: actorError } = await recipient.admin.from("users").select("id,name,icon_id").in("id", actorIds);
    if (actorError) return NextResponse.json({ error: "通知を取得できませんでした。" }, { status: 503, headers: noStore });

    const iconIds = [...new Set((actors ?? []).flatMap((actor) => actor.icon_id == null ? [] : [actor.icon_id]))];
    const iconPaths = new Map<number, string>();
    if (iconIds.length) {
      const { data: icons, error: iconError } = await recipient.admin.from("icons").select("id,image_path").in("id", iconIds);
      if (iconError) return NextResponse.json({ error: "通知を取得できませんでした。" }, { status: 503, headers: noStore });
      for (const icon of icons ?? []) iconPaths.set(icon.id, icon.image_path);
    }

    for (const actor of actors ?? []) {
      actorProfiles.set(actor.id, {
        name: actor.name,
        iconPath: actor.icon_id == null ? null : iconPaths.get(actor.icon_id) ?? null,
      });
    }
  }

  return NextResponse.json({
    unreadCount: count ?? 0,
    notifications: (data ?? []).map((item) => ({
      id: item.id,
      actorName: item.actor_id == null ? "ユーザー" : actorProfiles.get(item.actor_id)?.name ?? "ユーザー",
      actorIconPath: item.actor_id == null ? null : actorProfiles.get(item.actor_id)?.iconPath ?? null,
      type: item.notification_type,
      postId: item.post_id,
      isRead: item.is_read,
      createdAt: item.created_at,
    })),
  }, { headers: noStore });
}

export async function PATCH(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 403, headers: noStore });
  }

  const recipient = await getRecipient(request);
  if ("error" in recipient) {
    return NextResponse.json({ error: recipient.error }, { status: recipient.status, headers: noStore });
  }

  const { error } = await recipient.admin.from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", recipient.recipientId)
    .eq("is_read", false);
  if (error) return NextResponse.json({ error: "既読にできませんでした。" }, { status: 503, headers: noStore });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
