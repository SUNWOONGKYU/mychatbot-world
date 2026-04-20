// @task S1FE1 - 공통 레이아웃 + 사이드바 컴포넌트 (React)
'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MobileNav } from '@/components/common/mobile-nav';
import clsx from 'clsx';

/**
 * Header — 상단 헤더 바
 * - 모바일: MobileNav 햄버거 + 타이틀
 * - 데스크탑: 타이틀 "코코봇"
 * - 우측: ThemeToggle + 유저 아바타 placeholder
 * - 고정 높이 h-header, bg-surface, border-b border-border
 */
export function Header() {
  return (
    <header
      className={clsx(
        'flex items-center justify-between',
        'h-header px-4 shrink-0',
        'bg-surface border-b border-border',
        'sticky top-0 z-30',
      )}
    >
      {/* Left: mobile hamburger + title */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — visible only on mobile */}
        <MobileNav />

        {/* Title — always visible on desktop, hidden on mobile if hamburger takes space */}
        <h1 className="text-base font-semibold text-text-primary tracking-tight hidden md:block select-none">
          코코봇
        </h1>

        {/* Mobile title (shown next to hamburger) */}
        <h1 className="text-base font-semibold text-text-primary tracking-tight md:hidden select-none">
          코코봇
        </h1>
      </div>

      {/* Right: ThemeToggle + avatar */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* User avatar placeholder */}
        <div
          className={clsx(
            'flex items-center justify-center',
            'w-8 h-8 rounded-full shrink-0',
            'bg-primary/20 text-primary',
            'text-sm font-semibold',
            'cursor-pointer select-none',
            'hover:bg-primary/30 transition-colors',
          )}
          aria-label="사용자 메뉴"
          role="button"
          tabIndex={0}
        >
          U
        </div>
      </div>
    </header>
  );
}
