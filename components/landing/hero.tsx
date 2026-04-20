/**
 * @task S7FE5 - P0 첫인상 페이지 리디자인 (v2 — 시각 강화)
 * @component HeroSection
 * @description Hero 섹션 — 애니메이션 그라디언트 오브, 글래스모피즘 스탯 카드,
 *              shimmer 강조, 스크롤 인디케이터
 */
'use client';

import Link from 'next/link';

interface HeroSectionProps {
  isLoggedIn?: boolean;
}

export function HeroSection({ isLoggedIn: _isLoggedIn = false }: HeroSectionProps) {
  // 랜딩 Hero 주 CTA는 로그인 여부와 무관하게 "코코봇 생성"으로 통일.
  // (로그인됐다고 해서 봇을 만들었단 보장이 없으므로 "관리하기"는 잘못된 문구)
  // 로그인 사용자의 대시보드 진입은 상단 GNB "대시보드" 버튼으로 안내.
  const primaryHref = '/create';
  const primaryLabel = '5분 인터뷰로 코코봇 생성하기';

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top, oklch(0.28 0.16 285) 0%, oklch(0.18 0.14 280) 35%, oklch(0.14 0.10 265) 65%, oklch(0.11 0.08 250) 100%)',
      }}
      aria-label="메인 히어로"
    >
      {/* ═══ 애니메이션 오브 배경 ═══ */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* 오브 1 — 좌상단 브랜드 글로우 */}
        <div
          className="absolute -top-40 -left-32 h-[640px] w-[640px] rounded-full opacity-40 blur-3xl animate-hero-orb-1"
          style={{
            background:
              'radial-gradient(circle, oklch(0.65 0.28 295) 0%, oklch(0.55 0.25 285) 40%, transparent 70%)',
          }}
        />
        {/* 오브 2 — 우하단 엑센트 */}
        <div
          className="absolute -bottom-32 -right-20 h-[560px] w-[560px] rounded-full opacity-35 blur-3xl animate-hero-orb-2"
          style={{
            background:
              'radial-gradient(circle, oklch(0.72 0.22 50) 0%, oklch(0.62 0.20 35) 40%, transparent 70%)',
          }}
        />
        {/* 오브 3 — 중앙 깊이감 */}
        <div
          className="absolute top-1/3 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-25 blur-3xl animate-hero-orb-3"
          style={{
            background:
              'radial-gradient(circle, oklch(0.62 0.24 210) 0%, transparent 70%)',
          }}
        />
        {/* 미세 격자 */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(255 255 255 / 0.15) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.15) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }}
        />
        {/* 노이즈 텍스처 (SVG 인라인) */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:pt-36 xl:max-w-6xl">
        <div className="text-center">
          {/* 라이브 배지 — 강화 */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-white backdrop-blur-md shadow-lg"
            style={{
              background: 'color-mix(in oklch, white 8%, transparent)',
              border: '1px solid color-mix(in oklch, white 18%, transparent)',
              boxShadow: '0 8px 32px color-mix(in oklch, oklch(0.55 0.25 285) 25%, transparent)',
            }}
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success-300" />
            </span>
            <span className="font-medium tracking-wide">코코봇 라이프사이클 플랫폼</span>
          </div>

          {/* Display 헤드라인 — 2줄 균형 배분 */}
          <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight text-white sm:text-4xl lg:text-5xl [word-break:keep-all]">
            <span className="block">
              <span className="font-black">AI Assistant 코코봇</span>이
            </span>
            <span className="block mt-1">
              이 세상에{' '}
              <span
                className="relative inline-block"
                style={{
                  background:
                    'linear-gradient(90deg, oklch(0.85 0.18 85) 0%, oklch(0.78 0.22 50) 50%, oklch(0.70 0.25 25) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  backgroundSize: '200% auto',
                  animation: 'hero-shimmer 4s linear infinite',
                }}
              >
                태어납니다
              </span>
            </span>
          </h1>

          {/* 서브카피 */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl [word-break:keep-all]">
            인터뷰 5분이면 끝.{' '}
            <span className="font-semibold text-white">나머지는 AI가 다 만들어 드립니다.</span>
          </p>

          {/* CTA 버튼 — 글로우 강화 */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={primaryHref}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 sm:w-auto"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.55 0.27 285) 0%, oklch(0.48 0.25 295) 100%)',
                boxShadow:
                  '0 10px 40px color-mix(in oklch, oklch(0.55 0.27 285) 50%, transparent), inset 0 1px 0 color-mix(in oklch, white 25%, transparent)',
              }}
            >
              {/* 버튼 내부 shine */}
              <span
                aria-hidden="true"
                className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]"
              />
              <span className="relative">{primaryLabel}</span>
              <svg
                className="relative h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            <Link
              href="/guest"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 sm:w-auto"
              style={{
                background: 'color-mix(in oklch, white 10%, transparent)',
                border: '1px solid color-mix(in oklch, white 25%, transparent)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <span aria-hidden="true" className="text-lg">⚡</span>
              지금 무료로 체험하기
            </Link>
          </div>

        </div>
      </div>

      {/* 애니메이션 keyframes — 인라인 style 태그 */}
      <style jsx>{`
        @keyframes hero-shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes hero-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(40px, 30px) scale(1.1); }
        }
        @keyframes hero-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-30px, -40px) scale(1.08); }
        }
        @keyframes hero-orb-3 {
          0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.25; }
          50%      { transform: translate(-50%, -20px) scale(1.15); opacity: 0.35; }
        }
        .animate-hero-orb-1 { animation: hero-orb-1 16s ease-in-out infinite; }
        .animate-hero-orb-2 { animation: hero-orb-2 20s ease-in-out infinite; }
        .animate-hero-orb-3 { animation: hero-orb-3 12s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
