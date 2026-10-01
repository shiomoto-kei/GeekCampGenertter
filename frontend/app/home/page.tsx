"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import PostCard from "../components/post-card";
import NewPost from "./new-post";
import { supabase } from "@/lib/supabase/client";
import { iconImageUrl } from "@/lib/icons";

type Author = { id: number; name: string; iconPath: string | null };
type Reply = { id: number; converted_text: string; created_at: string; author: Author | null };

type Post = {
  id: number;
  author_id: number;
  converted_text: string;
  original_text: string;
  like_count: number;
  laugh_count: number;
  sad_count: number;
  reply_count: number;
  created_at: string;
  author: Author | null;
  images_paths: { path: string }[] | null;
  images: string[];
  post_hashtags: { hashtag: { tag_name: string } | { tag_name: string }[] | null }[] | null;
  tags: string[];
};

type ReactionCode = "like" | "laugh" | "sad";
type CurrentUser = { id: number; name: string; default_style_id: number };
const POSTS_PER_PAGE = 20;

export default function Home() {
  // 「new」か「recommend」かを管理する
  const [activeTab, setActiveTab] = useState<"new" | "recommend">("new");

  // モーダルの開閉状態を管理する
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [retryLoadMore, setRetryLoadMore] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [pendingReaction, setPendingReaction] = useState<string | null>(null);
  const [myReactions, setMyReactions] = useState<Record<number, ReactionCode>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});
  const [repliesByPost, setRepliesByPost] = useState<Record<number, Reply[]>>({});
  const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const session = data.session;
        let response = session
          ? await fetch("/api/session?mode=google", {
              headers: { Authorization: `Bearer ${session.access_token}` },
              cache: "no-store",
            })
          : null;
        if (!response || response.status === 401) {
          response = await fetch("/api/session?mode=guest", { cache: "no-store" });
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "ログイン情報を取得できませんでした。");
        if (!cancelled) setCurrentUser(result.exists ? result.profile as CurrentUser : null);
      } catch {
        if (!cancelled) setCurrentUser(null);
      }
    }

    void loadCurrentUser();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadingMore = pageIndex > 0 && !searchTerm;

    async function loadPosts() {
      setReactionError(null);
      if (loadingMore) {
        setIsLoadingMore(true);
        setLoadMoreError(null);
      } else {
        setIsLoading(true);
        setIsLoadingMore(false);
        setLoadError(null);
        setLoadMoreError(null);
        setHasMorePosts(false);
        setPosts([]);
        setMyReactions({});
      }

      let matchingAuthorIds: number[] | null = null;
      let matchingPostIds: number[] | null = null;
      if (searchTerm.startsWith("#")) {
        const tagQuery = searchTerm.slice(1).trim().replace(/^#+/, "");
        if (!tagQuery) {
          if (!cancelled) {
            setPosts([]);
            setMyReactions({});
            setIsLoading(false);
          }
          return;
        }

        try {
          const safeTag = tagQuery.replace(/[\\%_]/g, "\\$&");
          const { data: hashtags, error: hashtagError } = await supabase
            .from("hashtags")
            .select("id")
            .ilike("tag_name", safeTag)
            .limit(50);
          if (hashtagError) throw hashtagError;
          const hashtagIds = (hashtags ?? []).map((hashtag) => hashtag.id);
          if (hashtagIds.length > 0) {
            const { data: postLinks, error: linksError } = await supabase
              .from("post_hashtags")
              .select("post_id")
              .in("hashtag_id", hashtagIds)
              .limit(50);
            if (linksError) throw linksError;
            matchingPostIds = [...new Set((postLinks ?? []).map((link) => link.post_id))];
          } else {
            matchingPostIds = [];
          }
        } catch (error) {
          if (!cancelled) {
            const message = error instanceof Error ? error.message : "ハッシュタグを検索できませんでした。";
            setLoadError(message);
            setPosts([]);
            setMyReactions({});
            setIsLoading(false);
          }
          return;
        }

        if (cancelled) return;
        if (!matchingPostIds || matchingPostIds.length === 0) {
          setPosts([]);
          setMyReactions({});
          setIsLoading(false);
          return;
        }
      } else if (searchTerm.startsWith("@")) {
        const accountQuery = searchTerm.slice(1).trim();
        if (!accountQuery) {
          if (!cancelled) {
            setPosts([]);
            setMyReactions({});
            setIsLoading(false);
          }
          return;
        }

        try {
          const response = await fetch(`/api/users?q=${encodeURIComponent(accountQuery)}`, { cache: "no-store" });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? "ユーザーを検索できませんでした。");
          matchingAuthorIds = (result.users ?? []).map((user: { id: number }) => user.id);
        } catch (error) {
          if (!cancelled) {
            setLoadError(error instanceof Error ? error.message : "ユーザーを検索できませんでした。");
            setPosts([]);
            setMyReactions({});
            setIsLoading(false);
          }
          return;
        }

        if (cancelled) return;
        if (!matchingAuthorIds || matchingAuthorIds.length === 0) {
          setPosts([]);
          setMyReactions({});
          setIsLoading(false);
          return;
        }
      }

      let query = supabase
        .from("posts")
        .select("id, author_id, original_text, converted_text, like_count, laugh_count, sad_count, reply_count, created_at, images_paths(path), post_hashtags(hashtag:hashtags(tag_name))")
        .is("parent_post_id", null);

      if (activeTab === "recommend") {
        query = query
          .order("reaction_total", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });
      } else {
        query = query
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });
      }
      query = searchTerm
        ? query.limit(50)
        : query.range(pageIndex * POSTS_PER_PAGE, (pageIndex + 1) * POSTS_PER_PAGE);

      if (matchingPostIds !== null) {
        query = query.in("id", matchingPostIds);
      } else if (matchingAuthorIds !== null) {
        query = query.in("author_id", matchingAuthorIds);
      } else if (searchTerm) {
        const safeSearchTerm = searchTerm.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        query = query.or(
          `converted_text.ilike."%${safeSearchTerm}%",original_text.ilike."%${safeSearchTerm}%"`,
        );
      }

      const { data, error } = await query;

      if (cancelled) return;
      if (error) {
        const message = `投稿を読み込めませんでした: ${error.message}`;
        if (loadingMore) setLoadMoreError(message);
        else setLoadError(message);
      } else {
        const bucket = "post-images";
        const hasNextPage = !searchTerm && (data?.length ?? 0) > POSTS_PER_PAGE;
        const loadedPosts = (searchTerm ? data ?? [] : (data ?? []).slice(0, POSTS_PER_PAGE)) as Omit<Post, "images" | "tags" | "author">[];
        const authorIds = [...new Set(loadedPosts.map((post) => post.author_id))];
        const authorResponse = authorIds.length > 0
          ? await fetch(`/api/users?ids=${authorIds.join(",")}`, { cache: "no-store" })
          : null;
        if (authorResponse && !authorResponse.ok) {
          const result = await authorResponse.json();
          if (!cancelled) {
            const message = result.error ?? "投稿者の名前を読み込めませんでした。";
            if (loadingMore) {
              setLoadMoreError(message);
              setIsLoadingMore(false);
            } else {
              setLoadError(message);
              setIsLoading(false);
            }
          }
          return;
        }
        const authorResult = authorResponse ? await authorResponse.json() : { users: [] };
        const authorById = new Map<number, Author>(
          (authorResult.users ?? []).map((user: Author) => [user.id, user]),
        );
        const mappedPosts = loadedPosts.map((post) => ({
          ...post,
          author: authorById.get(post.author_id) ?? null,
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
        if (cancelled) return;
        setHasMorePosts(hasNextPage);
        setPosts((current) => loadingMore
          ? [...current, ...mappedPosts.filter((post) => !current.some((existing) => existing.id === post.id))]
          : mappedPosts);

        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (mappedPosts.length > 0) {
            const reactionResponse = await fetch(
              `/api/reactions?postIds=${mappedPosts.map((post) => post.id).join(",")}`,
              {
                headers: sessionData.session
                  ? { Authorization: `Bearer ${sessionData.session.access_token}` }
                  : {},
                cache: "no-store",
              },
            );
            const reactionResult = await reactionResponse.json();
            if (cancelled) return;
            if (!reactionResponse.ok) {
              setReactionError(reactionResult.error ?? "リアクションを取得できませんでした。");
            } else {
              const selected: Record<number, ReactionCode> = {};
              for (const reaction of (reactionResult.reactions ?? []) as { post_id: number; reaction_code: string }[]) {
                if (["like", "laugh", "sad"].includes(reaction.reaction_code)) {
                  selected[reaction.post_id] = reaction.reaction_code as ReactionCode;
                }
              }
              setMyReactions((current) => loadingMore ? { ...current, ...selected } : selected);
            }
          }
        } catch (reactionLoadError) {
          if (!cancelled) {
            setReactionError(reactionLoadError instanceof Error ? reactionLoadError.message : "リアクションを取得できませんでした。");
          }
        }
      }
      if (!cancelled) {
        if (loadingMore) setIsLoadingMore(false);
        else setIsLoading(false);
      }
    }

    void loadPosts().catch((error: unknown) => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : "投稿を読み込めませんでした。";
      if (loadingMore) {
        setLoadMoreError(message);
        setIsLoadingMore(false);
      } else {
        setLoadError(message);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, searchTerm, refreshVersion, pageIndex, retryLoadMore]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageIndex(0);
    setSearchTerm(searchInput.trim());
  }

  function searchHashtag(tag: string) {
    const query = `#${tag.replace(/^#+/, "")}`;
    setSearchInput(query);
    setPageIndex(0);
    setSearchTerm(query);
  }

  async function toggleReplies(postId: number) {
    if (expandedReplies[postId]) {
      setExpandedReplies((current) => ({ ...current, [postId]: false }));
      return;
    }
    setReplyError(null);
    const { data, error } = await supabase
      .from("posts")
      .select("id, author_id, converted_text, created_at")
      .eq("parent_post_id", postId)
      .order("created_at", { ascending: true });
    if (error) {
      setReplyError(`返信を読み込めませんでした: ${error.message}`);
      return;
    }
    const authorIds = [...new Set((data ?? []).map((reply) => reply.author_id))];
    const authorResponse = authorIds.length > 0
      ? await fetch(`/api/users?ids=${authorIds.join(",")}`, { cache: "no-store" })
      : null;
    if (authorResponse && !authorResponse.ok) {
      setReplyError("返信の投稿者を読み込めませんでした。");
      return;
    }
    const authorResult = authorResponse ? await authorResponse.json() : { users: [] };
    const authorById = new Map<number, Author>((authorResult.users ?? []).map((user: Author) => [user.id, user]));
    setRepliesByPost((current) => ({
      ...current,
      [postId]: (data ?? []).map((reply) => ({
        id: reply.id,
        converted_text: reply.converted_text,
        created_at: reply.created_at,
        author: authorById.get(reply.author_id) ?? null,
      })),
    }));
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
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData.session ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}),
        },
        body: JSON.stringify({ postId, code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "リアクションを保存できませんでした。");

      const previousCode = myReactions[postId];
      setPosts((current) => current.map((post) =>
        post.id === postId ? {
          ...post,
          like_count: post.like_count + (code === "like" ? Number(result.count) - post.like_count : previousCode === "like" ? -1 : 0),
          laugh_count: post.laugh_count + (code === "laugh" ? Number(result.count) - post.laugh_count : previousCode === "laugh" ? -1 : 0),
          sad_count: post.sad_count + (code === "sad" ? Number(result.count) - post.sad_count : previousCode === "sad" ? -1 : 0),
        } : post,
      ));
      setMyReactions((current) => {
        const next = { ...current };
        if (previousCode === code) delete next[postId];
        else next[postId] = code;
        return next;
      });
    } catch (error) {
      setReactionError(error instanceof Error ? error.message : "リアクションを保存できませんでした。");
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
                setPageIndex(0);
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
                setPageIndex(0);
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
              placeholder="投稿・#タグ / @ユーザー名・IDを検索"
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
            const author = post.author;
            return (
              <div className="post-thread" key={post.id}>
                <PostCard
                  userName={author?.name ?? (post.author_id === currentUser?.id ? currentUser.name : "ユーザー")}
                  userId={author?.id ?? post.author_id}
                  iconUrl={iconImageUrl(author?.iconPath)}
                  text={post.converted_text}
                  originalText={post.original_text}
                  images={post.images}
                  tags={post.tags}
                  onTagClick={searchHashtag}
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
                    return <article className="reply-card" key={reply.id}>
                      <div className="reply-author">
                        <span className="reply-avatar">{reply.author?.iconPath && <img src={iconImageUrl(reply.author.iconPath) ?? ""} alt="" />}</span>
                        <strong>{reply.author?.name ?? "ユーザー"}</strong>
                      </div>
                      <p>{reply.converted_text}</p>
                    </article>;
                  })}
                  <button className="reply-button" type="button" onClick={() => setReplyingToPostId(post.id)}>返信を書く</button>
                </div>}
              </div>
            );
          })}
          {!isLoading && !loadError && !searchTerm && hasMorePosts && (
            <div className="load-more-area">
              {loadMoreError && <p className="list-message error-message" role="alert">{loadMoreError}</p>}
              <button
                className="load-more-button"
                type="button"
                disabled={isLoadingMore}
                onClick={() => {
                  if (isLoadingMore) return;
                  setIsLoadingMore(true);
                  if (loadMoreError) setRetryLoadMore((current) => current + 1);
                  else setPageIndex((current) => current + 1);
                }}
              >
                {isLoadingMore ? "読み込み中..." : loadMoreError ? "もう一度読み込む" : "もっと見る"}
              </button>
            </div>
          )}
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
        defaultStyleId={currentUser?.default_style_id ?? null}
        currentUser={currentUser}
        onClose={() => { setIsModalOpen(false); setReplyingToPostId(null); }}
        onCreated={() => {
          setIsModalOpen(false);
          setReplyingToPostId(null);
          setExpandedReplies({});
          setRepliesByPost({});
          setPageIndex(0);
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
        .load-more-area { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-bottom: 12px; }
        .load-more-area .list-message { margin: 0; padding: 0 12px; }
        .load-more-button { min-width: 140px; min-height: 38px; padding: 8px 20px; border: 1px solid #299d48; border-radius: 20px; background: #fff; color: #166534; font-size: 13px; font-weight: 600; cursor: pointer; }
        .load-more-button:disabled { opacity: 0.6; cursor: wait; }
        .reply-list { margin: -12px 0 0; padding: 10px 12px 12px; border: 1px solid #ddd; border-radius: 0 0 12px 12px; }
        .reply-card { padding: 8px 4px; border-bottom: 1px solid #eee; font-size: 12px; color: #333; }
        .reply-author { display: flex; align-items: center; gap: 6px; }
        .reply-avatar { width: 20px; height: 20px; overflow: hidden; border-radius: 50%; background: #ff8d82; }
        .reply-avatar img { width: 100%; height: 100%; object-fit: cover; }
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
