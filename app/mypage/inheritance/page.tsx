/**
 * @task S4FE2
 * @description MyPage — 프로필 관리, 피상속 설정, 피상속 수락
 *
 * Route: /mypage/inheritance
 * APIs: GET/POST/DELETE /api/inheritance, PATCH /api/inheritance
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { getToken, authHeaders } from '@/lib/auth-client';

// ── 타입 정의 ────────────────────────────────────────────────

type InheritanceStatus = 'none' | 'pending' | 'accepted' | 'rejected';

interface Persona {
  id: string;
  name: string;
  description: string | null;
  inheritance_allowed: boolean;
}

interface InheritanceRecord {
  id: string;
  heir_email: string | null;
  heir_name: string | null;
  status: InheritanceStatus;
  message: string | null;
  condition_months: number;
  personas: Persona[];
  created_at: string;
}

// ── 유틸 ──────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── 상태 뱃지 ────────────────────────────────────────────────

const STATUS_MAP: Record<
  InheritanceStatus,
  { label: string; cls: string }
> = {
  none:     { label: '미지정',    cls: 'bg-bg-muted text-text-muted border-border' },
  pending:  { label: '초대 중',   cls: 'bg-info/15 text-info border-info/30' },
  accepted: { label: '동의 완료', cls: 'bg-success/15 text-success border-success/30' },
  rejected: { label: '거부됨',    cls: 'bg-error/15 text-error border-error/30' },
};

function StatusBadge({ status }: { status: InheritanceStatus }) {
  const { label, cls } = STATUS_MAP[status] ?? STATUS_MAP.none;
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
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  confirmVariant = 'danger',
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
            className="px-4 py-2 text-sm font-semibold text-text-secondary border border-border rounded-xl hover:bg-bg-subtle transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              'px-4 py-2 text-sm font-semibold rounded-xl transition-colors',
              confirmVariant === 'danger'
                ? 'bg-error text-white hover:bg-error/80'
                : 'bg-primary text-white hover:bg-primary-hover',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function InheritancePage() {
  const router = useRouter();

  // ── 상태 ──
  const [record, setRecord] = useState<InheritanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 피상속인 지정 폼
  const [showForm, setShowForm] = useState(false);
  const [heirEmail, setHeirEmail] = useState('');
  const [heirMessage, setHeirMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // 해제 모달
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  // 토글 로딩 (persona id → boolean)
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({});

  // ── 초기화 ──
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    loadInheritance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInheritance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/inheritance', { headers: authHeaders() });
      if (res.status === 401) { router.replace('/login'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // API는 { owned, asHeir } 구조 또는 단일 record 반환
      const owned = data.owned ?? (data.id ? [data] : []);
      setRecord(owned.length > 0 ? owned[0] : null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ── 이메일 실시간 검사 ──
  function handleEmailChange(val: string) {
    setHeirEmail(val);
    if (val && !isValidEmail(val)) {
      setEmailError('올바른 이메일 형식을 입력하세요.');
    } else {
      setEmailError('');
    }
  }

  // ── 피상속인 지정 ──
  async function submitDesignation() {
    if (!isValidEmail(heirEmail)) {
      setEmailError('올바른 이메일 형식을 입력하세요.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/inheritance', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          heir_email: heirEmail.trim(),
          message: heirMessage.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setShowForm(false);
      setHeirEmail('');
      setHeirMessage('');
      await loadInheritance();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : '지정에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  }

  // ── 피상속인 해제 ──
  async function removeDesignation() {
    if (!record) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/inheritance?id=${encodeURIComponent(record.id)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setRecord(null);
      setShowRemoveModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '해제에 실패했습니다.');
    } finally {
      setRemoveLoading(false);
    }
  }

  // ── 페르소나 토글 ──
  async function togglePersona(persona: Persona) {
    if (!record) return;
    setToggleLoading(prev => ({ ...prev, [persona.id]: true }));
    const newVal = !persona.inheritance_allowed;
    try {
      const res = await fetch('/api/inheritance', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          id: record.id,
          persona_id: persona.id,
          inheritance_allowed: newVal,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      // 로컬 상태 업데이트
      setRecord(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          personas: prev.personas.map(p =>
            p.id === persona.id ? { ...p, inheritance_allowed: newVal } : p,
          ),
        };
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '설정 변경에 실패했습니다.');
    } finally {
      setToggleLoading(prev => ({ ...prev, [persona.id]: false }));
    }
  }

  // ── 렌더 ──

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">피상속 설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 해제 확인 모달 */}
      <ConfirmModal
        open={showRemoveModal}
        title="피상속인 지정 해제"
        body="피상속인 지정을 해제하시겠습니까? 해당 피상속인에게 전송된 동의 요청도 취소됩니다."
        confirmLabel={removeLoading ? '처리 중...' : '해제하기'}
        confirmVariant="danger"
        onConfirm={removeDesignation}
        onCancel={() => setShowRemoveModal(false)}
      />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* ── 헤더 ── */}
        <div className="pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/mypage" className="text-text-muted hover:text-text-secondary text-sm transition-colors">
              마이페이지
            </Link>
            <span className="text-text-muted text-sm">/</span>
            <span className="text-sm text-text-secondary">피상속 설정</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">피상속 설정</h1>
          <p className="text-sm text-text-secondary mt-1">
            나의 계정이 비활성화될 경우 코코봇을 물려줄 피상속인을 지정하세요.
          </p>
        </div>

        {/* 에러 */}
        {error && (
          <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-sm text-error">
            {error}
          </div>
        )}

        {/* ── 피상속인 현황 카드 ── */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-bold text-text-primary mb-4">피상속인 현황</h2>

          {record ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-text-primary">
                    {record.heir_name ?? record.heir_email ?? '이름 미확인'}
                  </p>
                  {record.heir_email && (
                    <p className="text-sm text-text-secondary mt-0.5">{record.heir_email}</p>
                  )}
                </div>
                <StatusBadge status={record.status} />
              </div>

              {record.message && (
                <div className="p-3 bg-bg-subtle rounded-xl">
                  <p className="text-xs text-text-muted mb-1">전달 메시지</p>
                  <p className="text-sm text-text-secondary">{record.message}</p>
                </div>
              )}

              <button
                onClick={() => setShowRemoveModal(true)}
                disabled={removeLoading}
                className="mt-2 px-4 py-2 text-sm font-semibold text-error border border-error/40 rounded-xl hover:bg-error/10 disabled:opacity-50 transition-colors"
              >
                지정 해제
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-4xl mb-3">👤</p>
              <p className="text-text-secondary text-sm mb-4">아직 피상속인이 지정되지 않았습니다.</p>
              {!showForm && (
                <button
                  onClick={() => { setShowForm(true); setFormError(''); setEmailError(''); }}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
                >
                  피상속인 지정
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── 피상속인 지정 폼 ── */}
        {showForm && !record && (
          <section className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-text-primary">피상속인 지정</h2>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                피상속인 이메일 <span className="text-error">*</span>
              </label>
              <input
                type="email"
                value={heirEmail}
                onChange={e => handleEmailChange(e.target.value)}
                placeholder="example@email.com"
                className={clsx(
                  'w-full px-3 py-2.5 bg-bg-subtle border rounded-xl text-text-primary text-sm outline-none transition-colors',
                  emailError ? 'border-error focus:border-error' : 'border-border focus:border-primary/60',
                )}
              />
              {emailError && (
                <p className="mt-1 text-xs text-error">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                개인 메시지 <span className="text-text-muted font-normal">(선택)</span>
              </label>
              <textarea
                value={heirMessage}
                onChange={e => setHeirMessage(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="피상속인에게 전달할 메시지를 입력하세요"
                className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors resize-none"
              />
            </div>

            <div className="p-3 bg-info/10 border border-info/25 rounded-xl">
              <p className="text-xs text-info leading-relaxed">
                지정한 이메일로 동의 요청이 발송됩니다. 피상속인이 수락해야 효력이 발생합니다.
              </p>
            </div>

            {formError && (
              <p className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={submitDesignation}
                disabled={formLoading || !!emailError || !heirEmail}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {formLoading ? '요청 중...' : '동의 요청 보내기'}
              </button>
              <button
                onClick={() => { setShowForm(false); setHeirEmail(''); setHeirMessage(''); setEmailError(''); setFormError(''); }}
                className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-semibold hover:bg-bg-subtle transition-colors"
              >
                취소
              </button>
            </div>
          </section>
        )}

        {/* ── 페르소나별 피상속 허용 토글 ── */}
        {record && record.personas && record.personas.length > 0 && (
          <section className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-bold text-text-primary mb-1">페르소나별 피상속 허용</h2>
            <p className="text-sm text-text-secondary mb-4">
              피상속 시 이전될 코코봇 페르소나를 선택하세요.
            </p>

            <div className="space-y-2">
              {record.personas.map(persona => (
                <div
                  key={persona.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-bg-subtle transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-semibold text-text-primary text-sm">{persona.name}</p>
                    {persona.description && (
                      <p className="text-xs text-text-muted mt-0.5 truncate">{persona.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={toggleLoading[persona.id]}
                    onClick={() => togglePersona(persona)}
                    className={clsx(
                      'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
                      toggleLoading[persona.id] && 'opacity-60',
                      persona.inheritance_allowed ? 'bg-primary' : 'bg-border-strong',
                    )}
                    aria-label={`${persona.name} 피상속 ${persona.inheritance_allowed ? '허용됨' : '불허'}`}
                  >
                    <span
                      className={clsx(
                        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                        persona.inheritance_allowed && 'translate-x-5',
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 안내 ── */}
        <section className="bg-bg-subtle border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-text-primary mb-2">피상속 안내</h3>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            <li>• 피상속인은 한 명만 지정할 수 있습니다.</li>
            <li>• 피상속인이 동의를 수락해야 효력이 발생합니다.</li>
            <li>• 계정 비활성 조건 충족 시 자동으로 코코봇 소유권이 이전됩니다.</li>
            <li>• 언제든지 피상속인 지정을 해제하거나 변경할 수 있습니다.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
