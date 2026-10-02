"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent } from "react";
import ConfirmModal from "./confirm-modal";

type ReactionCode = "like" | "laugh" | "sad";

type PostCardProps = {
  userName: string;
  userId?: number;
  iconUrl?: string | null;
  text: string;
  showDelete?: boolean;
  onDelete?: () => Promise<void>;
  originalText?: string;
  images?: string[];
  tags?: string[];
  onTagClick?: (tag: string) => void;
  replyCount?: number;
  laughCount?: number;
  sadCount?: number;
  likeCount?: number;
  selectedReaction?: ReactionCode | null;
  onReact?: (code: ReactionCode) => void;
  pendingReaction?: boolean;
  onToggleReplies?: () => void;
  onOpenDetails?: () => void;
};

export default function PostCard({
  userName,
  userId,
  iconUrl = null,
  text,
  showDelete = false,
  onDelete,
  originalText,
  images = [],
  tags = [],
  onTagClick,
  replyCount = 0,
  laughCount = 0,
  sadCount = 0,
  likeCount = 0,
  selectedReaction = null,
  onReact,
  pendingReaction = false,
  onToggleReplies,
  onOpenDetails,
}: PostCardProps) {
  const [openImageIndex, setOpenImageIndex] = useState<number | null>(null);
  const [showOriginalText, setShowOriginalText] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    const target = event.target;
    if (target instanceof Element && target.closest("button,a,input,textarea,select,[role='dialog']")) return;
    onOpenDetails?.();
  }

  function handleCardKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onOpenDetails?.();
  }

  async function confirmDelete() {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await onDelete();
      setIsDeleteModalOpen(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "投稿を削除できませんでした。");
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    if (openImageIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenImageIndex(null);
      if (event.key === "ArrowRight" && images.length > 1) {
        setOpenImageIndex((index) =>
          index === null ? null : (index + 1) % images.length,
        );
      }
      if (event.key === "ArrowLeft" && images.length > 1) {
        setOpenImageIndex((index) =>
          index === null ? null : (index - 1 + images.length) % images.length,
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openImageIndex, images.length]);

  return (
    <article
      className={`post-card ${onOpenDetails ? "clickable" : ""}`}
      onClick={onOpenDetails ? handleCardClick : undefined}
      onKeyDown={onOpenDetails ? handleCardKeyDown : undefined}
      role={onOpenDetails ? "button" : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
      aria-label={onOpenDetails ? "投稿と返信を表示" : undefined}
    >
      <div className="post-header">
        <div className="user-info">
          <div className="user-icon">{iconUrl && <img src={iconUrl} alt="" />}</div>
          <div className="user-identity">
            <span className="user-name">{userName}</span>
            {userId !== undefined && <span className="user-id">@{userId}</span>}
          </div>
        </div>

        {showDelete && (
          <button
            className="delete-button"
            type="button"
            aria-label="投稿を削除"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <img src="/trash-icon.svg" alt="" width={24} height={24} />
          </button>
        )}
      </div>

      <div className="post-content">
        {originalText !== undefined ? (
          <>
            <button
              className="post-text"
              type="button"
              onClick={() => onOpenDetails ? onOpenDetails() : setShowOriginalText((current) => !current)}
              aria-label={onOpenDetails ? "投稿と返信を表示" : showOriginalText ? "AI変換文に戻す" : "原文を表示"}
              aria-expanded={showOriginalText}
            >
              {showOriginalText ? originalText : text}
            </button>
            <span className="text-mode-label">
              {showOriginalText ? "原文" : "変換文"} · {onOpenDetails ? "タップして投稿を表示" : "本文タップで切り替え"}
            </span>
          </>
        ) : (
          <p className="post-text static-text">{text}</p>
        )}
      </div>

      {images.length > 0 && (
        <div className="post-images">
          {images.map((src, index) => (
            <button
              className="image-button"
              key={`${src}-${index}`}
              type="button"
              onClick={() => setOpenImageIndex(index)}
              aria-label={`投稿画像 ${index + 1}を拡大表示`}
            >
              <img src={src} alt={`投稿画像 ${index + 1}`} />
            </button>
          ))}
        </div>
      )}

      {openImageIndex !== null && (
        <div
          className="image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="投稿画像"
          onClick={() => setOpenImageIndex(null)}
        >
          <button
            className="close-viewer"
            type="button"
            aria-label="閉じる"
            onClick={() => setOpenImageIndex(null)}
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              className="image-nav previous"
              type="button"
              aria-label="前の画像"
              onClick={(event) => {
                event.stopPropagation();
                setOpenImageIndex((index) =>
                  index === null ? null : (index - 1 + images.length) % images.length,
                );
              }}
            >
              ‹
            </button>
          )}

          <img
            className="full-image"
            src={images[openImageIndex]}
            alt={`投稿画像 ${openImageIndex + 1} / ${images.length}`}
            onClick={(event) => event.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              className="image-nav next"
              type="button"
              aria-label="次の画像"
              onClick={(event) => {
                event.stopPropagation();
                setOpenImageIndex((index) =>
                  index === null ? null : (index + 1) % images.length,
                );
              }}
            >
              ›
            </button>
          )}
        </div>
      )}

      {tags.length > 0 && (
        <div className="post-tags">
          {tags.map((tag) => onTagClick ? (
            <button key={tag} type="button" onClick={() => onTagClick(tag)}>#{tag}</button>
          ) : <span key={tag}>#{tag}</span>)}
        </div>
      )}

      {(onReact || onToggleReplies) && (
        <div className="reactions">
          {onToggleReplies && (
            <button
              className="reaction"
              type="button"
              onClick={onToggleReplies}
              aria-label={`返信 ${replyCount}件を表示`}
            >
              💬 {replyCount}
            </button>
          )}

          {onReact && (
            <>
              <button
                className={`reaction ${selectedReaction === "laugh" ? "selected" : ""}`}
                type="button"
                onClick={() => onReact("laugh")}
                disabled={pendingReaction}
                aria-label="笑いリアクション"
                aria-pressed={selectedReaction === "laugh"}
              >
                <span className="emoji-circle">🤣</span> {laughCount}
              </button>
              <button
                className={`reaction ${selectedReaction === "sad" ? "selected" : ""}`}
                type="button"
                onClick={() => onReact("sad")}
                disabled={pendingReaction}
                aria-label="悲しいリアクション"
                aria-pressed={selectedReaction === "sad"}
              >
                <span className="emoji-circle">🥲</span> {sadCount}
              </button>
              <button
                className={`reaction ${selectedReaction === "like" ? "selected" : ""}`}
                type="button"
                onClick={() => onReact("like")}
                disabled={pendingReaction}
                aria-label="いいね"
                aria-pressed={selectedReaction === "like"}
              >
                <span className="emoji-circle">👍</span> {likeCount}
              </button>
            </>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { if (!isDeleting) { setIsDeleteModalOpen(false); setDeleteError(""); } }}
        title="投稿の削除"
        message={deleteError || "削除してもよろしいですか？返信は単独の投稿として残ります。"}
        confirmText={isDeleting ? "削除中…" : "削除する"}
        onConfirm={() => { void confirmDelete(); }}
      />

      <style jsx>{`
        .post-card {
          width: 100%;
          box-sizing: border-box;
          padding: 10px;
          background: #fff;
          border: 1px solid #bdbdbd;
          border-radius: 14px;
        }
        .post-card.clickable { cursor: pointer; transition: box-shadow 120ms ease, border-color 120ms ease; }
        .post-card.clickable:hover { border-color: #8bcf9b; box-shadow: 0 3px 12px rgba(20, 90, 40, .08); }
        .post-card.clickable:focus-visible { outline: 2px solid #299d48; outline-offset: 2px; }
        .post-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .user-identity {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .user-icon {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          background: #ff8d82;
          border-radius: 50%;
          overflow: hidden;
        }
        .user-icon img { width: 100%; height: 100%; object-fit: cover; }
        .user-name {
          font-size: 13px;
          color: #333;
        }
        .user-id {
          color: #888;
          font-size: 10px;
        }
        .delete-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border: 0;
          background: transparent;
          cursor: pointer;
        }
        .delete-button:hover {
          opacity: 0.7;
        }
        .post-text {
          width: 100%;
          margin: 8px 0;
          padding: 8px 0 0;
          border: 0;
          border-top: 1px solid #cfcfcf;
          background: transparent;
          color: #333;
          font: inherit;
          font-size: 12px;
          text-align: left;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          cursor: pointer;
        }
        .static-text {
          cursor: default;
        }
        .text-mode-label {
          display: block;
          margin-top: -3px;
          color: #999;
          font-size: 9px;
          text-align: right;
        }
        .post-images {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 4px;
          margin-top: 8px;
        }
        .image-button {
          display: block;
          min-width: 0;
          padding: 0;
          border: 0;
          border-radius: 6px;
          background: transparent;
          cursor: zoom-in;
        }
        .image-button img {
          display: block;
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          border-radius: 6px;
        }
        .image-viewer {
          position: fixed;
          inset: 0;
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 56px;
          box-sizing: border-box;
          background: rgba(0, 0, 0, 0.9);
          cursor: zoom-out;
        }
        .full-image {
          max-width: 96vw;
          max-height: 92vh;
          width: auto;
          height: auto;
          object-fit: contain;
          cursor: default;
        }
        .close-viewer,
        .image-nav {
          position: absolute;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          color: #222;
          cursor: pointer;
        }
        .close-viewer {
          top: 16px;
          right: 18px;
          width: 42px;
          height: 42px;
          font-size: 30px;
        }
        .image-nav {
          top: 50%;
          width: 42px;
          height: 42px;
          transform: translateY(-50%);
          font-size: 32px;
        }
        .previous { left: 12px; }
        .next { right: 12px; }
        .post-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 7px;
        }
        .post-tags span,
        .post-tags button {
          color: #16833c;
          font-size: 11px;
        }
        .post-tags button {
          padding: 0;
          border: 0;
          background: transparent;
          font: inherit;
          cursor: pointer;
        }
        .post-tags button:hover { text-decoration: underline; }
        .reactions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          color: #666;
          font-size: 10px;
        }
        .reaction {
          display: flex;
          align-items: center;
          gap: 4px;
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
          background: #dff7e7;
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
          background: #fff;
          font-size: 12px;
        }
      `}</style>
    </article>
  );
}
