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

const TRUST_STATS = [
  { value: '500+', label: '챗봇 생성' },
  { value: '4.8', label: '평균 평점', prefix: '★' },
  { value: '50만+', label: '월 대화 수' },
  { value: '95%', label: '만족도' },
];

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

      <div className="relative mx-auto max-w-6xl px-4 pb-0 pt-20 sm:px-6 sm:pt-28 lg:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* 좌: 카피 + CTA */}
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
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
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
              <a
                href="#demo"
                className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                지금 무료로 체험하기
              </a>
            </div>

            {/* 마이크로카피 */}
            <p className="mt-5 flex items-center gap-1.5 text-sm text-white/50">
              <svg
                className="h-4 w-4 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              회원가입 불필요 · 데모 바로 체험 · 신용카드 불필요
            </p>

            {/* 멀티 LLM 지원 */}
            <p className="mt-3 text-xs text-white/40">
              GPT-4o · Claude · Gemini · Mistral · LLaMA 지원
            </p>
          </div>

          {/* 우: 챗봇 데모 미리보기 */}
          <div className="relative">
            <div
              className="overflow-hidden rounded-3xl border border-white/20 shadow-2xl"
              style={{ background: 'rgb(var(--neutral-800))' }}
            >
              {/* 브라우저 크롬 */}
              <div
                className="flex items-center gap-2 border-b border-white/10 px-4 py-3"
                style={{ background: 'rgb(var(--neutral-900))' }}
              >
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
                  <div className="h-3 w-3 rounded-full bg-green-400/70" />
                </div>
                <div
                  className="mx-auto rounded px-16 py-1 text-xs text-white/40"
                  style={{ background: 'rgb(var(--neutral-700))' }}
                >
                  mychatbot.world/demo
                </div>
              </div>

              {/* 챗봇 UI */}
              <div className="p-5 sm:p-7">
                {/* 챗봇 헤더 */}
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: 'rgb(var(--primary-500))' }}
                  >
                    AI
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">의료 상담 봇</p>
                    <p className="text-xs text-green-400">● 온라인</p>
                  </div>
                  <div
                    className="ml-auto rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: 'rgb(var(--amber-500) / 0.15)',
                      color: 'rgb(var(--amber-400))',
                    }}
                  >
                    월 ₩45,000 수익 중
                  </div>
                </div>

                {/* 메시지들 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: 'rgb(var(--primary-500))' }}
                    >
                      AI
                    </div>
                    <div
                      className="max-w-[75%] rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-white"
                      style={{ background: 'rgb(var(--neutral-700))' }}
                    >
                      안녕하세요! 증상을 말씀해주시면 예비 정보를 안내해드릴게요 😊
                    </div>
                  </div>

                  <div className="flex items-start justify-end gap-2.5">
                    <div
                      className="max-w-[75%] rounded-2xl rounded-tr-none px-4 py-2.5 text-sm text-white"
                      style={{ background: 'rgb(var(--primary-500))' }}
                    >
                      두통이 3일째 계속되고 있어요
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: 'rgb(var(--primary-500))' }}
                    >
                      AI
                    </div>
                    <div
                      className="max-w-[75%] rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-white"
                      style={{ background: 'rgb(var(--neutral-700))' }}
                    >
                      3일 지속 두통은 긴장성 두통이나 편두통일 가능성이 높아요. 구체적인 증상과 위치를 알려주시겠어요?
                    </div>
                  </div>
                </div>

                {/* 수익 위젯 */}
                <div
                  className="mt-5 flex items-center justify-between rounded-2xl border px-4 py-3"
                  style={{
                    background: 'rgb(var(--amber-500) / 0.08)',
                    borderColor: 'rgb(var(--amber-500) / 0.25)',
                  }}
                >
                  <div>
                    <p className="text-xs text-white/50">이번 달 수익</p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: 'rgb(var(--amber-400))' }}
                    >
                      ₩152,000
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'rgb(var(--amber-400))' }}
                    >
                      ▲ 23%
                    </p>
                    <p className="text-xs text-white/50">지난달 대비</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 플로팅 배지 */}
            <div
              className="absolute -left-4 -bottom-4 hidden rounded-2xl border border-white/15 px-4 py-3 shadow-xl backdrop-blur-sm lg:block"
              style={{ background: 'rgb(var(--neutral-800) / 0.9)' }}
            >
              <p className="text-xs text-white/60">총 크리에이터 수익</p>
              <p
                className="text-lg font-bold"
                style={{ color: 'rgb(var(--amber-400))' }}
              >
                ₩3,240,000
              </p>
              <p className="text-xs text-white/40">이번 달 합계</p>
            </div>
          </div>
        </div>

        {/* 신뢰 지표 리본 */}
        <div className="relative mt-16 border-t border-white/10 py-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold text-white sm:text-2xl">
                  {stat.prefix && (
                    <span style={{ color: 'rgb(var(--amber-400))' }}>
                      {stat.prefix}{' '}
                    </span>
                  )}
                  {stat.value}
                </p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
