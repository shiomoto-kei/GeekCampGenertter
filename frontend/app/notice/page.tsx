"use client";

import Header from "../components/header";
import Footer from "../components/footer";
import NotificationItem from "../components/notification-item";

export default function Notice() {
  return (
    <div className="notice-page">
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ（ここだけスクロールする） */}
      <main className="notice-main">
        {/* 通知タイトル */}
        <h1 className="notice-title">
          通知
        </h1>

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
          height: 100dvh; /* 画面の高さいっぱいに固定 */
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          overflow: hidden; /* 外側のスクロールを消す */
        }

        /* =========================
           通知メイン
           ========================= */
        .notice-main {
          flex: 1;
          overflow-y: auto; /* コンテンツ部分だけスクロールさせる */
          width: 100%;
          
          /* ヘッダー(90px)の下、フッター(70px)の上の余白を確保 */
          padding-top: 90px; 
          padding-bottom: 90px;
          box-sizing: border-box;
          
          display: flex;
          flex-direction: column;
          align-items: center;
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
          
          /* 下のリストとの間隔 */
          margin: 0 auto 20px;
          box-sizing: border-box;

          border: 1px solid #cccccc;
          border-radius: 6px;
          background-color: #ffffff;

          font-size: 18px;
          font-weight: normal;
          color: #333333;
          position: relative;
          flex-shrink: 0;
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
          
          /* 幅120px、高さ38pxに合わせて影の位置を微調整 */
          box-shadow:
            107px 0 #5fc2ea,
            0 28px #5fc2ea,
            107px 28px #5fc2ea;
        }

        /* =========================
           通知一覧
           ========================= */
        .notification-list {
          width: 100%;
          /* リストの一番上にも線を引く */
          border-top: 1px solid #dddddd; 
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}