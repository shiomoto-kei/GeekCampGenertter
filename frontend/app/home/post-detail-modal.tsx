"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { iconImageUrl } from "@/lib/icons";

type Author = { id: number; name: string; iconPath: string | null };
type Post = {
  id: number;
  author_id: number;
  author: Author | null;
  original_text: string;
  converted_text: string;
  images: string[];
  tags: string[];
  like_count: number;
  laugh_count: number;
  sad_count: number;
  reply_count: number;
  created_at: string;
  styleName: string | null;
};
type Reply = { id: number; author_id: number; converted_text: string; created_at: string; styleName: string | null; author: Author | null };
type ReactionCode = "like" | "laugh" | "sad";
type Props = {
  post: Post | null;
  replies: Reply[];
  isLoadingReplies: boolean;
  replyError: string | null;
  selectedReaction: ReactionCode | null;
  pendingReaction: boolean;
  onReact: (code: ReactionCode) => void;
  onClose: () => void;
  onReply: () => void;
};

function AuthorLine({ author, styleName, isMain = false }: { author: Author | null; styleName: string | null; isMain?: boolean }) {
  const iconUrl = author?.iconPath ? iconImageUrl(author.iconPath) : null;
  return <div className="author-line" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: isMain ? 7 : 6, ...(isMain ? { padding: "2px 3px 7px", borderBottom: "1px solid #c9c9c9" } : {}) }}>
    <span className="avatar" style={{ display: "block", width: isMain ? 26 : 22, height: isMain ? 26 : 22, flex: `0 0 ${isMain ? 26 : 22}px`, overflow: "hidden", borderRadius: "50%" }}>
      {iconUrl && <img src={iconUrl} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />}
    </span>
    <strong style={{ display: "block", minWidth: 0, overflow: "hidden", fontSize: isMain ? 12 : 10, fontWeight: 600, lineHeight: 1.3, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{author?.name ?? "ユーザー"}</strong>
    {styleName && <span style={{ flex: "0 0 auto", maxWidth: 78, overflow: "hidden", padding: "2px 6px", borderRadius: 999, background: "#e8f5e8", color: "#22743b", fontSize: isMain ? 9 : 8, fontWeight: 700, textOverflow: "ellipsis", whiteSpace: "nowrap" }} aria-label={`変換スタイル: ${styleName}`}>{styleName}</span>}
  </div>;
}

export default function PostDetailModal({ post, replies, isLoadingReplies, replyError, selectedReaction, pendingReaction, onReact, onClose, onReply }: Props) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [openImageIndex, setOpenImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!post) return;
    const activePost = post;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (openImageIndex !== null) setOpenImageIndex(null);
        else onClose();
      }
      if (openImageIndex !== null && event.key === "ArrowRight" && activePost.images.length > 1) {
        setOpenImageIndex((index) => index === null ? null : (index + 1) % activePost.images.length);
      }
      if (openImageIndex !== null && event.key === "ArrowLeft" && activePost.images.length > 1) {
        setOpenImageIndex((index) => index === null ? null : (index - 1 + activePost.images.length) % activePost.images.length);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [post, openImageIndex, onClose]);

  if (!post) return null;

  return <div className="overlay" role="presentation" onClick={onClose}>
    <section className="modal" role="dialog" aria-modal="true" aria-label="投稿と返信" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="close" aria-label="閉じる" onClick={onClose}>×</button>
      <div className="scroll-area">
        <article className="main-post">
          <AuthorLine author={post.author} styleName={post.styleName} isMain />
          <button type="button" className="post-text" onClick={() => setShowOriginal((value) => !value)}>
            {showOriginal ? post.original_text : post.converted_text}
          </button>
          <span className="text-hint" aria-live="polite">{showOriginal ? "原文" : "変換文"}</span>
          {post.images.length > 0 && <div className="images">
            {post.images.map((src, index) => <button type="button" key={`${src}-${index}`} aria-label={`画像${index + 1}を拡大`} onClick={() => setOpenImageIndex(index)}>
              <img src={src} alt={`投稿画像 ${index + 1}`} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
            </button>)}
          </div>}
          {post.tags.length > 0 && <div className="tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
          <div className="counts">
            <button type="button" className="reply-count" onClick={onReply} aria-label="返信を書く">💬 {post.reply_count}</button>
            <button type="button" className={`reaction ${selectedReaction === "laugh" ? "selected" : ""}`} onClick={() => onReact("laugh")} disabled={pendingReaction} aria-label="笑いリアクション" aria-pressed={selectedReaction === "laugh"}><span className="emoji-circle">🤣</span><span>{post.laugh_count}</span></button>
            <button type="button" className={`reaction ${selectedReaction === "sad" ? "selected" : ""}`} onClick={() => onReact("sad")} disabled={pendingReaction} aria-label="悲しいリアクション" aria-pressed={selectedReaction === "sad"}><span className="emoji-circle">🥲</span><span>{post.sad_count}</span></button>
            <button type="button" className={`reaction ${selectedReaction === "like" ? "selected" : ""}`} onClick={() => onReact("like")} disabled={pendingReaction} aria-label="いいね" aria-pressed={selectedReaction === "like"}><span className="emoji-circle">👍</span><span>{post.like_count}</span></button>
          </div>
        </article>

        <div className="replies-list" style={{ maxHeight: 204, overflowY: "auto", overscrollBehavior: "contain" }}>
          {isLoadingReplies && <p className="message">返信を読み込み中…</p>}
          {!isLoadingReplies && replyError && <p className="message error">{replyError}</p>}
          {!isLoadingReplies && !replyError && replies.length === 0 && <p className="message">返信はまだありません。</p>}
          {!isLoadingReplies && !replyError && replies.map((reply) => <article className="reply" key={reply.id} style={{ padding: "6px 7px", borderTop: "1px solid #c9c9c9" }}>
            <AuthorLine author={reply.author} styleName={reply.styleName} />
            <p style={{ margin: "4px 0 0 28px", color: "#333", fontSize: 9, lineHeight: 1.4, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{reply.converted_text}</p>
            <Link href={`/posts/${reply.id}`} className="reply-permalink">返信ページを開く →</Link>
          </article>)}
        </div>
        <Link href={`/posts/${post.id}`} className="post-permalink">この投稿のページを開く →</Link>
        <button type="button" className="reply-action" onClick={onReply}>返信を書く</button>
      </div>

      {openImageIndex !== null && <div className="image-viewer" role="dialog" aria-modal="true" aria-label="投稿画像" onClick={() => setOpenImageIndex(null)}>
        <button type="button" className="image-close" aria-label="画像を閉じる" onClick={() => setOpenImageIndex(null)}>×</button>
        {post.images.length > 1 && <button type="button" className="image-nav previous" aria-label="前の画像" onClick={(event) => { event.stopPropagation(); setOpenImageIndex((openImageIndex - 1 + post.images.length) % post.images.length); }}>‹</button>}
        <img className="full-image" src={post.images[openImageIndex]} alt={`投稿画像 ${openImageIndex + 1} / ${post.images.length}`} onClick={(event) => event.stopPropagation()} />
        {post.images.length > 1 && <button type="button" className="image-nav next" aria-label="次の画像" onClick={(event) => { event.stopPropagation(); setOpenImageIndex((openImageIndex + 1) % post.images.length); }}>›</button>}
      </div>}
    </section>

    <style jsx>{`
      .overlay { position: fixed; inset: 70px 0; z-index: 2200; display: flex; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box; background: rgba(255,255,255,.28); }
      .modal { position: relative; width: min(82vw,560px); max-height: min(82vh,680px); overflow: hidden; border: 1px solid #299d48; border-radius: 17px; background: #fff; box-shadow: 0 5px 20px rgba(0,0,0,.12); }
      .scroll-area { max-height: min(82vh,680px); overflow-y: auto; overscroll-behavior: contain; }
      .close,.image-close { position: absolute; top: 6px; right: 6px; z-index: 2; width: 26px; height: 26px; border: 0; border-radius: 50%; background: rgba(255,255,255,.92); color: #777; font-size: 20px; line-height: 1; cursor: pointer; }
      .main-post { padding: 8px 10px 6px; border-bottom: 1px solid #c9c9c9; }
      .author-line { display: flex; align-items: center; gap: 6px; }
      .avatar { display: block; width: 22px; height: 22px; flex: 0 0 22px; overflow: hidden; border-radius: 50%; background: #ddd; }
      .avatar img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .author-line strong { overflow: hidden; color: #333; font-size: 10px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
      .main-post .author-line { gap: 7px; padding: 2px 3px 7px; border-bottom: 1px solid #c9c9c9; }
      .main-post .avatar { width: 26px; height: 26px; flex-basis: 26px; }
      .main-post .author-line strong { font-size: 12px; }
      .post-text { display: block; width: 100%; margin: 5px 0 0; padding: 2px 0; border: 0; background: transparent; color: #222; font: inherit; font-size: 11px; line-height: 1.45; text-align: left; text-decoration: none; white-space: pre-wrap; overflow-wrap: anywhere; cursor: pointer; }
      .text-hint { display: block; margin-top: 1px; color: #999; font-size: 8px; text-align: right; }
      .images { display: grid; width: 100%; min-width: 0; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 3px; margin-top: 4px; }
      .images button { display: block; width: 100%; min-width: 0; aspect-ratio: 1; padding: 0; overflow: hidden; border: 0; background: #ddd; cursor: zoom-in; }
      .images img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; color: #16833c; font-size: 9px; }
      .counts { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; color: #666; font-size: 9px; }
      .reply-count { min-width: 30px; min-height: 28px; padding: 2px 4px; border: 1px solid transparent; border-radius: 14px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
      .reply-count:hover { border-color: #aad8b3; background: #eff9f0; color: #16833c; }
      .reaction { display: inline-flex; min-width: 40px; min-height: 30px; align-items: center; justify-content: center; gap: 3px; padding: 2px 4px; border: 1px solid transparent; border-radius: 16px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
      .reaction:hover,.reaction.selected { border-color: #aad8b3; background: #eff9f0; color: #16833c; }
      .reaction:disabled { cursor: wait; opacity: .55; }
      .emoji-circle { display: inline-flex; width: 22px; height: 22px; flex: 0 0 22px; align-items: center; justify-content: center; border: 1px solid #e3e3e3; border-radius: 50%; background: #fff; font-size: 12px; }
      .reaction.selected .emoji-circle { border-color: #16833c; background: #dff7e7; }
      .reply { padding: 6px 7px; border-top: 1px solid #c9c9c9; }
      .reply > p { margin: 4px 0 0 28px; color: #333; font-size: 9px; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; }
      .post-permalink,.reply-permalink { display: inline-block; margin: 7px 8px; color: #22743b; font-size: 10px; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
      .reply-permalink { margin: 3px 0 0 28px; font-size: 9px; }
      .message { margin: 0; padding: 14px 10px; color: #777; font-size: 10px; text-align: center; }
      .error { color: #b42318; }
      .reply-action { display: block; margin: 6px 8px 8px auto; padding: 4px 9px; border: 0; border-radius: 14px; background: #e4f6dc; color: #27743c; font-size: 9px; cursor: pointer; }
      .image-viewer { position: fixed; inset: 0; z-index: 2300; display: flex; align-items: center; justify-content: center; padding: 48px 56px; box-sizing: border-box; background: rgba(0,0,0,.92); }
      .full-image { max-width: 96vw; max-height: 92vh; width: auto; height: auto; object-fit: contain; }
      .image-close,.image-nav { position: absolute; z-index: 1; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: rgba(255,255,255,.9); color: #222; cursor: pointer; }
      .image-close { top: 14px; right: 14px; font-size: 27px; }
      .image-nav { top: 50%; width: 42px; height: 42px; transform: translateY(-50%); font-size: 32px; }
      .previous { left: 12px; } .next { right: 12px; }
      @media (max-width: 480px) { .overlay { padding: 7px; } .modal { width: 82vw; border-radius: 15px; } }
    `}</style>
  </div>;
}
