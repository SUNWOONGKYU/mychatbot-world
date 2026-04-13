/**
 * @task S5FE11
 * @description 마이페이지 탭7 — 크레딧/결제 (Anthropic UI 참고 카드형)
 * 4개 패키지: 3만/5만/10만/기타 | 할인 없음 | 무통장 입금
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

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

const PERSONA_TEMPLATES = [
  {
    id: 'pt-legal',
    emoji: '⚖️',
    name: '법률 전문가 팩',
    description: '계약서 검토, 법적 상담, 분쟁 해결 페르소나 5종',
    price: 30000,
  },
  {
    id: 'pt-medical',
    emoji: '🏥',
    name: '의료 상담 팩',
    description: '증상 체크, 건강 가이드, 복약 정보 페르소나 5종',
    price: 30000,
  },
  {
    id: 'pt-finance',
    emoji: '📈',
    name: '금융·투자 팩',
    description: '주식, ETF, 자산관리, 부동산 투자 페르소나 5종',
    price: 30000,
  },
  {
    id: 'pt-education',
    emoji: '📚',
    name: '교육·튜터링 팩',
    description: '수학, 언어, 과학, 논술 지도 페르소나 5종',
    price: 30000,
  },
  {
    id: 'pt-business',
    emoji: '💼',
    name: '비즈니스·마케팅 팩',
    description: '카피라이팅, 전략 기획, 데이터 분석 페르소나 5종',
    price: 30000,
  },
  {
    id: 'pt-hr',
    emoji: '👥',
    name: 'HR·채용 팩',
    description: '이력서 검토, 면접 코칭, 인재 평가 페르소나 5종',
    price: 30000,
  },
];

const VOICE_PACKS = [
  {
    id: 'vp-basic',
    emoji: '🎙️',
    name: '기본 AI 음성 팩',
    description: '남성·여성 2종 AI 음성, 챗봇 응답 TTS 지원',
    price: 15000,
  },
  {
    id: 'vp-pro',
    emoji: '🎤',
    name: '프로 AI 음성 팩',
    description: '감정 표현 가능한 AI 음성 5종, 자연스러운 억양',
    price: 30000,
  },
  {
    id: 'vp-character',
    emoji: '🗣️',
    name: '캐릭터 음성 팩',
    description: '귀엽고 개성 있는 캐릭터 스타일 음성 3종',
    price: 20000,
  },
];

const AVATAR_PACKS = [
  {
    id: 'ap-basic',
    emoji: '🖼️',
    name: '기본 아바타 팩',
    description: '다양한 스타일 챗봇 아바타 이미지 10종',
    price: 15000,
  },
  {
    id: 'ap-business',
    emoji: '👔',
    name: '비즈니스 아바타 팩',
    description: '전문직 콘셉트 고화질 캐릭터 아바타 10종',
    price: 20000,
  },
  {
    id: 'ap-anime',
    emoji: '✨',
    name: '애니메이션 아바타 팩',
    description: '일러스트 스타일 귀여운 캐릭터 아바타 10종',
    price: 20000,
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

function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('mcw_access_token') ||
        sessionStorage.getItem('mcw_access_token') ||
        ''
      : '';
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
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
    return <div className="text-center text-text-muted py-6 text-sm">불러오는 중...</div>;
  }
  if (items.length === 0) {
    return <p className="text-center text-text-muted py-6 text-sm">크레딧 사용 내역이 없습니다.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((u) => (
        <div
          key={u.id}
          className="flex items-center justify-between py-3 border-b border-border last:border-0"
        >
          <div>
            <p className="text-sm text-text-primary font-medium">{u.description}</p>
            <p className="text-xs text-text-muted">
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

  // 음성 & 아바타 팩 구매
  const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null);
  const [addonDepositor, setAddonDepositor] = useState('');
  const [addonSubmitting, setAddonSubmitting] = useState(false);
  const [addonSuccess, setAddonSuccess] = useState('');
  const [addonError, setAddonError] = useState('');

  // 페르소나 템플릿 구매
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateDepositor, setTemplateDepositor] = useState('');
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState('');
  const [templateError, setTemplateError] = useState('');

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

  async function handleAddonSubmit() {
    if (!selectedAddonId) {
      setAddonError('아이템을 선택해주세요.');
      return;
    }
    if (!addonDepositor.trim()) {
      setAddonError('입금자명을 입력해주세요.');
      return;
    }
    const item = [...VOICE_PACKS, ...AVATAR_PACKS].find((t) => t.id === selectedAddonId)!;
    setAddonSubmitting(true);
    setAddonError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          amount: item.price,
          depositor_name: addonDepositor.trim(),
          description: `[부가기능] ${item.name}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setAddonSuccess(`"${item.name}" 구매 신청이 완료되었습니다. 입금 확인 후 24시간 이내 적용됩니다.`);
      setAddonDepositor('');
      setSelectedAddonId(null);
      setTimeout(() => setAddonSuccess(''), 8000);
    } catch (err: unknown) {
      setAddonError(err instanceof Error ? err.message : '신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAddonSubmitting(false);
    }
  }

  async function handleTemplateSubmit() {
    if (!selectedTemplateId) {
      setTemplateError('구매할 템플릿 팩을 선택해주세요.');
      return;
    }
    if (!templateDepositor.trim()) {
      setTemplateError('입금자명을 입력해주세요.');
      return;
    }
    const item = PERSONA_TEMPLATES.find((t) => t.id === selectedTemplateId)!;
    setTemplateSubmitting(true);
    setTemplateError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          amount: item.price,
          depositor_name: templateDepositor.trim(),
          description: `[페르소나 템플릿] ${item.name}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setTemplateSuccess(`"${item.name}" 구매 신청이 완료되었습니다. 입금 확인 후 24시간 이내 템플릿이 지급됩니다.`);
      setTemplateDepositor('');
      setSelectedTemplateId(null);
      setTimeout(() => setTemplateSuccess(''), 8000);
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : '신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setTemplateSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-text-primary">크레딧 / 결제</h2>

      {/* 잔액 카드 */}
      <div className="bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent rounded-2xl border border-amber-500/25 p-6">
        {loading ? (
          <div className="h-12 bg-bg-muted rounded animate-pulse w-40" />
        ) : (
          <>
            <p className="text-xs text-amber-400/80 font-medium mb-1">현재 크레딧 잔액</p>
            <p className="text-4xl font-extrabold text-accent">{formatCurrency(creditInfo.balance)}</p>
            <p className="text-xs text-text-muted mt-2">
              누적 충전: {formatCurrency(creditInfo.total_charged)}
            </p>
          </>
        )}
      </div>

      {/* 충전 패널 */}
      <div className="bg-bg-surface rounded-2xl border border-border p-6 space-y-5">
        <h3 className="font-semibold text-text-primary">크레딧 충전</h3>

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
                  : 'border-border bg-bg-subtle hover:border-accent/50',
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
                  <span className="text-xs font-semibold text-text-primary">{pkg.label}</span>
                </>
              ) : (
                <>
                  <span
                    className={clsx(
                      'text-xl font-extrabold',
                      selectedPkgId === pkg.id ? 'text-accent' : 'text-text-primary',
                    )}
                  >
                    {formatCurrency(pkg.amount)}
                  </span>
                  <span className="text-[10px] text-text-muted mt-0.5">크레딧 {formatCurrency(pkg.credits)}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* 직접 입력 */}
        {selectedPkg.custom && (
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">금액 직접 입력 (최소 30,000원)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₩</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="30,000"
                value={customAmount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  setCustomAmount(v ? Number(v).toLocaleString('ko-KR') : '');
                }}
                className="w-full pl-8 pr-4 py-2.5 bg-bg-muted border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/60"
              />
            </div>
          </div>
        )}

        {/* 금액 요약 */}
        <div className="bg-bg-muted rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">충전 금액</span>
            <span className="font-semibold text-text-primary">{formatCurrency(finalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">할인</span>
            <span className="text-text-muted">없음</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="text-sm font-semibold text-text-primary">최종 결제 금액</span>
            <span className="text-lg font-extrabold text-accent">{formatCurrency(finalAmount)}</span>
          </div>
        </div>

        {/* 무통장 입금 정보 */}
        <div className="bg-bg-subtle rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-text-primary">무통장 입금 정보</span>
            <span className="text-xs text-text-muted bg-bg-muted px-2 py-0.5 rounded-full border border-border">
              유일한 결제 수단
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-bg-muted rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">은행</p>
              <p className="font-semibold text-text-primary">{BANK_INFO.bank}</p>
            </div>
            <div className="bg-bg-muted rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">계좌번호</p>
              <p className="font-semibold text-text-primary text-xs">{BANK_INFO.account}</p>
            </div>
            <div className="bg-bg-muted rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">예금주</p>
              <p className="font-semibold text-text-primary">{BANK_INFO.holder}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">입금자명 (필수)</label>
            <input
              type="text"
              placeholder="입금자명을 정확히 입력하세요"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-muted border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60"
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
        <p className="text-xs text-text-muted text-center">
          입금 확인 후 24시간 이내로 크레딧이 충전됩니다. 문의: support@mychatbot.world
        </p>
      </div>

      {/* 전문 분야별 페르소나 템플릿 구매 */}
      <div className="bg-bg-surface rounded-2xl border border-border p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-text-primary">전문 분야별 페르소나 템플릿</h3>
          <p className="text-xs text-text-muted mt-1">
            전문가 수준의 챗봇 페르소나 세트를 구매해 즉시 적용하세요. 팩당 30,000원 · 일회성 구매
          </p>
        </div>

        {/* 템플릿 팩 그리드 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PERSONA_TEMPLATES.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTemplateId(selectedTemplateId === item.id ? null : item.id)}
              className={clsx(
                'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all',
                selectedTemplateId === item.id
                  ? 'border-accent bg-accent/10 shadow-accent-glow'
                  : 'border-border bg-bg-subtle hover:border-accent/50',
              )}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm font-semibold text-text-primary leading-snug">{item.name}</span>
              <span className="text-[11px] text-text-muted leading-snug">{item.description}</span>
              <span className={clsx(
                'mt-1 text-sm font-bold',
                selectedTemplateId === item.id ? 'text-accent' : 'text-text-secondary',
              )}>
                {item.price.toLocaleString('ko-KR')}원
              </span>
            </button>
          ))}
        </div>

        {/* 구매 폼 — 팩 선택 시 표시 */}
        {selectedTemplateId && (() => {
          const item = PERSONA_TEMPLATES.find((t) => t.id === selectedTemplateId)!;
          return (
            <div className="bg-bg-subtle rounded-xl border border-accent/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">
                선택: {item.emoji} {item.name} — {item.price.toLocaleString('ko-KR')}원
              </p>

              {/* 무통장 입금 정보 */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-bg-muted rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">은행</p>
                  <p className="font-semibold text-text-primary">{BANK_INFO.bank}</p>
                </div>
                <div className="bg-bg-muted rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">계좌번호</p>
                  <p className="font-semibold text-text-primary text-xs">{BANK_INFO.account}</p>
                </div>
                <div className="bg-bg-muted rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">예금주</p>
                  <p className="font-semibold text-text-primary">{BANK_INFO.holder}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1.5">입금자명 (필수)</label>
                <input
                  type="text"
                  placeholder="입금자명을 정확히 입력하세요"
                  value={templateDepositor}
                  onChange={(e) => setTemplateDepositor(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-muted border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60"
                />
              </div>

              {templateError && (
                <p className="text-sm text-error">{templateError}</p>
              )}
              {templateSuccess && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                  {templateSuccess}
                </div>
              )}

              <button
                onClick={handleTemplateSubmit}
                disabled={templateSubmitting || !templateDepositor.trim()}
                className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {templateSubmitting ? '처리 중...' : `${item.price.toLocaleString('ko-KR')}원 무통장 입금 신청`}
              </button>
              <p className="text-xs text-text-muted text-center">
                입금 확인 후 24시간 이내 템플릿이 지급됩니다. 문의: support@mychatbot.world
              </p>
            </div>
          );
        })()}

        {/* 팩 미선택 시 성공/에러 메시지 표시 (선택 해제 후에도 보임) */}
        {!selectedTemplateId && templateSuccess && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
            {templateSuccess}
          </div>
        )}
      </div>

      {/* 음성 & 아바타 팩 구매 */}
      <div className="bg-bg-surface rounded-2xl border border-border p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-text-primary">음성 & 아바타 팩</h3>
          <p className="text-xs text-text-muted mt-1">
            내 챗봇에 AI 음성과 고유 아바타를 장착하세요. 일회성 구매 · 영구 사용
          </p>
        </div>

        {/* 음성 팩 */}
        <div>
          <p className="text-xs font-semibold text-text-secondary mb-2">🎙️ 음성 팩</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {VOICE_PACKS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedAddonId(selectedAddonId === item.id ? null : item.id)}
                className={clsx(
                  'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all',
                  selectedAddonId === item.id
                    ? 'border-accent bg-accent/10 shadow-accent-glow'
                    : 'border-border bg-bg-subtle hover:border-accent/50',
                )}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm font-semibold text-text-primary leading-snug">{item.name}</span>
                <span className="text-[11px] text-text-muted leading-snug">{item.description}</span>
                <span className={clsx('mt-1 text-sm font-bold', selectedAddonId === item.id ? 'text-accent' : 'text-text-secondary')}>
                  {item.price.toLocaleString('ko-KR')}원
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 아바타 팩 */}
        <div>
          <p className="text-xs font-semibold text-text-secondary mb-2">🖼️ 아바타 팩</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {AVATAR_PACKS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedAddonId(selectedAddonId === item.id ? null : item.id)}
                className={clsx(
                  'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all',
                  selectedAddonId === item.id
                    ? 'border-accent bg-accent/10 shadow-accent-glow'
                    : 'border-border bg-bg-subtle hover:border-accent/50',
                )}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm font-semibold text-text-primary leading-snug">{item.name}</span>
                <span className="text-[11px] text-text-muted leading-snug">{item.description}</span>
                <span className={clsx('mt-1 text-sm font-bold', selectedAddonId === item.id ? 'text-accent' : 'text-text-secondary')}>
                  {item.price.toLocaleString('ko-KR')}원
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 구매 폼 — 아이템 선택 시 */}
        {selectedAddonId && (() => {
          const item = [...VOICE_PACKS, ...AVATAR_PACKS].find((t) => t.id === selectedAddonId)!;
          return (
            <div className="bg-bg-subtle rounded-xl border border-accent/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">
                선택: {item.emoji} {item.name} — {item.price.toLocaleString('ko-KR')}원
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-bg-muted rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">은행</p>
                  <p className="font-semibold text-text-primary">{BANK_INFO.bank}</p>
                </div>
                <div className="bg-bg-muted rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">계좌번호</p>
                  <p className="font-semibold text-text-primary text-xs">{BANK_INFO.account}</p>
                </div>
                <div className="bg-bg-muted rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">예금주</p>
                  <p className="font-semibold text-text-primary">{BANK_INFO.holder}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">입금자명 (필수)</label>
                <input
                  type="text"
                  placeholder="입금자명을 정확히 입력하세요"
                  value={addonDepositor}
                  onChange={(e) => setAddonDepositor(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-muted border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60"
                />
              </div>
              {addonError && <p className="text-sm text-error">{addonError}</p>}
              {addonSuccess && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                  {addonSuccess}
                </div>
              )}
              <button
                onClick={handleAddonSubmit}
                disabled={addonSubmitting || !addonDepositor.trim()}
                className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {addonSubmitting ? '처리 중...' : `${item.price.toLocaleString('ko-KR')}원 무통장 입금 신청`}
              </button>
              <p className="text-xs text-text-muted text-center">
                입금 확인 후 24시간 이내 적용됩니다. 문의: support@mychatbot.world
              </p>
            </div>
          );
        })()}

        {!selectedAddonId && addonSuccess && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
            {addonSuccess}
          </div>
        )}
      </div>

      {/* 내역 */}
      <div className="bg-bg-surface rounded-2xl border border-border p-5">
        <div className="flex gap-2 mb-4">
          {(['charge', 'use'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setHistoryTab(t)}
              className={clsx(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                historyTab === t
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'text-text-muted border border-border hover:border-accent/30',
              )}
            >
              {t === 'charge' ? '충전 내역' : '사용 내역'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-text-muted py-6 text-sm">불러오는 중...</div>
        ) : historyTab === 'charge' ? (
          history.length === 0 ? (
            <p className="text-center text-text-muted py-6 text-sm">충전 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm text-text-primary font-medium">
                      {formatCurrency(h.amount)} 충전
                    </p>
                    <p className="text-xs text-text-muted">{formatDate(h.created_at)}{h.depositor_name ? ` · ${h.depositor_name}` : ''}</p>
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
