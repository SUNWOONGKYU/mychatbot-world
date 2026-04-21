/**
 * @task S12FE4
 * @description 페르소나 포털 셸 — PersonaTabBar + React.lazy ChatWindow
 *
 * 성능:
 * - TabChatWindow 는 React.lazy 로 별도 번들 분리 (hub 초기 번들 경량화)
 * - key={activeId} 로 탭 전환 시 언마운트/재마운트 (메모리 누수 방지)
 * - 비활성 탭 state 는 HubProvider 의 useRef<Map> 에 보존 → 재진입 시 복원
 */
'use client';

import { Suspense, lazy, useCallback } from 'react';
import PersonaTabBar, { type BotListItem } from './PersonaTabBar';
import { useHubContext } from './TabContext';

const TabChatWindow = lazy(() => import('./TabChatWindow'));

interface Props {
  bots: BotListItem[];
  onAddBot: () => void;
}

export default function HubShell({ bots, onAddBot }: Props) {
  const { activeId, setActive } = useHubContext();

  const handleSelect = useCallback(
    (botId: string) => {
      setActive(botId);
    },
    [setActive],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <PersonaTabBar
        bots={bots}
        activeId={activeId}
        onSelect={handleSelect}
        onAdd={onAddBot}
      />
      <div
        id="hub-tabpanel"
        role="tabpanel"
        aria-labelledby={activeId ?? undefined}
        className="flex-1 min-h-0 overflow-hidden"
      >
        {activeId ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-interactive-primary border-t-transparent animate-spin" />
              </div>
            }
          >
            <TabChatWindow key={activeId} botId={activeId} />
          </Suspense>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
            탭을 선택하세요
          </div>
        )}
      </div>
    </div>
  );
}
