/**
 * @task S3FE4
 * @description 커뮤니티 게시판 — 목록, 카테고리 탭, 정렬, 무한 스크롤 페이지
 * Route: /community
 * Dependencies: S3BA4 /api/community
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── 타입 ────────────────────────────────────────────────────

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

type SortOption = 'latest' | 'popular' | 'trending';

interface Category {
  id: string;
  label: string;
}

// ── 상수 ────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: '',          label: '전체' },
  { id: 'general',   label: '자유' },
  { id: 'qna',       label: 'Q&A' },
  { id: 'showcase',  label: '쇼케이스' },
  { id: 'feedback',  label: '피드백' },
  { id: 'notice',    label: '공지' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest',   label: '최신순' },
  { value: 'popular',  label: '인기순' },
  { value: 'trending', label: '트렌딩' },
];

// ── 서브 컴포넌트: PostCard ──────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const timeAgo = useCallback((dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins  < 1)   return '방금 전';
    if (hours < 1)   return `${mins}분 전`;
    if (days  < 1)   return `${hours}시간 전`;
    if (days  < 30)  return `${days}일 전`;
    return new Date(dateStr).toLocaleDateString('ko-KR');
  }, []);

  return (
    <Link
      href={`/community/${post.id}`}
      className="block bg-surface border border-border rounded-xl p-5
                 hover:bg-surface-hover hover:border-border-strong
                 transition-colors duration-150 group"
    >
      {/* 카테고리 + 시간 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full
                         bg-primary/10 text-primary">
          {post.category || '자유'}
        </span>
        <span className="text-xs text-text-muted">{timeAgo(post.created_at)}</span>
      </div>

      {/* 제목 + 이미지 썸네일 */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary group-hover:text-primary
                         truncate transition-colors">
            {post.title}
          </h3>
          <p className="mt-1 text-sm text-text-secondary line-clamp-2">
            {post.content}
          </p>
        </div>
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border"
          />
        )}
      </div>

      {/* 작성자 + 통계 */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt={post.author.name}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">
                {(post.author?.name ?? 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-xs text-text-secondary">
            {post.author?.name ?? '익명'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>좋아요 {post.like_count}</span>
          <span>댓글 {post.comment_count}</span>
        </div>
      </div>
    </Link>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function CommunityPage() {
  const router = useRouter();
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [category, setCategory] = useState('');
  const [sort,     setSort]     = useState<SortOption>('latest');
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [hasMore,  setHasMore]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const loaderRef = useRef<HTMLDivElement>(null);

  // ── 데이터 fetch ─────────────────────────────────────────

  const fetchPosts = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const targetPage = reset ? 1 : page;
        const params = new URLSearchParams({
          ...(category ? { category } : {}),
          sort,
          page: String(targetPage),
        });
        const res = await fetch(`/api/community?${params}`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const fetched: Post[] = data.posts ?? [];

        setPosts(prev => reset ? fetched : [...prev, ...fetched]);
        setHasMore(fetched.length === 20);
        if (reset) setPage(2);
        else       setPage(p => p + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : '불러오기 실패');
      } finally {
        setLoading(false);
      }
    },
    [category, sort, page]
  );

  // 카테고리/정렬 변경 시 리셋
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort]);

  // IntersectionObserver — 무한 스크롤
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchPosts(false);
      },
      { threshold: 0.1 }
    );
    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => { if (current) observer.unobserve(current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading]);

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">커뮤니티</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/community/gallery"
            className="text-sm text-text-secondary hover:text-primary transition-colors px-3 py-1.5
                       rounded-lg border border-border hover:border-primary"
          >
            갤러리
          </Link>
          <button
            onClick={() => router.push('/community/write')}
            className="text-sm font-medium px-4 py-1.5 rounded-lg
                       bg-primary text-white hover:bg-primary-hover transition-colors"
          >
            글쓰기
          </button>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-full transition-colors
              ${category === cat.id
                ? 'bg-primary text-white font-medium'
                : 'bg-surface text-text-secondary border border-border hover:bg-surface-hover'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 정렬 옵션 */}
      <div className="flex gap-2 mb-5">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`text-xs px-3 py-1 rounded-md transition-colors
              ${sort === opt.value
                ? 'bg-bg-muted text-text-primary font-semibold'
                : 'text-text-muted hover:text-text-secondary'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 에러 */}
      {error && (
        <div className="text-sm text-error bg-error/10 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* 게시글 목록 */}
      <div className="flex flex-col gap-3">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* 스켈레톤 */}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-surface border border-border rounded-xl animate-pulse"
          />
        ))}

        {/* 빈 상태 */}
        {!loading && posts.length === 0 && !error && (
          <div className="text-center py-16 text-text-muted">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">게시글이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasMore && <div ref={loaderRef} className="h-8" />}
    </div>
  );
}
