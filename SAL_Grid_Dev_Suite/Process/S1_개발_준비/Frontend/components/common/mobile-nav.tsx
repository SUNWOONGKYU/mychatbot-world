// @task S1FE1 - 공통 레이아웃 + 사이드바 컴포넌트 (React)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: '대시보드',    href: '/dashboard',      icon: '◻' },
  { label: '내 봇',      href: '/bots',            icon: '🤖' },
  { label: '봇 만들기',  href: '/bots/new',        icon: '＋' },
  { label: '대화 기록',  href: '/conversations',   icon: '💬' },
  { label: '지식베이스', href: '/knowledge',       icon: '📚' },
  { label: '페르소나',   href: '/personas',        icon: '🎭' },
  { label: '템플릿',     href: '/templates',       icon: '📋' },
  { label: '연동',       href: '/integrations',    icon: '🔗' },
  { label: '분석',       href: '/analytics',       icon: '📊' },
  { label: '크레딧',     href: '/credits',         icon: '💳' },
  { label: '설정',       href: '/settings',        icon: '⚙' },
  { label: '도움말',     href: '/help',            icon: '❓' },
];

/**
 * MobileNav — 모바일 햄버거 메뉴 + 슬라이드 드로어
 * md 미만에서만 표시 (md:hidden)
 * 링크 클릭 시 드로어 자동 닫힘
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className={clsx(
          'flex items-center justify-center',
          'w-9 h-9 rounded-lg',
          'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        <span className="text-xl leading-none" aria-hidden="true">☰</span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={clsx(
          'fixed top-0 left-0 z-50 h-full',
          'w-[280px] bg-surface border-r border-border',
          'flex flex-col shadow-xl',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="모바일 내비게이션"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between h-header px-5 border-b border-border shrink-0">
          <span className="text-xl font-bold tracking-tight text-primary select-none">
            MCW
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="메뉴 닫기"
            className={clsx(
              'flex items-center justify-center w-9 h-9 rounded-lg',
              'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            <span className="text-xl leading-none" aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'text-sm transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="text-base w-5 text-center leading-none" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}