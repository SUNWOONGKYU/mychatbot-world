/**
 * @task S7FE7 (S5FE11)
 * @description 마이페이지 탭7 — 크레딧·요금제
 * - 크레딧 충전 (4개 패키지)
 * - 요금제 플랜 구매 (Starter/Pro/Business 월정액)
 * - 무통장 입금 단일 결제 수단
 *
 * 부가 아이템 구매(페르소나·음성·아바타 팩)는 Tab8Shop으로 분리됨.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { authHeaders } from '@/lib/auth-client';

// ── 타입 ─────────────────────────────────────────────────────

interface CreditInfo {
  balance: number;
  total_charged: number;
}

interface PaymentHistory {
  id: string;
  amount: number;
  credits: number;
  method: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  depositor_name: string | null;
  created_at: string;
}

interface UsageHistory {
  id: string;
  description: string;
  amount: number;
  model: string | null;
  tokens: number | null;
  createdAt: string;
}

// ── 상수 ─────────────────────────────────────────────────────

const BANK_INFO = {
  bank: '하나은행',
  account: '287-910921-40507',
  holder: '파인더월드',
};

const PACKAGES = [
  { id: 'pkg30', amount: 30000, label: '30,000원', credits: 30000 },
  { id: 'pkg50', amount: 50000, label: '50,000원', credits: 50000, popular: true },
  { id: 'pkg100', amount: 100000, label: '100,000원', credits: 100000 },
  { id: 'pkgCustom', amount: 0, label: '직접 입력', credits: 0, custom: true },
];

const PLAN_TIERS = [
  {
    id: 'starter',
    emoji: '🌱',
    name: 'Starter',
    price: 30000,
    tagline: '월 ₩30,000',
    features: ['코코봇 5개', '월 2,000회 대화', '전체 템플릿 50종+', '지식베이스 10MB', '커스텀 페르소나'],
  },
  {
    id: 'pro',
    emoji: '🚀',
    name: 'Pro',
    price: 50000,
    tagline: '월 ₩50,000',
    popular: true,
    features: ['코코봇 무제한', '대화 무제한', '지식베이스 무제한', 'API 연동', '팀원 5인', '고급 분석'],
  },
  {
    id: 'business',
    emoji: '🏢',
    name: 'Business',
    price: 100000,
    tagline: '월 ₩100,000~',
    features: ['Pro 전체', '화이트라벨', '전담 매니저', '맞춤 통합', '99.9% SLA', '팀원 무제한'],
  },
];

function formatCurrency(n: number): string {
  return '₩' + n.toLocaleString('ko-KR');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function PaymentStatusBadge({ status }: { status: PaymentHistory['status'] }) {
  const map = {
    pending:   { label: '입금 대기', cls: 'bg-warning/15 text-warning border-warning/30' },
    confirmed: { label: '완료',     cls: 'bg-success/15 text-success border-success/30' },
    cancelled: { label: '취소',     cls: 'bg-error/15 text-error border-error/30' },
  };
  const { label, cls } = map[status];
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', cls)}>
      {label}
    </span>
  );
}

// ── 사용 내역 섹션 ────────────────────────────────────────────

function UsageHistorySection({
  items,
  loading,
  onMount,
}: {
  items: UsageHistory[];
  loading: boolean;
  onMount: () => void;
}) {
  const called = useRef(false);
  useEffect(() => {
    if (!called.current) {
      called.current = true;
      onMount();
    }
  }, [onMount]);

  if (loading) {
    return <div className="text-center text-[var(--text-tertiary)] py-6 text-sm">불러오는 중...</div>;
  }
  if (items.length === 0) {
    return <p className="text-center text-[var(--text-tertiary)] py-6 text-sm">크레딧 사용 내역이 없습니다.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((u) => (
        <div
          key={u.id}
          className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0"
        >
          <div>
            <p className="text-sm text-[var(--text-primary)] font-medium">{u.description}</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {formatDate(u.createdAt)}
              {u.model ? ` · ${u.model}` : ''}
              {u.tokens ? ` · ${u.tokens.toLocaleString()}토큰` : ''}
            </p>
          </div>
          <span className="text-sm font-semibold text-error">-{formatCurrency(u.amount)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Tab7Credits() {
  const [creditInfo, setCreditInfo] = useState<CreditInfo>({ balance: 0, total_charged: 0 });
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageHistory[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // 패키지 선택
  const [selectedPkgId, setSelectedPkgId] = useState<string>('pkg50');
  const [customAmount, setCustomAmount] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 히스토리 탭
  const [historyTab, setHistoryTab] = useState<'charge' | 'use'>('charge');

  // 요금제 플랜 구매
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planDepositor, setPlanDepositor] = useState('');
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planSuccess, setPlanSuccess] = useState('');
  const [planError, setPlanError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [credRes, payRes] = await Promise.all([
          fetch('/api/credits', { headers: authHeaders() }),
          fetch('/api/payments', { headers: authHeaders() }),
        ]);
        if (credRes.ok) {
          const d = await credRes.json();
          // /api/credits 응답: { balance, currency, updatedAt } (data 래퍼 없음)
          setCreditInfo({ balance: d?.balance ?? 0, total_charged: 0 });
        }
        if (payRes.ok) {
          const d = await payRes.json();
          setHistory(d?.items ?? []);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedPkg = PACKAGES.find((p) => p.id === selectedPkgId)!;
  const finalAmount = selectedPkg.custom
    ? Number(customAmount.replace(/[^0-9]/g, '')) || 0
    : selectedPkg.amount;

  async function handleSubmit() {
    if (!depositorName.trim()) {
      setErrorMsg('입금자명을 입력해주세요.');
      return;
    }
    if (finalAmount < 30000) {
      setErrorMsg('최소 충전 금액은 30,000원입니다.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          amount: finalAmount,
          credits: finalAmount,
          method: 'bank_transfer',
          depositor_name: depositorName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSuccessMsg('무통장 입금 신청이 완료되었습니다. 입금 확인 후 크레딧이 충전됩니다.');
      setDepositorName('');
      setCustomAmount('');
      setSelectedPkgId('pkg50');
      // Refresh history
      const payRes = await fetch('/api/payments', { headers: authHeaders() });
      if (payRes.ok) {
        const d = await payRes.json();
        // /api/payments 응답: { items, pagination }
        setHistory(d?.items ?? []);
      }
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePlanSubmit() {
    if (!selectedPlanId) { setPlanError('구매할 요금제 플랜을 선택해주세요.'); return; }
    if (!planDepositor.trim()) { setPlanError('입금자명을 입력해주세요.'); return; }
    const item = PLAN_TIERS.find((t) => t.id === selectedPlanId)!;
    setPlanSubmitting(true);
    setPlanError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          amount: item.price,
          depositor_name: planDepositor.trim(),
          description: `[요금제] ${item.name} 월정액`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPlanSuccess(`"${item.name}" 요금제 신청이 완료되었습니다. 입금 확인 후 24시간 이내 활성화됩니다.`);
      setPlanDepositor('');
      setSelectedPlanId(null);
      setTimeout(() => setPlanSuccess(''), 8000);
    } catch (err: unknown) {
      setPlanError(err instanceof Error ? err.message : '신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setPlanSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">크레딧 · 요금제</h2>

      {/* 잔액 카드 */}
      <div className="bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent rounded-2xl border border-amber-500/25 p-6">
        {loading ? (
          <div className="h-12 bg-[var(--surface-2)] rounded animate-pulse w-40" />
        ) : (
          <>
            <p className="text-xs text-amber-400/80 font-medium mb-1">현재 크레딧 잔액</p>
            <p className="text-4xl font-extrabold text-[var(--interactive-primary)]">{formatCurrency(creditInfo.balance)}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              누적 충전: {formatCurrency(creditInfo.total_charged)}
            </p>
          </>
        )}
      </div>

      {/* 충전 패널 */}
      <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] p-6 space-y-5">
        <h3 className="font-semibold text-[var(--text-primary)]">크레딧 충전</h3>

        {/* 패키지 선택 카드 — Anthropic 스타일 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPkgId(pkg.id)}
              className={clsx(
                'relative flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all',
                selectedPkgId === pkg.id
                  ? 'border-accent bg-accent/10 shadow-accent-glow'
                  : 'border-[var(--border-default)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]',
              )}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-accent text-black text-[10px] font-bold whitespace-nowrap">
                  인기
                </span>
              )}
              {pkg.custom ? (
                <>
                  <span className="text-lg mb-0.5">✏️</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{pkg.label}</span>
                </>
              ) : (
                <>
                  <span
                    className={clsx(
                      'text-xl font-extrabold',
                      selectedPkgId === pkg.id ? 'text-[var(--interactive-primary)]' : 'text-[var(--text-primary)]',
                    )}
                  >
                    {formatCurrency(pkg.amount)}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5">크레딧 {formatCurrency(pkg.credits)}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* 직접 입력 */}
        {selectedPkg.custom && (
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">금액 직접 입력 (최소 30,000원)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">₩</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="30,000"
                value={customAmount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  setCustomAmount(v ? Number(v).toLocaleString('ko-KR') : '');
                }}
                className="w-full pl-8 pr-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--interactive-primary)]"
              />
            </div>
          </div>
        )}

        {/* 금액 요약 */}
        <div className="bg-[var(--surface-2)] rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">충전 금액</span>
            <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(finalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">할인</span>
            <span className="text-[var(--text-tertiary)]">없음</span>
          </div>
          <div className="border-t border-[var(--border-default)] pt-2 flex justify-between">
            <span className="text-sm font-semibold text-[var(--text-primary)]">최종 결제 금액</span>
            <span className="text-lg font-extrabold text-[var(--interactive-primary)]">{formatCurrency(finalAmount)}</span>
          </div>
        </div>

        {/* 무통장 입금 정보 */}
        <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border-default)] p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[var(--text-primary)]">무통장 입금 정보</span>
            <span className="text-xs text-[var(--text-tertiary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--border-default)]">
              유일한 결제 수단
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-[var(--surface-2)] rounded-lg p-3">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">은행</p>
              <p className="font-semibold text-[var(--text-primary)]">{BANK_INFO.bank}</p>
            </div>
            <div className="bg-[var(--surface-2)] rounded-lg p-3">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">계좌번호</p>
              <p className="font-semibold text-[var(--text-primary)] text-xs">{BANK_INFO.account}</p>
            </div>
            <div className="bg-[var(--surface-2)] rounded-lg p-3">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">예금주</p>
              <p className="font-semibold text-[var(--text-primary)]">{BANK_INFO.holder}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">입금자명 (필수)</label>
            <input
              type="text"
              placeholder="입금자명을 정확히 입력하세요"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--interactive-primary)]"
            />
          </div>
        </div>

        {errorMsg && (
          <p className="text-sm text-error text-center">{errorMsg}</p>
        )}
        {successMsg && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
            {successMsg}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || finalAmount < 30000 || !depositorName.trim()}
          className="w-full py-3 rounded-xl bg-accent text-black font-bold text-base hover:opacity-90 disabled:opacity-40 transition-opacity shadow-accent-glow"
        >
          {submitting ? '처리 중...' : `${formatCurrency(finalAmount)} 무통장 입금 신청`}
        </button>
        <p className="text-xs text-[var(--text-tertiary)] text-center">
          입금 확인 후 24시간 이내로 크레딧이 충전됩니다. 문의: support@cocobot.world
        </p>
      </div>

      {/* 요금제 플랜 구매 */}
      <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">요금제 플랜</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            매월 자동 결제되는 정기 플랜. Free → Starter/Pro/Business 중 선택
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLAN_TIERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPlanId(selectedPlanId === item.id ? null : item.id)}
              className={clsx(
                'relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all',
                selectedPlanId === item.id
                  ? 'border-accent bg-accent/10 shadow-accent-glow'
                  : 'border-[var(--border-default)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]',
              )}
            >
              {item.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-accent text-black text-[10px] font-bold whitespace-nowrap">
                  인기
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-base font-bold text-[var(--text-primary)]">{item.name}</span>
              </div>
              <span className={clsx(
                'text-lg font-extrabold',
                selectedPlanId === item.id ? 'text-[var(--interactive-primary)]' : 'text-[var(--text-secondary)]',
              )}>
                {item.tagline}
              </span>
              <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--text-tertiary)]">
                {item.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {selectedPlanId && (() => {
          const item = PLAN_TIERS.find((t) => t.id === selectedPlanId)!;
          return (
            <div className="bg-[var(--surface-2)] rounded-xl border border-accent/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                선택: {item.emoji} {item.name} — {item.tagline}
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-[var(--surface-2)] rounded-lg p-3">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">은행</p>
                  <p className="font-semibold text-[var(--text-primary)]">{BANK_INFO.bank}</p>
                </div>
                <div className="bg-[var(--surface-2)] rounded-lg p-3">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">계좌번호</p>
                  <p className="font-semibold text-[var(--text-primary)] text-xs">{BANK_INFO.account}</p>
                </div>
                <div className="bg-[var(--surface-2)] rounded-lg p-3">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">예금주</p>
                  <p className="font-semibold text-[var(--text-primary)]">{BANK_INFO.holder}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">입금자명 (필수)</label>
                <input
                  type="text"
                  placeholder="입금자명을 정확히 입력하세요"
                  value={planDepositor}
                  onChange={(e) => setPlanDepositor(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--interactive-primary)]"
                />
              </div>
              {planError && <p className="text-sm text-error">{planError}</p>}
              {planSuccess && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                  {planSuccess}
                </div>
              )}
              <button
                onClick={handlePlanSubmit}
                disabled={planSubmitting || !planDepositor.trim()}
                className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {planSubmitting ? '처리 중...' : `${item.price.toLocaleString('ko-KR')}원 첫 달 입금 신청`}
              </button>
              <p className="text-xs text-[var(--text-tertiary)] text-center">
                입금 확인 후 24시간 이내 플랜이 활성화됩니다. 문의: support@cocobot.world
              </p>
            </div>
          );
        })()}

        {!selectedPlanId && planSuccess && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
            {planSuccess}
          </div>
        )}
      </div>

      {/* 내역 */}
      <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] p-5">
        <div className="flex gap-2 mb-4">
          {(['charge', 'use'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setHistoryTab(t)}
              className={clsx(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                historyTab === t
                  ? 'bg-accent/20 text-[var(--interactive-primary)] border border-accent/30'
                  : 'text-[var(--text-tertiary)] border border-[var(--border-default)] hover:border-[var(--border-default)]',
              )}
            >
              {t === 'charge' ? '충전 내역' : '사용 내역'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-[var(--text-tertiary)] py-6 text-sm">불러오는 중...</div>
        ) : historyTab === 'charge' ? (
          history.length === 0 ? (
            <p className="text-center text-[var(--text-tertiary)] py-6 text-sm">충전 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0"
                >
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">
                      {formatCurrency(h.amount)} 충전
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">{formatDate(h.created_at)}{h.depositor_name ? ` · ${h.depositor_name}` : ''}</p>
                  </div>
                  <PaymentStatusBadge status={h.status} />
                </div>
              ))}
            </div>
          )
        ) : (
          <UsageHistorySection
            items={usageHistory}
            loading={usageLoading}
            onMount={async () => {
              if (usageHistory.length > 0 || usageLoading) return;
              setUsageLoading(true);
              try {
                const res = await fetch('/api/credits/usage', { headers: authHeaders() });
                if (res.ok) {
                  const d = await res.json();
                  setUsageHistory(d?.items ?? []);
                }
              } catch { /* silent */ } finally {
                setUsageLoading(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
