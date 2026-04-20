/**
 * @task S8FE3
 * @description JSON-LD 구조화 데이터 컴포넌트
 *
 * 사용법:
 *   import { JsonLd, buildOrganization, buildWebSite } from '@/components/seo/json-ld';
 *   <JsonLd data={buildOrganization()} />
 *
 * Next.js App Router 에서는 Metadata 의 other 필드 대신 <Script type="application/ld+json">
 * 패턴을 권장. server component 에서 바로 렌더링 가능.
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mychatbot.world';
const SITE_NAME = 'CoCoBot World';
const LOGO_URL = `${SITE_URL}/logo.png`;

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ── 재사용 스키마 빌더 ────────────────────────────────────────────────────

export function buildOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    sameAs: [
      'https://twitter.com/mychatbotworld',
    ],
  };
}

export function buildWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/bots?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumb(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function buildProduct(p: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  url: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.image ?? `${SITE_URL}/og-image.png`,
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: p.currency ?? 'KRW',
      url: p.url.startsWith('http') ? p.url : `${SITE_URL}${p.url}`,
      availability: 'https://schema.org/InStock',
    },
  };
}

export function buildContactPage() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `${SITE_NAME} 고객 지원`,
    url: `${SITE_URL}/support`,
    inLanguage: 'ko-KR',
  };
}

export function buildCollectionPage(opts: { name: string; description: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: opts.url.startsWith('http') ? opts.url : `${SITE_URL}${opts.url}`,
    inLanguage: 'ko-KR',
  };
}
