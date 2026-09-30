"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

type GateState = "checking" | "allowed" | "login" | "google" | "setup" | "error";
const publicPaths = new Set(["/", "/login", "/setup", "/auth/complete"]);

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [checked, setChecked] = useState<{ path: string; state: GateState }>({ path: "", state: "checking" });
  const [retry, setRetry] = useState(0);
  const isPublic = publicPaths.has(pathname);
  const state = checked.path === pathname ? checked.state : "checking";

  useEffect(() => {
    if (isPublic) return;
    let active = true;

    async function checkAccess() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          const response = await fetch("/api/session?mode=google", {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
            cache: "no-store",
          });
          if (response.status === 401) {
            if (active) setChecked({ path: pathname, state: pathname === "/notice" ? "google" : "login" });
            return;
          }
          if (!response.ok) throw new Error("Googleログインの確認に失敗しました");
          const result = await response.json();
          if (active) setChecked({ path: pathname, state: result.exists ? "allowed" : "setup" });
          return;
        }

        if (pathname === "/notice") {
          if (active) setChecked({ path: pathname, state: "google" });
          return;
        }

        const response = await fetch("/api/session?mode=guest", { cache: "no-store" });
        if (!response.ok) throw new Error("ゲスト情報の確認に失敗しました");
        const result = await response.json();
        if (active) setChecked({ path: pathname, state: result.exists ? "allowed" : "login" });
      } catch {
        if (active) setChecked({ path: pathname, state: "error" });
      }
    }

    checkAccess();
    return () => { active = false; };
  }, [isPublic, pathname, retry]);

  if (isPublic) return <>{children}</>;

  const blocked = state !== "allowed";
  const title = state === "google" ? "通知を見るにはGoogleログインが必要です" :
    state === "setup" ? "プロフィール設定を完了してください" :
    state === "error" ? "ログイン状態を確認できませんでした" :
    state === "login" ? "この画面を見るにはログインが必要です" : "ログイン状態を確認中…";

  return (
    <>
      <div aria-hidden={blocked} inert={blocked}>{children}</div>
      {blocked && (
        <div className="auth-gate" role="dialog" aria-modal="true" aria-label={title}>
          <div className="auth-gate-card">
            <h2>{title}</h2>
            {state === "login" && <p>Googleログインまたはゲスト登録から始められます。</p>}
            {state === "google" && <p>ゲスト利用中でも、通知機能にはGoogleログインが必要です。</p>}
            {state === "error" && <p>通信状態を確認して、もう一度お試しください。</p>}
            {state === "setup" && <Link href="/setup?mode=google" className="auth-gate-button">プロフィール設定へ</Link>}
            {(state === "login" || state === "google") && <Link href="/login" className="auth-gate-button">ログイン画面へ</Link>}
            {state === "error" && <button type="button" className="auth-gate-button" onClick={() => setRetry((value) => value + 1)}>再試行</button>}
          </div>
        </div>
      )}
      <style jsx>{`
        .auth-gate { position: fixed; inset: 0; z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(15, 25, 20, 0.78); }
        .auth-gate-card { width: min(100%, 360px); padding: 28px 24px; border-radius: 16px; background: #fff; text-align: center; box-shadow: 0 16px 48px rgba(0,0,0,.2); }
        h2 { margin: 0 0 12px; color: #1d3527; font-size: 19px; line-height: 1.5; }
        p { margin: 0 0 20px; color: #526359; font-size: 14px; line-height: 1.6; }
        .auth-gate-button { display: inline-block; border: 0; border-radius: 8px; padding: 12px 22px; color: #fff; background: #299d48; font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; }
      `}</style>
    </>
  );
}
