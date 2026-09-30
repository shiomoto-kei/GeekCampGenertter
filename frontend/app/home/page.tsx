"use client";

import { useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import PostCard from "../components/post-card";

export default function Home() {
  // 「new」か「recommend」かを管理する
  const [activeTab, setActiveTab] = useState<"new" | "recommend">("new");

  return (
    <div className="home-page">
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main className="main-content">
        {/* =========================
            新着・おすすめ ＋ 検索
            ========================= */}
        <div className="top-controls">
          {/* 新着・おすすめ */}
          <div className="tab-area">
            <button
              className={`tab-button ${
                activeTab === "new" ? "active" : ""
              }`}
              onClick={() => setActiveTab("new")}
            >
              新着
            </button>

            <button
              className={`tab-button ${
                activeTab === "recommend" ? "active" : ""
              }`}
              onClick={() => setActiveTab("recommend")}
            >
              おすすめ
            </button>
          </div>

          {/* 検索欄 */}
          <div className="search-area">
            <input
              type="text"
              placeholder="気になる投稿を検索..."
            />

            <button className="search-button">
              🔍
            </button>
          </div>
        </div>

        {/* =========================
            投稿一覧
            ========================= */}
        <div className="post-list">
          {activeTab === "new" ? (
            <>
              <PostCard
                userName="たになカッター"
                text="今日の授業まじでだるすぎてくか"
              />

              <PostCard
                userName="たになカッター"
                text="今日の授業まじでだるすぎてくか"
              />

              <PostCard
                userName="たになカッター"
                text="今日の授業まじでだるすぎてくか"
              />
            </>
          ) : (
            <>
              <PostCard
                userName="おすすめユーザー"
                text="これはおすすめに表示される投稿です"
              />

              <PostCard
                userName="おすすめユーザー"
                text="みんなに人気の投稿です"
              />

              <PostCard
                userName="おすすめユーザー"
                text="おすすめの投稿を表示しています"
              />
            </>
          )}
        </div>
      </main>

      {/* =========================
          新規投稿ボタン
          ========================= */}
      <button
        className="new-post-button"
        onClick={() => {
          // 投稿画面を作ったら、ここから移動する
        }}
      >
        ＋
      </button>

      {/* フッター */}
      <Footer />

      <style jsx>{`
        /* =========================
           ホーム全体
           ========================= */
        .home-page {
          min-height: 100vh;

          background-color: #ffffff;

          /*
            フッター100px +
            ＋ボタンが重ならないための余白
          */
          padding-bottom: 120px;
        }

        /* =========================
           メインコンテンツ
           ========================= */
        .main-content {
          width: 100%;
          max-width: 600px;

          margin: 0 auto;

          padding: 12px;

          box-sizing: border-box;
        }

        /* =========================
           新着・おすすめ ＋ 検索
           ========================= */
        .top-controls {
          width: 100%;

          display: flex;
          align-items: center;

          gap: 10px;

          margin-bottom: 10px;
        }

        /* =========================
           新着・おすすめ
           ========================= */
        .tab-area {
          display: flex;

          flex-shrink: 0;
        }

        .tab-button {
          width: 90px;
          height: 26px;

          border: 1px solid #cccccc;

          background-color: #ffffff;

          color: #333333;

          font-size: 12px;

          cursor: pointer;
        }

        .tab-button:first-child {
          border-radius: 15px 0 0 15px;
        }

        .tab-button:last-child {
          border-radius: 0 15px 15px 0;
        }

        .tab-button.active {
          background-color: #a7e6d9;

          border-color: #a7e6d9;

          font-weight: bold;
        }

        /* =========================
           検索欄
           ========================= */
        .search-area {
          flex: 1;

          min-width: 0;

          height: 30px;

          display: flex;
        }

        .search-area input {
          flex: 1;

          min-width: 0;

          padding: 0 10px;

          border: 1px solid #dddddd;
          border-radius: 4px 0 0 4px;

          font-size: 10px;

          outline: none;
        }

        .search-button {
          width: 34px;

          flex-shrink: 0;

          border: none;

          background-color: #68c5ed;

          color: #ffffff;

          cursor: pointer;
        }

        /* =========================
           投稿一覧
           ========================= */
        .post-list {
          display: flex;

          flex-direction: column;

          gap: 10px;
        }

        /* =========================
           新規投稿ボタン
           ========================= */
        .new-post-button {
          position: fixed;

          /*
            フッター100pxなので、
            そこより少し上に配置する
          */
          right: 20px;
          bottom: 115px;

          width: 50px;
          height: 50px;

          border: none;

          border-radius: 50%;

          background-color: #5fc2ea;

          color: #ffffff;

          font-size: 30px;
          font-weight: 300;

          line-height: 1;

          cursor: pointer;

          z-index: 1100;
        }

        .new-post-button:hover {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}
