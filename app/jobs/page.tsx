/**
 * @task S3FE3
 * @description 채용 공고 목록 페이지 — 필터/정렬/카드
 *
 * Route: /jobs
 * API: GET /api/jobs?status=&search=&limit=&offset=
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── 타입 정의 ────────────────────────────────────────────────

export interface JobPosting {
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

// ── 서브 컴포넌트 ─────────────────────────────────────────────

interface JobCardProps {
  job: JobPosting;
}

function JobCard({ job }: JobCardProps) {
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
      <div className="bg-surface border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200 group-hover:bg-surface-hover">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-text-primary font-semibold text-base leading-snug line-clamp-2 flex-1">
            {job.title}
          </h3>
          <span
            className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[job.status]}`}
          >
            {STATUS_LABELS[job.status]}
          </span>
        </div>

        {/* 설명 */}
        {job.description && (
          <p className="text-text-secondary text-sm line-clamp-2 mb-3">
            {job.description}
          </p>
        )}

        {/* 스킬 태그 */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.required_skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="text-xs bg-bg-muted text-text-secondary px-2 py-0.5 rounded-md border border-border"
              >
                {skill}
              </span>
            ))}
            {job.required_skills.length > 5 && (
              <span className="text-xs text-text-muted">
                +{job.required_skills.length - 5}개
              </span>
            )}
          </div>
        )}

        {/* 하단 메타 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-primary font-medium">{budgetText}</span>
          <span className="text-text-muted text-xs">
            {new Date(job.created_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── 스켈레톤 ─────────────────────────────────────────────────

function JobCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-5 bg-bg-muted rounded w-3/4" />
        <div className="h-6 bg-bg-muted rounded-full w-16 flex-shrink-0" />
      </div>
      <div className="h-4 bg-bg-muted rounded w-full mb-2" />
      <div className="h-4 bg-bg-muted rounded w-2/3 mb-3" />
      <div className="flex gap-1.5 mb-3">
        {[1, 2, 3].map((i: any) => (
          <div key={i} className="h-5 bg-bg-muted rounded-md w-16" />
        ))}
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-bg-muted rounded w-32" />
        <div className="h-4 bg-bg-muted rounded w-20" />
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────

const PAGE_SIZE = 12;

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '채용 공고를 불러오지 못했습니다.');
      }

      const data = await res.json();
      setJobs(data.jobs ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // 필터 변경 시 첫 페이지로
  const handleStatusChange = (s: StatusFilter) => {
    setStatusFilter(s);
    setPage(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: 'all',    label: '전체' },
    { value: 'open',   label: '모집 중' },
    { value: 'closed', label: '마감' },
    { value: 'filled', label: '채용 완료' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">수익활동</h1>
          <p className="text-text-secondary text-sm mt-1">
            AI 챗봇 전문가를 찾는 채용 공고 목록입니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/jobs/search')}
            className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-hover text-sm transition-colors"
          >
            검색
          </button>
          <button
            onClick={() => router.push('/jobs/create')}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover text-sm font-medium transition-colors"
          >
            공고 등록
          </button>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {STATUS_FILTERS.map((f: any) => (
          <button
            key={f.value}
            onClick={() => handleStatusChange(f.value)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              statusFilter === f.value
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto flex items-center text-text-muted text-xs pr-1">
          총 {total.toLocaleString('ko-KR')}개
        </span>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          {error}
          <button
            onClick={fetchJobs}
            className="ml-3 underline hover:no-underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_: any, i: any) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-text-secondary mb-1">채용 공고가 없습니다</p>
          <p className="text-sm">
            {statusFilter !== 'all' ? '다른 필터를 시도해보세요.' : '아직 등록된 채용 공고가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job: any) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p: any) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-surface-hover transition-colors"
          >
            이전
          </button>
          <span className="text-sm text-text-secondary px-2">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p: any) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-surface-hover transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
