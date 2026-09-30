"use client";

import Header from "../components/header";

export default function Setup() {
  return (
    <div className="setup-page">
      {/* 共通のヘッダー */}
      <Header />

      <main className="setup-main">
        
        {/* =========================
            タイトル枠
            ========================= */}
        <div className="title-wrapper">
          <span className="title-dots-right"></span>
          <h1 className="page-title">初期設定</h1>
        </div>

        {/* =========================
            ニックネーム入力
            ========================= */}
        <div className="nickname-area">
          <input
            type="text"
            className="nickname-input"
            placeholder="ニックネームを入力してね"
          />
        </div>

        {/* =========================
            説明テキスト
            ========================= */}
        <p className="description-text">
          性別と年齢を入力したら、<br />
          アイコンが自動で設定されるよ！
        </p>

        {/* =========================
            アイコンと入力エリア
            ========================= */}
        <div className="profile-setup-area">
          {/* 左側の丸いアイコン枠 */}
          <div className="profile-icon-placeholder"></div>
          
          {/* 右側の入力欄 */}
          <div className="profile-inputs">
            <label className="input-row">
              <span className="input-label">性別：</span>
              <input type="text" className="small-input" />
            </label>
            <label className="input-row">
              <span className="input-label">年齢：</span>
              <input type="text" className="small-input" />
            </label>
          </div>
        </div>

        {/* =========================
            始めるボタン
            ========================= */}
        <button className="start-button">
          始める！
        </button>

      </main>

      <style jsx>{`
        /* =========================
           画面全体
           ========================= */
        .setup-page {
          position: relative;
          width: 100%;
          max-width: 430px;
          height: 100dvh;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          overflow: hidden;
        }

        .setup-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          
          /* ★ ヘッダーの高さ＋少しの余白分、しっかり上に空間をあける */
          padding-top: 110px; /* ← ここを 60px から 110px に増やしました */
          padding-bottom: 40px;
          padding-left: 20px;
          padding-right: 20px;
          
          overflow-y: auto;
          box-sizing: border-box;
        }

        /* =========================
           タイトル枠 (4つの青い点)
           ========================= */
        .title-wrapper {
          position: relative;
          border: 1px solid #cccccc;
          border-radius: 6px;
          padding: 8px 30px;
          text-align: center;
          margin-bottom: 70px; /* 下の要素との余白 */
        }

        .page-title {
          font-size: 18px;
          font-weight: normal;
          color: #333333;
          margin: 0;
        }

        .title-wrapper::before,
        .title-wrapper::after {
          content: "";
          position: absolute;
          left: 6px;
          width: 4px;
          height: 4px;
          background-color: #5fc2ea;
          border-radius: 50%;
        }
        .title-wrapper::before { top: 6px; }
        .title-wrapper::after { bottom: 6px; }

        .title-dots-right::before,
        .title-dots-right::after {
          content: "";
          position: absolute;
          right: 6px;
          width: 4px;
          height: 4px;
          background-color: #5fc2ea;
          border-radius: 50%;
        }
        .title-dots-right::before { top: 6px; }
        .title-dots-right::after { bottom: 6px; }

        /* =========================
           ニックネーム入力
           ========================= */
        .nickname-area {
          width: 85%;
          margin-bottom: 50px;
        }

        .nickname-input {
          width: 100%;
          border: none;
          /* 下線だけを表示 */
          border-bottom: 2px solid #333333; 
          padding: 8px;
          font-size: 16px;
          text-align: center;
          outline: none;
          color: #111111;
          background-color: transparent;
        }

        .nickname-input::placeholder {
          color: #888888;
        }

        /* =========================
           説明テキスト
           ========================= */
        .description-text {
          text-align: center;
          font-size: 18px;
          line-height: 1.6;
          color: #111111;
          margin: 0 0 50px 0;
        }

        /* =========================
           アイコンと入力エリア
           ========================= */
        .profile-setup-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 70px;
          width: 100%;
        }

        .profile-icon-placeholder {
          width: 110px;
          height: 110px;
          background-color: #d9d9d9;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .profile-inputs {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-row {
          display: flex;
          align-items: center;
          font-size: 20px;
          color: #111111;
          gap: 8px;
        }

        .input-label {
          /* 文字の幅を固定して縦を揃える */
          width: 60px; 
          text-align: justify;
          text-align-last: justify;
        }

        .small-input {
          width: 65px;
          height: 32px;
          border: 1px solid #727272;
          border-radius: 6px;
          outline: none;
          font-size: 16px;
          text-align: center;
        }

        /* =========================
           始めるボタン
           ========================= */
        .start-button {
          background-color: #d2f6c5; /* 薄い緑色 */
          border: 1px solid #b5dfa4; /* 少し濃い緑の枠線 */
          border-radius: 10px;
          padding: 12px 48px;
          font-size: 20px;
          font-weight: normal;
          color: #000000;
          cursor: pointer;
        }

        .start-button:active {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}