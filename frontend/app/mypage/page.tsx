"use client";

import MyPostCard from "../mypage/mypostcard";

export default function MyPage() {
  return (
    <div className="page">
      {/* ヘッダー */}
      <header className="header">
        <div className="header-icon"></div>
        <div className="logo">ロゴ</div>
      </header>

      {/* スクロール領域 */}
      <main className="content">
        {/* プロフィール額縁（public/mycard.png を背景に使用） */}
        <section className="profile-frame">
          <div className="profile-inner">
            <div className="profile-row">
              <div className="profile-icon"></div>
              <div className="profile-name-area">
                <span className="profile-name">たになカッター</span>
                <span className="profile-age">99歳</span>
              </div>
            </div>

            <p className="profile-mail">
              ログイン中のメールアドレス：aaaa.1234.bbbbb@gmail.com
            </p>

            <div className="profile-buttons">
              <button type="button" className="btn-change">変更する</button>
              <button type="button" className="btn-logout">ログアウト</button>
            </div>
          </div>
        </section>

        {/* 投稿一覧 */}
        <div className="post-list">
          <MyPostCard userName="たになカッター" text="今日の授業まじでだるすぎてくか" />
          <MyPostCard userName="たになカッター" text="今日の授業まじでだるすぎてくか" />
          <MyPostCard userName="たになカッター" text="今日の授業まじでだるすぎてくか" />
        </div>
      </main>

      {/* 下部ナビゲーション */}
      <nav className="nav">
        <a className="nav-item" href="/">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#666">
            <path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3L12 3z" />
          </svg>
          <span>Home</span>
        </a>
        <a className="nav-item" href="/notice">
          <span className="bell-wrap">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#666">
              <path d="M12 22a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 22zm7-6.5V11c0-3.2-1.7-5.9-4.7-6.6V3.7a2.3 2.3 0 0 0-4.6 0v.7C6.7 5.1 5 7.8 5 11v4.5l-2 2v1h18v-1l-2-2z" />
            </svg>
            <span className="badge"></span>
          </span>
          <span>Notice</span>
        </a>
        <a className="nav-item active" href="/mypage">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#1f9d4c">
            <circle cx="12" cy="7.5" r="4.5" />
            <path d="M3.5 21c0-4.7 3.8-7.5 8.5-7.5s8.5 2.8 8.5 7.5H3.5z" />
          </svg>
          <span>mypage</span>
        </a>
      </nav>

      <style jsx>{`
        .page {
          position: relative;
          width: 100%;
          max-width: 430px;
          height: 100dvh;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          overflow: hidden;
        }

        /* ヘッダー */
        .header {
          position: relative;
          flex-shrink: 0;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #aee68c;
        }

        .header-icon {
          position: absolute;
          left: 26px;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #d9d9d9;
        }

        .logo {
          width: 130px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #d9d9d9;
          font-size: 13px;
          color: #222;
        }

        /* コンテンツ */
        .content {
          flex: 1;
          overflow-y: auto;
          padding: 16px 12px 24px;
        }

        /* プロフィール額縁 */
        .profile-frame {
          position: relative;
          width: 78%;
          max-width: 320px;
          aspect-ratio: 290 / 176;
          margin: 0 auto 16px;
          background: url("/mycard.png") center / 100% 100% no-repeat;
        }

        .profile-inner {
          position: absolute;
          /* 額縁の内側の白い部分に合わせる */
          top: 26%;
          left: 6%;
          right: 6%;
          bottom: 9%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .profile-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 4px 0 0 10px;
        }

        .profile-icon {
          width: 58px;
          height: 58px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #d9d9d9;
        }

        .profile-name-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding-right: 8px;
        }

        .profile-name {
          align-self: flex-start;
          margin-left: 16px;
          font-size: 16px;
          font-weight: 700;
          color: #111;
        }

        .profile-age {
          margin-top: 4px;
          font-size: 11px;
          color: #111;
        }

        .profile-mail {
          margin: 0;
          text-align: center;
          font-size: 7.5px;
          color: #aaa;
          white-space: nowrap;
        }

        .profile-buttons {
          display: flex;
          justify-content: space-between;
          padding: 0 12px 4px;
        }

        .profile-buttons button {
          height: 18px;
          padding: 0;
          border-radius: 4px;
          font-size: 8.5px;
          cursor: pointer;
        }

        .btn-change {
          width: 62px;
          border: 1px solid #999;
          background: #fff;
          color: #222;
        }

        .btn-logout {
          width: 62px;
          border: none;
          background: #ff4d4d;
          color: #fff;
        }

        /* 投稿一覧 */
        .post-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* 下部ナビ */
        .nav {
          flex-shrink: 0;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          border-top: 2px solid #c8c8c8;
          background: #fff;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          min-width: 80px;
          font-size: 12px;
          font-weight: 700;
          color: #666;
          text-decoration: none;
        }

        .nav-item.active {
          color: #1f9d4c;
        }

        .bell-wrap {
          position: relative;
          display: flex;
        }

        .badge {
          position: absolute;
          top: 0;
          right: 2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ff2d2d;
        }
      `}</style>
    </div>
  );
}