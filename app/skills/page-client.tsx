/**
 * @task S3FE2
 * @description 스킬 마켓 목록 페이지 — 검색/필터/카드 그리드
 * Route: /skills
 * API: GET /api/skills?q={query}&category={category}&sort={sort}
 */
'use client';




import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 ────────────────────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  description: string;
  author: string;
  author_id: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  rating_count: number;
  install_count: number;
  is_free: boolean;
  tags: string[];
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

type SortOption = 'popular' | 'rating' | 'newest' | 'price_asc' | 'price_desc';

const CATEGORIES = [
  { id: '', label: '전체' },
  { id: 'productivity', label: '생산성' },
  { id: 'communication', label: '커뮤니케이션' },
  { id: 'analysis', label: '분석' },
  { id: 'creative', label: '창작' },
  { id: 'education', label: '교육' },
  { id: 'automation', label: '자동화' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: '인기순' },
  { value: 'rating', label: '평점순' },
  { value: 'newest', label: '최신순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
];

// ── 서브 컴포넌트 ────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  const stars = Array.from({ length: 5 }, (_: any, i: any) => i + 1);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {stars.map((star) => (
          <span
            key={star}
            className={clsx(
              'text-xs',
              star <= Math.round(rating) ? 'text-warning' : 'text-text-muted',
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

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link
      href={`/skills/${skill.id}`}
      className={clsx(
        'group flex flex-col rounded-xl border border-border bg-surface',
        'hover:border-primary/40 hover:shadow-md transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'overflow-hidden',
      )}
    >
      {/* 썸네일 */}
      <div className="h-36 bg-bg-subtle flex items-center justify-center overflow-hidden">
        {skill.thumbnail_url ? (
          <img
            src={skill.thumbnail_url}
            alt={skill.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl text-primary">⚡</span>
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* 카테고리 */}
        <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5 self-start">
          {skill.category}
        </span>

        {/* 이름 + 설명 */}
        <h3 className="font-semibold text-text-primary text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {skill.name}
        </h3>
        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
          {skill.description}
        </p>

        {/* 작성자 */}
        <p className="text-xs text-text-muted">by {skill.author}</p>

        {/* 평점 */}
        <StarRating rating={skill.rating} count={skill.rating_count} />

        {/* 하단: 설치수 + 가격 */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <span className="text-xs text-text-muted">
            설치 {skill.install_count.toLocaleString()}회
          </span>
          <span
            className={clsx(
              'text-sm font-bold',
              skill.is_free ? 'text-success' : 'text-text-primary',
            )}
          >
            {skill.is_free ? '무료' : `${skill.price.toLocaleString()}${skill.currency}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkillCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden animate-pulse">
      <div className="h-36 bg-bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-bg-muted rounded w-1/4" />
        <div className="h-4 bg-bg-muted rounded w-3/4" />
        <div className="h-3 bg-bg-muted rounded w-full" />
        <div className="h-3 bg-bg-muted rounded w-2/3" />
        <div className="h-3 bg-bg-muted rounded w-1/3 mt-4" />
      </div>
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────

export default function SkillsMarketPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) ?? 'popular',
  );
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // 검색어 디바운스
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // URL 동기화
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (category) params.set('category', category);
    if (sort !== 'popular') params.set('sort', sort);
    router.replace(`/skills?${params.toString()}`, { scroll: false });
  }, [debouncedQuery, category, sort, router]);

  // API 페치
  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (category) params.set('category', category);
      params.set('sort', sort);

      const res = await fetch(`/api/skills?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSkills(data?.skills ?? data?.data ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '스킬 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, category, sort]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // ── 렌더 ────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">스킬 마켓</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            챗봇 능력을 확장하는 스킬을 발견하고 설치하세요.
          </p>
        </div>
        <Link
          href="/skills/my"
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'border border-border text-text-primary',
            'hover:bg-surface-hover transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          <span>📦</span>
          <span>내 스킬</span>
        </Link>
      </div>

      {/* 검색 바 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
          <input
            type="search"
            placeholder="스킬 검색..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
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
          onChange={(e: any) => setSort(e.target.value as SortOption)}
          className={clsx(
            'px-3 py-2.5 rounded-lg text-sm',
            'border border-border bg-surface text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary',
          )}
        >
          {SORT_OPTIONS.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
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
          {total > 0 ? `총 ${total.toLocaleString()}개 스킬` : '검색 결과가 없습니다.'}
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
          ? Array.from({ length: 8 }).map((_: any, i: any) => <SkillCardSkeleton key={i} />)
          : skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)}
      </div>

      {/* 빈 상태 */}
      {!loading && !error && skills.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🔍</span>
          <h3 className="text-lg font-semibold text-text-primary mb-1">스킬을 찾지 못했습니다</h3>
          <p className="text-sm text-text-secondary">다른 검색어나 카테고리를 시도해보세요.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategory('');
            }}
            className="mt-4 text-sm text-primary hover:underline"
          >
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
