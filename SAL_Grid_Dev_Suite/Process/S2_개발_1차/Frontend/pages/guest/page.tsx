/**
 * @task S2FE6 - Guest 모드 React 전환
 * @description 게스트 모드 페이지 — 인증 없이 데모 챗봇 체험
 *
 * - PUBLIC 라우트 (인증 불필요)
 * - ?botId 쿼리 파라미터로 데모봇 지정 (없으면 기본 데모봇)
 * - GuestHeader: 상단 CTA 배너
 * - GuestChat: 채팅 UI (10회 제한, localStorage 저장)
 * - SignupPrompt: 10회 초과 가입 유도 모달
 * - 풀스크린 레이아웃 (min-h-screen), 사이드바 없음
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GuestHeader } from '@/components/guest/guest-header';
import { GuestChat } from '@/components/guest/guest-chat';
import { SignupPrompt } from '@/components/guest/signup-prompt';

/* ── 내부: 쿼리 파라미터 읽기 (Suspense 래핑 필요) ────────────── */

function GuestPageInner() {
  const searchParams = useSearchParams();
  const botId = searchParams.get('botId') ?? undefined;

  const [showPrompt, setShowPrompt] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  /** GuestChat에서 턴 수 동기화를 위한 프록시 핸들러 */
  const handleLimitReached = () => {
    setShowPrompt(true);
  };

  const remaining = Math.max(0, 10 - turnCount);

  return (
    <>
      {/* 상단 헤더 */}
      <GuestHeader remainingCount={remaining} />

      {/* 채팅 영역 — 남은 공간 전체 사용 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <GuestChat
          botId={botId}
          onLimitReached={handleLimitReached}
        />
      </div>

      {/* 10회 초과 가입 유도 모달 */}
      <SignupPrompt
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
      />
    </>
  );
}

/* ── 페이지 컴포넌트 ─────────────────────────────────────────── */

/**
 * GuestPage — 비로그인 사용자 데모 챗봇 체험 페이지
 *
 * Next.js App Router — `app/guest/page.tsx`
 * PUBLIC 라우트: middleware 인증 체크 제외 대상
 *
 * SEO: noindex (데모 페이지)
 */
export default function GuestPage() {
  return (
    /*
     * 루트 레이아웃(layout.tsx)의 Sidebar + Header를 우회하기 위해
     * 풀스크린 독립 레이아웃을 사용.
     * 주의: 현재 루트 layout.tsx가 모든 라우트에 Sidebar를 강제로 렌더링하므로,
     * 추후 (public) 라우트 그룹 분리 권장:
     *   app/(public)/guest/page.tsx  →  app/(public)/layout.tsx (no sidebar)
     */
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <svg
                className="animate-spin w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm">챗봇을 불러오는 중...</span>
            </div>
          </div>
        }
      >
        <GuestPageInner />
      </Suspense>
    </div>
  );
}
