/**
 * @task S4DV1 - Marketplace 페이지 SEO 메타데이터
 * Route: /marketplace
 */
import type { Metadata } from 'next';
import { buildSEOMeta } from '@/components/seo/meta';

export const metadata: Metadata = buildSEOMeta({
  title: '마켓플레이스',
  description: '다양한 코코봇 스킬을 탐색하고 구매하세요. 크리에이터들의 고품질 스킬 마켓.',
  canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mychatbot-world.vercel.app'}/marketplace`,
  keywords: ['마켓플레이스', 'AI 스킬', '코코봇 스킬', '스킬 마켓'],
});

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
