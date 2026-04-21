/**
 * @task S12FE1, S12FE4, S12FE5, S12FE6
 * @description 페르소나 포털 /hub 클라이언트 셸
 *
 * 역할:
 * - 인증 확인 (미로그인 → /login?redirect=/hub)
 * - /api/bots prefetch → bots[] 획득 + refetch 함수 제공
 * - 봇 0개 → 온보딩 CTA / 봇 1개 이상 → HubProvider + HubInner
 * - HubInner: HubShell + BirthWizardModal + URL/localStorage 동기화
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, authHeaders } from '@/lib/auth-client';
import { HubProvider, useHubContext } from '@/components/hub/TabContext';
import HubShell from '@/components/hub/HubShell';
import BirthWizardModal from '@/components/hub/BirthWizardModal';
import type { BotListItem } from '@/components/hub/PersonaTabBar';

const LAST_TAB_KEY = 'mcw:hub:lastTab';

interface HubBot {
  id: string;
  owner_id: string;
  username: string;
  bot_name: string;
  bot_desc: string | null;
  emoji: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  order_index: number;
  last_active: string | null;
  unread_count: number;
}

interface BotsApiResponse {
  success: boolean;
  error?: string;
  data: { bots: HubBot[]; count: number } | null;
}

// ── HubInner: HubProvider 내부에서만 실행 (useHubContext 필요) ─────────
function HubInner({
  bots,
  refetch,
}: {
  bots: HubBot[];
  refetch: () => Promise<HubBot[]>;
}) {
  const router = useRouter();
  const { activeId, setActive } = useHubContext();
  const [modalOpen, setModalOpen] = useState(false);

  // ── FE6: activeId 변경 시 URL/localStorage 동기화 ───────────────
  useEffect(() => {
    if (!activeId) return;
    try {
      localStorage.setItem(LAST_TAB_KEY, activeId);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== activeId) {
      url.searchParams.set('tab', activeId);
      window.history.replaceState(null, '', url.toString());
    }
  }, [activeId]);

  // ── 유효하지 않은 activeId 폴백 ─────────────────────────────────
  useEffect(() => {
    if (!activeId) return;
    if (!bots.some((b) => b.id === activeId)) {
      try {
        localStorage.removeItem(LAST_TAB_KEY);
      } catch {
        /* ignore */
      }
      const fallback = bots[0]?.id;
      if (fallback) setActive(fallback);
    }
  }, [bots, activeId, setActive]);

  const tabItems: BotListItem[] = useMemo(
    () =>
      bots.map((b) => ({
        id: b.id,
        bot_name: b.bot_name,
        emoji: b.emoji,
        unread_count: b.unread_count,
      })),
    [bots],
  );

  const handleAddBot = useCallback(() => {
    if (bots.length >= 10) return;
    setModalOpen(true);
  }, [bots.length]);

  const handleCreated = useCallback(
    async (newBotId: string) => {
      setModalOpen(false);
      const next = await refetch();
      if (next.some((b) => b.id === newBotId)) {
        setActive(newBotId);
      }
    },
    [refetch, setActive],
  );

  return (
    <>
      <HubShell bots={tabItems} onAddBot={handleAddBot} />
      <BirthWizardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

export default function HubClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<HubBot[]>([]);
  const [error, setError] = useState<string>('');
  const mountedRef = useRef(true);

  const fetchBots = useCallback(async (): Promise<HubBot[]> => {
    const res = await fetch('/api/bots?limit=100', {
      cache: 'no-store',
      headers: authHeaders(false),
    });
    if (res.status === 401) {
      router.replace('/login?redirect=/hub');
      return [];
    }
    const json = (await res.json()) as BotsApiResponse;
    if (!json.success || !json.data) {
      throw new Error(json.error || '봇 목록을 불러오지 못했습니다.');
    }
    if (mountedRef.current) setBots(json.data.bots);
    return json.data.bots;
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;
    const token = getToken();
    if (!token) {
      router.replace('/login?redirect=/hub');
      return;
    }
    (async () => {
      try {
        await fetchBots();
      } catch (e) {
        if (mountedRef.current) {
          setError(e instanceof Error ? e.message : '알 수 없는 오류');
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [router, fetchBots]);

  const initialActiveId = useMemo<string | null>(() => {
    if (typeof window === 'undefined' || bots.length === 0) return null;
    const param = new URLSearchParams(window.location.search).get('tab');
    if (param && bots.some((b) => b.id === param)) return param;
    try {
      const stored = localStorage.getItem(LAST_TAB_KEY);
      if (stored && bots.some((b) => b.id === stored)) return stored;
    } catch {
      /* ignore */
    }
    return bots[0]?.id ?? null;
  }, [bots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <p className="text-state-danger-fg text-sm mb-4 [word-break:keep-all]">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-interactive-primary text-text-inverted hover:bg-interactive-primary-hover transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4" aria-hidden>🌱</div>
          <h1 className="text-xl font-bold text-text-primary mb-2">
            첫 페르소나를 만들어보세요
          </h1>
          <p className="text-sm text-text-secondary mb-6 [word-break:keep-all]">
            나만의 코코봇을 탄생시키고, 여기서 모든 대화를 한눈에 관리할 수 있어요.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-interactive-primary text-text-inverted hover:bg-interactive-primary-hover transition-colors"
          >
            <span>+ 새 페르소나 만들기</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <HubProvider initialActiveId={initialActiveId}>
      <HubInner bots={bots} refetch={fetchBots} />
    </HubProvider>
  );
}
