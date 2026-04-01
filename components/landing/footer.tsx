/**
 * @task S2FE4 - Landing 페이지 React 전환
 * @component LandingFooter
 * @description 랜딩 페이지 푸터 — 링크 + 저작권 + SNS
 */

import Link from 'next/link';

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
      { label: '요금제', href: '#pricing' },
      { label: '데모 체험', href: '#demo' },
      { label: '템플릿', href: '/templates' },
    ],
  },
  {
    title: '회사',
    links: [
      { label: '소개', href: '/about' },
      { label: '블로그', href: '/blog' },
      { label: '채용', href: '/careers' },
      { label: '문의', href: '/contact' },
    ],
  },
  {
    title: '지원',
    links: [
      { label: '도움말 센터', href: '/help' },
      { label: '개발자 API', href: '/api-docs', external: true },
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '이용약관', href: '/terms' },
    ],
  },
];

/**
 * LandingFooter
 * - 4열 레이아웃 (로고+소개 / 서비스 / 회사 / 지원)
 * - 모바일: 2열 → 1열
 */
export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-bg-subtle">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* 브랜드 컬럼 */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-block text-xl font-bold text-primary"
              aria-label="My Chatbot World 홈"
            >
              MCW
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              코딩 없이 5분 만에 나만의 AI 챗봇을 만드는 플랫폼.
              비즈니스 성장을 AI로 가속하세요.
            </p>

            {/* SNS 링크 */}
            <div className="mt-5 flex gap-3">
              {[
                { label: '트위터', href: 'https://twitter.com', icon: 'X' },
                { label: '인스타그램', href: 'https://instagram.com', icon: 'IG' },
                { label: '유튜브', href: 'https://youtube.com', icon: 'YT' },
              ].map((sns) => (
                <a
                  key={sns.label}
                  href={sns.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={sns.label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-xs font-bold text-text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {sns.icon}
                </a>
              ))}
            </div>
          </div>

          {/* 링크 그룹 */}
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-text-primary">
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
                        className="text-sm text-text-secondary transition-colors hover:text-primary"
                      >
                        {link.label}
                        <span className="ml-1 text-xs" aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-text-secondary transition-colors hover:text-primary"
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
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-text-muted">
            &copy; {currentYear} My Chatbot World. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <span>Made with</span>
            <span className="text-error">♥</span>
            <span>in Korea</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
