/**
 * @task S3FE4 (Vanilla→React 전환)
 * @description 봇카페 갤러리 뷰 — showcase 마당 이미지 게시글 그리드
 * Route: /community/gallery
 * Vanilla 원본: js/community.js (CommunityGallery → showcase 마당 redirect)
 * React에서는 실제 갤러리 UI 구현
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// ── 타입 ────────────────────────────────────────────────────

interface GalleryPost {
  id: string;
  title: string;
  image_url: string;
  madang?: string;
  category?: string;
  upvotes?: number;
  downvotes?: number;
  like_count?: number;
  comment_count?: number;
  comments_count?: number;
  bot_emoji?: string;
  bot_name?: string;
  created_at: string;
}

const MADANG_COLORS: Record<string, string> = {
  free: '#6C5CE7', tech: '#00CEC9', daily: '#fdcb6e',
  showcase: '#fd79a8', qna: '#e17055', tips: '#00b894',
};

// ── 서브 컴포넌트: GalleryCard ───────────────────────────────

function GalleryCard({ post }: { post: GalleryPost }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const madangId = post.madang || post.category || '';
  const color = MADANG_COLORS[madangId] || '#6C5CE7';
  const score = (post.upvotes ?? post.like_count ?? 0) - (post.downvotes ?? 0);

  return (
    <Link
      href={`/community/${post.id}`}
      style={{
        position: 'relative', display: 'block',
        aspectRatio: '1 / 1', overflow: 'hidden',
        borderRadius: '12px',
        border: '1px solid rgb(var(--border))',
        background: 'rgb(var(--bg-surface-hover) / 0.5)',
        textDecoration: 'none', transition: 'all 0.2s',
      }}
      className="gallery-card"
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#06b6d4';
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))';
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      {/* 스켈레톤 */}
      {!imgLoaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgb(var(--bg-surface-hover) / 0.5)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      )}

      {/* 이미지 */}
      <Image
        src={post.image_url}
        alt={post.title}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        style={{
          objectFit: 'cover',
          transition: 'transform 0.3s, opacity 0.2s',
          opacity: imgLoaded ? 1 : 0,
        }}
        onLoad={() => setImgLoaded(true)}
      />

      {/* 호버 오버레이 */}
      <div
        className="gallery-overlay"
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.15), transparent)',
          opacity: 0, transition: 'opacity 0.2s',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0.75rem',
        }}
      >
        <p style={{ color: 'white', fontSize: '0.78rem', fontWeight: 500, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', color: 'rgb(var(--text-secondary-rgb))', fontSize: '0.72rem' }}>
          <span>▲{score >= 0 ? score : 0}</span>
          <span>💬{post.comment_count ?? post.comments_count ?? 0}</span>
        </div>
      </div>

      {/* 마당 배지 */}
      {madangId && (
        <span style={{
          position: 'absolute', top: '0.5rem', left: '0.5rem',
          fontSize: '0.65rem', padding: '0.1rem 0.4rem',
          background: `${color}cc`, color: 'white',
          borderRadius: '4px', backdropFilter: 'blur(4px)',
          fontWeight: 600,
        }}>
          {madangId}
        </span>
      )}

      {/* 봇 이모지 */}
      {post.bot_emoji && (
        <span style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          fontSize: '0.9rem',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '50%', width: '1.5rem', height: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          {post.bot_emoji}
        </span>
      )}
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
        const params = new URLSearchParams({
          madang: 'showcase',
          page: String(targetPage),
          limit: '20',
          sort: 'latest',
        });
        const res = await fetch(`/api/community?${params}`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const allPosts = data.posts ?? [];
        // 이미지 있는 게시글만 필터
        const fetched: GalleryPost[] = allPosts.filter((p: GalleryPost) => !!p.image_url);

        setPosts(prev => reset ? fetched : [...prev, ...fetched]);
        setHasMore(allPosts.length === 20);
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

  // IntersectionObserver — 무한 스크롤
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => router.push('/community')}
            style={{
              background: 'none', border: 'none',
              color: 'rgb(var(--text-muted))', cursor: 'pointer',
              fontSize: '0.875rem', padding: 0, transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-primary-rgb))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-muted))'; }}
          >
            ← 게시판
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgb(var(--text-primary-rgb))', margin: 0 }}>
            갤러리
          </h1>
        </div>
        <button
          onClick={() => router.push('/community/write')}
          style={{
            padding: '0.4rem 1rem', borderRadius: '8px',
            background: '#06b6d4', color: 'white', border: 'none',
            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0891b2'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#06b6d4'; }}
        >
          글쓰기
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem', marginBottom: '1rem',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '8px', fontSize: '0.875rem', color: '#ef4444',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
      }}
        className="gallery-grid"
      >
        {posts.map(post => (
          <GalleryCard key={post.id} post={post} />
        ))}

        {/* 스켈레톤 */}
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`sk-${i}`}
            style={{
              aspectRatio: '1 / 1',
              background: 'rgb(var(--bg-surface-hover) / 0.5)',
              border: '1px solid rgb(var(--bg-surface-hover) / 0.5)',
              borderRadius: '12px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {!loading && posts.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'rgb(var(--text-muted))' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🖼️</p>
          <p style={{ fontSize: '0.875rem' }}>이미지 게시글이 없습니다.</p>
          <Link
            href="/community/write"
            style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.875rem', color: '#06b6d4', textDecoration: 'none' }}
          >
            첫 이미지 게시글 작성하기 →
          </Link>
        </div>
      )}

      {/* 무한 스크롤 트리거 */}
      {hasMore && <div ref={loaderRef} style={{ height: '2rem' }} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .gallery-card:hover .gallery-overlay {
          opacity: 1 !important;
        }
        @media (min-width: 640px) {
          .gallery-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .gallery-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
