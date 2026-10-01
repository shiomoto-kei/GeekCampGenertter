"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { iconImageUrl, type IconOption } from "@/lib/icons";

export default function Header() {
  const [accountIconUrl, setAccountIconUrl] = useState<string | null>(null);

  const loadAccountIcon = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      let response = data.session
        ? await fetch("/api/session?mode=google", {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
            cache: "no-store",
          })
        : null;
      if (!response || response.status === 401) {
        response = await fetch("/api/session?mode=guest", { cache: "no-store" });
      }
      if (!response.ok) return;
      const result = await response.json();
      const iconId = result.profile?.icon_id;
      if (!result.exists || !iconId) {
        setAccountIconUrl(null);
        return;
      }

      const iconsResponse = await fetch("/api/icons", { cache: "no-store" });
      if (!iconsResponse.ok) return;
      const iconsResult = await iconsResponse.json();
      const icon = (iconsResult.icons as IconOption[] | undefined)?.find((item) => item.id === iconId);
      setAccountIconUrl(iconImageUrl(icon?.image_path));
    } catch {
      setAccountIconUrl(null);
    }
  }, []);

  useEffect(() => {
    void loadAccountIcon();
    window.addEventListener("profile-updated", loadAccountIcon);
    return () => window.removeEventListener("profile-updated", loadAccountIcon);
  }, [loadAccountIcon]);

  return (
    <>
      <header className="header">
        {/* アカウント画像 */}
        <Link
          className="account-image"
          href="/mypage"
          aria-label="マイページへ"
          style={{
            display: "block",
            width: 50,
            height: 50,
            flex: "0 0 50px",
            marginLeft: 32,
            overflow: "hidden",
            borderRadius: "50%",
            clipPath: "circle(50% at 50% 50%)",
          }}
        >
          {accountIconUrl && (
            <img
              src={accountIconUrl}
              alt="プロフィールアイコン"
              style={{ display: "block", width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
            />
          )}
        </Link>

        {/* ロゴ */}
        <Link
          className="logo"
          href="/home"
          aria-label="ホームへ"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 200,
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src="/genertter_logo.png"
            alt="Genertter"
            width={200}
            height={70}
          />
        </Link>
      </header>

      <style jsx>{`
        /* =========================
           ヘッダー全体
           ========================= */
        .header {
          position: fixed; /* ★画面に固定 */
          top: 0;          /* ★一番上に張り付ける */
          left: 0;         /* ★左端から */
          width: 100%;     /* ★横幅いっぱい */
          height: 70px;

          display: flex;
          align-items: center;

          background-color: #a5e386;
          z-index: 1000;   /* ★他のコンテンツの下に隠れないように手前にする */
        }

        /* =========================
           アカウント画像
           ========================= */
        .account-image {
          width: 50px;
          height: 50px;

          margin-left: 32px;

          background-color: #d3d3d3;

          border-radius: 50%;
          overflow: hidden;
          clip-path: circle(50% at 50% 50%);
          flex-shrink: 0;
          display: block;
          cursor: pointer;
          padding: 0;
          line-height: 0;
        }

        .account-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        /* =========================
           ロゴ
           ========================= */
        .logo {
          position: absolute;

          left: 50%;
          top: 50%;
          width: 200px;

          transform: translate(-50%, -50%);

          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .logo img {
          width: 100%;
          height: auto;

          object-fit: contain;
        }
      `}</style>
    </>
  );
}
