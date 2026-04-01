/**
 * @task S3FE3
 * @description 채용 공고 검색 페이지
 *
 * Route: /jobs/search
 * API: GET /api/jobs?search=&status=&limit=&offset=
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// ── 타입 정의 ────────────────────────────────────────────────

interface JobPosting {
  id: string;
  employer_id: string;
  title: string;
  description: string | null;
  required_skills: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  status: 'open' | 'closed' | 'filled';
  created_at: string;
  updated_at: string;
}

type StatusFilter = 'all' | 'open' | 'closed' | 'filled';

// ── 상수 ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<JobPosting['status'], string> = {
  open:   '모집 중',
  closed: '마감',
  filled: '채용 완료',
};

const STATUS_COLORS: Record<JobPosting['status'], string> = {
  open:   'bg-success/10 text-success border-success/20',
  closed: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  filled: 'bg-primary/10 text-primary border-primary/20',
};

const PAGE_SIZE = 12;

// ── 결과 카드 ────────────────────────────────────────────────

interface ResultCardProps {
  job: JobPosting;
  keyword: string;
}

function highlight(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text;
  const re = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="bg-warning/30 text-inherit rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function ResultCard({ job, keyword }: ResultCardProps) {
  const budgetText =
    job.budget_min !== null && job.budget_max !== null
      ? `${job.budget_min.toLocaleString('ko-KR')}원 ~ ${job.budget_max.toLocaleString('ko-KR')}원`
      : job.budget_min !== null
      ? `${job.budget_min.toLocaleString('ko-KR')}원 ~`
      : job.budget_max !== null
      ? `~ ${job.budget_max.toLocaleString('ko-KR')}원`
      : '협의 가능';

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-surface border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all duration-200 group-hover:bg-surface-hover">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-text-primary font-medium text-sm leading-snug line-clamp-2 flex-1">
            {highlight(job.title, keyword)}
          </h3>
          <span
            className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[job.status]}`}
          >
            {STATUS_LABELS[job.status]}
          </span>
        </div>
        {job.description && (
          <p className="text-text-muted text-xs line-clamp-2 mb-2">
            {highlight(job.description, keyword)}
          </p>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary font-medium">{budgetText}</span>
          <span className="text-text-muted">
            {new Date(job.created_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── 검색 내용 컴포넌트 ───────────────────────────────────────

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // URL 파라미터로 초기 검색
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      setInputValue(q);
      setSearched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResults = useCallback(async () => {
    if (!query.trim() && statusFilter === 'all') return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (query.trim()) params.set('search', query.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '검색에 실패했습니다.');
      }
      const data = await res.json();

      // 클라이언트 사이드 예산 필터 (API가 예산 필터를 지원하지 않으므로)
      let filtered: JobPosting[] = data.jobs ?? [];
      const minVal = budgetMin ? parseInt(budgetMin.replace(/,/g, ''), 10) : null;
      const maxVal = budgetMax ? parseInt(budgetMax.replace(/,/g, ''), 10) : null;
      if (minVal !== null) {
        filtered = filtered.filter((j) => (j.budget_max ?? 0) >= minVal);
      }
      if (maxVal !== null) {
        filtered = filtered.filter((j) => (j.budget_min ?? 0) <= maxVal);
      }

      setJobs(filtered);
      setTotal(filtered.length < PAGE_SIZE ? page * PAGE_SIZE + filtered.length : data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, budgetMin, budgetMax, page]);

  useEffect(() => {
    if (searched) {
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setQuery(inputValue);
    setPage(0);
    setSearched(true);
    // URL 업데이트
    const params = new URLSearchParams();
    if (inputValue.trim()) params.set('q', inputValue.trim());
    router.replace(`/jobs/search?${params.toString()}`, { scroll: false });
    // fetchResults는 query state 변경으로 트리거됨
  };

  // query 변경 시 자동 검색
  useEffect(() => {
    if (searched) fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, budgetMin, budgetMax]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/jobs"
          className="text-text-secondary hover:text-primary text-sm transition-colors"
        >
          ← 목록
        </Link>
        <h1 className="text-xl font-bold text-text-primary">채용 공고 검색</h1>
      </div>

      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="mb-5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="직무, 기술스택, 키워드를 입력하세요"
            className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
            autoFocus
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors text-sm flex-shrink-0"
          >
            검색
          </button>
        </div>
      </form>

      {/* 필터 영역 */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 상태 필터 */}
          <div>
            <label className="block text-xs text-text-muted mb-1.5">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(0); }}
              className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">전체</option>
              <option value="open">모집 중</option>
              <option value="closed">마감</option>
              <option value="filled">채용 완료</option>
            </select>
          </div>

          {/* 예산 최소 */}
          <div>
            <label className="block text-xs text-text-muted mb-1.5">예산 최소 (원)</label>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => { setBudgetMin(e.target.value); setPage(0); }}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 예산 최대 */}
          <div>
            <label className="block text-xs text-text-muted mb-1.5">예산 최대 (원)</label>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => { setBudgetMax(e.target.value); setPage(0); }}
              placeholder="제한 없음"
              min="0"
              className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          {error}
        </div>
      )}

      {/* 결과 */}
      {!searched ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm">검색어를 입력하거나 필터를 설정해 채용 공고를 찾아보세요.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-3xl mb-3">😔</p>
          <p className="text-sm">
            {query ? `"${query}"에 대한 검색 결과가 없습니다.` : '조건에 맞는 채용 공고가 없습니다.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-text-muted text-xs mb-3">
            총 {total.toLocaleString('ko-KR')}개 결과
            {query && <span> — &quot;{query}&quot;</span>}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {jobs.map((job) => (
              <ResultCard key={job.id} job={job} keyword={query} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-surface-hover transition-colors"
              >
                이전
              </button>
              <span className="text-sm text-text-secondary px-2">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-surface-hover transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── 페이지 래퍼 (useSearchParams → Suspense 필요) ─────────────

export default function JobSearchPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto animate-pulse h-96 bg-bg-muted rounded-xl" />}>
      <SearchContent />
    </Suspense>
  );
}
