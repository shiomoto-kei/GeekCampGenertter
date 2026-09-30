"use client";

import { useEffect, useState } from "react";

type PostCardProps = {
  userName: string;
  text: string;
  originalText: string;
  images: string[];
  tags: string[];
  replyCount: number;
  laughCount: number;
  sadCount: number;
  likeCount: number;
  selectedReaction: "like" | "laugh" | "sad" | null;
  onReact: (code: "like" | "laugh" | "sad") => void;
  pendingReaction: boolean;
  onToggleReplies: () => void;
};

export default function PostCard({
  userName,
  text,
  originalText,
  images,
  tags,
  replyCount,
  laughCount,
  sadCount,
  likeCount,
  selectedReaction,
  onReact,
  pendingReaction,
  onToggleReplies,
}: PostCardProps) {
  const [openImageIndex, setOpenImageIndex] = useState<number | null>(null);
  const [showOriginalText, setShowOriginalText] = useState(false);

  useEffect(() => {
    if (openImageIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenImageIndex(null);
      if (event.key === "ArrowRight" && images.length > 1) {
        setOpenImageIndex((index) => index === null ? null : (index + 1) % images.length);
      }
      if (event.key === "ArrowLeft" && images.length > 1) {
        setOpenImageIndex((index) => index === null ? null : (index - 1 + images.length) % images.length);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openImageIndex, images.length]);

  return (
    <article className="post-card">
      {/* ユーザー情報 */}
      <div className="user-info">
        <div className="user-icon"></div>
        <span className="user-name">{userName}</span>
      </div>

      {/* 投稿本文 */}
      <div className="post-content">
        <button
          className="post-text"
          type="button"
          onClick={() => setShowOriginalText((current) => !current)}
          aria-label={showOriginalText ? "AI変換文に戻す" : "原文を表示"}
          aria-expanded={showOriginalText}
        >
          {showOriginalText ? originalText : text}
        </button>
        <span className="text-mode-label">{showOriginalText ? "原文" : "変換文"} · 本文タップで切り替え</span>
      </div>

      {images.length > 0 && (
        <div className="post-images">
          {images.map((src, index) => (
            <button className="image-button" key={`${src}-${index}`} type="button" onClick={() => setOpenImageIndex(index)} aria-label={`投稿画像 ${index + 1}を拡大表示`}>
              <img src={src} alt={`投稿画像 ${index + 1}`} />
            </button>
          ))}
        </div>
      )}

      {openImageIndex !== null && <div className="image-viewer" role="dialog" aria-modal="true" aria-label="投稿画像" onClick={() => setOpenImageIndex(null)}>
        <button className="close-viewer" type="button" aria-label="閉じる" onClick={() => setOpenImageIndex(null)}>×</button>
        {images.length > 1 && <button className="image-nav previous" type="button" aria-label="前の画像" onClick={(event) => { event.stopPropagation(); setOpenImageIndex((index) => index === null ? null : (index - 1 + images.length) % images.length); }}>‹</button>}
        <img className="full-image" src={images[openImageIndex]} alt={`投稿画像 ${openImageIndex + 1} / ${images.length}`} onClick={(event) => event.stopPropagation()} />
        {images.length > 1 && <button className="image-nav next" type="button" aria-label="次の画像" onClick={(event) => { event.stopPropagation(); setOpenImageIndex((index) => index === null ? null : (index + 1) % images.length); }}>›</button>}
      </div>}

      {tags.length > 0 && <div className="post-tags">{tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}

      {/* リアクション */}
      <div className="reactions">
        <button className="reaction" type="button" onClick={onToggleReplies} aria-label={`返信 ${replyCount}件を表示`}>
          💬 {replyCount}
        </button>
        <button className={`reaction ${selectedReaction === "laugh" ? "selected" : ""}`} type="button" onClick={() => onReact("laugh")} disabled={pendingReaction} aria-label="笑いリアクション" aria-pressed={selectedReaction === "laugh"}>
          <span className="emoji-circle">🤣</span> {laughCount}
        </button>
        <button className={`reaction ${selectedReaction === "sad" ? "selected" : ""}`} type="button" onClick={() => onReact("sad")} disabled={pendingReaction} aria-label="悲しいリアクション" aria-pressed={selectedReaction === "sad"}>
          <span className="emoji-circle">🥲</span> {sadCount}
        </button>
        <button className={`reaction ${selectedReaction === "like" ? "selected" : ""}`} type="button" onClick={() => onReact("like")} disabled={pendingReaction} aria-label="いいね" aria-pressed={selectedReaction === "like"}>
          <span className="emoji-circle">👍</span> {likeCount}
        </button>
      </div>

      <style jsx>{`
        /* =========================
           投稿カード
           ========================= */
        .post-card {
          width: 100%;
          box-sizing: border-box;

          padding: 10px;

          background-color: #ffffff;

          border: 1px solid #bdbdbd;
          border-radius: 14px;
        }

        /* =========================
           ユーザー情報
           ========================= */
        .user-info {
          display: flex;
          align-items: center;

          gap: 8px;
        }

        .user-icon {
          width: 22px;
          height: 22px;

          flex-shrink: 0;

          background-color: #ff8d82;

          border-radius: 50%;
        }

        .user-name {
          font-size: 13px;
          color: #333333;
        }

        /* =========================
           投稿本文
           ========================= */
        .post-text {
          /* ★上下の余白を調整 */
          margin: 8px 0;
          padding-top: 8px;
          border: 0;
          border-top: 1px solid #cfcfcf;
          font-size: 12px;
          color: #333333;
          width: 100%;
          padding-left: 0;
          padding-right: 0;
          background: transparent;
          font: inherit;
          font-size: 12px;
          text-align: left;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          cursor: pointer;
        }
        .text-mode-label { display: block; margin-top: -3px; color: #999; font-size: 9px; text-align: right; }

        .post-images {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 4px;
          margin-top: 8px;
        }

        .post-images img {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          border-radius: 6px;
        }
        .image-button { display: block; min-width: 0; padding: 0; border: 0; border-radius: 6px; background: transparent; cursor: zoom-in; }
        .image-button img { display: block; }
        .image-viewer { position: fixed; inset: 0; z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 48px 56px; box-sizing: border-box; background: rgba(0, 0, 0, .9); cursor: zoom-out; }
        .full-image { max-width: 96vw; max-height: 92vh; width: auto; height: auto; object-fit: contain; cursor: default; }
        .close-viewer, .image-nav { position: absolute; z-index: 1; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .9); color: #222; cursor: pointer; }
        .close-viewer { top: 16px; right: 18px; width: 42px; height: 42px; font-size: 30px; line-height: 1; }
        .image-nav { top: 50%; width: 42px; height: 42px; transform: translateY(-50%); font-size: 32px; }
        .previous { left: 12px; }
        .next { right: 12px; }
        .post-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; }
        .post-tags span { color: #16833c; font-size: 11px; }

        /* =========================
           リアクション
           ========================= */
        .reactions {
          display: flex;
          justify-content: flex-end;
          align-items: center;

          gap: 8px;

          margin-top: 6px;

          font-size: 10px;
          color: #666666;
        }

        .reaction {
          display: flex;
          align-items: center;
          gap: 4px; /* 丸と数字の隙間 */
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        .reaction:disabled {
          cursor: wait;
          opacity: 0.55;
        }

        .reaction.selected {
          color: #16833c;
          font-weight: 700;
        }

        .reaction.selected .emoji-circle {
          background-color: #dff7e7;
          border-color: #16833c;
        }

        .emoji-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          
          width: 22px;
          height: 22px;
          
          border: 1px solid #e3e3e3;
          border-radius: 50%;
          
          background-color: #ffffff;
          font-size: 12px;
        }
      `}</style>
    </article>
  );
}
