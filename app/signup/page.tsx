/**
 * @task S4GA1
 * @description 회원가입 페이지 — email + password 기반 Supabase signUp
 *
 * - 공개 페이지 (인증 불필요)
 * - 이메일, 이름(닉네임), 비밀번호, 비밀번호 확인 입력
 * - Supabase auth.signUp() 호출
 * - 이메일 인증 필요 시 성공 메시지 표시
 * - 이미 로그인된 경우 / 홈으로 리디렉션
 * - 디자인 토큰(Tailwind) 사용
 */
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-secondary">
        {label}
        {required && <span className="ml-0.5 text-error" aria-label="필수">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        className={[
          'w-full px-3.5 py-2.5 rounded-lg text-sm',
          'bg-bg-subtle border',
          'text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
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

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

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

  // 이미 로그인된 경우 홈으로 리디렉션
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [supabase, router]);

  // ── 유효성 검사 ─────────────────────────────────────────────────────────────

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

  // ── 제출 핸들러 ─────────────────────────────────────────────────────────────

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
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
          setErrors({ email: '이미 가입된 이메일입니다.' });
        } else {
          setErrors({ general: msg || '회원가입에 실패했습니다. 다시 시도해 주세요.' });
        }
        return;
      }

      // 세션이 바로 생성된 경우 (이메일 확인 비활성화 환경) → 홈으로 이동
      if (data.session) {
        router.replace('/');
        return;
      }

      // 이메일 인증 필요한 경우
      setIsSuccess(true);
    } catch (err) {
      setErrors({ general: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setIsLoading(false);
    }
  }

  // ── 성공 화면 ────────────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-base px-4">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-2xl border border-border-default p-8 shadow-sm text-center">
            <div
              className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-success/10"
              aria-hidden="true"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">인증 이메일 발송 완료</h1>
            <p className="text-sm text-text-secondary mb-6">
              <strong className="text-text-primary">{email}</strong>으로<br />
              인증 이메일을 발송했습니다.<br />
              이메일을 확인하여 가입을 완료해 주세요.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-lg text-sm font-semibold text-center
                bg-primary text-white hover:opacity-90 transition-opacity"
            >
              로그인 페이지로 이동
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── 가입 폼 ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-base px-4 py-8">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block text-primary text-xl font-extrabold tracking-tight mb-4 hover:opacity-80 transition-opacity">MCW</a>
          <h1 className="text-2xl font-bold text-text-primary mb-2">회원가입</h1>
          <p className="text-sm text-text-secondary">나의 챗봇 세계에 오신 것을 환영합니다</p>
        </div>

        {/* 카드 */}
        <div className="bg-surface rounded-2xl border border-border-default p-6 shadow-sm">
          {/* 전체 에러 배너 */}
          {errors.general && (
            <div
              className="mb-5 px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error"
              role="alert"
            >
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <InputField
              id="email"
              label="이메일"
              type="email"
              value={email}
              onChange={(v: any) => { setEmail(v); if (errors.email) setErrors((e: any) => ({ ...e, email: undefined })); }}
              placeholder="이메일 주소를 입력하세요"
              error={errors.email}
              required
              autoComplete="email"
            />

            <InputField
              id="name"
              label="이름 (닉네임)"
              value={name}
              onChange={(v: any) => { setName(v); if (errors.name) setErrors((e: any) => ({ ...e, name: undefined })); }}
              placeholder="표시될 이름을 입력하세요"
              error={errors.name}
              required
              autoComplete="nickname"
            />

            <InputField
              id="password"
              label="비밀번호"
              type="password"
              value={password}
              onChange={(v: any) => { setPassword(v); if (errors.password) setErrors((e: any) => ({ ...e, password: undefined })); }}
              placeholder="6자 이상 입력하세요"
              error={errors.password}
              required
              autoComplete="new-password"
            />

            <InputField
              id="password-confirm"
              label="비밀번호 확인"
              type="password"
              value={passwordConfirm}
              onChange={(v: any) => { setPasswordConfirm(v); if (errors.passwordConfirm) setErrors((e: any) => ({ ...e, passwordConfirm: undefined })); }}
              placeholder="비밀번호를 다시 입력하세요"
              error={errors.passwordConfirm}
              required
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
              {isLoading ? '가입 처리 중...' : '가입하기'}
            </button>
          </form>
        </div>

        {/* 하단 링크 */}
        <p className="mt-5 text-center text-sm text-text-secondary">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            로그인
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}
