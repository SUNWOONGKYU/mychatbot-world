/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component MarketingGNB
 * @description 랜딩 전용 마케팅 상단바 — app Navbar와 별도
 *              CoCoBot 로고 + 스킬스토어/가격/커뮤니티/블로그 + 로그인/무료시작
 *              P4 와이어프레임 SECTION 0 (마케팅 상단 GNB) 기준
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  useEffect(() => {
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
          ? 'rgb(var(--bg-muted) / 0.95)'
          : 'rgb(var(--bg-muted))',
        borderBottom: scrolled
          ? '1px solid rgb(var(--border))'
          : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6"
        aria-label="마케팅 메인 내비게이션"
      >
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight"
          style={{ color: 'rgb(var(--color-primary))' }}
          aria-label="CoCoBot 홈"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-400)))',
            }}
          >
            M
          </span>
          <span>CoCoBot</span>
        </Link>

        {/* 데스크탑 내비 */}
        <ul className="hidden items-center gap-7 text-sm font-medium sm:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="transition-colors"
                style={{ color: 'rgb(var(--text-secondary))' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--text-primary))';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--text-secondary))';
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA 영역 */}
        <div className="hidden items-center gap-3 sm:flex">
          {isLoggedIn ? (
            <Link
              href="/home"
              className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-400)))',
              }}
            >
              대시보드
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium transition-colors"
                style={{ color: 'rgb(var(--text-secondary))' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--text-primary))';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--text-secondary))';
                }}
              >
                로그인
              </Link>
              <Link
                href="/create"
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-400)))',
                  boxShadow: '0 4px 12px rgb(var(--primary-500) / 0.35)',
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
              style={{ background: 'rgb(var(--primary-500))' }}
            >
              시작하기
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
            style={{
              background: 'rgb(var(--bg-surface))',
              borderColor: 'rgb(var(--border))',
              color: 'rgb(var(--text-secondary))',
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
            background: 'rgb(var(--bg-muted))',
            borderColor: 'rgb(var(--border))',
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
                    color: 'rgb(var(--text-secondary))',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgb(var(--bg-surface))';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--text-primary))';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--text-secondary))';
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {!isLoggedIn && (
            <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgb(var(--border))' }}>
              <Link
                href="/login"
                className="block rounded-lg px-4 py-2.5 text-center text-sm font-medium"
                style={{ color: 'rgb(var(--text-secondary))' }}
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
