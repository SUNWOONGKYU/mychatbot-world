// @task S1FE1 - 공통 레이아웃 + 사이드바 컴포넌트 (React)
// (S1DS1 기반 확장 — Sidebar + Header 추가)
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import { Sidebar } from '@/components/common/sidebar';
import { Header } from '@/components/common/header';

export const metadata: Metadata = {
  title: 'My Chatbot World',
  description: 'AI 챗봇 생성 플랫폼 — My Chatbot World',
  keywords: ['chatbot', 'AI', '챗봇', '인공지능'],
};

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
          {/* App shell: sidebar + main column */}
          <div className="flex h-screen overflow-hidden">
            {/* Desktop sidebar (hidden on mobile) */}
            <Sidebar />

            {/* Right column: header + scrollable content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6 bg-bg-base">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
