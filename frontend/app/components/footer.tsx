"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

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
          <span className={`footer-icon notice-icon ${pathname === "/notice" ? "active-icon" : ""}`}></span>
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
          
          /* 強制的にグレー */
          color: #727272 !important; 
        }

        .active-text {
          /* 現在のページなら強制的に緑 */
          color: #299d48 !important; 
        }

        /* =========================
           アイコンの色と形の設定
           ========================= */
        .footer-icon {
          display: block;
          margin: 0 auto;

          width: 25px;
          height: 25px;

          /* 強制的にグレー */
          background-color: #727272 !important;

          mask-repeat: no-repeat;
          mask-position: center;
          mask-size: contain;

          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
          -webkit-mask-size: contain;
        }

        .active-icon {
          /* 現在のページなら強制的に緑 */
          background-color: #299d48 !important; 
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