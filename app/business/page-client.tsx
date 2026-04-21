/**
 * @task S4FE1
 * @description Business(수익 대시보드) 클라이언트 컴포넌트 — Vanilla 원본 충실 전환
 * Route: /business
 * APIs:
 *   GET /api/Backend_APIs/bots         — 봇 목록
 *   GET /api/Backend_APIs/revenue      — 수익 데이터 (total, thisMonth, unsettled, monthly, byEventType)
 *   GET /api/Backend_APIs/revenue?botId=X — 봇 필터 적용
 */

'use client';

import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ── 타입 ──────────────────────────────────────────────────────────────

interface BotItem {
  id: string;
  name: string;
}

interface MonthlyPoint {
  month: string;   // e.g. "1월"
  amount: number;
}

interface BotBarItem {
  botName?: string;
  eventType?: string;
  amount: number;
}

interface RevenueData {
  total: number;
  thisMonth: number;
  unsettled: number;
  monthly?: MonthlyPoint[];
  byEventType?: BotBarItem[];
}

// ── 상수 ──────────────────────────────────────────────────────────────

const BAR_COLORS = [
  '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316',
];

// ── 유틸 ──────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  return Math.floor(n).toLocaleString('ko-KR');
}

function generateDemoMonthly(): MonthlyPoint[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      month: (d.getMonth() + 1) + '월',
      amount: Math.floor(Math.random() * 50_000) + 5_000,
    };
  });
}

// ── 스켈레톤 ──────────────────────────────────────────────────────────

function SkeletonLine({ width, height, className = '' }: { width: string | number; height: string | number; className?: string }) {
  return (
    <div
      className={`rounded skeleton-shimmer ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        background: 'linear-gradient(90deg, rgb(var(--bg-muted)) 25%, rgb(var(--bg-surface-hover)) 50%, rgb(var(--bg-muted)) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  );
}

// ── Canvas 월별 바 차트 ────────────────────────────────────────────────

function MonthlyBarChart({ data }: { data: MonthlyPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const containerW = container.clientWidth;
    const H = 200;

    canvas.width = containerW * dpr;
    canvas.height = H * dpr;
    canvas.style.width = containerW + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const W = containerW;
    const padL = 60, padR = 20, padT = 20, padB = 40;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Canvas text colors: read from CSS custom properties for theme awareness
    const rootStyle = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const textMutedRgb  = rootStyle?.getPropertyValue('--text-muted').trim()         || '107 114 128';
    const textSecondary = rootStyle?.getPropertyValue('--text-secondary-rgb').trim() || '75 85 99';
    const borderSubtle  = rootStyle?.getPropertyValue('--border-subtle-rgb').trim()  || '229 231 235';

    if (!data || data.length === 0) {
      ctx.fillStyle = `rgb(${textMutedRgb})`;
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('데이터가 없습니다', W / 2, H / 2);
      return;
    }

    const maxVal = Math.max(...data.map((d) => d.amount || 0), 1);
    const barCount = data.length;
    const barWidth = Math.max(8, (chartW / barCount) * 0.55);
    const gap = chartW / barCount;

    // 그리드 라인
    ctx.strokeStyle = borderSubtle.includes('/') ? `rgba(${borderSubtle.replace('/', ',')})` : `rgb(${borderSubtle})`;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();

      const val = Math.round((maxVal / 4) * i);
      ctx.fillStyle = `rgb(${textMutedRgb})`;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'K' : String(val), padL - 8, y + 4);
    }

    // 바
    data.forEach((d, i) => {
      const x = padL + i * gap + (gap - barWidth) / 2;
      const barH = Math.max(2, ((d.amount || 0) / maxVal) * chartH);
      const y = padT + chartH - barH;

      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#4f46e5');
      ctx.fillStyle = grad;

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      } else {
        ctx.rect(x, y, barWidth, barH);
      }
      ctx.fill();

      // X축 레이블
      ctx.fillStyle = `rgb(${textSecondary})`;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.month || String(i + 1) + '월', x + barWidth / 2, padT + chartH + 20);
    });
  }, [data]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const timer = { id: 0 };
    const onResize = () => {
      clearTimeout(timer.id);
      timer.id = window.setTimeout(draw, 200) as unknown as number;
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer.id);
    };
  }, [draw]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </div>
  );
}

// ── 봇별 수익 바 ──────────────────────────────────────────────────────

interface BotBarRowProps {
  item: BotBarItem;
  idx: number;
  maxAmt: number;
  total: number;
}

function BotBarRow({ item, idx, maxAmt, total }: BotBarRowProps) {
  const [width, setWidth] = useState(0);
  const pct = Math.round(((item.amount || 0) / Math.max(total, 1)) * 100);
  const barPct = Math.round(((item.amount || 0) / Math.max(maxAmt, 1)) * 100);
  const color = BAR_COLORS[idx % BAR_COLORS.length];
  const name = item.botName || item.eventType || `봇 ${idx + 1}`;

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(barPct));
    return () => cancelAnimationFrame(id);
  }, [barPct]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div
        title={name}
        style={{
          flexShrink: 0,
          width: 140,
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'rgb(var(--text-primary-rgb))',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </div>
      <div
        style={{
          flex: 1,
          height: '0.625rem',
          background: 'rgb(var(--bg-muted))',
          borderRadius: 9999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 9999,
            background: color,
            width: `${width}%`,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div
        style={{
          flexShrink: 0,
          width: 80,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'rgb(var(--text-secondary-rgb))',
          textAlign: 'right',
        }}
      >
        {fmtNum(item.amount || 0)} C
      </div>
      <div
        style={{
          flexShrink: 0,
          width: 44,
          fontSize: '0.75rem',
          color: 'rgb(var(--text-muted))',
          textAlign: 'right',
        }}
      >
        {pct}%
      </div>
    </div>
  );
}

// ── 메인 클라이언트 컴포넌트 ──────────────────────────────────────────

export default function BusinessDashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 봇 선택
  const [allBots, setAllBots] = useState<BotItem[]>([]);
  const [currentBotId, setCurrentBotId] = useState<string>(
    searchParams?.get('botId') || 'all',
  );

  // 데이터
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [byEventType, setByEventType] = useState<BotBarItem[]>([]);

  // 상태
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('수익 데이터를 불러오지 못했습니다.');

  // ── 봇 목록 로드 ────────────────────────────────────────────────────

  const loadBots = useCallback(async () => {
    try {
      const token = (typeof window !== 'undefined' && localStorage.getItem('mcw_token')) || '';
      const res = await fetch('/api/Backend_APIs/bots', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setAllBots(json.data || []);
    } catch {
      // 봇 목록 로드 실패 시 무시
    }
  }, []);

  // ── 수익 데이터 로드 ────────────────────────────────────────────────

  const loadRevenue = useCallback(async (botId: string) => {
    setState('loading');
    try {
      const token = (typeof window !== 'undefined' && localStorage.getItem('mcw_token')) || '';
      const url =
        botId === 'all'
          ? '/api/Backend_APIs/revenue'
          : `/api/Backend_APIs/revenue?botId=${encodeURIComponent(botId)}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '서버 오류');

      const data: RevenueData = json.data;
      setRevenueData(data);
      setMonthlyData(data.monthly && data.monthly.length > 0 ? data.monthly : generateDemoMonthly());
      setByEventType(data.byEventType || []);
      setState('loaded');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '수익 데이터를 불러오지 못했습니다.';
      setErrorMsg(msg);
      setState('error');
    }
  }, []);

  // ── 봇 변경 핸들러 ──────────────────────────────────────────────────

  const onBotChange = useCallback((botId: string) => {
    setCurrentBotId(botId);
    // URL 파라미터 갱신
    const url = new URL(window.location.href);
    if (botId === 'all') url.searchParams.delete('botId');
    else url.searchParams.set('botId', botId);
    window.history.replaceState({}, '', url.toString());
    loadRevenue(botId);
  }, [loadRevenue]);

  // ── 초기화 ──────────────────────────────────────────────────────────

  useEffect(() => {
    // 인증 확인
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('sb-hlpovizxnrnspobddxmq-auth-token');
      if (!authToken) {
        router.replace('/login');
        return;
      }
    }
    const botId = searchParams?.get('botId') || 'all';
    setCurrentBotId(botId);
    loadBots();
    loadRevenue(botId);
  }, [router, searchParams, loadBots, loadRevenue]);

  // ── 봇별 바 차트 정렬 ───────────────────────────────────────────────

  const sortedBars = [...byEventType].sort((a, b) => (b.amount || 0) - (a.amount || 0));
  const maxAmt = sortedBars[0]?.amount || 1;
  const totalAmt = sortedBars.reduce((s, d) => s + (d.amount || 0), 0);

  // ── 스타일 변수 (Vanilla 원본 색상 그대로) ─────────────────────────

  const css = {
    bg:        'rgb(var(--bg-base))',
    surface:   'rgb(var(--bg-surface))',
    surface2:  'rgb(var(--bg-subtle))',
    border:    'rgb(var(--border-subtle-rgb))',
    border2:   'rgb(var(--border-subtle-rgb))',
    text:      'rgb(var(--text-primary-rgb))',
    textMuted: 'rgb(var(--text-secondary-rgb))',
    textFaint: 'rgb(var(--text-muted))',
    primary:   '#4f46e5',
    primaryL:  '#6366f1',
    success:   '#10b981',
    warning:   '#f59e0b',
    danger:    '#ef4444',
  };

  // ── 렌더 ────────────────────────────────────────────────────────────

  return (
    <>
      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg,
            rgb(var(--bg-muted)) 25%,
            rgb(var(--bg-surface-hover)) 50%,
            rgb(var(--bg-muted)) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 0.25rem;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: css.bg, color: css.text }}>

        {/* ── 로딩 뷰 (스켈레톤) ── */}
        {state === 'loading' && (
          <div style={{ padding: '2.5rem 3rem' }}>
            {/* 페이지 헤더 스켈레톤 */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: `1px solid ${css.border}`,
            }}>
              <div>
                <SkeletonLine width={180} height={'1.75rem'} className="mb-2" />
                <SkeletonLine width={260} height={'0.875rem'} />
              </div>
              <SkeletonLine width={180} height={'2.25rem'} />
            </div>

            {/* 요약 카드 스켈레톤 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  background: css.surface2,
                  border: `1px solid ${css.border}`,
                  borderRadius: '1.25rem',
                  padding: '1.75rem',
                  height: 110,
                }}>
                  <SkeletonLine width={80} height={'0.75rem'} className="mb-3" />
                  <SkeletonLine width={120} height={'2rem'} />
                </div>
              ))}
            </div>

            {/* 차트 스켈레톤 */}
            <div style={{
              background: css.surface2,
              border: `1px solid ${css.border}`,
              borderRadius: '1.25rem',
              height: 280,
              marginBottom: '1.5rem',
            }} />
            <div style={{
              background: css.surface2,
              border: `1px solid ${css.border}`,
              borderRadius: '1.25rem',
              height: 240,
            }} />
          </div>
        )}

        {/* ── 에러 뷰 ── */}
        {state === 'error' && (
          <div style={{ padding: '2.5rem 3rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: `1px solid ${css.border}`,
            }}>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2 }}>비즈니스 대시보드</div>
                <div style={{ fontSize: '0.875rem', color: css.textMuted, marginTop: '0.375rem' }}>
                  데이터를 불러오는 중 오류가 발생했습니다
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '1rem',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
            }}>
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: css.danger, marginBottom: '0.375rem' }}>
                  데이터 로드 실패
                </div>
                <div style={{ fontSize: '0.875rem', color: css.textMuted }}>{errorMsg}</div>
                <button
                  onClick={() => loadRevenue(currentBotId)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '0.75rem',
                    color: css.danger,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ↻ 다시 시도
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 로드 완료 뷰 ── */}
        {state === 'loaded' && (
          <div style={{ padding: '2.5rem 3rem' }}>

            {/* 페이지 헤더 */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: `1px solid ${css.border}`,
            }}>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2 }}>비즈니스 대시보드</div>
                <div style={{ fontSize: '0.875rem', color: css.textMuted, marginTop: '0.375rem' }}>
                  봇별 수익 현황과 월별 추이를 확인하세요
                </div>
              </div>

              {/* 봇 선택 + 빠른 링크 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: css.textMuted }}>봇 선택</span>
                <select
                  value={currentBotId}
                  onChange={(e) => onBotChange(e.target.value)}
                  style={{
                    background: css.surface2,
                    border: `1px solid ${css.border}`,
                    color: css.text,
                    borderRadius: '0.75rem',
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="all">전체 봇</option>
                  {allBots.map((bot) => (
                    <option key={bot.id} value={bot.id}>{bot.name || bot.id}</option>
                  ))}
                </select>

                {/* 빠른 링크 */}
                <Link
                  href="/business/revenue"
                  style={{
                    padding: '0.5rem 0.875rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${css.border}`,
                    color: css.textMuted,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    transition: 'color 150ms ease',
                  }}
                >
                  매출 상세
                </Link>
                <Link
                  href="/business/settlement"
                  style={{
                    padding: '0.5rem 0.875rem',
                    borderRadius: '0.75rem',
                    background: css.primary,
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  정산 관리
                </Link>
              </div>
            </div>

            {/* 요약 카드 3개 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>

              {/* 총 수익 */}
              <SummaryCard
                accentClass="accent-total"
                accentStyle="linear-gradient(90deg, #4f46e5, #6366f1)"
                label="총 수익 (전체 크레딧)"
                value={fmtNum(revenueData?.total ?? 0)}
                icon="📈"
                css={css}
              />

              {/* 이번 달 수익 */}
              <SummaryCard
                accentStyle="linear-gradient(90deg, #10b981, #34d399)"
                label="이번 달 수익"
                value={fmtNum(revenueData?.thisMonth ?? 0)}
                icon="📅"
                css={css}
              />

              {/* 미정산 금액 */}
              <SummaryCard
                accentStyle="linear-gradient(90deg, #f59e0b, #fbbf24)"
                label="미정산 금액"
                value={fmtNum(revenueData?.unsettled ?? 0)}
                icon="💸"
                css={css}
              />
            </div>

            {/* 단위 */}
            <div style={{ marginTop: '-1.25rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: css.textFaint }}>
              단위: 크레딧 (1 cr = 1원)
            </div>

            {/* 월별 수익 추이 차트 */}
            <div style={{
              background: css.surface2,
              border: `1px solid ${css.border}`,
              borderRadius: '1.25rem',
              padding: '1.75rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: css.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  월별 수익 추이
                </div>
                <Link
                  href="/business/revenue"
                  style={{ fontSize: '0.8125rem', color: css.primaryL, textDecoration: 'none', fontWeight: 500 }}
                >
                  상세 보기 →
                </Link>
              </div>

              <MonthlyBarChart data={monthlyData} />

              {/* 범례 */}
              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: css.textMuted }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4f46e5' }} />
                  <span>월별 수익 (크레딧)</span>
                </div>
              </div>
            </div>

            {/* 봇별 수익 비율 */}
            <div style={{
              background: css.surface2,
              border: `1px solid ${css.border}`,
              borderRadius: '1.25rem',
              padding: '1.75rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: css.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  봇별 수익 비율
                </div>
                <Link
                  href="/business/revenue"
                  style={{ fontSize: '0.8125rem', color: css.primaryL, textDecoration: 'none', fontWeight: 500 }}
                >
                  수익 상세 →
                </Link>
              </div>

              {sortedBars.length === 0 ? (
                <div style={{ color: css.textMuted, fontSize: '0.875rem' }}>데이터가 없습니다.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                  {sortedBars.map((item, idx) => (
                    <BotBarRow
                      key={item.botName || item.eventType || idx}
                      item={item}
                      idx={idx}
                      maxAmt={maxAmt}
                      total={totalAmt}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 빠른 링크 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }}>
              <Link
                href="/business/revenue"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: css.surface2,
                  border: `1px solid ${css.border}`,
                  borderRadius: '1.25rem',
                  padding: '1.25rem 1.5rem',
                  textDecoration: 'none',
                  transition: 'border-color 200ms ease',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>💰</span>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: css.text }}>매출 상세 보기</div>
                  <div style={{ fontSize: '0.8125rem', color: css.textMuted, marginTop: '0.25rem' }}>날짜·기간별 필터, CSV 내보내기</div>
                </div>
                <span style={{ marginLeft: 'auto', color: css.textFaint }}>→</span>
              </Link>

              <Link
                href="/business/settlement"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: css.surface2,
                  border: `1px solid ${css.border}`,
                  borderRadius: '1.25rem',
                  padding: '1.25rem 1.5rem',
                  textDecoration: 'none',
                  transition: 'border-color 200ms ease',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🏦</span>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: css.text }}>정산 내역 관리</div>
                  <div style={{ fontSize: '0.8125rem', color: css.textMuted, marginTop: '0.25rem' }}>정산 요청, 이력 확인, 결제수단</div>
                </div>
                <span style={{ marginLeft: 'auto', color: css.textFaint }}>→</span>
              </Link>
            </div>

          </div>
        )}
      </div>
    </>
  );
}

// ── 요약 카드 서브 컴포넌트 ───────────────────────────────────────────

interface SummaryCardProps {
  accentStyle: string;
  accentClass?: string;
  label: string;
  value: string;
  icon: string;
  css: Record<string, string>;
}

function SummaryCard({ accentStyle, label, value, icon, css }: SummaryCardProps) {
  return (
    <div style={{
      background: css.surface2,
      border: `1px solid ${css.border}`,
      borderRadius: '1.25rem',
      padding: '1.75rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 상단 컬러 액센트 바 */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: accentStyle,
      }} />

      <div style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: css.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '0.75rem',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '2rem',
        fontWeight: 800,
        color: css.text,
        lineHeight: 1,
        marginBottom: '0.375rem',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8125rem', color: css.textFaint }}>크레딧</div>

      {/* 배경 아이콘 */}
      <div style={{
        position: 'absolute',
        bottom: '1.25rem',
        right: '1.25rem',
        fontSize: '2rem',
        opacity: 0.15,
      }}>
        {icon}
      </div>
    </div>
  );
}
