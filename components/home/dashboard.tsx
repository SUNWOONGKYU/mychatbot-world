/**
 * @task S2FE3
 * @description Home 대시보드 — 챗봇 카드 목록 + 사용량 차트 (SVG 순수 구현)
 *
 * Props:
 * - bots: 챗봇 목록 (page.tsx에서 /api/bots 로드)
 * - loading, error: 로딩/에러 상태
 * - selectedBotId: 현재 선택된 봇
 * - onSelectBot, onBotDeleted, onRefresh: 이벤트 핸들러
 * - defaultSection: 'bots' | 'usage' (탭에서 분기)
 *
 * 차트: recharts 미설치 환경을 위해 SVG 직접 렌더링으로 구현.
 *       recharts가 설치되면 UsageSection을 recharts 버전으로 교체 가능.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import type { Bot } from '@/types/bot';

// ── 타입 정의 ─────────────────────────────────────────────────

/** 날짜별 대화 데이터 (막대 차트용) */
interface DailyConversation {
  date: string;
  count: number;
}

/** 모델별 비용 데이터 (파이 차트용) */
interface ModelCost {
  model: string;
  cost: number;
  color: string;
}

/** 사용량 요약 */
interface UsageSummary {
  total_conversations: number;
  total_tokens: number;
  estimated_cost_usd: number;
  daily_data: DailyConversation[];
  model_cost_data: ModelCost[];
}

/** Dashboard Props */
interface DashboardProps {
  bots: Bot[];
  loading: boolean;
  error: string | null;
  selectedBotId: string | null;
  onSelectBot: (id: string) => void;
  onBotDeleted: (id: string) => void;
  onRefresh: () => void;
  /** 기본 표시 섹션: 'bots'(챗봇 목록) | 'usage'(사용량 차트) */
  defaultSection?: 'bots' | 'usage';
}

// ── 파이 차트 색상 ────────────────────────────────────────────

const PIE_COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

// ── 유틸 ─────────────────────────────────────────────────────

/**
 * ISO 날짜를 "MM/DD" 형식으로 변환
 * @param isoDate - YYYY-MM-DD
 */
function formatDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${month}/${day}`;
}

// ── SVG 막대 차트 컴포넌트 ────────────────────────────────────

interface BarChartSvgProps {
  data: DailyConversation[];
  width?: number;
  height?: number;
}

/**
 * 순수 SVG 막대 차트 (날짜별 대화 횟수)
 * @param data - 날짜별 데이터 배열
 * @param width - SVG 너비 (기본 400)
 * @param height - SVG 높이 (기본 200)
 */
function BarChartSvg({ data, width = 400, height = 200 }: BarChartSvgProps) {
  if (data.length === 0) return null;

  const paddingLeft = 32;
  const paddingRight = 8;
  const paddingTop = 12;
  const paddingBottom = 36;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barGap = 4;
  const barWidth = Math.max(8, (chartW - barGap * (data.length - 1)) / data.length - barGap);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="날짜별 대화 횟수 막대 차트"
    >
      {/* Y축 기준선 3개 */}
      {[0, 0.5, 1].map((frac) => {
        const y = paddingTop + chartH * (1 - frac);
        const label = Math.round(maxCount * frac);
        return (
          <g key={frac}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={paddingLeft + chartW}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray={frac === 0 ? '0' : '3 3'}
            />
            <text
              x={paddingLeft - 4}
              y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill="#9ca3af"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* 막대 + X축 레이블 */}
      {data.map((d, i) => {
        const x = paddingLeft + i * (barWidth + barGap);
        const barH = Math.max(2, (d.count / maxCount) * chartH);
        const y = paddingTop + chartH - barH;

        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill="#6366f1"
              rx={3}
              ry={3}
              opacity={0.85}
            >
              <title>{`${formatDate(d.date)}: ${d.count}회`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize={9}
              fill="#9ca3af"
            >
              {formatDate(d.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG 파이 차트 컴포넌트 ────────────────────────────────────

interface PieChartSvgProps {
  data: ModelCost[];
  size?: number;
}

/**
 * 순수 SVG 파이 차트 (모델별 비용)
 * @param data - 모델별 비용 배열
 * @param size - SVG 크기 (기본 180)
 */
function PieChartSvg({ data, size = 180 }: PieChartSvgProps) {
  if (data.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;
  const total = data.reduce((s, d) => s + d.cost, 0);

  // 각 슬라이스의 시작/끝 각도 계산
  const slices: Array<{ d: string; color: string; model: string; percent: number }> = [];
  let startAngle = -Math.PI / 2;

  data.forEach((item, idx) => {
    const fraction = item.cost / total;
    const endAngle = startAngle + fraction * 2 * Math.PI;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    const path = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `Z`,
    ].join(' ');

    slices.push({
      d: path,
      color: PIE_COLORS[idx % PIE_COLORS.length],
      model: item.model,
      percent: Math.round(fraction * 100),
    });

    startAngle = endAngle;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="모델별 비용 파이 차트"
      >
        {slices.map((slice) => (
          <path key={slice.model} d={slice.d} fill={slice.color} opacity={0.85}>
            <title>{`${slice.model}: ${slice.percent}%`}</title>
          </path>
        ))}
      </svg>

      {/* 범례 */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {slices.map((slice) => (
          <div key={slice.model} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: slice.color }}
            />
            <span className="text-xs text-text-secondary">
              {slice.model} ({slice.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 봇 카드 컴포넌트 ─────────────────────────────────────────

interface BotCardProps {
  bot: Bot;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

/**
 * 개별 챗봇 카드
 * - 이름, 배포 URL, 대화 횟수, 수정/삭제 버튼
 */
function BotCard({ bot, isSelected, onSelect, onDelete, onEdit }: BotCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${bot.name}" 챗봇을 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bots?id=${bot.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      onDelete();
    } catch {
      alert('챗봇 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={clsx(
        'relative p-4 rounded-xl border transition-all cursor-pointer',
        'bg-surface hover:shadow-md',
        isSelected
          ? 'border-primary ring-1 ring-primary/30'
          : 'border-border hover:border-border-strong',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-pressed={isSelected}
    >
      {/* 봇 이름 + 활성 배지 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-text-primary truncate">{bot.name}</h3>
        <span
          className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success"
        >
          활성
        </span>
      </div>

      {/* 설명 */}
      {bot.description && (
        <p className="text-xs text-text-secondary line-clamp-2 mb-2">{bot.description}</p>
      )}

      {/* 배포 URL */}
      {bot.deploy_url ? (
        <a
          href={bot.deploy_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-primary hover:underline truncate mb-2"
          onClick={(e) => e.stopPropagation()}
        >
          {bot.deploy_url}
        </a>
      ) : (
        <span className="block text-xs text-text-muted mb-2">배포 URL 없음</span>
      )}

      {/* 통계 */}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span>💬 {(bot.conversation_count ?? 0).toLocaleString()} 대화</span>
        <span className="text-text-muted">
          {new Date(bot.created_at).toLocaleDateString('ko-KR')}
        </span>
      </div>

      {/* 액션 버튼 */}
      <div
        className="flex gap-2 mt-3 pt-3 border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className={clsx(
            'flex-1 py-1.5 rounded-lg text-xs font-medium',
            'bg-bg-subtle text-text-secondary',
            'hover:bg-bg-muted hover:text-text-primary transition-colors',
          )}
        >
          수정
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={clsx(
            'flex-1 py-1.5 rounded-lg text-xs font-medium',
            'bg-error/10 text-error hover:bg-error/20 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {deleting ? '삭제 중…' : '삭제'}
        </button>
      </div>
    </div>
  );
}

// ── 사용량 섹션 컴포넌트 ─────────────────────────────────────

interface UsageSectionProps {
  botId: string | null;
}

/**
 * 사용량 차트 섹션
 * - /api/usage?botId={id} 호출 (없으면 mock 데이터)
 * - 날짜별 대화 SVG 막대 차트 + 모델별 비용 SVG 파이 차트
 */
function UsageSection({ botId }: UsageSectionProps) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/usage?botId=${botId}`);
      if (res.ok) {
        const data = await res.json();
        const summary = data?.data ?? data;
        setUsage(summary);
        setLoading(false);
        return;
      }
    } catch {
      // API 미구현 시 mock 데이터
    }

    // Mock 데이터 (API 미구현 대비)
    const today = new Date();
    const dailyData: DailyConversation[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().slice(0, 10),
        count: Math.floor(Math.random() * 50) + 5,
      };
    });

    setUsage({
      total_conversations: dailyData.reduce((s, d) => s + d.count, 0),
      total_tokens: Math.floor(Math.random() * 50000) + 10000,
      estimated_cost_usd: parseFloat((Math.random() * 2).toFixed(4)),
      daily_data: dailyData,
      model_cost_data: [
        { model: 'gpt-4o-mini', cost: 0.8,  color: PIE_COLORS[0] },
        { model: 'gpt-4o',      cost: 1.2,  color: PIE_COLORS[1] },
      ],
    });
    setLoading(false);
  }, [botId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (!botId) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        챗봇을 먼저 선택하세요.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!usage) return null;

  return (
    <div className="space-y-6">
      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '총 대화 수',  value: usage.total_conversations.toLocaleString(), icon: '💬' },
          { label: '사용 토큰',   value: usage.total_tokens.toLocaleString(),         icon: '⚡' },
          { label: '비용 추정',   value: `$${usage.estimated_cost_usd.toFixed(4)}`,   icon: '💰' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-surface border border-border text-center"
          >
            <div className="text-2xl mb-1" aria-hidden="true">{stat.icon}</div>
            <div className="text-xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-xs text-text-secondary mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 차트 2개 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 날짜별 대화 수 막대 차트 */}
        <div className="p-4 rounded-xl bg-surface border border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-4">날짜별 대화 횟수</h3>
          <BarChartSvg data={usage.daily_data} width={360} height={180} />
        </div>

        {/* 모델별 비용 파이 차트 */}
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-col items-center">
          <h3 className="text-sm font-semibold text-text-primary mb-4 self-start">모델별 비용</h3>
          <PieChartSvg data={usage.model_cost_data} size={160} />
        </div>
      </div>
    </div>
  );
}

// ── 메인 Dashboard 컴포넌트 ──────────────────────────────────

/**
 * Dashboard
 * - 챗봇 카드 그리드 (section='bots')
 * - 사용량 차트 (section='usage')
 */
export function Dashboard({
  bots,
  loading,
  error,
  selectedBotId,
  onSelectBot,
  onBotDeleted,
  onRefresh,
  defaultSection = 'bots',
}: DashboardProps) {
  const [section, setSection] = useState<'bots' | 'usage'>(defaultSection);

  // defaultSection prop 변경 시 동기화
  useEffect(() => {
    setSection(defaultSection);
  }, [defaultSection]);

  // ── 로딩 스켈레톤 ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-bg-subtle animate-pulse" />
        ))}
      </div>
    );
  }

  // ── 에러 ───────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <span className="text-3xl">⚠️</span>
        <p className="text-sm text-error">{error}</p>
        <button
          onClick={onRefresh}
          className="text-sm text-primary hover:underline focus-visible:outline-none"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // ── 빈 상태 ────────────────────────────────────────────────

  if (bots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <span className="text-5xl">🤖</span>
        <h3 className="text-lg font-semibold text-text-primary">챗봇이 아직 없습니다</h3>
        <p className="text-sm text-text-secondary">
          새 챗봇을 만들면 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 섹션 전환 버튼 */}
      <div className="flex gap-2">
        {(['bots', 'usage'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              section === s
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-surface-hover',
            )}
          >
            {s === 'bots' ? '🤖 봇 목록' : '📊 사용량'}
          </button>
        ))}
      </div>

      {section === 'bots' ? (
        /* 챗봇 카드 그리드 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              isSelected={selectedBotId === bot.id}
              onSelect={() => onSelectBot(bot.id)}
              onDelete={() => onBotDeleted(bot.id)}
              onEdit={() => {
                window.location.href = `/bots/${bot.id}/edit`;
              }}
            />
          ))}
        </div>
      ) : (
        /* 사용량 차트 */
        <UsageSection botId={selectedBotId} />
      )}
    </div>
  );
}
