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

        {/* SECTION 5: 가격 */}
        <PricingSection />
      </main>

      {/* FOOTER */}
      <LandingFooter />
    </>
  );
}
