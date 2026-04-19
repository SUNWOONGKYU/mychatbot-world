/**
 * @task S4FE3
 * @description Marketplace 페이지 — 목록, 상세, 업로드
 * Route: /marketplace
 * API: GET /api/skills?q=X&category=X
 *      POST /api/skills/install — 스킬 설치
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 ──────────────────────────────────────────────────────────

export interface MarketplaceSkill {
  id: string;
  skill_name?: string;
  name?: string;
  description: string;
  category: string;
  price: number;
  install_count: number;
  avg_rating?: number | null;
  rating?: number;
  review_count?: number;
  rating_count?: number;
  is_free?: boolean;
  isFree?: boolean;
  tags?: string[];
  thumbnail_url?: string | null;
  created_at?: string;
}

type SortOption = 'popular' | 'newest' | 'price_asc' | 'price_desc';

// ── 상수 ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: '', label: '전체' },
  { id: 'productivity', label: '생산성' },
  { id: 'communication', label: '커뮤니케이션' },
  { id: 'analysis', label: '분석' },
  { id: 'education', label: '교육' },
  { id: 'entertainment', label: '엔터테인먼트' },
  { id: 'utility', label: '유틸리티' },
  { id: 'business', label: '비즈니스' },
  { id: 'other', label: '기타' },
];

const CATEGORY_LABELS: Record<string, string> = {
  productivity: '생산성',
  communication: '커뮤니케이션',
  analysis: '분석',
  education: '교육',
  entertainment: '엔터테인먼트',
  utility: '유틸리티',
  business: '비즈니스',
  other: '기타',
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: '인기순' },
  { value: 'newest', label: '최신순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
];

const PAGE_LIMIT = 12;

// ── 서브 컴포넌트 ──────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_: any, i: any) => (
          <span
            key={i}
            className={clsx(
              'text-xs',
              i < Math.round(rating) ? 'text-warning' : 'text-text-muted',
            )}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-xs text-text-secondary">
        {rating.toFixed(1)} ({count.toLocaleString()})
      </span>
    </div>
  );
}

function InstallButton({ skillId, isFree }: { skillId: string; isFree: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleInstall(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const authToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('sb-hlpovizxnrnspobddxmq-auth-token')
        : null;

    if (!authToken) {
      router.push(`/login?redirect=/marketplace`);
      return;
    }

    setStatus('loading');
    try {
      const parsed = JSON.parse(authToken);
      const token = parsed?.access_token ?? parsed?.session?.access_token ?? null;

      const res = await fetch('/api/skills/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ skill_id: skillId }),
      });

      if (res.status === 409) {
        setStatus('done');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setStatus('done');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }

  return (
    <button
      onClick={handleInstall}
      disabled={status === 'loading' || status === 'done'}
      className={clsx(
        'inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex-shrink-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:cursor-not-allowed whitespace-nowrap',
        status === 'done'
          ? 'bg-success/15 text-success border border-success/30'
          : status === 'error'
          ? 'bg-error/15 text-error border border-error/30'
          : 'bg-primary text-white hover:bg-primary-hover disabled:opacity-60',
      )}
    >
      {status === 'loading'
        ? '설치 중...'
        : status === 'done'
        ? '✓ 설치됨'
        : status === 'error'
        ? '오류'
        : '설치'}
    </button>
  );
}

function PriceBadge({ price }: { price: number }) {
  const isFree = !price || price === 0;
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0',
        isFree
          ? 'bg-success/15 text-success'
          : 'bg-warning/15 text-warning',
      )}
    >
      {isFree ? '무료' : `${price.toLocaleString()} 크레딧`}
    </span>
  );
}

function SkillCard({ skill }: { skill: MarketplaceSkill }) {
  const title = skill.name || skill.skill_name || '이름 없음';
  const categoryLabel = CATEGORY_LABELS[skill.category] ?? skill.category ?? '기타';
  const installCount = (skill.install_count ?? 0).toLocaleString();
  const rating = skill.avg_rating ?? skill.rating ?? 0;
  const ratingCount = skill.review_count ?? skill.rating_count ?? 0;
  const isFree = skill.isFree ?? skill.is_free ?? (!skill.price || skill.price === 0);

  return (
    <Link
      href={`/marketplace/${encodeURIComponent(skill.id)}`}
      className={clsx(
        'flex flex-col gap-3.5 p-6 rounded-xl',
        'bg-surface-2 border border-border',
        'hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]',
        'transition-all duration-200 cursor-pointer text-inherit no-underline',
      )}
    >
      {/* 상단: 아이콘 + 가격 뱃지 */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center text-[1.375rem] flex-shrink-0">
          🤖
        </div>
        <PriceBadge price={skill.price} />
      </div>

      {/* 이름 */}
      <p className="text-[1.0625rem] font-bold text-text-primary leading-tight line-clamp-2">
        {title}
      </p>

      {/* 설명 */}
      <p className="text-sm text-text-secondary leading-[1.55] line-clamp-2 flex-1">
        {skill.description || '설명 없음'}
      </p>

      {/* 하단: 카테고리·설치수(왼쪽) + 설치버튼(오른쪽) */}
      <div className="flex items-center justify-between mt-auto gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2 py-[0.2rem] rounded text-[0.7375rem] font-semibold bg-primary/12 text-primary/80 flex-shrink-0">
            {categoryLabel}
          </span>
          <span className="text-xs text-text-muted flex items-center gap-1 flex-shrink-0">
            ↓ {installCount}
          </span>
          {rating > 0 && (
            <span className="hidden sm:flex">
              <StarRating rating={rating} count={ratingCount} />
            </span>
          )}
        </div>
        <InstallButton skillId={skill.id} isFree={isFree} />
      </div>
    </Link>
  );
}

function SkillCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl bg-surface border border-border animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-lg bg-bg-muted" />
        <div className="h-5 w-16 rounded-full bg-bg-muted" />
      </div>
      <div className="h-4 bg-bg-muted rounded w-3/4" />
      <div className="space-y-1.5">
        <div className="h-3 bg-bg-muted rounded w-full" />
        <div className="h-3 bg-bg-muted rounded w-2/3" />
      </div>
      <div className="h-3 bg-bg-muted rounded w-1/3 mt-2" />
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const range = 2;
  const pages: (number | 'ellipsis')[] = [];

  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= currentPage - range && p <= currentPage + range)
    ) {
      pages.push(p);
    } else if (p === currentPage - range - 1 || p === currentPage + range + 1) {
      pages.push('ellipsis');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 py-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={clsx(
          'px-3 h-9 flex items-center justify-center rounded-lg text-sm font-medium',
          'border border-border transition-colors',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          'hover:border-primary/40 hover:text-text-primary text-text-secondary',
        )}
      >
        &larr;
      </button>

      {pages.map((page: any, idx: any) =>
        page === 'ellipsis' ? (
          <span key={`e-${idx}`} className="px-2 text-text-muted text-sm">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={clsx(
              'min-w-[2.25rem] h-9 flex items-center justify-center rounded-lg text-sm font-medium',
              'border transition-colors',
              page === currentPage
                ? 'bg-primary border-primary text-white'
                : 'border-border text-text-secondary hover:border-primary/40 hover:text-text-primary',
            )}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={clsx(
          'px-3 h-9 flex items-center justify-center rounded-lg text-sm font-medium',
          'border border-border transition-colors',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          'hover:border-primary/40 hover:text-text-primary text-text-secondary',
        )}
      >
        &rarr;
      </button>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────

export default function MarketplacePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [skills, setSkills] = useState<MarketplaceSkill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') ?? '');
  const [category, setCategory] = useState(searchParams?.get('category') ?? '');
  const [sort, setSort] = useState<SortOption>(
    (searchParams?.get('sort') as SortOption) ?? 'popular',
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams?.get('page') ?? '1'),
  );
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // 검색어 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // URL 동기화
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (category) params.set('category', category);
    if (sort !== 'popular') params.set('sort', sort);
    if (currentPage > 1) params.set('page', String(currentPage));
    router.replace(`/marketplace?${params.toString()}`, { scroll: false });
  }, [debouncedQuery, category, sort, currentPage, router]);

  // API 페치 — /api/skills 사용
  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (category) params.set('category', category);

      const res = await fetch(`/api/skills?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const skillsArr: MarketplaceSkill[] = data?.skills ?? [];

      // 클라이언트 정렬
      const sorted = [...skillsArr].sort((a, b) => {
        if (sort === 'popular') return (b.install_count ?? 0) - (a.install_count ?? 0);
        if (sort === 'newest') return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        if (sort === 'price_asc') return (a.price ?? 0) - (b.price ?? 0);
        if (sort === 'price_desc') return (b.price ?? 0) - (a.price ?? 0);
        return 0;
      });

      // 클라이언트 페이지네이션
      const totalCount = sorted.length;
      const start = (currentPage - 1) * PAGE_LIMIT;
      const paged = sorted.slice(start, start + PAGE_LIMIT);

      setSkills(paged);
      setTotal(totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : '마켓플레이스를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, category, sort, currentPage]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    setCurrentPage(1);
  }

  // ── 렌더 ──────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">스킬 마켓플레이스</h1>
          <p className="text-sm text-text-secondary mt-1">
            코코봇의 능력을 확장하는 스킬을 탐색하고 설치하세요.
          </p>
        </div>
        <Link
          href="/marketplace/upload"
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold flex-shrink-0',
            'bg-primary text-white hover:bg-primary-hover',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          <span>+</span>
          <span>스킬 업로드</span>
        </Link>
      </div>

      {/* 필터 바: 검색 + 카테고리 + 정렬 */}
      <div className="flex items-center gap-3.5 flex-wrap">
        {/* 검색 */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="search"
            placeholder="스킬 검색..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            autoComplete="off"
            className={clsx(
              'w-full pl-9 pr-4 py-2.5 rounded-lg text-[0.9375rem]',
              'border border-border bg-surface-2 text-text-primary',
              'placeholder:text-text-muted',
              'focus:outline-none focus:border-primary',
              'transition-colors',
            )}
          />
        </div>

        {/* 카테고리 select */}
        <select
          value={category}
          onChange={(e: any) => handleCategoryChange(e.target.value)}
          className={clsx(
            'px-4 py-2.5 rounded-lg text-[0.9375rem] min-w-[150px]',
            'border border-border bg-surface-2 text-text-primary',
            'focus:outline-none focus:border-primary',
            'transition-colors cursor-pointer',
          )}
        >
          {CATEGORIES.map((cat: any) => (
            <option key={cat.id} value={cat.id} className="bg-surface-2 text-text-primary">
              {cat.id === '' ? '전체 카테고리' : cat.label}
            </option>
          ))}
        </select>

        {/* 정렬 select */}
        <select
          value={sort}
          onChange={(e: any) => {
            setSort(e.target.value as SortOption);
            setCurrentPage(1);
          }}
          className={clsx(
            'px-4 py-2.5 rounded-lg text-[0.9375rem] min-w-[130px]',
            'border border-border bg-surface-2 text-text-primary',
            'focus:outline-none focus:border-primary',
            'transition-colors cursor-pointer',
          )}
        >
          {SORT_OPTIONS.map((opt: any) => (
            <option key={opt.value} value={opt.value} className="bg-surface-2 text-text-primary">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 결과 수 */}
      {!loading && !error && total > 0 && (
        <p className="text-[0.8125rem] text-text-muted">
          총 {total.toLocaleString()}개의 스킬
        </p>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-xl bg-error/8 border border-error/25 p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg font-bold text-[#fca5a5] mb-2">스킬을 불러올 수 없습니다</p>
          <p className="text-sm text-text-secondary mb-6">{error}</p>
          <button
            onClick={fetchSkills}
            className="px-6 py-2.5 bg-error text-white rounded-lg text-sm font-semibold hover:opacity-85 transition-opacity"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 스킬 카드 그리드 */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {loading
          ? Array.from({ length: 6 }).map((_: any, i: any) => <SkillCardSkeleton key={i} />)
          : skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)}
      </div>

      {/* 빈 상태 */}
      {!loading && !error && skills.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-50">🛒</div>
          <h3 className="text-lg font-bold text-text-secondary mb-2">스킬이 없습니다</h3>
          <p className="text-sm text-text-muted mb-4">
            검색 조건을 변경하거나 직접 스킬을 업로드해보세요.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategory('');
              setCurrentPage(1);
            }}
            className="text-sm text-primary hover:underline"
          >
            필터 초기화
          </button>
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && !error && skills.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
