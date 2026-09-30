"use client";

import { useState } from "react";
import ConfirmModal from "./confirm-modal";

type PostCardProps = {
  userName: string;
  text: string;
  showDelete?: boolean; 
};

export default function PostCard({ userName, text, showDelete = false }: PostCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ★ 自分がどのリアクションを押したかを保持するステート（見た目用）
  // null または "laugh" | "sad" | "good"
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  // リアクションをクリックしたときの切り替え処理
  const handleReactionClick = (type: string) => {
    if (activeReaction === type) {
      setActiveReaction(null); // すでに押してたら解除
    } else {
      setActiveReaction(type); // 押してなかったらそれに変更
    }
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="user-info">
          <div className="user-icon"></div>
          <span className="user-name">{userName}</span>
        </div>

        {showDelete && (
          <button
            className="delete-button"
            type="button"
            aria-label="投稿を削除"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <img src="/trash-icon.svg" alt="削除" width={24} height={24} />
          </button>
        )}
      </div>

      <p className="post-text">{text}</p>

      <div className="post-images">
        <div className="post-image">画像</div>
        <div className="post-image">画像</div>
        <div className="post-image">画像</div>
        <div className="post-image">画像</div>
      </div>

      <div className="reactions">
        {/* コメント */}
        <span className="reaction">
          <span className="svg-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C6.9 3 3 6.4 3 10.5c0 2.3 1.2 4.3 3.1 5.7L5.5 20l4-2c.8.2 1.6.3 2.5.3 5.1 0 9-3.4 9-7.8S17.1 3 12 3z" stroke="#999" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </span>
          100
        </span>

        {/* 🤣 ｰ 笑い */}
        <button 
          type="button"
          className={`reaction-button ${activeReaction === "laugh" ? "active-reaction" : ""}`}
          onClick={() => handleReactionClick("laugh")}
        >
          <span className="emoji-circle">🤣</span> 
          <span className="reaction-count">100</span>
        </button>

        {/* 🥲 ｰ 泣き */}
        <button 
          type="button"
          className={`reaction-button ${activeReaction === "sad" ? "active-reaction" : ""}`}
          onClick={() => handleReactionClick("sad")}
        >
          <span className="emoji-circle">🥲</span> 
          <span className="reaction-count">100</span>
        </button>

        {/* 👍 ｰ いいね */}
        <button 
          type="button"
          className={`reaction-button ${activeReaction === "good" ? "active-reaction" : ""}`}
          onClick={() => handleReactionClick("good")}
        >
          <span className="emoji-circle">👍</span> 
          <span className="reaction-count">100</span>
        </button>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="投稿の削除"
        message="削除してもよろしいですか？"
        confirmText="削除する"
        onConfirm={() => {
          console.log("削除処理");
          setIsDeleteModalOpen(false);
        }}
      />

      <style jsx>{`
        .post-card { width: 100%; box-sizing: border-box; padding: 12px; background-color: #ffffff; border: 1px solid #bdbdbd; border-radius: 14px; }
        .post-header { display: flex; align-items: center; justify-content: space-between; }
        .user-info { display: flex; align-items: center; gap: 8px; }
        .user-icon { width: 26px; height: 26px; flex-shrink: 0; background-color: #ff8d82; border-radius: 50%; }
        .user-name { font-size: 14px; font-weight: bold; color: #333333; }
        .delete-button { display: flex; align-items: center; justify-content: center; padding: 4px; border: none; background-color: transparent; cursor: pointer; }
        .delete-button:hover { opacity: 0.7; }
        .post-text { margin: 10px 0; padding-top: 10px; border-top: 1px solid #cfcfcf; font-size: 13px; line-height: 1.4; color: #333333; }
        .post-images { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
        .post-image { aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; background-color: #d9d9d9; font-size: 11px; color: #555555; border-radius: 4px; }
        
        .reactions { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 10px; font-size: 11px; color: #666666; }
        .reaction { display: flex; align-items: center; gap: 4px; }
        .svg-icon { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; }

        /* リアクションボタン（押せるように変更） */
        .reaction-button {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: 11px;
          color: #666666;
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
          transition: all 0.2s ease;
        }

        /* =========================
           アクティブ（青色）時のスタイル
           ========================= */
        .active-reaction .emoji-circle {
          border-color: #1d9bf0; /* X（Twitter）っぽい青色 */
          background-color: #e8f5fe; /* 薄い青の背景 */
        }

        .active-reaction .reaction-count {
          color: #1d9bf0; /* 数字も青色にする */
          font-weight: bold;
        }
      `}</style>
    </article>
  );
}