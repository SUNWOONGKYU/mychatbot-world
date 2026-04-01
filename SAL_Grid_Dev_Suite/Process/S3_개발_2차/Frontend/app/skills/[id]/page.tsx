/**
 * @task S3FE2
 * @description 스킬 상세 페이지 — 설명/평점/리뷰 목록/설치·실행 버튼
 * Route: /skills/[id]
 * API:
 *   GET  /api/skills/[id]
 *   POST /api/skills/install   { skill_id }
 *   DELETE /api/skills/install { skill_id }
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { SkillRunner } from '@/components/skills/skill-runner';
import { ReviewForm } from '@/components/skills/review-form';

// ── 타입 ────────────────────────────────────────────────────────

interface SkillDetail {
  id: string;
  name: string;
  description: string;
  long_description: string;
  author: string;
  author_id: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  rating_count: number;
  install_count: number;
  is_free: boolean;
  tags: string[];
  thumbnail_url: string | null;
  version: string;
  parameters: SkillParameter[];
  is_installed: boolean;
  created_at: string;
  updated_at: string;
}

interface SkillParameter {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  default_value?: string;
}

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

type ActiveTab = 'overview' | 'reviews' | 'run';

// ── 서브 컴포넌트 ────────────────────────────────────────────────

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const starSize = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={clsx(starSize, i < Math.round(rating) ? 'text-warning' : 'text-bg-muted')}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
            {review.user_name.charAt(0).toUpperCase()}
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

// ── 메인 페이지 ────────────────────────────────────────────────

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const skillId = params.id;

  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // 스킬 상세 로딩
  const fetchSkill = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/skills/${skillId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSkill(data?.skill ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '스킬 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [skillId]);

  // 리뷰 로딩
  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/skills/${skillId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data?.reviews ?? data ?? []);
      }
    } catch {
      // 리뷰 로딩 실패는 조용히 처리
    } finally {
      setReviewsLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    fetchSkill();
    fetchReviews();
  }, [fetchSkill, fetchReviews]);

  // 설치 핸들러
  const handleInstall = async () => {
    if (!skill) return;
    setInstalling(true);
    setInstallError(null);
    try {
      const res = await fetch('/api/skills/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skill.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // 결제 필요한 경우 결제 플로우로 이동
        if (res.status === 402) {
          router.push(`/payment?skill_id=${skill.id}&price=${skill.price}`);
          return;
        }
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setSkill((prev) => prev ? { ...prev, is_installed: true } : prev);
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : '설치에 실패했습니다.');
    } finally {
      setInstalling(false);
    }
  };

  // 제거 핸들러
  const handleUninstall = async () => {
    if (!skill || !confirm('이 스킬을 제거하시겠습니까?')) return;
    setInstalling(true);
    setInstallError(null);
    try {
      const res = await fetch('/api/skills/install', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skill.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setSkill((prev) => prev ? { ...prev, is_installed: false } : prev);
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : '제거에 실패했습니다.');
    } finally {
      setInstalling(false);
    }
  };

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'overview', label: '개요' },
    { id: 'reviews', label: `리뷰 (${reviews.length})` },
    ...(skill?.is_installed ? [{ id: 'run' as ActiveTab, label: '실행' }] : []),
  ];

  // ── 로딩 상태 ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-bg-muted rounded w-1/4" />
        <div className="h-8 bg-bg-muted rounded w-2/3" />
        <div className="h-4 bg-bg-muted rounded w-full" />
        <div className="h-4 bg-bg-muted rounded w-3/4" />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <span className="text-5xl mb-4">⚠️</span>
        <h2 className="text-lg font-semibold text-text-primary mb-1">스킬을 불러오지 못했습니다</h2>
        <p className="text-sm text-text-secondary mb-4">{error}</p>
        <button
          onClick={fetchSkill}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // ── 메인 렌더 ─────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/skills" className="hover:text-primary transition-colors">
          스킬 마켓
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{skill.category}</span>
        <span>/</span>
        <span className="text-text-primary truncate">{skill.name}</span>
      </nav>

      {/* 스킬 헤더 카드 */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* 아이콘 */}
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            {skill.thumbnail_url ? (
              <img
                src={skill.thumbnail_url}
                alt={skill.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <span className="text-3xl">⚡</span>
            )}
          </div>

          {/* 메타 */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-text-primary">{skill.name}</h1>
                <p className="text-sm text-text-secondary mt-0.5">by {skill.author}</p>
              </div>
              <span
                className={clsx(
                  'text-xs font-medium px-2 py-1 rounded-full shrink-0',
                  'bg-primary/10 text-primary',
                )}
              >
                {skill.category}
              </span>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">{skill.description}</p>

            {/* 통계 */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <StarRating rating={skill.rating} size="sm" />
                <span className="text-text-secondary">
                  {skill.rating.toFixed(1)} ({skill.rating_count.toLocaleString()}개 리뷰)
                </span>
              </div>
              <span className="text-text-muted">
                설치 {skill.install_count.toLocaleString()}회
              </span>
              <span className="text-text-muted">v{skill.version}</span>
            </div>

            {/* 태그 */}
            {skill.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full border border-border text-text-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 액션 영역 */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
          <div>
            <span className="text-2xl font-bold text-text-primary">
              {skill.is_free ? (
                <span className="text-success">무료</span>
              ) : (
                `${skill.price.toLocaleString()} ${skill.currency}`
              )}
            </span>
            {!skill.is_free && (
              <p className="text-xs text-text-muted mt-0.5">1회 구매 후 영구 사용</p>
            )}
          </div>

          <div className="flex gap-3">
            {skill.is_installed ? (
              <>
                <button
                  onClick={() => setActiveTab('run')}
                  className={clsx(
                    'px-5 py-2.5 rounded-lg text-sm font-medium',
                    'bg-primary text-white',
                    'hover:bg-primary-hover transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  )}
                >
                  실행하기
                </button>
                <button
                  onClick={handleUninstall}
                  disabled={installing}
                  className={clsx(
                    'px-4 py-2.5 rounded-lg text-sm font-medium',
                    'border border-border text-text-secondary',
                    'hover:bg-surface-hover transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {installing ? '처리 중...' : '제거'}
                </button>
              </>
            ) : (
              <button
                onClick={handleInstall}
                disabled={installing}
                className={clsx(
                  'px-6 py-2.5 rounded-lg text-sm font-semibold',
                  'bg-primary text-white',
                  'hover:bg-primary-hover transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {installing ? '설치 중...' : skill.is_free ? '설치하기' : '구매 및 설치'}
              </button>
            )}
          </div>
        </div>

        {installError && (
          <p className="mt-2 text-sm text-error">{installError}</p>
        )}
      </div>

      {/* 탭 */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'overview' && (
        <div className="prose prose-sm max-w-none text-text-primary">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-base font-semibold text-text-primary mb-3">상세 설명</h2>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {skill.long_description || skill.description}
            </p>
          </div>

          {skill.parameters.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 mt-4">
              <h2 className="text-base font-semibold text-text-primary mb-3">입력 파라미터</h2>
              <div className="space-y-2">
                {skill.parameters.map((param) => (
                  <div
                    key={param.name}
                    className="flex items-start gap-3 text-sm py-2 border-b border-border last:border-0"
                  >
                    <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded text-xs">
                      {param.name}
                    </code>
                    <div>
                      <span className="text-text-primary font-medium">{param.label}</span>
                      {param.required && (
                        <span className="ml-1.5 text-xs text-error">필수</span>
                      )}
                      {param.placeholder && (
                        <p className="text-text-muted text-xs mt-0.5">{param.placeholder}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {/* 평점 요약 */}
          <div className="rounded-xl border border-border bg-surface p-5 flex items-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-text-primary">{skill.rating.toFixed(1)}</p>
              <StarRating rating={skill.rating} size="lg" />
              <p className="text-xs text-text-muted mt-1">
                {skill.rating_count.toLocaleString()}개 리뷰
              </p>
            </div>
          </div>

          {/* 리뷰 작성 버튼 */}
          {skill.is_installed && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className={clsx(
                'w-full py-3 rounded-lg text-sm font-medium border-2 border-dashed',
                'border-border text-text-secondary',
                'hover:border-primary/40 hover:text-primary transition-colors',
              )}
            >
              {showReviewForm ? '리뷰 작성 취소' : '+ 리뷰 작성하기'}
            </button>
          )}

          {showReviewForm && (
            <ReviewForm
              skillId={skill.id}
              onSuccess={() => {
                setShowReviewForm(false);
                fetchReviews();
              }}
            />
          )}

          {/* 리뷰 목록 */}
          {reviewsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border rounded-lg p-4 animate-pulse space-y-2">
                  <div className="h-4 bg-bg-muted rounded w-1/4" />
                  <div className="h-3 bg-bg-muted rounded w-full" />
                  <div className="h-3 bg-bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">아직 리뷰가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'run' && skill.is_installed && (
        <SkillRunner skillId={skill.id} skillName={skill.name} parameters={skill.parameters} />
      )}
    </div>
  );
}
