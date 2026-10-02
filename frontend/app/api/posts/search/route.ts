import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth/server";

const PAGE_SIZE = 20;
const noStore = { "Cache-Control": "no-store" };
const postColumns = "id, author_id, original_text, converted_text, like_count, laugh_count, sad_count, reply_count, created_at, style_profile:style_profiles(name), images_paths(path), post_hashtags(hashtag:hashtags(tag_name))";

export async function GET(request: NextRequest) {
  const term = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
  const tab = request.nextUrl.searchParams.get("tab");
  if (!term || term.length > 100 || !Number.isSafeInteger(page) || page < 0 || page > 100_000 || (tab !== "new" && tab !== "recommend")) {
    return NextResponse.json({ error: "検索条件が不正です。" }, { status: 400, headers: noStore });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバー側のSupabaseキーが未設定です。" }, { status: 503, headers: noStore });
  }

  const tag = term.startsWith("#") ? term.slice(1).trim().replace(/^#+/, "") : null;
  const account = term.startsWith("@") ? term.slice(1).trim() : null;
  if (tag === "" || account === "") {
    return NextResponse.json({ posts: [], hasMore: false }, { headers: noStore });
  }

  const filterRelation = tag !== null
    ? ", matching_tag:post_hashtags!inner(hashtags!inner(tag_name))"
    : account !== null
      ? ", matching_author:users!posts_author_id_fkey!inner(id,name)"
      : "";
  let query = admin.from("posts")
    .select(`${postColumns}${filterRelation}`)
    .is("parent_post_id", null);

  if (tab === "recommend") {
    query = query.order("reaction_total", { ascending: false });
  }
  query = query.order("created_at", { ascending: false }).order("id", { ascending: false });

  if (tag !== null) {
    const safeTag = tag.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("matching_tag.hashtags.tag_name", safeTag);
  } else if (account !== null) {
    if (/^\d+$/.test(account) && Number.isSafeInteger(Number(account))) {
      query = query.or(`id.eq.${Number(account)},name.ilike.%${account}%`, { referencedTable: "matching_author" });
    } else {
      const safeAccount = account.replace(/[\\%_]/g, "\\$&");
      query = query.ilike("matching_author.name", `%${safeAccount}%`);
    }
  } else {
    const safeTerm = term.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    query = query.or(`converted_text.ilike."%${safeTerm}%",original_text.ilike."%${safeTerm}%"`);
  }

  const offset = page * PAGE_SIZE;
  const { data, error } = await query.range(offset, offset + PAGE_SIZE);
  if (error) {
    return NextResponse.json({ error: "検索結果を取得できませんでした。" }, { status: 503, headers: noStore });
  }

  return NextResponse.json({ posts: (data ?? []).slice(0, PAGE_SIZE), hasMore: (data?.length ?? 0) > PAGE_SIZE }, { headers: noStore });
}
