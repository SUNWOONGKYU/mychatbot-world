/**
 * @task S7FE5 - P0 첫인상 페이지 리디자인
 * @component MarketingGNB
 * @description 랜딩 전용 마케팅 상단바 — semantic 토큰 + A11y 개선
 *              MCW 로고 + 스킬스토어/가격/커뮤니티/블로그 + 로그인/무료시작
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface MarketingGNBProps {
  isLoggedIn?: boolean;
}

const NAV_LINKS = [
  { label: '스킬스토어', href: '/skills' },
  { label: '가격', href: '#pricing' },
  { label: '커뮤니티', href: '/community' },
  { label: '블로그', href: '/blog' },
];

export function MarketingGNB({ isLoggedIn = false }: MarketingGNBProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'color-mix(in oklch, var(--surface-0) 95%, transparent)'
          : 'var(--surface-0)',
        borderBottom: scrolled
          ? '1px solid var(--border-subtle)'
          : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6"
        aria-label="마케팅 메인 내비게이션"
      >
        {/* 로고 — 행성 모티프 (세상에 태어난다) */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-xl font-extrabold tracking-tight"
          style={{ color: 'var(--interactive-primary)' }}
          aria-label="CoCoBot World 홈"
        >
          {/* 로고 마크 — 그라디언트 원 + 궤도 점 */}
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-transform group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, oklch(0.55 0.27 285), oklch(0.72 0.22 50))',
              boxShadow: '0 4px 12px color-mix(in oklch, oklch(0.55 0.27 285) 40%, transparent)',
            }}
            aria-hidden="true"
          >
            {/* 중앙 원 (얼굴) */}
            <span
              className="h-4 w-4 rounded-full"
              style={{
                background: 'white',
                boxShadow: 'inset 0 -2px 4px color-mix(in oklch, oklch(0.55 0.27 285) 20%, transparent)',
              }}
            />
            {/* 궤도 위성 점 */}
            <span
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
              style={{
                background: 'oklch(0.85 0.18 85)',
                boxShadow: '0 0 8px oklch(0.85 0.18 85)',
              }}
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tight">CoCoBot</span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'var(--text-secondary)' }}
            >
              World
            </span>
          </span>
        </Link>

        {/* 데스크탑 내비 */}
        <ul className="hidden items-center gap-7 text-sm font-medium sm:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA 영역 */}
        <div className="hidden items-center gap-3 sm:flex">
          {/* 테마 토글 (Light/Dark) */}
          {mounted && (
            <button
              type="button"
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-colors"
              style={{
                background: 'var(--surface-1)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {theme === 'dark' ? '☀' : '☽'}
            </button>
          )}
          {isLoggedIn ? (
            <Link
              href="/home"
              className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, var(--interactive-primary), var(--accent-primary))',
              }}
            >
              대시보드
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
                }}
              >
                로그인
              </Link>
              <Link
                href="/create"
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, var(--interactive-primary), var(--accent-primary))',
                  boxShadow: '0 4px 12px color-mix(in oklch, var(--interactive-primary) 35%, transparent)',
                }}
              >
                무료로 시작하기
              </Link>
            </>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <div className="flex items-center gap-3 sm:hidden">
          {!isLoggedIn && (
            <Link
              href="/create"
              className="rounded-lg px-4 py-2 text-sm font-bold text-white"
              style={{ background: 'var(--interactive-primary)' }}
            >
              시작하기
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
            style={{
              background: 'var(--surface-1)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            aria-label="메뉴 열기"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div
          className="border-t px-4 pb-5 pt-3 sm:hidden"
          style={{
            background: 'var(--surface-0)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface-1)';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {!isLoggedIn && (
            <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <Link
                href="/login"
                className="block rounded-lg px-4 py-2.5 text-center text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                로그인
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
