/**
 * @task S2FE3
 * @description Home 대시보드 페이지 — 챗봇 목록 / KB 관리 / 사용량 / 설정 탭 구조
 *
 * Route: /home
 * - 미로그인 시 "/" 리다이렉트
 * - S2BA3 API (/api/bots, /api/kb, /api/settings) 연동
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { createClient } from '@supabase/supabase-js';
import { Dashboard } from '@/components/home/dashboard';
import { KbManager } from '@/components/home/kb-manager';
import { SettingsPanel } from '@/components/home/settings-panel';

// ── 타입 정의 ────────────────────────────────────────────────

/** 챗봇 항목 */
export interface Bot {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  deploy_url: string | null;
  qr_svg: string | null;
  created_at: string;
  updated_at: string;
  conversation_count?: number;
}

/** 대시보드 탭 */
type TabId = 'bots' | 'kb' | 'usage' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

// ── 상수 ─────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: 'bots',     label: '챗봇 목록', icon: '🤖' },
  { id: 'kb',       label: 'KB 관리',   icon: '📚' },
  { id: 'usage',    label: '사용량',    icon: '📊' },
  { id: 'settings', label: '설정',      icon: '⚙️' },
];

// ── 컴포넌트 ─────────────────────────────────────────────────

/**
 * Home 대시보드 페이지
 * 로그인된 사용자만 접근 가능, 4개 탭으로 구성
 */
export default function HomeDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('bots');
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [botsError, setBotsError] = useState<string | null>(null);

  // ── 인증 확인 ─────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/');
      }
    });
  }, [router]);

  // ── 챗봇 목록 로딩 ────────────────────────────────────────

  const fetchBots = useCallback(async () => {
    setLoadingBots(true);
    setBotsError(null);
    try {
      const res = await fetch('/api/bots');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      // API 응답 구조: { success, data: { bots: [...] } } 또는 { bots: [...] }
      const botList: Bot[] = data?.data?.bots ?? data?.bots ?? data ?? [];
      setBots(botList);
      // 첫 번째 봇을 기본 선택
      if (botList.length > 0 && !selectedBotId) {
        setSelectedBotId(botList[0].id);
      }
    } catch (err) {
      setBotsError(err instanceof Error ? err.message : '챗봇 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingBots(false);
    }
  }, [selectedBotId]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  // ── 핸들러 ────────────────────────────────────────────────

  /** 탭 전환 핸들러 */
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  /** 봇 삭제 후 목록 갱신 */
  const handleBotDeleted = (deletedId: string) => {
    setBots((prev) => prev.filter((b) => b.id !== deletedId));
    if (selectedBotId === deletedId) {
      setSelectedBotId(null);
    }
  };

  // ── 렌더 ──────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">대시보드</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            내 챗봇을 관리하고 사용량을 확인하세요.
          </p>
        </div>

        {/* 새 챗봇 만들기 */}
        <button
          onClick={() => router.push('/create')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-primary text-white text-sm font-medium',
            'hover:bg-primary-hover transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          <span>＋</span>
          <span>새 챗봇 만들기</span>
        </button>
      </div>

      {/* 탭 바 */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium',
              'border-b-2 -mb-px transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong',
            )}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div role="tabpanel">
        {activeTab === 'bots' && (
          <Dashboard
            bots={bots}
            loading={loadingBots}
            error={botsError}
            selectedBotId={selectedBotId}
            onSelectBot={setSelectedBotId}
            onBotDeleted={handleBotDeleted}
            onRefresh={fetchBots}
          />
        )}

        {activeTab === 'kb' && (
          <KbManager
            botId={selectedBotId}
            bots={bots}
            onSelectBot={setSelectedBotId}
          />
        )}

        {activeTab === 'usage' && (
          /* 사용량 탭은 Dashboard 컴포넌트의 usage 섹션 재사용 */
          <Dashboard
            bots={bots}
            loading={loadingBots}
            error={botsError}
            selectedBotId={selectedBotId}
            onSelectBot={setSelectedBotId}
            onBotDeleted={handleBotDeleted}
            onRefresh={fetchBots}
            defaultSection="usage"
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            botId={selectedBotId}
            bots={bots}
            onSelectBot={setSelectedBotId}
          />
        )}
      </div>
    </div>
  );
}
