/**
 * @task S5FE9 — 게스트 모드 리디자인
 * @description 게스트 모드 카테고리 선택 페이지 (S5 디자인 시스템 적용)
 *
 * S5 변경사항:
 * - 하드코딩 컬러 → rgb(var(--token)) 형식으로 교체
 * - 배너 그라데이션 → var(--gradient-primary) (퍼플 계열)
 * - 카테고리 카드 → P3 카드 스펙 (호버 글로우, radius-xl, shadow-md/lg)
 * - 다크/라이트 동시 지원 (CSS 변수 기반)
 * - 폰트 → var(--font-sans) (Pretendard)
 *
 * 기능 변경 없음 (PUBLIC 라우트, 게스트 UUID, 카드 선택 → 채팅)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────
   상수
───────────────────────────────────────────────────────────── */

const STORAGE_KEYS = {
  SESSION_ID:    'mcw_guest_session_id',
  MESSAGE_COUNT: 'mcw_guest_message_count',
  BOT_ID:        'mcw_guest_bot_id',
  CATEGORY:      'mcw_guest_category',
  BOT_NAME:      'mcw_guest_bot_name',
  EXPIRES_AT:    'mcw_guest_expires_at',
} as const;

const MAX_MESSAGES = 10;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

/* ─────────────────────────────────────────────────────────────
   카테고리 데이터
───────────────────────────────────────────────────────────── */

interface Category {
  id: string;
  templateId: string;
  icon: string;
  name: string;
  desc: string;
}

// 아바타형 — 나를 대신하는 코코봇 (5개, 체험 가능 항목만)
const AVATAR_CATS: Category[] = [
  { id: 'avatar_executive',    templateId: 'guest_avatar_executive',    icon: '🏢', name: '기업경영자',     desc: '회사 소개·비전 응대' },
  { id: 'avatar_smallbiz',     templateId: 'guest_avatar_smallbiz',     icon: '🍱', name: '소상공인',       desc: '가게 안내·예약' },
  { id: 'avatar_professional', templateId: 'guest_avatar_professional', icon: '⚖️', name: '전문직 종사자',  desc: '상담·업무 안내' },
  { id: 'avatar_freelancer',   templateId: 'guest_avatar_freelancer',   icon: '🎨', name: '프리랜서',       desc: '포트폴리오·문의' },
  { id: 'avatar_politician',   templateId: 'guest_avatar_politician',   icon: '🗳️', name: '정치인',         desc: '공약·민원 응대' },
];

// 도우미형 — 나를 도와주는 코코봇 (5개, 체험 가능 항목만)
const HELPER_CATS: Category[] = [
  { id: 'helper_work',     templateId: 'guest_helper_work',     icon: '💼', name: '업무',  desc: '문서·보고서 작성' },
  { id: 'helper_learning', templateId: 'guest_helper_learning', icon: '📚', name: '학습',  desc: '공부·과제 지원' },
  { id: 'helper_creative', templateId: 'guest_helper_creative', icon: '🎨', name: '창작',  desc: '아이디어·글쓰기' },
  { id: 'helper_health',   templateId: 'guest_helper_health',   icon: '💪', name: '건강',  desc: '운동·식단 코칭' },
  { id: 'helper_life',     templateId: 'guest_helper_life',     icon: '🏠', name: '생활',  desc: '일상·민원 안내' },
];

const CATEGORIES: Category[] = [...AVATAR_CATS, ...HELPER_CATS];

const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, `${c.name} AI Assistant 코코봇`])
);

/* ─────────────────────────────────────────────────────────────
   localStorage 유틸 (SSR 안전)
───────────────────────────────────────────────────────────── */

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function lsSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

/* ─────────────────────────────────────────────────────────────
   세션 관리
───────────────────────────────────────────────────────────── */

function generateId(): string {
  return 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}

function initGuestSession(): string {
  const existingId = lsGet(STORAGE_KEYS.SESSION_ID);
  const expiresAt  = lsGet(STORAGE_KEYS.EXPIRES_AT);
  const now        = Date.now();

  if (existingId && expiresAt && now < parseInt(expiresAt, 10)) {
    return existingId;
  }

  const newId     = generateId();
  const newExpiry = String(now + SESSION_TTL_MS);
  lsSet(STORAGE_KEYS.SESSION_ID,    newId);
  lsSet(STORAGE_KEYS.MESSAGE_COUNT, '0');
  lsSet(STORAGE_KEYS.EXPIRES_AT,    newExpiry);
  return newId;
}

/* ─────────────────────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────────────────────── */

export default function GuestPageInner() {
  const router = useRouter();

  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [loadingId,  setLoadingId]    = useState<string | null>(null);
  const [isLoading,  setIsLoading]    = useState(false);
  const [loadingText, setLoadingText] = useState('코코봇을 준비하는 중...');
  const [toast,      setToast]        = useState<string | null>(null);

  /* 세션 초기화 (클라이언트 마운트 후) */
  useEffect(() => {
    initGuestSession();
  }, []);

  /* 토스트 자동 숨김 */
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* 카테고리 선택 핸들러 */
  const handleSelectCategory = useCallback(async (cat: Category) => {
    if (loadingId) return;

    const botName = CATEGORY_NAMES[cat.id] ?? '게스트 코코봇';

    setSelectedId(cat.id);
    setLoadingId(cat.id);
    setIsLoading(true);
    setLoadingText(`${botName}을 준비하는 중...`);

    try {
      const response = await fetch('/api/guest-create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ botName, templateId: cat.templateId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `서버 오류 (${response.status})`);
      }

      const data = await response.json() as { botId?: string; guestSessionId?: string };
      const { botId, guestSessionId } = data;

      lsSet(STORAGE_KEYS.SESSION_ID,    guestSessionId ?? 'guest_' + Date.now());
      lsSet(STORAGE_KEYS.MESSAGE_COUNT, '0');
      lsSet(STORAGE_KEYS.BOT_ID,        botId ?? cat.id);
      lsSet(STORAGE_KEYS.CATEGORY,      cat.id);
      lsSet(STORAGE_KEYS.BOT_NAME,      botName);

      router.push('/guest/chat');

    } catch (err) {
      console.warn('[GuestCreate] API 실패, 로컬 폴백 사용:', (err as Error).message);

      const fallbackSessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      lsSet(STORAGE_KEYS.SESSION_ID,    fallbackSessionId);
      lsSet(STORAGE_KEYS.MESSAGE_COUNT, '0');
      lsSet(STORAGE_KEYS.BOT_ID,        'demo_' + cat.id);
      lsSet(STORAGE_KEYS.CATEGORY,      cat.id);
      lsSet(STORAGE_KEYS.BOT_NAME,      botName);

      router.push('/guest/chat');

    } finally {
      setIsLoading(false);
      setLoadingId(null);
    }
  }, [loadingId, router]);

  return (
    <>
      {/* S5 글로벌 인라인 스타일 (CSS 변수 기반, 빌드 없이 동작) */}
      <style>{`
        .guest-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: var(--font-sans);
          background: rgb(var(--bg-base));
          color: rgb(var(--text-primary));
        }

        /* ── 헤더 ── */
        .guest-header {
          background: rgb(var(--bg-surface));
          border-bottom: 1px solid rgb(var(--border));
          padding: var(--space-4) var(--space-6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: var(--shadow-sm);
          transition: background var(--transition-slow), border-color var(--transition-slow);
        }

        .guest-logo {
          font-size: 1.125rem;
          font-weight: var(--font-bold);
          color: rgb(var(--color-primary));
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .guest-logo:hover {
          color: rgb(var(--color-primary-hover));
        }

        .guest-header-actions {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }

        /* 로그인 버튼 (아웃라인) */
        .btn-login {
          padding: var(--space-2) var(--space-4);
          border: 1px solid rgb(var(--border-strong));
          background: transparent;
          color: rgb(var(--text-secondary));
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: var(--font-medium);
          font-family: var(--font-sans);
          cursor: pointer;
          text-decoration: none;
          transition: all var(--transition-fast);
          display: inline-block;
        }
        .btn-login:hover {
          border-color: rgb(var(--color-primary));
          color: rgb(var(--color-primary));
          background: rgb(var(--color-primary-muted));
        }

        /* 회원가입 버튼 (Primary) */
        .btn-signup {
          padding: var(--space-2) var(--space-4);
          background: var(--gradient-primary);
          color: rgb(var(--text-on-primary));
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: var(--font-semibold);
          font-family: var(--font-sans);
          cursor: pointer;
          text-decoration: none;
          transition: opacity var(--transition-fast), transform var(--transition-fast);
          display: inline-block;
        }
        .btn-signup:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        /* ── 배너 ── */
        .guest-banner {
          background: var(--gradient-primary);
          color: rgb(255 255 255);
          text-align: center;
          padding: var(--space-10) var(--space-6) var(--space-8);
          position: relative;
          overflow: hidden;
        }
        /* 배너 배경 패턴 (subtle) */
        .guest-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(
              ellipse 60% 80% at 20% 120%,
              rgb(var(--primary-400) / 0.2) 0%,
              transparent 60%
            ),
            radial-gradient(
              ellipse 50% 60% at 80% -10%,
              rgb(var(--primary-300) / 0.15) 0%,
              transparent 50%
            );
          pointer-events: none;
        }

        .guest-badge {
          display: inline-block;
          background: rgb(255 255 255 / 0.2);
          color: rgb(255 255 255);
          font-size: 0.75rem;
          font-weight: var(--font-semibold);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: var(--space-1_5) var(--space-3);
          border-radius: var(--radius-full);
          margin-bottom: var(--space-4);
          position: relative;
          border: 1px solid rgb(255 255 255 / 0.3);
        }

        .guest-banner h1 {
          font-size: clamp(1.5rem, 4vw, 2.25rem);
          font-weight: var(--font-extrabold);
          line-height: 1.2;
          margin-bottom: var(--space-3);
          color: rgb(255 255 255);
          position: relative;
          letter-spacing: -0.02em;
        }

        .guest-banner-desc {
          font-size: clamp(0.9rem, 2.5vw, 1.0625rem);
          color: rgb(255 255 255 / 0.85);
          max-width: 760px;
          margin: 0 auto;
          line-height: 1.65;
          position: relative;
        }
        .guest-banner-desc-line {
          display: block;
        }

        .guest-banner-meta {
          margin-top: var(--space-4);
          font-size: 0.8125rem;
          color: rgb(255 255 255 / 0.65);
          position: relative;
        }

        /* ── 메인 콘텐츠 ── */
        .guest-main {
          max-width: 960px;
          margin: 0 auto;
          padding: var(--space-10) var(--space-6) var(--space-16);
          width: 100%;
        }

        .guest-section-label {
          text-align: center;
          font-size: 1.0625rem;
          font-weight: var(--font-semibold);
          color: rgb(var(--text-primary));
          margin-bottom: var(--space-6);
          letter-spacing: -0.01em;
        }

        /* ── 카테고리 그리드 ── */
        .guest-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: var(--space-4);
        }

        /* ── 카테고리 카드 (P3 카드 스펙) ── */
        .guest-card {
          background: rgb(var(--bg-surface));
          border: 1.5px solid rgb(var(--border));
          border-radius: var(--radius-xl);       /* 16px */
          padding: var(--space-6) var(--space-4) var(--space-5);
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-base);
          user-select: none;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .guest-card:hover:not(.guest-card--disabled) {
          border-color: rgb(var(--color-primary));
          background: rgb(var(--bg-surface-hover));
          transform: translateY(-4px);
          box-shadow: var(--shadow-primary-glow);
        }

        .guest-card--selected {
          border-color: rgb(var(--color-primary));
          background: rgb(var(--color-primary-muted));
          box-shadow: var(--shadow-primary-glow);
        }

        .guest-card--disabled {
          opacity: 0.5;
          pointer-events: none;
          cursor: not-allowed;
        }

        .guest-card--loading {
          opacity: 0.65;
        }

        .guest-card-icon {
          font-size: 2.25rem;
          display: block;
          margin-bottom: var(--space-3);
          line-height: 1;
        }

        .guest-card-name {
          font-size: 0.9375rem;
          font-weight: var(--font-semibold);
          color: rgb(var(--text-primary));
          margin-bottom: var(--space-1);
        }

        .guest-card-desc {
          font-size: 0.75rem;
          color: rgb(var(--text-secondary));
          line-height: 1.45;
        }

        /* 로딩 중 카드 스피너 오버레이 */
        .guest-card-spinner-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgb(var(--bg-surface) / 0.7);
          border-radius: calc(var(--radius-xl) - 2px);
          backdrop-filter: blur(2px);
        }

        /* ── 로딩 오버레이 ── */
        .guest-loading-overlay {
          position: fixed;
          inset: 0;
          background: rgb(var(--bg-base) / 0.88);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: var(--space-4);
        }

        .guest-loading-spinner {
          width: 44px;
          height: 44px;
          border: 4px solid rgb(var(--border));
          border-top-color: rgb(var(--color-primary));
          border-radius: 50%;
          animation: mcw-spin 0.8s linear infinite;
        }

        .guest-loading-text {
          font-size: 1rem;
          font-weight: var(--font-medium);
          color: rgb(var(--text-secondary));
          font-family: var(--font-sans);
        }

        /* ── 인라인 스피너 ── */
        .guest-inline-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgb(var(--border));
          border-top-color: rgb(var(--color-primary));
          border-radius: 50%;
          animation: mcw-spin 0.8s linear infinite;
        }

        /* ── 에러 토스트 ── */
        .guest-toast {
          position: fixed;
          bottom: var(--space-8);
          left: 50%;
          transform: translateX(-50%);
          background: rgb(var(--color-error));
          color: rgb(255 255 255);
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: var(--font-medium);
          font-family: var(--font-sans);
          box-shadow: 0 8px 24px rgb(var(--color-error) / 0.35);
          z-index: 600;
          max-width: 90vw;
          text-align: center;
          animation: mcw-slideUp 0.3s ease;
          white-space: nowrap;
        }

        /* ── 애니메이션 ── */
        @keyframes mcw-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes mcw-slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div className="guest-page">
        {/* ── 헤더 ──────────────────────────────────────────────── */}
        <header className="guest-header">
          <Link href="/" className="guest-logo">
            CoCoBot
          </Link>
          <div className="guest-header-actions">
            <Link href="/login" className="btn-login">로그인</Link>
            <Link href="/signup" className="btn-signup">회원가입</Link>
          </div>
        </header>

        {/* ── 안내 배너 ─────────────────────────────────────────── */}
        <div className="guest-banner">
          <h1>
            코코봇 체험
          </h1>
          <p className="guest-banner-desc">
            <span className="guest-banner-desc-line"><strong>아바타형</strong>은 나를 대신해 응대하고, <strong>도우미형</strong>은 나를 도와줍니다.</span>
            <span className="guest-banner-desc-line">카테고리를 선택하면 바로 대화할 수 있어요.</span>
          </p>
        </div>

        {/* ── 메인 콘텐츠 ───────────────────────────────────────── */}
        <main className="guest-main">
          {/* 아바타형 — 나를 대신하는 코코봇 */}
          <p className="guest-section-label">아바타형 — 나를 대신하는 코코봇</p>
          <CategoryGrid
            categories={AVATAR_CATS}
            selectedId={selectedId}
            loadingId={loadingId}
            onSelect={handleSelectCategory}
          />

          {/* 도우미형 — 나를 도와주는 코코봇 */}
          <p className="guest-section-label" style={{ marginTop: '2rem' }}>도우미형 — 나를 도와주는 코코봇</p>
          <CategoryGrid
            categories={HELPER_CATS}
            selectedId={selectedId}
            loadingId={loadingId}
            onSelect={handleSelectCategory}
          />
        </main>

        {/* ── 로딩 오버레이 ─────────────────────────────────────── */}
        {isLoading && <LoadingOverlay text={loadingText} />}

        {/* ── 에러 토스트 ───────────────────────────────────────── */}
        {toast && <ErrorToast message={toast} />}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   카테고리 그리드
───────────────────────────────────────────────────────────── */

interface CategoryGridProps {
  categories: Category[];
  selectedId: string | null;
  loadingId:  string | null;
  onSelect:   (cat: Category) => void;
}

function CategoryGrid({ categories, selectedId, loadingId, onSelect }: CategoryGridProps) {
  return (
    <div className="guest-grid">
      {categories.map((cat) => (
        <CategoryCard
          key={cat.id}
          cat={cat}
          isSelected={selectedId === cat.id}
          isLoading={loadingId === cat.id}
          isDisabled={loadingId !== null && loadingId !== cat.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   카테고리 카드
───────────────────────────────────────────────────────────── */

interface CategoryCardProps {
  cat:        Category;
  isSelected: boolean;
  isLoading:  boolean;
  isDisabled: boolean;
  onSelect:   (cat: Category) => void;
}

function CategoryCard({ cat, isSelected, isLoading, isDisabled, onSelect }: CategoryCardProps) {
  let cardClass = 'guest-card';
  if (isSelected) cardClass += ' guest-card--selected';
  if (isDisabled) cardClass += ' guest-card--disabled';
  if (isLoading)  cardClass += ' guest-card--loading';

  return (
    <div
      role="button"
      tabIndex={isDisabled || isLoading ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`${cat.name} - ${cat.desc}`}
      className={cardClass}
      onClick={() => !isDisabled && !isLoading && onSelect(cat)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled && !isLoading) {
          e.preventDefault();
          onSelect(cat);
        }
      }}
    >
      <span className="guest-card-icon">{cat.icon}</span>
      <div className="guest-card-name">{cat.name}</div>
      <div className="guest-card-desc">{cat.desc}</div>

      {/* 로딩 중 스피너 오버레이 */}
      {isLoading && (
        <div className="guest-card-spinner-overlay">
          <InlineSpinner />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   로딩 오버레이
───────────────────────────────────────────────────────────── */

function LoadingOverlay({ text }: { text: string }) {
  return (
    <div className="guest-loading-overlay">
      <div className="guest-loading-spinner" />
      <p className="guest-loading-text">{text}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   인라인 스피너 (카드 내부)
───────────────────────────────────────────────────────────── */

function InlineSpinner() {
  return <div className="guest-inline-spinner" />;
}

/* ─────────────────────────────────────────────────────────────
   에러 토스트
───────────────────────────────────────────────────────────── */

function ErrorToast({ message }: { message: string }) {
  return <div className="guest-toast">{message}</div>;
}
