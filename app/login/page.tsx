/**
 * @task S1SC1
 * @description Login page
 * Email/password + Google social login.
 * Uses design system Tailwind tokens.
 */

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithGoogle, signInWithPassword, sendPasswordResetEmail } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const isLoading = loadingGoogle || loadingPassword

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }
    try {
      setLoadingPassword(true)
      await signInWithPassword(email.trim(), password)
      router.replace('/home')
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? ''
      if (msg.includes('invalid') || msg.includes('not found')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else if (msg.includes('not confirmed') || msg.includes('email')) {
        setError('이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.')
      } else {
        setError('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true)
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      setError('Google 로그인에 실패했습니다. 다시 시도해 주세요.')
      setLoadingGoogle(false)
    }
  }

  const handleForgotPassword = async () => {
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.')
      return
    }
    try {
      await sendPasswordResetEmail(email.trim())
      setInfo('비밀번호 재설정 이메일을 발송했습니다. 메일함을 확인해 주세요.')
    } catch {
      setError('재설정 이메일 발송에 실패했습니다.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-base px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block text-primary text-xl font-extrabold tracking-tight mb-4 hover:opacity-80 transition-opacity">CoCoBot</a>
          <h1 className="text-2xl font-bold text-text-primary mb-2">로그인</h1>
          <p className="text-sm text-text-secondary">
            이메일 또는 Google 계정으로 로그인하세요
          </p>
        </div>

        {/* Error / Info message */}
        {error && (
          <div className="mb-4 rounded-lg bg-error-subtle border border-error-border px-4 py-3">
            <p className="text-sm text-error-text">{error}</p>
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg bg-success/10 border border-success/20 px-4 py-3">
            <p className="text-sm text-success">{info}</p>
          </div>
        )}

        {/* Email / Password form */}
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-text-secondary">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-bg-subtle border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-text-secondary">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="비밀번호"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-bg-subtle border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-busy={loadingPassword}
          >
            {loadingPassword ? '로그인 중...' : '로그인'}
          </button>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-text-tertiary hover:text-text-secondary self-end underline-offset-2 hover:underline"
          >
            비밀번호를 잊으셨나요?
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border-default" />
          <span className="text-xs text-text-tertiary">또는</span>
          <div className="flex-1 h-px bg-border-default" />
        </div>

        {/* Social login buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-lg bg-white border border-border-default text-text-primary text-sm font-medium hover:bg-bg-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            aria-busy={loadingGoogle}
          >
            {loadingGoogle ? <LoadingSpinner /> : <GoogleIcon />}
            {loadingGoogle ? '로그인 중...' : 'Google로 로그인'}
          </button>
        </div>

        {/* Signup link */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            회원가입
          </Link>
        </p>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-text-tertiary" style={{ whiteSpace: 'nowrap' }}>
          로그인하면 <a href="/terms" className="underline hover:text-text-secondary">이용약관</a> 및 <a href="/privacy" className="underline hover:text-text-secondary">개인정보처리방침</a>에 동의한 것으로 간주합니다.
        </p>
      </div>
    </main>
  )
}

// ── Icon components ──────────────────────────────────────────────

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

function LoadingSpinner({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4" />
      <path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
