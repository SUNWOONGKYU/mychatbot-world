/**
 * @task S5FE11
 * @description 마이페이지 탭6 — 상속 (실제 API 연동)
 *
 * GET  /api/inheritance  → 현재 상속 설정 + 페르소나 목록 조회
 * POST /api/inheritance  → 피상속인 지정 (body: { heirEmail, message? })
 * PATCH /api/inheritance → 페르소나별 허용 여부 업데이트
 *                          (body: { personas: [{ personaId, allowed }] })
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';

// ── 타입 ─────────────────────────────────────────────────────

interface Persona {
  id: string;
  name: string;
  allowed: boolean;
}

interface HeirInfo {
  inheritanceId: string;
  userId: string | null;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
}

interface InheritanceData {
  heir: HeirInfo | null;
  personas: Persona[];
}

function StatusBadge({ status }: { status: HeirInfo['status'] | 'none' }) {
  const map: Record<string, { label: string; cls: string }> = {
    none:     { label: '미설정',  cls: 'bg-bg-muted text-text-muted border-border' },
    pending:  { label: '대기 중', cls: 'bg-warning/15 text-warning border-warning/30' },
    accepted: { label: '수락됨',  cls: 'bg-success/15 text-success border-success/30' },
    declined: { label: '거절됨',  cls: 'bg-error/15 text-error border-error/30' },
  };
  const { label, cls } = map[status] ?? map['none'];
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', cls)}>
      {label}
    </span>
  );
}

// ── 인증 토큰 헬퍼 ───────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  // Next.js 클라이언트 — localStorage에 Supabase 세션 토큰이 저장된 경우 활용
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(
      Object.keys(localStorage).find((k) => k.includes('auth-token') || k.includes('supabase')) ?? ''
    );
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.access_token ?? parsed?.session?.access_token;
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // fallback
  }
  return {};
}

// ── 컴포넌트 ─────────────────────────────────────────────────

export default function Tab6Inheritance() {
  const [data, setData] = useState<InheritanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 폼 상태
  const [heirEmail, setHeirEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');

  // ── 데이터 로드 ───────────────────────────────────────────

  const fetchInheritance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/inheritance', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? '상속 설정을 불러오지 못했습니다.');
      }
      setData(json.data as InheritanceData);
      if (json.data.heir?.email) {
        setHeirEmail(json.data.heir.email);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInheritance();
  }, [fetchInheritance]);

  // ── 피상속인 발송 ─────────────────────────────────────────

  async function sendRequest() {
    if (!heirEmail.trim()) return;
    setSending(true);
    setSentMsg('');
    try {
      const res = await fetch('/api/inheritance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ heirEmail: heirEmail.trim(), message: message.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? '발송에 실패했습니다.');
      }
      setSentMsg('상속 동의 요청이 발송되었습니다.');
      setTimeout(() => setSentMsg(''), 3000);
      await fetchInheritance();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  }

  // ── 페르소나 허용 토글 ────────────────────────────────────

  async function togglePersona(personaId: string, allowed: boolean) {
    if (!data) return;
    // 낙관적 UI 업데이트
    setData((prev) =>
      prev
        ? {
            ...prev,
            personas: prev.personas.map((p) =>
              p.id === personaId ? { ...p, allowed } : p
            ),
          }
        : prev
    );
    try {
      const res = await fetch('/api/inheritance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ personas: [{ personaId, allowed }] }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? '업데이트에 실패했습니다.');
      }
    } catch (e: unknown) {
      // 실패 시 롤백
      setData((prev) =>
        prev
          ? {
              ...prev,
              personas: prev.personas.map((p) =>
                p.id === personaId ? { ...p, allowed: !allowed } : p
              ),
            }
          : prev
      );
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────

  const heirStatus = data?.heir?.status ?? 'none';
  const isAccepted = heirStatus === 'accepted';

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-2">상속 설정</h2>
      <p className="text-sm text-text-secondary mb-6">
        피상속인을 지정하고 페르소나별 상속 허용 여부를 설정합니다.
        상속 동의 요청을 발송하면 피상속인이 수락/거절할 수 있습니다.
      </p>

      {/* 성공 메시지 */}
      {sentMsg && (
        <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
          {sentMsg}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm text-center">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-10 text-text-muted text-sm">불러오는 중...</div>
      )}

      {!loading && (
        <>
          {/* ── 피상속인 지정 섹션 ──────────────────────────── */}
          <div className="bg-bg-surface rounded-xl border border-border p-5 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">피상속인 지정</h3>
              <StatusBadge status={heirStatus} />
            </div>

            {data?.heir && (
              <p className="text-xs text-text-muted">
                현재 지정: <span className="text-text-secondary font-medium">{data.heir.email}</span>
              </p>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                피상속인 이메일
              </label>
              <input
                type="email"
                placeholder="heir@example.com"
                value={heirEmail}
                onChange={(e) => setHeirEmail(e.target.value)}
                disabled={isAccepted}
                className="w-full px-3 py-2 bg-bg-muted border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                초대 메시지 (선택)
              </label>
              <textarea
                placeholder="상속 요청 시 함께 보낼 메시지를 입력하세요."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isAccepted}
                rows={3}
                className="w-full px-3 py-2 bg-bg-muted border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 disabled:opacity-50 resize-none"
              />
            </div>

            {isAccepted ? (
              <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
                상속이 수락되었습니다.
              </div>
            ) : heirStatus === 'declined' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm text-center">
                  상속이 거절되었습니다. 이메일을 확인하고 재발송하세요.
                </div>
                <button
                  onClick={sendRequest}
                  disabled={sending || !heirEmail.trim()}
                  className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {sending ? '발송 중...' : '재발송'}
                </button>
              </div>
            ) : (
              <button
                onClick={sendRequest}
                disabled={sending || !heirEmail.trim()}
                className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {sending
                  ? '발송 중...'
                  : heirStatus === 'pending'
                  ? '재발송'
                  : '상속 동의 요청 발송'}
              </button>
            )}
          </div>

          {/* ── 페르소나별 허용 여부 ─────────────────────────── */}
          {data && data.personas.length > 0 && (
            <div className="bg-bg-surface rounded-xl border border-border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">페르소나별 상속 허용</h3>
              <p className="text-xs text-text-muted -mt-2">
                체크된 페르소나만 피상속인에게 상속됩니다.
              </p>
              <div className="space-y-2">
                {data.personas.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 bg-bg-subtle rounded-lg px-4 py-3 cursor-pointer hover:bg-bg-muted transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={p.allowed}
                      onChange={(e) => togglePersona(p.id, e.target.checked)}
                      disabled={!data.heir}
                      className="w-4 h-4 accent-primary"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                        {p.name[0]}
                      </div>
                      <span className="text-sm text-text-secondary">{p.name}</span>
                    </div>
                  </label>
                ))}
              </div>
              {!data.heir && (
                <p className="text-xs text-text-muted text-center">
                  피상속인을 먼저 지정해야 페르소나 설정을 변경할 수 있습니다.
                </p>
              )}
            </div>
          )}

          {data && data.personas.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm">
              상속할 페르소나가 없습니다. 먼저 코코봇을 생성하세요.
            </div>
          )}
        </>
      )}

      {/* 상속 수락 페이지 안내 */}
      <div className="mt-6 p-4 rounded-xl bg-bg-muted border border-border">
        <p className="text-xs text-text-muted">
          피상속인은{' '}
          <a href="/mypage/inheritance-accept" className="text-primary underline underline-offset-2">
            /mypage/inheritance-accept
          </a>
          {' '}링크에서 상속을 수락하거나 거절할 수 있습니다.
          발송된 이메일에 이 링크가 포함됩니다.
        </p>
      </div>
    </div>
  );
}
