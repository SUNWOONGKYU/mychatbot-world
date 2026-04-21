/**
 * @task S4GA1
 * @modified-by S11FE10 (2026-04-21): S7 semantic tokens (var(--state-*)) + 모바일 터치타겟 44px
 * @description 비밀번호 재설정 페이지 — 2단계 흐름
 *
 * Mode 1 (기본): 이메일 입력 → auth.resetPasswordForEmail() → 성공 메시지
 * Mode 2 (복구 링크 클릭 후): URL에 access_token / code 파라미터 감지
 *   → 새 비밀번호 입력 폼 → auth.updateUser() → 로그인 페이지 이동
 *
 * - 공개 페이지 (인증 불필요)
 * - CSS custom property 기반 디자인 토큰 사용 (var(--*) 형식)
 */
'use client';




import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';

// ── 공통 UI ──────────────────────────────────────────────────────────────────

function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none"
        style={{
          background: 'var(--surface-1)',
          border: error ? '1.5px solid var(--state-danger-border)' : '1.5px solid var(--border-default)',
          color: 'var(--text-primary)',
          boxShadow: error ? '0 0 0 1px var(--state-danger-border)' : undefined,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--interactive-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in oklch, var(--color-brand-500) 20%, transparent)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'var(--state-danger-border)' : 'var(--border-default)'; e.currentTarget.style.boxShadow = error ? '0 0 0 1px var(--state-danger-border)' : 'none'; }}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs" style={{ color: 'var(--state-danger-fg)' }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="inline-block animate-spin mr-2"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

// ── 페이지 컴포넌트 ───────────────────────────────────────────────────────────

type PageMode = 'email' | 'reset' | 'email-sent' | 'reset-done';

export default function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<PageMode>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // setSession이 single-use refresh_token으로 두 번 호출되지 않도록 보호
  const setSessionDoneRef = useRef(false);

  // ── URL 파라미터 / 해시로 복구 링크 감지 ────────────────────────────────────
  //    의존성 배열을 비워 마운트 시 1회만 실행. (이전에는 [searchParams]로
  //    리렌더마다 재실행되어 setSession이 소진된 refresh_token으로 재호출 → 오류)
  useEffect(() => {
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    // 만료/거부 에러 먼저 확인
    const errorCode = hashParams.get('error_code') ?? url.searchParams.get('error_code');
    const errorDescription = hashParams.get('error_description') ?? url.searchParams.get('error_description');
    if (errorCode || errorDescription) {
      const msg = decodeURIComponent(errorDescription || errorCode || '링크 오류');
      const friendly =
        errorCode === 'otp_expired'
          ? '재설정 링크가 만료되었습니다. 아래에서 이메일을 다시 입력해 새 링크를 받아주세요.'
          : msg;
      setErrors({ general: friendly });
      return;
    }

    const hasAccessToken = hashParams.get('access_token');
    const flowParam = url.searchParams.get('flow');
    const isRecovery =
      hashParams.get('type') === 'recovery' ||
      !!hasAccessToken ||
      !!code ||
      flowParam === 'recovery';

    // Legacy 경로: redirectTo가 /reset-password로 직행하던 시절의 이메일 링크.
    // detectSessionInUrl=false 이므로 수동 setSession — **once-guard 필수**.
    if (hasAccessToken && !setSessionDoneRef.current) {
      setSessionDoneRef.current = true;
      const refreshToken = hashParams.get('refresh_token');
      if (refreshToken) {
        supabase.auth
          .setSession({ access_token: hasAccessToken, refresh_token: refreshToken })
          .then(() => {
            // 세션 수립 후 hash 제거 — 재실행/새로고침 시 재사용 시도 방지
            try {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch {}
          })
          .catch(() => {
            setErrors({ general: '재설정 링크가 만료되었거나 이미 사용되었습니다. 이메일에서 새 링크를 요청해 주세요.' });
          });
      }
    }

    if (isRecovery) {
      setMode('reset');
    }

    // PASSWORD_RECOVERY 이벤트 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      }
    });

    return () => subscription.unsubscribe();
    // 의도적 빈 배열 — 페이지 라이프사이클 동안 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mode 1: 이메일 입력 → 재설정 링크 발송 ──────────────────────────────────

  async function handleSendEmail(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!email.trim()) {
      setErrors({ email: '이메일을 입력해 주세요.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: '올바른 이메일 형식이 아닙니다.' });
      return;
    }

    setIsLoading(true);

    try {
      // /auth/callback 경유: 콜백이 setSession 후 router.replace('/reset-password')로
      // hash를 제거하므로, /reset-password의 useEffect가 재실행되어도 setSession이
      // 소진된 토큰으로 재호출되는 경로가 차단된다.
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        setErrors({ general: error.message || '이메일 발송에 실패했습니다.' });
        return;
      }

      setMode('email-sent');
    } catch {
      setErrors({ general: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setIsLoading(false);
    }
  }

  // ── Mode 2: 새 비밀번호 설정 ─────────────────────────────────────────────────

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력해 주세요.';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = '비밀번호는 6자 이상이어야 합니다.';
    }
    if (!newPasswordConfirm) {
      newErrors.newPasswordConfirm = '비밀번호 확인을 입력해 주세요.';
    } else if (newPassword !== newPasswordConfirm) {
      newErrors.newPasswordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : '';
        const msg = error.message || '';
        let friendly = '비밀번호 변경에 실패했습니다.';
        if (code === 'same_password' || /should be different/i.test(msg) || /same.*password/i.test(msg)) {
          friendly = '이전과 동일한 비밀번호는 사용할 수 없습니다. 다른 비밀번호를 입력해 주세요.';
          setErrors({ newPassword: friendly, general: friendly });
        } else if (/session/i.test(msg) || /expired/i.test(msg)) {
          friendly = '재설정 세션이 만료되었습니다. 이메일에서 다시 링크를 요청해 주세요.';
          setErrors({ general: friendly });
        } else if (/weak/i.test(msg) || /password.*short/i.test(msg)) {
          friendly = '비밀번호가 너무 약합니다. 더 길고 복잡하게 설정해 주세요.';
          setErrors({ newPassword: friendly });
        } else {
          setErrors({ general: friendly });
        }
        return;
      }

      // 세션 종료 후 로그인 페이지로 이동
      await supabase.auth.signOut();
      setMode('reset-done');

      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch {
      setErrors({ general: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setIsLoading(false);
    }
  }

  // ── 렌더 헬퍼 ────────────────────────────────────────────────────────────────

  const cardContent = () => {
    // 이메일 발송 완료
    if (mode === 'email-sent') {
      return (
        <div className="text-center py-2">
          <div
            className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full"
            style={{ background: 'var(--state-success-bg)' }}
            aria-hidden="true"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--state-success-fg)' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            <strong className="text-text-primary">{email}</strong>으로<br />
            비밀번호 재설정 링크를 발송했습니다.<br />
            이메일을 확인해 주세요.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full min-h-[44px] py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
            style={{ background: 'var(--interactive-primary)' }}
          >
            로그인으로 돌아가기
          </Link>
        </div>
      );
    }

    // 비밀번호 변경 완료
    if (mode === 'reset-done') {
      return (
        <div className="text-center py-2">
          <div
            className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full"
            style={{ background: 'var(--state-success-bg)' }}
            aria-hidden="true"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--state-success-fg)' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">
            비밀번호가 변경되었습니다.<br />
            로그인 페이지로 이동합니다...
          </p>
        </div>
      );
    }

    // 새 비밀번호 입력 폼
    if (mode === 'reset') {
      return (
        <form onSubmit={handleResetPassword} noValidate className="flex flex-col gap-4">
          {errors.general && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{
                background: 'var(--state-danger-bg)',
                border: '1px solid var(--state-danger-border)',
                color: 'var(--state-danger-fg)',
              }}
              role="alert"
            >
              {errors.general}
            </div>
          )}

          <InputField
            id="new-password"
            label="새 비밀번호"
            type="password"
            value={newPassword}
            onChange={(v) => { setNewPassword(v); if (errors.newPassword) setErrors((e) => ({ ...e, newPassword: undefined })); }}
            placeholder="새 비밀번호를 입력하세요 (6자 이상)"
            error={errors.newPassword}
            autoComplete="new-password"
          />

          <InputField
            id="new-password-confirm"
            label="새 비밀번호 확인"
            type="password"
            value={newPasswordConfirm}
            onChange={(v) => { setNewPasswordConfirm(v); if (errors.newPasswordConfirm) setErrors((e) => ({ ...e, newPasswordConfirm: undefined })); }}
            placeholder="비밀번호를 다시 입력하세요"
            error={errors.newPasswordConfirm}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full min-h-[44px] py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
            style={{ background: 'var(--interactive-primary)' }}
            aria-busy={isLoading}
          >
            {isLoading && <LoadingSpinner />}
            {isLoading ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>
      );
    }

    // 기본: 이메일 입력 폼
    return (
      <form onSubmit={handleSendEmail} noValidate className="flex flex-col gap-4">
        {errors.general && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              background: 'var(--state-danger-bg)',
              border: '1px solid var(--state-danger-border)',
              color: 'var(--state-danger-fg)',
            }}
            role="alert"
          >
            {errors.general}
          </div>
        )}

        <InputField
          id="reset-email"
          label="이메일"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
          placeholder="가입한 이메일을 입력하세요"
          error={errors.email}
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full min-h-[44px] py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-opacity focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
          style={{ background: 'var(--interactive-primary)' }}
          aria-busy={isLoading}
        >
          {isLoading && <LoadingSpinner />}
          {isLoading ? '발송 중...' : '재설정 링크 보내기'}
        </button>
      </form>
    );
  };

  // ── 헤더 메타 ────────────────────────────────────────────────────────────────

  const headerMeta = {
    email: { title: '비밀번호 찾기', desc: '가입한 이메일로 비밀번호 재설정 링크를 보내드립니다' },
    'email-sent': { title: '이메일 발송 완료', desc: '' },
    reset: { title: '새 비밀번호 설정', desc: '새로운 비밀번호를 입력해 주세요' },
    'reset-done': { title: '변경 완료', desc: '' },
  }[mode];

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--surface-0)' }}>
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">{headerMeta.title}</h1>
          {headerMeta.desc && (
            <p className="text-sm text-text-secondary">{headerMeta.desc}</p>
          )}
        </div>

        {/* 카드 */}
        <div className="rounded-2xl border border-border-default p-6 shadow-sm" style={{ background: 'var(--surface-1)' }}>
          {cardContent()}
        </div>

        {/* 하단 링크 */}
        {(mode === 'email' || mode === 'reset') && (
          <p className="mt-5 text-center">
            <Link href="/login" className="inline-flex items-center justify-center min-h-[44px] px-3 text-sm font-semibold hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2" style={{ color: 'var(--interactive-primary)' }}>
              ← 로그인으로 돌아가기
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
