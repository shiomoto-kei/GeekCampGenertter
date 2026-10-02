"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { copyPostDraftsForUpgrade, removeGuestPostDrafts } from "@/lib/post-drafts";

type GuestChoice = {
  guestId: number;
  guestName: string;
  googleId: number | null;
  googleExists: boolean;
};

export default function AuthComplete() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [guestChoice, setGuestChoice] = useState<GuestChoice | null>(null);
  const [pendingDraftMove, setPendingDraftMove] = useState<{ guestId: number; googleId: number } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function completeLogin() {
      try {
        const callbackParams = new URLSearchParams(window.location.hash.slice(1));
        if (callbackParams.has("error") || new URLSearchParams(window.location.search).has("error")) {
          throw new Error("Googleログインがキャンセルされたか、認証に失敗しました。");
        }

        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          throw new Error("Googleログインを完了できませんでした。もう一度お試しください。");
        }

        const [response, guestResponse] = await Promise.all([fetch("/api/session?mode=google", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        }), fetch("/api/session?mode=guest", { cache: "no-store" })]);
        const result = await response.json();
        const guestResult = await guestResponse.json();
        if (!response.ok || !guestResponse.ok) {
          throw new Error(result.error ?? guestResult.error ?? "プロフィールを確認できませんでした。");
        }

        if (!active) return;
        if (guestResult.exists && guestResult.profile) {
          setGuestChoice({
            guestId: guestResult.profile.id,
            guestName: guestResult.profile.name,
            googleId: result.exists ? result.profile.id : null,
            googleExists: result.exists,
          });
        } else {
          router.replace(result.exists ? "/home" : "/setup?mode=google");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Googleログインを完了できませんでした。");
        }
      }
    }

    completeLogin();
    return () => { active = false; };
  }, [router]);

  async function finishDraftMove(guestId: number, googleId: number) {
    if (guestId !== googleId) {
      await copyPostDraftsForUpgrade(guestId, googleId);
      await removeGuestPostDrafts(guestId);
    }
    setPendingDraftMove(null);
    router.replace("/home");
  }

  async function handleUpgrade() {
    if (!guestChoice || isBusy) return;
    setIsBusy(true);
    setErrorMessage("");
    try {
      // 既存 Google アカウントの下書きと衝突するなら、DB を変更する前に止める。
      if (guestChoice.googleId !== null) {
        await copyPostDraftsForUpgrade(guestChoice.guestId, guestChoice.googleId);
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) throw new Error("Googleログインを確認できませんでした。ログインし直してください。");
      const response = await fetch("/api/guest-upgrade", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "引き継ぎに失敗しました。");
      if (!Number.isSafeInteger(result.guestUserId) || !Number.isSafeInteger(result.googleUserId)) {
        throw new Error("引き継ぎ結果を確認できませんでした。画面を更新してください。");
      }

      setPendingDraftMove({ guestId: result.guestUserId, googleId: result.googleUserId });
      await finishDraftMove(result.guestUserId, result.googleUserId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "引き継ぎに失敗しました。");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReturnToGuest() {
    setIsBusy(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/home");
    } catch {
      setErrorMessage("ゲストに戻れませんでした。もう一度お試しください。");
      setIsBusy(false);
    }
  }

  return (
    <main className="auth-complete">
      {pendingDraftMove ? (
        <>
          <h1>投稿の引き継ぎは完了しました</h1>
          <p>ブラウザ内の下書きを確認できませんでした。元の下書きは消していません。再試行をおすすめします。</p>
          {errorMessage && <p role="alert">{errorMessage}</p>}
          <button type="button" disabled={isBusy} onClick={async () => {
            setIsBusy(true);
            setErrorMessage("");
            try { await finishDraftMove(pendingDraftMove.guestId, pendingDraftMove.googleId); }
            catch (error) { setErrorMessage(error instanceof Error ? error.message : "下書きを引き継げませんでした。"); }
            finally { setIsBusy(false); }
          }}>下書きの引き継ぎを再試行</button>
          <button type="button" disabled={isBusy} onClick={() => router.replace("/home")}>下書き未確認のままホームへ</button>
        </>
      ) : guestChoice ? (
        <>
          <h1>ゲストのデータを引き継ぎますか？</h1>
          <p>「{guestChoice.guestName}」の投稿・返信・リアクションをGoogleアカウントに引き継げます。</p>
          <p>{guestChoice.googleExists
            ? "Google側のプロフィール設定はそのまま残します。同じ投稿へのリアクションはGoogle側を優先します。"
            : "ゲストの名前・年代・アイコンも引き継ぎます。"}</p>
          {errorMessage && <p role="alert">{errorMessage}</p>}
          <button type="button" disabled={isBusy} onClick={handleUpgrade}>{isBusy ? "引き継ぎ中…" : "引き継ぐ"}</button>
          <button type="button" disabled={isBusy} onClick={() => router.replace(guestChoice.googleExists ? "/home" : "/setup?mode=google")}>今回は引き継がない</button>
          <button type="button" disabled={isBusy} onClick={handleReturnToGuest}>ゲストに戻る</button>
        </>
      ) : errorMessage ? (
        <>
          <p role="alert">{errorMessage}</p>
          <Link href="/login">ログイン画面に戻る</Link>
        </>
      ) : (
        <p role="status">ログインを確認しています…</p>
      )}
      <style jsx>{`
        .auth-complete {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 24px;
          text-align: center;
        }
        h1 { margin: 0; font-size: 21px; color: #173522; }
        p { margin: 0; line-height: 1.6; color: #3b4d41; }
        p[role="alert"] { color: #a31313; }
        button { width: min(100%, 320px); padding: 12px 16px; border: 1px solid #238044; border-radius: 8px; background: #e3f5df; color: #173522; cursor: pointer; }
        button:first-of-type { background: #299d48; color: #fff; font-weight: 700; }
        button:disabled { opacity: .6; cursor: wait; }
      `}</style>
    </main>
  );
}
