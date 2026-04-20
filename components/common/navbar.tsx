// @task S5FE2 - 네비게이션 컴포넌트 재구축 (상단바 4대 메뉴 + 모바일 하단 탭바)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { BrandLogo } from '@/components/common/brand-logo';

// 서비스 4메뉴 — 각 메뉴별 고유 색상 (DESIGN.md 시맨틱 컬러 기반)
const SERVICE_ITEMS = [
  { label: 'Birth',     labelKo: '탄생',     href: '/create',    icon: '🐣', color: '#F59E0B' }, // Amber - 탄생/생성
  { label: 'Skills',    labelKo: '스킬장터',  href: '/skills',    icon: '🔧', color: '#7B6EFF' }, // Purple - 기술/AI
  { label: 'Jobs',      labelKo: '구봇구직',  href: '/jobs',      icon: '💼', color: '#3B82F6' }, // Blue - 비즈니스
  { label: 'Community', labelKo: '봇카페',    href: '/community', icon: '🤝', color: '#10B981' }, // Green - 교류
] as const;

// Navbar 숨김 경로 — 로그인/회원가입/게스트/어드민은 별도 레이아웃
const HIDDEN_PATHS = ['/', '/pricing', '/store', '/blog', '/about', '/login', '/signup', '/guest'];

function isHiddenPath(pathname: string): boolean {
  return HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith('/blog/'));
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
 * - 로그인 · 회원가입 · 게스트 · 어드민 페이지는 Navbar 숨김 (랜딩은 표시)
 * - CSS 변수 기반 다크/라이트 동시 지원
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  // 스크롤 이벤트 — hooks는 조건부 return 이전에 위치해야 함
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 로그인/회원가입/게스트/어드민은 Navbar 미표시
  if (!pathname) return null;
  if (isHiddenPath(pathname) || isAdminPath(pathname)) return null;

  return (
    <header
      className={clsx(
        'sticky top-0 z-40',
        'border-b transition-all duration-200',
        scrolled
          ? 'bg-surface/80 backdrop-blur-md border-border shadow-sm'
          : 'bg-surface border-border',
      )}
    >
      <div className="mx-auto grid h-16 items-center px-4 md:px-6" style={{ maxWidth: '1280px', gridTemplateColumns: '1fr auto 1fr' }}>
      {/* 로고 — CoCoBot 공식 워드마크 */}
      <Link
        href="/"
        className="flex items-center shrink-0 select-none"
        aria-label="메인 화면으로 이동"
      >
        <BrandLogo variant="wordmark" height={28} style={{ color: 'var(--text-primary)' }} />
      </Link>

      {/* 서비스 4메뉴 — 고유 색상 */}
      <nav
        className="items-center gap-1"
        style={{ display: 'flex' }}
        aria-label="주 메뉴"
      >
        {SERVICE_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'relative flex flex-col items-center px-3 py-1.5 rounded-lg',
                'text-xs font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2',
              )}
              style={{
                color: isActive ? item.color : 'rgb(var(--text-secondary))',
                background: isActive
                  ? `color-mix(in oklch, ${item.color} 12%, transparent)`
                  : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = item.color;
                  e.currentTarget.style.background = `color-mix(in oklch, ${item.color} 8%, transparent)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'rgb(var(--text-secondary))';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span className="text-sm font-bold">{item.label}</span>
              <span className="text-[10px]" style={{ opacity: 0.75 }}>{item.labelKo}</span>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 rounded-full"
                  style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 우측 액션 영역 — My Page + 로그인/회원가입 */}
      <div className="flex items-center gap-2 justify-self-end">
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

        {/* My Page — 우측 액션 영역으로 이동 (아이콘 + 라벨) */}
        {(() => {
          const isActive = pathname === '/mypage' || pathname.startsWith('/mypage/');
          return (
            <Link
              href="/mypage"
              aria-current={isActive ? 'page' : undefined}
              aria-label="마이페이지"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                'text-xs font-semibold transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-secondary hover:text-primary hover:bg-primary/10',
              )}
            >
              <UserIcon />
              <span className="hidden md:inline">My Page</span>
            </Link>
          );
        })()}

        {/* 구분선 — My Page와 로그인/회원가입 사이 */}
        <span className="mx-1 h-5 w-px" style={{ background: 'rgb(var(--border))' }} aria-hidden="true" />

        {/* 로그인 버튼 */}
        <Link
          href="/login"
          className={clsx(
            'flex items-center',
            'px-4 py-2 rounded-lg text-sm font-medium',
            'border border-border text-text-primary',
            'hover:bg-surface-hover',
            'transition-all duration-200',
          )}
        >
          로그인
        </Link>

        {/* 회원가입 CTA */}
        <Link
          href="/signup"
          className={clsx(
            'flex items-center',
            'px-4 py-2 rounded-lg text-sm font-semibold',
            'bg-primary text-white',
            'hover:bg-primary/90 hover:-translate-y-px hover:shadow-md',
            'active:translate-y-0 active:shadow-none',
            'transition-all duration-200',
          )}
        >
          회원가입
        </Link>

        {/* 테마 토글 (회원가입 다음) */}
        <button
          type="button"
          aria-label="테마 전환"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          {theme === 'dark' ? '☀' : '☽'}
        </button>
      </div>
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
