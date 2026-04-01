/**
 * @task S4FE1
 * @description Business 페이지 — 수익 대시보드, 정산, 결제수단 관리
 *
 * Route: /business/revenue
 * API:   GET /api/revenue  — 매출 상세 목록
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import clsx from 'clsx';

// ── 타입 ──────────────────────────────────────────────────────

type RevenueSource = 'subscription' | 'tip' | 'marketplace';

interface RevenueItem {
  id: string;
  date: string;             // YYYY-MM-DD
  amount: number;
  source: RevenueSource;
  persona_id: string;
  persona_name: string;
  description: string | null;
}

interface RevenueResponse {
  items: RevenueItem[];
  total_count: number;
  total_amount: number;
}

// ── 상수 ─────────────────────────────────────────────────────

const SOURCE_LABELS: Record<RevenueSource, { label: string; color: string }> = {
  subscription: { label: '구독', color: 'bg-primary/10 text-primary' },
  tip:          { label: '팁',   color: 'bg-success/10 text-success' },
  marketplace:  { label: '마켓', color: 'bg-warning/10 text-warning' },
};

const SOURCE_OPTIONS: { value: RevenueSource | ''; label: string }[] = [
  { value: '',             label: '전체 소스' },
  { value: 'subscription', label: '구독' },
  { value: 'tip',          label: '팁' },
  { value: 'marketplace',  label: '마켓플레이스' },
];

// ── 유틸 ─────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function downloadCsv(items: RevenueItem[]) {
  const header = ['날짜', '금액', '소스', '페르소나', '설명'];
  const rows = items.map((i) => [
    i.date,
    i.amount.toString(),
    SOURCE_LABELS[i.source]?.label ?? i.source,
    i.persona_name,
    i.description ?? '',
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `revenue_${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── 스켈레톤 ─────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('rounded bg-bg-muted animate-pulse', className)} />;
}

// ── 소스 뱃지 ─────────────────────────────────────────────────

function SourceBadge({ source }: { source: RevenueSource }) {
  const { label, color } = SOURCE_LABELS[source] ?? { label: source, color: 'bg-bg-muted text-text-muted' };
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', color)}>
      {label}
    </span>
  );
}

// ── 빈 상태 ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <tr>
      <td colSpan={5}>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-text-muted text-sm">해당 기간에 매출 내역이 없습니다.</p>
        </div>
      </td>
    </tr>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────

export default function RevenuePage() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 필터 상태
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(today());
  const [source, setSource] = useState<RevenueSource | ''>('');

  // 페이지네이션
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const abortRef = useRef<AbortController | null>(null);

  const fetchRevenue = useCallback(async (
    start: string,
    end: string,
    src: string,
    pg: number,
  ) => {
    // 이전 요청 취소
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        start_date: start,
        end_date: end,
        page: String(pg),
        page_size: String(PAGE_SIZE),
      });
      if (src) params.set('source', src);

      const res = await fetch(`/api/revenue?${params}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: RevenueResponse = await res.json();
      setData(json);
    } catch (e: unknown) {
      if ((e as { name?: string })?.name !== 'AbortError') setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenue(startDate, endDate, source, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, source, page]);

  const handleFilter = () => {
    setPage(1);
    fetchRevenue(startDate, endDate, source, 1);
  };

  const totalPages = data ? Math.ceil(data.total_count / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-text-primary">매출 상세</h1>
        <p className="text-sm text-text-muted mt-0.5">
          기간·소스별로 매출 내역을 필터링하고 CSV로 내보낼 수 있습니다.
        </p>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* 시작일 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">시작일</label>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* 종료일 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">종료일</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={today()}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* 소스 필터 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">수익 소스</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as RevenueSource | '')}
            className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 빠른 기간 버튼 */}
        <div className="flex gap-1.5">
          {[
            { label: '7일', days: 7 },
            { label: '30일', days: 30 },
            { label: '90일', days: 90 },
          ].map(({ label, days }) => (
            <button
              key={days}
              onClick={() => {
                setStartDate(daysAgo(days));
                setEndDate(today());
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg-subtle transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={handleFilter}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          검색
        </button>

        {/* CSV 내보내기 */}
        <button
          onClick={() => data && downloadCsv(data.items)}
          disabled={!data || data.items.length === 0}
          className="ml-auto px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          CSV 내보내기
        </button>
      </div>

      {/* 요약 통계 */}
      {!loading && !error && data && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">총 건수</span>
            <span className="font-semibold text-text-primary">{data.total_count.toLocaleString()}건</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">합계</span>
            <span className="font-bold text-primary">₩{data.total_amount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-xl border border-border overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <p className="text-text-muted text-sm mb-3">데이터를 불러오지 못했습니다.</p>
            <button
              onClick={() => fetchRevenue(startDate, endDate, source, page)}
              className="text-primary text-sm hover:underline"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted">날짜</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted">금액</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted">소스</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted">페르소나</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted">설명</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data && data.items.length > 0 ? (
                  data.items.map((item) => (
                    <tr key={item.id} className="hover:bg-bg-subtle transition-colors">
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{item.date}</td>
                      <td className="px-4 py-3 text-right font-semibold text-text-primary">
                        ₩{item.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SourceBadge source={item.source} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary max-w-[160px] truncate">
                        {item.persona_name}
                      </td>
                      <td className="px-4 py-3 text-text-muted max-w-[200px] truncate">
                        {item.description ?? '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyState />
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <span className="text-sm text-text-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
