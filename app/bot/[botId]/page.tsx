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
import { createClient } from '@/lib/supabase';

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
      // 1차: Supabase mcw_bots 테이블
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase
          .from('mcw_bots')
          .select('*')
          .or(`id.eq.${botId},username.eq.${botId}`)
          .single();

        if (!error && data) {
          const raw = data as Record<string, unknown>;
          let personas = (raw.personas as BotData['personas']) || [];
          if (!personas || personas.length === 0) {
            personas = [{
              id: 'default',
              name: (raw.bot_name as string) || (raw.botName as string) || 'Bot',
              role: (raw.personality as string) || 'AI Assistant',
              model: 'logic',
              isVisible: true,
            }];
          }
          setBotData({
            id: (raw.id as string) || botId,
            botName: (raw.bot_name as string) || (raw.botName as string) || 'Bot',
            username: (raw.username as string) || '',
            personality: (raw.personality as string) || '',
            greeting: (raw.greeting as string) || '',
            tone: (raw.tone as string) || '',
            voice: (raw.voice as string) || '',
            faqs: (raw.faqs as BotData['faqs']) || [],
            personas,
            ownerId: (raw.owner_id as string) || (raw.ownerId as string) || '',
            dmPolicy: (raw.dm_policy as string) || (raw.dmPolicy as string) || '',
            allowedUsers: (raw.allowed_users as string[]) || [],
            pairingCode: (raw.pairing_code as string) || (raw.pairingCode as string) || '',
          });
          return;
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

      // 3차: 기본 봇
      setBotData({
        id: botId,
        botName: 'Bot',
        username: botId,
        personality: 'AI 챗봇입니다.',
        greeting: '안녕하세요! 무엇이든 물어보세요.',
        faqs: [],
        personas: [{
          id: 'default',
          name: 'AI 어시스턴트',
          role: 'AI 챗봇입니다.',
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
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: 'rgb(var(--bg-base))' }}
      >
        <div
          className="rounded-2xl p-8 text-center max-w-sm"
          style={{
            background: 'rgb(var(--bg-surface))',
            border: '1.5px solid rgb(var(--border))',
          }}
        >
          <p className="font-medium" style={{ color: 'rgb(var(--color-error))' }}>{loadError}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 text-sm transition-all"
            style={{
              borderRadius: 'var(--radius-lg)',
              background: 'rgb(var(--color-primary))',
              color: 'rgb(var(--text-on-primary))',
              border: 'none',
            }}
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
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'rgb(var(--bg-base))' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: 'rgb(var(--color-primary))', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
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
