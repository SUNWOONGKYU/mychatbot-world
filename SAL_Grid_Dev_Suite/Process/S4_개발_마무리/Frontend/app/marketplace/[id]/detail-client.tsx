/**
 * @task S4FE3
 * @description Marketplace 상세 클라이언트 컴포넌트
 * - 구독 플랜 카드, 리뷰 섹션, 관련 스킬 추천
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import type { SkillDetail, SubscriptionPlan, Review, RelatedSkill } from './page';

// ── 상수 ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  productivity: '생산성',
  communication: '커뮤니케이션',
  analysis: '분석',
  education: '교육',
  entertainment: '엔터테인먼트',
  utility: '유틸리티',
  business: '비즈니스',
  other: '기타',
};

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    features: ['기본 기능 사용', '월 100회 실행', '이메일 지원'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 4900,
    features: [
      '모든 기능 사용',
      '무제한 실행',
      '우선 지원',
      '고급 커스터마이징',
      'API 접근',
    ],
  },
];

// ── 서브 컴포넌트 ──────────────────────────────────────────────────

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={clsx(sizeClass, i < Math.round(rating) ? 'text-warning' : 'text-bg-muted')}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function PlanCard({
  plan,
  onSubscribe,
  isLoading,
}: {
  plan: SubscriptionPlan;
  onSubscribe: (planId: string) => void;
  isLoading: boolean;
}) {
  const isFree = plan.price === 0;

  return (
    <div
      className={clsx(
        'flex flex-col gap-4 p-5 rounded-xl border',
        !isFree
          ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-surface',
      )}
    >
      {/* 플랜 이름 + 추천 뱃지 */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-text-primary">{plan.name}</span>
        {!isFree && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
            추천
          </span>
        )}
      </div>

      {/* 가격 */}
      <div className="flex items-end gap-1">
        <span className="text-2xl font-extrabold text-text-primary">
          {isFree ? '무료' : `${plan.price.toLocaleString()}원`}
        </span>
        {!isFree && <span className="text-sm text-text-secondary mb-0.5">/월</span>}
      </div>

      {/* 기능 목록 */}
      <ul className="space-y-2 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="text-success text-xs">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* 구독 버튼 */}
      <button
        onClick={() => onSubscribe(plan.id)}
        disabled={isLoading}
        className={clsx(
          'w-full py-2.5 rounded-lg text-sm font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          !isFree
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'border border-border text-text-primary hover:bg-surface-hover',
        )}
      >
        {isLoading ? '처리 중...' : isFree ? '무료로 시작' : '구독하기'}
      </button>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
            {(review.user_name ?? '?').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-text-primary">{review.user_name}</span>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
      <p className="text-xs text-text-muted">
        {new Date(review.created_at).toLocaleDateString('ko-KR')}
      </p>
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs text-text-secondary">
      <span className="w-3 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-warning rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-6 text-right flex-shrink-0">{count}</span>
    </div>
  );
}

function RelatedSkillCard({ skill }: { skill: RelatedSkill }) {
  const title = skill.skill_name || skill.name || '이름 없음';
  const categoryLabel = CATEGORY_LABELS[skill.category] ?? '기타';
  const isFree = !skill.price || skill.price === 0;

  return (
    <Link
      href={`/marketplace/${encodeURIComponent(skill.id)}`}
      className={clsx(
        'flex items-center gap-3 p-3 rounded-lg border border-border',
        'hover:border-primary/40 hover:bg-surface-hover',
        'transition-colors cursor-pointer',
      )}
    >
      <div className="w-9 h-9 rounded-md bg-primary/15 flex items-center justify-center text-lg flex-shrink-0">
        🤖
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
        <p className="text-xs text-text-muted">{categoryLabel}</p>
      </div>
      <span
        className={clsx(
          'text-xs font-bold flex-shrink-0',
          isFree ? 'text-success' : 'text-warning',
        )}
      >
        {isFree ? '무료' : `${skill.price?.toLocaleString()}cr`}
      </span>
    </Link>
  );
}

// ── 메인 클라이언트 컴포넌트 ──────────────────────────────────────

export default function MarketplaceDetailClient({ skill }: { skill: SkillDetail }) {
  const router = useRouter();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const title = skill.skill_name || skill.name || '이름 없음';
  const creatorName = skill.creator_name || skill.author || '알 수 없음';
  const categoryLabel = CATEGORY_LABELS[skill.category] ?? skill.category ?? '기타';
  const rating = skill.rating ?? 0;
  const ratingCount = skill.rating_count ?? 0;
  const plans = skill.plans && skill.plans.length > 0 ? skill.plans : DEFAULT_PLANS;
  const reviews = skill.reviews ?? [];
  const related = skill.related ?? [];
  const tags = skill.tags ?? [];

  // 별점 분포 계산 (리뷰에서)
  const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    ratingDistribution[star] = (ratingDistribution[star] ?? 0) + 1;
  });

  async function handleSubscribe(planId: string) {
    // 로그인 확인 (localStorage 기반)
    const authToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('sb-hlpovizxnrnspobddxmq-auth-token')
        : null;

    if (!authToken) {
      router.push(`/login?redirect=/marketplace/${encodeURIComponent(skill.id)}`);
      return;
    }

    setIsSubscribing(true);
    try {
      const parsed = JSON.parse(authToken);
      const token = parsed?.access_token ?? parsed?.session?.access_token ?? null;

      const res = await fetch('/api/Backend_APIs/marketplace?action=subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ skill_id: skill.id, plan_id: planId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      alert('구독이 완료되었습니다!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '구독에 실패했습니다.';
      alert(msg);
    } finally {
      setIsSubscribing(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* 뒤로가기 */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <span>&larr;</span>
        <span>마켓플레이스로 돌아가기</span>
      </Link>

      {/* 헤더 섹션 */}
      <div className="flex flex-col sm:flex-row gap-5 p-6 bg-surface border border-border rounded-xl">
        {/* 아바타 (대형) */}
        <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center text-4xl flex-shrink-0">
          🤖
        </div>

        <div className="flex-1 min-w-0">
          {/* 이름 + 카테고리 뱃지 */}
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-text-primary leading-tight">{title}</h1>
            <span className="mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary/80 flex-shrink-0">
              {categoryLabel}
            </span>
          </div>

          {/* 크리에이터 */}
          <p className="mt-1 text-sm text-text-secondary">
            by <span className="font-medium text-text-primary">{creatorName}</span>
          </p>

          {/* 별점 + 설치수 */}
          <div className="mt-2 flex items-center gap-4 flex-wrap">
            {rating > 0 && (
              <div className="flex items-center gap-1.5">
                <StarRating rating={rating} size="md" />
                <span className="text-sm text-text-secondary">
                  {rating.toFixed(1)} ({ratingCount.toLocaleString()})
                </span>
              </div>
            )}
            <span className="text-sm text-text-muted">
              ↓ {(skill.install_count ?? 0).toLocaleString()} 설치
            </span>
          </div>

          {/* 한 줄 소개 */}
          <p className="mt-3 text-sm text-text-secondary leading-relaxed">{skill.description}</p>
        </div>
      </div>

      {/* 본문 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 왼쪽: 상세 정보 (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* 상세 설명 */}
          {skill.long_description && (
            <section className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-3">상세 설명</h2>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {skill.long_description}
              </p>
            </section>
          )}

          {/* 태그 */}
          {tags.length > 0 && (
            <section className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-3">태그</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-bg-subtle border border-border text-text-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 리뷰 섹션 */}
          <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary">
                리뷰 ({ratingCount.toLocaleString()})
              </h2>
            </div>

            {/* 별점 분포 */}
            {ratingCount > 0 && (
              <div className="flex gap-6 flex-wrap">
                {/* 평균 별점 */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-4xl font-extrabold text-text-primary">
                    {rating.toFixed(1)}
                  </span>
                  <StarRating rating={rating} size="md" />
                  <span className="text-xs text-text-muted">{ratingCount}개 리뷰</span>
                </div>

                {/* 분포 바 */}
                <div className="flex-1 min-w-48 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <RatingBar
                      key={star}
                      label={String(star)}
                      count={ratingDistribution[star] ?? 0}
                      total={reviews.length}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 리뷰 목록 */}
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                {reviews.length > 5 && (
                  <p className="text-center text-sm text-text-muted pt-2">
                    외 {reviews.length - 5}개 리뷰
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-text-muted">
                아직 리뷰가 없습니다.
              </div>
            )}
          </section>
        </div>

        {/* 오른쪽: 구독 플랜 (1/3) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-text-primary">구독 플랜</h2>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={handleSubscribe}
              isLoading={isSubscribing}
            />
          ))}
        </div>
      </div>

      {/* 관련 스킬 추천 */}
      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">관련 스킬</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {related.slice(0, 6).map((s) => (
              <RelatedSkillCard key={s.id} skill={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
