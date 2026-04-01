/**
 * @task S4FE3
 * @description Marketplace 페이지 — 목록, 상세, 업로드
 * Route: /marketplace
 * API: GET /api/Backend_APIs/marketplace?action=skills&page=N&limit=12&category=X&search=Y
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 ──────────────────────────────────────────────────────────

export interface MarketplaceSkill {
  id: string;
  skill_name: string;
  name?: string;
  description: string;
  category: string;
  price: number;
  install_count: number;
  rating?: number;
  rating_count?: number;
  is_free?: boolean;
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
const API_BASE = '/api/Backend_APIs/marketplace';

// ── 서브 컴포넌트 ──────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
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
  const title = skill.skill_name || skill.name || '이름 없음';
  const categoryLabel = CATEGORY_LABELS[skill.category] ?? skill.category ?? '기타';
  const installCount = (skill.install_count ?? 0).toLocaleString();
  const rating = skill.rating ?? 0;
  const ratingCount = skill.rating_count ?? 0;

  return (
    <Link
      href={`/marketplace/${encodeURIComponent(skill.id)}`}
      className={clsx(
        'flex flex-col gap-3 p-5 rounded-xl',
        'bg-surface border border-border',
        'hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5',
        'transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      )}
    >
      {/* 상단: 아이콘 + 가격 뱃지 */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center text-2xl flex-shrink-0">
          🤖
        </div>
        <PriceBadge price={skill.price} />
      </div>

      {/* 이름 */}
      <p className="text-base font-bold text-text-primary leading-tight line-clamp-2">{title}</p>

      {/* 설명 */}
      <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 flex-1">
        {skill.description || '설명 없음'}
      </p>

      {/* 하단: 카테고리 + 별점/설치수 */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary/80 truncate">
            {categoryLabel}
          </span>
          <span className="text-xs text-text-muted flex-shrink-0">
            ↓ {installCount}
          </span>
        </div>
        {rating > 0 && <StarRating rating={rating} count={ratingCount} />}
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

      {pages.map((page, idx) =>
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

export default function MarketplacePage() {
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

  // API 페치
  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        action: 'skills',
        page: String(currentPage),
        limit: String(PAGE_LIMIT),
        sort,
      });
      if (debouncedQuery) params.set('search', debouncedQuery);
      if (category) params.set('category', category);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const skillsArr = data?.data?.skills ?? data?.data ?? data?.skills ?? [];
      const totalCount = data?.data?.total ?? data?.total ?? skillsArr.length;
      setSkills(skillsArr);
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
            챗봇의 능력을 확장하는 스킬을 탐색하고 설치하세요.
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

      {/* 검색 + 정렬 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
            🔍
          </span>
          <input
            type="search"
            placeholder="스킬 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={clsx(
              'w-full pl-9 pr-4 py-2.5 rounded-lg text-sm',
              'border border-border bg-surface text-text-primary',
              'placeholder:text-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
              'transition-colors',
            )}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortOption);
            setCurrentPage(1);
          }}
          className={clsx(
            'px-3 py-2.5 rounded-lg text-sm',
            'border border-border bg-surface text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary',
          )}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 카테고리 필터 탭 */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              category === cat.id
                ? 'bg-primary text-white'
                : 'border border-border text-text-secondary hover:border-primary/40 hover:text-text-primary',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 결과 수 */}
      {!loading && !error && (
        <p className="text-sm text-text-secondary">
          {total > 0
            ? `총 ${total.toLocaleString()}개의 스킬`
            : '검색 결과가 없습니다.'}
        </p>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
          {error}
          <button
            onClick={fetchSkills}
            className="ml-3 underline hover:no-underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 스킬 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkillCardSkeleton key={i} />)
          : skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)}
      </div>

      {/* 빈 상태 */}
      {!loading && !error && skills.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🛒</span>
          <h3 className="text-lg font-semibold text-text-primary mb-1">스킬이 없습니다</h3>
          <p className="text-sm text-text-secondary">
            검색 조건을 변경하거나 직접 스킬을 업로드해보세요.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategory('');
              setCurrentPage(1);
            }}
            className="mt-4 text-sm text-primary hover:underline"
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
