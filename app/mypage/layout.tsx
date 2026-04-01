/**
 * @task S4DV1 - MyPage SEO 메타데이터
 * Route: /mypage
 */
import type { Metadata } from 'next';
import { buildSEOMeta } from '@/components/seo/meta';

export const metadata: Metadata = buildSEOMeta({
  title: '마이페이지',
  description: '프로필, 크레딧, 결제 내역을 관리하세요.',
  canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mychatbot-world.vercel.app'}/mypage`,
  noIndex: true, // 개인 페이지 — 검색 색인 차단
  keywords: ['프로필', '크레딧', '결제내역'],
});

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
