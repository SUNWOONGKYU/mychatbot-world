/**
 * @task S3F9 (React 전환 — 검색 페이지)
 * @description 구봇구직 검색 페이지
 *   - 카테고리 체크박스 필터
 *   - 평점 라디오 필터
 *   - 가격 범위 슬라이더
 *   - 스킬 체크박스
 *   - 활성 필터 태그
 *   - 키워드 하이라이트
 *   - 데모 데이터 폴백
 *
 * Vanilla 원본: js/jobs.js (initSearchPage, bindSearchFilters, loadSearchResults)
 * Route: /jobs/search
 */
'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// ── 타입 ─────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  category: string;
  description: string;
  emoji?: string;
  rating: number;
  reviewCount: number;
  price: number;
  skills: string[];
  isNew: boolean;
  type: 'bot' | 'job';
  budget?: number;
  status?: string;
}

interface ActiveFilter {
  label: string;
  key: string;
  value: string;
}

// ── 상수 ─────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  all: '전체',
  'customer-service': '고객서비스',
  education: '교육',
  marketing: '마케팅',
  development: '개발',
  etc: '기타',
};

const CATEGORY_COLORS: Record<string, string> = {
  'customer-service': 'bg-blue-50 text-blue-700 border-blue-200',
  education: 'bg-green-50 text-green-700 border-green-200',
  marketing: 'bg-orange-50 text-orange-700 border-orange-200',
  development: 'bg-violet-50 text-violet-700 border-violet-200',
  etc: 'bg-slate-50 text-slate-600 border-slate-200',
};

const SKILL_OPTIONS = ['NLP', '다국어', 'API연동', '교육', '언어학습', '콘텐츠생성', 'SNS', '코드리뷰', '디버깅'];
const PAGE_SIZE = 12;
const PRICE_MAX = 500000;

// ── 데모 데이터 ──────────────────────────────────────────────

const MOCK_ALL: SearchResult[] = [
  { id: 'b1', name: '고객응대 도우미', category: 'customer-service', description: '24시간 고객 문의를 자동으로 처리하는 스마트 코코봇입니다.', emoji: '🤖', rating: 4.8, reviewCount: 1234, price: 29000, skills: ['NLP', '다국어', 'API연동'], isNew: false, type: 'bot' },
  { id: 'b2', name: '영어 튜터봇', category: 'education', description: '개인 맞춤형 영어 학습 플랜을 제공하는 AI 튜터입니다.', emoji: '📚', rating: 4.6, reviewCount: 892, price: 19000, skills: ['교육', '언어학습', '퀴즈'], isNew: true, type: 'bot' },
  { id: 'b3', name: '마케팅 어시스턴트', category: 'marketing', description: 'SNS 콘텐츠와 광고 문구를 자동으로 생성해드립니다.', emoji: '📣', rating: 4.5, reviewCount: 567, price: 49000, skills: ['콘텐츠생성', 'SNS', '카피라이팅'], isNew: false, type: 'bot' },
  { id: 'b4', name: '코딩 도우미', category: 'development', description: '코드 리뷰, 디버깅, 문서화를 도와드립니다.', emoji: '💻', rating: 4.9, reviewCount: 2341, price: 39000, skills: ['코드리뷰', '디버깅', 'Git'], isNew: false, type: 'bot' },
  { id: 'b5', name: '예약 관리 봇', category: 'customer-service', description: '식당, 미용실, 병원 예약을 자동으로 관리합니다.', emoji: '📅', rating: 4.3, reviewCount: 456, price: 15000, skills: ['예약', '알림', '캘린더'], isNew: true, type: 'bot' },
  { id: 'b6', name: '수학 튜터봇', category: 'education', description: '초등부터 대학 수준까지 수학 문제를 단계별로 풀어드립니다.', emoji: '🔢', rating: 4.7, reviewCount: 789, price: 25000, skills: ['수학', '단계별설명', '문제생성'], isNew: false, type: 'bot' },
  { id: 'b7', name: '이메일 작성 봇', category: 'marketing', description: '상황에 맞는 이메일 템플릿을 즉시 생성합니다.', emoji: '✉️', rating: 4.2, reviewCount: 321, price: 9000, skills: ['이메일', '템플릿', '번역'], isNew: false, type: 'bot' },
  { id: 'b8', name: '회의록 작성봇', category: 'etc', description: '음성/텍스트 회의 내용을 정리하고 요약합니다.', emoji: '📝', rating: 4.4, reviewCount: 678, price: 35000, skills: ['요약', '음성인식', '일정관리'], isNew: true, type: 'bot' },
  { id: 'b9', name: 'HR 어시스턴트', category: 'etc', description: '채용 공고 작성부터 면접 질문 생성까지 HR 업무를 지원합니다.', emoji: '👥', rating: 4.1, reviewCount: 234, price: 0, skills: ['채용', '면접', '평가'], isNew: false, type: 'bot' },
];

// ── 유틸 ─────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price === 0) return '무료';
  if (!price) return '협의';
  return `₩${price.toLocaleString('ko-KR')}`;
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// ── 키워드 하이라이트 ─────────────────────────────────────────

function Highlight({ text, keyword }: { text: string; keyword: string }): React.ReactElement {
  if (!keyword.trim()) return <>{text}</>;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={i} className="bg-blue-200/60 text-inherit rounded px-0.5 not-italic">
            {part}
          </mark>
        ) : part
      )}
    </>
  );
}

// ── 결과 카드 ─────────────────────────────────────────────────

function ResultCard({ item, keyword }: { item: SearchResult; keyword: string }) {
  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.etc;
  const catLabel = CATEGORY_LABELS[item.category] || item.category;
  const href = item.type === 'bot' ? `/jobs/bot/${item.id}` : `/jobs/${item.id}`;

  return (
    <Link href={href} className="block group">
      <article className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3 hover:bg-white/[0.07] hover:border-blue-500/30 hover:-translate-y-0.5 transition-all duration-200">
        {/* 헤더 */}
        <div className="flex items-start gap-3">
          {item.emoji && (
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-xl flex-shrink-0">
              {item.emoji}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <span className={`text-[0.7rem] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
                {catLabel}
              </span>
              {item.isNew && (
                <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  NEW
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white leading-snug">
              <Highlight text={item.name} keyword={keyword} />
            </h3>
          </div>
        </div>

        {/* 설명 */}
        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
          <Highlight text={item.description} keyword={keyword} />
        </p>

        {/* 스킬 */}
        {item.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.skills.slice(0, 3).map(s => (
              <span key={s} className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Highlight text={s} keyword={keyword} />
              </span>
            ))}
          </div>
        )}

        {/* 하단 메타 */}
        <div className="flex items-center justify-between text-xs text-white/35 mt-auto pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">{renderStars(item.rating)}</span>
            <span>{item.rating.toFixed(1)}</span>
            <span>({item.reviewCount.toLocaleString('ko-KR')})</span>
          </div>
          <div className="text-white/50 font-medium">{formatPrice(item.price)}</div>
        </div>
      </article>
    </Link>
  );
}

function ResultSkeleton() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 h-[180px] animate-pulse" />
  );
}

// ── 검색 내용 ─────────────────────────────────────────────────

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 검색어
  const [keyword, setKeyword] = useState(searchParams?.get('q') ?? '');
  const [inputValue, setInputValue] = useState(searchParams?.get('q') ?? '');

  // 필터 상태
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false); // 모바일 필터 패널

  // 결과 상태
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // 활성 필터 태그 계산
  const activeFilters: ActiveFilter[] = [
    ...selectedCategories.map(cat => ({ label: CATEGORY_LABELS[cat] || cat, key: 'category', value: cat })),
    ...(minRating > 0 ? [{ label: `평점 ${minRating}+`, key: 'rating', value: String(minRating) }] : []),
    ...((priceMin > 0 || priceMax < PRICE_MAX) ? [{ label: `${formatPrice(priceMin)}~${formatPrice(priceMax)}`, key: 'price', value: '' }] : []),
    ...selectedSkills.map(skill => ({ label: skill, key: 'skill', value: skill })),
  ];

  const activeFilterCount = activeFilters.length;

  // 검색 실행
  const doSearch = useCallback(async (kw: string) => {
    setLoading(true);
    setDemoMode(false);
    try {
      // 1) mcw_bots 검색
      const botParams = new URLSearchParams({
        type: 'bot',
        search: kw,
        limit: String(PAGE_SIZE * 2),
        offset: String((page - 1) * PAGE_SIZE),
      });
      if (selectedCategories.length > 0) botParams.set('categories', selectedCategories.join(','));

      let items: SearchResult[] = [];
      let totalCount = 0;

      try {
        const res = await fetch(`/api/jobs?${botParams}`);
        if (res.ok) {
          const data = await res.json();
          items = data.items ?? [];
          totalCount = data.total ?? 0;
        } else throw new Error('API 오류');
      } catch {
        // 폴백
        setDemoMode(true);
        const kl = kw.toLowerCase();
        items = MOCK_ALL.filter(item => {
          const matchKw = !kw ||
            item.name.toLowerCase().includes(kl) ||
            item.description.toLowerCase().includes(kl) ||
            item.skills.some(s => s.toLowerCase().includes(kl));
          const matchCat = selectedCategories.length === 0 || selectedCategories.includes(item.category);
          const matchRating = !minRating || item.rating >= minRating;
          const matchPrice = item.price >= priceMin && item.price <= priceMax;
          const matchSkills = selectedSkills.length === 0 || selectedSkills.some(s => item.skills.includes(s));
          return matchKw && matchCat && matchRating && matchPrice && matchSkills;
        });
        totalCount = items.length;
      }

      // 클라이언트 필터 적용 (실제 API 사용 시)
      if (!demoMode) {
        items = items.filter(item => {
          const matchRating = !minRating || item.rating >= minRating;
          const matchPrice = item.price >= priceMin && item.price <= priceMax;
          const matchSkills = selectedSkills.length === 0 || selectedSkills.some(s => item.skills.includes(s));
          return matchRating && matchPrice && matchSkills;
        });
        totalCount = items.length;
      }

      setResults(items);
      setTotal(totalCount);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategories, minRating, priceMin, priceMax, selectedSkills, demoMode]);

  // 초기 검색어가 있으면 바로 검색
  useEffect(() => {
    const q = searchParams?.get('q');
    if (q) {
      setSearched(true);
      doSearch(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터 변경 시 재검색
  useEffect(() => {
    if (searched) {
      doSearch(keyword);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, minRating, priceMin, priceMax, selectedSkills, page]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const kw = inputValue.trim();
    setKeyword(kw);
    setPage(1);
    setSearched(true);
    router.replace(`/jobs/search${kw ? `?q=${encodeURIComponent(kw)}` : ''}`, { scroll: false });
    doSearch(kw);
  };

  const removeFilter = (key: string, value: string) => {
    if (key === 'category') setSelectedCategories(prev => prev.filter(c => c !== value));
    else if (key === 'rating') setMinRating(0);
    else if (key === 'price') { setPriceMin(0); setPriceMax(PRICE_MAX); }
    else if (key === 'skill') setSelectedSkills(prev => prev.filter(s => s !== value));
    setPage(1);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setMinRating(0);
    setPriceMin(0);
    setPriceMax(PRICE_MAX);
    setSelectedSkills([]);
    setPage(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#0f0c29]">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-[rgba(15,12,41,0.95)] backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/jobs" className="text-white/40 hover:text-blue-400 text-sm transition-colors">
              ← 구봇구직
            </Link>
            <h1 className="text-lg font-bold text-white">코코봇 검색</h1>
          </div>

          {/* 검색 폼 */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                id="searchPageInput"
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="코코봇 이름, 기능, 카테고리 검색..."
                autoComplete="off"
                className="w-full pl-9 pr-4 py-2.5 min-h-[44px] bg-white/[0.08] border border-white/15 rounded-xl text-white placeholder-white/35 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
            >
              검색
            </button>

            {/* 모바일 필터 토글 */}
            <button
              type="button"
              onClick={() => setFilterOpen(o => !o)}
              aria-expanded={filterOpen}
              aria-controls="filterPanel"
              className="lg:hidden px-3 py-2.5 min-h-[44px] min-w-[44px] bg-white/[0.06] border border-white/10 text-white/60 rounded-xl text-sm relative"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-6 flex gap-6">
        {/* ── 필터 사이드바 ──────────────────────────── */}
        <aside
          id="filterPanel"
          className={`w-64 flex-shrink-0 space-y-4 ${filterOpen ? 'block' : 'hidden'} lg:block`}
        >
          {/* 필터 헤더 */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">필터</h2>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-blue-400 hover:underline"
              >
                초기화
              </button>
            )}
          </div>

          {/* 카테고리 */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">카테고리</h3>
            <div className="space-y-2">
              {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== 'all').map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="category"
                    value={val}
                    checked={selectedCategories.includes(val)}
                    onChange={e => {
                      setSelectedCategories(prev =>
                        e.target.checked ? [...prev, val] : prev.filter(c => c !== val)
                      );
                      setPage(1);
                    }}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 accent-blue-500"
                  />
                  <span className="text-sm text-white/60 group-hover:text-white transition-colors">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 평점 */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">최소 평점</h3>
            <div className="space-y-2">
              {[0, 3, 3.5, 4, 4.5].map(val => (
                <label key={val} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    value={val}
                    checked={minRating === val}
                    onChange={() => { setMinRating(val); setPage(1); }}
                    className="w-4 h-4 text-blue-500 accent-blue-500"
                  />
                  <span className="text-sm text-white/60 group-hover:text-white transition-colors">
                    {val === 0 ? '전체' : `${val}점 이상 (★${val})`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 가격 범위 */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">가격 범위 (월)</h3>
            <div className="text-xs text-white/60 mb-3 text-center" id="priceDisplay">
              {formatPrice(priceMin)} — {formatPrice(priceMax)}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 w-6">최소</span>
                <input
                  type="range"
                  id="priceMin"
                  min={0}
                  max={PRICE_MAX}
                  step={10000}
                  value={priceMin}
                  onChange={e => { setPriceMin(Number(e.target.value)); setPage(1); }}
                  className="flex-1 accent-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 w-6">최대</span>
                <input
                  type="range"
                  id="priceMax"
                  min={0}
                  max={PRICE_MAX}
                  step={10000}
                  value={priceMax}
                  onChange={e => { setPriceMax(Number(e.target.value)); setPage(1); }}
                  className="flex-1 accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 스킬 */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">스킬</h3>
            <div className="space-y-2">
              {SKILL_OPTIONS.map(skill => (
                <label key={skill} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="skill"
                    value={skill}
                    checked={selectedSkills.includes(skill)}
                    onChange={e => {
                      setSelectedSkills(prev =>
                        e.target.checked ? [...prev, skill] : prev.filter(s => s !== skill)
                      );
                      setPage(1);
                    }}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 accent-blue-500"
                  />
                  <span className="text-sm text-white/60 group-hover:text-white transition-colors">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 모바일 적용 버튼 */}
          <button
            onClick={() => { setFilterOpen(false); if (searched) doSearch(keyword); }}
            className="lg:hidden w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            필터 적용
          </button>
        </aside>

        {/* ── 검색 결과 ─────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* 활성 필터 태그 */}
          {activeFilters.length > 0 && (
            <div id="activeFilters" className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30"
                >
                  {f.label}
                  <button
                    onClick={() => removeFilter(f.key, f.value)}
                    aria-label={`${f.label} 필터 제거`}
                    className="text-blue-400/60 hover:text-blue-400 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={resetFilters}
                className="text-xs text-white/40 hover:text-white px-2 py-1"
              >
                전체 초기화
              </button>
            </div>
          )}

          {/* 데모 배너 */}
          {demoMode && searched && (
            <div role="status" className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-lg text-sm text-amber-400 border border-amber-500/35 bg-amber-500/10">
              <span aria-hidden="true">⚠️</span>
              <span>검색 결과 — 서버에 연결할 수 없어 샘플 데이터를 표시 중입니다.</span>
            </div>
          )}

          {/* 결과 메타 */}
          {searched && !loading && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-white/40" id="searchResultTotal">
                총 <span className="text-white/70 font-medium">{total.toLocaleString('ko-KR')}</span>개 결과
                {keyword && <span className="ml-1">— &ldquo;{keyword}&rdquo;</span>}
              </p>
            </div>
          )}

          {/* 상태별 표시 */}
          {!searched ? (
            <div className="text-center py-20 text-white/40">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-sm">검색어를 입력하거나 필터를 설정해 코코봇을 찾아보세요.</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <ResultSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20" id="searchEmpty">
              <div className="text-5xl mb-4">😔</div>
              <h3 className="text-lg font-bold text-white mb-2">검색 결과가 없습니다</h3>
              <p className="text-white/50 text-sm mb-4">
                {keyword ? `"${keyword}"에 대한 결과가 없습니다.` : '조건에 맞는 코코봇이 없습니다.'}
                <br />다른 검색어나 필터를 시도해보세요.
              </p>
              <button
                onClick={resetFilters}
                id="searchResetFiltersBtn"
                className="px-5 py-2 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold text-sm hover:bg-blue-500/25 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                id="searchResultGrid"
                aria-live="polite"
                aria-label="검색 결과"
              >
                {results.map(item => (
                  <ResultCard key={item.id} item={item} keyword={keyword} />
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <nav id="searchPagination" className="flex justify-center items-center gap-2 mt-8" aria-label="페이지 탐색">
                  <button
                    id="searchPrevBtn"
                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={page <= 1}
                    className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 flex items-center justify-center hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="이전 페이지"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <span className="text-sm text-white/50 px-2">{page} / {totalPages}</span>
                  <button
                    id="searchNextBtn"
                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={page >= totalPages}
                    className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 flex items-center justify-center hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="다음 페이지"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 페이지 래퍼 ───────────────────────────────────────────────

export default function JobSearchPageInner() {
  return (
    <Suspense fallback={
      <div className="max-w-[1200px] mx-auto px-6 py-10 animate-pulse">
        <div className="h-10 bg-white/[0.06] rounded-xl mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-white/[0.04] rounded-2xl" />
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
