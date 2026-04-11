/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component HeroSection
 * @description Hero 섹션 — 퍼플→블루 그라데이션 배경 + 이중 CTA + 신뢰 지표
 *              P4 와이어프레임 SECTION 1 기준 구현
 */
'use client';

import Link from 'next/link';

interface HeroSectionProps {
  isLoggedIn?: boolean;
}

export function HeroSection({ isLoggedIn = false }: HeroSectionProps) {
  const primaryHref = isLoggedIn ? '/home' : '/create';
  const primaryLabel = isLoggedIn ? '내 챗봇 관리하기' : '5분 인터뷰로 챗봇 생성하기';

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgb(var(--primary-900)) 0%, rgb(30 27 75) 40%, rgb(23 37 84) 70%, rgb(12 26 69) 100%)',
      }}
    >
      {/* 배경 장식 글로우 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'rgb(var(--primary-400))' }}
        />
        <div
          className="absolute top-1/2 -left-20 h-[350px] w-[350px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'rgb(var(--primary-500))' }}
        />
        <div
          className="absolute -bottom-20 right-1/3 h-[280px] w-[280px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'rgb(var(--amber-400))' }}
        />
        {/* 격자 패턴 */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 pb-0 pt-20 sm:px-6 sm:pt-28 lg:pt-36">
        <div className="text-center">
          <div>
            {/* 배지 */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="font-medium">AI 챗봇 라이프사이클 플랫폼</span>
            </div>

            {/* 메인 헤드라인 — 원본 바닐라 카피 */}
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              당신의{' '}
              <span className="text-white font-black">AI</span> 챗봇이{' '}
              <br className="hidden sm:block" />
              이 세상에{' '}
              <span
                style={{
                  background:
                    'linear-gradient(90deg, rgb(var(--amber-300)), rgb(var(--amber-400)))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                태어납니다
              </span>
            </h1>

            {/* 서브카피 — 원본 바닐라 카피 */}
            <p className="mt-6 text-lg leading-8 text-white/70 sm:text-xl">
              인터뷰 5분이면 끝.{' '}
              <br className="hidden sm:block" />
              <span className="text-white/90 font-medium">나머지는 AI가 다 만들어 드립니다.</span>{' '}
              <br />
              소상공인부터 전문직, 정치인까지{' '}
              <br className="hidden sm:block" />
              어떤 직업이든 OK.
            </p>

            {/* CTA 버튼 */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{
                  background:
                    'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-400)))',
                  boxShadow: '0 8px 24px rgb(var(--primary-500) / 0.4)',
                }}
              >
                {primaryLabel}
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/guest"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ background: 'rgb(16 185 129)', boxShadow: '0 8px 24px rgb(16 185 129 / 0.4)' }}
              >
                ⚡ 지금 무료로 체험하기
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
