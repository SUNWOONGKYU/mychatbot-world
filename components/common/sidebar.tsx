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

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: '내 챗봇',
    items: [
      { label: '홈',          href: '/home',             icon: '🏠' },
      { label: '봇 만들기',   href: '/create',           icon: '＋' },
      { label: '마이페이지',  href: '/mypage',           icon: '👤' },
    ],
  },
  {
    title: '서비스',
    items: [
      { label: '스킬 마켓',   href: '/skills',           icon: '🧩' },
      { label: '마켓플레이스', href: '/marketplace',      icon: '🛒' },
      { label: '커뮤니티',    href: '/community',         icon: '💬' },
      { label: '구인구직',    href: '/jobs',              icon: '💼' },
      { label: '학습',        href: '/learning',          icon: '📖' },
    ],
  },
  {
    title: '비즈니스',
    items: [
      { label: '비즈니스',    href: '/business',          icon: '📊' },
      { label: '상속',        href: '/mypage/inheritance', icon: '🔗' },
    ],
  },
  {
    title: '관리',
    items: [
      { label: '설정',        href: '/settings',          icon: '⚙' },
      { label: '게스트 모드',  href: '/guest',            icon: '👋' },
    ],
  },
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
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className={clsx(idx > 0 && 'mt-4 pt-3 border-t border-border')}>
            {section.title && (
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
