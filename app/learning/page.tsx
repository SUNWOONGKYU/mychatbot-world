/**
 * @task S3FE1
 * @description 학습 대시보드 — 진도 현황, 최근 세션, 추천 커리큘럼
 *
 * Route: /learning
 * - GET /api/school/progress  → 전체 진도율
 * - GET /api/school/session   → 최근 세션 목록
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  created_at: string;
  updated_at: string;
}

type SessionStatus = 'active' | 'completed' | 'abandoned';
type ScenarioType = 'roleplay' | 'interview' | 'debate' | 'presentation';

interface LearningSession {
  id: string;
  user_id: string;
  curriculum_id: string;
  scenario_type: ScenarioType;
  status: SessionStatus;
  score: number | null;
  metadata: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
}

// ── 헬퍼 ────────────────────────────────────────────────────

const SCENARIO_LABEL: Record<ScenarioType, string> = {
  roleplay:     '롤플레이',
  interview:    '인터뷰',
  debate:       '토론',
  presentation: '발표',
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  active:    '진행 중',
  completed: '완료',
  abandoned: '중단',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── 스켈레톤 ────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 animate-pulse space-y-3">
      <div className="h-4 bg-bg-muted rounded w-1/3" />
      <div className="h-3 bg-bg-muted rounded w-2/3" />
      <div className="h-2 bg-bg-muted rounded-full w-full" />
    </div>
  );
}

// ── 전체 진도율 요약 카드 ────────────────────────────────────

interface ProgressSummaryProps {
  progressList: LearningProgress[];
}

function ProgressSummaryCard({ progressList }: ProgressSummaryProps) {
  if (progressList.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-text-secondary text-sm">아직 학습 진도가 없습니다.</p>
        <Link
          href="/learning/curriculum"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          커리큘럼 시작하기
        </Link>
      </div>
    );
  }

  const avg =
    progressList.reduce((sum: any, p: any) => sum + p.progress_rate, 0) / progressList.length;
  const completed = progressList.filter((p: any) => p.status === 'completed').length;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          전체 진도율
        </h2>
        <span className="text-2xl font-bold text-primary">{Math.round(avg)}%</span>
      </div>

      {/* 전체 프로그레스 바 */}
      <div className="h-3 w-full rounded-full bg-bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${avg}%` }}
        />
      </div>

      <div className="flex gap-6 text-sm text-text-secondary">
        <span>
          <span className="font-semibold text-text-primary">{completed}</span> / {progressList.length} 모듈 완료
        </span>
      </div>
    </div>
  );
}

// ── 최근 세션 목록 ───────────────────────────────────────────

interface RecentSessionsProps {
  sessions: LearningSession[];
}

function RecentSessionsList({ sessions }: RecentSessionsProps) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-text-secondary py-4">
        최근 학습 세션이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.slice(0, 5).map((session) => (
        <li
          key={session.id}
          className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">
              {SCENARIO_LABEL[session.scenario_type]} 세션
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {formatDate(session.started_at)}
            </p>
          </div>

          <div className="ml-4 flex items-center gap-3 shrink-0">
            {session.score !== null && (
              <span
                className={clsx(
                  'text-sm font-semibold',
                  session.score >= 85 ? 'text-success' : 'text-text-secondary',
                )}
              >
                {session.score}점
              </span>
            )}
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                session.status === 'completed'
                  ? 'bg-success/10 text-success'
                  : session.status === 'active'
                  ? 'bg-info/10 text-info'
                  : 'bg-bg-muted text-text-muted',
              )}
            >
              {STATUS_LABEL[session.status]}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── 빠른 이동 카드 ───────────────────────────────────────────

function QuickNav() {
  const items = [
    { href: '/learning/curriculum', label: '커리큘럼 보기',   icon: '📚', desc: '학습할 커리큘럼을 선택하세요' },
    { href: '/learning/certificate', label: '내 인증서',     icon: '🏆', desc: '획득한 인증서를 확인하세요' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={clsx(
            'group flex items-start gap-4 rounded-xl border border-border bg-surface p-5',
            'hover:border-primary/50 hover:bg-primary/5 transition-colors',
          )}
        >
          <span className="text-2xl" aria-hidden="true">{item.icon}</span>
          <div>
            <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
              {item.label}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function LearningDashboard() {
  const [progressList, setProgressList] = useState<LearningProgress[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoadingProgress(true);
    setProgressError(null);
    try {
      const res = await fetch('/api/school/progress');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setProgressList(data.progress_list ?? []);
    } catch (err) {
      setProgressError(err instanceof Error ? err.message : '진도 정보를 불러오지 못했습니다.');
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const res = await fetch('/api/school/session');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : '세션 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
    fetchSessions();
  }, [fetchProgress, fetchSessions]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">학습 대시보드</h1>
        <p className="text-sm text-text-secondary mt-1">
          AI 시나리오 학습으로 실전 역량을 키우세요.
        </p>
      </div>

      {/* 전체 진도율 */}
      <section aria-label="전체 진도율">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          진도 현황
        </h2>
        {loadingProgress ? (
          <SkeletonCard />
        ) : progressError ? (
          <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">
            {progressError}
            <button
              onClick={fetchProgress}
              className="ml-3 underline text-xs hover:no-underline"
            >
              재시도
            </button>
          </div>
        ) : (
          <ProgressSummaryCard progressList={progressList} />
        )}
      </section>

      {/* 빠른 이동 */}
      <section aria-label="빠른 이동">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          메뉴
        </h2>
        <QuickNav />
      </section>

      {/* 최근 세션 */}
      <section aria-label="최근 학습 세션">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            최근 세션
          </h2>
          <Link
            href="/learning/curriculum"
            className="text-xs font-medium text-primary hover:underline"
          >
            새 세션 시작
          </Link>
        </div>

        {loadingSessions ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i: any) => (
              <div key={i} className="h-14 bg-bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sessionsError ? (
          <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">
            {sessionsError}
            <button
              onClick={fetchSessions}
              className="ml-3 underline text-xs hover:no-underline"
            >
              재시도
            </button>
          </div>
        ) : (
          <RecentSessionsList sessions={sessions} />
        )}
      </section>
    </div>
  );
}
