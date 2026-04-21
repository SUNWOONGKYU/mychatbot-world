/**
 * @task S7FE6 — P1 리디자인: Skills 마켓
 * 기반: S7FE1 토큰 + S7FE2 Button + S7FE3 Tabs + S7FE4 Badge/EmptyState/PageToolbar
 * 변경: Tabs 카테고리 필터, Badge 위계, EmptyState, PageToolbar, 카드 구조 개선
 * 비즈니스 로직 보존: fetchSkillsFromAPI, useSkillsStore, install/remove/preset 그대로 유지
 */
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  fetchSkillsFromAPI, SKILL_CATEGORIES, SKILL_PRESETS,
  buildStars, installSkillById,
  type SkillItem,
} from '@/lib/skills-data';
import { useSkillsStore } from '@/lib/use-skills-store';
import { PageToolbar, Breadcrumb, BreadcrumbItem } from '@/components/ui/page-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ── 정렬 옵션 ────────────────────────────────────────────────────
type SortOption = 'popular' | 'rating' | 'price-asc' | 'price-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular',    label: '인기순' },
  { value: 'rating',     label: '평점순' },
  { value: 'price-asc',  label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
];

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9998]
        bg-state-success-bg border border-state-success-border
        text-state-success-fg
        px-6 py-3 rounded-full text-sm font-semibold
        shadow-[var(--shadow-lg)] backdrop-blur-sm
        whitespace-nowrap pointer-events-none"
    >
      {message}
    </div>
  );
}

function useToast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  return { visible, message, show };
}

// ── 구매 확인 모달 ────────────────────────────────────────────────
interface PurchaseModalProps {
  skill: SkillItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function PurchaseModal({ skill, onConfirm, onCancel }: PurchaseModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  if (!skill) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchaseModalTitle"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm
        flex items-center justify-center p-4"
    >
      <div className="bg-surface-2 border border-border-default rounded-2xl
        p-8 max-w-[400px] w-full text-center shadow-[var(--shadow-xl)]">
        <div className="text-5xl mb-4" aria-hidden="true">{skill.icon}</div>
        <h3
          id="purchaseModalTitle"
          className="text-lg font-bold text-text-primary mb-2 [word-break:keep-all]"
        >
          스킬 구매
        </h3>
        <p className="text-base font-semibold text-text-primary mb-2 [word-break:keep-all]">
          {skill.name}
        </p>
        <p className="text-2xl font-bold text-state-success-fg mb-2">
          ₩{(skill.price ?? 0).toLocaleString()}
        </p>
        <p className="text-sm text-text-tertiary mb-6 [word-break:keep-all]">
          실제 포인트 차감 없이 체험합니다.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            취소
          </Button>
          <Button variant="default" className="flex-1" onClick={onConfirm} autoFocus>
            구매 체험
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── 스킬 카드 ─────────────────────────────────────────────────────
interface SkillCardProps {
  skill: SkillItem;
  installed: boolean;
  onInstall: (skill: SkillItem) => void;
  onRemove: (skillId: string, name: string) => void;
}

function SkillCard({ skill, installed, onInstall, onRemove }: SkillCardProps) {
  const stars = buildStars(skill.rating);
  const isLocked = !skill.isFree && !installed;

  return (
    <div
      className={`flex flex-col gap-3 p-5 rounded-xl
        bg-surface-2 border border-border-default
        transition-all duration-200
        hover:border-interactive-primary/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
        ${isLocked ? 'opacity-70' : ''}`}
      data-skill-id={skill.id}
    >
      {/* 카드 링크 영역 */}
      {skill.isFree ? (
        <Link
          href={`/skills/${skill.id}`}
          className="flex flex-col gap-2.5 no-underline
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus rounded-lg"
          aria-label={`${skill.name} 상세 보기`}
        >
          <SkillCardBody skill={skill} stars={stars} installed={installed} />
        </Link>
      ) : (
        <div className="flex flex-col gap-2.5" aria-label={skill.name}>
          <SkillCardBody skill={skill} stars={stars} installed={installed} />
          {!installed && (
            <Badge variant="neutral" tone="subtle" size="sm" className="self-start">
              COMING SOON
            </Badge>
          )}
        </div>
      )}

      {/* 푸터 */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-subtle gap-2">
        <Badge
          variant={skill.isFree ? 'success' : 'warning'}
          tone="subtle"
          size="sm"
        >
          {skill.isFree ? '무료' : (installed ? `₩${(skill.price ?? 0).toLocaleString()}` : '유료')}
        </Badge>

        {installed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.preventDefault(); onRemove(skill.id, skill.name); }}
            aria-label={`${skill.name} 제거`}
          >
            제거
          </Button>
        ) : skill.isFree ? (
          <Button
            variant="default"
            size="sm"
            onClick={(e) => { e.preventDefault(); onInstall(skill); }}
            aria-label={`${skill.name} 설치`}
          >
            설치
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled
            aria-label="출시 예정"
          >
            출시 예정
          </Button>
        )}
      </div>
    </div>
  );
}

function SkillCardBody({ skill, stars, installed }: { skill: SkillItem; stars: string; installed: boolean }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className="w-10 h-10 rounded-lg bg-interactive-secondary flex items-center justify-center text-xl shrink-0"
          aria-hidden="true"
        >
          {skill.icon}
        </span>
        <Badge variant="brand" tone="subtle" size="sm" className="shrink-0">
          {skill.category}
        </Badge>
      </div>

      {/* 이름 (Heading 3) */}
      <h3 className="text-[0.9375rem] font-bold text-text-primary leading-snug [word-break:keep-all]">
        {skill.name}
        {installed && (
          <Badge variant="success" tone="subtle" size="sm" className="ml-2">
            설치됨
          </Badge>
        )}
      </h3>

      {/* 설명 */}
      <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 [word-break:keep-all]">
        {skill.description}
      </p>

      {/* 메타 */}
      <div className="flex items-center gap-3 text-xs text-text-tertiary">
        <span aria-label={`평점 ${skill.rating}`}>
          {stars} <span className="font-medium text-text-secondary">{skill.rating.toFixed(1)}</span>
        </span>
        <span>{skill.installs.toLocaleString()}회 설치</span>
      </div>
    </>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────────
export default function SkillsMarketPageInner() {
  const { installedIds, install, remove, isInstalled, count } = useSkillsStore();

  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState<SkillItem | null>(null);

  useEffect(() => {
    fetchSkillsFromAPI().then(setSkills);
  }, []);

  const { visible: toastVisible, message: toastMsg, show: showToast } = useToast();

  // ── 필터 + 정렬 ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...skills];

    if (activeCategory !== 'all' && activeCategory !== '전체') {
      list = list.filter(s => s.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    if (showFreeOnly) {
      list = list.filter(s => s.isFree);
    }
    if (sortBy === 'popular') {
      list.sort((a, b) => b.installs - a.installs);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.isFree ? 0 : (a.price ?? 0)) - (b.isFree ? 0 : (b.price ?? 0)));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.isFree ? 0 : (b.price ?? 0)) - (a.isFree ? 0 : (a.price ?? 0)));
    }

    return list;
  }, [skills, activeCategory, searchQuery, showFreeOnly, sortBy, installedIds]);

  // ── 설치/제거 핸들러 ─────────────────────────────────────────
  const handleInstall = useCallback((skill: SkillItem) => {
    if (!skill.isFree) { setPurchaseTarget(skill); return; }
    install(skill.id);
    showToast(`"${skill.name}" 스킬을 설치했습니다!`);
  }, [install, showToast]);

  const handleRemove = useCallback((skillId: string, name: string) => {
    remove(skillId);
    showToast(`"${name}" 스킬을 제거했습니다.`);
  }, [remove, showToast]);

  const handlePurchaseConfirm = useCallback(() => {
    if (!purchaseTarget) return;
    install(purchaseTarget.id);
    showToast(`"${purchaseTarget.name}" 구매 완료! 스킬이 설치되었습니다.`);
    setPurchaseTarget(null);
  }, [purchaseTarget, install, showToast]);

  const handlePreset = useCallback((presetKey: string) => {
    const preset = SKILL_PRESETS[presetKey];
    if (!preset) return;
    let added = 0;
    preset.skills.forEach(id => {
      if (!isInstalled(id)) { installSkillById(id); added++; }
    });
    window.dispatchEvent(new Event('mcw_skills_change'));
    showToast(
      added > 0
        ? `"${preset.label}" 프리셋 ${added}개 스킬을 설치했습니다!`
        : `"${preset.label}" 스킬이 이미 모두 설치되어 있습니다.`
    );
  }, [isInstalled, showToast]);

  // ── 렌더 ─────────────────────────────────────────────────────

  const ALL_CATS = ['전체', ...SKILL_CATEGORIES.filter(c => c !== '전체')];

  return (
    <div className="flex flex-col min-h-full">
      {/* PageToolbar */}
      <PageToolbar
        title="스킬 마켓"
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbItem href="/">홈</BreadcrumbItem>
            <BreadcrumbItem current>스킬 마켓</BreadcrumbItem>
          </Breadcrumb>
        }
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/skills/my" aria-label={`내 설치 스킬 보기 (${count}개)`}>
              내 스킬
              {count > 0 && (
                <Badge variant="brand" tone="solid" size="sm" className="ml-1">
                  {count}
                </Badge>
              )}
            </Link>
          </Button>
        }
        divider
      />

      <div className="flex-1 space-y-5">
        {/* 프리셋 섹션 */}
        <section className="sk-preset-section px-4 sm:px-6 pt-5" aria-label="원클릭 프리셋">
          <h2 className="text-base font-semibold text-text-primary mb-1 [word-break:keep-all]">
            원클릭 프리셋 설치
          </h2>
          <p className="text-sm text-text-secondary mb-4 [word-break:keep-all]">
            용도에 맞는 스킬 묶음을 한 번에 설치하세요
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(SKILL_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePreset(key)}
                className="flex flex-col items-center gap-1.5 p-4
                  bg-surface-2 border border-border-default rounded-xl
                  hover:border-interactive-primary/40 hover:bg-surface-1
                  transition-all duration-200 text-center
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                aria-label={`${preset.label} 프리셋 설치 (${preset.skills.length}개 스킬)`}
              >
                <span className="text-2xl" aria-hidden="true">{preset.icon}</span>
                <span className="text-sm font-semibold text-text-primary [word-break:keep-all]">
                  {preset.label}
                </span>
                <Badge variant="neutral" tone="subtle" size="sm">
                  {preset.skills.length}개 스킬
                </Badge>
              </button>
            ))}
          </div>
        </section>

        {/* 카테고리 Tabs + 검색/정렬 툴바 */}
        <section className="px-4 sm:px-6 space-y-4" aria-label="스킬 필터">
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
          >
            <div className="overflow-x-auto -mx-1 px-1 pb-0.5">
              <TabsList variant="underline" className="min-w-max">
                {ALL_CATS.map((cat) => {
                  const val = cat === '전체' ? 'all' : cat;
                  return (
                    <TabsTrigger key={val} value={val}>
                      {cat}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* 검색 + 정렬 툴바 */}
            <div className="flex items-center gap-3 flex-wrap mt-4">
              {/* 검색 */}
              <div className="relative flex-1 min-w-[160px]">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                    <circle cx="9" cy="9" r="6"/><path d="m16 16-3.5-3.5" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  type="search"
                  className="w-full pl-9 pr-4 min-h-[44px] rounded-md text-sm
                    border border-border-default bg-surface-2 text-text-primary
                    placeholder:text-text-tertiary
                    focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-1 focus:ring-offset-surface-0
                    transition-colors"
                  placeholder="스킬 이름, 설명 검색..."
                  autoComplete="off"
                  aria-label="스킬 검색"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* 무료만 토글 */}
              <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                <span className="relative inline-flex h-5 w-9">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={showFreeOnly}
                    checked={showFreeOnly}
                    onChange={e => setShowFreeOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <span className={`w-full h-full rounded-full transition-colors duration-200
                    ${showFreeOnly ? 'bg-interactive-primary' : 'bg-border-default'}`}
                  />
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-text-inverted
                    shadow transition-transform duration-200
                    ${showFreeOnly ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </span>
                <span className="text-sm text-text-secondary [word-break:keep-all]">무료만</span>
              </label>

              {/* 정렬 */}
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="skillsSort" className="text-sm text-text-tertiary shrink-0">
                  정렬:
                </label>
                <select
                  id="skillsSort"
                  aria-label="정렬 기준"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="min-h-[44px] px-3 rounded-md text-sm
                    border border-border-default bg-surface-2 text-text-primary
                    focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-1 focus:ring-offset-surface-0
                    transition-colors cursor-pointer"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 내 스킬 링크 */}
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/skills/my" aria-label="내 설치 스킬 보기">
                  내 스킬 보기
                </Link>
              </Button>
            </div>

            <p className="text-xs text-text-tertiary mt-2">
              스킬 <strong className="font-semibold text-text-secondary">{filtered.length}</strong>개
            </p>

            {/* 탭 콘텐츠 — 카테고리별 그리드 */}
            {ALL_CATS.map((cat) => {
              const val = cat === '전체' ? 'all' : cat;
              return (
                <TabsContent key={val} value={val}>
                  {/* 스킬 그리드 */}
                  {filtered.length > 0 ? (
                    <div
                      className="grid gap-4"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
                      aria-live="polite"
                      aria-label={`${cat} 스킬 목록`}
                    >
                      {filtered.map(skill => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          installed={isInstalled(skill.id)}
                          onInstall={handleInstall}
                          onRemove={handleRemove}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7" aria-hidden="true">
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                        </svg>
                      }
                      title="스킬을 찾을 수 없습니다"
                      description="다른 카테고리나 검색어를 시도해보세요."
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery('');
                            setActiveCategory('all');
                            setShowFreeOnly(false);
                          }}
                        >
                          전체 보기
                        </Button>
                      }
                      size="lg"
                    />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </section>
      </div>

      {/* 구매 확인 모달 */}
      {purchaseTarget && (
        <PurchaseModal
          skill={purchaseTarget}
          onConfirm={handlePurchaseConfirm}
          onCancel={() => setPurchaseTarget(null)}
        />
      )}

      {/* Toast */}
      {toastVisible && <Toast message={toastMsg} />}
    </div>
  );
}
