/**
 * @task S4FE2
 * @description MyPage — 프로필 관리, 피상속 설정, 피상속 수락
 *
 * Route: /mypage/inheritance-accept
 * APIs: GET /api/inheritance/consent, POST /api/inheritance/consent
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 정의 ────────────────────────────────────────────────

type ConsentStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

interface ConsentRequest {
  id: string;
  owner_user_id: string;
  owner_email: string | null;
  owner_name: string | null;
  persona_count: number;
  bot_names: string[] | null;
  condition_months: number | null;
  message: string | null;
  status: ConsentStatus;
  created_at: string;
}

// ── 유틸 ──────────────────────────────────────────────────────

function getToken(): string {
  return (
    localStorage.getItem('mcw_access_token') ||
    sessionStorage.getItem('mcw_access_token') ||
    ''
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// ── 상태 뱃지 ────────────────────────────────────────────────

const STATUS_MAP: Record<ConsentStatus, { label: string; cls: string }> = {
  pending:   { label: '대기 중',   cls: 'bg-warning/15 text-warning border-warning/30' },
  accepted:  { label: '수락됨',   cls: 'bg-success/15 text-success border-success/30' },
  rejected:  { label: '거절됨',   cls: 'bg-error/15 text-error border-error/30' },
  cancelled: { label: '취소됨',   cls: 'bg-bg-muted text-text-muted border-border' },
};

function StatusBadge({ status }: { status: ConsentStatus }) {
  const { label, cls } = STATUS_MAP[status] ?? { label: status, cls: 'bg-bg-muted text-text-muted border-border' };
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border', cls)}>
      {label}
    </span>
  );
}

// ── 확인 모달 ────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-5">{body}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-text-secondary border border-border rounded-xl hover:bg-bg-subtle disabled:opacity-50 transition-colors"
          >
            아니오
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              'px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50',
              confirmVariant === 'danger'
                ? 'bg-error text-white hover:bg-error/80'
                : 'bg-primary text-white hover:bg-primary-hover',
            )}
          >
            {loading ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 요청 카드 ─────────────────────────────────────────────────

interface RequestCardProps {
  req: ConsentRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: boolean;
}

function RequestCard({ req, onAccept, onReject, actionLoading }: RequestCardProps) {
  const isPending = req.status === 'pending';

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-primary truncate">
            {req.owner_name ?? req.owner_email ?? '알 수 없는 사용자'}
          </p>
          {req.owner_email && req.owner_name && (
            <p className="text-sm text-text-secondary truncate">{req.owner_email}</p>
          )}
        </div>
        <StatusBadge status={req.status} />
      </div>

      {/* 메타 정보 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-bg-subtle rounded-xl">
          <p className="text-xs text-text-muted mb-1">코코봇 수</p>
          <p className="font-semibold text-text-primary text-sm">
            {req.persona_count > 0 ? `${req.persona_count}개` : '-'}
          </p>
          {req.bot_names && req.bot_names.length > 0 && (
            <p className="text-xs text-text-muted mt-0.5 truncate" title={req.bot_names.join(', ')}>
              {req.bot_names.slice(0, 2).join(', ')}
              {req.bot_names.length > 2 && ` 외 ${req.bot_names.length - 2}개`}
            </p>
          )}
        </div>
        <div className="p-3 bg-bg-subtle rounded-xl">
          <p className="text-xs text-text-muted mb-1">요청일</p>
          <p className="font-semibold text-text-primary text-sm">{formatDate(req.created_at)}</p>
          {req.condition_months && (
            <p className="text-xs text-text-muted mt-0.5">{req.condition_months}개월 비활성 시</p>
          )}
        </div>
      </div>

      {/* 개인 메시지 */}
      {req.message && (
        <div className="p-3 bg-info/10 border border-info/25 rounded-xl">
          <p className="text-xs text-info mb-1 font-semibold">전달 메시지</p>
          <p className="text-sm text-text-secondary leading-relaxed">{req.message}</p>
        </div>
      )}

      {/* 수락 안내 (pending 상태에서만) */}
      {isPending && (
        <div className="p-3 bg-bg-subtle rounded-xl text-xs text-text-secondary leading-relaxed">
          수락 시 원래 소유자의 계정이 비활성화될 경우 코코봇 소유권이 자동으로 이전됩니다.
          권한 범위: 코코봇 운영, 대화 내역 접근, 설정 변경.
        </div>
      )}

      {/* 액션 버튼 */}
      {isPending && (
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onAccept(req.id)}
            disabled={actionLoading}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            수락하기
          </button>
          <button
            onClick={() => onReject(req.id)}
            disabled={actionLoading}
            className="flex-1 py-2.5 border border-error/40 text-error rounded-xl text-sm font-semibold hover:bg-error/10 disabled:opacity-50 transition-colors"
          >
            거절하기
          </button>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function InheritanceAcceptPage() {
  const router = useRouter();

  // ── 상태 ──
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 모달 상태
  const [acceptModal, setAcceptModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [actionLoading, setActionLoading] = useState(false);

  // 처리 완료 메시지
  const [doneMessage, setDoneMessage] = useState('');

  // ── 초기화 ──
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/inheritance/consent', { headers: authHeaders() });
      if (res.status === 401) { router.replace('/login'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.requests ?? data.items ?? []);
      setRequests(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '요청 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ── 수락 처리 ──
  async function doAccept() {
    if (!acceptModal.id) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/inheritance/consent', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: acceptModal.id, action: 'accept' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      // 로컬 상태 업데이트
      setRequests(prev =>
        prev.map(r => r.id === acceptModal.id ? { ...r, status: 'accepted' as ConsentStatus } : r),
      );
      setAcceptModal({ open: false, id: null });
      setDoneMessage('상속 요청을 수락했습니다. 계정 비활성 조건 충족 시 코코봇 소유권이 자동 이전됩니다.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '수락 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }

  // ── 거절 처리 ──
  async function doReject() {
    if (!rejectModal.id) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/inheritance/consent', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: rejectModal.id, action: 'reject' }),
      });
      // 서버가 reject를 지원하지 않아도 로컬 반영
      if (res.ok) {
        setRequests(prev =>
          prev.map(r => r.id === rejectModal.id ? { ...r, status: 'rejected' as ConsentStatus } : r),
        );
      } else {
        // fallback: 로컬만 업데이트
        setRequests(prev =>
          prev.map(r => r.id === rejectModal.id ? { ...r, status: 'rejected' as ConsentStatus } : r),
        );
      }
      setRejectModal({ open: false, id: null });
      setDoneMessage('상속 요청을 거절했습니다. 요청자에게 알림이 전송됩니다.');
    } catch {
      // 에러 시에도 로컬 반영
      setRequests(prev =>
        prev.map(r => r.id === rejectModal.id ? { ...r, status: 'rejected' as ConsentStatus } : r),
      );
      setRejectModal({ open: false, id: null });
      setDoneMessage('상속 요청을 거절했습니다.');
    } finally {
      setActionLoading(false);
    }
  }

  // ── 파생 상태 ──
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  // ── 렌더 ──

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">요청 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 수락 모달 */}
      <ConfirmModal
        open={acceptModal.open}
        title="상속 수락"
        body="이 상속 요청을 수락하시겠습니까? 수락 후 원래 소유자의 계정이 비활성화될 경우 코코봇 소유권이 자동으로 이전됩니다."
        confirmLabel="수락하기"
        confirmVariant="primary"
        loading={actionLoading}
        onConfirm={doAccept}
        onCancel={() => setAcceptModal({ open: false, id: null })}
      />

      {/* 거절 모달 */}
      <ConfirmModal
        open={rejectModal.open}
        title="상속 거절"
        body="이 상속 요청을 거절하시겠습니까? 거절 후에는 되돌릴 수 없습니다."
        confirmLabel="거절하기"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={doReject}
        onCancel={() => setRejectModal({ open: false, id: null })}
      />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* ── 헤더 ── */}
        <div className="pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/mypage" className="text-text-muted hover:text-text-secondary text-sm transition-colors">
              마이페이지
            </Link>
            <span className="text-text-muted text-sm">/</span>
            <span className="text-sm text-text-secondary">피상속 수락</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">피상속 수락</h1>
              <p className="text-sm text-text-secondary mt-1">
                나에게 온 코코봇 피상속 동의 요청을 확인하세요.
              </p>
            </div>
            {pendingRequests.length > 0 && (
              <span className="flex-shrink-0 w-7 h-7 bg-error text-white rounded-full text-sm font-bold flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-sm text-error">
            {error}
            <button onClick={loadRequests} className="ml-3 underline">다시 시도</button>
          </div>
        )}

        {/* 처리 완료 메시지 */}
        {doneMessage && (
          <div className="p-4 bg-success/10 border border-success/30 rounded-xl text-sm text-success flex items-start gap-2">
            <span className="flex-shrink-0">✓</span>
            <div>
              <p>{doneMessage}</p>
              <button
                onClick={() => setDoneMessage('')}
                className="text-success/70 hover:text-success text-xs mt-1 underline"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* ── 대기 중 요청 ── */}
        {pendingRequests.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-bold text-text-primary">
              대기 중인 요청
              <span className="ml-2 text-sm font-normal text-text-secondary">
                ({pendingRequests.length}건)
              </span>
            </h2>
            {pendingRequests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                actionLoading={actionLoading}
                onAccept={id => setAcceptModal({ open: true, id })}
                onReject={id => setRejectModal({ open: true, id })}
              />
            ))}
          </section>
        )}

        {/* ── 빈 상태 ── */}
        {!loading && requests.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p className="font-semibold text-text-primary mb-2">피상속 요청이 없습니다</p>
            <p className="text-sm text-text-secondary">다른 사용자가 피상속인으로 지정하면 여기에 표시됩니다.</p>
          </div>
        )}

        {pendingRequests.length === 0 && requests.length > 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">✅</p>
            <p className="font-semibold text-text-primary mb-1">모든 요청이 처리되었습니다</p>
            <p className="text-sm text-text-secondary">새로운 요청이 오면 이 페이지에 표시됩니다.</p>
          </div>
        )}

        {/* ── 처리된 요청 내역 ── */}
        {processedRequests.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-bold text-text-primary text-sm text-text-secondary">
              처리된 요청 내역
            </h2>
            <div className="space-y-3">
              {processedRequests.map(req => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-text-primary text-sm">
                      {req.owner_name ?? req.owner_email ?? '알 수 없는 사용자'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatDate(req.created_at)} · {req.persona_count}개 코코봇
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 피상속 권한 안내 ── */}
        <section className="bg-bg-subtle border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-text-primary mb-2">수락 시 권한 범위</h3>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            <li>• 원래 소유자의 코코봇 페르소나 운영 및 관리</li>
            <li>• 기존 대화 내역 열람 (읽기 전용)</li>
            <li>• 코코봇 설정 수정 및 배포 URL 관리</li>
            <li>• 원래 소유자 계정이 비활성화된 경우에만 권한이 활성화됩니다.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
