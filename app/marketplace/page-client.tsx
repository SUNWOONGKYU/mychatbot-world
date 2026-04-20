/**
 * @task S7FE6 — P1 리디자인: Marketplace
 * @task S7FE8 — Motion 시스템 적용 (listStagger 패턴 시연)
 * 기반: S7FE1 Semantic 토큰 + S7FE2 Button + S7FE3 Drawer/Tabs + S7FE4 PageToolbar/Badge/EmptyState
 * 변경: PageToolbar + Card grid 밀도 + Drawer 필터(모바일) + Badge 카테고리 + EmptyState
 * 비즈니스 로직 보존: fetch, install, sort, pagination 그대로 유지
 *
 * [S7FE8 listStagger 사용 예시 - framer-motion 설치 후 활성화]
 *
 * import { motion } from 'framer-motion';
 * import { listStagger, listStaggerItem, getMotionProps } from '@/lib/motion';
 *
 * 스킬 카드 그리드에 적용:
 *   <motion.div
 *     className="grid gap-4"
 *     style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
 *     variants={listStagger}
 *     initial="hidden"
 *     animate={loading ? 'hidden' : 'visible'}
 *     aria-live="polite"
 *     aria-label="스킬 목록"
 *   >
 *     {skills.map((skill) => (
 *       <motion.div key={skill.id} variants={listStaggerItem}>
 *         <SkillCard skill={skill} />
 *       </motion.div>
 *     ))}
 *   </motion.div>
 *
 * prefers-reduced-motion 대응:
 *   const motionProps = getMotionProps(listStagger);
 *   <motion.div {...motionProps}>...</motion.div>
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { PageToolbar, Breadcrumb, BreadcrumbItem } from '@/components/ui/page-toolbar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';

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
      <div className="flex items-center" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={clsx(
              'text-xs',
              i < Math.round(rating) ? 'text-state-warning-fg' : 'text-text-tertiary',
            )}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-xs text-text-secondary" aria-label={`평점 ${rating.toFixed(1)}, ${count}개 리뷰`}>
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

      if (res.status === 409) { setStatus('done'); return; }
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
    <Button
      size="sm"
      variant={status === 'done' ? 'secondary' : status === 'error' ? 'outline' : 'default'}
      onClick={handleInstall}
      disabled={status === 'loading' || status === 'done'}
      aria-label={status === 'done' ? '설치 완료' : '설치하기'}
      className="shrink-0"
    >
      {status === 'loading' ? '설치 중...' : status === 'done' ? '✓ 설치됨' : status === 'error' ? '오류' : '설치'}
    </Button>
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
        'group flex flex-col gap-3 p-5 rounded-xl',
        'bg-surface-2 border border-border-default',
        'hover:border-interactive-primary/40 hover:-translate-y-0.5',
        'hover:shadow-[var(--shadow-lg)]',
        'transition-all duration-200 cursor-pointer no-underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
      )}
      aria-label={`${title} 스킬 상세 보기`}
    >
      {/* 상단: 아이콘 + 가격 뱃지 */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-10 h-10 rounded-lg bg-interactive-secondary flex items-center justify-center text-xl shrink-0"
          aria-hidden="true"
        >
          🤖
        </div>
        <Badge
          variant={isFree ? 'success' : 'warning'}
          style="subtle"
          size="sm"
        >
          {isFree ? '무료' : `${skill.price.toLocaleString()} 크레딧`}
        </Badge>
      </div>

      {/* 이름 (Heading 3) */}
      <h3 className="text-[0.9375rem] font-bold text-text-primary leading-snug line-clamp-2 [word-break:keep-all]">
        {title}
      </h3>

      {/* 설명 */}
      <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 flex-1 [word-break:keep-all]">
        {skill.description || '설명 없음'}
      </p>

      {/* 하단: 카테고리 Badge + 설치수 + 설치 버튼 */}
      <div className="flex items-center justify-between mt-auto gap-2 pt-1 border-t border-border-subtle">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Badge variant="brand" style="subtle" size="sm" className="shrink-0">
            {categoryLabel}
          </Badge>
          <span className="text-xs text-text-tertiary shrink-0">
            ↓{installCount}
          </span>
          {rating > 0 && (
            <span className="hidden sm:flex shrink-0">
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
    <div className="flex flex-col gap-3 p-5 rounded-xl bg-surface-2 border border-border-default animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-lg bg-surface-1" />
        <div className="h-5 w-14 rounded-full bg-surface-1" />
      </div>
      <div className="h-4 bg-surface-1 rounded w-3/4" />
      <div className="space-y-1.5">
        <div className="h-3 bg-surface-1 rounded w-full" />
        <div className="h-3 bg-surface-1 rounded w-2/3" />
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
        <div className="h-5 w-16 rounded-full bg-surface-1" />
        <div className="h-8 w-14 rounded-md bg-surface-1" />
      </div>
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
    if (p === 1 || p === totalPages || (p >= currentPage - range && p <= currentPage + range)) {
      pages.push(p);
    } else if (p === currentPage - range - 1 || p === currentPage + range + 1) {
      pages.push('ellipsis');
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 py-6" aria-label="페이지 이동">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
      >
        ←
      </Button>
      {pages.map((page, idx) =>
        page === 'ellipsis' ? (
          <span key={`e-${idx}`} className="px-2 text-text-tertiary text-sm">...</span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
            aria-label={`${page} 페이지`}
            aria-current={page === currentPage ? 'page' : undefined}
            className="min-w-[2.25rem]"
          >
            {page}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
      >
        →
      </Button>
    </nav>
  );
}

// ── 필터 Drawer 컨텐츠 (모바일용) ─────────────────────────────────

function FilterDrawerContent({
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: {
  category: string;
  sort: SortOption;
  onCategoryChange: (cat: string) => void;
  onSortChange: (sort: SortOption) => void;
}) {
  return (
    <>
      <DrawerHeader>
        <DrawerTitle>필터 및 정렬</DrawerTitle>
      </DrawerHeader>

      <div className="flex flex-col gap-5 overflow-y-auto">
        {/* 카테고리 */}
        <div>
          <p className="text-sm font-semibold text-text-primary mb-2 [word-break:keep-all]">카테고리</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="카테고리 선택">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
                  category === cat.id
                    ? 'bg-interactive-primary text-text-inverted'
                    : 'bg-surface-1 text-text-secondary border border-border-default hover:border-interactive-primary/40',
                )}
                aria-pressed={category === cat.id}
              >
                {cat.id === '' ? '전체' : cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 정렬 */}
        <div>
          <p className="text-sm font-semibold text-text-primary mb-2 [word-break:keep-all]">정렬 기준</p>
          <div className="flex flex-col gap-1.5" role="group" aria-label="정렬 기준 선택">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
                  sort === opt.value
                    ? 'bg-interactive-secondary text-text-primary border border-interactive-primary/40'
                    : 'text-text-secondary hover:bg-surface-1',
                )}
                aria-pressed={sort === opt.value}
              >
                {sort === opt.value && <span aria-hidden="true">✓</span>}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DrawerClose asChild>
        <Button variant="primary" className="w-full mt-2">
          적용
        </Button>
      </DrawerClose>
    </>
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (category) params.set('category', category);
    if (sort !== 'popular') params.set('sort', sort);
    if (currentPage > 1) params.set('page', String(currentPage));
    router.replace(`/marketplace?${params.toString()}`, { scroll: false });
  }, [debouncedQuery, category, sort, currentPage, router]);

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

      const sorted = [...skillsArr].sort((a, b) => {
        if (sort === 'popular') return (b.install_count ?? 0) - (a.install_count ?? 0);
        if (sort === 'newest') return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        if (sort === 'price_asc') return (a.price ?? 0) - (b.price ?? 0);
        if (sort === 'price_desc') return (b.price ?? 0) - (a.price ?? 0);
        return 0;
      });

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

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    setCurrentPage(1);
  }

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    setCurrentPage(1);
  }

  const activeFilterCount = (category !== '' ? 1 : 0) + (sort !== 'popular' ? 1 : 0);

  // ── 렌더 ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full">
      {/* PageToolbar */}
      <PageToolbar
        title="스킬 마켓플레이스"
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbItem href="/">홈</BreadcrumbItem>
            <BreadcrumbItem current>마켓플레이스</BreadcrumbItem>
          </Breadcrumb>
        }
        actions={
          <Button asChild size="sm" variant="default">
            <Link href="/marketplace/upload" aria-label="새 스킬 업로드">
              + 스킬 업로드
            </Link>
          </Button>
        }
        divider
      />

      <div className="flex-1 px-4 py-5 sm:px-6 space-y-5 max-w-7xl mx-auto w-full">

        {/* 툴바: 검색 + 카테고리(데스크톱) + 정렬(데스크톱) + 필터 버튼(모바일) */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 검색 입력 */}
          <div className="relative flex-1 min-w-[180px]">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
              aria-hidden="true"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                <circle cx="9" cy="9" r="6" /><path d="m16 16-3.5-3.5" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              type="search"
              placeholder="스킬 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              aria-label="스킬 검색"
              className={clsx(
                'w-full pl-9 pr-4 h-10 rounded-md text-sm',
                'border border-border-default bg-surface-2 text-text-primary',
                'placeholder:text-text-tertiary',
                'focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-1 focus:ring-offset-surface-0',
                'transition-colors',
              )}
            />
          </div>

          {/* 카테고리 select (sm 이상에서만 표시) */}
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            aria-label="카테고리 선택"
            className={clsx(
              'hidden sm:block h-10 px-3 rounded-md text-sm min-w-[130px]',
              'border border-border-default bg-surface-2 text-text-primary',
              'focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-1 focus:ring-offset-surface-0',
              'transition-colors cursor-pointer',
            )}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.id === '' ? '전체 카테고리' : cat.label}
              </option>
            ))}
          </select>

          {/* 정렬 select (sm 이상에서만 표시) */}
          <select
            value={sort}
            onChange={(e) => { handleSortChange(e.target.value as SortOption); }}
            aria-label="정렬 기준 선택"
            className={clsx(
              'hidden sm:block h-10 px-3 rounded-md text-sm min-w-[110px]',
              'border border-border-default bg-surface-2 text-text-primary',
              'focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-1 focus:ring-offset-surface-0',
              'transition-colors cursor-pointer',
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* 모바일 필터 Drawer 트리거 */}
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="sm:hidden shrink-0"
                aria-label="필터 열기"
              >
                필터
                {activeFilterCount > 0 && (
                  <Badge variant="brand" style="solid" size="sm" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent side="bottom">
              <FilterDrawerContent
                category={category}
                sort={sort}
                onCategoryChange={handleCategoryChange}
                onSortChange={handleSortChange}
              />
            </DrawerContent>
          </Drawer>
        </div>

        {/* 결과 수 */}
        {!loading && !error && total > 0 && (
          <p className="text-xs text-text-tertiary">
            총 <span className="font-semibold text-text-secondary">{total.toLocaleString()}</span>개의 스킬
          </p>
        )}

        {/* 에러 상태 */}
        {error && (
          <EmptyState
            icon={<span className="text-2xl" aria-hidden="true">⚠️</span>}
            title="스킬을 불러올 수 없습니다"
            description={error}
            action={
              <Button variant="destructive" size="sm" onClick={fetchSkills}>
                다시 시도
              </Button>
            }
            size="lg"
          />
        )}

        {/* 스킬 카드 그리드 */}
        {!error && (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
            aria-live="polite"
            aria-label="스킬 목록"
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkillCardSkeleton key={i} />)
              : skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)
            }
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && !error && skills.length === 0 && (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
            }
            title="스킬이 없습니다"
            description="검색 조건을 변경하거나 직접 스킬을 업로드해보세요."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearchQuery(''); setCategory(''); setCurrentPage(1); }}
              >
                필터 초기화
              </Button>
            }
            size="lg"
          />
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
    </div>
  );
}
