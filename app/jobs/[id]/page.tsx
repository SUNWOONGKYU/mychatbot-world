/**
 * @task S3F10 (React 전환)
 * @description 채용 공고 상세 페이지 + 코코봇 상세 라우팅
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

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  closed: 'bg-white/5 text-white/40 border-white/10',
  filled: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
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
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      aria-label={`${match.bot_name} 매칭 결과`}
      style={{ opacity: 0, transform: 'translateY(12px)', animation: `fadeInUp 0.3s ease ${(rank - 1) * 80}ms forwards` }}
    >
      <div className="p-5 flex flex-col sm:flex-row gap-4">
        {/* 순위 */}
        <div className="flex-shrink-0 flex items-start">
          <span className="text-2xl" title={`${rank}위`}>{rankLabel}</span>
        </div>

        {/* 아바타 */}
        <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 flex-shrink-0">
          {match.avatar_url ? (
            <img src={match.avatar_url} alt={`${match.bot_name} 아바타`} className="w-full h-full object-cover rounded-xl" loading="lazy" />
          ) : avatarChar}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 mb-0.5">{match.bot_name}</h3>
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{match.description}</p>

          {match.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {match.skills.slice(0, 3).map(s => (
                <span key={s} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* 종합 매칭 점수 */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-gray-500 font-medium">종합 매칭 점수</span>
              <span className="text-violet-600 font-bold">{score}%</span>
            </div>
            <div
              className="h-2 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`매칭 점수 ${score}%`}
            >
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
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
              <span key={chip.label} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {chip.label} <span className="font-semibold text-violet-600">{chip.val}%</span>
              </span>
            ))}
          </div>
        </div>

        {/* 액션 */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-base font-bold text-violet-600">{price}</div>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span className="text-amber-400">{renderStarsFull(match.rating)}</span>
            <span>{(match.rating || 0).toFixed(1)}</span>
          </div>
          <Link
            href={`/jobs/bot/${match.bot_id}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
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
    <article className="border border-gray-100 rounded-xl p-4" aria-label={`${review.author_name} 리뷰`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-600" aria-hidden="true">
            {(review.author_name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{review.author_name || '익명'}</div>
            <div className="text-xs text-gray-400">{fmtDate(review.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          {renderStarsFull(review.rating)}
          <span className="text-gray-500 font-medium">{(review.rating || 0).toFixed(1)}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
    </article>
  );
}

// ── 스켈레톤 ─────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-4 pt-4">
      <div className="h-8 bg-gray-100 rounded w-3/4" />
      <div className="h-6 bg-gray-100 rounded w-24" />
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
      <div className="h-4 bg-gray-100 rounded w-4/5" />
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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center py-16">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-gray-600 mb-4">{error ?? '채용 공고를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => router.back()}
            className="text-violet-600 hover:underline text-sm"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* 브레드크럼 */}
      <div className="bg-white border-b border-gray-200 py-2.5">
        <div className="max-w-[1100px] mx-auto px-6 flex items-center gap-1.5 text-[0.8125rem] text-gray-500">
          <Link href="/" className="text-violet-600 font-medium hover:underline">홈</Link>
          <span className="text-gray-300">/</span>
          <Link href="/jobs" className="text-violet-600 font-medium hover:underline">구봇구직</Link>
          <span className="text-gray-300">/</span>
          <span className="truncate max-w-[200px]">{job.title}</span>
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto px-6 pt-8">
        {/* 뒤로가기 */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-violet-600 text-sm mb-6 transition-colors"
        >
          ← 목록으로
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 컬럼 */}
          <div className="lg:col-span-2 space-y-5">

            {/* 공고 헤더 카드 */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* 컬러 헤더 */}
              <div className="bg-gradient-to-r from-violet-600 to-teal-500 px-6 pt-6 pb-8">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-xl font-bold text-white leading-snug flex-1">
                    {job.title}
                  </h1>
                  <span className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[job.status]}`}>
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                </div>
              </div>

              {/* 바디 */}
              <div className="px-6 py-5">
                {/* 통계 */}
                <div className="flex flex-wrap gap-6 pb-5 border-b border-gray-100 mb-5">
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className="text-xl font-black text-violet-600">{formatBudget(job)}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">예산</span>
                  </div>
                  <div className="w-px h-9 bg-gray-200 self-center" />
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black text-violet-600">
                      {new Date(job.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="text-xs text-gray-400">등록일</span>
                  </div>
                  {job.updated_at !== job.created_at && (
                    <>
                      <div className="w-px h-9 bg-gray-200 self-center" />
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-violet-600">
                          {new Date(job.updated_at).toLocaleDateString('ko-KR')}
                        </span>
                        <span className="text-xs text-gray-400">수정일</span>
                      </div>
                    </>
                  )}
                </div>

                {/* 설명 */}
                {job.description && (
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-violet-500" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" />
                      </svg>
                      공고 설명
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>
                )}

                {/* 필요 스킬 */}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div>
                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-violet-500" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
                      </svg>
                      필요 스킬
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map(skill => (
                        <span
                          key={skill}
                          className="text-sm bg-gray-50 text-gray-600 px-3 py-1 rounded-full border border-gray-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300 transition-colors cursor-default"
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
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-violet-500" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  AI 매칭 결과
                  {matches.length > 0 && (
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      ({matches.length}개 코코봇 추천)
                    </span>
                  )}
                </h2>

                {matchLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-3xl mb-2">🔍</p>
                    <p className="text-sm">매칭 결과가 없습니다.</p>
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
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-violet-500" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                리뷰
                {reviews.length > 0 && (
                  <span className="text-xs font-normal text-gray-400">({fmtNum(reviews.length)}개)</span>
                )}
              </h2>

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-sm">아직 리뷰가 없습니다.</p>
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
                      onClick={() => setReviewPage(p => p + 1)}
                      className="w-full mt-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-violet-600 hover:border-violet-200 transition-colors"
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
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sticky top-24">
              <h2 className="text-base font-semibold text-gray-900 mb-4">지원하기</h2>

              {/* 예산 */}
              <div className="flex items-center gap-2 mb-4 p-3 bg-violet-50 rounded-xl">
                <span className="text-xs text-gray-500">예산</span>
                <span className="text-violet-600 font-bold text-sm">{formatBudget(job)}</span>
              </div>

              {/* 정산 안내 (20%) */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <strong>정산 안내:</strong> 플랫폼 수수료 20%가 적용됩니다.<br />
                실수령 예산은 계약 금액의 80%입니다.
              </div>

              {applyError && (
                <p className="text-red-500 text-sm mb-3">{applyError}</p>
              )}

              {job.status === 'open' ? (
                applied ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <span>✓</span>
                    <span>지원 완료! AI 매칭 점수를 확인하세요.</span>
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
                    id="detailHireLink"
                  >
                    {applying ? (
                      '지원 중...'
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        지원하기
                      </>
                    )}
                  </button>
                )
              ) : (
                <div className="text-center py-3 text-gray-400 text-sm border border-gray-200 rounded-xl">
                  {STATUS_LABELS[job.status]} 상태로 지원이 불가합니다.
                </div>
              )}

              {/* 매칭 결과 보기 토글 */}
              {!showMatches && applied && (
                <button
                  onClick={() => setShowMatches(true)}
                  className="w-full mt-2 py-2.5 border border-violet-200 text-violet-600 text-sm font-medium rounded-xl hover:bg-violet-50 transition-colors"
                >
                  매칭 결과 보기
                </button>
              )}
            </div>

            {/* 정산 상세 안내 */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-violet-500" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                </svg>
                정산 구조 (20%)
              </h3>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>계약 금액</span>
                  <span className="font-medium text-gray-700">{formatBudget(job)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>플랫폼 수수료 (20%)</span>
                  <span>
                    {job.budget_max !== null
                      ? `−${fmtNum(Math.round((job.budget_max || 0) * 0.2))}원`
                      : '계약 금액의 20%'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold text-gray-800 text-sm">
                  <span>실수령 금액</span>
                  <span className="text-violet-600">
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
