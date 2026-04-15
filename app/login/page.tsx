/**
 * @task S1SC1
 * @description Login page
 * Social login buttons for Google and Kakao.
 * Uses design system Tailwind tokens (bg-bg-base, text-text-primary, etc.)
 */

'use client'

import { useState } from 'react'
import { signInWithGoogle, signInWithKakao } from '@/lib/auth'

export default function LoginPage() {
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingKakao, setLoadingKakao] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true)
      setError(null)
      await signInWithGoogle()
      // Page will redirect automatically via OAuth flow
    } catch (err) {
      setError('Google 로그인에 실패했습니다. 다시 시도해 주세요.')
      setLoadingGoogle(false)
    }
  }

  const handleKakaoLogin = async () => {
    try {
      setLoadingKakao(true)
      setError(null)
      await signInWithKakao()
      // Page will redirect automatically via OAuth flow
    } catch (err) {
      setError('카카오 로그인에 실패했습니다. 다시 시도해 주세요.')
      setLoadingKakao(false)
    }
  }

  const isLoading = loadingGoogle || loadingKakao

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block text-primary text-xl font-extrabold tracking-tight mb-4 hover:opacity-80 transition-opacity">CoCoBot World</a>
          <h1 className="text-2xl font-bold text-text-primary mb-2">로그인</h1>
          <p className="text-sm text-text-secondary">
            소셜 계정으로 빠르게 시작하세요
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg bg-error-subtle border border-error-border px-4 py-3">
            <p className="text-sm text-error-text">{error}</p>
          </div>
        )}

        {/* Social login buttons */}
        <div className="flex flex-col gap-3">
          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="
              flex items-center justify-center gap-3
              w-full h-12 rounded-lg
              bg-white border border-border-default
              text-text-primary text-sm font-medium
              hover:bg-bg-subtle
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
            "
            aria-busy={loadingGoogle}
          >
            {loadingGoogle ? (
              <LoadingSpinner />
            ) : (
              <GoogleIcon />
            )}
            {loadingGoogle ? '로그인 중...' : 'Google로 로그인'}
          </button>

          {/* Kakao Login */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={isLoading}
            className="
              flex items-center justify-center gap-3
              w-full h-12 rounded-lg
              text-[#191919] text-sm font-medium
              hover:brightness-95
              focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
            "
            style={{ backgroundColor: '#FEE500' }}
            aria-busy={loadingKakao}
          >
            {loadingKakao ? (
              <LoadingSpinner color="#191919" />
            ) : (
              <KakaoIcon />
            )}
            {loadingKakao ? '로그인 중...' : '카카오로 로그인'}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-text-tertiary" style={{ whiteSpace: 'nowrap' }}>
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
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1C4.582 1 1 3.79 1 7.21c0 2.143 1.352 4.026 3.397 5.115L3.554 15.5a.25.25 0 0 0 .367.277L7.96 13.35A10.4 10.4 0 0 0 9 13.42c4.418 0 8-2.79 8-6.21S13.418 1 9 1z"
        fill="#191919"
      />
    </svg>
  )
}

function LoadingSpinner({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
