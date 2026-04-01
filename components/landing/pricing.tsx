/**
 * @task S2FE4 - Landing 페이지 React 전환
 * @component PricingSection
 * @description 가격표 섹션 — Free / Basic(19,900원) / Pro(49,900원)
 */
'use client';

import Link from 'next/link';

interface PricingTier {
  id: string;
  name: string;
  price: number | null;
  priceLabel: string;
  description: string;
  features: string[];
  /** 추천 플랜 여부 */
  recommended?: boolean;
  ctaLabel: string;
  ctaHref: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '무료',
    description: '개인 실험 & 학습용. 핵심 기능을 무제한 무료로.',
    features: [
      '챗봇 1개',
      '월 200회 대화',
      '기본 템플릿 3종',
      '커뮤니티 지원',
      '챗봇 위젯 임베드',
    ],
    ctaLabel: '무료로 시작',
    ctaHref: '/create',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 19900,
    priceLabel: '19,900원',
    description: '소규모 비즈니스 & 1인 사업자에게 최적.',
    features: [
      '챗봇 5개',
      '월 2,000회 대화',
      '전체 템플릿 30종+',
      '지식베이스 연동 (10MB)',
      '이메일 지원',
      '커스텀 페르소나',
      '대화 기록 분석',
    ],
    recommended: true,
    ctaLabel: 'Basic 시작하기',
    ctaHref: '/create?plan=basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49900,
    priceLabel: '49,900원',
    description: '팀·에이전시·전문가를 위한 무제한 플랜.',
    features: [
      '챗봇 무제한',
      '대화 무제한',
      '전체 템플릿 + 커스텀',
      '지식베이스 무제한',
      '우선 지원 (24h)',
      'API 연동',
      '팀원 초대 (5인)',
      '고급 분석 대시보드',
      '화이트라벨 (브랜딩 제거)',
    ],
    ctaLabel: 'Pro 시작하기',
    ctaHref: '/create?plan=pro',
  },
];

/** 금액을 한국 원화 포맷으로 변환 */
function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/**
 * PricingSection
 * - 3열 가격 카드 (모바일에서 1열)
 * - recommended 카드는 primary 배경으로 강조
 * - 연간 결제 할인 뱃지 (UI only)
 */
export function PricingSection() {
  return (
    <section id="pricing" className="bg-bg-base py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 헤더 */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            요금제
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            내 비즈니스에 맞는 플랜 선택
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            무료로 시작하고, 성장에 맞춰 업그레이드하세요.
            언제든지 취소 가능합니다.
          </p>
        </div>

        {/* 카드 */}
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={[
                'relative flex flex-col rounded-2xl border p-8 shadow-sm',
                tier.recommended
                  ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20'
                  : 'border-border bg-surface text-text-primary',
              ].join(' ')}
            >
              {/* 추천 배지 */}
              {tier.recommended && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-xs font-semibold text-primary shadow-sm">
                  가장 많이 선택
                </span>
              )}

              {/* 플랜명 */}
              <h3
                className={[
                  'text-lg font-bold',
                  tier.recommended ? 'text-white' : 'text-text-primary',
                ].join(' ')}
              >
                {tier.name}
              </h3>

              {/* 가격 */}
              <div className="mt-4 flex items-end gap-1">
                {tier.price === 0 ? (
                  <span
                    className={[
                      'text-4xl font-extrabold',
                      tier.recommended ? 'text-white' : 'text-text-primary',
                    ].join(' ')}
                  >
                    무료
                  </span>
                ) : (
                  <>
                    <span
                      className={[
                        'text-4xl font-extrabold',
                        tier.recommended ? 'text-white' : 'text-text-primary',
                      ].join(' ')}
                    >
                      {formatKRW(tier.price!)}원
                    </span>
                    <span
                      className={[
                        'mb-1 text-sm',
                        tier.recommended ? 'text-white/70' : 'text-text-muted',
                      ].join(' ')}
                    >
                      /월
                    </span>
                  </>
                )}
              </div>

              {/* 설명 */}
              <p
                className={[
                  'mt-3 text-sm',
                  tier.recommended ? 'text-white/80' : 'text-text-secondary',
                ].join(' ')}
              >
                {tier.description}
              </p>

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                className={[
                  'mt-6 block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2',
                  tier.recommended
                    ? 'bg-white text-primary hover:bg-primary-light focus-visible:ring-white'
                    : 'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary',
                ].join(' ')}
              >
                {tier.ctaLabel}
              </Link>

              {/* 구분선 */}
              <div
                className={[
                  'my-6 border-t',
                  tier.recommended ? 'border-white/20' : 'border-border',
                ].join(' ')}
              />

              {/* 기능 목록 */}
              <ul className="flex flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <svg
                      className={[
                        'mt-0.5 h-4 w-4 shrink-0',
                        tier.recommended ? 'text-white' : 'text-success',
                      ].join(' ')}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className={
                        tier.recommended ? 'text-white/90' : 'text-text-secondary'
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <p className="mt-10 text-center text-sm text-text-muted">
          모든 요금제 VAT 별도 · 연간 결제 시 2개월 무료 (출시 예정)
        </p>
      </div>
    </section>
  );
}
