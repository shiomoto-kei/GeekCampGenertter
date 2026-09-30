"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Footer() {
  const pathname = usePathname();
  const [hasUnreadNotice, setHasUnreadNotice] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadUnread() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (active) setHasUnreadNotice(false);
          return;
        }
        const response = await fetch("/api/notifications?count=unread", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("通知件数を取得できませんでした");
        const result = await response.json();
        if (active) setHasUnreadNotice(result.unreadCount > 0);
      } catch {
        if (active) setHasUnreadNotice(false);
      }
    }
    loadUnread();
    window.addEventListener("focus", loadUnread);
    window.addEventListener("notifications-updated", loadUnread);
    return () => {
      active = false;
      window.removeEventListener("focus", loadUnread);
      window.removeEventListener("notifications-updated", loadUnread);
    };
  }, [pathname]);

  return (
    <>
      <footer className="footer">
        {/* Home */}
        <Link href="/home" className="footer-item">
          <span className={`footer-icon home-icon ${pathname === "/home" ? "active-icon" : ""}`}></span>
          <span className={`footer-text ${pathname === "/home" ? "active-text" : ""}`}>Home</span>
        </Link>

        {/* Notice */}
        <Link href="/notice" className="footer-item">
          <div className="icon-wrapper">
            <span className={`footer-icon notice-icon ${pathname === "/notice" ? "active-icon" : ""}`}></span>
            {hasUnreadNotice && <span className="notice-badge"></span>}
          </div>
          <span className={`footer-text ${pathname === "/notice" ? "active-text" : ""}`}>Notice</span>
        </Link>

        {/* mypage */}
        <Link href="/mypage" className="footer-item">
          <span className={`footer-icon mypage-icon ${pathname === "/mypage" ? "active-icon" : ""}`}></span>
          <span className={`footer-text ${pathname === "/mypage" ? "active-text" : ""}`}>mypage</span>
        </Link>
      </footer>

      <style jsx>{`
        /* =========================
           フッター全体
           ========================= */
        .footer {
          position: fixed;
          left: 0;
          bottom: 0;

          width: 100%;
          height: 70px;

          display: flex;
          justify-content: center;
          align-items: center;
          gap: 100px;

          box-sizing: border-box;

          background-color: #ffffff;
          border-top: 2px solid #bdbdbd;

          z-index: 1000;
        }

        /* =========================
           各メニュー
           ========================= */
        .footer-item {
          width: 100%;
          height: 100%;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 6px;

          box-sizing: border-box;
          text-decoration: none;
        }

        /* =========================
           文字の色設定
           ========================= */
        .footer-text {
          font-size: 12px;
          line-height: 1;
          text-align: center;
          
          color: #727272 !important; 
        }

        .active-text {
          color: #299d48 !important; 
        }

        /* =========================
           アイコンと赤丸のラッパー
           ========================= */
        .icon-wrapper {
          position: relative;
          width: 25px;
          height: 25px;
          /* ★枠自体を強制的に中央揃えにする */
          margin: 0 auto; 
        }

        /* =========================
           アイコンの色と形の設定
           ========================= */
        .footer-icon {
          display: block;
          /* ★アイコン自体も強制的に中央揃えにする（元の設定を復活） */
          margin: 0 auto; 
          width: 25px;
          height: 25px;

          background-color: #727272 !important;

          mask-repeat: no-repeat;
          mask-position: center;
          mask-size: contain;

          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
          -webkit-mask-size: contain;
        }

        .active-icon {
          background-color: #299d48 !important; 
        }

        /* =========================
           通知の赤い丸（バッジ）
           ========================= */
        .notice-badge {
          position: absolute;
          top: -2px;
          right: -4px;
          width: 6px;
          height: 6px;
          background-color: #ff3b30;
          border-radius: 50%;
        }

        /* =========================
           各アイコンの画像指定
           ========================= */
        .home-icon {
          mask-image: url("/home-icon.svg");
          -webkit-mask-image: url("/home-icon.svg");
        }

        .notice-icon {
          mask-image: url("/notice-icon.svg");
          -webkit-mask-image: url("/notice-icon.svg");
        }

        .mypage-icon {
          width: 31px;
          height: 31px;

          mask-image: url("/mypage-icon.svg");
          -webkit-mask-image: url("/mypage-icon.svg");
        }
      `}</style>
    </>
  );
}
