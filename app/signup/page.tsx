/**
 * @task S7FE5 - P0 첫인상 페이지 리디자인
 * @description 회원가입 페이지 — S7 Semantic token 기반 리디자인
 * - useId() + aria-describedby Field 패턴 (S7FE2 준수)
 * - state.danger.* 에러 토큰
 * - 소셜 가입(Google) 상단 배치
 * - 기존 Supabase 비즈니스 로직 100% 보존
 */
'use client';

import { useState, useEffect, useId, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';

// ── Field 컴포넌트 — useId + aria-describedby 자동 연결 ───────────────────
function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const inputId = useId();
  const errorId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
        {label}
        {required && (
          <span className="ml-0.5" style={{ color: 'var(--state-danger-fg)' }} aria-label="필수">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm transition-all focus-visible:outline-none"
        style={{
          background: error ? 'var(--state-danger-bg)' : 'var(--surface-1)',
          border: error
            ? '1.5px solid var(--state-danger-border)'
            : '1.5px solid var(--border-default)',
          color: 'var(--text-primary)',
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = 'var(--interactive-primary)';
            e.target.style.boxShadow = '0 0 0 3px color-mix(in oklch, var(--color-brand-500) 20%, transparent)';
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = 'var(--border-default)';
            e.target.style.boxShadow = 'none';
          }
        }}
      />
      {error && (
        <p
          id={errorId}
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: 'var(--state-danger-fg)' }}
          role="alert"
        >
          <span aria-hidden="true">⚠</span>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

// ── 페이지 컴포넌트 ────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    name?: string;
    password?: string;
    passwordConfirm?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const generalErrorId = useId();

  // 이미 로그인된 경우 홈으로 리디렉션
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [router]);

  // ── 유효성 검사 ───────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = '이메일을 입력해 주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!name.trim()) {
      newErrors.name = '이름(닉네임)을 입력해 주세요.';
    } else if (name.trim().length > 50) {
      newErrors.name = '50자 이내로 입력해 주세요.';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해 주세요.';
    } else if (password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해 주세요.';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── 소셜 가입 (Google) ───────────────────────────────────────────────────
  async function handleGoogleSignup() {
    try {
      setGoogleLoading(true);
      setErrors({});
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      setErrors({ general: 'Google 가입에 실패했습니다. 다시 시도해 주세요.' });
      setGoogleLoading(false);
    }
  }

  // ── 이메일 제출 핸들러 ────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const msg = error.message ?? '';
        if (
          msg.toLowerCase().includes('already registered') ||
          msg.toLowerCase().includes('already exists') ||
          msg.toLowerCase().includes('user already')
        ) {
          setErrors({ email: '이미 가입된 이메일입니다.' });
        } else {
          setErrors({ general: msg || '회원가입에 실패했습니다. 다시 시도해 주세요.' });
        }
        return;
      }

      // Supabase email enumeration 보호: 중복 이메일은 성공처럼 응답하지만
      // identities가 빈 배열로 반환됨 → 중복 계정 판별
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setErrors({ email: '이미 가입된 이메일입니다.' });
        return;
      }

      if (data.session) {
        router.replace('/');
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setErrors({ general: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setIsLoading(false);
    }
  }

  // ── 성공 화면 ─────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface-0 px-4">
        <div className="w-full max-w-sm">
          <div
            className="rounded-2xl p-8 text-center shadow-md"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-default)',
            }}
          >
            {/* 성공 아이콘 */}
            <div
              className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full"
              style={{ background: 'var(--state-success-bg)' }}
              aria-hidden="true"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--state-success-fg)' }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">인증 이메일 발송 완료</h1>
            <p className="text-sm text-text-secondary mb-6 [word-break:keep-all]">
              <strong className="text-text-primary">{email}</strong>으로
              인증 이메일을 발송했습니다.
              <br />
              이메일을 확인하여 가입을 완료해 주세요.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full min-h-[44px] py-2.5 rounded-xl text-sm font-bold text-center text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2"
              style={{ background: 'var(--interactive-primary)' }}
            >
              로그인 페이지로 이동
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── 가입 폼 ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-0 px-4 py-8">
      <div className="w-full max-w-sm">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-xl font-extrabold tracking-tight mb-4 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus rounded-lg px-1"
            style={{ color: 'var(--interactive-primary)' }}
            aria-label="CoCoBot 홈으로"
          >
            CoCoBot
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mb-2">회원가입</h1>
          <p className="text-sm text-text-secondary">나의 코코봇 세계에 오신 것을 환영합니다</p>
        </div>

        {/* 전체 에러 배너 */}
        {errors.general && (
          <div
            id={generalErrorId}
            className="mb-5 px-4 py-3 rounded-xl flex items-start gap-2.5"
            style={{
              background: 'var(--state-danger-bg)',
              border: '1px solid var(--state-danger-border)',
            }}
            role="alert"
            aria-live="assertive"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: 'var(--state-danger-fg)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--state-danger-fg)' }}>
              {errors.general}
            </p>
          </div>
        )}

        {/* Google 소셜 가입 — 최우선 위계 */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading || googleLoading}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: 'var(--surface-2)',
              border: '1.5px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
            aria-label="Google 계정으로 가입"
            aria-busy={googleLoading}
          >
            {googleLoading ? <LoadingSpinner /> : <GoogleIcon />}
            {googleLoading ? '연결 중...' : 'Google로 가입하기'}
          </button>
        </div>

        {/* 구분선 */}
        <div className="mb-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs text-text-tertiary font-medium">이메일로 가입</span>
          <span className="h-px flex-1 bg-border-subtle" />
        </div>

        {/* 이메일 가입 카드 */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Field
              label="이메일"
              type="email"
              value={email}
              onChange={(v) => { setEmail(v); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
              placeholder="이메일 주소를 입력하세요"
              error={errors.email}
              required
              autoComplete="email"
            />

            <Field
              label="이름 (닉네임)"
              value={name}
              onChange={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
              placeholder="표시될 이름을 입력하세요"
              error={errors.name}
              required
              autoComplete="nickname"
            />

            <Field
              label="비밀번호"
              type="password"
              value={password}
              onChange={(v) => { setPassword(v); if (errors.password) setErrors((e) => ({ ...e, password: undefined })); }}
              placeholder="6자 이상 입력하세요"
              error={errors.password}
              required
              autoComplete="new-password"
            />

            <Field
              label="비밀번호 확인"
              type="password"
              value={passwordConfirm}
              onChange={(v) => { setPasswordConfirm(v); if (errors.passwordConfirm) setErrors((e) => ({ ...e, passwordConfirm: undefined })); }}
              placeholder="비밀번호를 다시 입력하세요"
              error={errors.passwordConfirm}
              required
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={isLoading || googleLoading}
              className="mt-1 w-full min-h-[44px] py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2"
              style={{ background: 'var(--interactive-primary)' }}
              aria-busy={isLoading}
            >
              {isLoading && <LoadingSpinner />}
              {isLoading ? '가입 처리 중...' : '가입하기'}
            </button>
          </form>
        </div>

        {/* 하단 링크 */}
        <p className="mt-5 text-center text-sm text-text-secondary">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/login"
            className="inline-flex items-center min-h-[44px] px-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus rounded"
            style={{ color: 'var(--interactive-primary)' }}
          >
            로그인
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] px-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus rounded"
          >
            ← 홈으로 돌아가기
          </Link>
        </p>

        {/* 법적 동의 — 가입 시 암묵적 동의 (로그인 페이지와 동일 패턴) */}
        <p className="mt-6 text-center text-xs text-text-tertiary [word-break:keep-all]">
          가입하면{' '}
          <Link href="/terms" className="underline hover:text-text-secondary transition-colors">이용약관</Link>
          {' '}및{' '}
          <Link href="/privacy" className="underline hover:text-text-secondary transition-colors">개인정보처리방침</Link>
          에 동의한 것으로 간주합니다.
        </p>
      </div>
    </main>
  );
}
