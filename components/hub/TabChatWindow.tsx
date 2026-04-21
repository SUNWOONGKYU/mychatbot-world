/**
 * @task S12FE4
 * @description 활성 탭 전용 ChatWindow 래퍼
 *
 * 역할:
 * - Context 에서 conv_id 복원 → ChatWindow 로 전달
 * - ChatWindow 의 onConversationCreated 콜백으로 Context 에 conv_id 저장
 * - 봇 상세 데이터는 /api/bots/public/{botId} 에서 로드 (app/bot/[botId]/page.tsx 와 동일 패턴)
 *
 * 주의:
 * - 탭 전환 시 key={botId} 로 언마운트/재마운트
 * - 스크롤 위치·입력 드래프트 보존은 현재 ChatWindow 가 외부 제어를 받지 않아 한계 존재
 *   (conv_id 복원 시 DB 에서 메시지 재조회되므로 대화 맥락 자체는 보존됨)
 */
'use client';

import { useEffect, useState } from 'react';
import ChatWindow, { type BotData } from '@/components/bot/chat-window';
import { useHubContext } from './TabContext';

interface Props {
  botId: string;
}

export default function TabChatWindow({ botId }: Props) {
  const { getTab, updateTab } = useHubContext();
  const [botData, setBotData] = useState<BotData | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bots/public/${encodeURIComponent(botId)}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled) setLoadError('봇 정보를 불러오지 못했습니다.');
          return;
        }
        const json = (await res.json()) as {
          success: boolean;
          data?: { bot: Record<string, unknown>; personas: Array<Record<string, unknown>> };
        };
        if (!json.success || !json.data?.bot) {
          if (!cancelled) setLoadError('봇을 찾을 수 없습니다.');
          return;
        }
        const raw = json.data.bot;
        const botName = (raw.bot_name as string) || (raw.botName as string) || 'Bot';
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
        if (personas.length === 0) {
          personas = [{
            id: 'default',
            name: botName,
            role: (raw.category as string) || '',
            model: 'logic',
            isVisible: true,
          }];
        }
        if (cancelled) return;
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
      } catch {
        if (!cancelled) setLoadError('네트워크 오류');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [botId]);

  const tab = getTab(botId);
  const initialConvId = tab.conv_id || '';

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-state-danger-fg [word-break:keep-all]">
        {loadError}
      </div>
    );
  }

  if (!botData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-interactive-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <ChatWindow
      botData={botData}
      botId={botId}
      conversationId={initialConvId}
      onConversationCreated={(id) => updateTab(botId, { conv_id: id })}
    />
  );
}
