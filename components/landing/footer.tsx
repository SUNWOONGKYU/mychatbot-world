/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component LandingFooter
 * @description 랜딩 푸터 — 사이트맵 + 저작권 + 다크/라이트 토글
 *              P4 와이어프레임 FOOTER 기준
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterGroup {
  title: string;
  links: FooterLink[];
}

const FOOTER_GROUPS: FooterGroup[] = [
  {
    title: '서비스',
    links: [
      { label: '챗봇 만들기', href: '/create' },
      { label: '스킬장터', href: '/skills' },
      { label: '구봇구직', href: '/jobs' },
      { label: '게스트 체험', href: '/guest' },
    ],
  },
  {
    title: '커뮤니티',
    links: [
      { label: '봇카페', href: '/community' },
      { label: '갤러리', href: '/community/gallery' },
    ],
  },
  {
    title: '계정',
    links: [
      { label: '마이페이지', href: '/mypage' },
      { label: '로그인', href: '/login' },
      { label: '회원가입', href: '/signup' },
    ],
  },
];

export function LandingFooter() {
  const [isDark, setIsDark] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') || !html.classList.contains('light');
    setIsDark(currentTheme);
  }, []);

  function toggleTheme() {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
    setIsDark(!isDark);
  }

  return (
    <footer
      className="border-t"
      style={{
        background: 'rgb(var(--bg-muted))',
        borderColor: 'rgb(var(--border))',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* 브랜드 컬럼 */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link
              href="/"
              className="inline-block text-2xl font-extrabold tracking-tight"
              style={{ color: 'rgb(var(--color-primary))' }}
              aria-label="My Chatbot World 홈"
            >
              MCW
            </Link>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              AI 챗봇 라이프사이클 플랫폼.
              <br />
              5분 만에 나만의 챗봇을 만들고, 스킬로 강화하고, 수익으로 완성하세요.
            </p>

            {/* SNS 링크 */}
            <div className="mt-6 flex gap-2">
              {[
                { label: 'X (트위터)', href: 'https://twitter.com', abbr: 'X' },
                { label: '인스타그램', href: 'https://instagram.com', abbr: 'IG' },
                { label: '유튜브', href: 'https://youtube.com', abbr: 'YT' },
                { label: '카카오', href: 'https://kakao.com', abbr: 'KK' },
              ].map((sns) => (
                <a
                  key={sns.label}
                  href={sns.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={sns.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-bold transition-all hover:scale-110"
                  style={{
                    background: 'rgb(var(--bg-surface))',
                    borderColor: 'rgb(var(--border))',
                    color: 'rgb(var(--text-secondary))',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgb(var(--color-primary))';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--color-primary))';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgb(var(--border))';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--text-secondary))';
                  }}
                >
                  {sns.abbr}
                </a>
              ))}
            </div>
          </div>

          {/* 링크 그룹 */}
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'rgb(var(--text-primary))' }}
              >
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm transition-colors"
                        style={{ color: 'rgb(var(--text-secondary))' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--color-primary))';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--text-secondary))';
                        }}
                      >
                        {link.label}
                        <span className="ml-1 text-xs opacity-60" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm transition-colors"
                        style={{ color: 'rgb(var(--text-secondary))' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--color-primary))';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.color = 'rgb(var(--text-secondary))';
                        }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 하단 바 */}
        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <p
            className="text-sm"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            &copy; {currentYear} My Chatbot World. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <span
              className="text-xs"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              Made with{' '}
              <span style={{ color: 'rgb(var(--color-error))' }}>♥</span>{' '}
              in Korea
            </span>

            {/* 다크/라이트 토글 */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:border-primary"
              style={{
                background: 'rgb(var(--bg-surface))',
                borderColor: 'rgb(var(--border))',
                color: 'rgb(var(--text-secondary))',
              }}
              aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDark ? (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  라이트 모드
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  다크 모드
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
