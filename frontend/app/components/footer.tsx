"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  return (
    <>
      <footer className="footer">
        {/* Home */}
        <Link
          href="/home"
          className={`footer-item ${
            pathname === "/home" ? "active" : ""
          }`}
        >
          <span className="footer-icon home-icon"></span>
          <span className="footer-text">Home</span>
        </Link>

        {/* Notice */}
        <Link
          href="/notice"
          className={`footer-item ${
            pathname === "/notice" ? "active" : ""
          }`}
        >
          <span className="footer-icon notice-icon"></span>
          <span className="footer-text">Notice</span>
        </Link>

        {/* mypage */}
        <Link
          href="/mypage"
          className={`footer-item ${
            pathname === "/mypage" ? "active" : ""
          }`}
        >
          <span className="footer-icon mypage-icon"></span>
          <span className="footer-text">mypage</span>
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
          height: 90px;

          display: grid;
          grid-template-columns: repeat(3, 1fr);

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

          color: #727272;
          text-decoration: none;

          font-size: 14px;
        }

        /* 現在いるページ */
        .footer-item.active {
          color: #299d48;
        }

        /* =========================
           アイコン
           ========================= */
        .footer-icon {
          display: block;

          width: 32px;
          height: 32px;

          background-color: currentColor;

          mask-repeat: no-repeat;
          mask-position: center;
          mask-size: contain;

          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
          -webkit-mask-size: contain;
        }

        /* Home */
        .home-icon {
          mask-image: url("/home-icon.svg");
          -webkit-mask-image: url("/home-icon.svg");
        }

        /* Notice */
        .notice-icon {
          mask-image: url("/notice-icon.svg");
          -webkit-mask-image: url("/notice-icon.svg");
        }

        /* mypage */
        .mypage-icon {
          width: 31px;
          height: 31px;

          mask-image: url("/mypage-icon.svg");
          -webkit-mask-image: url("/mypage-icon.svg");
        }

        /* =========================
           文字
           ========================= */
        .footer-text {
          line-height: 1;
          text-align: center;
        }
      `}</style>
    </>
  );
}
