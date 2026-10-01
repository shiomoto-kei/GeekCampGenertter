"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import IconPicker from "../components/icon-picker";
import { supabase } from "@/lib/supabase/client";
import { iconImageUrl, type IconOption } from "@/lib/icons";

type StyleProfile = { id: number; name: string };

export default function Setup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [styles, setStyles] = useState<StyleProfile[]>([]);
  const [styleId, setStyleId] = useState("");
  const [icons, setIcons] = useState<IconOption[]>([]);
  const [iconId, setIconId] = useState<number | null>(null);
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  const [isLoadingIcons, setIsLoadingIcons] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [iconError, setIconError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStyles() {
      try {
        const response = await fetch("/api/setup", { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.styles)) {
          throw new Error("スタイル一覧を取得できませんでした。");
        }
        const nextStyles = result.styles as StyleProfile[];
        setStyles(nextStyles);
        if (nextStyles.length > 0) setStyleId(String(nextStyles[0].id));
      } catch {
        if (!controller.signal.aborted) setErrorMessage("スタイル一覧を読み込めませんでした。接続設定を確認してください。");
      } finally {
        if (!controller.signal.aborted) setIsLoadingStyles(false);
      }
    }

    loadStyles();
    async function loadIcons() {
      try {
        const response = await fetch("/api/icons", { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.icons)) throw new Error("アイコン一覧を取得できませんでした。");
        if (!controller.signal.aborted) setIcons(result.icons as IconOption[]);
      } catch {
        if (!controller.signal.aborted) setIconError("アイコンを読み込めませんでした。後からプロフィールで設定できます。");
      } finally {
        if (!controller.signal.aborted) setIsLoadingIcons(false);
      }
    }
    loadIcons();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !styleId) {
      setErrorMessage("名前とスタイルを入力してね！");
      return;
    }
    if (icons.length > 0 && iconId === null) {
      setErrorMessage("アイコンを選んでね！");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const mode = new URLSearchParams(window.location.search).get("mode") === "google" ? "google" : "guest";
      let accessToken: string | undefined;

      if (mode === "google") {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          throw new Error("Googleログインを確認できませんでした。ログイン画面からやり直してください。");
        }
        accessToken = data.session.access_token;
      }

      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, name, styleId: Number(styleId), iconId, accessToken }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "プロフィールを保存できませんでした。");
      }

      router.replace("/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "プロフィールを保存できませんでした。");
      setIsSubmitting(false);
    }
  }

  const selectedIcon = icons.find((icon) => icon.id === iconId);
  const selectedIconUrl = iconImageUrl(selectedIcon?.image_path);

  return (
    <div className="setup-page">
      {/* 共通のヘッダー */}
      <Header />

      <form className="setup-main" onSubmit={handleSubmit}>
        
        {/* =========================
            タイトル枠
            ========================= */}
        <div className="title-wrapper">
          <span className="title-dots-right"></span>
          <h1 className="page-title">初期設定</h1>
        </div>

        {/* =========================
            ニックネーム入力
            ========================= */}
        <div className="nickname-area">
          <input
            type="text"
            className="nickname-input"
            placeholder="ニックネームを入力してね"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={50}
            required
          />
        </div>

        {/* =========================
            説明テキスト
            ========================= */}
        <p className="description-text">
          名前・投稿スタイル・アイコンを選んでね。<br />
          文章の雰囲気は後から変更できるよ！
        </p>

        {/* =========================
            アイコンと入力エリア
            ========================= */}
        <div className="profile-setup-area">
          {/* 左側の丸いアイコン枠 */}
          <div className="profile-icon-placeholder">
            {selectedIconUrl && <img src={selectedIconUrl} alt={selectedIcon?.name ?? "選んだアイコン"} />}
          </div>
          
          {/* 右側の入力欄 */}
          <div className="profile-inputs">
            <label className="input-row">
              <span className="input-label">スタイル：</span>
              <select className="style-select" value={styleId} onChange={(event) => setStyleId(event.target.value)} required>
                {styles.map((style) => (
                  <option key={style.id} value={style.id}>{style.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="icon-picker-area">
          {isLoadingIcons ? <p>アイコンを読み込み中…</p> : <IconPicker icons={icons} selectedId={iconId} onSelect={setIconId} name="setup-icon" />}
          {iconError && <p role="status" className="setup-error">{iconError}</p>}
        </div>

        {/* =========================
            始めるボタン
            ========================= */}
        <button className="start-button" type="submit" disabled={isLoadingStyles || isLoadingIcons || isSubmitting || styles.length === 0}>
          {isSubmitting ? "保存中…" : "始める！"}
        </button>
        {errorMessage && <p role="alert" className="setup-error">{errorMessage}</p>}

      </form>

      <style jsx>{`
        /* =========================
           画面全体
           ========================= */
        .setup-page {
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

        .setup-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          
          padding-top: 110px;
          padding-bottom: 40px;
          padding-left: 20px;
          padding-right: 20px;
          
          overflow-y: auto;
          box-sizing: border-box;
        }

        /* =========================
           タイトル枠 (4つの青い点)
           ========================= */
        .title-wrapper {
          position: relative;
          border: 1px solid #cccccc;
          border-radius: 6px;
          padding: 8px 30px;
          text-align: center;
          margin-bottom: 50px; /* エラーメッセージ用のスペースを考慮して少し詰める */
        }

        .page-title {
          font-size: 18px;
          font-weight: normal;
          color: #333333;
          margin: 0;
        }

        .title-wrapper::before,
        .title-wrapper::after {
          content: "";
          position: absolute;
          left: 6px;
          width: 4px;
          height: 4px;
          background-color: #5fc2ea;
          border-radius: 50%;
        }
        .title-wrapper::before { top: 6px; }
        .title-wrapper::after { bottom: 6px; }

        .title-dots-right::before,
        .title-dots-right::after {
          content: "";
          position: absolute;
          right: 6px;
          width: 4px;
          height: 4px;
          background-color: #5fc2ea;
          border-radius: 50%;
        }
        .title-dots-right::before { top: 6px; }
        .title-dots-right::after { bottom: 6px; }

        /* =========================
           ニックネーム入力
           ========================= */
        .nickname-area {
          width: 85%;
          margin-bottom: 40px;
        }

        .nickname-input {
          width: 100%;
          border: none;
          border-bottom: 2px solid #333333; 
          padding: 8px;
          font-size: 16px;
          text-align: center;
          outline: none;
          color: #111111;
          background-color: transparent;
        }

        .nickname-input::placeholder {
          color: #888888;
        }

        /* =========================
           説明テキスト
           ========================= */
        .description-text {
          text-align: center;
          font-size: 18px;
          line-height: 1.6;
          color: #111111;
          margin: 0 0 40px 0;
        }

        /* =========================
           アイコンと入力エリア
           ========================= */
        .profile-setup-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 24px;
          width: 100%;
        }

        .profile-icon-placeholder {
          width: 110px;
          height: 110px;
          background-color: #d9d9d9;
          border-radius: 50%;
          flex-shrink: 0;
          overflow: hidden;
        }

        .profile-icon-placeholder img { width: 100%; height: 100%; object-fit: cover; }
        .icon-picker-area { width: 100%; margin-bottom: 24px; }

        .profile-inputs {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }

        .input-row {
          display: flex;
          align-items: center;
          font-size: 20px;
          color: #111111;
          gap: 8px;
          flex-wrap: nowrap;
          min-width: 0;
        }

        .input-label {
          flex: 0 0 auto;
          white-space: nowrap;
        }

        .style-select {
          flex: 1;
          width: 0;
          min-width: 0;
          height: 32px;
          border: 1px solid #727272;
          border-radius: 6px;
          outline: none;
          font-size: 14px;
          background: #ffffff;
          color: #111111;
        }

        /* =========================
           始めるボタン
           ========================= */
        .start-button {
          background-color: #d2f6c5;
          border: 1px solid #b5dfa4;
          border-radius: 10px;
          padding: 12px 48px;
          font-size: 20px;
          font-weight: normal;
          color: #000000;
          cursor: pointer;
        }

        .start-button:active {
          opacity: 0.7;
        }

        .start-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .setup-error {
          max-width: 280px;
          color: #a31313;
          font-size: 14px;
          line-height: 1.5;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
