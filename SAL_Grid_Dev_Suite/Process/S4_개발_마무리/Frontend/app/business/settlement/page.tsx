/**
 * @task S4FE1
 * @description Business 페이지 — 수익 대시보드, 정산, 결제수단 관리
 *
 * Route: /business/settlement
 * API:
 *   GET  /api/revenue/settlement  — 정산 내역 목록
 *   POST /api/revenue/settlement  — 정산 요청
 *   GET  /api/payment/method      — 결제수단 목록
 *   POST /api/payment/method      — 결제수단 추가
 *   DELETE /api/payment/method    — 결제수단 삭제
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';

// ── 타입 ──────────────────────────────────────────────────────

type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';
type SettlementCycle = 'weekly' | 'biweekly' | 'monthly';

interface Settlement {
  id: string;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  fee: number;
  net_amount: number;
  status: SettlementStatus;
  requested_at: string | null;
  completed_at: string | null;
}

interface SettlementSummary {
  pending_amount: number;
  min_settlement_amount: number;
  cycle: SettlementCycle;
}

interface PaymentMethod {
  id: string;
  card_brand: string;
  last4: string;
  is_default: boolean;
  created_at: string;
}

// ── 상수 ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SettlementStatus,
  { label: string; className: string }
> = {
  pending:    { label: '대기 중',   className: 'bg-bg-muted text-text-secondary' },
  processing: { label: '처리 중',   className: 'bg-info/10 text-info' },
  completed:  { label: '완료',      className: 'bg-success/10 text-success' },
  failed:     { label: '실패',      className: 'bg-error/10 text-error' },
};

const CYCLE_OPTIONS: { value: SettlementCycle; label: string }[] = [
  { value: 'weekly',    label: '주간 (매주 월요일)' },
  { value: 'biweekly',  label: '격주 (2주마다)' },
  { value: 'monthly',   label: '월간 (매월 1일)' },
];

// ── 스켈레톤 ─────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('rounded bg-bg-muted animate-pulse', className)} />;
}

// ── 상태 뱃지 ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: SettlementStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', className)}>
      {label}
    </span>
  );
}

// ── 결제수단 카드 ─────────────────────────────────────────────

function PaymentMethodCard({
  method,
  onDelete,
  onSetDefault,
}: {
  method: PaymentMethod;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const brandIcon = method.card_brand.toLowerCase() === 'visa' ? '💳' : '💳';

  return (
    <div
      className={clsx(
        'flex items-center gap-4 rounded-xl border p-4 transition-colors',
        method.is_default
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-surface',
      )}
    >
      <span className="text-2xl flex-shrink-0">{brandIcon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">
          {method.card_brand} ···· {method.last4}
        </p>
        {method.is_default && (
          <p className="text-xs text-primary font-medium mt-0.5">기본 결제수단</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!method.is_default && (
          <button
            onClick={() => onSetDefault(method.id)}
            className="text-xs text-text-muted hover:text-primary transition-colors px-2 py-1 rounded"
          >
            기본으로 설정
          </button>
        )}
        <button
          onClick={() => onDelete(method.id)}
          className="text-xs text-error hover:text-error/80 transition-colors px-2 py-1 rounded"
          aria-label="결제수단 삭제"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

// ── 결제수단 추가 모달 ────────────────────────────────────────

function AddPaymentModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [brand, setBrand] = useState('Visa');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setErr('카드 번호 16자리를 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    setErr('');
    try {
      const res = await fetch('/api/payment/method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_brand: brand, card_number: cardNumber.replace(/\s/g, ''), expiry }),
      });
      if (!res.ok) throw new Error('등록 실패');
      onAdd();
      onClose();
    } catch {
      setErr('카드 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-base font-bold text-text-primary">결제수단 추가</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              카드사
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {['Visa', 'Mastercard', 'Amex', 'BC카드', '국민카드', '신한카드', '하나카드', '우리카드'].map(
                (b) => <option key={b}>{b}</option>,
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              카드 번호
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              유효기간 (MM/YY)
            </label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {err && <p className="text-xs text-error">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2 text-sm text-text-secondary hover:bg-bg-subtle transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {submitting ? '등록 중…' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────

export default function SettlementPage() {
  // 정산 상태
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [loadingSettle, setLoadingSettle] = useState(true);
  const [errorSettle, setErrorSettle] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [cycleUpdating, setCycleUpdating] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<SettlementCycle>('monthly');

  // 결제수단 상태
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // 정산 목록 로드
  const fetchSettlements = useCallback(async () => {
    setLoadingSettle(true);
    setErrorSettle(false);
    try {
      const res = await fetch('/api/revenue/settlement');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSettlements(json.settlements ?? []);
      if (json.summary) {
        setSummary(json.summary);
        setSelectedCycle(json.summary.cycle ?? 'monthly');
      }
    } catch {
      setErrorSettle(true);
    } finally {
      setLoadingSettle(false);
    }
  }, []);

  // 결제수단 로드
  const fetchMethods = useCallback(async () => {
    setLoadingMethods(true);
    try {
      const res = await fetch('/api/payment/method');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setMethods(json.methods ?? []);
    } catch {
      setMethods([]);
    } finally {
      setLoadingMethods(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
    fetchMethods();
  }, [fetchSettlements, fetchMethods]);

  // 정산 요청
  const handleRequestSettlement = async () => {
    if (!summary || summary.pending_amount < summary.min_settlement_amount) return;
    setRequesting(true);
    try {
      const res = await fetch('/api/revenue/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: summary.pending_amount }),
      });
      if (!res.ok) throw new Error();
      await fetchSettlements();
    } catch {
      alert('정산 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setRequesting(false);
    }
  };

  // 정산 주기 변경
  const handleCycleChange = async (cycle: SettlementCycle) => {
    setSelectedCycle(cycle);
    setCycleUpdating(true);
    try {
      await fetch('/api/revenue/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_cycle', cycle }),
      });
    } finally {
      setCycleUpdating(false);
    }
  };

  // 결제수단 삭제
  const handleDeleteMethod = async (id: string) => {
    if (!confirm('이 결제수단을 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/payment/method?id=${id}`, { method: 'DELETE' });
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  // 기본 결제수단 설정
  const handleSetDefault = async (id: string) => {
    try {
      await fetch('/api/payment/method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_default', id }),
      });
      setMethods((prev) =>
        prev.map((m) => ({ ...m, is_default: m.id === id })),
      );
    } catch {
      alert('설정에 실패했습니다.');
    }
  };

  const canSettle =
    !!summary && summary.pending_amount >= summary.min_settlement_amount;
  const fmt = (n: number) => `₩${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-text-primary">정산 관리</h1>
        <p className="text-sm text-text-muted mt-0.5">정산 요청, 이력 확인, 결제수단을 관리하세요.</p>
      </div>

      {/* 정산 요청 히어로 카드 */}
      <div className="relative rounded-2xl border border-border bg-surface p-6 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-warning to-yellow-300" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
              미정산 잔액
            </p>
            {loadingSettle ? (
              <Skeleton className="h-10 w-40 mb-2" />
            ) : (
              <p className="text-4xl font-black text-text-primary">
                {fmt(summary?.pending_amount ?? 0)}
              </p>
            )}
            <p className="text-sm text-text-muted mt-2">
              {loadingSettle ? (
                <Skeleton className="h-4 w-48 inline-block" />
              ) : canSettle ? (
                <span className="text-success font-medium">정산 가능 금액에 도달했습니다</span>
              ) : (
                <span className="text-warning font-medium">
                  최소 정산 금액 {fmt(summary?.min_settlement_amount ?? 10000)} 미충족
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3 flex-shrink-0">
            {/* 정산 주기 */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted whitespace-nowrap">정산 주기</label>
              <select
                value={selectedCycle}
                onChange={(e) => handleCycleChange(e.target.value as SettlementCycle)}
                disabled={cycleUpdating}
                className="rounded-lg border border-border bg-bg-subtle px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              >
                {CYCLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 정산 요청 버튼 */}
            <button
              onClick={handleRequestSettlement}
              disabled={!canSettle || requesting || loadingSettle}
              className={clsx(
                'px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                canSettle
                  ? 'bg-warning text-white hover:bg-yellow-400 shadow-md'
                  : 'bg-bg-muted text-text-muted cursor-not-allowed',
              )}
            >
              {requesting ? '처리 중…' : '정산 요청'}
            </button>
          </div>
        </div>
      </div>

      {/* 정산 내역 테이블 */}
      <div>
        <h2 className="text-base font-bold text-text-primary mb-3">정산 내역</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {loadingSettle ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : errorSettle ? (
            <div className="p-10 text-center">
              <p className="text-text-muted text-sm">데이터를 불러오지 못했습니다.</p>
              <button
                onClick={fetchSettlements}
                className="mt-3 text-primary text-sm hover:underline"
              >
                다시 시도
              </button>
            </div>
          ) : settlements.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-text-muted text-sm">정산 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-subtle border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted">기간</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted">총 매출</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted">수수료</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted">정산액</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-bg-subtle transition-colors">
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {s.period_start} ~ {s.period_end}
                      </td>
                      <td className="px-4 py-3 text-right text-text-primary font-medium">
                        {fmt(s.gross_revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-error">
                        -{fmt(s.fee)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-primary font-bold">
                        {fmt(s.net_amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 결제수단 관리 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-text-primary">결제수단 관리</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
          >
            + 카드 추가
          </button>
        </div>

        <div className="space-y-3">
          {loadingMethods ? (
            [...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : methods.length === 0 ? (
            <div className="rounded-xl border border-border border-dashed p-8 text-center">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-text-muted text-sm">등록된 결제수단이 없습니다.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 text-primary text-sm hover:underline"
              >
                결제수단 추가하기
              </button>
            </div>
          ) : (
            methods.map((m) => (
              <PaymentMethodCard
                key={m.id}
                method={m}
                onDelete={handleDeleteMethod}
                onSetDefault={handleSetDefault}
              />
            ))
          )}
        </div>
      </div>

      {/* 결제수단 추가 모달 */}
      {showAddModal && (
        <AddPaymentModal
          onClose={() => setShowAddModal(false)}
          onAdd={fetchMethods}
        />
      )}
    </div>
  );
}
