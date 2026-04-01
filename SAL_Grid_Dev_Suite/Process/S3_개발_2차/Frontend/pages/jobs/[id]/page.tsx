/**
 * @task S3FE3
 * @description 채용 공고 상세 페이지
 *
 * Route: /jobs/[id]
 * API:
 *   GET    /api/jobs/[id]        — 공고 상세
 *   POST   /api/jobs/match       — AI 매칭 점수 요청
 *   POST   /api/jobs/hire        — 지원 (고용주: 채용 확정)
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MatchResult } from '@/components/jobs/match-result';

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

// ── 메인 페이지 ──────────────────────────────────────────────

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 지원 상태
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // 매칭 상태 (MatchResult 컴포넌트에서 관리되지만, 페이지에서도 트리거)
  const [matchJobId, setMatchJobId] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '채용 공고를 불러오지 못했습니다.');
      }
      const data = await res.json();
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // 지원하기 (POST /api/jobs/match — 매칭 신청으로 처리)
  const handleApply = async () => {
    if (!job || applying || applied) return;
    setApplying(true);
    setApplyError(null);
    try {
      const token = localStorage.getItem('sb-access-token') ?? '';
      const res = await fetch('/api/jobs/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ job_id: job.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '지원에 실패했습니다.');
      }
      setApplied(true);
      setMatchJobId(job.id); // MatchResult 컴포넌트 표시 트리거
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setApplying(false);
    }
  };

  // 로딩
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-muted rounded w-3/4" />
          <div className="h-6 bg-bg-muted rounded w-24" />
          <div className="h-4 bg-bg-muted rounded w-full" />
          <div className="h-4 bg-bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  // 에러
  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-text-secondary mb-4">{error ?? '채용 공고를 찾을 수 없습니다.'}</p>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline text-sm"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const budgetText =
    job.budget_min !== null && job.budget_max !== null
      ? `${job.budget_min.toLocaleString('ko-KR')}원 ~ ${job.budget_max.toLocaleString('ko-KR')}원`
      : job.budget_min !== null
      ? `${job.budget_min.toLocaleString('ko-KR')}원 ~`
      : job.budget_max !== null
      ? `~ ${job.budget_max.toLocaleString('ko-KR')}원`
      : '협의 가능';

  return (
    <div className="max-w-3xl mx-auto">
      {/* 뒤로가기 */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-text-secondary hover:text-primary text-sm mb-6 transition-colors"
      >
        ← 목록으로
      </Link>

      {/* 공고 헤더 */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-text-primary leading-snug flex-1">
            {job.title}
          </h1>
          <span
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border ${STATUS_COLORS[job.status]}`}
          >
            {STATUS_LABELS[job.status]}
          </span>
        </div>

        {/* 예산 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-text-muted">예산</span>
          <span className="text-primary font-semibold">{budgetText}</span>
        </div>

        {/* 설명 */}
        {job.description && (
          <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap mb-4">
            {job.description}
          </p>
        )}

        {/* 필요 스킬 */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-text-muted mb-2">필요 스킬</p>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill) => (
                <span
                  key={skill}
                  className="text-sm bg-bg-muted text-text-secondary px-3 py-1 rounded-lg border border-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 날짜 */}
        <div className="text-xs text-text-muted pt-4 border-t border-border">
          등록일: {new Date(job.created_at).toLocaleDateString('ko-KR')}
          {job.updated_at !== job.created_at && (
            <span className="ml-3">
              수정일: {new Date(job.updated_at).toLocaleDateString('ko-KR')}
            </span>
          )}
        </div>
      </div>

      {/* AI 매칭 섹션 */}
      <div className="mb-5">
        <MatchResult jobId={job.id} autoLoad={applied || matchJobId === job.id} />
      </div>

      {/* 지원 버튼 */}
      {job.status === 'open' && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-base font-semibold text-text-primary mb-3">지원하기</h2>
          <p className="text-text-secondary text-sm mb-4">
            AI 매칭을 통해 이 공고에 지원할 수 있습니다. 지원 후 고용주의 검토를 기다려주세요.
          </p>
          {applyError && (
            <p className="text-error text-sm mb-3">{applyError}</p>
          )}
          {applied ? (
            <div className="flex items-center gap-2 text-success">
              <span>✓</span>
              <span className="text-sm font-medium">지원이 완료되었습니다. AI 매칭 점수를 확인하세요.</span>
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-60 transition-colors"
            >
              {applying ? '지원 중...' : '지원하기'}
            </button>
          )}
        </div>
      )}

      {job.status !== 'open' && (
        <div className="bg-bg-muted border border-border rounded-2xl p-5 text-center text-text-muted text-sm">
          이 채용 공고는 {STATUS_LABELS[job.status]} 상태로 지원이 불가합니다.
        </div>
      )}
    </div>
  );
}
