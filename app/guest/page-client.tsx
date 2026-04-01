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

export default function GuestPageInner() {
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
