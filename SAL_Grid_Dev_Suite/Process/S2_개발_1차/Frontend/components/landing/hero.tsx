/**
 * @task S2FE4 - Landing 페이지 React 전환
 * @component HeroSection
 * @description 히어로 섹션 — "5분 만에 나만의 AI 챗봇"
 *              비로그인 → /create CTA, 로그인 → /home CTA
 */
'use client';

import Link from 'next/link';

interface HeroSectionProps {
  /** 로그인 여부 (서버 컴포넌트에서 session 전달) */
  isLoggedIn?: boolean;
}

/**
 * HeroSection
 * - 대형 헤드라인 + 서브카피
 * - CTA 버튼 2개: 주 CTA(시작하기), 보조 CTA(데모 보기)
 * - 배경: 그라디언트 + 장식 요소
 */
export function HeroSection({ isLoggedIn = false }: HeroSectionProps) {
  const primaryHref = isLoggedIn ? '/home' : '/create';
  const primaryLabel = isLoggedIn ? '내 챗봇 관리하기' : '무료로 시작하기';

  return (
    <section className="relative overflow-hidden bg-bg-base">
      {/* 배경 그라디언트 장식 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* 배지 */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="text-text-secondary">지금 바로 무료로 시작</span>
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            5분 만에{' '}
            <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
              나만의 AI 챗봇
            </span>
            을 만드세요
          </h1>

          {/* 서브카피 */}
          <p className="mt-6 text-lg leading-8 text-text-secondary sm:text-xl">
            코딩 없이도 OK. 고객 상담, 쇼핑 도우미, 수익형 챗봇까지.
            <br className="hidden sm:block" />
            My Chatbot World에서 AI의 힘을 내 비즈니스에 연결하세요.
          </p>

          {/* CTA 버튼 */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href={primaryHref}
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-hover hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
            >
              {primaryLabel}
            </Link>
            <a
              href="#demo"
              className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-8 py-3.5 text-base font-semibold text-text-primary transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
            >
              데모 체험하기
            </a>
          </div>

          {/* 소셜 증거 */}
          <p className="mt-8 text-sm text-text-muted">
            신용카드 불필요 · 무료 플랜 영구 제공 · 언제든 업그레이드 가능
          </p>
        </div>

        {/* 히어로 이미지 / UI 미리보기 */}
        <div className="mt-16 flow-root sm:mt-20">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            {/* 가짜 브라우저 크롬 */}
            <div className="flex items-center gap-2 border-b border-border bg-bg-subtle px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-error/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
              </div>
              <div className="mx-auto rounded bg-bg-muted px-16 py-1 text-xs text-text-muted">
                mychatbot.world/demo
              </div>
            </div>

            {/* 챗봇 미리보기 */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-4">
                {/* 봇 메시지 */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    AI
                  </div>
                  <div className="max-w-xs rounded-2xl rounded-tl-none bg-bg-muted px-4 py-3 text-sm text-text-primary">
                    안녕하세요! 저는 쇼핑 도우미 챗봇입니다. 무엇을 도와드릴까요?
                  </div>
                </div>

                {/* 유저 메시지 */}
                <div className="flex items-start justify-end gap-3">
                  <div className="max-w-xs rounded-2xl rounded-tr-none bg-primary px-4 py-3 text-sm text-white">
                    여름 원피스 추천해줘요 🌸
                  </div>
                </div>

                {/* 봇 응답 */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    AI
                  </div>
                  <div className="max-w-sm rounded-2xl rounded-tl-none bg-bg-muted px-4 py-3 text-sm text-text-primary">
                    물론이죠! 신상 플로럴 원피스 3가지를 추천해드릴게요. 예산과 선호하는 스타일이 있으신가요?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
