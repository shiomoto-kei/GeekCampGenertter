"use client";

import Header from "../components/header";
import Footer from "../components/footer";
import NotificationItem from "../components/notification-item";

export default function Notice() {
  return (
    <div className="notice-page">
      {/* ヘッダー */}
      <Header />

      {/* 通知タイトル */}
      <main className="notice-main">
        <h1 className="notice-title">
          通知
        </h1>

        {/* 通知一覧 */}
        <div className="notification-list">
          <NotificationItem
            message="○○さんがいいねしました。"
          />

          <NotificationItem
            message="○○さんがいいねしました。"
          />

          <NotificationItem
            message="○○さんがいいねしました。"
          />

          <NotificationItem
            message="○○さんがいいねしました。"
          />

          <NotificationItem
            message="いいねが○○件を超えました。"
            type="count"
          />

          <NotificationItem
            message="○○さんがいいねしました。"
          />

          <NotificationItem
            message="○○さんがいいねしました。"
          />

          <NotificationItem
            message="○○さんがいいねしました。"
          />

          <NotificationItem
            message="○○さんがいいねしました。"
          />

          <NotificationItem
            message="いいねが○○件を超えました。"
            type="count"
          />

          <NotificationItem
            message="○○さんがいいねしました。"
          />
        </div>
      </main>

      {/* フッター */}
      <Footer />

      <style jsx>{`
        /* =========================
           通知画面全体
           ========================= */
        .notice-page {
          min-height: 100vh;

          background-color: #ffffff;

          padding-bottom: 100px;
        }

        /* =========================
           通知メイン
           ========================= */
        .notice-main {
          width: 100%;
          max-width: 500px;

          margin: 0 auto;
        }

        /* =========================
           通知タイトル
           ========================= */
        .notice-title {
          width: 100px;
          height: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin: 14px auto 16px;

          box-sizing: border-box;

          border: 1px solid #bdbdbd;
          border-radius: 5px;

          background-color: #ffffff;

          font-size: 18px;
          font-weight: normal;

          color: #555555;

          position: relative;
        }

        /*
          スクショの四隅にある
          青い小さな点
        */
        .notice-title::before {
          content: "";

          position: absolute;

          width: 5px;
          height: 5px;

          top: 3px;
          left: 3px;

          border-radius: 50%;

          background-color: #5fc2ea;

          box-shadow:
            89px 0 #5fc2ea,
            0 25px #5fc2ea,
            89px 25px #5fc2ea;
        }

        /* =========================
           通知一覧
           ========================= */
        .notification-list {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
