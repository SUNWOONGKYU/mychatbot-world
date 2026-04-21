/**
 * @task S2FE2
 * @description Bot 대화 페이지 — dynamic route /bot/[botId]
 *
 * Vanilla → React 전환:
 * - botId 기반 봇 정보 로딩 (Supabase mcw_bots 테이블 우선, 로컬 스토리지 폴백)
 * - ChatWindow 컴포넌트에 BotData 전달 (페르소나, FAQ 포함)
 * - 다크 배경 (#0f0f1a) 레이아웃 — Vanilla chat-body와 동일
 * - conversationId localStorage 저장/복원
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import ChatWindow, { type BotData } from '@/components/bot/chat-window';

// ============================
// 상수
// ============================

const LS_KEY_PREFIX = 'mcw_conv_';

// ============================
// 페이지 컴포넌트
// ============================

export default function BotChatPage() {
  const params = useParams();
  const botId = typeof params?.botId === 'string' ? params.botId : '';

  const [botData, setBotData] = useState<BotData | null>(null);
  const [loadError, setLoadError] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const loadedRef = useRef(false);

  // ── localStorage에서 이전 conversationId 복원 ──────────────
  useEffect(() => {
    if (!botId) return;
    try {
      const raw = localStorage.getItem(`${LS_KEY_PREFIX}${botId}`);
      if (raw) {
        const stored = JSON.parse(raw) as { conversationId?: string };
        if (stored.conversationId) setConversationId(stored.conversationId);
      }
    } catch { /* ignore */ }
  }, [botId]);

  const handleConversationCreated = useCallback(
    (newConvId: string) => {
      setConversationId(newConvId);
      if (!botId) return;
      try {
        localStorage.setItem(
          `${LS_KEY_PREFIX}${botId}`,
          JSON.stringify({ conversationId: newConvId, savedAt: new Date().toISOString() })
        );
      } catch { /* ignore */ }
    },
    [botId]
  );

  // ── 봇 데이터 로딩 ─────────────────────────────────────────
  useEffect(() => {
    if (!botId || loadedRef.current) return;
    loadedRef.current = true;

    async function fetchBot() {
      // 1차: 공개 조회 API (service role로 RLS 우회 — 로그인 여부 무관)
      try {
        const res = await fetch(`/api/bots/public/${encodeURIComponent(botId)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = (await res.json()) as {
            success: boolean;
            data?: {
              bot: Record<string, unknown>;
              personas: Array<Record<string, unknown>>;
            };
          };
          if (json.success && json.data?.bot) {
            const raw = json.data.bot;
            const botName =
              (raw.bot_name as string) || (raw.botName as string) || 'Bot';
            // mcw_personas 테이블에서 직접 로드한 페르소나 목록을 BotData 스키마로 변환
            let personas: BotData['personas'] = (json.data.personas || []).map((p) => ({
              id: String(p.id ?? ''),
              name: (p.name as string) || botName,
              role: (p.role as string) || '',
              model: (p.model as string) || 'logic',
              category: (p.category as string) || undefined,
              isVisible: p.is_visible !== false,
              isPublic: p.is_public !== false,
              userTitle: (p.user_title as string) || '',
              greeting: (p.greeting as string) || '',
              faqs: (p.faqs as BotData['faqs']) || [],
            }));
            // 페르소나가 없으면 봇 이름 기반 기본 페르소나 1개 생성
            if (personas.length === 0) {
              personas = [{
                id: 'default',
                name: botName,
                role: (raw.category as string) || '',
                model: 'logic',
                isVisible: true,
              }];
            }
            setBotData({
              id: (raw.id as string) || botId,
              botName,
              username: (raw.username as string) || '',
              personality: (raw.bot_desc as string) || '',
              greeting: (raw.greeting as string) || '',
              tone: (raw.tone as string) || '',
              voice: (raw.voice as string) || '',
              faqs: (raw.faqs as BotData['faqs']) || [],
              personas,
              ownerId: (raw.owner_id as string) || '',
            });
            return;
          }
        }
      } catch { /* fallback */ }

      // 2차: localStorage (mcw_bots)
      try {
        const stored = localStorage.getItem('mcw_bots');
        if (stored) {
          const bots = JSON.parse(stored) as BotData[];
          const found = bots.find(
            (b) => b.id === botId || b.username === botId
          );
          if (found) {
            if (!found.personas || found.personas.length === 0) {
              found.personas = [{
                id: 'default',
                name: found.botName,
                role: found.personality || 'AI Assistant',
                model: 'logic',
                isVisible: true,
              }];
            }
            setBotData(found);
            return;
          }
        }
      } catch { /* fallback */ }

      // 3차: 최종 폴백 — 네트워크·저장소 모두 실패한 경우에만
      //   URL의 botId를 봇 이름으로 대체해, "AI Assistant" 같은 오인 라벨이 보이지 않도록 함
      const fallbackName = decodeURIComponent(botId).replace(/-/g, ' ') || '코코봇';
      setBotData({
        id: botId,
        botName: fallbackName,
        username: botId,
        personality: '',
        greeting: '안녕하세요! 무엇이든 물어보세요.',
        faqs: [],
        personas: [{
          id: 'default',
          name: fallbackName,
          role: '',
          model: 'logic',
          isVisible: true,
          category: 'avatar',
        }],
      });
    }

    void fetchBot().catch(() => {
      setLoadError('봇 정보를 불러오는 중 오류가 발생했습니다.');
    });
  }, [botId]);

  // ── 에러 상태 ──────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-surface-0">
        <div className="rounded-2xl p-8 text-center max-w-sm bg-surface-2 border border-border-default shadow-[var(--shadow-lg)]">
          <p className="text-base font-semibold text-state-danger-fg [word-break:keep-all]">
            {loadError}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-5 px-5 py-2.5 rounded-lg text-sm font-semibold
              bg-interactive-primary text-text-inverted
              hover:bg-interactive-primary-hover transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  // ── 로딩 상태 ──────────────────────────────────────────────
  if (!botData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 rounded-full border-4 border-interactive-primary border-t-transparent animate-spin"
            aria-label="로딩 중"
          />
          <p className="text-sm text-text-tertiary [word-break:keep-all]">
            봇 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // ── 메인 ──────────────────────────────────────────────────
  return (
    <ChatWindow
      botData={botData}
      botId={botId}
      conversationId={conversationId}
      onConversationCreated={handleConversationCreated}
    />
  );
}
