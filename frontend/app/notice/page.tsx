"use client";

import Header from "../components/header";
import Footer from "../components/footer";
import NotificationItem from "../components/notification-item";

export default function Notice() {
  return (
    <div className="notice-page">
      {/* ヘッダー */}
      <Header />

      {/* =========================
          上に固定されるタイトルエリア
          ========================= */}
      <div className="title-area">
        <h1 className="notice-title">
          通知
        </h1>
      </div>

      {/* メインコンテンツ（ここだけスクロールする） */}
      <main className="notice-main">
        {/* 通知一覧 */}
        <div className="notification-list">
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          
          <NotificationItem message="いいねが○○件を超えました。" type="count" />
          
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          
          <NotificationItem message="いいねが○○件を超えました。" type="count" />
          
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          
          <NotificationItem message="いいねが○○件を超えました。" type="count" />
          
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          <NotificationItem message="○○さんがいいねしました。" />
          
          <NotificationItem message="いいねが○○件を超えました。" type="count" />
          
          <NotificationItem message="○○さんがいいねしました。" />
        </div>
      </main>

      {/* フッター */}
      <Footer />

      <style jsx>{`
        /* =========================
           通知画面全体
           ========================= */
        .notice-page {
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

        /* =========================
           固定タイトルエリア
           ========================= */
        .title-area {
          position: fixed;
          top: 70px; /* ヘッダーの真下からスタート */
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          
          background-color: #ffffff; 
          
          /* ★修正箇所：下にも「10px」の白い余白を追加する */
          padding: 14px 0 10px 0; 
          
          display: flex;
          justify-content: center;
          z-index: 900;
        }

        /* =========================
           通知タイトル
           ========================= */
        .notice-title {
          width: 120px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;

          border: 1px solid #cccccc;
          border-radius: 6px;
          background-color: #ffffff;

          font-size: 18px;
          font-weight: normal;
          color: #333333;
          position: relative;
          flex-shrink: 0;

          /* ★marginを使うと背景が塗られず貫通の原因になるため、絶対に0にする */
          margin: 0; 
        }

        /* 四隅の青い点 */
        .notice-title::before {
          content: "";
          position: absolute;
          width: 5px;
          height: 5px;
          top: 4px;
          left: 4px;
          border-radius: 50%;
          background-color: #5fc2ea;
          box-shadow:
            107px 0 #5fc2ea,
            0 28px #5fc2ea,
            107px 28px #5fc2ea;
        }

        /* =========================
           通知メイン
           ========================= */
        .notice-main {
          flex: 1;
          overflow-y: auto; 
          width: 100%;
          
          /* ★最初のリストの位置を計算
             ヘッダー(90) + 上余白(14) + タイトル(43) + リストまでの隙間(20) = 167px */
          padding-top: 147px; 
          padding-bottom: 90px; 
          box-sizing: border-box;
          
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* =========================
           通知一覧
           ========================= */
        .notification-list {
          width: 100%;
          border-top: 1px solid #dddddd; 
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}