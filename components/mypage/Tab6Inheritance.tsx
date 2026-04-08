/**
 * @task S5FE11
 * @description 마이페이지 탭6 — 상속 (페르소나 단위, 제외 항목 선택)
 */
'use client';

import { useState } from 'react';
import clsx from 'clsx';

// ── 타입 ─────────────────────────────────────────────────────

interface Persona {
  id: string;
  name: string;
}

type ExcludeKey = 'chat_logs' | 'kb' | 'paid_skills' | 'credits' | 'revenue_settings' | 'specific_personas';

interface PersonaInheritance {
  persona_id: string;
  heir_email: string;
  exclude: Record<ExcludeKey, boolean>;
  status: 'none' | 'pending' | 'accepted' | 'declined';
}

const EXCLUDE_OPTIONS: { key: ExcludeKey; label: string }[] = [
  { key: 'chat_logs',        label: '대화 로그' },
  { key: 'kb',               label: 'KB 지식베이스' },
  { key: 'paid_skills',      label: '유료 스킬' },
  { key: 'credits',          label: '크레딧' },
  { key: 'revenue_settings', label: '수익 설정' },
  { key: 'specific_personas', label: '특정 페르소나 제외' },
];

const MOCK_PERSONAS: Persona[] = [
  { id: 'p1', name: '고객상담 페르소나' },
  { id: 'p2', name: '마케팅 도우미 페르소나' },
  { id: 'p3', name: '내부 업무 봇 페르소나' },
];

const DEFAULT_EXCLUDE: Record<ExcludeKey, boolean> = {
  chat_logs:        false,
  kb:               false,
  paid_skills:      false,
  credits:          false,
  revenue_settings: false,
  specific_personas: false,
};

function StatusBadge({ status }: { status: PersonaInheritance['status'] }) {
  const map = {
    none:     { label: '미설정',    cls: 'bg-bg-muted text-text-muted border-border' },
    pending:  { label: '대기 중',   cls: 'bg-warning/15 text-warning border-warning/30' },
    accepted: { label: '수락됨',    cls: 'bg-success/15 text-success border-success/30' },
    declined: { label: '거절됨',    cls: 'bg-error/15 text-error border-error/30' },
  };
  const { label, cls } = map[status];
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', cls)}>
      {label}
    </span>
  );
}

export default function Tab6Inheritance() {
  const [inheritances, setInheritances] = useState<PersonaInheritance[]>(
    MOCK_PERSONAS.map((p) => ({
      persona_id: p.id,
      heir_email: '',
      exclude: { ...DEFAULT_EXCLUDE },
      status: 'none',
    })),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [sentMsg, setSentMsg] = useState('');

  function getInheritance(pid: string) {
    return inheritances.find((i) => i.persona_id === pid)!;
  }

  function updateEmail(pid: string, email: string) {
    setInheritances((prev) =>
      prev.map((i) => (i.persona_id === pid ? { ...i, heir_email: email } : i)),
    );
  }

  function toggleExclude(pid: string, key: ExcludeKey) {
    setInheritances((prev) =>
      prev.map((i) =>
        i.persona_id === pid
          ? { ...i, exclude: { ...i.exclude, [key]: !i.exclude[key] } }
          : i,
      ),
    );
  }

  async function sendRequest(pid: string) {
    const inh = getInheritance(pid);
    if (!inh.heir_email.trim()) return;
    setSending(pid);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setInheritances((prev) =>
      prev.map((i) =>
        i.persona_id === pid ? { ...i, status: 'pending' } : i,
      ),
    );
    setSending(null);
    setSentMsg('상속 동의 요청이 발송되었습니다.');
    setTimeout(() => setSentMsg(''), 3000);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-2">상속 설정</h2>
      <p className="text-sm text-text-secondary mb-6">
        페르소나별로 피상속인을 지정하고 상속할 항목을 설정합니다.
        상속 동의 요청을 발송하면 피상속인이 이메일로 수락/거절할 수 있습니다.
      </p>

      {sentMsg && (
        <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
          {sentMsg}
        </div>
      )}

      <div className="space-y-3">
        {MOCK_PERSONAS.map((p) => {
          const inh = getInheritance(p.id);
          const expanded = expandedId === p.id;

          return (
            <div key={p.id} className="bg-bg-surface rounded-xl border border-border overflow-hidden">
              {/* 헤더 */}
              <button
                onClick={() => setExpandedId(expanded ? null : p.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-bg-surface-hover transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold">
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                    {inh.heir_email && (
                      <p className="text-xs text-text-muted">{inh.heir_email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={inh.status} />
                  <span className={clsx('text-text-muted transition-transform', expanded && 'rotate-180')}>
                    ▾
                  </span>
                </div>
              </button>

              {/* 상세 설정 */}
              {expanded && (
                <div className="border-t border-border p-5 space-y-5">
                  {/* 피상속인 이메일 */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      피상속인 이메일
                    </label>
                    <input
                      type="email"
                      placeholder="heir@example.com"
                      value={inh.heir_email}
                      onChange={(e) => updateEmail(p.id, e.target.value)}
                      disabled={inh.status === 'accepted'}
                      className="w-full px-3 py-2 bg-bg-muted border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 disabled:opacity-50"
                    />
                  </div>

                  {/* 제외 항목 */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      제외할 항목 (체크된 항목은 상속하지 않음)
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {EXCLUDE_OPTIONS.map((opt) => (
                        <label
                          key={opt.key}
                          className="flex items-center gap-2 bg-bg-subtle rounded-lg px-3 py-2.5 cursor-pointer hover:bg-bg-muted transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={inh.exclude[opt.key]}
                            onChange={() => toggleExclude(p.id, opt.key)}
                            disabled={inh.status === 'accepted'}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-xs text-text-secondary">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 상태 안내 + 발송 버튼 */}
                  {inh.status === 'accepted' ? (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
                      상속이 수락되었습니다.
                    </div>
                  ) : inh.status === 'declined' ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm text-center">
                        상속이 거절되었습니다. 다시 요청하려면 이메일을 확인하고 재발송하세요.
                      </div>
                      <button
                        onClick={() => sendRequest(p.id)}
                        disabled={!!sending}
                        className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                      >
                        {sending === p.id ? '발송 중...' : '재발송'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => sendRequest(p.id)}
                      disabled={!inh.heir_email.trim() || !!sending}
                      className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
                    >
                      {sending === p.id
                        ? '발송 중...'
                        : inh.status === 'pending'
                        ? '재발송'
                        : '상속 동의 요청 발송'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
