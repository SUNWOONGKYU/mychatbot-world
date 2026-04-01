/**
 * @task S4DV1 - Business 페이지 SEO 메타데이터
 * Route: /business
 */
import type { Metadata } from 'next';
import { buildSEOMeta } from '@/components/seo/meta';

export const metadata: Metadata = buildSEOMeta({
  title: '비즈니스',
  description: '수익 대시보드, 정산 내역, 결제 수단을 한 곳에서 관리하세요.',
  canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mychatbot-world.vercel.app'}/business`,
  noIndex: true, // 개인 페이지 — 검색 색인 차단
  keywords: ['수익', '정산', '결제수단', '비즈니스'],
});

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
