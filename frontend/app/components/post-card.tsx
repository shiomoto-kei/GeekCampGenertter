"use client";

import { useState } from "react";
// ★ 先ほど作った確認モーダルを読み込む
import ConfirmModal from "./confirm-modal";

type PostCardProps = {
  userName: string;
  text: string;
  showDelete?: boolean; 
};

export default function PostCard({ userName, text, showDelete = false }: PostCardProps) {
  // ★ 削除モーダルの開閉状態
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
            onClick={() => setIsDeleteModalOpen(true)} // ★ クリックでモーダルを開く
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
        {/* リアクションアイコンは以前のコードと同じため省略せずにそのまま使用してください */}
        <span className="reaction">
          <span className="svg-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C6.9 3 3 6.4 3 10.5c0 2.3 1.2 4.3 3.1 5.7L5.5 20l4-2c.8.2 1.6.3 2.5.3 5.1 0 9-3.4 9-7.8S17.1 3 12 3z" stroke="#999" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </span>
          100
        </span>
        <span className="reaction"><span className="emoji-circle">🤣</span> 100</span>
        <span className="reaction"><span className="emoji-circle">🥲</span> 100</span>
        <span className="reaction"><span className="emoji-circle">👍</span> 100</span>
      </div>

      {/* ★ 削除確認モーダル（ここに追加） */}
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

      {/* 以前と同じCSS */}
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
        .emoji-circle { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 1px solid #e3e3e3; border-radius: 50%; background-color: #ffffff; font-size: 12px; }
      `}</style>
    </article>
  );
}