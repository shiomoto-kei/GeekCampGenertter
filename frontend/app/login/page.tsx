"use client";

export default function Login() {
  return (
    <div className="login-page">
      {/* 
        ロゴ画像 
        ※ publicフォルダにロゴ画像（例: logo.png）を配置し、srcを書き換えてください 
      */}
      <div className="logo-container">
        <img src="/genertter_logo.png" alt="じぇねれったー" className="logo-image" />
      </div>

      <h1 className="login-title">ログイン</h1>

      <div className="button-group">
        {/* Googleログインボタン */}
        <button type="button" className="google-button">
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="google-text">Login with Google</span>
        </button>

        {/* ゲストログインボタン */}
        <button type="button" className="guest-button">
          ゲストでログインする
        </button>
      </div>

      <style jsx>{`
        /* =========================
           画面全体
           ========================= */
        .login-page {
          position: relative;
          width: 100%;
          max-width: 430px; /* スマホサイズに固定 */
          height: 100dvh;
          margin: 0 auto;
          
          /* 背景の薄い緑色 */
          background-color: #c9f1b8; 
          
          display: flex;
          flex-direction: column;
          align-items: center;
          
          /* 上部の余白 */
          padding-top: 180px; 
          box-sizing: border-box;
          overflow: hidden;
        }

        /* =========================
           ロゴ画像
           ========================= */
        .logo-container {
          width: 80%;
          max-width: 280px;
          display: flex;
          justify-content: center;
          margin-bottom: 60px;
        }

        .logo-image {
          width: 100%;
          height: auto;
          object-fit: contain;
        }

        /* =========================
           タイトル
           ========================= */
        .login-title {
          font-size: 32px;
          font-weight: bold;
          color: #000000;
          margin: 0 0 50px 0;
          letter-spacing: 2px;
        }

        /* =========================
           ボタンエリア
           ========================= */
        .button-group {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 80%;
          max-width: 280px;
        }

        /* Googleボタン */
        .google-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          
          width: 100%;
          height: 52px;
          
          background-color: #ffffff;
          border: none;
          border-radius: 4px; /* 四角に近い丸み */
          
          /* うっすらとした影をつけて立体感を出す */
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08); 
          
          cursor: pointer;
        }

        .google-icon {
          width: 22px;
          height: 22px;
        }

        .google-text {
          font-size: 16px;
          font-weight: bold;
          color: #3c4043;
          font-family: "Roboto", Arial, sans-serif; /* Google標準フォントに近いもの */
        }

        /* ゲストボタン */
        .guest-button {
          display: flex;
          align-items: center;
          justify-content: center;
          
          width: 100%;
          height: 52px;
          
          background-color: #ffffff;
          border: 1px solid #aaaaaa; /* グレーの枠線 */
          border-radius: 12px; /* 少し強めの丸み */
          
          font-size: 15px;
          color: #111111;
          
          cursor: pointer;
        }

        /* ボタンのホバーアクション */
        .google-button:active,
        .guest-button:active {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}