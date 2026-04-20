/**
 * @task S2FE6 - Guest 모드 React 전환
 * @description 게스트 페이지 상단 배너 — "5분 만에 내 코코봇 만들기" CTA
 *
 * - 비로그인 사용자를 위한 퍼블릭 헤더
 * - 로고 + 브랜드명 (좌측)
 * - CTA 버튼 "지금 시작하기 →" → /create (우측)
 * - 모바일 반응형 (모바일에서 CTA 텍스트 단축)
 */

'use client';

import Link from 'next/link';
import clsx from 'clsx';

/** GuestHeader Props */
interface GuestHeaderProps {
  /** 남은 대화 횟수 (0~10). undefined 이면 표시 안 함 */
  remainingCount?: number;
}

/**
 * GuestHeader — 게스트 모드 상단 배너
 *
 * @example
 * <GuestHeader remainingCount={7} />
 */
export function GuestHeader({ remainingCount }: GuestHeaderProps) {
  const showCounter = remainingCount !== undefined;

  return (
    <header
      className={clsx(
        'w-full shrink-0',
        'flex items-center justify-between',
        'px-4 sm:px-6 h-14',
        'bg-surface border-b border-border',
        'sticky top-0 z-40',
      )}
    >
      {/* Left: Logo + Brand */}
      <div className="flex items-center gap-2">
        {/* Bot icon mark */}
        <div
          className={clsx(
            'flex items-center justify-center',
            'w-8 h-8 rounded-lg',
            'bg-primary text-white',
            'text-sm font-bold select-none',
          )}
          aria-hidden="true"
        >
          MC
        </div>
        <span className="text-sm font-semibold text-text-primary tracking-tight hidden sm:inline">
          코코봇
        </span>
      </div>

      {/* Center: remaining count badge (mobile only area) */}
      {showCounter && (
        <div className="flex items-center gap-1.5 sm:hidden">
          <span className="text-xs text-text-muted">
            남은 횟수
          </span>
          <span
            className={clsx(
              'inline-flex items-center justify-center',
              'min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
              remainingCount <= 3
                ? 'bg-error/15 text-error'
                : 'bg-primary/15 text-primary',
            )}
          >
            {remainingCount}
          </span>
        </div>
      )}

      {/* Right: counter (desktop) + CTA */}
      <div className="flex items-center gap-3">
        {/* Desktop remaining count */}
        {showCounter && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs text-text-secondary">
              무료 체험
            </span>
            <span
              className={clsx(
                'inline-flex items-center justify-center',
                'min-w-[22px] h-5 px-1.5 rounded-full text-xs font-semibold',
                remainingCount <= 3
                  ? 'bg-error/15 text-error'
                  : 'bg-primary/15 text-primary',
              )}
            >
              {remainingCount}/10
            </span>
          </div>
        )}

        {/* CTA Button */}
        <Link
          href="/create"
          className={clsx(
            'inline-flex items-center justify-center gap-1',
            'h-8 px-3 sm:px-4 rounded-lg',
            'bg-primary text-white text-xs sm:text-sm font-medium',
            'hover:bg-primary-hover transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'whitespace-nowrap select-none',
          )}
        >
          {/* Mobile: short text */}
          <span className="sm:hidden">시작하기</span>
          {/* Desktop: full text */}
          <span className="hidden sm:inline">5분 만에 내 코코봇 만들기</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
