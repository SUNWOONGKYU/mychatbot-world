/**
 * @task S7FE7
 * @description 채용 공고 상세 페이지 (S7 리디자인 — Semantic 토큰)
 *
 * Vanilla 원본: job-detail.js (DetailPage, HirePage, MatchPage)
 *              css/job-detail.css
 *
 * Route: /jobs/[id]
 * - 채용공고(job_postings): title, description, required_skills, budget, status
 * - 코코봇 지원하기 버튼 (매칭 신청)
 * - 리뷰 목록 (5개씩 더보기)
 * - 평점 분포 막대
 * - 매칭 결과 섹션
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ── 타입 ─────────────────────────────────────────────────────

interface JobPosting {
  id: string;
  employer_id: string;
  title: string;
  description: string | null;
  required_skills: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  status: 'open' | 'closed' | 'filled';
  created_at: string;
  updated_at: string;
}

interface Review {
  id: string;
  author_name: string;
  rating: number;
  content: string;
  created_at: string;
}

interface MatchItem {
  bot_id: string;
  bot_name: string;
  description: string;
  category: string;
  avatar_url?: string;
  hourly_rate?: number;
  per_job_price?: number;
  rating: number;
  skills: string[];
  match_score: number;
  skill_score: number;
  rating_score: number;
  salary_score: number;
  category_score: number;
}

// ── 상수 ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  open: '모집 중',
  closed: '마감',
  filled: '채용 완료',
};

// S7 Semantic 토큰 기반 상태 스타일 (CSS 변수)
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  open: {
    background: 'var(--state-success-bg)',
    color: 'var(--state-success-fg)',
    border: '1px solid var(--state-success-border)',
  },
  closed: {
    background: 'var(--surface-2)',
    color: 'var(--text-tertiary)',
    border: '1px solid var(--border-default)',
  },
  filled: {
    background: 'var(--state-info-bg)',
    color: 'var(--state-info-fg)',
    border: '1px solid var(--state-info-border)',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  'customer-service': '고객서비스',
  education: '교육',
  marketing: '마케팅',
  development: '개발',
  etc: '기타',
};

const REVIEWS_PER_PAGE = 5;

// ── 유틸 ─────────────────────────────────────────────────────

function renderStarsFull(rating: number): React.ReactNode {
  const filled = Math.round(rating);
  return (
    <span aria-label={`별점 ${rating}점`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? 'text-amber-400' : 'text-white/20'}>
          {i < filled ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

function fmtNum(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('ko-KR');
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
}

function formatBudget(job: JobPosting): string {
  if (job.budget_min !== null && job.budget_max !== null)
    return `${fmtNum(job.budget_min)}원 ~ ${fmtNum(job.budget_max)}원`;
  if (job.budget_min !== null) return `${fmtNum(job.budget_min)}원 ~`;
  if (job.budget_max !== null) return `~ ${fmtNum(job.budget_max)}원`;
  return '협의 가능';
}

// ── 매칭 결과 카드 ────────────────────────────────────────────

function MatchCard({ match, rank }: { match: MatchItem; rank: number }) {
  const score = Math.round(match.match_score || 0);
  const skillScore = Math.round((match.skill_score || 0) * 100);
  const ratingScore = Math.round((match.rating_score || 0) * 100);
  const salaryScore = Math.round((match.salary_score || 0) * 100);
  const catScore = Math.round((match.category_score || 0) * 100);

  const rankLabel = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}위`;
  const avatarChar = (match.bot_name || '봇').charAt(0).toUpperCase();

  const price = match.hourly_rate
    ? `${fmtNum(match.hourly_rate)}원/시간`
    : match.per_job_price
    ? `${fmtNum(match.per_job_price)}원/건`
    : '협의';

  return (
    <article
      className="rounded-[var(--radius-xl)] overflow-hidden"
      aria-label={`${match.bot_name} 매칭 결과`}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
        opacity: 0,
        transform: 'translateY(12px)',
        animation: `fadeInUp 0.3s ease ${(rank - 1) * 80}ms forwards`,
      }}
    >
      <div className="p-5 flex flex-col sm:flex-row gap-4">
        {/* 순위 */}
        <div className="flex-shrink-0 flex items-start">
          <span className="text-2xl" title={`${rank}위`}>{rankLabel}</span>
        </div>

        {/* 아바타 */}
        <div
          className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: 'var(--state-info-bg)', color: 'var(--state-info-fg)' }}
        >
          {match.avatar_url ? (
            <img src={match.avatar_url} alt={`${match.bot_name} 아바타`} className="w-full h-full object-cover rounded-[var(--radius-xl)]" loading="lazy" />
          ) : avatarChar}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold mb-0.5 [word-break:keep-all]" style={{ color: 'var(--text-primary)' }}>{match.bot_name}</h3>
          <p className="text-sm mb-2 line-clamp-2 [word-break:keep-all]" style={{ color: 'var(--text-tertiary)' }}>{match.description}</p>

          {match.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {match.skills.slice(0, 3).map(s => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 rounded-[var(--radius-full)]"
                  style={{
                    background: 'var(--surface-2)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* 종합 매칭 점수 */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-medium" style={{ color: 'var(--text-tertiary)' }}>종합 매칭 점수</span>
              <span className="font-bold" style={{ color: 'var(--interactive-primary)' }}>{score}%</span>
            </div>
            <div
              className="h-2 rounded-[var(--radius-full)] overflow-hidden"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`매칭 점수 ${score}%`}
              style={{ background: 'var(--surface-2)' }}
            >
              <div
                className="h-full rounded-[var(--radius-full)] transition-all duration-500"
                style={{ width: `${score}%`, background: 'var(--interactive-primary)' }}
              />
            </div>
          </div>

          {/* 세부 점수 */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '스킬', val: skillScore },
              { label: '평점', val: ratingScore },
              { label: '가격', val: salaryScore },
              { label: '카테고리', val: catScore },
            ].map(chip => (
              <span
                key={chip.label}
                className="text-xs px-2 py-0.5 rounded-[var(--radius-full)]"
                style={{ background: 'var(--surface-2)', color: 'var(--text-tertiary)' }}
              >
                {chip.label}{' '}
                <span className="font-semibold" style={{ color: 'var(--interactive-primary)' }}>{chip.val}%</span>
              </span>
            ))}
          </div>
        </div>

        {/* 액션 */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-base font-bold" style={{ color: 'var(--interactive-primary)' }}>{price}</div>
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <span className="text-amber-400">{renderStarsFull(match.rating)}</span>
            <span>{(match.rating || 0).toFixed(1)}</span>
          </div>
          <Link
            href={`/jobs/bot/${match.bot_id}`}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-[var(--radius-xl)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            style={{ background: 'var(--interactive-primary)', color: 'var(--text-inverted)' }}
            aria-label={`${match.bot_name} 선택하기`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            선택하기
          </Link>
        </div>
      </div>
    </article>
  );
}

// ── 리뷰 카드 ─────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <article
      className="rounded-[var(--radius-xl)] p-4"
      style={{ border: '1px solid var(--border-subtle)' }}
      aria-label={`${review.author_name} 리뷰`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-[var(--radius-full)] flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--surface-2)', color: 'var(--interactive-primary)' }}
            aria-hidden="true"
          >
            {(review.author_name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{review.author_name || '익명'}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{fmtDate(review.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          {renderStarsFull(review.rating)}
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{(review.rating || 0).toFixed(1)}</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed [word-break:keep-all]" style={{ color: 'var(--text-secondary)' }}>{review.content}</p>
    </article>
  );
}

// ── 스켈레톤 ─────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-4 pt-4" aria-busy="true" aria-label="공고 로딩 중">
      <div className="h-8 rounded-[var(--radius-md)] w-3/4" style={{ background: 'var(--surface-2)' }} />
      <div className="h-6 rounded-[var(--radius-md)] w-24" style={{ background: 'var(--surface-2)' }} />
      <div className="h-4 rounded-[var(--radius-md)] w-full" style={{ background: 'var(--surface-2)' }} />
      <div className="h-4 rounded-[var(--radius-md)] w-2/3" style={{ background: 'var(--surface-2)' }} />
      <div className="h-4 rounded-[var(--radius-md)] w-4/5" style={{ background: 'var(--surface-2)' }} />
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [job, setJob] = useState<JobPosting | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [showMatches, setShowMatches] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // 공고 로드
  const fetchJob = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '채용 공고를 불러오지 못했습니다.');
      }
      const data = await res.json();
      setJob(data.job ?? data);

      // 페이지 타이틀 업데이트
      if (data.job?.title || data.title) {
        document.title = `${data.job?.title ?? data.title} — 구봇구직 | CoCoBot World`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 리뷰 로드 (job_id 기반)
  const fetchReviews = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/jobs/reviews?job_id=${encodeURIComponent(id)}&limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      setReviews(data.reviews ?? data.data ?? []);
    } catch {
      // 리뷰 로드 실패는 무시
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
    fetchReviews();
  }, [fetchJob, fetchReviews]);

  // 지원하기 — 매칭 신청
  const handleApply = async () => {
    if (!job || applying || applied) return;
    setApplying(true);
    setApplyError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') ?? '' : '';
      const res = await fetch('/api/jobs/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ job_id: job.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '지원에 실패했습니다.');
      }
      setApplied(true);

      // 매칭 결과 로드
      loadMatches(job.id);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setApplying(false);
    }
  };

  // 매칭 결과 로드
  const loadMatches = async (jobId: string) => {
    setMatchLoading(true);
    setShowMatches(true);
    try {
      const res = await fetch(`/api/jobs/match?job_id=${encodeURIComponent(jobId)}`);
      if (!res.ok) throw new Error('매칭 결과 로드 실패');
      const data = await res.json();
      setMatches(data.matches ?? data.data ?? []);
    } catch {
      setMatches([]);
    } finally {
      setMatchLoading(false);
    }
  };

  const visibleReviews = reviews.slice(0, reviewPage * REVIEWS_PER_PAGE);
  const hasMoreReviews = visibleReviews.length < reviews.length;

  // ── 렌더링 ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: 'var(--surface-0)' }}>
        <div className="max-w-3xl mx-auto">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--surface-0)' }}>
        <div className="text-center py-16" role="alert">
          <p className="text-5xl mb-4" aria-hidden="true">😕</p>
          <p className="text-sm mb-4 [word-break:keep-all]" style={{ color: 'var(--text-secondary)' }}>
            {error ?? '채용 공고를 찾을 수 없습니다.'}
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            style={{ color: 'var(--interactive-primary)' }}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--surface-0)' }}>
      {/* 브레드크럼 */}
      <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border-default)' }} className="py-2.5">
        <div className="max-w-[1100px] mx-auto px-6 flex items-center gap-1.5 text-[0.8125rem]" style={{ color: 'var(--text-tertiary)' }}>
          <Link href="/" className="font-medium hover:underline" style={{ color: 'var(--text-link)' }}>홈</Link>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <Link href="/jobs" className="font-medium hover:underline" style={{ color: 'var(--text-link)' }}>구봇구직</Link>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span className="truncate max-w-[200px]">{job.title}</span>
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto px-6 pt-8">
        {/* 뒤로가기 */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded"
          style={{ color: 'var(--text-tertiary)' }}
        >
          ← 목록으로
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 컬럼 */}
          <div className="lg:col-span-2 space-y-5">

            {/* 공고 헤더 카드 */}
            <div
              className="rounded-[var(--radius-2xl)] overflow-hidden"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* 컬러 헤더 */}
              <div className="px-6 pt-6 pb-8" style={{ background: 'var(--interactive-primary)' }}>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-xl font-bold leading-snug flex-1 [word-break:keep-all]" style={{ color: 'var(--text-inverted)' }}>
                    {job.title}
                  </h1>
                  <span
                    className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-[var(--radius-full)]"
                    style={STATUS_STYLE[job.status] ?? STATUS_STYLE.closed}
                  >
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                </div>
              </div>

              {/* 바디 */}
              <div className="px-6 py-5">
                {/* 통계 */}
                <div className="flex flex-wrap gap-6 pb-5 mb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className="text-xl font-black" style={{ color: 'var(--interactive-primary)' }}>{formatBudget(job)}</span>
                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>예산</span>
                  </div>
                  <div className="w-px h-9 self-center" style={{ background: 'var(--border-default)' }} aria-hidden="true" />
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black" style={{ color: 'var(--interactive-primary)' }}>
                      {new Date(job.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>등록일</span>
                  </div>
                  {job.updated_at !== job.created_at && (
                    <>
                      <div className="w-px h-9 self-center" style={{ background: 'var(--border-default)' }} aria-hidden="true" />
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-black" style={{ color: 'var(--interactive-primary)' }}>
                          {new Date(job.updated_at).toLocaleDateString('ko-KR')}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>수정일</span>
                      </div>
                    </>
                  )}
                </div>

                {/* 설명 */}
                {job.description && (
                  <div className="mb-5">
                    <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--interactive-primary)' }} aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" />
                      </svg>
                      공고 설명
                    </h2>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap [word-break:keep-all]" style={{ color: 'var(--text-secondary)' }}>
                      {job.description}
                    </p>
                  </div>
                )}

                {/* 필요 스킬 */}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div>
                    <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--interactive-primary)' }} aria-hidden="true">
                        <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
                      </svg>
                      필요 스킬
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map(skill => (
                        <span
                          key={skill}
                          className="text-sm px-3 py-1 rounded-[var(--radius-full)] transition-colors cursor-default"
                          style={{
                            background: 'var(--surface-2)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-default)',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 매칭 결과 섹션 */}
            {showMatches && (
              <div
                className="rounded-[var(--radius-2xl)] p-5"
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--interactive-primary)' }} aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  AI 매칭 결과
                  {matches.length > 0 && (
                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>
                      ({matches.length}개 코코봇 추천)
                    </span>
                  )}
                </h2>

                {matchLoading ? (
                  <div className="space-y-3" aria-busy="true" aria-label="매칭 결과 로딩 중">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 rounded-[var(--radius-xl)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
                    ))}
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2" aria-hidden="true">🔍</p>
                    <p className="text-sm [word-break:keep-all]" style={{ color: 'var(--text-tertiary)' }}>매칭 결과가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((m, i) => (
                      <MatchCard key={m.bot_id} match={m} rank={i + 1} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 리뷰 섹션 */}
            <div
              className="rounded-[var(--radius-2xl)] p-5"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--interactive-primary)' }} aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                리뷰
                {reviews.length > 0 && (
                  <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>({fmtNum(reviews.length)}개)</span>
                )}
              </h2>

              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2" aria-hidden="true">💬</p>
                  <p className="text-sm [word-break:keep-all]" style={{ color: 'var(--text-tertiary)' }}>아직 리뷰가 없습니다.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3" aria-label="리뷰 목록">
                    {visibleReviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                  {hasMoreReviews && (
                    <button
                      type="button"
                      onClick={() => setReviewPage(p => p + 1)}
                      className="w-full mt-4 py-2.5 rounded-[var(--radius-xl)] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                      style={{
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        background: 'transparent',
                      }}
                    >
                      리뷰 더보기 ({reviews.length - visibleReviews.length}개 남음)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-4">
            {/* 지원하기 카드 */}
            <div
              className="rounded-[var(--radius-2xl)] p-5 sticky top-24"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>지원하기</h2>

              {/* 예산 */}
              <div
                className="flex items-center gap-2 mb-4 p-3 rounded-[var(--radius-xl)]"
                style={{ background: 'var(--state-info-bg)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>예산</span>
                <span className="font-bold text-sm" style={{ color: 'var(--interactive-primary)' }}>{formatBudget(job)}</span>
              </div>

              {/* 정산 안내 (20%) */}
              <div
                className="mb-4 p-3 rounded-[var(--radius-xl)] text-xs [word-break:keep-all]"
                style={{
                  background: 'var(--state-warning-bg)',
                  border: '1px solid var(--state-warning-border)',
                  color: 'var(--state-warning-fg)',
                }}
              >
                <strong>정산 안내:</strong> 플랫폼 수수료 20%가 적용됩니다.<br />
                실수령 예산은 계약 금액의 80%입니다.
              </div>

              {applyError && (
                <p className="text-sm mb-3 [word-break:keep-all]" style={{ color: 'var(--state-danger-fg)' }}>{applyError}</p>
              )}

              {job.status === 'open' ? (
                applied ? (
                  <div className="flex items-center gap-2 text-sm font-medium [word-break:keep-all]" style={{ color: 'var(--state-success-fg)' }}>
                    <span aria-hidden="true">✓</span>
                    <span>지원 완료! AI 매칭 점수를 확인하세요.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={applying}
                    className="w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60 font-semibold rounded-[var(--radius-xl)] transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                    style={{ background: 'var(--interactive-primary)', color: 'var(--text-inverted)' }}
                    id="detailHireLink"
                  >
                    {applying ? (
                      '지원 중...'
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        지원하기
                      </>
                    )}
                  </button>
                )
              ) : (
                <div
                  className="text-center py-3 text-sm rounded-[var(--radius-xl)] [word-break:keep-all]"
                  style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}
                >
                  {STATUS_LABELS[job.status]} 상태로 지원이 불가합니다.
                </div>
              )}

              {/* 매칭 결과 보기 토글 */}
              {!showMatches && applied && (
                <button
                  type="button"
                  onClick={() => setShowMatches(true)}
                  className="w-full mt-2 py-2.5 text-sm font-medium rounded-[var(--radius-xl)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                  style={{
                    border: '1px solid var(--interactive-primary)',
                    color: 'var(--interactive-primary)',
                    background: 'transparent',
                  }}
                >
                  매칭 결과 보기
                </button>
              )}
            </div>

            {/* 정산 상세 안내 */}
            <div
              className="rounded-[var(--radius-2xl)] p-5"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--interactive-primary)' }} aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                </svg>
                정산 구조 (20%)
              </h3>
              <div className="space-y-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <div className="flex justify-between">
                  <span>계약 금액</span>
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatBudget(job)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--state-danger-fg)' }}>
                  <span>플랫폼 수수료 (20%)</span>
                  <span>
                    {job.budget_max !== null
                      ? `−${fmtNum(Math.round((job.budget_max || 0) * 0.2))}원`
                      : '계약 금액의 20%'}
                  </span>
                </div>
                <div
                  className="flex justify-between pt-2 font-semibold text-sm"
                  style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  <span>실수령 금액</span>
                  <span style={{ color: 'var(--interactive-primary)' }}>
                    {job.budget_max !== null
                      ? `${fmtNum(Math.round((job.budget_max || 0) * 0.8))}원`
                      : '협의'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 애니메이션 CSS */}
      <style>{`
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
