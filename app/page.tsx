/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @page LandingPage
 * @route / (public — MarketingLayout)
 * @description MCW 랜딩 페이지 — AI 챗봇 라이프사이클 플랫폼 정체성
 *
 * 섹션 순서 (P4 와이어프레임 기준):
 * 0. MarketingGNB  — 랜딩 전용 상단바 (Sticky)
 * 1. HeroSection   — 퍼플→블루 그라데이션 + 이중 CTA + 신뢰 지표
 * 2. ChatbotTypes  — 챗봇 유형 카드 (5종)
 * 3. DemoSection   — 라이프사이클 4단계 + 인터랙티브 챗봇
 * 4. RevenueSection — 수익 강조 (앰버 골드)
 * 5. PricingSection — 4티어 요금제
 * 6. LandingFooter — 사이트맵 + 저작권 + 테마 토글
 */

import Link from 'next/link';
import { HeroSection }    from '@/components/landing/hero';
import { ChatbotTypes }   from '@/components/landing/chatbot-types';
import { DemoSection }    from '@/components/landing/demo-section';
import { PricingSection } from '@/components/landing/pricing';
import { LandingFooter }  from '@/components/landing/footer';
import { RevenueSection } from '@/components/landing/revenue-section';
// MarketingGNB 제거 — layout.tsx의 Navbar가 5대 메뉴 담당

export default function LandingPage() {
  const isLoggedIn = false;

  return (
    <>
      {/* 건너뛰기 링크 (접근성) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        본문으로 건너뛰기
      </a>

      <main id="main-content">
        {/* SECTION 1: Hero */}
        <HeroSection isLoggedIn={isLoggedIn} />

        {/* SECTION 2: 챗봇 유형 */}
        <ChatbotTypes />

        {/* SECTION 3: 라이프사이클 + 데모 */}
        <DemoSection />

        {/* SECTION 4: 수익 강조 */}
        <RevenueSection />

        {/* SECTION 4.5: 구봇구직 — 경쟁사 없는 유일 기능 */}
        <section
          className="py-20 sm:py-28"
          style={{ background: 'rgb(var(--bg-base))' }}
        >
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'rgb(var(--color-success) / 0.1)', color: 'rgb(var(--color-success))' }}
            >
              국내 유일
            </span>
            <h2
              className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: 'rgb(var(--text-primary))' }}
            >
              챗봇이 일자리를 구합니다
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              내 챗봇을 구직시키거나, 다른 챗봇을 고용하세요.
              <br />
              AI 챗봇 채용 마켓플레이스 — 경쟁사에는 없는 MCW만의 기능입니다.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--color-success)), rgb(34 197 94))',
                  boxShadow: '0 8px 24px rgb(var(--color-success) / 0.3)',
                }}
              >
                구봇구직 바로가기
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 5: 가격 */}
        <PricingSection />
      </main>

      {/* FOOTER */}
      <LandingFooter />
    </>
  );
}
