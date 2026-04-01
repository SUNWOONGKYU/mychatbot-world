/**
 * @task S4FE1
 * @description Business 페이지 — 수익 대시보드, 정산, 결제수단 관리
 *
 * Route: /business
 * API:   GET /api/revenue/dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 ──────────────────────────────────────────────────────

interface RevenueSummary {
  this_month_revenue: number;
  last_month_revenue: number;
  change_rate: number;
  pending_settlement: number;
  total_revenue: number;
}

interface RevenueChartPoint {
  date: string;        // YYYY-MM-DD
  amount: number;
}

interface TopPersona {
  persona_id: string;
  persona_name: string;
  revenue: number;
  rank: number;
}

interface DashboardData {
  summary: RevenueSummary;
  chart: RevenueChartPoint[];
  top_personas: TopPersona[];
}

// ── 스켈레톤 ─────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-lg bg-bg-muted animate-pulse',
        className,
      )}
    />
  );
}

// ── 요약 카드 ─────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: 'success' | 'error' | 'muted';
  accentColor?: string;
  loading?: boolean;
}

function StatCard({ label, value, sub, subColor = 'muted', accentColor, loading }: StatCardProps) {
  const subColorClass =
    subColor === 'success' ? 'text-success' :
    subColor === 'error'   ? 'text-error'   :
    'text-text-muted';

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-surface p-5 relative overflow-hidden',
        accentColor && 'before:absolute before:inset-x-0 before:top-0 before:h-0.5',
      )}
      style={accentColor ? { ['--tw-before-bg' as string]: accentColor } : undefined}
    >
      {accentColor && (
        <div
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: accentColor }}
        />
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
        {label}
      </p>
      <p className="text-2xl font-extrabold text-text-primary">{value}</p>
      {sub && <p className={clsx('mt-1 text-xs font-medium', subColorClass)}>{sub}</p>}
    </div>
  );
}

// ── 간이 바 차트 (SVG) ────────────────────────────────────────

function RevenueBarChart({ data, loading }: { data: RevenueChartPoint[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 flex items-center justify-center h-48">
        <p className="text-text-muted text-sm">매출 데이터가 없습니다</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.amount), 1);
  const chartH = 140;
  const barW = Math.max(6, Math.floor((640 - 32) / data.length) - 3);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-text-primary mb-4">최근 30일 매출 추이</p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(data.length * (barW + 3), 300)} ${chartH + 24}`}
          className="w-full"
          preserveAspectRatio="xMinYMid meet"
          aria-label="매출 추이 차트"
        >
          {data.map((point, i) => {
            const barH = Math.max(2, (point.amount / maxVal) * chartH);
            const x = i * (barW + 3);
            const y = chartH - barH;
            const isLast7 = i >= data.length - 7;
            return (
              <g key={point.date}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={2}
                  fill={isLast7 ? 'rgb(99 102 241)' : 'rgb(99 102 241 / 0.35)'}
                />
                {/* x-axis label every 7 days */}
                {i % 7 === 0 && (
                  <text
                    x={x + barW / 2}
                    y={chartH + 16}
                    fontSize={9}
                    textAnchor="middle"
                    fill="rgb(107 114 128)"
                  >
                    {point.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── Top Personas 목록 ─────────────────────────────────────────

function TopPersonaList({
  personas,
  loading,
}: {
  personas: TopPersona[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <Skeleton className="h-5 w-40 mb-2" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!personas.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm font-semibold text-text-primary mb-4">상위 수익 페르소나 Top 5</p>
        <div className="text-center py-8">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-text-muted text-sm">아직 수익 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-text-primary mb-4">상위 수익 페르소나 Top 5</p>
      <ol className="space-y-3">
        {personas.map((p) => (
          <li key={p.persona_id} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
              {p.rank}
            </span>
            <span className="flex-1 text-sm text-text-primary truncate">{p.persona_name}</span>
            <span className="text-sm font-semibold text-text-primary">
              ₩{p.revenue.toLocaleString()}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── 빈 상태 ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl mb-4">💰</p>
      <h2 className="text-lg font-bold text-text-primary mb-2">아직 수익 데이터가 없습니다</h2>
      <p className="text-sm text-text-muted max-w-xs">
        챗봇을 배포하고 이용자가 생기면 수익 현황이 여기에 표시됩니다.
      </p>
    </div>
  );
}

// ── 에러 상태 ─────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl mb-4">⚠️</p>
      <h2 className="text-lg font-bold text-text-primary mb-2">데이터를 불러오지 못했습니다</h2>
      <p className="text-sm text-text-muted mb-4">잠시 후 다시 시도해 주세요.</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────

export default function BusinessDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/revenue/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardData = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fmt = (n: number) => `₩${n.toLocaleString()}`;

  const changeRate = data?.summary.change_rate ?? 0;
  const changeLabel =
    changeRate > 0
      ? `▲ ${changeRate.toFixed(1)}% 전월 대비`
      : changeRate < 0
      ? `▼ ${Math.abs(changeRate).toFixed(1)}% 전월 대비`
      : '전월과 동일';
  const changeColor: 'success' | 'error' | 'muted' =
    changeRate > 0 ? 'success' : changeRate < 0 ? 'error' : 'muted';

  const isEmpty =
    !loading && !error && data?.summary.total_revenue === 0 && !data?.chart.length;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">비즈니스 대시보드</h1>
          <p className="text-sm text-text-muted mt-0.5">
            수익 현황, 매출 추이, 정산 내역을 한눈에 확인하세요.
          </p>
        </div>
        <nav className="flex gap-2 flex-shrink-0">
          <Link
            href="/business/revenue"
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-subtle transition-colors"
          >
            매출 상세
          </Link>
          <Link
            href="/business/settlement"
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            정산 관리
          </Link>
        </nav>
      </div>

      {/* 에러 */}
      {error && <ErrorState onRetry={fetchDashboard} />}

      {/* 빈 상태 */}
      {isEmpty && <EmptyState />}

      {/* 데이터 영역 */}
      {!error && !isEmpty && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="이번 달 매출"
              value={loading ? '—' : fmt(data!.summary.this_month_revenue)}
              sub={loading ? undefined : changeLabel}
              subColor={changeColor}
              accentColor="rgb(99 102 241)"
              loading={loading}
            />
            <StatCard
              label="보류 중인 정산"
              value={loading ? '—' : fmt(data!.summary.pending_settlement)}
              sub="정산 가능 금액"
              subColor="muted"
              accentColor="rgb(234 179 8)"
              loading={loading}
            />
            <StatCard
              label="누적 총 매출"
              value={loading ? '—' : fmt(data!.summary.total_revenue)}
              sub="서비스 시작 이후"
              subColor="muted"
              accentColor="rgb(34 197 94)"
              loading={loading}
            />
          </div>

          {/* 차트 + Top 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <RevenueBarChart data={data?.chart ?? []} loading={loading} />
            </div>
            <div>
              <TopPersonaList personas={data?.top_personas ?? []} loading={loading} />
            </div>
          </div>

          {/* 빠른 링크 */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/business/revenue"
                className="rounded-xl border border-border bg-surface p-5 hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                      매출 상세 보기
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">날짜·소스별 필터, CSV 내보내기</p>
                  </div>
                  <span className="ml-auto text-text-muted group-hover:text-primary transition-colors">→</span>
                </div>
              </Link>
              <Link
                href="/business/settlement"
                className="rounded-xl border border-border bg-surface p-5 hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                      정산 내역 관리
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">정산 요청, 결제수단 관리</p>
                  </div>
                  <span className="ml-auto text-text-muted group-hover:text-primary transition-colors">→</span>
                </div>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
