/**
 * @task S7FE7 (S5FE11)
 * @description 마이페이지 탭5 — 코코봇 운영 관리 (구직/구봇/수익/통계)
 * 구직(내 코코봇 올리기), 구봇(다른 코코봇 고용), 수익 관리, 운영 통계
 */
'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { authHeaders } from '@/lib/auth-client';

// ── 타입 ─────────────────────────────────────────────────────

interface JobPosting {
  id: string;
  bot_name: string;
  title: string;
  status: 'active' | 'closed';
  applicants: number;
  created_at: string;
}

interface HiredBot {
  id: string;
  bot_name: string;
  owner: string;
  contract_until: string;
  price_per_unit: number;
  performance_score: number;
  cost_total: number;
}

interface RevenueType {
  id: string;
  name: string;
  price_per_unit: number;
  unit: string;
}

interface RevenueRecord {
  date: string;
  type_name: string;
  amount: number;
}

interface OperationStats {
  total_conversations: number;
  satisfaction_rate: number;
  revenue_job: number;
  cost_hired: number;
}

type SubTab = 'job' | 'hired' | 'revenue' | 'stats';

function formatCurrency(n: number): string {
  return '₩' + n.toLocaleString('ko-KR');
}

function formatDate(iso: string): string {
  return iso ? new Date(iso).toLocaleDateString('ko-KR') : '-';
}

// ── 서브탭 네비게이션 ────────────────────────────────────────

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'job',     label: '구직 (내 코코봇 올리기)' },
  { id: 'hired',   label: '구봇 (다른 코코봇 고용)' },
  { id: 'revenue', label: '수익 관리' },
  { id: 'stats',   label: '운영 통계' },
];

// ── 구직 탭 ─────────────────────────────────────────────────

function JobTab() {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/jobs?limit=20', { headers: authHeaders() });
        if (res.ok) {
          const d = await res.json();
          // /api/jobs 응답: { jobs: [...], total }
          const raw: any[] = d?.jobs ?? d ?? [];
          setPostings(
            raw.map((j: any) => ({
              id: j.id,
              bot_name: j.bot_name ?? j.title ?? '코코봇',
              title: j.title ?? '(제목 없음)',
              status: j.status === 'open' ? 'active' : 'closed',
              applicants: j.applicant_count ?? j.applicants ?? 0,
              created_at: j.created_at,
            }))
          );
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-5">
      {/* 새 공고 등록 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          내 코코봇을 구봇구직에 등록하고 수익을 창출하세요.
        </p>
        <button
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + 새 공고 등록
        </button>
      </div>

      {loading ? (
        <div className="text-center text-[var(--text-tertiary)] py-8 text-sm">불러오는 중...</div>
      ) : postings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-default)] p-10 text-center">
          <p className="text-[var(--text-tertiary)] text-sm">등록된 공고가 없습니다.</p>
          <p className="text-[var(--text-tertiary)] text-xs mt-1">내 코코봇을 구봇구직에 올려보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {postings.map((p) => (
            <div
              key={p.id}
              className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={clsx(
                      'text-xs font-semibold px-2 py-0.5 rounded-full border',
                      p.status === 'active'
                        ? 'bg-success/15 text-success border-success/30'
                        : 'bg-[var(--surface-2)] text-[var(--text-tertiary)] border-[var(--border-default)]',
                    )}
                  >
                    {p.status === 'active' ? '모집중' : '마감'}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">{p.bot_name}</span>
                </div>
                <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{p.title}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">등록일: {formatDate(p.created_at)}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{p.applicants}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">지원자</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] hover:border-primary/50 text-[var(--text-secondary)] transition-colors">
                    지원자 보기
                  </button>
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] hover:border-error/50 text-error transition-colors">
                    {p.status === 'active' ? '마감' : '재오픈'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 구봇(고용) 탭 ────────────────────────────────────────────

function HiredTab() {
  const [bots, setBots] = useState<HiredBot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          if (!aborted) {
            setBots([]);
            setLoading(false);
          }
          return;
        }

        const res = await fetch('/api/operations/hired-bots', {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!aborted) {
            setBots([]);
            setLoading(false);
          }
          return;
        }
        const json = await res.json();
        if (!aborted) {
          setBots(Array.isArray(json.hired_bots) ? json.hired_bots : []);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[HiredTab] fetch failed:', err);
        if (!aborted) {
          setBots([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          고용한 코코봇 목록과 계약/성과를 관리합니다.
        </p>
        <a
          href="/jobs"
          className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] text-sm hover:border-primary/50 transition-colors"
        >
          구봇구직 바로가기 →
        </a>
      </div>

      {loading ? (
        <div className="text-center text-[var(--text-tertiary)] py-8 text-sm">불러오는 중...</div>
      ) : bots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-default)] p-10 text-center">
          <p className="text-[var(--text-tertiary)] text-sm">고용한 코코봇이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((b) => (
            <div
              key={b.id}
              className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{b.bot_name}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">소유자: {b.owner}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{b.performance_score}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--surface-2)] rounded-lg p-3 text-center">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">계약 종료</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{formatDate(b.contract_until)}</p>
                </div>
                <div className="bg-[var(--surface-2)] rounded-lg p-3 text-center">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">단가</p>
                  <p className="text-sm font-semibold text-[var(--interactive-primary)]">{formatCurrency(b.price_per_unit)}</p>
                </div>
                <div className="bg-[var(--surface-2)] rounded-lg p-3 text-center">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">총 비용</p>
                  <p className="text-sm font-semibold text-error">{formatCurrency(b.cost_total)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 text-xs rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-primary/50 transition-colors">
                  성과 상세 보기
                </button>
                <button className="flex-1 py-2 text-xs rounded-lg border border-error/30 text-error hover:bg-error/10 transition-colors">
                  계약 해지
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 수익 관리 탭 ─────────────────────────────────────────────

function RevenueTab() {
  const [types, setTypes] = useState<RevenueType[]>([]);
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [addingType, setAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('');
  const [newTypeUnit, setNewTypeUnit] = useState('건');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [settleMsg, setSettleMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/revenue?period=daily`, { headers: authHeaders() });
        if (res.ok) {
          const d = await res.json();
          const daily: any[] = d?.daily ?? [];
          setRecords(
            daily.map((r: any) => ({
              date: r.date,
              type_name: '수익',
              amount: r.net_amount ?? r.gross_amount ?? 0,
            }))
          );
        }
      } catch { /* silent */ } finally {
        setRevenueLoading(false);
      }
    }
    load();
  }, []);

  function addType() {
    if (!newTypeName.trim() || !newTypePrice) return;
    setTypes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newTypeName.trim(),
        price_per_unit: Number(newTypePrice),
        unit: newTypeUnit,
      },
    ]);
    setNewTypeName('');
    setNewTypePrice('');
    setNewTypeUnit('건');
    setAddingType(false);
  }

  function removeType(id: string) {
    setTypes((prev) => prev.filter((t) => t.id !== id));
  }

  const totalRevenue = records.reduce((s, r) => s + r.amount, 0);

  function requestSettle() {
    setSettleMsg('정산 요청이 접수되었습니다. 3~5 영업일 내에 처리됩니다.');
    setTimeout(() => setSettleMsg(''), 4000);
  }

  return (
    <div className="space-y-6">
      {/* 수익 현황 */}
      <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">수익 현황</h3>
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  'px-3 py-1 text-xs rounded-full transition-colors',
                  period === p
                    ? 'bg-accent/20 text-[var(--interactive-primary)] font-semibold border border-accent/30'
                    : 'text-[var(--text-tertiary)] border border-[var(--border-default)] hover:border-[var(--border-strong)]',
                )}
              >
                {p === 'day' ? '일별' : p === 'week' ? '주별' : '월별'}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-400/5 rounded-xl p-5 mb-4 border border-amber-500/20">
          <p className="text-xs text-amber-400/80 mb-1 font-medium">
            {period === 'day' ? '오늘' : period === 'week' ? '이번 주' : '이번 달'} 총 수익
          </p>
          <p className="text-3xl font-extrabold text-[var(--interactive-primary)]">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="space-y-2">
          {records.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border-default)] last:border-0">
              <div>
                <span className="text-sm text-[var(--text-primary)]">{r.type_name}</span>
                <span className="text-xs text-[var(--text-tertiary)] ml-2">{formatDate(r.date)}</span>
              </div>
              <span className="text-sm font-semibold text-[var(--interactive-primary)]">{formatCurrency(r.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 정산 요청 */}
      <div className="flex items-center justify-between bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">정산 요청</p>
          <p className="text-xs text-[var(--text-tertiary)]">정산 가능 금액: <span className="text-[var(--interactive-primary)] font-bold">{formatCurrency(totalRevenue)}</span></p>
        </div>
        <button
          onClick={requestSettle}
          className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-bold hover:opacity-90 transition-opacity"
        >
          정산 신청
        </button>
      </div>
      {settleMsg && (
        <p className="text-sm text-success text-center">{settleMsg}</p>
      )}

      {/* 수익 유형 설정 */}
      <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">수익 유형 설정</h3>
          <button
            onClick={() => setAddingType(true)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-accent/50 transition-colors"
          >
            + 유형 추가
          </button>
        </div>

        {addingType && (
          <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border-default)] p-4 mb-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">새 수익 유형</p>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="유형명 (예: 상담료)"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="col-span-3 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--interactive-primary)]"
              />
              <input
                type="number"
                placeholder="단가"
                value={newTypePrice}
                onChange={(e) => setNewTypePrice(e.target.value)}
                className="col-span-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--interactive-primary)]"
              />
              <input
                type="text"
                placeholder="단위 (건/시간)"
                value={newTypeUnit}
                onChange={(e) => setNewTypeUnit(e.target.value)}
                className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--interactive-primary)]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addType}
                className="flex-1 py-2 text-sm rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
              >
                추가
              </button>
              <button
                onClick={() => setAddingType(false)}
                className="flex-1 py-2 text-sm rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-primary/50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {types.map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-[var(--surface-2)] rounded-lg px-4 py-3">
              <div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</span>
                <span className="text-xs text-[var(--text-tertiary)] ml-2">
                  {formatCurrency(t.price_per_unit)} / {t.unit}
                </span>
              </div>
              <button
                onClick={() => removeType(t.id)}
                className="text-xs text-error hover:underline"
              >
                삭제
              </button>
            </div>
          ))}
          {types.length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
              수익 유형을 추가하세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 운영 통계 탭 ─────────────────────────────────────────────

function StatsTab() {
  const [stats, setStats] = useState<OperationStats>({
    total_conversations: 0,
    satisfaction_rate: 0,
    revenue_job: 0,
    cost_hired: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/revenue', { headers: authHeaders() });
        if (res.ok) {
          const d = await res.json();
          const s = d?.summary;
          if (s) {
            setStats(prev => ({
              ...prev,
              revenue_job: s.total_net ?? s.total_gross ?? 0,
              total_conversations: s.total_transactions ?? 0,
            }));
          }
        }
      } catch { /* silent */ } finally {
        setStatsLoading(false);
      }
    }
    load();
  }, []);

  const netProfit = stats.revenue_job - stats.cost_hired;

  const items = [
    {
      label: '총 대화 건수',
      value: stats.total_conversations.toLocaleString() + '건',
      color: 'text-primary',
    },
    {
      label: '만족도',
      value: stats.satisfaction_rate + '%',
      color: 'text-success',
    },
    {
      label: '구직 수익',
      value: formatCurrency(stats.revenue_job),
      color: 'text-[var(--interactive-primary)]',
    },
    {
      label: '구봇 비용',
      value: formatCurrency(stats.cost_hired),
      color: 'text-error',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] p-4">
            <p className="text-xs text-[var(--text-tertiary)] mb-2">{item.label}</p>
            <p className={clsx('text-xl font-extrabold', item.color)}>{item.value}</p>
          </div>
        ))}
      </div>
      <div
        className={clsx(
          'rounded-xl border p-5',
          netProfit >= 0
            ? 'bg-success/10 border-success/30'
            : 'bg-error/10 border-error/30',
        )}
      >
        <p className="text-sm text-[var(--text-secondary)] mb-1">순 수익 (구직 수익 − 구봇 비용)</p>
        <p
          className={clsx(
            'text-3xl font-extrabold',
            netProfit >= 0 ? 'text-success' : 'text-error',
          )}
        >
          {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
        </p>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function Tab5Operations() {
  const [sub, setSub] = useState<SubTab>('job');

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">코코봇 운영 관리</h2>

      {/* 서브탭 */}
      <div className="flex flex-wrap gap-1 mb-6 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border-default)]">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={clsx(
              'flex-1 min-w-max px-3 py-2 text-sm rounded-lg font-medium transition-all',
              sub === t.id
                ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'job'     && <JobTab />}
      {sub === 'hired'   && <HiredTab />}
      {sub === 'revenue' && <RevenueTab />}
      {sub === 'stats'   && <StatsTab />}
    </div>
  );
}
