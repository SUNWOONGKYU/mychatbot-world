/**
 * @task S3F9 (React 전환)
 * @description 구봇구직 메인 페이지 — 구봇 찾기 / 일감 찾기 탭, 카테고리 필터, 정렬, 페이지네이션
 *
 * Vanilla 원본: pages/jobs/index.html + js/jobs.js + css/jobs.css
 * Route: /jobs
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JsonLd, buildCollectionPage, buildBreadcrumb } from '@/components/seo/json-ld';

// ── 타입 ─────────────────────────────────────────────────────

interface BotItem {
  id: string;
  name: string;
  category: string;
  description: string;
  emoji: string;
  rating: number;
  reviewCount: number;
  price: number;
  skills: string[];
  isNew: boolean;
  isFeatured: boolean;
}

interface JobItem {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: number;
  requiredSkills: string[];
  deadline: string | null;
  status: string;
}

type TabType = 'bot' | 'job';
type BotSort = 'popular' | 'latest' | 'rating' | 'price-low' | 'price-high';
type JobSort = 'latest' | 'budget-high' | 'budget-low' | 'deadline';

// ── 상수 ─────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12;

const CATEGORY_LABELS: Record<string, string> = {
  all: '전체',
  'customer-service': '고객서비스',
  education: '교육',
  marketing: '마케팅',
  development: '개발',
  etc: '기타',
};

const CATEGORIES = ['all', 'customer-service', 'education', 'marketing', 'development', 'etc'];

const CATEGORY_COLORS: Record<string, string> = {
  'customer-service': 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  education: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  marketing: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
  development: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
  etc: 'bg-white/[0.06] text-white/50 border-white/10',
};

// ── 데모 데이터 (Supabase 연결 실패 시 폴백) ─────────────────

function getMockBots(category: string, sort: BotSort): BotItem[] {
  const all: BotItem[] = [
    { id: 'b1', name: '고객응대 도우미', category: 'customer-service', description: '24시간 고객 문의를 자동으로 처리하는 스마트 코코봇입니다.', emoji: '🤖', rating: 4.8, reviewCount: 1234, price: 29000, skills: ['NLP', '다국어', 'API연동'], isNew: false, isFeatured: true },
    { id: 'b2', name: '영어 튜터봇', category: 'education', description: '개인 맞춤형 영어 학습 플랜을 제공하는 AI 튜터입니다.', emoji: '📚', rating: 4.6, reviewCount: 892, price: 19000, skills: ['교육', '언어학습', '퀴즈'], isNew: true, isFeatured: false },
    { id: 'b3', name: '마케팅 어시스턴트', category: 'marketing', description: 'SNS 콘텐츠와 광고 문구를 자동으로 생성해드립니다.', emoji: '📣', rating: 4.5, reviewCount: 567, price: 49000, skills: ['콘텐츠생성', 'SNS', '카피라이팅'], isNew: false, isFeatured: false },
    { id: 'b4', name: '코딩 도우미', category: 'development', description: '코드 리뷰, 디버깅, 문서화를 도와드립니다.', emoji: '💻', rating: 4.9, reviewCount: 2341, price: 39000, skills: ['코드리뷰', '디버깅', 'Git'], isNew: false, isFeatured: true },
    { id: 'b5', name: '예약 관리 봇', category: 'customer-service', description: '식당, 미용실, 병원 예약을 자동으로 관리합니다.', emoji: '📅', rating: 4.3, reviewCount: 456, price: 15000, skills: ['예약', '알림', '캘린더'], isNew: true, isFeatured: false },
    { id: 'b6', name: '수학 튜터봇', category: 'education', description: '초등부터 대학 수준까지 수학 문제를 단계별로 풀어드립니다.', emoji: '🔢', rating: 4.7, reviewCount: 789, price: 25000, skills: ['수학', '단계별설명', '문제생성'], isNew: false, isFeatured: false },
    { id: 'b7', name: '이메일 작성 봇', category: 'marketing', description: '상황에 맞는 이메일 템플릿을 즉시 생성합니다.', emoji: '✉️', rating: 4.2, reviewCount: 321, price: 9000, skills: ['이메일', '템플릿', '번역'], isNew: false, isFeatured: false },
    { id: 'b8', name: '회의록 작성봇', category: 'etc', description: '음성/텍스트 회의 내용을 정리하고 요약합니다.', emoji: '📝', rating: 4.4, reviewCount: 678, price: 35000, skills: ['요약', '음성인식', '일정관리'], isNew: true, isFeatured: false },
    { id: 'b9', name: 'HR 어시스턴트', category: 'etc', description: '채용 공고 작성부터 면접 질문 생성까지 HR 업무를 지원합니다.', emoji: '👥', rating: 4.1, reviewCount: 234, price: 0, skills: ['채용', '면접', '평가'], isNew: false, isFeatured: false },
  ];

  let filtered = category === 'all' ? all : all.filter(b => b.category === category);

  if (sort === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  else if (sort === 'latest') filtered = [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  else if (sort === 'price-low') filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') filtered = [...filtered].sort((a, b) => b.price - a.price);
  else filtered = [...filtered].sort((a, b) => b.reviewCount - a.reviewCount);

  return filtered;
}

function getMockJobs(category: string): JobItem[] {
  const all: JobItem[] = [
    { id: 'j1', title: '쇼핑몰 고객응대 코코봇 개발', category: 'customer-service', description: '온라인 쇼핑몰의 FAQs, 반품/교환 처리를 자동화할 코코봇이 필요합니다.', budget: 500000, requiredSkills: ['NLP', 'Shopify연동', 'FAQ처리'], deadline: new Date(Date.now() + 7 * 86400000).toISOString(), status: 'open' },
    { id: 'j2', title: '영어회화 학습 AI 개발', category: 'education', description: '초등학생 대상 영어 회화 연습 코코봇입니다. 발음 교정 기능 포함.', budget: 800000, requiredSkills: ['음성인식', '발음교정', '게이미피케이션'], deadline: new Date(Date.now() + 14 * 86400000).toISOString(), status: 'open' },
    { id: 'j3', title: 'SNS 마케팅 봇 제작', category: 'marketing', description: '인스타그램/트위터에 자동으로 콘텐츠를 생성하고 포스팅하는 봇.', budget: 300000, requiredSkills: ['SNS API', '콘텐츠생성', '스케줄링'], deadline: new Date(Date.now() + 3 * 86400000).toISOString(), status: 'open' },
  ];
  return category === 'all' ? all : all.filter(j => j.category === category);
}

// ── 유틸 ─────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price === 0) return '무료';
  if (!price) return '협의';
  return `₩${price.toLocaleString('ko-KR')}`;
}

function calcDaysLeft(deadline: string | null): number {
  if (!deadline) return 99;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return '★'.repeat(full) + '☆'.repeat(empty);
}

// ── 서브컴포넌트 ─────────────────────────────────────────────

function BotCard({ bot }: { bot: BotItem }) {
  const catColor = CATEGORY_COLORS[bot.category] || CATEGORY_COLORS.etc;
  const catLabel = CATEGORY_LABELS[bot.category] || bot.category;

  return (
    <Link href={`/jobs/bot/${bot.id}`} className="block group">
      <article
        className="flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: 'rgb(var(--bg-surface))',
          border: '1.5px solid rgb(var(--border))',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--color-primary) / 0.5)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
        aria-label={`${bot.name} 코코봇`}
      >
        {/* 카드 헤더 */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgb(var(--color-primary) / 0.12)' }}
          >
            {bot.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <span className={`text-[0.7rem] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
                {catLabel}
              </span>
              {bot.isNew && (
                <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  NEW
                </span>
              )}
              {bot.isFeatured && (
                <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  추천
                </span>
              )}
            </div>
            <h3
              className="text-base font-bold leading-snug"
              style={{ color: 'rgb(var(--text-primary-rgb))' }}
            >{bot.name}</h3>
          </div>
        </div>

        {/* 설명 */}
        <p
          className="text-[0.825rem] leading-relaxed line-clamp-2"
          style={{ color: 'rgb(var(--text-secondary-rgb))' }}
        >
          {bot.description}
        </p>

        {/* 스킬 태그 */}
        {bot.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {bot.skills.slice(0, 3).map(s => (
              <span
                key={s}
                className="text-[0.7rem] font-semibold px-2 py-0.5"
                style={{
                  borderRadius: 'var(--radius-full)',
                  background: 'rgb(var(--color-primary) / 0.1)',
                  color: 'rgb(var(--color-primary))',
                  border: '1px solid rgb(var(--color-primary) / 0.2)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* 하단 메타 */}
        <div className="flex items-center justify-between text-xs mt-auto pt-1" style={{ color: 'rgb(var(--text-muted))' }}>
          <div className="flex items-center gap-1.5">
            <span aria-label={`평점 ${bot.rating}점`} style={{ color: 'rgb(var(--color-accent))' }}>
              {renderStars(bot.rating)}
            </span>
            <span>{bot.rating.toFixed(1)}</span>
            <span>({bot.reviewCount.toLocaleString('ko-KR')})</span>
          </div>
          <div className="text-right">
            <span className="text-[0.7rem] mr-0.5">월</span>
            <span className="font-medium" style={{ color: 'rgb(var(--text-secondary-rgb))' }}>{formatPrice(bot.price)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function JobCard({ job }: { job: JobItem }) {
  const catColor = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.etc;
  const catLabel = CATEGORY_LABELS[job.category] || job.category;
  const daysLeft = calcDaysLeft(job.deadline);
  const isUrgent = daysLeft <= 3;

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <article
        className="flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: 'rgb(var(--bg-surface))',
          border: '1.5px solid rgb(var(--border))',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--color-accent) / 0.5)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgb(var(--color-accent) / 0.12)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
        aria-label={`일감: ${job.title}`}
      >
        {/* 헤더 */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[0.7rem] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
            {catLabel}
          </span>
          {isUrgent && (
            <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              마감임박
            </span>
          )}
        </div>

        {/* 제목 */}
        <h3
          className="text-base font-bold leading-snug line-clamp-2"
          style={{ color: 'rgb(var(--text-primary-rgb))' }}
        >
          {job.title}
        </h3>

        {/* 설명 */}
        <p
          className="text-[0.825rem] leading-relaxed line-clamp-2"
          style={{ color: 'rgb(var(--text-secondary-rgb))' }}
        >
          {job.description}
        </p>

        {/* 스킬 */}
        {job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.requiredSkills.slice(0, 4).map(s => (
              <span
                key={s}
                className="text-[0.7rem] font-semibold px-2 py-0.5"
                style={{
                  borderRadius: 'var(--radius-full)',
                  background: 'rgb(var(--color-accent) / 0.1)',
                  color: 'rgb(var(--color-accent))',
                  border: '1px solid rgb(var(--color-accent) / 0.2)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* 하단 메타 */}
        <div className="flex items-center justify-between text-xs mt-auto pt-1">
          <div className="font-medium" style={{ color: 'rgb(var(--text-secondary-rgb))' }}>
            예산: <strong style={{ color: 'rgb(var(--color-accent))' }}>{formatPrice(job.budget)}</strong>
          </div>
          <div
            className="font-semibold"
            style={{ color: isUrgent ? 'rgb(var(--color-error))' : 'rgb(var(--text-muted))' }}
          >
            {daysLeft >= 0 ? `마감 D-${daysLeft}` : '마감'}
          </div>
        </div>
      </article>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div
      className="h-[200px] animate-pulse"
      style={{
        background: 'rgb(var(--bg-surface))',
        border: '1.5px solid rgb(var(--border))',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
      }}
    >
      <div className="flex gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl" style={{ background: 'rgb(var(--bg-muted))' }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded w-20" style={{ background: 'rgb(var(--bg-muted))' }} />
          <div className="h-5 rounded w-3/4" style={{ background: 'rgb(var(--bg-muted))' }} />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 rounded" style={{ background: 'rgb(var(--bg-muted))' }} />
        <div className="h-3 rounded w-4/5" style={{ background: 'rgb(var(--bg-muted))' }} />
      </div>
      <div className="flex gap-1.5">
        <div className="h-4 rounded-full w-12" style={{ background: 'rgb(var(--bg-muted))' }} />
        <div className="h-4 rounded-full w-16" style={{ background: 'rgb(var(--bg-muted))' }} />
        <div className="h-4 rounded-full w-10" style={{ background: 'rgb(var(--bg-muted))' }} />
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const PAGE_WINDOW = 5;
  const half = Math.floor(PAGE_WINDOW / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + PAGE_WINDOW - 1);
  if (end - start + 1 < PAGE_WINDOW) start = Math.max(1, end - PAGE_WINDOW + 1);

  const pages: (number | '...')[] = [];
  if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }

  return (
    <nav className="flex justify-center items-center gap-2 mt-8" aria-label="페이지 탐색">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="w-9 h-9 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        style={{
          borderRadius: 'var(--radius-lg)',
          background: 'rgb(var(--bg-surface))',
          border: '1px solid rgb(var(--border))',
          color: 'rgb(var(--text-secondary-rgb))',
        }}
        aria-label="이전 페이지"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <div className="flex gap-1">
        {pages.map((p, i) =>
          p === '...' ? (
            <span
              key={`dots-${i}`}
              className="w-9 h-9 flex items-center justify-center text-sm"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-current={p === currentPage ? 'page' : undefined}
              aria-label={`${p}페이지${p === currentPage ? ' (현재)' : ''}`}
              className="w-9 h-9 text-sm font-medium transition-all"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: p === currentPage ? 'rgb(var(--color-primary) / 0.15)' : 'transparent',
                color: p === currentPage ? 'rgb(var(--color-primary))' : 'rgb(var(--text-muted))',
              }}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="w-9 h-9 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        style={{
          borderRadius: 'var(--radius-lg)',
          background: 'rgb(var(--bg-surface))',
          border: '1px solid rgb(var(--border))',
          color: 'rgb(var(--text-secondary-rgb))',
        }}
        aria-label="다음 페이지"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </nav>
  );
}

function EmptyState({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="text-center py-16" role="status">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
        아직 등록된 {label}가 없습니다
      </h3>
      <p style={{ color: 'rgb(var(--text-secondary-rgb))' }}>
        곧 업데이트될 예정입니다.
      </p>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────

export default function JobsPage() {
  const router = useRouter();

  // 탭
  const [activeTab, setActiveTab] = useState<TabType>('bot');

  // 카테고리
  const [category, setCategory] = useState('all');

  // 구봇 탭 상태
  const [bots, setBots] = useState<BotItem[]>([]);
  const [botTotal, setBotTotal] = useState(0);
  const [botPage, setBotPage] = useState(1);
  const [botSort, setBotSort] = useState<BotSort>('popular');
  const [botLoading, setBotLoading] = useState(true);
  const [botDemo, setBotDemo] = useState(false);

  // 일감 탭 상태
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobPage, setJobPage] = useState(1);
  const [jobSort, setJobSort] = useState<JobSort>('latest');
  const [jobLoading, setJobLoading] = useState(false);
  const [jobLoaded, setJobLoaded] = useState(false);
  const [jobDemo, setJobDemo] = useState(false);

  // 검색
  const [searchInput, setSearchInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── 구봇 로드 ─────────────────────────────────────────────

  const loadBots = useCallback(async () => {
    setBotLoading(true);
    setBotDemo(false);
    try {
      // Supabase mcw_bots 직접 조회 시도
      const params = new URLSearchParams({
        type: 'bot',
        category: category === 'all' ? '' : category,
        sort: botSort,
        limit: String(ITEMS_PER_PAGE),
        offset: String((botPage - 1) * ITEMS_PER_PAGE),
      });

      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error('API 오류');

      const data = await res.json();
      setBots(data.items ?? []);
      setBotTotal(data.total ?? 0);
    } catch {
      // 폴백: 데모 데이터
      setBotDemo(true);
      const mock = getMockBots(category, botSort);
      setBots(mock);
      setBotTotal(mock.length);
    } finally {
      setBotLoading(false);
    }
  }, [category, botSort, botPage]);

  // ── 일감 로드 ─────────────────────────────────────────────

  const loadJobs = useCallback(async () => {
    setJobLoading(true);
    setJobDemo(false);
    try {
      const params = new URLSearchParams({
        status: 'open',
        limit: String(ITEMS_PER_PAGE),
        offset: String((jobPage - 1) * ITEMS_PER_PAGE),
      });

      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error('API 오류');

      const data = await res.json();
      const items: JobItem[] = (data.jobs ?? []).map((j: any) => ({
        id: j.id,
        title: j.title,
        category: 'etc',
        description: j.description || '',
        budget: j.budget_max || j.budget_min || 0,
        requiredSkills: j.required_skills || [],
        deadline: null,
        status: j.status,
      }));
      setJobs(items);
      setJobTotal(data.total ?? data.pagination?.total ?? 0);
    } catch {
      setJobDemo(true);
      const mock = getMockJobs(category);
      setJobs(mock);
      setJobTotal(mock.length);
    } finally {
      setJobLoading(false);
      setJobLoaded(true);
    }
  }, [category, jobPage, jobSort]);

  // 구봇 초기/조건 로드
  useEffect(() => {
    loadBots();
  }, [loadBots]);

  // 일감 탭 진입 시 로드 (최초 1회)
  useEffect(() => {
    if (activeTab === 'job' && !jobLoaded) {
      loadJobs();
    }
  }, [activeTab, jobLoaded, loadJobs]);

  // 탭 전환
  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'job' && !jobLoaded) {
      loadJobs();
    }
  };

  // 카테고리 변경 시 페이지 초기화
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setBotPage(1);
    setJobPage(1);
    setJobLoaded(false);
  };

  // 구봇 정렬 변경
  const handleBotSortChange = (sort: BotSort) => {
    setBotSort(sort);
    setBotPage(1);
  };

  // 일감 정렬 변경
  const handleJobSortChange = (sort: JobSort) => {
    setJobSort(sort);
    setJobPage(1);
    setJobLoaded(false);
  };

  // 검색 제출
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const kw = searchInput.trim();
    if (!kw) return;
    router.push(`/jobs/search?q=${encodeURIComponent(kw)}`);
  };

  const botTotalPages = Math.ceil(botTotal / ITEMS_PER_PAGE);
  const jobTotalPages = Math.ceil(jobTotal / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg-base))' }}>
      {/* S8FE3 — JSON-LD */}
      <JsonLd data={buildCollectionPage({
        name: '구봇구직',
        description: 'AI 챗봇 구인·구직 마켓. 필요한 봇을 찾고 일감을 매칭하세요.',
        url: '/jobs',
      })} />
      <JsonLd data={buildBreadcrumb([
        { name: '홈', url: '/' },
        { name: '구봇구직', url: '/jobs' },
      ])} />
      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-16 px-6 text-center"
        style={{ background: 'rgb(var(--bg-subtle))' }}
      >
        {/* 배경 그라데이션 오브 */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[80px]"
            style={{ background: 'rgb(var(--color-primary) / 0.1)' }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'rgb(var(--text-primary-rgb))' }}
          >
            <span style={{ color: 'rgb(var(--color-primary))' }}>구봇구직</span>
          </h1>
          <p className="text-lg mb-10" style={{ color: 'rgb(var(--text-secondary-rgb))' }}>
            코코봇을 고용하거나, 코코봇에 일감을 찾아보세요.<br />
            최적의 코코봇과 프로젝트를 매칭합니다.
          </p>

          {/* 검색 폼 */}
          <form
            onSubmit={handleSearch}
            role="search"
            className="relative max-w-2xl mx-auto"
          >
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
              style={{ color: 'rgb(var(--text-muted))' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="코코봇 이름, 기능, 카테고리 검색..."
              autoComplete="off"
              aria-label="코코봇 검색"
              className="w-full pl-12 pr-24 py-4 text-base focus:outline-none transition-all"
              style={{
                background: 'rgb(var(--bg-surface))',
                border: '1.5px solid rgb(var(--border))',
                borderRadius: 'var(--radius-3xl)',
                color: 'rgb(var(--text-primary-rgb))',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgb(var(--color-primary))';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgb(var(--color-primary) / 0.12)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgb(var(--border))';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 text-sm font-semibold transition-all"
              style={{
                background: 'rgb(var(--color-primary))',
                color: 'rgb(var(--text-on-primary))',
                borderRadius: 'var(--radius-2xl)',
                border: 'none',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgb(var(--color-primary-hover))';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgb(var(--color-primary))';
              }}
            >
              검색
            </button>
          </form>
        </div>
      </section>

      {/* ── 카테고리 필터바 ───────────────────────────────── */}
      <section
        className="sticky top-16 z-30 backdrop-blur-xl py-3"
        style={{
          background: 'rgb(var(--bg-base) / 0.95)',
          borderBottom: '1px solid rgb(var(--border))',
        }}
        aria-label="카테고리 필터"
      >
        <div className="max-w-[1200px] mx-auto px-6 flex gap-2 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              data-category={cat}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium transition-all whitespace-nowrap"
              style={{
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: category === cat ? 'rgb(var(--color-primary) / 0.5)' : 'rgb(var(--border))',
                background: category === cat ? 'rgb(var(--color-primary) / 0.12)' : 'transparent',
                color: category === cat ? 'rgb(var(--color-primary))' : 'rgb(var(--text-secondary-rgb))',
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </section>

      {/* ── 메인 컨텐츠 ──────────────────────────────────── */}
      <main className="max-w-[1200px] mx-auto px-6 pb-16 pt-8">

        {/* 탭 */}
        <div className="flex gap-2 mb-6" role="tablist" aria-label="구봇구직 탭">
          {/* 구봇 찾기 탭 */}
          <button
            role="tab"
            aria-selected={activeTab === 'bot'}
            aria-controls="panel-bot"
            id="tab-bot"
            onClick={() => switchTab('bot')}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold border transition-all"
            style={{
              borderRadius: 'var(--radius-xl)',
              background: activeTab === 'bot' ? 'rgb(var(--color-primary) / 0.15)' : 'rgb(var(--bg-surface))',
              color: activeTab === 'bot' ? 'rgb(var(--color-primary))' : 'rgb(var(--text-muted))',
              borderColor: activeTab === 'bot' ? 'rgb(var(--color-primary) / 0.4)' : 'rgb(var(--border))',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            코코봇 찾기
            <span
              className="text-[0.7rem] px-2 py-0.5 rounded-full"
              style={{ background: 'rgb(var(--bg-muted))' }}
            >
              {botTotal.toLocaleString('ko-KR')}
            </span>
          </button>

          {/* 일감 찾기 탭 */}
          <button
            role="tab"
            aria-selected={activeTab === 'job'}
            aria-controls="panel-job"
            id="tab-job"
            onClick={() => switchTab('job')}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold border transition-all"
            style={{
              borderRadius: 'var(--radius-xl)',
              background: activeTab === 'job' ? 'rgb(var(--color-primary) / 0.15)' : 'rgb(var(--bg-surface))',
              color: activeTab === 'job' ? 'rgb(var(--color-primary))' : 'rgb(var(--text-muted))',
              borderColor: activeTab === 'job' ? 'rgb(var(--color-primary) / 0.4)' : 'rgb(var(--border))',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            일감 찾기
            <span
              className="text-[0.7rem] px-2 py-0.5 rounded-full"
              style={{ background: 'rgb(var(--bg-muted))' }}
            >
              {jobTotal.toLocaleString('ko-KR')}
            </span>
          </button>

          {/* 공고 등록 버튼 */}
          <div className="ml-auto flex gap-2 items-center">
            <button
              onClick={() => router.push('/jobs/create')}
              className="px-4 py-2 text-sm font-semibold transition-all"
              style={{
                borderRadius: 'var(--radius-xl)',
                background: 'rgb(var(--color-primary))',
                color: 'rgb(var(--text-on-primary))',
                border: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgb(var(--color-primary-hover))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgb(var(--color-primary))'; }}
            >
              공고 등록
            </button>
          </div>
        </div>

        {/* ── 구봇 패널 ──────────────────────────────────── */}
        <div
          id="panel-bot"
          role="tabpanel"
          aria-labelledby="tab-bot"
          hidden={activeTab !== 'bot'}
        >
          {/* 툴바 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <p className="text-sm text-white/40">
              <span>{botTotal.toLocaleString('ko-KR')}</span>개의 코코봇을 찾았습니다
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="botSort" className="text-sm text-white/40">정렬:</label>
              <select
                id="botSort"
                value={botSort}
                onChange={e => handleBotSortChange(e.target.value as BotSort)}
                aria-label="정렬 기준"
                className="bg-white/[0.06] border border-white/10 text-white px-3 py-2 rounded-lg text-sm font-sans cursor-pointer focus:outline-none"
              >
                <option value="popular">인기순</option>
                <option value="latest">최신순</option>
                <option value="rating">평점순</option>
                <option value="price-low">가격 낮은순</option>
                <option value="price-high">가격 높은순</option>
              </select>
            </div>
          </div>

          {/* 그리드 */}
          {botLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : bots.length === 0 ? (
            botDemo ? (
              <EmptyState label="코코봇" icon="🤖" />
            ) : (
              <div className="text-center py-16" role="status">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>코코봇을 찾을 수 없습니다</h3>
                <p className="mb-4" style={{ color: 'rgb(var(--text-secondary-rgb))' }}>다른 카테고리나 검색어를 시도해보세요.</p>
                <button
                  onClick={() => handleCategoryChange('all')}
                  className="px-5 py-2 font-semibold transition-all"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgb(var(--color-primary) / 0.15)',
                    color: 'rgb(var(--color-primary))',
                    border: '1px solid rgb(var(--color-primary) / 0.3)',
                  }}
                >
                  전체 보기
                </button>
              </div>
            )
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              aria-live="polite"
              aria-label="코코봇 목록"
            >
              {bots.map(bot => <BotCard key={bot.id} bot={bot} />)}
            </div>
          )}

          <Pagination
            currentPage={botPage}
            totalPages={botTotalPages}
            onPageChange={p => {
              setBotPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>

        {/* ── 일감 패널 ──────────────────────────────────── */}
        <div
          id="panel-job"
          role="tabpanel"
          aria-labelledby="tab-job"
          hidden={activeTab !== 'job'}
        >
          {/* 툴바 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <p className="text-sm text-white/40">
              <span>{jobTotal.toLocaleString('ko-KR')}</span>개의 일감을 찾았습니다
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="jobSort" className="text-sm text-white/40">정렬:</label>
              <select
                id="jobSort"
                value={jobSort}
                onChange={e => handleJobSortChange(e.target.value as JobSort)}
                aria-label="정렬 기준"
                className="bg-white/[0.06] border border-white/10 text-white px-3 py-2 rounded-lg text-sm font-sans cursor-pointer focus:outline-none"
              >
                <option value="latest">최신순</option>
                <option value="budget-high">예산 높은순</option>
                <option value="budget-low">예산 낮은순</option>
                <option value="deadline">마감임박순</option>
              </select>
            </div>
          </div>

          {/* 그리드 */}
          {jobLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : jobs.length === 0 ? (
            jobDemo ? (
              <EmptyState label="공고" icon="💼" />
            ) : (
              <div className="text-center py-16" role="status">
                <div className="text-5xl mb-4">💼</div>
                <h3 className="text-xl font-bold text-white mb-2">일감을 찾을 수 없습니다</h3>
                <p className="text-white/50 mb-4">다른 카테고리나 검색어를 시도해보세요.</p>
                <button
                  onClick={() => handleCategoryChange('all')}
                  className="px-5 py-2 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold hover:bg-blue-500/25 transition-colors"
                >
                  전체 보기
                </button>
              </div>
            )
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              aria-live="polite"
              aria-label="일감 목록"
            >
              {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}

          <Pagination
            currentPage={jobPage}
            totalPages={jobTotalPages}
            onPageChange={p => {
              setJobPage(p);
              setJobLoaded(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </main>

      {/* ── 토스트 ───────────────────────────────────────── */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 bg-red-600 text-white rounded-2xl shadow-xl z-50 text-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
