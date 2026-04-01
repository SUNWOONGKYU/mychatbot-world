/**
 * @task S2FE2
 * @description Bot 대화 페이지 — dynamic route /bot/[botId]
 *
 * 기능:
 * - botId 기반 챗봇 정보(이름, 페르소나) 로딩
 * - ChatWindow, EmotionSlider 컴포넌트 렌더링
 * - 대화 히스토리 localStorage 임시 저장
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ChatWindow from '@/components/bot/chat-window';
import EmotionSlider from '@/components/bot/emotion-slider';
import { createClient } from '@/lib/supabase';

// ============================
// 타입 정의
// ============================

/** Supabase personas 테이블에서 로드하는 봇 정보 */
interface BotInfo {
  /** 봇 ID */
  id: string;
  /** 봇 표시 이름 */
  name: string;
  /** 아바타 URL (선택) */
  avatar_url?: string;
  /** 소개 텍스트 (선택) */
  description?: string;
}

/** localStorage 저장 형식 */
interface StoredConversation {
  /** 대화 ID */
  conversationId: string;
  /** 마지막 저장 시각 (ISO) */
  savedAt: string;
}

// ============================
// 상수
// ============================

const LS_KEY_PREFIX = 'mcw_conv_';

// ============================
// 페이지 컴포넌트
// ============================

/**
 * Bot 대화 페이지
 *
 * 라우트: /bot/[botId]
 */
export default function BotChatPage() {
  const params = useParams();
  const botId = typeof params?.botId === 'string' ? params.botId : '';

  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [loadError, setLoadError] = useState<string>('');
  const [emotionLevel, setEmotionLevel] = useState<number>(50);
  const [conversationId, setConversationId] = useState<string>('');

  // ──────────────────────────────────────────
  // localStorage에서 이전 conversationId 복원
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!botId) return;
    try {
      const raw = localStorage.getItem(`${LS_KEY_PREFIX}${botId}`);
      if (raw) {
        const stored: StoredConversation = JSON.parse(raw) as StoredConversation;
        setConversationId(stored.conversationId);
      }
    } catch {
      // localStorage 접근 실패는 무시
    }
  }, [botId]);

  // ──────────────────────────────────────────
  // 새 conversationId 생성 시 localStorage 저장
  // ──────────────────────────────────────────
  const handleConversationCreated = useCallback(
    (newConvId: string) => {
      setConversationId(newConvId);
      if (!botId) return;
      try {
        const stored: StoredConversation = {
          conversationId: newConvId,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(
          `${LS_KEY_PREFIX}${botId}`,
          JSON.stringify(stored)
        );
      } catch {
        // 무시
      }
    },
    [botId]
  );

  // ──────────────────────────────────────────
  // 봇 정보 로딩 (Supabase personas 테이블)
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!botId) {
      setLoadError('봇 ID가 없습니다.');
      return;
    }

    let cancelled = false;

    async function fetchBot() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('personas')
          .select('id, name, avatar_url, description')
          .eq('id', botId)
          .single();

        if (cancelled) return;

        if (error || !data) {
          setLoadError('봇 정보를 불러올 수 없습니다.');
          return;
        }

        setBotInfo(data as BotInfo);
      } catch {
        if (!cancelled) setLoadError('봇 정보 로딩 중 오류가 발생했습니다.');
      }
    }

    void fetchBot();
    return () => {
      cancelled = true;
    };
  }, [botId]);

  // ──────────────────────────────────────────
  // 대화 초기화 (새 대화 시작)
  // ──────────────────────────────────────────
  const handleNewConversation = useCallback(() => {
    setConversationId('');
    if (botId) {
      try {
        localStorage.removeItem(`${LS_KEY_PREFIX}${botId}`);
      } catch {
        // 무시
      }
    }
  }, [botId]);

  // ──────────────────────────────────────────
  // 로딩 / 에러 상태 UI
  // ──────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="rounded-2xl bg-white p-8 shadow text-center max-w-sm">
          <p className="text-red-500 font-medium">{loadError}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!botInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-neutral-500">봇 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // 메인 레이아웃
  // ──────────────────────────────────────────
  return (
    <div className="flex flex-col h-dvh bg-neutral-50">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          {botInfo.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={botInfo.avatar_url}
              alt={botInfo.name}
              className="h-9 w-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
              {botInfo.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900 truncate">
              {botInfo.name}
            </p>
            {botInfo.description && (
              <p className="text-xs text-neutral-500 truncate">
                {botInfo.description}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleNewConversation}
          title="새 대화 시작"
          className="text-xs text-neutral-500 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
        >
          새 대화
        </button>
      </header>

      {/* 감성 슬라이더 (헤더 아래) */}
      <div className="px-4 py-2 bg-white border-b border-neutral-100">
        <EmotionSlider value={emotionLevel} onChange={setEmotionLevel} />
      </div>

      {/* 채팅 창 */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          botId={botId}
          botName={botInfo.name}
          emotionLevel={emotionLevel}
          conversationId={conversationId}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </div>
  );
}
