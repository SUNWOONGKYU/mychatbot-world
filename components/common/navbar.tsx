// @task S5FE2 - 네비게이션 컴포넌트 재구축 (상단바 4대 메뉴 + 모바일 하단 탭바)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

// 5대 메뉴 (Birth/Skills/Jobs/Community/My Page)
const NAV_ITEMS = [
  { label: 'Birth',     labelKo: '탄생',       href: '/create',    icon: '🐣' },
  { label: 'Skills',    labelKo: '스킬장터',    href: '/skills',    icon: '🔧' },
  { label: 'Jobs',      labelKo: '구봇구직',    href: '/jobs',      icon: '💼' },
  { label: 'Community', labelKo: '봇카페',      href: '/community', icon: '🤝' },
  { label: 'My Page',   labelKo: '마이페이지',  href: '/mypage',    icon: '👤' },
] as const;

// 마케팅 페이지 목록 — 이 경로는 별도 레이아웃 사용
const MARKETING_PATHS = ['/', '/pricing', '/store', '/blog', '/about', '/login', '/signup', '/guest'];

function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.some((p) => pathname === p || pathname.startsWith('/blog/'));
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Navbar — MCW 앱 내부 상단 네비게이션 바
 *
 * 구조: [MCW 로고] [4대 메뉴: Birth/Skills/Jobs/Community] [알림벨] [프로필→/mypage] [로그인/무료시작]
 * - 스크롤 시 배경 블러 처리
 * - 활성 메뉴 pathname 기반 하이라이트 (퍼플)
 * - 랜딩(/) · 마케팅 · 로그인 · 어드민 페이지는 Navbar 숨김
 * - CSS 변수 기반 다크/라이트 동시 지원
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // 스크롤 이벤트 — hooks는 조건부 return 이전에 위치해야 함
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 마케팅 / 어드민 페이지는 Navbar 미표시
  if (!pathname) return null;
  if (isMarketingPath(pathname) || isAdminPath(pathname)) return null;

  return (
    <header
      className={clsx(
        'sticky top-0 z-40',
        'flex items-center justify-between',
        'h-16 px-4 md:px-6',
        'border-b transition-all duration-200',
        scrolled
          ? 'bg-surface/80 backdrop-blur-md border-border shadow-sm'
          : 'bg-surface border-border',
      )}
    >
      {/* 로고 */}
      <Link
        href="/dashboard"
        className="flex items-center shrink-0 select-none"
        aria-label="MCW 대시보드로 이동"
      >
        <span className="text-xl font-extrabold tracking-tight text-primary">MCW</span>
      </Link>

      {/* 중앙 4대 메뉴 — 데스크탑(md 이상)에서만 표시 */}
      <nav
        className="hidden md:flex items-center gap-1"
        aria-label="주 메뉴"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'relative flex items-center gap-1.5 px-4 py-2 rounded-lg',
                'text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
              )}
            >
              <span aria-hidden="true" className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
              <span className="text-[11px] text-text-muted">({item.labelKo})</span>
              {/* 활성 하이라이트 언더라인 */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 우측 액션 영역 */}
      <div className="flex items-center gap-2">
        {/* 알림 벨 아이콘 */}
        <button
          type="button"
          aria-label="알림"
          className={clsx(
            'relative w-9 h-9 flex items-center justify-center rounded-lg',
            'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          <BellIcon />
          {/* 미읽음 알림 뱃지 (있을 경우) */}
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger"
          />
        </button>

        {/* 프로필 아이콘 → /mypage */}
        <Link
          href="/mypage"
          aria-label="마이페이지"
          className={clsx(
            'w-9 h-9 flex items-center justify-center rounded-full shrink-0',
            'bg-primary/15 text-primary font-semibold text-sm',
            'hover:bg-primary/25 transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          <UserIcon />
        </Link>

        {/* 로그인/무료시작 CTA — 비로그인 상태 (간단 처리, 실제 auth 연동 시 교체) */}
        <Link
          href="/signup"
          className={clsx(
            'hidden sm:flex items-center gap-1.5',
            'px-4 py-2 rounded-lg text-sm font-semibold',
            'bg-primary text-white',
            'hover:bg-primary/90 hover:-translate-y-px hover:shadow-md',
            'active:translate-y-0 active:shadow-none',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          무료로 시작하기
        </Link>
      </div>
    </header>
  );
}

/* ───────── SVG 아이콘 ───────── */

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
