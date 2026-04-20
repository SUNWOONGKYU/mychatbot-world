import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '고객센터 · 코코봇',
  description: '코코봇 이용 관련 문의, 결제 환불, 버그 신고를 남겨주세요.',
};

export default function CustomerServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
