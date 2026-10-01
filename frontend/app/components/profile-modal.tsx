"use client";

import { useEffect, useState } from "react";
import IconPicker from "./icon-picker";
import { supabase } from "@/lib/supabase/client";
import type { IconOption } from "@/lib/icons";

type ProfileModalProps = {
  isOpen: boolean;
  currentIconId: number | null;
  isGuest: boolean;
  onClose: () => void;
  onSaved: (iconId: number, imagePath: string) => void;
};

export default function ProfileModal({ isOpen, currentIconId, isGuest, onClose, onSaved }: ProfileModalProps) {
  if (!isOpen) return null;
  return <ProfileModalContent currentIconId={currentIconId} isGuest={isGuest} onClose={onClose} onSaved={onSaved} />;
}

function ProfileModalContent({ currentIconId, isGuest, onClose, onSaved }: Omit<ProfileModalProps, "isOpen">) {
  const [icons, setIcons] = useState<IconOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(currentIconId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadIcons() {
      try {
        const response = await fetch("/api/icons", { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.icons)) throw new Error(result.error ?? "アイコン一覧を取得できませんでした。");
        if (!controller.signal.aborted) setIcons(result.icons as IconOption[]);
      } catch (error) {
        if (!controller.signal.aborted) setErrorMessage(error instanceof Error ? error.message : "アイコン一覧を取得できませんでした。");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadIcons();
    return () => controller.abort();
  }, []);

  async function saveIcon() {
    if (selectedId === null) {
      setErrorMessage("アイコンを選んでください。");
      return;
    }
    setErrorMessage("");
    setIsSaving(true);
    try {
      let accessToken: string | null = null;
      if (!isGuest) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error("Googleログインを確認できませんでした。");
        accessToken = data.session.access_token;
      }
      const response = await fetch("/api/profile/icon", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ iconId: selectedId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "アイコンを保存できませんでした。");
      onSaved(result.iconId as number, result.imagePath as string);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "アイコンを保存できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-label="アイコンを変更" onClick={(event) => event.stopPropagation()}>
        <h2>アイコンを変更</h2>
        {isLoading ? <p>アイコンを読み込み中…</p> : <IconPicker icons={icons} selectedId={selectedId} onSelect={setSelectedId} name="profile-icon" />}
        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        <div className="actions">
          <button type="button" onClick={onClose}>キャンセル</button>
          <button type="button" className="save-button" onClick={() => void saveIcon()} disabled={isLoading || isSaving || selectedId === null}>
            {isSaving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay { position: fixed; inset: 70px 0; z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(255,255,255,.85); }
        .modal-content { width: min(100%, 360px); max-height: 100%; overflow-y: auto; padding: 24px 20px; border: 2px solid #299d48; border-radius: 20px; background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,.1); }
        h2 { margin: 0 0 18px; text-align: center; font-size: 18px; color: #333; }
        p { margin: 8px 0; font-size: 14px; color: #333; }
        .error-message { color: #a31313; }
        .actions { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
        button { padding: 8px 16px; border: 1px solid #aaa; border-radius: 8px; background: #fff; color: #333; cursor: pointer; }
        .save-button { border-color: #aee68c; background: #aee68c; font-weight: 700; }
        button:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
