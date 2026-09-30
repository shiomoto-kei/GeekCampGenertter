"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthComplete() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

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

        const response = await fetch("/api/session?mode=google", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? "プロフィールを確認できませんでした。");
        }

        if (active) router.replace(result.exists ? "/home" : "/setup?mode=google");
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Googleログインを完了できませんでした。");
        }
      }
    }

    completeLogin();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="auth-complete">
      {errorMessage ? (
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
      `}</style>
    </main>
  );
}
