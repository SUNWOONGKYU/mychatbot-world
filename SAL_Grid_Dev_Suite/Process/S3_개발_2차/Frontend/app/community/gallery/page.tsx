/**
 * @task S3FE4
 * @description 커뮤니티 갤러리 뷰
 * Route: /community/gallery
 * - 이미지 첨부 게시글 그리드 뷰
 * - 이미지 클릭 시 게시글 상세로 이동
 * - 반응형: 2열(mobile) / 3열(tablet) / 4열(desktop)
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── 타입 ────────────────────────────────────────────────────

interface GalleryPost {
  id: string;
  title: string;
  image_url: string;
  like_count: number;
  comment_count: number;
  category: string;
  created_at: string;
  author?: {
    name: string;
    avatar_url?: string;
  };
}

// ── 컴포넌트 ─────────────────────────────────────────────────

function GalleryCard({ post }: { post: GalleryPost }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Link
      href={`/community/${post.id}`}
      className="group relative block aspect-square overflow-hidden rounded-xl
                 border border-border bg-surface hover:border-primary transition-all
                 duration-200 hover:shadow-md"
    >
      {/* 이미지 */}
      {!imgLoaded && (
        <div className="absolute inset-0 bg-bg-muted animate-pulse" />
      )}
      <img
        src={post.image_url}
        alt={post.title}
        className={`w-full h-full object-cover transition-transform duration-300
                    group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImgLoaded(true)}
      />

      {/* 오버레이 — hover 시 표시 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      flex flex-col justify-end p-3">
        <p className="text-white text-xs font-medium line-clamp-2">{post.title}</p>
        <div className="flex items-center gap-2 mt-1 text-white/70 text-xs">
          <span>♡ {post.like_count}</span>
          <span>댓글 {post.comment_count}</span>
        </div>
      </div>

      {/* 카테고리 배지 */}
      <span className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded-md
                       bg-black/40 text-white/90 backdrop-blur-sm">
        {post.category}
      </span>
    </Link>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function CommunityGalleryPage() {
  const router = useRouter();
  const [posts,   setPosts]   = useState<GalleryPost[]>([]);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const loaderRef = useRef<HTMLDivElement>(null);

  // ── 데이터 fetch ─────────────────────────────────────────

  const fetchGallery = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const targetPage = reset ? 1 : page;
        // gallery=true 파라미터로 이미지 있는 게시글만 조회
        const params = new URLSearchParams({
          gallery: 'true',
          page: String(targetPage),
          sort: 'latest',
        });
        const res = await fetch(`/api/community?${params}`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const fetched: GalleryPost[] = (data.posts ?? []).filter(
          (p: GalleryPost) => !!p.image_url
        );

        setPosts(prev => reset ? fetched : [...prev, ...fetched]);
        setHasMore(data.posts?.length === 20);
        if (reset) setPage(2);
        else       setPage(p => p + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : '불러오기 실패');
      } finally {
        setLoading(false);
      }
    },
    [page]
  );

  useEffect(() => {
    fetchGallery(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) fetchGallery(false); },
      { threshold: 0.1 }
    );
    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => { if (current) observer.unobserve(current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading]);

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/community')}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            ← 게시판
          </button>
          <h1 className="text-2xl font-bold text-text-primary">갤러리</h1>
        </div>
        <button
          onClick={() => router.push('/community/write')}
          className="text-sm font-medium px-4 py-1.5 rounded-lg
                     bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          글쓰기
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="text-sm text-error bg-error/10 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {posts.map(post => (
          <GalleryCard key={post.id} post={post} />
        ))}

        {/* 스켈레톤 */}
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-surface border border-border rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-20 text-text-muted">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-sm">이미지 게시글이 없습니다.</p>
          <Link
            href="/community/write"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            첫 이미지 게시글 작성하기 →
          </Link>
        </div>
      )}

      {/* 무한 스크롤 트리거 */}
      {hasMore && <div ref={loaderRef} className="h-8" />}
    </div>
  );
}
