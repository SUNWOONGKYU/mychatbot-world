/**
 * @task S2FE4 - Landing 페이지 React 전환
 * @page LandingPage
 * @route / (public layout — 사이드바 없음)
 * @description MCW 랜딩 루트 페이지
 *              히어로 → 데모 → 6대 챗봇 유형 → 가격표 → 푸터
 */

import { HeroSection }    from '@/components/landing/hero';
import { DemoSection }    from '@/components/landing/demo-section';
import { ChatbotTypes }   from '@/components/landing/chatbot-types';
import { PricingSection } from '@/components/landing/pricing';
import { LandingFooter }  from '@/components/landing/footer';

/**
 * LandingPage (서버 컴포넌트)
 *
 * 섹션 순서:
 * 1. HeroSection       — 메인 슬로건 + CTA
 * 2. DemoSection       — 인터랙티브 챗봇 체험 (#demo 앵커)
 * 3. ChatbotTypes      — 6대 챗봇 유형 소개
 * 4. PricingSection    — 요금제 비교 (#pricing 앵커)
 * 5. LandingFooter     — 사이트맵 + 저작권
 *
 * @note isLoggedIn은 추후 auth 세션 연동 시 서버에서 주입 예정
 */
export default function LandingPage() {
  // TODO: 추후 서버 세션 확인 후 isLoggedIn 주입
  // const session = await getServerSession(authOptions);
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

      {/* 랜딩 내비게이션 바 */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg-base/80 backdrop-blur-md">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6"
          aria-label="메인 내비게이션"
        >
          {/* 로고 */}
          <a
            href="/"
            className="text-xl font-bold text-primary"
            aria-label="My Chatbot World 홈"
          >
            MCW
          </a>

          {/* 데스크탑 내비 링크 */}
          <ul className="hidden items-center gap-6 text-sm font-medium text-text-secondary sm:flex">
            <li>
              <a href="#demo" className="transition-colors hover:text-text-primary">
                데모
              </a>
            </li>
            <li>
              <a href="#chatbot-types" className="transition-colors hover:text-text-primary">
                챗봇 유형
              </a>
            </li>
            <li>
              <a href="#pricing" className="transition-colors hover:text-text-primary">
                요금제
              </a>
            </li>
          </ul>

          {/* CTA 버튼 */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden text-sm font-medium text-text-secondary transition-colors hover:text-text-primary sm:block"
            >
              로그인
            </a>
            <a
              href={isLoggedIn ? '/home' : '/create'}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {isLoggedIn ? '대시보드' : '무료 시작'}
            </a>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <HeroSection isLoggedIn={isLoggedIn} />
        <DemoSection />
        <ChatbotTypes />
        <PricingSection />
      </main>

      <LandingFooter />
    </>
  );
}
