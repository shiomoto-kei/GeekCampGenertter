"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import PostCard from "../components/post-card";
// ★ モーダル部品を読み込む
import ProfileModal from "../components/profile-modal";
import ConfirmModal from "../components/confirm-modal";
import { supabase } from "@/lib/supabase/client";

export default function MyPage() {
  const router = useRouter();
  // ★ モーダルの開閉状態
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("読み込み中…");
  const [styleName, setStyleName] = useState("");
  const [loginLabel, setLoginLabel] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data } = await supabase.auth.getSession();
        const mode = data.session ? "google" : "guest";
        const response = await fetch(`/api/session?mode=${mode}`, {
          headers: data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {},
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok || !result.exists) return;

        const stylesResponse = await fetch("/api/setup", { cache: "no-store" });
        const stylesResult = await stylesResponse.json();
        const selectedStyle = stylesResult.styles?.find((style: { id: number }) => style.id === result.profile.default_style_id);

        if (active) {
          setProfileName(result.profile.name);
          setStyleName(selectedStyle?.name ?? "スタイル未設定");
          setLoginLabel(data.session?.user.email ?? "ゲスト利用中");
          setIsGuest(!data.session);
        }
      } catch {
        if (active) setProfileName("プロフィールを読み込めませんでした");
      }
    }

    loadProfile();
    return () => { active = false; };
  }, [router]);

  async function handleLogout() {
    setLogoutError("");
    try {
      if (!isGuest) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }

      setIsLogoutModalOpen(false);
      router.replace("/login");
    } catch {
      setLogoutError("ログアウトに失敗しました。もう一度お試しください。");
      setIsLogoutModalOpen(false);
    }
  }

  return (
    <div className="page">
      <Header />

      <div className="fixed-profile-area">
        <section className="profile-frame">
          <div className="profile-inner">
            <div className="profile-row">
              <div className="profile-icon"></div>
              <div className="profile-name-area">
                <span className="profile-name">{profileName}</span>
                <span className="profile-age">{styleName}</span>
              </div>
            </div>

            <p className="profile-mail">
              {loginLabel}
            </p>
            {logoutError && <p role="alert" className="logout-error">{logoutError}</p>}

            <div className="profile-buttons">
              {/* ★ クリックでプロフィールモーダルを開く */}
              <button type="button" className="btn-change" onClick={() => setIsProfileModalOpen(true)}>
                編集する
              </button>
              {/* ★ クリックでログアウトモーダルを開く */}
              <button type="button" className="btn-logout" onClick={() => setIsLogoutModalOpen(true)}>
                {isGuest ? "ログイン画面へ" : "ログアウト"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <main className="content">
        <div className="post-list">
          <PostCard userName="たになカッター" text="今日の授業まじでだるすぎてくか" showDelete={true}/>
          <PostCard userName="たになカッター" text="今日の授業まじでだるすぎてくか" showDelete={true}/>
          <PostCard userName="たになカッター" text="今日の授業まじでだるすぎてくか" showDelete={true}/>
        </div>
      </main>

      <Footer />

      {/* =========================
          追加したモーダル
          ========================= */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title={isGuest ? "ログイン画面へ" : "ログアウト"}
        message={isGuest ? "ゲスト情報を残したままログイン画面へ戻りますか？" : "ログアウトしてもよろしいですか？"}
        confirmText={isGuest ? "戻る" : "ログアウト"}
        onConfirm={handleLogout}
      />

      {/* 以前と同じCSS（省略せずにそのまま使用してください） */}
      <style jsx>{`
        .page { position: relative; width: 100%; max-width: 430px; height: 100dvh; margin: 0 auto; display: flex; flex-direction: column; background: #ffffff; overflow: hidden; }
        .fixed-profile-area { position: fixed; top: 70px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; background-color: #ffffff; padding: 10px 0 20px; display: flex; justify-content: center; z-index: 900; }
        .profile-frame { position: relative; width: 88%; max-width: 320px; aspect-ratio: 290 / 176; margin: 0; background: url("/mycard.png") center / 100% 100% no-repeat; }
        .profile-inner { position: absolute; top: 26%; left: 6%; right: 6%; bottom: 9%; display: flex; flex-direction: column; justify-content: space-between; }
        .profile-row { display: flex; align-items: center; gap: 14px; padding: 4px 0 0 10px; }
        .profile-icon { width: 58px; height: 58px; flex-shrink: 0; border-radius: 50%; background: #d9d9d9; }
        .profile-name-area { flex: 1; display: flex; flex-direction: column; align-items: flex-end; padding-right: 8px; }
        .profile-name { align-self: flex-start; margin-left: 16px; font-size: 16px; font-weight: 700; color: #111; }
        .profile-age { margin-top: 4px; font-size: 14px; color: #111; }
        .profile-mail { margin: 0; text-align: center; font-size: 9px; color: #aaa; white-space: nowrap; }
        .profile-buttons { display: flex; justify-content: space-between; padding: 0 12px 4px; }
        .profile-buttons button { height: 18px; padding: 0; border-radius: 4px; font-size: 8.5px; cursor: pointer; }
        .btn-change { width: 62px; border: 1px solid #999; background: #fff; color: #222; }
        .btn-logout { width: 62px; border: none; background: #ff4d4d; color: #fff; }
        .logout-error { margin: 0; color: #a31313; font-size: 9px; text-align: center; }
        .content { flex: 1; overflow-y: auto; width: 100%; display: flex; flex-direction: column; align-items: center; padding-top: 300px; padding-bottom: 90px; box-sizing: border-box; }
        .post-list { width: 95%; display: flex; flex-direction: column; gap: 20px; }
      `}</style>
    </div>
  );
}
