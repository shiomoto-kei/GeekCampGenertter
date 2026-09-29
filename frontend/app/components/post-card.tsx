"use client";

type PostCardProps = {
  userName: string;
  text: string;
};

export default function PostCard({
  userName,
  text,
}: PostCardProps) {
  return (
    <article className="post-card">
      {/* ユーザー情報 */}
      <div className="user-info">
        <div className="user-icon"></div>

        <span className="user-name">{userName}</span>
      </div>

      {/* 投稿本文 */}
      <p className="post-text">{text}</p>

      {/* 画像 */}
      <div className="post-images">
        <div className="post-image">画像</div>
        <div className="post-image">画像</div>
        <div className="post-image">画像</div>
        <div className="post-image">画像</div>
      </div>

      {/* リアクション */}
      <div className="reactions">
        <span>💬 100</span>
        <span>😊 100</span>
        <span>😆 100</span>
        <span>👍 100</span>
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
          margin: 8px 0;

          padding-bottom: 7px;

          border-bottom: 1px solid #cfcfcf;

          font-size: 12px;
          color: #333333;
        }

        /* =========================
           画像4枚
           ========================= */
        .post-images {
          display: grid;

          grid-template-columns: repeat(4, 1fr);

          gap: 2px;
        }

        .post-image {
          aspect-ratio: 1 / 1;

          display: flex;
          align-items: center;
          justify-content: center;

          background-color: #d9d9d9;

          font-size: 11px;
          color: #333333;
        }

        /* =========================
           リアクション
           ========================= */
        .reactions {
          display: flex;
          justify-content: flex-end;
          align-items: center;

          gap: 8px;

          margin-top: 6px;

          font-size: 9px;
          color: #666666;
        }
      `}</style>
    </article>
  );
}
