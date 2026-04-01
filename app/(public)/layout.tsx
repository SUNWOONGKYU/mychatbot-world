/**
 * @task S2FE4 - Landing 페이지 React 전환
 * @layout PublicLayout
 * @description 사이드바/헤더 없는 풀스크린 퍼블릭 레이아웃
 *              랜딩 페이지, 로그인, 약관 등 비인증 공개 페이지용
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Chatbot World — 5분 만에 나만의 AI 챗봇',
  description:
    '코딩 없이 5분 만에 나만의 AI 챗봇을 만드세요. 고객 상담, 쇼핑 도우미, 수익형 챗봇까지. 무료로 시작하세요.',
  keywords: ['AI 챗봇', '챗봇 만들기', '챗봇 생성', '무료 챗봇', 'chatbot'],
  openGraph: {
    title: 'My Chatbot World — 5분 만에 나만의 AI 챗봇',
    description: '코딩 없이 5분 만에 나만의 AI 챗봇을 만드세요.',
    type: 'website',
  },
};

/**
 * PublicLayout
 * - 사이드바, 헤더 없음 (풀스크린)
 * - RootLayout의 ThemeProvider는 상속됨
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // min-h-screen: 콘텐츠가 짧아도 전체 화면 채움
    <div className="min-h-screen bg-bg-base">
      {children}
    </div>
  );
}
