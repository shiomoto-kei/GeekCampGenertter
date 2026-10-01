import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, UUID_PATTERN, getAdminClient, getGoogleSub } from "@/lib/auth/server";

const noStore = { "Cache-Control": "no-store" };
type ReactionCode = "like" | "laugh" | "sad";

async function getActor(request: NextRequest) {
  const admin = getAdminClient();
  if (!admin) return { error: "サーバー側のSupabaseキーが未設定です。", status: 503 } as const;

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
  const googleSub = accessToken ? await getGoogleSub(accessToken) : null;
  const guestUuid = request.cookies.get(GUEST_COOKIE)?.value;
  const identityColumn = googleSub ? "google_sub" : "guest_uuid";
  const identity = googleSub ?? (guestUuid && UUID_PATTERN.test(guestUuid) ? guestUuid : null);
  if (!identity) return { error: "ログイン情報を確認できませんでした。", status: 401 } as const;

  const { data: user, error } = await admin.from("users").select("id").eq(identityColumn, identity).maybeSingle();
  if (error) return { error: "ユーザー情報を確認できませんでした。", status: 503 } as const;
  if (!user) return { error: "プロフィール設定を完了してください。", status: 403 } as const;
  return { admin, userId: user.id } as const;
}

export async function GET(request: NextRequest) {
  const actor = await getActor(request);
  if ("error" in actor) {
    return NextResponse.json({ error: actor.error }, { status: actor.status, headers: noStore });
  }

  const rawIds = request.nextUrl.searchParams.get("postIds") ?? "";
  const postIds = [...new Set(rawIds.split(",").map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (postIds.length === 0 || postIds.length > 50) {
    return NextResponse.json({ error: "投稿IDが不正です。" }, { status: 400, headers: noStore });
  }

  const { data: reactions, error } = await actor.admin.from("post_reactions")
    .select("post_id,reaction_type_id")
    .eq("user_id", actor.userId)
    .in("post_id", postIds);
  if (error) return NextResponse.json({ error: "リアクションを取得できませんでした。" }, { status: 503, headers: noStore });

  const typeIds = [...new Set((reactions ?? []).map((reaction) => reaction.reaction_type_id))];
  const { data: types, error: typeError } = typeIds.length
    ? await actor.admin.from("reaction_types").select("id,code").in("id", typeIds)
    : { data: [], error: null };
  if (typeError) return NextResponse.json({ error: "リアクションを取得できませんでした。" }, { status: 503, headers: noStore });

  const codeById = new Map((types ?? []).map((type) => [type.id, type.code]));
  return NextResponse.json({
    reactions: (reactions ?? []).flatMap((reaction) => {
      const code = codeById.get(reaction.reaction_type_id);
      return code === "like" || code === "laugh" || code === "sad"
        ? [{ post_id: reaction.post_id, reaction_code: code }]
        : [];
    }),
  }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 403, headers: noStore });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "JSON形式で送信してください。" }, { status: 415, headers: noStore });
  }

  const actor = await getActor(request);
  if ("error" in actor) {
    return NextResponse.json({ error: actor.error }, { status: actor.status, headers: noStore });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リアクション内容を読み取れませんでした。" }, { status: 400, headers: noStore });
  }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const postId = input.postId;
  const code = input.code;
  if (typeof postId !== "number" || !Number.isSafeInteger(postId) || postId <= 0 ||
      (code !== "like" && code !== "laugh" && code !== "sad")) {
    return NextResponse.json({ error: "リアクション内容が不正です。" }, { status: 400, headers: noStore });
  }

  const { data: count, error } = await actor.admin.rpc("toggle_post_reaction_for_user", {
    p_post_id: postId,
    p_user_id: actor.userId,
    p_reaction_code: code as ReactionCode,
  });
  if (error) return NextResponse.json({ error: "リアクションを保存できませんでした。" }, { status: 503, headers: noStore });
  return NextResponse.json({ count }, { headers: noStore });
}
