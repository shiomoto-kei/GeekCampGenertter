import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, UUID_PATTERN, getAdminClient, getGoogleSub } from "@/lib/auth/server";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 403, headers: noStore });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "JSON形式で送信してください。" }, { status: 415, headers: noStore });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503, headers: noStore });
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const googleSub = accessToken ? await getGoogleSub(accessToken) : null;
  const guestUuid = request.cookies.get(GUEST_COOKIE)?.value;
  const identityColumn = googleSub ? "google_sub" : "guest_uuid";
  const identity = googleSub ?? (guestUuid && UUID_PATTERN.test(guestUuid) ? guestUuid : null);
  if (!identity) {
    return NextResponse.json({ error: "ログイン情報を確認できませんでした。ログインし直してください。" }, { status: 401, headers: noStore });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "投稿内容を読み取れませんでした。" }, { status: 400, headers: noStore });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "投稿内容が不正です。" }, { status: 400, headers: noStore });
  }

  const input = body as Record<string, unknown>;
  const styleId = typeof input.styleId === "number" ? input.styleId : Number.NaN;
  const originalText = typeof input.originalText === "string" ? input.originalText.trim() : "";
  const convertedText = typeof input.convertedText === "string" ? input.convertedText.trim() : "";
  const parentPostId = input.parentPostId == null
    ? null
    : typeof input.parentPostId === "number" ? input.parentPostId : Number.NaN;
  const hashtags = Array.isArray(input.hashtags)
    ? [...new Set(input.hashtags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.replace(/^#+/, "").trim()).filter(Boolean))]
    : [];
  const imagePaths = Array.isArray(input.imagePaths) && input.imagePaths.every((path): path is string => typeof path === "string")
    ? input.imagePaths
    : null;

  if (!Number.isSafeInteger(styleId) || Number(styleId) <= 0 || !originalText || !convertedText || originalText.length > 1000 || convertedText.length > 4000) {
    return NextResponse.json({ error: "スタイルと投稿本文を確認してください。" }, { status: 400, headers: noStore });
  }
  if (parentPostId !== null && (!Number.isSafeInteger(parentPostId) || Number(parentPostId) <= 0)) {
    return NextResponse.json({ error: "返信先の投稿が不正です。" }, { status: 400, headers: noStore });
  }
  if (hashtags.length > 20 || hashtags.some((tag) => tag.length > 100) || !imagePaths || imagePaths.length > 4 || imagePaths.some((path) => path.length > 500)) {
    return NextResponse.json({ error: "ハッシュタグまたは画像の数・形式を確認してください。" }, { status: 400, headers: noStore });
  }

  const { data: author, error: authorError } = await admin
    .from("users")
    .select("id")
    .eq(identityColumn, identity)
    .maybeSingle();
  if (authorError || !author) {
    return NextResponse.json({ error: "プロフィールが見つかりません。初期設定を完了してください。" }, { status: 403, headers: noStore });
  }

  const { data: style, error: styleError } = await admin.from("style_profiles").select("id").eq("id", styleId).maybeSingle();
  if (styleError || !style) {
    return NextResponse.json({ error: "選択したスタイルが見つかりません。" }, { status: 400, headers: noStore });
  }

  if (parentPostId !== null) {
    const { data: parent, error: parentError } = await admin.from("posts").select("id,reply_count").eq("id", parentPostId).maybeSingle();
    if (parentError || !parent) {
      return NextResponse.json({ error: "返信先の投稿が見つかりません。" }, { status: 404, headers: noStore });
    }
  }

  const { data: post, error: postError } = await admin.from("posts").insert({
    parent_post_id: parentPostId,
    author_id: author.id,
    original_text: originalText,
    converted_text: convertedText,
    style_type_id: styleId,
  }).select("id").single();
  if (postError || !post) {
    return NextResponse.json({ error: "投稿を保存できませんでした。" }, { status: 503, headers: noStore });
  }

  if (imagePaths.length > 0) {
    const { error } = await admin.from("images_paths").insert(imagePaths.map((path) => ({ post_id: post.id, path })));
    if (error) {
      await admin.from("posts").delete().eq("id", post.id);
      return NextResponse.json({ error: "投稿画像を保存できませんでした。" }, { status: 503, headers: noStore });
    }
  }

  if (hashtags.length > 0) {
    const { data: hashtagRows, error: hashtagError } = await admin.from("hashtags")
      .upsert(hashtags.map((tag_name) => ({ tag_name })), { onConflict: "tag_name", ignoreDuplicates: true })
      .select("id,tag_name");
    let resolvedHashtags = hashtagRows ?? [];
    if (!hashtagError && resolvedHashtags.length !== hashtags.length) {
      const { data } = await admin.from("hashtags").select("id,tag_name").in("tag_name", hashtags);
      resolvedHashtags = data ?? [];
    }
    if (hashtagError || resolvedHashtags.length !== hashtags.length) {
      await admin.from("posts").delete().eq("id", post.id);
      return NextResponse.json({ error: "ハッシュタグを保存できませんでした。" }, { status: 503, headers: noStore });
    }

    const { error } = await admin.from("post_hashtags").insert(resolvedHashtags.map(({ id }) => ({ post_id: post.id, hashtag_id: id })));
    if (error) {
      await admin.from("posts").delete().eq("id", post.id);
      return NextResponse.json({ error: "ハッシュタグを投稿に追加できませんでした。" }, { status: 503, headers: noStore });
    }
  }

  if (parentPostId !== null) {
    const { data: parent } = await admin.from("posts").select("reply_count").eq("id", parentPostId).maybeSingle();
    if (parent) await admin.from("posts").update({ reply_count: parent.reply_count + 1 }).eq("id", parentPostId);
  }

  return NextResponse.json({ postId: post.id, authorId: author.id }, { status: 201, headers: noStore });
}
