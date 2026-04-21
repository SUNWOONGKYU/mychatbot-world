/**
 * @task S12FE3
 * @description 페르소나 포털 탭별 상태 보존 Context
 *
 * 핵심:
 * - 탭 state 는 useRef<Map> 에 저장 → 리렌더 없이 쓰기
 * - activeId 만 useState (리렌더 트리거)
 * - setActive: 이탈 탭의 abortController.abort() → 스트리밍 즉시 중단
 */
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface TabState {
  conv_id: string | null;
  inputDraft: string;
  scrollTop: number;
  streaming: boolean;
  abortController: AbortController | null;
}

interface HubContextValue {
  getTab: (botId: string) => TabState;
  updateTab: (botId: string, patch: Partial<TabState>) => void;
  clearTab: (botId: string) => void;
  activeId: string | null;
  setActive: (botId: string) => void;
}

const HubContext = createContext<HubContextValue | null>(null);

function defaultState(): TabState {
  return {
    conv_id: null,
    inputDraft: '',
    scrollTop: 0,
    streaming: false,
    abortController: null,
  };
}

export function HubProvider({
  children,
  initialActiveId = null,
}: {
  children: ReactNode;
  initialActiveId?: string | null;
}) {
  const statesRef = useRef<Map<string, TabState>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);

  const getTab = useCallback((botId: string): TabState => {
    let s = statesRef.current.get(botId);
    if (!s) {
      s = defaultState();
      statesRef.current.set(botId, s);
    }
    return s;
  }, []);

  const updateTab = useCallback(
    (botId: string, patch: Partial<TabState>) => {
      const s = getTab(botId);
      statesRef.current.set(botId, { ...s, ...patch });
    },
    [getTab],
  );

  const clearTab = useCallback((botId: string) => {
    const s = statesRef.current.get(botId);
    s?.abortController?.abort();
    statesRef.current.delete(botId);
  }, []);

  const setActive = useCallback(
    (botId: string) => {
      setActiveId((prev) => {
        if (prev && prev !== botId) {
          // 이탈 탭의 스트리밍 abort
          const leaving = statesRef.current.get(prev);
          if (leaving?.abortController && leaving.streaming) {
            try {
              leaving.abortController.abort();
            } catch {
              /* ignore */
            }
            statesRef.current.set(prev, {
              ...leaving,
              streaming: false,
              abortController: null,
            });
          }
        }
        return botId;
      });
    },
    [],
  );

  const value = useMemo<HubContextValue>(
    () => ({ getTab, updateTab, clearTab, activeId, setActive }),
    [getTab, updateTab, clearTab, activeId, setActive],
  );

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHubContext(): HubContextValue {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHubContext must be used within HubProvider');
  return ctx;
}
