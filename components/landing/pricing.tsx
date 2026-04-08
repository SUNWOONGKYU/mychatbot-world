/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component PricingSection
 * @description 가격 섹션 — 4티어 (Free/Starter/Pro/Business)
 *              P4 와이어프레임 SECTION 5 기준
 *              가격: 3만/5만/10만/문의 (할인 없음)
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
    id: 'free',
    name: 'Free',
    price: 0,
    tagline: '무료',
    description: '개인 실험과 학습용. 핵심 기능을 무제한 무료로.',
    features: [
      '챗봇 1개',
      '월 200회 대화',
      '기본 템플릿 5종',
      '커뮤니티 지원',
      '챗봇 위젯 임베드',
    ],
    ctaLabel: '무료로 시작',
    ctaHref: '/create',
    ctaStyle: 'ghost',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 30000,
    tagline: '₩30,000',
    priceSuffix: '/월',
    description: '소규모 비즈니스와 1인 사업자에게 최적.',
    features: [
      '챗봇 5개',
      '월 2,000회 대화',
      '전체 템플릿 50종+',
      '지식베이스 연동 (10MB)',
      '이메일 지원',
      '커스텀 페르소나',
      '대화 분석 기본',
    ],
    ctaLabel: 'Starter 시작하기',
    ctaHref: '/create?plan=starter',
    ctaStyle: 'secondary',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 50000,
    tagline: '₩50,000',
    priceSuffix: '/월',
    description: '팀 · 에이전시 · 전문가를 위한 무제한 플랜.',
    features: [
      '챗봇 무제한',
      '대화 무제한',
      '전체 템플릿 + 커스텀',
      '지식베이스 무제한',
      '우선 지원 (24h)',
      'API 연동',
      '팀원 초대 (5인)',
      '고급 분석 대시보드',
      '스킬 수익 분배',
    ],
    recommended: true,
    ctaLabel: 'Pro 시작하기',
    ctaHref: '/create?plan=pro',
    ctaStyle: 'primary',
  },
  {
    id: 'business',
    name: 'Business',
    price: 100000,
    tagline: '₩100,000~',
    priceSuffix: '/월',
    description: '엔터프라이즈 · 화이트라벨 · 대규모 배포.',
    features: [
      '모든 Pro 기능 포함',
      '화이트라벨 (브랜딩 제거)',
      '전담 고객 성공 매니저',
      '맞춤 통합 개발',
      '99.9% SLA 보장',
      '팀원 무제한',
    ],
    ctaLabel: '도입 문의하기',
    ctaHref: '/contact',
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
            무료로 시작하고 성장에 맞춰 업그레이드하세요. 언제든지 변경 가능합니다.
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
          모든 요금제 VAT 별도 · 무통장 입금 우선 지원 · 언제든지 플랜 변경 가능
        </p>
      </div>
    </section>
  );
}
