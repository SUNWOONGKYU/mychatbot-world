import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입 · 코코봇',
  description: '코코봇 계정을 만들고 나만의 AI 챗봇을 생성·공유하세요.',
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
