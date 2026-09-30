"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SupabaseTestPage() {
  const [result, setResult] = useState("未接続");

  async function checkConnection() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setResult(`接続エラー: ${error.message}`);
      return;
    }

    setResult(
      `Supabaseに接続できました。ログイン状態: ${
        data.session ? "ログイン中" : "未ログイン"
      }`,
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Supabase接続テスト</h1>
      <button type="button" onClick={checkConnection}>
        接続を確認
      </button>
      <p>{result}</p>
    </main>
  );
}