"use client";

import { useEffect, useRef, useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import NotificationItem from "../components/notification-item";
import { supabase } from "@/lib/supabase/client";
import { iconImageUrl } from "@/lib/icons";

type NoticeData = {
  id: number;
  actorName: string;
  actorIconPath: string | null;
  type: "reply" | "reaction";
  postId: number | null;
  postPreview: string | null;
  postImageUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function Notice() {
  const [notifications, setNotifications] = useState<NoticeData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const loadingMoreRef = useRef(false);
  const readAllVersion = useRef(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        const response = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "通知を取得できませんでした。");
        if (active) {
          setNotifications(result.notifications ?? []);
          setUnreadCount(result.unreadCount);
          setHasMore(result.hasMore === true);
        }
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : "通知を取得できませんでした。");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function loadMore() {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError("");
    const readVersion = readAllVersion.current;
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Googleログインが必要です。");
      const response = await fetch(`/api/notifications?offset=${notifications.length}`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "通知を取得できませんでした。");
      const nextItems = (result.notifications ?? []) as NoticeData[];
      setNotifications((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        return [...current, ...nextItems.filter((item) => !existingIds.has(item.id)).map((item) =>
          readAllVersion.current === readVersion ? item : { ...item, isRead: true },
        )];
      });
      setHasMore(result.hasMore === true);
      if (readAllVersion.current === readVersion) setUnreadCount(result.unreadCount);
    } catch (error) {
      setLoadMoreError(error instanceof Error ? error.message : "通知を取得できませんでした。");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  async function markAllRead() {
    setUpdating(true);
    setErrorMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Googleログインが必要です。");
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "既読にできませんでした。");
      readAllVersion.current += 1;
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "既読にできませんでした。");
    } finally {
      setUpdating(false);
    }
  }

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
        {unreadCount > 0 && <button type="button" className="read-all" onClick={markAllRead} disabled={updating}>すべて既読にする（{unreadCount}件）</button>}
        {errorMessage && <p role="alert" className="notice-message">{errorMessage}</p>}
        {loading && <p className="notice-message">通知を読み込み中…</p>}
        {!loading && !errorMessage && notifications.length === 0 && <p className="notice-message">通知はまだありません</p>}
        <div className="notification-list">
          {notifications.map((item) => (
            <NotificationItem
              key={item.id}
              message={`${item.actorName}さんがあなたの投稿に${item.type === "reply" ? "返信しました" : "リアクションしました"}。`}
              iconUrl={iconImageUrl(item.actorIconPath)}
              postUrl={item.postId ? `/posts/${item.postId}?from=notice` : null}
              postPreview={item.postPreview}
              postImageUrl={item.postImageUrl}
              isRead={item.isRead}
              date={new Date(item.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            />
          ))}
        </div>
        {!loading && hasMore && (
          <div className="load-more-area">
            {loadMoreError && <p className="notice-message" role="alert">{loadMoreError}</p>}
            <button type="button" className="load-more-button" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? "読み込み中…" : loadMoreError ? "もう一度読み込む" : "もっと見る"}
            </button>
          </div>
        )}
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
        .read-all { align-self: flex-end; margin: 0 16px 12px; border: 0; background: transparent; color: #299d48; font-size: 13px; font-weight: 700; cursor: pointer; }
        .read-all:disabled { opacity: .5; cursor: wait; }
        .notice-message { margin: 24px 16px; color: #555; font-size: 14px; text-align: center; }
        .load-more-area { width: 100%; padding: 20px 16px; box-sizing: border-box; text-align: center; }
        .load-more-area .notice-message { margin: 0 0 12px; color: #b42318; }
        .load-more-button { padding: 10px 24px; border: 1px solid #299d48; border-radius: 20px; background: #fff; color: #237d3c; font-size: 14px; font-weight: 700; cursor: pointer; }
        .load-more-button:disabled { opacity: .55; cursor: wait; }
      `}</style>
    </div>
  );
}
