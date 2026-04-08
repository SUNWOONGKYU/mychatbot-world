/**
 * @task S3F12
 * @description 스킬 마켓 메인 — Vanilla index.html 완전 이식
 * - 카드 그리드 (이모지 아이콘, 이름, 설명, 가격, 별점, 설치수)
 * - 카테고리 필터 탭 (chip row)
 * - 검색 (이름·설명·카테고리)
 * - 무료만 토글
 * - 정렬 (인기순 / 평점순 / 가격 낮은순 / 가격 높은순)
 * - 원클릭 프리셋 섹션
 * - 설치/제거 버튼 (카드 내 직접)
 * - 유료 스킬 구매 확인 모달
 * - Toast 알림
 * - 마이 스킬 배지
 */
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  SKILLS, SKILL_CATEGORIES, SKILL_PRESETS,
  buildStars, installSkillById, removeSkillById,
  type SkillItem,
} from '@/lib/skills-data';
import { useSkillsStore } from '@/lib/use-skills-store';

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
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        color: '#34d399',
        padding: '0.75rem 1.5rem',
        borderRadius: '999px',
        fontSize: '0.875rem',
        fontWeight: 600,
        zIndex: 9998,
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
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
  // ESC 닫기
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
      aria-labelledby="modalTitle"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#1a1730',
          border: '1px solid rgb(var(--border))',
          borderRadius: '1.25rem',
          padding: '2rem',
          maxWidth: 400, width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{skill.icon}</div>
        <h3 id="modalTitle" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
          스킬 구매
        </h3>
        <p style={{ fontSize: '1rem', color: 'rgb(var(--text-primary))', fontWeight: 600, marginBottom: '0.5rem' }}>
          {skill.name}
        </p>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginBottom: '0.75rem' }}>
          ₩{(skill.price ?? 0).toLocaleString()}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', marginBottom: '1.5rem' }}>
          실제 포인트 차감 없이 체험합니다.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.7rem 1rem', borderRadius: '0.75rem',
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              background: 'rgb(var(--bg-surface-hover) / 0.5)', color: 'rgb(var(--text-secondary))',
              border: '1px solid rgb(var(--border))',
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            style={{
              flex: 1, padding: '0.7rem 1rem', borderRadius: '0.75rem',
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              background: '#10b981', color: 'white', border: 'none',
            }}
          >
            구매 체험
          </button>
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
      className={`sk-card${isLocked ? ' sk-card--locked' : ''}`}
      data-skill-id={skill.id}
    >
      {/* 카드 본문 — 클릭 시 상세 */}
      {skill.isFree ? (
        <Link className="sk-card-link" href={`/skills/${skill.id}`} aria-label={`${skill.name} 상세 보기`}>
          <SkillCardInner skill={skill} stars={stars} />
        </Link>
      ) : (
        <div className="sk-card-link" aria-label={skill.name}>
          <SkillCardInner skill={skill} stars={stars} />
          {!installed && (
            <span className="sk-coming-soon">COMING SOON</span>
          )}
        </div>
      )}

      {/* 푸터 */}
      <div className="sk-card-footer">
        <span className={`sk-price${skill.isFree ? ' free' : ' paid'}`}>
          {skill.isFree ? '무료' : (installed ? `₩${(skill.price ?? 0).toLocaleString()}` : '유료')}
        </span>
        {installed ? (
          <button
            className="sk-btn sk-btn--remove"
            onClick={(e) => { e.preventDefault(); onRemove(skill.id, skill.name); }}
            aria-label={`${skill.name} 제거`}
          >
            제거
          </button>
        ) : skill.isFree ? (
          <button
            className="sk-btn sk-btn--install"
            onClick={(e) => { e.preventDefault(); onInstall(skill); }}
            aria-label={`${skill.name} 설치`}
          >
            설치
          </button>
        ) : (
          <button
            className="sk-btn sk-btn--coming"
            disabled
            aria-label="출시 예정"
          >
            출시 예정
          </button>
        )}
      </div>
    </div>
  );
}

function SkillCardInner({ skill, stars }: { skill: SkillItem; stars: string }) {
  return (
    <>
      <div className="sk-card-top">
        <span className="sk-icon" aria-hidden="true">{skill.icon}</span>
        <span className="sk-cat">{skill.category}</span>
      </div>
      <h3 className="sk-name">{skill.name}</h3>
      <p className="sk-desc">{skill.description}</p>
      <div className="sk-meta">
        <span className="sk-stars" aria-label={`평점 ${skill.rating}`}>
          {stars} <span className="sk-rating">{skill.rating.toFixed(1)}</span>
        </span>
        <span className="sk-installs">{skill.installs.toLocaleString()}회 설치</span>
      </div>
    </>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────────
export default function SkillsMarketPageInner() {
  const { installedIds, install, remove, isInstalled, count } = useSkillsStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState<SkillItem | null>(null);

  const { visible: toastVisible, message: toastMsg, show: showToast } = useToast();

  // ── 필터 + 정렬 ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...SKILLS];

    // 카테고리
    if (activeCategory !== 'all' && activeCategory !== '전체') {
      list = list.filter(s => s.category === activeCategory);
    }

    // 검색
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }

    // 무료
    if (showFreeOnly) {
      list = list.filter(s => s.isFree);
    }

    // 정렬
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
  }, [activeCategory, searchQuery, showFreeOnly, sortBy, installedIds]);

  // ── 설치/제거 핸들러 ─────────────────────────────────────────
  const handleInstall = useCallback((skill: SkillItem) => {
    if (!skill.isFree) {
      setPurchaseTarget(skill);
      return;
    }
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

  // ── 프리셋 설치 ──────────────────────────────────────────────
  const handlePreset = useCallback((presetKey: string) => {
    const preset = SKILL_PRESETS[presetKey];
    if (!preset) return;
    let added = 0;
    preset.skills.forEach(id => {
      if (!isInstalled(id)) {
        installSkillById(id);
        added++;
      }
    });
    // 스토어 새로고침
    window.dispatchEvent(new Event('mcw_skills_change'));
    showToast(
      added > 0
        ? `"${preset.label}" 프리셋 ${added}개 스킬을 설치했습니다!`
        : `"${preset.label}" 스킬이 이미 모두 설치되어 있습니다.`
    );
  }, [isInstalled, showToast]);

  // ── 렌더 ─────────────────────────────────────────────────────

  return (
    <>
      {/* ── 프리셋 섹션 ── */}
      <section className="sk-preset-section">
        <div className="container">
          <h2 className="sk-section-title">원클릭 프리셋 설치</h2>
          <p className="sk-section-sub">용도에 맞는 스킬 묶음을 한 번에 설치하세요</p>
          <div className="sk-preset-grid">
            {Object.entries(SKILL_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                className="sk-preset-btn"
                data-preset={key}
                onClick={() => handlePreset(key)}
                type="button"
              >
                <span className="sk-preset-icon">{preset.icon}</span>
                <span className="sk-preset-label">{preset.label}</span>
                <span className="sk-preset-count">{preset.skills.length}개 스킬</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 카테고리 필터 바 ── */}
      <section className="sk-filter-bar" aria-label="카테고리 필터">
        <div className="container">
          <div className="sk-chip-row" role="group" aria-label="카테고리 선택">
            {SKILL_CATEGORIES.map(cat => {
              const val = cat === '전체' ? 'all' : cat;
              return (
                <button
                  key={cat}
                  className={`sk-chip${activeCategory === val ? ' sk-chip--active' : ''}`}
                  data-cat={val}
                  onClick={() => setActiveCategory(val)}
                  type="button"
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 검색 + 정렬 툴바 ── */}
      <section className="sk-toolbar">
        <div className="container">
          <div className="sk-toolbar-inner">
            {/* 검색 */}
            <div className="sk-search-wrap">
              <svg className="sk-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                className="sk-search-input"
                placeholder="스킬 이름, 설명 검색..."
                autoComplete="off"
                aria-label="스킬 검색"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="sk-toolbar-right">
              {/* 무료 토글 */}
              <label className="sk-free-toggle">
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={showFreeOnly}
                  checked={showFreeOnly}
                  onChange={e => setShowFreeOnly(e.target.checked)}
                />
                <span className="sk-toggle-track" />
                <span className="sk-toggle-label">무료만</span>
              </label>

              {/* 정렬 */}
              <div className="sk-sort-wrap">
                <label htmlFor="skillsSort" className="sk-sort-label">정렬:</label>
                <select
                  id="skillsSort"
                  className="sk-sort-select"
                  aria-label="정렬 기준"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 마이스킬 */}
              <Link href="/skills/my" className="sk-my-btn" aria-label="내 설치 스킬 보기">
                내 스킬 보기
              </Link>
            </div>
          </div>

          <p className="sk-result-count">
            스킬 <strong>{filtered.length}</strong>개
          </p>
        </div>
      </section>

      {/* ── 스킬 그리드 ── */}
      <main className="sk-main">
        <div className="container">
          {filtered.length > 0 ? (
            <div className="sk-grid" aria-live="polite" aria-label="스킬 목록">
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
            <div className="sk-empty">
              <div className="sk-empty-icon">🔍</div>
              <h3 className="sk-empty-title">스킬을 찾을 수 없습니다</h3>
              <p className="sk-empty-desc">다른 카테고리나 검색어를 시도해보세요.</p>
              <button
                className="sk-empty-btn"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setShowFreeOnly(false);
                }}
                type="button"
              >
                전체 보기
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── 구매 확인 모달 ── */}
      {purchaseTarget && (
        <PurchaseModal
          skill={purchaseTarget}
          onConfirm={handlePurchaseConfirm}
          onCancel={() => setPurchaseTarget(null)}
        />
      )}

      {/* ── Toast ── */}
      {toastVisible && <Toast message={toastMsg} />}
    </>
  );
}
