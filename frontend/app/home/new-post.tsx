"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { ALLOWED_POST_IMAGE_TYPES, MAX_POST_IMAGE_COUNT, preparePostImage, validatePostImage } from "@/lib/post-images";

type StyleProfile = { id: number; name: string };

type NewPostProps = {
  isOpen: boolean;
  parentPostId?: number | null;
  defaultStyleId?: number | null;
  currentUser?: { id: number; name: string } | null;
  onClose: () => void;
  onCreated: () => void;
};

async function getSessionOrGuest() {
  const current = await supabase.auth.getSession();
  if (current.error) throw current.error;
  if (current.data.session) return current.data.session;

  const guest = await supabase.auth.signInAnonymously();
  if (guest.error) throw guest.error;
  if (!guest.data.session) throw new Error("ゲスト認証を確認できませんでした。");
  return guest.data.session;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "投稿を保存できませんでした。";
}

export default function NewPost({ isOpen, ...props }: NewPostProps) {
  if (!isOpen) return null;
  return <NewPostContent {...props} />;
}

function NewPostContent({ parentPostId = null, defaultStyleId = null, currentUser = null, onClose, onCreated }: Omit<NewPostProps, "isOpen">) {
  const [styles, setStyles] = useState<StyleProfile[]>([]);
  const [styleId, setStyleId] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStyles() {
      setIsLoadingStyles(true);
      const { data, error } = await supabase
        .from("style_profiles")
        .select("id, name")
        .order("id", { ascending: true });

      if (cancelled) return;
      if (error) {
        setErrorMessage(`スタイルを読み込めませんでした: ${error.message}`);
      } else {
        const profiles = (data ?? []) as StyleProfile[];
        setStyles(profiles);
        const profileDefault = profiles.some((profile) => profile.id === defaultStyleId)
          ? String(defaultStyleId)
          : String(profiles[0]?.id ?? "");
        setStyleId((current) => current || profileDefault);
      }
      setIsLoadingStyles(false);
    }

    void loadStyles();
    return () => {
      cancelled = true;
    };
  }, [defaultStyleId]);

  function updateOriginalText(value: string) {
    setOriginalText(value);
    setConvertedText("");
  }

  async function convertText() {
    setErrorMessage(null);
    if (!styleId) {
      setErrorMessage("変換スタイルを選んでください。");
      return;
    }
    if (!originalText.trim()) {
      setErrorMessage("元の文章を入力してください。");
      return;
    }
    if (styles.length === 0) {
      setErrorMessage("変換スタイルの候補がありません。");
      return;
    }

    setIsConverting(true);
    try {
      const session = await getSessionOrGuest();
      const accessToken = session.access_token;

      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ styleProfileId: Number(styleId), originalText, profiles: styles }),
      });
      const result = await response.json() as {
        error?: string;
        convertedText?: string;
      };
      if (!response.ok) throw new Error(result.error || "文章を変換できませんでした。");
      setConvertedText(result.convertedText ?? "");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsConverting(false);
    }
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!originalText.trim() || !convertedText.trim() || !styleId) {
      setErrorMessage("スタイルと元の文章を入力して、先にAI変換してください。");
      return;
    }

    setIsSubmitting(true);
    const bucket = "post-images";
    const uploadedPaths: string[] = [];
    try {
      const preparedImages: File[] = [];
      for (const [index, file] of images.entries()) {
        setSubmitStage(`画像を最適化中…（${index + 1}/${images.length}）`);
        preparedImages.push(await preparePostImage(file));
      }

      const session = await getSessionOrGuest();

      for (const [index, file] of preparedImages.entries()) {
        setSubmitStage(`画像をアップロード中…（${index + 1}/${preparedImages.length}）`);
        const extension = file.type === "image/gif" ? "gif" : file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
        const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
        const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        uploadedPaths.push(data.path);
      }

      const tags = hashtags
        .split(/[\s,、]+/)
        .map((tag) => tag.replace(/^#+/, "").trim())
        .filter(Boolean);

      setSubmitStage("投稿を保存中…");
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          styleId: Number(styleId),
          originalText: originalText.trim(),
          convertedText: convertedText.trim(),
          hashtags: tags,
          imagePaths: uploadedPaths,
          parentPostId,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "投稿を保存できませんでした。");

      onCreated();
    } catch (error) {
      if (uploadedPaths.length > 0) await supabase.storage.from(bucket).remove(uploadedPaths);
      const message = getErrorMessage(error);
      setErrorMessage(
        /anonymous|anonymous sign-in|匿名/i.test(message)
          ? "ゲスト投稿を使うには、Supabaseで Anonymous Sign-Ins を有効にしてください。"
          : message,
      );
    } finally {
      setIsSubmitting(false);
      setSubmitStage("");
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={() => { if (!isSubmitting) onClose(); }}>
        <form className="modal-content" aria-busy={isSubmitting} onClick={(event) => event.stopPropagation()} onSubmit={submitPost}>
          <div className="modal-title-wrapper">
            <span className="modal-title-dots-right" />
          <h2 className="modal-title">{parentPostId ? "返信を投稿" : "新規投稿"}</h2>
          </div>
          {currentUser && <p className="posting-user">投稿者：{currentUser.name} <span>@{currentUser.id}</span></p>}

          <label className="field-label" htmlFor="post-style">変換スタイル</label>
          <select
            id="post-style"
            className="style-select"
            value={styleId}
            onChange={(event) => {
              setStyleId(event.target.value);
              setConvertedText("");
            }}
            disabled={isLoadingStyles || styles.length === 0}
            required
          >
            {styles.length === 0 && <option value="">{isLoadingStyles ? "読み込み中..." : "スタイルがありません"}</option>}
            {styles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
          </select>

          <label className="field-label" htmlFor="original-text">元の文章</label>
          <textarea
            id="original-text"
            className="modal-textarea"
            value={originalText}
            onChange={(event) => updateOriginalText(event.target.value)}
            maxLength={1000}
            required
          />

          {!parentPostId && <>
            <label className="field-label" htmlFor="post-images">写真（{images.length}/4枚・元画像は1枚5MBまで）</label>
            <input
              ref={imageInputRef}
              id="post-images"
              type="file"
              accept={ALLOWED_POST_IMAGE_TYPES.join(",")}
              multiple
              disabled={isSubmitting}
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                const invalid = selected.map(validatePostImage).find((message) => message !== null);
                if (invalid) {
                  setErrorMessage(invalid);
                  event.target.value = "";
                  return;
                }
                const existingKeys = new Set(images.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
                const additions = selected.filter((file) => {
                  const key = `${file.name}:${file.size}:${file.lastModified}`;
                  if (existingKeys.has(key)) return false;
                  existingKeys.add(key);
                  return true;
                });
                const availableSlots = MAX_POST_IMAGE_COUNT - images.length;
                setImages((current) => [...current, ...additions.slice(0, availableSlots)]);
                setErrorMessage(additions.length > availableSlots ? "写真は4枚まで選べます。選択済みの写真を外すと追加できます。" : null);
                event.target.value = "";
              }}
              className="visually-hidden"
              tabIndex={-1}
              aria-hidden="true"
            />
            <button className="image-picker-button" type="button" disabled={isSubmitting} onClick={() => imageInputRef.current?.click()}>
              <span aria-hidden="true">📷</span> 写真を追加
            </button>
            <p className="image-hint">静止画は投稿前に自動圧縮します。圧縮できない場合は元画像のまま投稿します。アニメーション画像は動きを維持します（1枚5MBまで）。</p>
            {images.length > 0 && <ul className="selected-images">
              {images.map((file, index) => <li key={`${file.name}-${index}`}>
                {file.name}
                <button type="button" disabled={isSubmitting} onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`${file.name}を削除`}>削除</button>
              </li>)}
              <li><button type="button" className="clear-images" disabled={isSubmitting} onClick={() => { setImages([]); setErrorMessage(null); }}>写真をすべて外す</button></li>
            </ul>}
          </>}

          <div className="ai-button-area">
            <button type="button" className="ai-button" onClick={convertText} disabled={isConverting || isLoadingStyles}>
            {isConverting ? "AIが変換中..." : "AIで選んだスタイルに変換"}
            </button>
          </div>

          <label className="field-label" htmlFor="converted-text">AI変換した投稿文</label>
          <p className="conversion-note">
            {styleId ? `選択スタイル：${styles.find((style) => String(style.id) === styleId)?.name ?? ""}` : "スタイルを選択してAI変換すると、ここに結果が表示されます。"}
          </p>
          <textarea
            id="converted-text"
            className="modal-textarea converted-textarea"
            value={convertedText}
            onChange={(event) => {
              setConvertedText(event.target.value);
            }}
            maxLength={1000}
            required
          />

          <label className="field-label" htmlFor="post-hashtags">ハッシュタグ</label>
          <div className="hashtag-input-wrap">
            <span aria-hidden="true">#</span>
            <input
              id="post-hashtags"
              type="text"
              className="hashtag-input"
              placeholder="学校 日常（スペース区切り）"
              value={hashtags}
              onChange={(event) => setHashtags(event.target.value)}
            />
          </div>
          <p className="hashtag-hint">投稿後は各タグに#が付きます。</p>

          {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

          <div className="submit-area">
            <button className="submit-button" type="submit" disabled={isSubmitting || isLoadingStyles || styles.length === 0}>
              {isSubmitting ? submitStage || "投稿中..." : parentPostId ? "返信する" : "投稿！"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 80px 0 70px;
          overflow-y: auto;
          background-color: rgba(255, 255, 255, 0.85);
          z-index: 2000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 20px 0;
          box-sizing: border-box;
        }
        .modal-content {
          width: 80%;
          max-width: 360px;
          background-color: #ffffff;
          border: 2px solid #299d48;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 9px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .modal-title-wrapper {
          position: relative;
          border: 1px solid #cccccc;
          border-radius: 6px;
          padding: 8px 0;
          text-align: center;
          margin: 0 auto 4px;
          width: 80%;
        }
        .modal-title { font-size: 18px; font-weight: bold; color: #333; margin: 0; }
        .posting-user { margin: -10px 0 8px; color: #666; font-size: 12px; text-align: right; }
        .posting-user span { color: #999; }
        .modal-title-wrapper::before, .modal-title-wrapper::after,
        .modal-title-dots-right::before, .modal-title-dots-right::after {
          content: "";
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: #5fc2ea;
          border-radius: 50%;
        }
        .modal-title-wrapper::before, .modal-title-wrapper::after { left: 6px; }
        .modal-title-wrapper::before, .modal-title-dots-right::before { top: 6px; }
        .modal-title-wrapper::after, .modal-title-dots-right::after { bottom: 6px; }
        .modal-title-dots-right::before, .modal-title-dots-right::after { right: 6px; }
        .field-label { font-size: 12px; font-weight: 600; color: #333; }
        .style-select, .hashtag-input {
          width: 100%;
          min-height: 36px;
          border: 1px solid #cccccc;
          border-radius: 8px;
          padding: 6px 10px;
          box-sizing: border-box;
          background: #fff;
          font-size: 13px;
        }
        .hashtag-input-wrap { display: flex; align-items: center; min-height: 36px; padding-left: 10px; border: 1px solid #ccc; border-radius: 8px; background: #fff; color: #299d48; font-weight: 700; }
        .hashtag-input-wrap .hashtag-input { min-width: 0; border: 0; outline: none; }
        .hashtag-hint { margin: -5px 0 0; color: #777; font-size: 10px; }
        .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
        .image-picker-button { align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; min-height: 38px; padding: 0 15px; border: 1px solid #68c5ed; border-radius: 9px; background: #eefaff; color: #24789a; font-size: 13px; font-weight: 600; cursor: pointer; }
        .image-picker-button:hover { background: #dff5ff; }
        .image-hint { margin: -4px 0 2px; color: #777; font-size: 10px; }
        .selected-images { margin: 0; padding-left: 20px; font-size: 12px; color: #555; }
        .selected-images li { padding: 2px 0; overflow-wrap: anywhere; }
        .selected-images button { margin-left: 8px; border: 0; background: transparent; color: #b42318; cursor: pointer; }
        .modal-textarea {
          width: 100%;
          min-height: 82px;
          border: 1px solid #cccccc;
          border-radius: 12px;
          padding: 10px;
          box-sizing: border-box;
          resize: vertical;
          font: inherit;
          font-size: 14px;
        }
        .converted-textarea { min-height: 92px; }
        .conversion-note { margin: -5px 0 0; color: #666; font-size: 11px; }
        .ai-button-area { display: flex; justify-content: flex-end; }
        .ai-button { background: #a7dcf3; color: #333; border: 0; border-radius: 7px; padding: 9px 14px; font-size: 12px; cursor: pointer; }
        .ai-button:disabled { opacity: 0.6; cursor: wait; }
        .form-error { margin: 0; color: #b42318; font-size: 12px; overflow-wrap: anywhere; }
        .submit-area { display: flex; justify-content: center; margin-top: 4px; }
        .submit-button {
          background-color: #aee68c;
          color: #333;
          border: none;
          border-radius: 8px;
          padding: 9px 32px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
        }
        .submit-button:disabled { opacity: 0.6; cursor: wait; }
      `}</style>
    </>
  );
}
