/**
 * @task S4GA1
 * @description 비밀번호 재설정 페이지 — 2단계 흐름
 *
 * Mode 1 (기본): 이메일 입력 → auth.resetPasswordForEmail() → 성공 메시지
 * Mode 2 (복구 링크 클릭 후): URL에 access_token / code 파라미터 감지
 *   → 새 비밀번호 입력 폼 → auth.updateUser() → 로그인 페이지 이동
 *
 * - 공개 페이지 (인증 불필요)
 * - 디자인 토큰(Tailwind) 사용
 */
'use client';




import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        className={[
          'w-full px-3.5 py-2.5 rounded-lg text-sm',
          'bg-bg-subtle border',
          'text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          error ? 'border-error ring-1 ring-error' : 'border-border-default',
        ].join(' ')}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-error" role="alert">
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
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

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

  // ── URL 파라미터 / 해시로 복구 링크 감지 ────────────────────────────────────
  useEffect(() => {
    // Next.js App Router에서는 hash를 직접 읽어야 함
    const hash = window.location.hash;
    const code = searchParams?.get('code');

    const isRecovery =
      hash.includes('type=recovery') ||
      hash.includes('access_token') ||
      !!code;

    if (isRecovery) {
      setMode('reset');
    }

    // Supabase auth 이벤트 리스너 (PASSWORD_RECOVERY)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, searchParams]);

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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
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
        setErrors({ general: error.message || '비밀번호 변경에 실패했습니다.' });
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
            className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-success/10"
            aria-hidden="true"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
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
            className="inline-block w-full py-2.5 rounded-lg text-sm font-semibold text-center
              bg-primary text-white hover:opacity-90 transition-opacity"
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
            className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-success/10"
            aria-hidden="true"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
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
            <div className="px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error" role="alert">
              {errors.general}
            </div>
          )}

          <InputField
            id="new-password"
            label="새 비밀번호"
            type="password"
            value={newPassword}
            onChange={(v: any) => { setNewPassword(v); if (errors.newPassword) setErrors((e: any) => ({ ...e, newPassword: undefined })); }}
            placeholder="새 비밀번호를 입력하세요 (6자 이상)"
            error={errors.newPassword}
            autoComplete="new-password"
          />

          <InputField
            id="new-password-confirm"
            label="새 비밀번호 확인"
            type="password"
            value={newPasswordConfirm}
            onChange={(v: any) => { setNewPasswordConfirm(v); if (errors.newPasswordConfirm) setErrors((e: any) => ({ ...e, newPasswordConfirm: undefined })); }}
            placeholder="비밀번호를 다시 입력하세요"
            error={errors.newPasswordConfirm}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-2.5 rounded-lg text-sm font-semibold
              bg-primary text-white hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-2"
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
          <div className="px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error" role="alert">
            {errors.general}
          </div>
        )}

        <InputField
          id="reset-email"
          label="이메일"
          type="email"
          value={email}
          onChange={(v: any) => { setEmail(v); if (errors.email) setErrors((e: any) => ({ ...e, email: undefined })); }}
          placeholder="가입한 이메일을 입력하세요"
          error={errors.email}
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full py-2.5 rounded-lg text-sm font-semibold
            bg-primary text-white hover:opacity-90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-opacity focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2"
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
    <main className="min-h-screen flex items-center justify-center bg-bg-base px-4 py-8">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">{headerMeta.title}</h1>
          {headerMeta.desc && (
            <p className="text-sm text-text-secondary">{headerMeta.desc}</p>
          )}
        </div>

        {/* 카드 */}
        <div className="bg-surface rounded-2xl border border-border-default p-6 shadow-sm">
          {cardContent()}
        </div>

        {/* 하단 링크 */}
        {(mode === 'email' || mode === 'reset') && (
          <p className="mt-5 text-center">
            <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
              ← 로그인으로 돌아가기
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
