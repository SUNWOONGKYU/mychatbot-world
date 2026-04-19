import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 · 코코봇',
  description: '이메일, Google, 카카오 계정으로 코코봇에 로그인하세요.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
