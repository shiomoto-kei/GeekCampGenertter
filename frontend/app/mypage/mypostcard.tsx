"use client";

type MyPostCardProps = {
  userName: string;
  text: string;
};

export default function MyPostCard({ userName, text }: MyPostCardProps) {
  return (
    <article className="post-card">
      {/* 投稿者情報 */}
      <div className="post-header">
        <div className="user-info">
          <div className="user-icon"></div>
          <span className="user-name">{userName}</span>
        </div>

        {/* 削除ボタン（public/trash-icon.svg を使用） */}
        <button
          className="delete-button"
          type="button"
          aria-label="投稿を削除"
          onClick={() => {
            // あとで削除処理を追加する
            console.log("削除ボタンが押されました");
          }}
        >
          <img src="/trash-icon.svg" alt="" width={26} height={26} />
        </button>
      </div>

      {/* 投稿本文 */}
      <p className="post-text">{text}</p>

      {/* 投稿画像 */}
      <div className="image-list">
        <div className="post-image">画像</div>
        <div className="post-image">画像</div>
        <div className="post-image">画像</div>
        <div className="post-image">画像</div>
      </div>

      {/* 反応 */}
      <div className="reaction-list">
        <span className="reaction">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3C6.9 3 3 6.4 3 10.5c0 2.3 1.2 4.3 3.1 5.7L5.5 20l4-2c.8.2 1.6.3 2.5.3 5.1 0 9-3.4 9-7.8S17.1 3 12 3z"
              stroke="#999"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          100
        </span>
        <span className="reaction">
          <span className="chip">🤣</span>100
        </span>
        <span className="reaction">
          <span className="chip">😢</span>100
        </span>
        <span className="reaction">
          <span className="chip">👍</span>100
        </span>
      </div>

      <style jsx>{`
        .post-card {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px 8px;
          border: 1px solid #aaaaaa;
          border-radius: 20px;
          background-color: #ffffff;
        }

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

        .user-icon {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border-radius: 50%;
          background-color: #ff8d82;
        }

        .user-name {
          font-size: 15px;
          color: #222222;
          /* ★ ここを追加して少し下に下げる（2px〜5pxあたりで調整してみてください） */
          top: 10px; 
        }

        .delete-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none;
          background-color: transparent;
          cursor: pointer;
        }

        .post-text {
          margin: 6px 0 8px;
          padding-top: 7px;
          border-top: 1px solid #c8c8c8;
          font-size: 17px;
          color: #222222;
        }

        .image-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
        }

        .post-image {
          aspect-ratio: 1 / 0.95;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #d9d9d9;
          font-size: 14px;
          color: #222222;
        }

        .reaction-list {
          display: flex;
          justify-content: flex-end;
          gap: 4px;
          margin-top: 6px;
          font-size: 13px;
          color: #222222;
        }

        .reaction {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .chip {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e3e3e3;
          border-radius: 50%;
          background: #fff;
          font-size: 12px;
        }
      `}</style>
    </article>
  );
}