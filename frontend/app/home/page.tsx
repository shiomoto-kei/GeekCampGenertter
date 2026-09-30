"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import PostCard from "../components/post-card";
import NewPost from "./new-post";
import { supabase } from "@/lib/supabase/client";

type Post = {
  id: number;
  converted_text: string;
  original_text: string;
  like_count: number;
  laugh_count: number;
  sad_count: number;
  reply_count: number;
  created_at: string;
  author: { name: string } | { name: string }[] | null;
  images_paths: { path: string }[] | null;
  images: string[];
  post_hashtags: { hashtag: { tag_name: string } | { tag_name: string }[] | null }[] | null;
  tags: string[];
};

type ReactionCode = "like" | "laugh" | "sad";

export default function Home() {
  // 「new」か「recommend」かを管理する
  const [activeTab, setActiveTab] = useState<"new" | "recommend">("new");

  // モーダルの開閉状態を管理する
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [pendingReaction, setPendingReaction] = useState<string | null>(null);
  const [myReactions, setMyReactions] = useState<Record<number, ReactionCode>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});
  const [repliesByPost, setRepliesByPost] = useState<Record<number, { id: number; converted_text: string; created_at: string; author: { name: string } | { name: string }[] | null }[]>>({});
  const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setIsLoading(true);
      setLoadError(null);

      let query = supabase
        .from("posts")
        .select("id, original_text, converted_text, like_count, laugh_count, sad_count, reply_count, created_at, author:users!posts_author_id_fkey(name), images_paths(path), post_hashtags(hashtag:hashtags(tag_name))")
        .is("parent_post_id", null);

      if (activeTab === "recommend") {
        query = query
          .order("reaction_total", { ascending: false })
          .order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }
      query = query.limit(50);

      if (searchTerm) {
        const safeSearchTerm = searchTerm.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        query = query.or(
          `converted_text.ilike."%${safeSearchTerm}%",original_text.ilike."%${safeSearchTerm}%"`,
        );
      }

      const { data, error } = await query;

      if (cancelled) return;
      if (error) {
        setLoadError(`投稿を読み込めませんでした: ${error.message}`);
        setPosts([]);
        setMyReactions({});
      } else {
        const bucket = "post-images";
        const loadedPosts = (data ?? []) as Omit<Post, "images" | "tags">[];
        const mappedPosts = loadedPosts.map((post) => ({
          ...post,
          images: (post.images_paths ?? []).map(({ path }) => {
            if (/^https?:\/\//i.test(path)) return path;
            if (!bucket) return "";
            return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
          }).filter(Boolean),
          tags: (post.post_hashtags ?? []).flatMap(({ hashtag }) => {
            const item = Array.isArray(hashtag) ? hashtag[0] : hashtag;
            return item?.tag_name ? [item.tag_name] : [];
          }),
        }));
        setPosts(mappedPosts);

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session && mappedPosts.length > 0) {
          const { data: reactionData } = await supabase.rpc("get_my_post_reactions", {
            p_post_ids: mappedPosts.map((post) => post.id),
          });
          if (cancelled) return;
          const selected: Record<number, ReactionCode> = {};
          for (const reaction of (reactionData ?? []) as { post_id: number; reaction_code: string }[]) {
            if (["like", "laugh", "sad"].includes(reaction.reaction_code)) {
              selected[reaction.post_id] = reaction.reaction_code as ReactionCode;
            }
          }
          setMyReactions(selected);
        } else {
          setMyReactions({});
        }
      }
      setIsLoading(false);
    }

    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, [activeTab, searchTerm, refreshVersion]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  }

  async function toggleReplies(postId: number) {
    if (expandedReplies[postId]) {
      setExpandedReplies((current) => ({ ...current, [postId]: false }));
      return;
    }
    setReplyError(null);
    const { data, error } = await supabase
      .from("posts")
      .select("id, converted_text, created_at, author:users!posts_author_id_fkey(name)")
      .eq("parent_post_id", postId)
      .order("created_at", { ascending: true });
    if (error) {
      setReplyError(`返信を読み込めませんでした: ${error.message}`);
      return;
    }
    setRepliesByPost((current) => ({ ...current, [postId]: data ?? [] }));
    setExpandedReplies((current) => ({ ...current, [postId]: true }));
  }

  async function toggleReaction(postId: number, code: ReactionCode) {
    const key = `${postId}:${code}`;
    if (pendingReaction) return;
    setPendingReaction(key);
    setReactionError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }

      const { data: count, error } = await supabase.rpc("toggle_post_reaction", {
        p_post_id: postId,
        p_reaction_code: code,
      });
      if (error) throw error;

      const previousCode = myReactions[postId];
      setPosts((current) => current.map((post) =>
        post.id === postId ? {
          ...post,
          like_count: post.like_count + (code === "like" ? Number(count) - post.like_count : previousCode === "like" ? -1 : 0),
          laugh_count: post.laugh_count + (code === "laugh" ? Number(count) - post.laugh_count : previousCode === "laugh" ? -1 : 0),
          sad_count: post.sad_count + (code === "sad" ? Number(count) - post.sad_count : previousCode === "sad" ? -1 : 0),
        } : post,
      ));
      setMyReactions((current) => {
        const next = { ...current };
        if (previousCode === code) delete next[postId];
        else next[postId] = code;
        return next;
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "";
      setReactionError(
        /anonymous|anonymous sign-in|匿名/i.test(message)
          ? "ゲストのリアクションを使うには、Supabaseの Authentication → Sign In / Providers で Anonymous Sign-Ins を有効にしてください。"
          : message || "リアクションを保存できませんでした。",
      );
    } finally {
      setPendingReaction(null);
    }
  }

  return (
    <div className="home-page">
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main className="main-content">
        {/* =========================
            新着・おすすめ ＋ 検索
            ========================= */}
        <div className="top-controls">
          {/* 新着・おすすめ */}
          <div className="tab-area">
            <button
              className={`tab-button ${
                activeTab === "new" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("new");
                setRefreshVersion((current) => current + 1);
              }}
            >
              新着
            </button>

            <button
              className={`tab-button ${
                activeTab === "recommend" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("recommend");
                setRefreshVersion((current) => current + 1);
              }}
            >
              おすすめ
            </button>
          </div>

          {/* 検索欄 */}
          <form className="search-area" onSubmit={submitSearch}>
            <input
              type="text"
              placeholder="気になる投稿を検索..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />

            <button className="search-button" type="submit" aria-label="検索">
              🔍
            </button>
          </form>
        </div>

        {/* =========================
            投稿一覧
            ========================= */}
        <div className="post-list">
          {reactionError && <p className="list-message error-message">{reactionError}</p>}
          {isLoading && <p className="list-message">投稿を読み込み中...</p>}
          {!isLoading && loadError && <p className="list-message error-message">{loadError}</p>}
          {!isLoading && !loadError && posts.length === 0 && (
            <p className="list-message">投稿がありません。</p>
          )}
          {!isLoading && !loadError && posts.map((post) => {
            const author = Array.isArray(post.author) ? post.author[0] : post.author;
            return (
              <div className="post-thread" key={post.id}>
                <PostCard
                  userName={author?.name ?? "ユーザー"}
                  text={post.converted_text}
                  originalText={post.original_text}
                  images={post.images}
                  tags={post.tags}
                  replyCount={post.reply_count}
                  laughCount={post.laugh_count}
                  sadCount={post.sad_count}
                  likeCount={post.like_count}
                  selectedReaction={myReactions[post.id] ?? null}
                  onReact={(code) => toggleReaction(post.id, code)}
                  pendingReaction={pendingReaction?.startsWith(`${post.id}:`) ?? false}
                  onToggleReplies={() => void toggleReplies(post.id)}
                />
                {expandedReplies[post.id] && <div className="reply-list">
                  {replyError && <p className="reply-error">{replyError}</p>}
                  {(repliesByPost[post.id] ?? []).map((reply) => {
                    const replyAuthor = Array.isArray(reply.author) ? reply.author[0] : reply.author;
                    return <article className="reply-card" key={reply.id}>
                      <strong>{replyAuthor?.name ?? "ユーザー"}</strong>
                      <p>{reply.converted_text}</p>
                    </article>;
                  })}
                  <button className="reply-button" type="button" onClick={() => setReplyingToPostId(post.id)}>返信を書く</button>
                </div>}
              </div>
            );
          })}
        </div>
      </main>

      {/* =========================
          新規投稿ボタン
          ========================= */}
      <button
        className="new-post-button"
        onClick={() => setIsModalOpen(true)}
      >
        ＋
      </button>

      {/* =========================
          新規投稿モーダル（変更部分）
          ========================= */}
      <NewPost
        isOpen={isModalOpen || replyingToPostId !== null}
        parentPostId={replyingToPostId}
        onClose={() => { setIsModalOpen(false); setReplyingToPostId(null); }}
        onCreated={() => {
          setIsModalOpen(false);
          setReplyingToPostId(null);
          setExpandedReplies({});
          setRepliesByPost({});
          setRefreshVersion((current) => current + 1);
        }}
      />

      {/* フッター */}
      <Footer />

      <style jsx>{`
        /* =========================
           ホーム全体
           ========================= */
        .home-page {
          min-height: 100vh;

          background-color: #ffffff;

          /*
            フッター100px +
            ＋ボタンが重ならないための余白
          */
          padding-top: 115px;
          padding-bottom: 120px;
          overflow: hidden;
        }

        /* =========================
           メインコンテンツ
           ========================= */
        .main-content {
          width: 100%;
          max-width: 600px;
          overflow-y: auto;

          margin: 0 auto;

          padding: 12px;

          box-sizing: border-box;

          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* =========================
           新着・おすすめ ＋ 検索
           ========================= */
        .top-controls {
          position: fixed; /* ★画面に固定 */
          top: 70px;      /* ★ヘッダーの高さ分（120px）下に配置 */
          left: 50%;       /* ★中央に寄せるための基点 */
          transform: translateX(-50%); /* ★中央揃えの微調整 */
          
          width: 100%;
          max-width: 600px; /* main-contentと同じ最大幅 */

          display: flex;
          align-items: center;

          gap: 10px;
          padding: 12px;
          box-sizing: border-box;

          background-color: #ffffff; /* ★背景を白にして、下にスクロールした文字が透けないようにする */
          z-index: 900;             /* ★ヘッダー(1000)より下、コンテンツより上にする */
        }

        /* =========================
           新着・おすすめ
           ========================= */
        .tab-area {
          display: flex;

          flex-shrink: 0;
        }

        .tab-button {
          width: 90px;
          height: 26px;

          border: 1px solid #cccccc;

          background-color: #ffffff;

          color: #333333;

          font-size: 12px;

          cursor: pointer;
        }

        .tab-button:first-child {
          border-radius: 15px 0 0 15px;
        }

        .tab-button:last-child {
          border-radius: 0 15px 15px 0;
        }

        .tab-button.active {
          background-color: #a7e6d9;

          border-color: #a7e6d9;

          font-weight: bold;
        }

        /* =========================
           検索欄
           ========================= */
        .search-area {
          flex: 1;

          min-width: 0;

          height: 30px;

          display: flex;
        }

        .search-area input {
          flex: 1;

          min-width: 0;

          padding: 0 10px;

          border: 1px solid #dddddd;
          border-radius: 4px 0 0 4px;

          font-size: 10px;

          outline: none;
        }

        .search-button {
          width: 34px;

          flex-shrink: 0;

          border: none;

          background-color: #68c5ed;

          color: #ffffff;

          cursor: pointer;
        }

        /* =========================
           投稿一覧
           ========================= */
        .post-list {
          width: 95%;
          display: flex;

          flex-direction: column;

          gap: 20px;
        }
        .post-thread { display: flex; flex-direction: column; gap: 0; }

        .list-message {
          padding: 24px 12px;
          color: #666666;
          font-size: 14px;
          text-align: center;
        }

        .error-message {
          color: #b42318;
        }
        .reply-list { margin: -12px 0 0; padding: 10px 12px 12px; border: 1px solid #ddd; border-radius: 0 0 12px 12px; }
        .reply-card { padding: 8px 4px; border-bottom: 1px solid #eee; font-size: 12px; color: #333; }
        .reply-card p { margin: 4px 0; white-space: pre-wrap; }
        .reply-card button, .reply-button { border: 0; background: transparent; color: #16833c; cursor: pointer; font-size: 12px; }
        .reply-button { display: block; margin: 8px 0 0 auto; }
        .reply-error { color: #b42318; font-size: 12px; }

        /* =========================
           新規投稿ボタン
           ========================= */
        .new-post-button {
          position: fixed;

          /*
            フッター100pxなので、
            そこより少し上に配置する
          */
          right: 20px;
          bottom: 80px;

          width: 50px;
          height: 50px;

          border: none;

          border-radius: 50%;

          background-color: #5fc2ea;

          color: #ffffff;

          font-size: 30px;
          font-weight: 300;

          line-height: 1;

          cursor: pointer;

          z-index: 1100;
        }

        .new-post-button:hover {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}
