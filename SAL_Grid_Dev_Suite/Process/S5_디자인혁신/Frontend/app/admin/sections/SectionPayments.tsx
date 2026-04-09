// @task S5FE7 - 섹션4: 입금/결제 관리
// 입금 신청 목록 (대기/승인/거부) + 배지 + 승인→크레딧 충전 + 거부 사유 + 크레딧 거래 내역
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminToast } from '../components/AdminToast';

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_type?: string;
  created_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
  metadata?: {
    depositor_name?: string;
    bank?: string;
    memo?: string;
  };
}

interface CreditTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface SectionPaymentsProps {
  adminKey: string;
  onBadgeChange: () => void;
}

type PaymentTab = 'pending' | 'completed' | 'cancelled' | 'all';
type ViewMode = 'payments' | 'transactions';

export default function SectionPayments({ adminKey, onBadgeChange }: SectionPaymentsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('payments');
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('pending');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);

  // 거부 모달
  const [rejectModal, setRejectModal] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const { showToast, ToastEl } = useAdminToast();

  const apiHeaders = useCallback(
    () => ({ 'X-Admin-Key': adminKey, 'Content-Type': 'application/json' }),
    [adminKey],
  );

  // ── 결제 목록 로드 ─────────────────────────────────────────────────────
  const loadPayments = useCallback(
    async (tab: PaymentTab = paymentTab, p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: '20',
          ...(tab !== 'all' ? { status: tab } : {}),
        });
        const res = await fetch(`/api/admin/payments?${qs}`, { headers: apiHeaders() });
        if (res.ok) {
          const d = await res.json();
          setPayments(d.payments || []);
          setTotalPages(d.totalPages || 1);
          setPage(p);
        }
      } finally {
        setLoading(false);
      }
    },
    [apiHeaders, paymentTab],
  );

  // ── 크레딧 거래 내역 로드 ──────────────────────────────────────────────
  const loadTransactions = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: String(p), limit: '20' });
        const res = await fetch(`/api/admin/credit-transactions?${qs}`, {
          headers: apiHeaders(),
        });
        if (res.ok) {
          const d = await res.json();
          setTransactions(d.transactions || []);
          setTotalPages(d.totalPages || 1);
          setPage(p);
        } else {
          // API 없는 경우 샘플
          setTransactions([]);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    },
    [apiHeaders],
  );

  // ── 미처리 건수 로드 ──────────────────────────────────────────────────
  const loadPendingCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: apiHeaders() });
      if (res.ok) {
        const d = await res.json();
        setPendingCount(d.pendingPayments || 0);
      }
    } catch { /* 무시 */ }
  }, [apiHeaders]);

  useEffect(() => {
    loadPendingCount();
    if (viewMode === 'payments') {
      loadPayments(paymentTab, 1);
    } else {
      loadTransactions(1);
    }
  }, [viewMode, paymentTab, loadPayments, loadTransactions, loadPendingCount]);

  // ── 승인 ──────────────────────────────────────────────────────────────
  const handleApprove = async (payment: Payment) => {
    if (!confirm(`${payment.metadata?.depositor_name || '?'} 님의 ${payment.amount.toLocaleString()}원 입금을 승인하시겠습니까?`)) return;
    setProcessing(payment.id);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({
          paymentId: payment.id,
          action: 'approve',
          confirmedBy: 'admin',
        }),
      });
      if (res.ok) {
        showToast(`승인 완료 — ${payment.amount.toLocaleString()}원 크레딧 충전`);
        loadPayments(paymentTab, 1);
        loadPendingCount();
        onBadgeChange();
      } else {
        const d = await res.json();
        showToast(`승인 실패: ${d.error || '알 수 없는 오류'}`);
      }
    } catch {
      showToast('네트워크 오류');
    } finally {
      setProcessing(null);
    }
  };

  // ── 거부 ──────────────────────────────────────────────────────────────
  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      showToast('거부 사유를 입력하세요 (필수)');
      return;
    }
    setProcessing(rejectModal.id);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({
          paymentId: rejectModal.id,
          action: 'reject',
          confirmedBy: 'admin',
        }),
      });
      if (res.ok) {
        showToast('입금 거부 처리됨');
        setRejectModal(null);
        setRejectReason('');
        loadPayments(paymentTab, 1);
        loadPendingCount();
        onBadgeChange();
      } else {
        const d = await res.json();
        showToast(`거부 실패: ${d.error || '알 수 없는 오류'}`);
      }
    } catch {
      showToast('네트워크 오류');
    } finally {
      setProcessing(null);
    }
  };

  // ── 유틸 ──────────────────────────────────────────────────────────────
  const fmtDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      pending:   { cls: 'admin-badge-pending', label: '대기' },
      completed: { cls: 'admin-badge-success', label: '승인' },
      cancelled: { cls: 'admin-badge-danger',  label: '거부' },
      refunded:  { cls: 'admin-badge-muted',   label: '환불' },
    };
    const { cls, label } = map[status] || { cls: 'admin-badge-muted', label: status };
    return <span className={`admin-badge ${cls}`}>{label}</span>;
  };

  const creditTypeBadge = (type: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      purchase: { cls: 'credit-type-charge', label: '충전' },
      charge:   { cls: 'credit-type-charge', label: '충전' },
      grant:    { cls: 'credit-type-grant',  label: '지급' },
      usage:    { cls: 'credit-type-usage',  label: '사용' },
      deduct:   { cls: 'credit-type-usage',  label: '차감' },
      refund:   { cls: 'credit-type-refund', label: '환불' },
    };
    const { cls, label } = map[type] || { cls: '', label: type };
    return <span className={cls} style={{ fontWeight: 700 }}>{label}</span>;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="admin-pagination">
        {page > 1 && <button onClick={() => (viewMode === 'payments' ? loadPayments(paymentTab, page - 1) : loadTransactions(page - 1))}>‹</button>}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, page - 2) + i;
          if (p > totalPages) return null;
          return (
            <button
              key={p}
              className={p === page ? 'active' : ''}
              onClick={() => (viewMode === 'payments' ? loadPayments(paymentTab, p) : loadTransactions(p))}
            >
              {p}
            </button>
          );
        })}
        {page < totalPages && <button onClick={() => (viewMode === 'payments' ? loadPayments(paymentTab, page + 1) : loadTransactions(page + 1))}>›</button>}
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h1 className="admin-section-title">입금/결제 관리</h1>
        {pendingCount > 0 && (
          <span className="admin-badge admin-badge-danger" style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
            미처리 {pendingCount}건
          </span>
        )}
      </div>

      {/* 뷰 전환 */}
      <div className="admin-tab-bar" style={{ marginBottom: '1.25rem' }}>
        <button
          className={`admin-tab-btn${viewMode === 'payments' ? ' active' : ''}`}
          onClick={() => setViewMode('payments')}
        >
          입금 신청
        </button>
        <button
          className={`admin-tab-btn${viewMode === 'transactions' ? ' active' : ''}`}
          onClick={() => setViewMode('transactions')}
        >
          크레딧 거래 내역
        </button>
      </div>

      {viewMode === 'payments' && (
        <>
          {/* 상태 탭 */}
          <div className="admin-tab-bar">
            {(
              [
                { v: 'pending',   label: '대기 중', badge: pendingCount },
                { v: 'completed', label: '승인완료' },
                { v: 'cancelled', label: '거부됨' },
                { v: 'all',       label: '전체' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.v}
                className={`admin-tab-btn${paymentTab === tab.v ? ' active' : ''}`}
                onClick={() => {
                  setPaymentTab(tab.v);
                  loadPayments(tab.v, 1);
                }}
              >
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span
                    style={{
                      background: 'var(--admin-danger)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '99px',
                      lineHeight: '1.6',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>입금자</th>
                  <th>금액</th>
                  <th>은행</th>
                  <th>신청일</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="admin-table-empty">로딩 중...</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-table-empty">
                      {paymentTab === 'pending' ? '대기 중인 입금 신청이 없습니다' : '데이터가 없습니다'}
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td className="admin-id">{p.id.slice(0, 8)}...</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {p.metadata?.depositor_name || '-'}
                        </div>
                        {p.metadata?.memo && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--admin-muted)' }}>
                            {p.metadata.memo}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--admin-success)' }}>
                        {p.amount.toLocaleString()}원
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--admin-muted)' }}>
                        {p.metadata?.bank || '-'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--admin-muted)' }}>
                        {fmtDate(p.created_at)}
                      </td>
                      <td>{statusBadge(p.status)}</td>
                      <td>
                        {p.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button
                              className="admin-btn admin-btn-success admin-btn-sm"
                              onClick={() => handleApprove(p)}
                              disabled={processing === p.id}
                            >
                              {processing === p.id ? '...' : '승인'}
                            </button>
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => {
                                setRejectModal(p);
                                setRejectReason('');
                              }}
                              disabled={processing === p.id}
                            >
                              거부
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                            {p.confirmed_by || '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      )}

      {viewMode === 'transactions' && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>타입</th>
                  <th>사용자 ID</th>
                  <th>금액</th>
                  <th>잔액 후</th>
                  <th>내용</th>
                  <th>일시</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">로딩 중...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">
                      거래 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{creditTypeBadge(tx.type)}</td>
                      <td className="admin-id">{tx.user_id?.slice(0, 12)}...</td>
                      <td
                        style={{
                          fontWeight: 700,
                          color:
                            tx.amount > 0
                              ? 'var(--admin-success)'
                              : 'var(--admin-danger)',
                        }}
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--admin-primary)', fontWeight: 600 }}>
                        {tx.balance_after.toLocaleString()}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--admin-muted)', maxWidth: '200px' }}>
                        {tx.description}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--admin-muted)' }}>
                        {fmtDate(tx.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      )}

      {/* 거부 모달 */}
      {rejectModal && (
        <div className="admin-modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">입금 거부</h2>
            <button className="admin-modal-close" onClick={() => setRejectModal(null)}>✕</button>

            <div
              style={{
                background: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>거부 대상</div>
              <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>
                {rejectModal.metadata?.depositor_name || '-'} — {rejectModal.amount.toLocaleString()}원
              </div>
            </div>

            <div className="admin-field">
              <label className="required">거부 사유</label>
              <textarea
                className="admin-textarea"
                rows={4}
                placeholder="거부 사유를 입력하세요 (필수)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="admin-btn admin-btn-outline"
                onClick={() => setRejectModal(null)}
              >
                취소
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={handleRejectConfirm}
                disabled={!!processing}
              >
                {processing ? '처리 중...' : '거부 확정'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastEl}
    </div>
  );
}
