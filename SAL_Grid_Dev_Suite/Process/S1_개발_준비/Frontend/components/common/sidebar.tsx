// @task S1FE1 - 공통 레이아웃 + 사이드바 컴포넌트 (React)
'use client';

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

interface SidebarProps {
  onLinkClick?: () => void;
}

/**
 * Sidebar — 12-menu 사이드바 (데스크탑 전용, md 이상 표시)
 * active: bg-primary/10 text-primary font-medium
 * inactive: text-text-secondary hover:bg-surface-hover
 */
export function Sidebar({ onLinkClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        'hidden md:flex flex-col',
        'w-sidebar min-h-screen shrink-0',
        'bg-surface border-r border-border',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-header px-5 border-b border-border shrink-0">
        <span className="text-xl font-bold tracking-tight text-primary select-none">
          MCW
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onLinkClick}
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
    </aside>
  );
}