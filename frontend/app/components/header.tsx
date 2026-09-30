"use client";

import Image from "next/image";

export default function Header() {
  return (
    <>
      <header className="header">
        {/* アカウント画像 */}
        <div className="account-image">
          {/* 
            今は仮のグレーの丸。
            後からアカウント画像に変更する予定。
          */}
        </div>

        {/* ロゴ */}
        <div className="logo">
          <Image
            src="/genertter-logo.png"
            alt="Genertter"
            width={200}
            height={70}
          />
        </div>
      </header>

      <style jsx>{`
        /* =========================
           ヘッダー全体
           ========================= */
        .header {
          width: 100%;
          height: 120px;

          display: flex;
          align-items: center;

          position: relative;

          background-color: #a5e386;
        }

        /* =========================
           アカウント画像
           ========================= */
        .account-image {
          width: 74px;
          height: 74px;

          margin-left: 40px;

          background-color: #d3d3d3;

          border-radius: 50%;
        }

        /* =========================
           ロゴ
           ========================= */
        .logo {
          position: absolute;

          left: 50%;
          top: 50%;

          transform: translate(-50%, -50%);

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo img {
          width: 200px;
          height: auto;

          object-fit: contain;
        }
      `}</style>
    </>
  );
}
