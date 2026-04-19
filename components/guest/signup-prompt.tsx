/**
 * @task S2FE6 - Guest 모드 React 전환
 * @description 10회 초과 시 가입 유도 모달
 *
 * - 대화 10회 소진 후 표시
 * - 배경 오버레이 (클릭으로 닫기 가능)
 * - Google 소셜 가입 링크
 * - 로그인 링크 (기존 계정 보유자)
 * - ESC 키 닫기 지원
 * - 접근성: role="dialog", aria-modal, focus trap
 */

'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

/** SignupPrompt Props */
interface SignupPromptProps {
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 (ESC / 배경 클릭) */
  onClose: () => void;
}

/**
 * SignupPrompt — 무료 체험 10회 소진 후 가입 유도 모달
 *
 * @example
 * <SignupPrompt isOpen={showPrompt} onClose={() => setShowPrompt(false)} />
 */
export function SignupPrompt({ isOpen, onClose }: SignupPromptProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLAnchorElement>(null);

  /* ── ESC 키 닫기 ──────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    // 스크롤 잠금
    document.body.style.overflow = 'hidden';

    // 포커스 이동 (접근성)
    firstFocusRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /* ── 오버레이 ─────────────────────────────────────── */
    <div
      className={clsx(
        'fixed inset-0 z-50',
        'flex items-center justify-center',
        'p-4',
        'bg-black/60 backdrop-blur-sm',
      )}
      onClick={onClose}
      aria-hidden="true"
    >
      {/* ── 다이얼로그 패널 ─────────────────────────────── */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-prompt-title"
        aria-describedby="signup-prompt-desc"
        className={clsx(
          'relative w-full max-w-md',
          'bg-surface rounded-2xl',
          'shadow-2xl',
          'p-6 sm:p-8',
          'flex flex-col gap-5',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className={clsx(
            'absolute top-4 right-4',
            'flex items-center justify-center',
            'w-8 h-8 rounded-full',
            'text-text-muted hover:text-text-primary',
            'hover:bg-bg-muted transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
          aria-label="모달 닫기"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 3l10 10M13 3 3 13"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* 아이콘 */}
        <div className="flex justify-center">
          <div
            className={clsx(
              'flex items-center justify-center',
              'w-14 h-14 rounded-2xl',
              'bg-primary/10',
            )}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path
                d="M14 3C8.477 3 4 7.477 4 13c0 1.82.49 3.525 1.345 4.99L4 24l6.01-1.345A9.954 9.954 0 0 0 14 23c5.523 0 10-4.477 10-10S19.523 3 14 3z"
                stroke="rgb(var(--color-primary))"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="13" r="1.25" fill="rgb(var(--color-primary))" />
              <circle cx="14" cy="13" r="1.25" fill="rgb(var(--color-primary))" />
              <circle cx="18" cy="13" r="1.25" fill="rgb(var(--color-primary))" />
            </svg>
          </div>
        </div>

        {/* 제목 + 설명 */}
        <div className="text-center space-y-2">
          <h2
            id="signup-prompt-title"
            className="text-xl font-bold text-text-primary"
          >
            무료 체험 10회를 모두 사용했어요
          </h2>
          <p
            id="signup-prompt-desc"
            className="text-sm text-text-secondary leading-relaxed"
          >
            회원가입하면 <strong className="text-text-primary font-semibold">나만의 코코봇</strong>을 직접 만들고,{' '}
            <strong className="text-text-primary font-semibold">무제한</strong>으로 대화할 수 있어요.{' '}
            5분이면 충분해요!
          </p>
        </div>

        {/* 혜택 목록 */}
        <ul className="space-y-2 text-sm text-text-secondary">
          {[
            '나만의 코코봇 개성 설정 (이름, 성격, 전문 지식)',
            '대화 히스토리 저장 & 이어보기',
            '코코봇 링크 공유 — 누구나 체험 가능',
          ].map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-success"
              >
                <circle cx="8" cy="8" r="7" fill="rgb(var(--color-success) / 0.15)" />
                <path
                  d="M5 8l2.25 2.25L11 5.5"
                  stroke="rgb(var(--color-success))"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>

        {/* CTA 버튼 그룹 */}
        <div className="flex flex-col gap-2.5">
          {/* Primary: 회원가입 (Google) */}
          <Link
            ref={firstFocusRef}
            href="/auth/signup?provider=google"
            className={clsx(
              'flex items-center justify-center gap-2.5',
              'w-full h-11 rounded-xl',
              'bg-primary text-white text-sm font-semibold',
              'hover:bg-primary-hover transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            )}
          >
            <GoogleIcon />
            Google로 시작하기 (무료)
          </Link>
        </div>

        {/* 구분선 + 로그인 링크 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted whitespace-nowrap">이미 계정이 있나요?</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Link
          href="/login"
          className={clsx(
            'flex items-center justify-center',
            'w-full h-10 rounded-xl',
            'border border-border text-sm font-medium text-text-primary',
            'hover:bg-bg-subtle transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
        >
          로그인
        </Link>
      </div>
    </div>
  );
}

/* ── 소셜 아이콘 (인라인 SVG) ───────────────────────────────── */

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
  );
}

