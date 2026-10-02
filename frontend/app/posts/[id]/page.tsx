"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Header from "../../components/header";
import Footer from "../../components/footer";
import PostCard from "../../components/post-card";
import { supabase } from "@/lib/supabase/client";
import { iconImageUrl } from "@/lib/icons";

type ReactionCode = "like" | "laugh" | "sad";
type Author = { id: number; name: string; iconPath: string | null };
type StyleRelation = { name: string } | { name: string }[] | null;
type PostRow = {
  id: number;
  parent_post_id: number | null;
  author_id: number;
  original_text: string;
  converted_text: string;
  like_count: number;
  laugh_count: number;
  sad_count: number;
  reply_count: number;
  created_at: string;
  style_profile: StyleRelation;
  images_paths: { path: string }[] | null;
  post_hashtags: { hashtag: { tag_name: string } | { tag_name: string }[] | null }[] | null;
};
type PostView = PostRow & { author: Author | null; styleName: string | null; images: string[]; tags: string[] };

const postColumns = "id,parent_post_id,author_id,original_text,converted_text,like_count,laugh_count,sad_count,reply_count,created_at,style_profile:style_profiles(name),images_paths(path),post_hashtags(hashtag:hashtags(tag_name))";

function styleNameOf(style: StyleRelation) {
  return Array.isArray(style) ? style[0]?.name ?? null : style?.name ?? null;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function ReturnLink() {
  const from = useSearchParams().get("from");
  const destination = from === "notice" ? "/notice" : from === "mypage" ? "/mypage" : "/home";
  const label = from === "notice" ? "通知" : from === "mypage" ? "マイページ" : "ホーム";
  return <Link href={destination} style={{ color: "#258a48", fontSize: 13, textDecoration: "none" }}>← {label}へ</Link>;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const [post, setPost] = useState<PostView | null>(null);
  const [parent, setParent] = useState<PostView | null>(null);
  const [replies, setReplies] = useState<PostView[]>([]);
  const [selectedReaction, setSelectedReaction] = useState<ReactionCode | null>(null);
  const [pendingReaction, setPendingReaction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPost() {
      setLoading(true);
      setErrorMessage("");
      setPost(null);
      setParent(null);
      setReplies([]);

      if (!Number.isSafeInteger(postId) || postId <= 0) {
        setErrorMessage("投稿が見つかりません。");
        setLoading(false);
        return;
      }

      try {
        const { data: target, error: targetError } = await supabase
          .from("posts").select(postColumns).eq("id", postId).maybeSingle();
        if (targetError) throw targetError;
        if (!target) throw new Error("投稿が見つかりません。削除された可能性があります。");

        const targetRow = target as PostRow;
        let parentRow: PostRow | null = null;
        let replyRows: PostRow[] = [];
        if (targetRow.parent_post_id !== null) {
          const { data, error } = await supabase.from("posts").select(postColumns)
            .eq("id", targetRow.parent_post_id).maybeSingle();
          if (error) throw error;
          parentRow = data as PostRow | null;
        } else {
          const { data, error } = await supabase.from("posts").select(postColumns)
            .eq("parent_post_id", postId).order("created_at", { ascending: true }).limit(100);
          if (error) throw error;
          replyRows = (data ?? []) as PostRow[];
        }

        const authorIds = [...new Set([targetRow, ...(parentRow ? [parentRow] : []), ...replyRows].map((item) => item.author_id))];
        const authorById = new Map<number, Author>();
        for (let index = 0; index < authorIds.length; index += 50) {
          const response = await fetch(`/api/users?ids=${authorIds.slice(index, index + 50).join(",")}`, { cache: "no-store" });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? "投稿者を取得できませんでした。");
          for (const user of (result.users ?? []) as Author[]) authorById.set(user.id, user);
        }

        function toView(row: PostRow): PostView {
          return {
            ...row,
            author: authorById.get(row.author_id) ?? null,
            styleName: styleNameOf(row.style_profile),
            images: (row.images_paths ?? []).map(({ path }) =>
              /^https?:\/\//i.test(path) ? path : supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl,
            ),
            tags: (row.post_hashtags ?? []).flatMap(({ hashtag }) => {
              const tag = Array.isArray(hashtag) ? hashtag[0] : hashtag;
              return tag?.tag_name ? [tag.tag_name] : [];
            }),
          };
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const reactionResponse = await fetch(`/api/reactions?postIds=${postId}`, {
          headers: sessionData.session ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {},
          cache: "no-store",
        });
        const reactionResult = reactionResponse.ok ? await reactionResponse.json() : { reactions: [] };
        const reaction = reactionResult.reactions?.[0]?.reaction_code;

        if (active) {
          setPost(toView(targetRow));
          setParent(parentRow ? toView(parentRow) : null);
          setReplies(replyRows.map(toView));
          setSelectedReaction(reaction === "like" || reaction === "laugh" || reaction === "sad" ? reaction : null);
        }
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : "投稿を取得できませんでした。");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPost();
    return () => { active = false; };
  }, [postId]);

  async function toggleReaction(code: ReactionCode) {
    if (!post || pendingReaction) return;
    setPendingReaction(true);
    setErrorMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
        },
        body: JSON.stringify({ postId: post.id, code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "リアクションを保存できませんでした。");

      const previous = selectedReaction;
      setPost((current) => current ? {
        ...current,
        like_count: code === "like" ? Number(result.count) : current.like_count - Number(previous === "like"),
        laugh_count: code === "laugh" ? Number(result.count) : current.laugh_count - Number(previous === "laugh"),
        sad_count: code === "sad" ? Number(result.count) : current.sad_count - Number(previous === "sad"),
      } : null);
      setSelectedReaction(previous === code ? null : code);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "リアクションを保存できませんでした。");
    } finally {
      setPendingReaction(false);
    }
  }

  return (
    <div className="detail-page">
      <Header />
      <main className="detail-main">
        <Suspense fallback={<Link href="/home" style={{ color: "#258a48", fontSize: 13, textDecoration: "none" }}>← ホームへ</Link>}>
          <ReturnLink />
        </Suspense>
        <h1>投稿</h1>
        {loading && <p className="status">投稿を読み込み中…</p>}
        {errorMessage && <p className="status error" role="alert">{errorMessage}</p>}
        {parent && <section className="parent-section" aria-label="返信元の投稿">
          <h2>返信元の投稿</h2>
          <PostCard
            userName={parent.author?.name ?? "ユーザー"}
            userId={parent.author_id}
            iconUrl={iconImageUrl(parent.author?.iconPath)}
            styleName={parent.styleName}
            postHref={`/posts/${parent.id}`}
            text={parent.converted_text}
            originalText={parent.original_text}
            images={parent.images}
            tags={parent.tags}
          />
        </section>}
        {post && <section className="target-section" aria-label="対象の投稿">
          {post.parent_post_id !== null && <h2>返信</h2>}
          <PostCard
            userName={post.author?.name ?? "ユーザー"}
            userId={post.author_id}
            iconUrl={iconImageUrl(post.author?.iconPath)}
            styleName={post.styleName}
            text={post.converted_text}
            originalText={post.original_text}
            images={post.images}
            tags={post.tags}
            replyCount={post.reply_count}
            likeCount={post.like_count}
            laughCount={post.laugh_count}
            sadCount={post.sad_count}
            selectedReaction={selectedReaction}
            onReact={(code) => void toggleReaction(code)}
            pendingReaction={pendingReaction}
            onToggleReplies={post.parent_post_id === null ? () => document.getElementById("post-replies")?.scrollIntoView({ behavior: "smooth" }) : undefined}
          />
          <time className="post-date" dateTime={post.created_at}>{formatDate(post.created_at)}</time>
        </section>}
        {post?.parent_post_id === null && <section className="replies-section" id="post-replies" aria-label="返信一覧">
          <h2>返信 {post.reply_count}件</h2>
          {replies.length === 0 && <p className="status">返信はまだありません。</p>}
          {replies.map((reply) => <div className="reply" key={reply.id}>
            <Link href={`/posts/${reply.id}`} className="reply-link">
              <strong>{reply.author?.name ?? "ユーザー"}</strong>
              {reply.styleName && <small className="reply-style">{reply.styleName}</small>}
              <span>{reply.converted_text}</span>
              <time dateTime={reply.created_at}>{formatDate(reply.created_at)}</time>
            </Link>
          </div>)}
        </section>}
      </main>
      <Footer />
      <style jsx>{`
        .detail-page { width: 100%; max-width: 430px; min-height: 100dvh; margin: 0 auto; background: #fff; }
        .detail-main { padding: 88px 16px 92px; }
        h1 { margin: 14px 0 18px; color: #26342b; font-size: 20px; }
        h2 { margin: 16px 0 8px; color: #5b6d60; font-size: 14px; }
        .parent-section { margin-bottom: 18px; opacity: .82; }
        .post-date { display: block; margin: 7px 4px 0; color: #758079; font-size: 11px; }
        .replies-section { margin-top: 28px; scroll-margin-top: 84px; }
        .reply { border-bottom: 1px solid #e6ece7; }
        .reply-link { display: flex; flex-direction: column; gap: 6px; padding: 12px 4px; color: #27342b; text-decoration: none; }
        .reply-link:hover { background: #f4f8f5; }
        .reply-link strong { font-size: 13px; }
        .reply-style { align-self: flex-start; padding: 2px 7px; border-radius: 999px; background: #e8f5e8; color: #22743b; font-size: 10px; font-weight: 700; }
        .reply-link span { font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; }
        .reply-link time { color: #7b857e; font-size: 11px; }
        .status { margin: 20px 0; color: #647168; font-size: 13px; }
        .error { color: #b42318; }
      `}</style>
    </div>
  );
}
