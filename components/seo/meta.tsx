/**
 * @task S4DV1 - SEO 메타태그 컴포넌트
 *
 * Next.js App Router 방식 — generateMetadata() 함수에서 사용하거나
 * 직접 <head>에 삽입할 수 없으므로 Metadata 객체 생성 헬퍼로 제공합니다.
 *
 * 사용법:
 *   import { buildSEOMeta } from '@/components/seo/meta';
 *   export const metadata = buildSEOMeta({ title: '...' });
 */

import type { Metadata } from 'next';

// ── 기본값 ──────────────────────────────────────────────────────

const DEFAULT_SITE_NAME = 'CoCoBot';
const DEFAULT_DESCRIPTION = 'AI 챗봇을 만들고 공유하는 플랫폼. 나만의 챗봇을 제작하고 마켓플레이스에 공유하세요.';
const DEFAULT_OG_IMAGE = '/og-image.png'; // 1200x630
const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mychatbot-world.vercel.app';
const TWITTER_HANDLE = '@mychatbotworld';

// ── SEOMeta Props ────────────────────────────────────────────────

export interface SEOMetaProps {
  /** 페이지 제목 (서비스명 자동 추가됨) */
  title?: string;
  /** 페이지 설명 */
  description?: string;
  /** OG 이미지 절대 경로 또는 URL */
  ogImage?: string;
  /** 정규 URL (절대 경로) */
  canonicalUrl?: string;
  /** 검색 엔진 색인 차단 여부 */
  noIndex?: boolean;
  /** OG 타입 (기본: website) */
  ogType?: 'website' | 'article' | 'profile';
  /** 추가 키워드 */
  keywords?: string[];
}

// ── 메타데이터 빌더 ──────────────────────────────────────────────

export function buildSEOMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  canonicalUrl,
  noIndex = false,
  ogType = 'website',
  keywords = [],
}: SEOMetaProps = {}): Metadata {
  const pageTitle = title ? `${title} | ${DEFAULT_SITE_NAME}` : DEFAULT_SITE_NAME;
  const canonicalHref = canonicalUrl ?? DEFAULT_APP_URL;
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${DEFAULT_APP_URL}${ogImage}`;

  const allKeywords = [
    'chatbot', 'AI', '챗봇', '코코봇', '인공지능', 'CoCoBot', 'MCW',
    ...keywords,
  ];

  return {
    title: pageTitle,
    description,
    keywords: allKeywords,

    // ── robots ──────────────────────────────────────────────────
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-snippet': -1 },

    // ── canonical ───────────────────────────────────────────────
    alternates: {
      canonical: canonicalHref,
    },

    // ── Open Graph ──────────────────────────────────────────────
    openGraph: {
      title: pageTitle,
      description,
      url: canonicalHref,
      siteName: DEFAULT_SITE_NAME,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
      locale: 'ko_KR',
      type: ogType,
    },

    // ── Twitter Card ─────────────────────────────────────────────
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [ogImageUrl],
      creator: TWITTER_HANDLE,
      site: TWITTER_HANDLE,
    },

    // ── 앱 관련 ─────────────────────────────────────────────────
    applicationName: DEFAULT_SITE_NAME,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: DEFAULT_SITE_NAME,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

// ── 페이지별 메타데이터 프리셋 ────────────────────────────────────

export const PAGE_META = {
  home: buildSEOMeta({
    title: '홈',
    description: 'AI 챗봇 생성 플랫폼 — 나만의 챗봇을 만들고 수익화하세요.',
    canonicalUrl: DEFAULT_APP_URL,
  }),
  marketplace: buildSEOMeta({
    title: '마켓플레이스',
    description: '다양한 AI 챗봇 스킬을 탐색하고 구매하세요. 크리에이터들의 고품질 스킬 마켓.',
    canonicalUrl: `${DEFAULT_APP_URL}/marketplace`,
    keywords: ['marketplace', '스킬', '마켓', 'AI 스킬'],
  }),
  business: buildSEOMeta({
    title: '비즈니스',
    description: '수익 대시보드, 정산 내역, 결제 수단을 한 곳에서 관리하세요.',
    canonicalUrl: `${DEFAULT_APP_URL}/business`,
    noIndex: true, // 개인 페이지 — 색인 차단
  }),
  mypage: buildSEOMeta({
    title: '마이페이지',
    description: '프로필, 크레딧, 결제 내역을 관리하세요.',
    canonicalUrl: `${DEFAULT_APP_URL}/mypage`,
    noIndex: true, // 개인 페이지 — 색인 차단
  }),
};
