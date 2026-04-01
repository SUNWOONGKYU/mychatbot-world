/**
 * @task S3FE1
 * @description 커리큘럼 목록 페이지 — 카테고리별 목록, 진도율, 학습 시작/계속 버튼
 *
 * Route: /learning/curriculum
 * - GET /api/school/progress → 커리큘럼별 진도율
 *
 * 커리큘럼 메타데이터는 /api/school/progress 응답에서 curriculum_id로 그룹핑하여 표시.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

// ── 타입 정의 ────────────────────────────────────────────────

type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

interface LearningProgress {
  id: string;
  user_id: string;
  curriculum_id: string;
  module_id: string;
  progress_rate: number;
  status: ProgressStatus;
  last_accessed_at: string;
  completed_at: string | null;
}

/** curriculum_id를 기준으로 집계한 커리큘럼 요약 */
interface CurriculumSummary {
  curriculum_id: string;
  total_modules: number;
  completed_modules: number;
  avg_progress: number;
  last_accessed_at: string | null;
  overall_status: ProgressStatus;
}

// ── 헬퍼: progress 목록을 curriculum_id 단위로 집계 ──────────

function aggregateByCurriculum(list: LearningProgress[]): CurriculumSummary[] {
  const map = new Map<string, LearningProgress[]>();
  for (const p of list) {
    if (!map.has(p.curriculum_id)) map.set(p.curriculum_id, []);
    map.get(p.curriculum_id)!.push(p);
  }

  return Array.from(map.entries()).map(([curriculum_id, items]) => {
    const completed = items.filter((i) => i.status === 'completed').length;
    const avg = items.reduce((s, i) => s + i.progress_rate, 0) / items.length;
    const last = items
      .map((i) => i.last_accessed_at)
      .sort()
      .reverse()[0] ?? null;

    let overall_status: ProgressStatus = 'not_started';
    if (completed === items.length) overall_status = 'completed';
    else if (items.some((i) => i.status !== 'not_started')) overall_status = 'in_progress';

    return {
      curriculum_id,
      total_modules: items.length,
      completed_modules: completed,
      avg_progress: Math.round(avg),
      last_accessed_at: last,
      overall_status,
    };
  });
}

// ── 진도 프로그레스 바 ───────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0~100
  colorClass?: string;
}

function ProgressBar({ value, colorClass = 'bg-primary' }: ProgressBarProps) {
  return (
    <div className="h-2 w-full rounded-full bg-bg-muted overflow-hidden">
      <div
        className={clsx('h-full rounded-full transition-all duration-500', colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

// ── 상태 배지 ────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProgressStatus }) {
  const label: Record<ProgressStatus, string> = {
    not_started: '미시작',
    in_progress: '진행 중',
    completed:   '완료',
  };
  const cls: Record<ProgressStatus, string> = {
    not_started: 'bg-bg-muted text-text-muted',
    in_progress: 'bg-info/10 text-info',
    completed:   'bg-success/10 text-success',
  };

  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cls[status])}>
      {label[status]}
    </span>
  );
}

// ── 커리큘럼 카드 ────────────────────────────────────────────

interface CurriculumCardProps {
  summary: CurriculumSummary;
  onStart: (curriculumId: string) => void;
}

function CurriculumCard({ summary, onStart }: CurriculumCardProps) {
  const hasProgress = summary.avg_progress > 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4 hover:border-border-strong transition-colors">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {summary.curriculum_id}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {summary.completed_modules} / {summary.total_modules} 모듈 완료
          </p>
        </div>
        <StatusBadge status={summary.overall_status} />
      </div>

      {/* 진도율 바 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>진도율</span>
          <span className="font-semibold text-text-primary">{summary.avg_progress}%</span>
        </div>
        <ProgressBar
          value={summary.avg_progress}
          colorClass={summary.overall_status === 'completed' ? 'bg-success' : 'bg-primary'}
        />
      </div>

      {/* 버튼 */}
      <button
        onClick={() => onStart(summary.curriculum_id)}
        className={clsx(
          'w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          hasProgress
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'bg-bg-subtle text-text-primary hover:bg-bg-muted border border-border',
        )}
      >
        {summary.overall_status === 'completed'
          ? '복습하기'
          : hasProgress
          ? '계속 학습하기'
          : '학습 시작'}
      </button>
    </div>
  );
}

// ── 스켈레톤 ────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-5 space-y-4 animate-pulse"
        >
          <div className="h-4 bg-bg-muted rounded w-2/3" />
          <div className="h-2 bg-bg-muted rounded-full w-full" />
          <div className="h-9 bg-bg-muted rounded-lg w-full" />
        </div>
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function CurriculumListPage() {
  const router = useRouter();
  const [progressList, setProgressList] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/school/progress');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setProgressList(data.progress_list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '커리큘럼 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const summaries = aggregateByCurriculum(progressList);

  const handleStart = (curriculumId: string) => {
    // 새 세션 시작: 세션 생성 후 세션 페이지로 이동
    // 세션 생성은 LearningSession 컴포넌트에서 처리
    router.push(`/learning/session?curriculum_id=${encodeURIComponent(curriculumId)}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href="/learning"
          className="text-text-secondary hover:text-text-primary transition-colors text-sm"
          aria-label="학습 대시보드로 돌아가기"
        >
          ← 대시보드
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">커리큘럼</h1>
        <p className="text-sm text-text-secondary mt-1">
          학습할 커리큘럼을 선택하고 AI 시나리오를 시작하세요.
        </p>
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchProgress}
            className="ml-4 text-xs underline hover:no-underline shrink-0"
          >
            재시도
          </button>
        </div>
      )}

      {/* 콘텐츠 */}
      {loading ? (
        <SkeletonGrid />
      ) : summaries.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-border bg-bg-subtle p-12 text-center">
          <p className="text-text-secondary">등록된 커리큘럼이 없습니다.</p>
          <p className="text-xs text-text-muted mt-2">
            관리자에게 커리큘럼 추가를 요청하세요.
          </p>
        </div>
      ) : (
        <>
          {/* 요약 통계 */}
          <div className="flex gap-6 text-sm text-text-secondary">
            <span>
              전체{' '}
              <span className="font-semibold text-text-primary">{summaries.length}</span>
              개 커리큘럼
            </span>
            <span>
              완료{' '}
              <span className="font-semibold text-success">
                {summaries.filter((s) => s.overall_status === 'completed').length}
              </span>
              개
            </span>
          </div>

          {/* 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaries.map((summary) => (
              <CurriculumCard
                key={summary.curriculum_id}
                summary={summary}
                onStart={handleStart}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
