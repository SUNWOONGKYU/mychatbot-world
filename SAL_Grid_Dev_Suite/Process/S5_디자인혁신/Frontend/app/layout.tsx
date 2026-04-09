// @task S5FE2 - 네비게이션 컴포넌트 재구축 (상단바 4대 메뉴 + 모바일 하단 탭바)
// @task S4DV1 - SEO 메타태그 강화
// (S1DS1 기반 확장 — Navbar + MobileTabBar로 전환, Sidebar/Header 제거)
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import { Navbar } from '@/components/common/navbar';
import { MobileTabBar } from '@/components/common/mobile-tab-bar';
import { buildSEOMeta } from '@/components/seo/meta';

export const metadata: Metadata = buildSEOMeta({
  title: undefined, // 홈 — 서비스명만 표시
  description: 'AI 챗봇을 만들고 공유하는 플랫폼 — My Chatbot World. 나만의 챗봇을 제작하고 수익화하세요.',
  canonicalUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://mychatbot-world.vercel.app',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes가 서버/클라이언트 class 불일치를 피하기 위해 필수
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-bg-base text-text-primary antialiased">
        <ThemeProvider>
          {/*
            앱 셸 구조:
            - Navbar: 상단 고정 (4대 메뉴, 알림, 프로필 → /mypage)
              → 랜딩/마케팅/어드민 페이지는 Navbar 내부에서 자동 숨김
            - main: 스크롤 가능한 컨텐츠 영역
              → 모바일에서 하단 탭바 높이(48px+safe-area)만큼 pb 확보
            - MobileTabBar: 모바일 하단 고정 탭 (md 이상 숨김)
          */}
          <div className="flex flex-col min-h-screen">
            {/* 상단 Navbar (4대 메뉴) */}
            <Navbar />

            {/* 컨텐츠 영역 */}
            <main
              className={[
                'flex-1',
                'bg-bg-base',
                // 모바일 하단 탭바(~48px + safe-area) 위로 컨텐츠가 가려지지 않도록
                'pb-[calc(env(safe-area-inset-bottom)+64px)] md:pb-0',
              ].join(' ')}
            >
              {children}
            </main>

            {/* 모바일 하단 탭바 (md 이상에서는 컴포넌트 내부에서 hidden 처리) */}
            <MobileTabBar />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
