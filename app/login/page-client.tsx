/**
 * @task S7FE5 - P0 첫인상 페이지 리디자인
 * @modified-by S11FE10 (2026-04-21): 모바일 터치타겟 44px + Suspense 분리 + field-level aria
 * @description Login client component — S7 Semantic token 기반 리디자인
 * Google 소셜 로그인 + 이메일/비밀번호 (카카오 제거)
 * S7FE2 Field primitive 패턴 + state.danger.* 에러 토큰
 *
 * useSearchParams()를 Suspense boundary 안에서 안전하게 사용하기 위해
 * page.tsx의 서버 컴포넌트 래퍼와 분리되었다.
 */

'use client'

import { useState, useId, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmail, signInWithGoogle } from '@/lib/auth'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailId = useId()
  const passwordId = useId()
  const emailErrorId = useId()
  const passwordErrorId = useId()
  const generalErrorId = useId()
  const confirmedNoticeId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 필드별 에러 상태 — 스크린리더가 이메일·비밀번호 오류를 각각 구분하도록
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null)
  const [passwordFieldError, setPasswordFieldError] = useState<string | null>(null)

  // 이메일 인증 완료 후 /auth/callback에서 /login?confirmed=1 로 리다이렉트됨
  const [confirmedNotice, setConfirmedNotice] = useState(false)
  useEffect(() => {
    if (searchParams?.get('confirmed') === '1') setConfirmedNotice(true)
  }, [searchParams])

  const isLoading = loadingEmail || loadingGoogle

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setEmailFieldError(null)
    setPasswordFieldError(null)

    if (!email.trim()) {
      setEmailFieldError('이메일을 입력해 주세요.')
      return
    }
    if (!password) {
      setPasswordFieldError('비밀번호를 입력해 주세요.')
      return
    }

    try {
      setLoadingEmail(true)
      setError(null)
      await signInWithEmail(email, password)
      router.replace('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        setError(msg || '로그인에 실패했습니다. 다시 시도해 주세요.')
      }
      setLoadingEmail(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true)
      setError(null)
      await signInWithGoogle()
      // OAuth flow 자동 리디렉션
    } catch (err) {
      setError('Google 로그인에 실패했습니다. 다시 시도해 주세요.')
      setLoadingGoogle(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-0 px-4 py-8">
      <div className="w-full max-w-sm">

        {/* 로고 / 헤더 */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[44px] text-xl font-extrabold tracking-tight mb-4 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus rounded-lg px-1"
            style={{ color: 'var(--interactive-primary)' }}
            aria-label="CoCoBot 홈으로"
          >
            CoCoBot
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mb-2">로그인</h1>
          <p className="text-sm text-text-secondary">
            나의 코코봇 세계로 입장하세요
          </p>
        </div>

        {/* 이메일 인증 완료 배너 — state.success 토큰 */}
        {confirmedNotice && !error && (
          <div
            id={confirmedNoticeId}
            className="mb-5 rounded-xl px-4 py-3 flex items-start gap-2.5"
            style={{
              background: 'var(--state-success-bg)',
              border: '1px solid var(--state-success-border)',
            }}
            role="status"
            aria-live="polite"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: 'var(--state-success-fg)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--state-success-fg)' }}>
              이메일 인증이 완료되었습니다. 로그인해 주세요.
            </p>
          </div>
        )}

        {/* 에러 배너 — state.danger 토큰 */}
        {error && (
          <div
            id={generalErrorId}
            className="mb-5 rounded-xl px-4 py-3 flex items-start gap-2.5"
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
              {error}
            </p>
          </div>
        )}

        {/* Google 소셜 로그인 — 최우선 위계 */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: 'var(--surface-2)',
              border: '1.5px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
            aria-label="Google 계정으로 로그인"
            aria-busy={loadingGoogle}
          >
            {loadingGoogle ? (
              <LoadingSpinner />
            ) : (
              <GoogleIcon />
            )}
            {loadingGoogle ? '로그인 중...' : 'Google로 계속하기'}
          </button>
        </div>

        {/* 구분선 */}
        <div className="mb-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs text-text-tertiary font-medium">이메일로 로그인</span>
          <span className="h-px flex-1 bg-border-subtle" />
        </div>

        {/* 이메일/비밀번호 폼 */}
        <form onSubmit={handleEmailLogin} noValidate className="flex flex-col gap-4">

          {/* 이메일 필드 */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={emailId}
              className="text-sm font-medium text-text-secondary"
            >
              이메일
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailFieldError) setEmailFieldError(null) }}
              placeholder="이메일 주소를 입력하세요"
              autoComplete="email"
              disabled={isLoading}
              aria-describedby={emailFieldError ? emailErrorId : error ? generalErrorId : undefined}
              aria-invalid={!!emailFieldError}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[color:var(--interactive-primary)]"
              style={{
                background: 'var(--surface-1)',
                border: emailFieldError ? '1.5px solid var(--state-danger-border)' : '1.5px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            {emailFieldError && (
              <p id={emailErrorId} className="text-xs font-medium" style={{ color: 'var(--state-danger-fg)' }} role="alert">
                {emailFieldError}
              </p>
            )}
          </div>

          {/* 비밀번호 필드 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor={passwordId}
                className="text-sm font-medium text-text-secondary"
              >
                비밀번호
              </label>
              <Link
                href="/reset-password"
                className="inline-flex items-center min-h-[44px] px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus rounded"
                style={{ color: 'var(--text-link)' }}
              >
                비밀번호 찾기
              </Link>
            </div>
            <input
              id={passwordId}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (passwordFieldError) setPasswordFieldError(null) }}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              disabled={isLoading}
              aria-describedby={passwordFieldError ? passwordErrorId : error ? generalErrorId : undefined}
              aria-invalid={!!passwordFieldError}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[color:var(--interactive-primary)]"
              style={{
                background: 'var(--surface-1)',
                border: passwordFieldError ? '1.5px solid var(--state-danger-border)' : '1.5px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            {passwordFieldError && (
              <p id={passwordErrorId} className="text-xs font-medium" style={{ color: 'var(--state-danger-fg)' }} role="alert">
                {passwordFieldError}
              </p>
            )}
          </div>

          {/* 로그인 버튼 — Primary CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 w-full h-12 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2"
            style={{ background: 'var(--interactive-primary)' }}
            aria-busy={loadingEmail}
          >
            {loadingEmail ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner />
                로그인 중...
              </span>
            ) : '로그인'}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            계정이 없으신가요?{' '}
            <Link
              href="/signup"
              className="inline-flex items-center min-h-[44px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus rounded"
              style={{ color: 'var(--interactive-primary)' }}
            >
              회원가입
            </Link>
          </p>
        </div>

        {/* 법적 동의 */}
        <p className="mt-6 text-center text-xs text-text-tertiary [word-break:keep-all]">
          로그인하면{' '}
          <Link href="/terms" className="underline hover:text-text-secondary transition-colors">이용약관</Link>
          {' '}및{' '}
          <Link href="/privacy" className="underline hover:text-text-secondary transition-colors">개인정보처리방침</Link>
          에 동의한 것으로 간주합니다.
        </p>
      </div>
    </main>
  )
}

// ── Icon 컴포넌트 ──────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
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
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
