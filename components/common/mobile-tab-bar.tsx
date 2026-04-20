// @task S5FE2 - 네비게이션 컴포넌트 재구축 (상단바 4대 메뉴 + 모바일 하단 탭바)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// 모바일 하단 탭바 4개 탭 (P1 설계: Home/Birth/Skills/Community)
const TAB_ITEMS = [
  {
    label: 'Home',
    href: '/home',
    icon: HomeIcon,
  },
  {
    label: 'Birth',
    href: '/create',
    icon: BirthIcon,
  },
  {
    label: 'Skills',
    href: '/skills',
    icon: SkillsIcon,
  },
  {
    label: 'Community',
    href: '/community',
    icon: CommunityIcon,
  },
] as const;

// 마케팅 / 어드민 경로에서는 탭바 숨김
const HIDDEN_PATHS = ['/', '/pricing', '/store', '/blog', '/about', '/login', '/signup', '/guest'];

function isHiddenPath(pathname: string): boolean {
  return HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith('/blog/'));
}

/**
 * MobileTabBar — 모바일 하단 탭 네비게이션 (~ md 미만에서만 표시)
 *
 * 설계 기준: P1 설계 4탭 (Home/Birth/Skills/Community)
 * - 터치 타겟 최소 48px 높이 준수
 * - 활성 탭: 퍼플 (#5E4BFF) 아이콘 + 라벨
 * - md 이상에서는 `hidden` 처리
 * - Safe Area 처리 (iOS 노치/홈 버튼 고려)
 */
export function MobileTabBar() {
  const pathname = usePathname();

  // 숨김 페이지에서는 렌더링 안 함
  if (!pathname || isHiddenPath(pathname) || pathname.startsWith('/admin')) return null;

  return (
    <nav
      className={clsx(
        'md:hidden',                   // 데스크탑에서 숨김
        'fixed bottom-0 left-0 right-0 z-40',
        'flex items-stretch',
        'bg-surface border-t border-border',
      )}
      aria-label="모바일 하단 메뉴"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TAB_ITEMS.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(tab.href + '/');
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5',
              'min-h-[48px] py-2',    // 터치 타겟 48px 이상
              'text-[11px] font-medium select-none',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:bg-primary/5',
              isActive
                ? 'text-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            <span
              className={clsx(
                'w-6 h-6 flex items-center justify-center',
                isActive && 'scale-110 transition-transform duration-150',
              )}
              aria-hidden="true"
            >
              <Icon active={isActive} />
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ───────── 탭 아이콘 컴포넌트들 ───────── */

interface IconProps {
  active: boolean;
}

function HomeIcon({ active }: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BirthIcon({ active }: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function SkillsIcon({ active }: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function CommunityIcon({ active }: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
