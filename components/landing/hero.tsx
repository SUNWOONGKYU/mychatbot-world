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

export function HeroSection({ isLoggedIn = false }: HeroSectionProps) {
  const primaryHref = isLoggedIn ? '/mypage' : '/create';
  const primaryLabel = isLoggedIn ? '내 코코봇 관리하기' : '5분 인터뷰로 코코봇 생성하기';

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
            <span className="font-medium tracking-wide">LIVE · 코코봇 라이프사이클 플랫폼</span>
          </div>

          {/* Display 헤드라인 */}
          <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl [word-break:keep-all]">
            <span className="block">
              당신의 <span className="font-black">AI 어시스턴트</span> 코코봇이
            </span>
            <span className="block">
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
            <span className="block">
              인터뷰 5분이면 끝.{' '}
              <span className="font-semibold text-white">나머지는 AI가 다 만들어 드립니다.</span>
            </span>
            <span className="mt-1 block">
              소상공인부터 전문직, 정치인까지 어떤 직업이든 OK.
            </span>
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

          {/* 글래스모피즘 스탯 카드 — 신뢰 지표 */}
          <div className="mt-14 grid grid-cols-1 gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-4">
            {[
              { num: '5분', label: 'AI 인터뷰 완료', icon: '⏱' },
              { num: '0원', label: '시작 비용', icon: '💫' },
              { num: '∞', label: '가능한 직업', icon: '🌐' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5 text-left transition-all hover:-translate-y-1"
                style={{
                  background: 'color-mix(in oklch, white 6%, transparent)',
                  border: '1px solid color-mix(in oklch, white 12%, transparent)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px color-mix(in oklch, black 20%, transparent)',
                }}
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
                  <span aria-hidden="true">{stat.icon}</span>
                  <span>{stat.label}</span>
                </div>
                <div className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {stat.num}
                </div>
              </div>
            ))}
          </div>

          {/* 스크롤 인디케이터 */}
          <div className="mt-14 flex items-center justify-center sm:mt-20" aria-hidden="true">
            <div className="flex flex-col items-center gap-2 text-white/40">
              <span className="text-xs tracking-widest">SCROLL</span>
              <div className="h-10 w-[1px] animate-hero-scroll bg-gradient-to-b from-white/60 to-transparent" />
            </div>
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
        @keyframes hero-scroll {
          0%       { transform: scaleY(0); transform-origin: top; }
          50%      { transform: scaleY(1); transform-origin: top; }
          50.01%   { transform: scaleY(1); transform-origin: bottom; }
          100%     { transform: scaleY(0); transform-origin: bottom; }
        }
        .animate-hero-orb-1 { animation: hero-orb-1 16s ease-in-out infinite; }
        .animate-hero-orb-2 { animation: hero-orb-2 20s ease-in-out infinite; }
        .animate-hero-orb-3 { animation: hero-orb-3 12s ease-in-out infinite; }
        .animate-hero-scroll { animation: hero-scroll 2.2s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
