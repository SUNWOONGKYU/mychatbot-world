/**
 * @task S5FE11
 * @description 마이페이지 탭8 — 계정 보안 (비밀번호 변경, 로그아웃, 계정 삭제)
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

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

// ── 비밀번호 변경 섹션 ───────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  // 강도 계산
  function strength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: '약함', color: 'bg-error' };
    if (score === 2) return { level: 2, label: '보통', color: 'bg-warning' };
    return { level: 3, label: '강함', color: 'bg-success' };
  }

  const pw = strength(next);

  async function handleSave() {
    setError('');
    if (!current || !next || !confirm) {
      setError('모든 항목을 입력하세요.');
      return;
    }
    if (next.length < 8) {
      setError('새 비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (next !== confirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  function PwInput({
    label,
    value,
    onChange,
    show,
    onToggleShow,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggleShow: () => void;
    placeholder?: string;
  }) {
    return (
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 pr-10 py-2.5 bg-bg-muted border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60"
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors text-xs"
          >
            {show ? '숨김' : '표시'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔑</span>
        <h3 className="font-semibold text-text-primary">비밀번호 변경</h3>
      </div>

      <PwInput
        label="현재 비밀번호"
        value={current}
        onChange={setCurrent}
        show={showCurrent}
        onToggleShow={() => setShowCurrent((v) => !v)}
        placeholder="현재 비밀번호 입력"
      />

      <div>
        <PwInput
          label="새 비밀번호"
          value={next}
          onChange={setNext}
          show={showNext}
          onToggleShow={() => setShowNext((v) => !v)}
          placeholder="최소 8자, 대문자/숫자/특수문자 포함 권장"
        />
        {next && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3].map((lvl) => (
                <div
                  key={lvl}
                  className={clsx(
                    'h-1 flex-1 rounded-full transition-colors',
                    pw.level >= lvl ? pw.color : 'bg-border',
                  )}
                />
              ))}
            </div>
            {pw.label && (
              <p className={clsx('text-xs', pw.color.replace('bg-', 'text-'))}>
                강도: {pw.label}
              </p>
            )}
          </div>
        )}
      </div>

      <PwInput
        label="새 비밀번호 확인"
        value={confirm}
        onChange={setConfirm}
        show={false}
        onToggleShow={() => {}}
        placeholder="새 비밀번호 재입력"
      />

      {confirm && next !== confirm && (
        <p className="text-xs text-error">비밀번호가 일치하지 않습니다.</p>
      )}

      {error && <p className="text-sm text-error">{error}</p>}
      {success && (
        <p className="text-sm text-success text-center">비밀번호가 성공적으로 변경되었습니다.</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {saving ? '변경 중...' : '비밀번호 변경'}
      </button>
    </div>
  );
}

// ── 로그아웃 섹션 ────────────────────────────────────────────

function LogoutSection() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mcw_access_token');
      sessionStorage.removeItem('mcw_access_token');
    }
    router.push('/');
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚪</span>
          <div>
            <h3 className="font-semibold text-text-primary">로그아웃</h3>
            <p className="text-xs text-text-muted mt-0.5">현재 기기에서 로그아웃합니다.</p>
          </div>
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:border-primary/50 transition-colors"
          >
            로그아웃
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              확인
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:border-primary/50 transition-colors"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 계정 삭제 섹션 ───────────────────────────────────────────

function DeleteAccountSection() {
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'confirm' | 'input' | 'deleting'>('idle');
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const CONFIRM_PHRASE = '계정을 삭제합니다';

  async function handleDelete() {
    if (confirmText !== CONFIRM_PHRASE) {
      setError(`"${CONFIRM_PHRASE}"를 정확히 입력해주세요.`);
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    setStep('deleting');
    setError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mcw_access_token');
        sessionStorage.removeItem('mcw_access_token');
      }
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '계정 삭제에 실패했습니다.');
      setStep('input');
    }
  }

  return (
    <div
      className={clsx(
        'rounded-2xl border p-6 space-y-4',
        step !== 'idle'
          ? 'border-error/40 bg-error/5'
          : 'border-border bg-bg-surface',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <div>
          <h3 className="font-semibold text-error">계정 삭제</h3>
          <p className="text-xs text-text-muted mt-0.5">
            삭제된 계정과 데이터는 복구할 수 없습니다.
          </p>
        </div>
      </div>

      {step === 'idle' && (
        <button
          onClick={() => setStep('confirm')}
          className="w-full py-2.5 rounded-xl border border-error/40 text-error text-sm font-semibold hover:bg-error/10 transition-colors"
        >
          계정 삭제
        </button>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-error/10 border border-error/30 space-y-2">
            <p className="text-sm font-semibold text-error">삭제 시 사라지는 항목</p>
            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
              <li>내 모든 코코봇과 페르소나</li>
              <li>대화 로그, KB 지식베이스</li>
              <li>크레딧 잔액 및 결제 내역</li>
              <li>스킬 및 구독 정보</li>
              <li>커뮤니티 게시글 및 댓글</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('input')}
              className="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              계속 진행
            </button>
            <button
              onClick={() => setStep('idle')}
              className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm hover:border-primary/50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {(step === 'input' || step === 'deleting') && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">
              아래 텍스트를 정확히 입력하세요: <strong className="text-error">"{CONFIRM_PHRASE}"</strong>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={step === 'deleting'}
              className="w-full px-3 py-2.5 bg-bg-muted border border-error/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-error/60 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">현재 비밀번호 확인</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={step === 'deleting'}
              className="w-full px-3 py-2.5 bg-bg-muted border border-error/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-error/60 disabled:opacity-50"
              placeholder="비밀번호 입력"
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={step === 'deleting' || confirmText !== CONFIRM_PHRASE || !password}
              className="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {step === 'deleting' ? '삭제 중...' : '계정 영구 삭제'}
            </button>
            <button
              onClick={() => { setStep('idle'); setConfirmText(''); setPassword(''); setError(''); }}
              disabled={step === 'deleting'}
              className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm hover:border-primary/50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function Tab8Security() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-text-primary">계정 보안</h2>
      <PasswordSection />
      <LogoutSection />
      <DeleteAccountSection />
    </div>
  );
}
