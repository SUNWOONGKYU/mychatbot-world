/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component PricingSection
 * @description 가격 섹션 — 4티어 (일단/이단/삼단/사단, Dan I~IV)
 *              VAT 포함 가격: ₩9,900 / ₩29,700 / ₩99,000 / ₩297,000
 *              크레딧제: 1크레딧=1원, 정액×2배, 초과×4배
 */
'use client';

import Link from 'next/link';

interface PricingTier {
  id: string;
  name: string;
  price: number | null;
  priceSuffix?: string;
  tagline: string;
  description: string;
  features: string[];
  recommended?: boolean;
  ctaLabel: string;
  ctaHref: string;
  ctaStyle: 'primary' | 'secondary' | 'ghost' | 'accent';
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'dan1',
    name: '일단 (Dan I)',
    price: 9900,
    tagline: '₩9,900',
    priceSuffix: '/월 (VAT 포함)',
    description: '첫 발을 내딛는 1인 사업자 · 개인 프리랜서에게 최적.',
    features: [
      '월 2,000 크레딧 포함',
      'Economy 모델 ~250회 대화',
      '챗봇 3개',
      '기본 템플릿 50종+',
      '커스텀 페르소나',
      '챗봇 위젯 임베드',
      '이메일 지원',
    ],
    ctaLabel: '일단 시작하기',
    ctaHref: '/create?plan=dan1',
    ctaStyle: 'secondary',
  },
  {
    id: 'dan2',
    name: '이단 (Dan II)',
    price: 29700,
    tagline: '₩29,700',
    priceSuffix: '/월 (VAT 포함)',
    description: '소규모 팀 · 스타트업 · 활발한 고객 응대에 적합.',
    features: [
      '월 8,000 크레딧 포함',
      'Economy 모델 ~1,000회 대화',
      '챗봇 10개',
      '지식베이스 연동 (100MB)',
      '커스텀 페르소나 무제한',
      '대화 분석 기본',
      '우선 이메일 지원',
    ],
    ctaLabel: '이단 시작하기',
    ctaHref: '/create?plan=dan2',
    ctaStyle: 'secondary',
  },
  {
    id: 'dan3',
    name: '삼단 (Dan III)',
    price: 99000,
    tagline: '₩99,000',
    priceSuffix: '/월 (VAT 포함)',
    description: '팀 · 에이전시 · 다중 챗봇 운영 전문가용.',
    features: [
      '월 30,000 크레딧 포함',
      'Economy 모델 ~3,750회 대화',
      '챗봇 무제한',
      '지식베이스 무제한',
      'API 연동',
      '팀원 초대 (5인)',
      '고급 분석 대시보드',
      '스킬 수익 분배',
      '우선 지원 (24h)',
    ],
    recommended: true,
    ctaLabel: '삼단 시작하기',
    ctaHref: '/create?plan=dan3',
    ctaStyle: 'primary',
  },
  {
    id: 'dan4',
    name: '사단 (Dan IV)',
    price: 297000,
    tagline: '₩297,000',
    priceSuffix: '/월 (VAT 포함)',
    description: '엔터프라이즈 · 화이트라벨 · 대규모 고객 서비스.',
    features: [
      '월 120,000 크레딧 포함',
      'Economy 모델 ~15,000회 대화',
      '모든 삼단 기능 포함',
      '화이트라벨 (브랜딩 제거)',
      '전담 고객 성공 매니저',
      '팀원 무제한',
      '99.9% SLA 보장',
      '맞춤 통합 개발',
    ],
    ctaLabel: '사단 도입 문의',
    ctaHref: '/contact?plan=dan4',
    ctaStyle: 'ghost',
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-20 sm:py-28"
      style={{ background: 'rgb(var(--bg-base))' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 헤더 */}
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgb(var(--color-primary) / 0.1)',
              color: 'rgb(var(--color-primary))',
            }}
          >
            요금제
          </span>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            나에게 맞는 플랜을 선택하세요
          </h2>
          <p
            className="mt-4 text-lg"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            1크레딧 = 1원. 정액 크레딧으로 시작하고, 더 필요하면 추가 충전하세요.
          </p>
        </div>

        {/* 가격 카드 */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_TIERS.map((tier) => {
            const isRecommended = tier.recommended;

            return (
              <div
                key={tier.id}
                className="relative flex flex-col rounded-2xl border p-7 transition-all"
                style={
                  isRecommended
                    ? {
                        background:
                          'linear-gradient(160deg, rgb(var(--primary-900)), rgb(30 27 75), rgb(23 37 84))',
                        borderColor: 'rgb(var(--primary-500) / 0.6)',
                        boxShadow:
                          '0 0 0 1px rgb(var(--primary-500) / 0.3), 0 20px 40px rgb(var(--primary-500) / 0.2)',
                      }
                    : {
                        background: 'rgb(var(--bg-surface))',
                        borderColor: 'rgb(var(--border))',
                      }
                }
              >
                {/* 추천 배지 */}
                {isRecommended && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span
                      className="rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-lg"
                      style={{
                        background:
                          'linear-gradient(90deg, rgb(var(--primary-500)), rgb(var(--primary-400)))',
                      }}
                    >
                      가장 많이 선택
                    </span>
                  </div>
                )}

                {/* 플랜명 */}
                <h3
                  className="text-base font-bold"
                  style={{ color: isRecommended ? 'white' : 'rgb(var(--text-primary))' }}
                >
                  {tier.name}
                </h3>

                {/* 가격 */}
                <div className="mt-4 flex items-end gap-1">
                  <span
                    className="text-3xl font-extrabold"
                    style={{ color: isRecommended ? 'white' : 'rgb(var(--text-primary))' }}
                  >
                    {tier.tagline}
                  </span>
                  {tier.priceSuffix && (
                    <span
                      className="mb-1 text-sm"
                      style={{
                        color: isRecommended
                          ? 'rgb(255 255 255 / 0.6)'
                          : 'rgb(var(--text-muted))',
                      }}
                    >
                      {tier.priceSuffix}
                    </span>
                  )}
                </div>

                {/* 설명 */}
                <p
                  className="mt-3 text-xs leading-relaxed"
                  style={{
                    color: isRecommended
                      ? 'rgb(255 255 255 / 0.7)'
                      : 'rgb(var(--text-secondary))',
                  }}
                >
                  {tier.description}
                </p>

                {/* CTA 버튼 */}
                <Link
                  href={tier.ctaHref}
                  className="mt-6 block rounded-xl px-5 py-3 text-center text-sm font-bold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                  style={
                    isRecommended
                      ? {
                          background: 'white',
                          color: 'rgb(var(--primary-600))',
                        }
                      : tier.ctaStyle === 'secondary'
                      ? {
                          background: 'rgb(var(--color-primary) / 0.1)',
                          color: 'rgb(var(--color-primary))',
                          border: '1.5px solid rgb(var(--color-primary) / 0.3)',
                        }
                      : {
                          background: 'rgb(var(--bg-muted))',
                          color: 'rgb(var(--text-primary))',
                          border: '1.5px solid rgb(var(--border))',
                        }
                  }
                >
                  {tier.ctaLabel}
                </Link>

                {/* 구분선 */}
                <div
                  className="my-6 border-t"
                  style={{
                    borderColor: isRecommended
                      ? 'rgb(255 255 255 / 0.15)'
                      : 'rgb(var(--border))',
                  }}
                />

                {/* 기능 목록 */}
                <ul className="flex flex-1 flex-col gap-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                        style={{
                          color: isRecommended
                            ? 'rgb(var(--amber-300))'
                            : 'rgb(var(--color-success))',
                        }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span
                        style={{
                          color: isRecommended
                            ? 'rgb(255 255 255 / 0.85)'
                            : 'rgb(var(--text-secondary))',
                        }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 안내 문구 */}
        <p
          className="mt-10 text-center text-sm"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          모든 요금제 VAT 포함 · 무통장 입금 우선 지원 · 언제든지 플랜 변경 가능
        </p>
      </div>
    </section>
  );
}
