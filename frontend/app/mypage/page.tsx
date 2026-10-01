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
import { iconImageUrl, type IconOption } from "@/lib/icons";

type MyPost = {
  id: number;
  author_id: number;
  original_text: string;
  converted_text: string;
  like_count: number;
  laugh_count: number;
  sad_count: number;
  reply_count: number;
  created_at: string;
  images_paths: { path: string }[] | null;
  post_hashtags: { hashtag: { tag_name: string } | { tag_name: string }[] | null }[] | null;
  images: string[];
  tags: string[];
};

export default function MyPage() {
  const router = useRouter();
  // ★ モーダルの開閉状態
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("読み込み中…");
  const [profileIconId, setProfileIconId] = useState<number | null>(null);
  const [profileIconPath, setProfileIconPath] = useState<string | null>(null);
  const [styleName, setStyleName] = useState("");
  const [loginLabel, setLoginLabel] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data } = await supabase.auth.getSession();
        let mode: "google" | "guest" = data.session ? "google" : "guest";
        let response = await fetch(`/api/session?mode=${mode}`, {
          headers: data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {},
          cache: "no-store",
        });
        if (mode === "google" && response.status === 401) {
          mode = "guest";
          response = await fetch("/api/session?mode=guest", { cache: "no-store" });
        }
        const result = await response.json();
        if (!response.ok || !result.exists) {
          if (active) setPostsLoading(false);
          return;
        }

        const stylesResponse = await fetch("/api/setup", { cache: "no-store" });
        const stylesResult = await stylesResponse.json();
        const selectedStyle = stylesResult.styles?.find((style: { id: number }) => style.id === result.profile.default_style_id);

        let imagePath: string | null = null;
        if (result.profile.icon_id) {
          const iconsResponse = await fetch("/api/icons", { cache: "no-store" });
          if (iconsResponse.ok) {
            const iconsResult = await iconsResponse.json();
            imagePath = (iconsResult.icons as IconOption[] | undefined)?.find((icon) => icon.id === result.profile.icon_id)?.image_path ?? null;
          }
        }

        if (active) {
          setProfileName(result.profile.name);
          setProfileIconId(result.profile.icon_id ?? null);
          setProfileIconPath(imagePath);
          setStyleName(selectedStyle?.name ?? "スタイル未設定");
          setLoginLabel(mode === "google" ? data.session?.user.email ?? "Googleログイン中" : "ゲスト利用中");
          setIsGuest(mode === "guest");
        }

        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("id,author_id,original_text,converted_text,like_count,laugh_count,sad_count,reply_count,created_at,images_paths(path),post_hashtags(hashtag:hashtags(tag_name))")
          .eq("author_id", result.profile.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (postError) {
          if (active) setPostsError("自分の投稿を読み込めませんでした。");
          return;
        }
        const bucket = "post-images";
        const mappedPosts: MyPost[] = ((postData ?? []) as Omit<MyPost, "images" | "tags">[]).map((post) => ({
          ...post,
          images: (post.images_paths ?? []).map(({ path }) => {
            if (/^https?:\/\//i.test(path)) return path;
            return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
          }),
          tags: (post.post_hashtags ?? []).flatMap(({ hashtag }) => {
            const item = Array.isArray(hashtag) ? hashtag[0] : hashtag;
            return item?.tag_name ? [item.tag_name] : [];
          }),
        }));
        if (active) setMyPosts(mappedPosts);
      } catch {
        if (active) {
          setProfileName("プロフィールを読み込めませんでした");
          setPostsError("自分の投稿を読み込めませんでした。");
        }
      } finally {
        if (active) setPostsLoading(false);
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
              <div className="profile-icon">
                {profileIconPath && <img src={iconImageUrl(profileIconPath) ?? ""} alt="設定中のアイコン" />}
              </div>
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
              {/* プロフィール編集 */}
              <button type="button" className="btn-change" onClick={() => setIsProfileModalOpen(true)}>
                プロフィール変更
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
          {postsLoading && <p className="post-message">投稿を読み込み中…</p>}
          {!postsLoading && postsError && <p role="alert" className="post-message error">{postsError}</p>}
          {!postsLoading && !postsError && myPosts.length === 0 && <p className="post-message">投稿はまだありません。</p>}
          {!postsLoading && !postsError && myPosts.map((post) => (
            <PostCard
              key={post.id}
              userName={profileName}
              userId={post.author_id}
              iconUrl={iconImageUrl(profileIconPath)}
              text={post.converted_text}
              originalText={post.original_text}
              images={post.images}
              tags={post.tags}
              replyCount={post.reply_count}
              laughCount={post.laugh_count}
              sadCount={post.sad_count}
              likeCount={post.like_count}
            />
          ))}
        </div>
      </main>

      <Footer />

      {/* =========================
          追加したモーダル
          ========================= */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        currentName={profileName}
        currentIconId={profileIconId}
        isGuest={isGuest}
        onClose={() => setIsProfileModalOpen(false)}
        onSaved={(name, iconId, imagePath) => {
          setProfileName(name);
          setProfileIconId(iconId);
          setProfileIconPath(imagePath);
          window.dispatchEvent(new Event("profile-updated"));
        }}
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
        .profile-icon { width: 58px; height: 58px; flex-shrink: 0; overflow: hidden; border-radius: 50%; background: #d9d9d9; }
        .profile-icon img { width: 100%; height: 100%; object-fit: cover; }
        .profile-name-area { flex: 1; display: flex; flex-direction: column; align-items: flex-end; padding-right: 8px; }
        .profile-name { align-self: flex-start; margin-left: 16px; font-size: 16px; font-weight: 700; color: #111; }
        .profile-age { margin-top: 4px; font-size: 14px; color: #111; }
        .profile-mail { margin: 0; text-align: center; font-size: 9px; color: #aaa; white-space: nowrap; }
        .profile-buttons { display: flex; justify-content: space-between; padding: 0 12px 4px; }
        .profile-buttons button { height: 18px; padding: 0; border-radius: 4px; font-size: 8.5px; cursor: pointer; }
        .btn-change { width: 92px; border: 1px solid #999; background: #fff; color: #222; }
        .btn-logout { width: 62px; border: none; background: #ff4d4d; color: #fff; }
        .logout-error { margin: 0; color: #a31313; font-size: 9px; text-align: center; }
        .content { flex: 1; overflow-y: auto; width: 100%; display: flex; flex-direction: column; align-items: center; padding-top: 300px; padding-bottom: 90px; box-sizing: border-box; }
        .post-list { width: 95%; display: flex; flex-direction: column; gap: 20px; }
        .post-message { margin: 8px 0; color: #666; font-size: 14px; text-align: center; }
        .post-message.error { color: #b42318; }
      `}</style>
    </div>
  );
}
