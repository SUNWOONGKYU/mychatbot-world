/**
 * @task S7FE7
 * @description 마이페이지 클라이언트 컴포넌트 — 9탭 통합 셸 (S7 리디자인)
 * Semantic 토큰 전용, PageToolbar + TabNav + 9탭 콘텐츠
 *
 * Route: /mypage
 */
'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import Tab1Profile from '@/components/mypage/Tab1Profile';
import Tab2BotManage from '@/components/mypage/Tab2BotManage';
import Tab3Learning from '@/components/mypage/Tab3Learning';
import Tab4Skills from '@/components/mypage/Tab4Skills';
import Tab5Operations from '@/components/mypage/Tab5Operations';
import Tab6Inheritance from '@/components/mypage/Tab6Inheritance';
import Tab7Credits from '@/components/mypage/Tab7Credits';
import Tab8Shop from '@/components/mypage/Tab8Shop';
import Tab8Security from '@/components/mypage/Tab8Security';
import { getToken, authHeaders } from '@/lib/auth-client';

// ── 타입 ─────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  notification_enabled: boolean;
  language: 'ko' | 'en';
}

interface BotItem {
  id: string;
  name: string;
  description: string | null;
  emoji?: string | null;
  deploy_url: string | null;
  created_at: string;
  status?: 'active' | 'draft' | 'paused';
  conversation_count?: number;
  personas?: Array<{ id: string; name: string; description?: string }>;
}

interface SkillItem {
  id: string;
  name: string;
  description: string | null;
  version: string;
  author: string;
  active: boolean;
  attached_bots: Array<{ id: string; name: string; emoji?: string | null }>;
  downloaded_at: string;
  icon?: string;
  category?: string;
}

interface CreditInfo {
  balance: number;
  total_charged: number;
}

type TabId = 'profile' | 'bots' | 'learning' | 'skills' | 'operations' | 'inheritance' | 'credits' | 'shop' | 'security';

// ── 상수 ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: TabId; label: string; icon: string }[] = [
  { id: 'profile',      label: '프로필 관리',    icon: '👤' },
  { id: 'bots',         label: '코코봇 관리',      icon: '🤖' },
  { id: 'learning',     label: '코코봇 교육',      icon: '📚' },
  { id: 'skills',       label: '스킬 관리',      icon: '⚡' },
  { id: 'operations',   label: '코코봇 운영 관리', icon: '💼' },
  { id: 'inheritance',  label: '상속',           icon: '🏛️' },
  { id: 'credits',      label: '크레딧·요금제',  icon: '🪙' },
  { id: 'shop',         label: '코코봇 상점',    icon: '🛒' },
  { id: 'security',     label: '계정 보안',      icon: '🔒' },
];

// ── 유틸 ─────────────────────────────────────────────────────────────────

// getToken/authHeaders → @/lib/auth-client 에서 import (Supabase 세션 기반)

// ── 프로필 헤더 (PageToolbar 패턴) ──────────────────────────────────────

function ProfileHeader({
  profile,
  credits,
}: {
  profile: UserProfile;
  credits: CreditInfo | null;
}) {
  const initials = profile.full_name?.trim()?.[0]?.toUpperCase() ?? (profile.email ?? 'U')[0].toUpperCase();
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-xl)] mb-5 px-5 py-4',
        'bg-[var(--surface-1)] border border-[var(--border-default)]',
      )}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center gap-4">
        {/* 아바타 */}
        <div className="flex-shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="프로필 사진"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-[var(--interactive-primary)] ring-offset-2 ring-offset-[var(--surface-1)]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-[var(--text-inverted)] bg-[var(--interactive-primary)]"
            >
              {initials}
            </div>
          )}
        </div>

        {/* 환영 메시지 */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-primary)] truncate [word-break:keep-all]">
            안녕하세요, {profile.full_name || profile.email.split('@')[0]}님
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            오늘도 코코봇이 열심히 일하고 있어요!
          </p>
        </div>

        {/* 크레딧 위젯 */}
        {credits !== null && (
          <div className="flex-shrink-0 text-right">
            <p className="text-lg font-bold text-[var(--accent-secondary)]">
              {credits.balance.toLocaleString('ko-KR')} CR
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">보유 크레딧</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 탭 네비게이션 (Tab Indicator 패턴) ──────────────────────────────────

function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (t: TabId) => void;
}) {
  // 모바일: 가로 스크롤 / 데스크톱(md+): 세로 사이드바
  return (
    <nav aria-label="마이페이지 탭 네비게이션">
      {/* 모바일 — 가로 스크롤 */}
      <div className="md:hidden overflow-x-auto -mx-4 mb-6">
        <div
          role="tablist"
          aria-orientation="horizontal"
          className="flex gap-0 border-b border-[var(--border-default)] min-w-max px-4"
        >
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={activeTab === item.id}
              aria-controls={`tab-panel-${item.id}`}
              id={`tab-m-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-1',
                activeTab === item.id
                  ? 'border-[var(--interactive-primary)] text-[var(--interactive-primary)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
              )}
            >
              <span className="text-base leading-none" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 데스크톱 — 세로 사이드바 */}
      <div
        role="tablist"
        aria-orientation="vertical"
        className={clsx(
          'hidden md:flex md:flex-col gap-1 p-2',
          'rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)]',
          'sticky top-4',
        )}
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={activeTab === item.id}
            aria-controls={`tab-panel-${item.id}`}
            id={`tab-${item.id}`}
            onClick={() => onTabChange(item.id)}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-[var(--radius-md)] transition-colors text-left',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-1',
              activeTab === item.id
                ? 'bg-[var(--interactive-primary)] text-[var(--text-inverted)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
            )}
          >
            <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ── 스켈레톤 로딩 ────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={clsx('rounded-[var(--radius-md)] bg-[var(--surface-2)] animate-pulse', className)} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="불러오는 중">
      <SkeletonBlock className="h-20 rounded-[var(--radius-xl)]" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-10 flex-1" />)}
      </div>
      <SkeletonBlock className="h-48 rounded-[var(--radius-xl)]" />
      <SkeletonBlock className="h-32 rounded-[var(--radius-xl)]" />
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────

export default function MyPageClient() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bots, setBots] = useState<BotItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [credits, setCredits] = useState<CreditInfo | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);

    (async () => {
      try {
        const [profileRes, botsRes, skillsRes, creditsRes] = await Promise.allSettled([
          fetch('/api/profile', { headers: authHeaders() }),
          fetch('/api/bots', { headers: authHeaders() }),
          fetch('/api/skills/my', { headers: authHeaders() }),
          fetch('/api/credits', { headers: authHeaders() }),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const json = await profileRes.value.json();
          setProfile(json.data ?? json);
        } else {
          setError('프로필 정보를 불러오지 못했습니다.');
        }

        if (botsRes.status === 'fulfilled' && botsRes.value.ok) {
          const data = await botsRes.value.json();
          setBots(Array.isArray(data) ? data : (data.bots ?? []));
        }

        if (skillsRes.status === 'fulfilled' && skillsRes.value.ok) {
          const data = await skillsRes.value.json();
          // API 응답: { skills: MySkillItem[], total }
          // MySkillItem: { installation_id, skill_id, installed_at, status, execution_count, last_used_at, skill_meta }
          // Tab4 기대: { id, name, description, version, author, active, attached_bots, downloaded_at, icon, category }
          const rawSkills = Array.isArray(data) ? data : (data.skills ?? []);
          const mapped: SkillItem[] = rawSkills.map((s: any) => ({
            id: s.skill_id ?? s.id,
            name: s.skill_meta?.name ?? s.name ?? '(이름 없음)',
            description: s.skill_meta?.description ?? s.description ?? null,
            version: s.skill_meta?.version ?? s.version ?? '1.0.0',
            author: s.skill_meta?.author ?? s.author ?? '',
            active: s.status !== undefined ? s.status === 'active' : (s.is_active ?? true),
            attached_bots: s.attached_bots ?? [],
            downloaded_at: s.installed_at ?? s.downloaded_at ?? new Date().toISOString(),
            icon: s.skill_meta?.icon ?? s.icon,
            category: s.skill_meta?.category ?? s.category,
          }));
          setSkills(mapped);
        }

        if (creditsRes.status === 'fulfilled' && creditsRes.value.ok) {
          const data = await creditsRes.value.json();
          setCredits(data);
        }
      } catch {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 비로그인 EmptyState 배너 */}
        <div
          role="alert"
          className={clsx(
            'mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3',
            'rounded-[var(--radius-xl)] border border-[var(--border-default)]',
            'bg-[var(--state-info-bg)] px-5 py-4',
          )}
        >
          <span className="text-2xl flex-shrink-0" aria-hidden="true">🔒</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-primary)] [word-break:keep-all]">
              로그인하면 실제 데이터가 표시됩니다
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 [word-break:keep-all]">
              지금은 미리보기 모드입니다. 로그인 후 내 코코봇, 스킬, 크레딧을 관리하세요.
            </p>
          </div>
          <a
            href="/login?redirect=/mypage"
            className={clsx(
              'shrink-0 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-colors',
              'bg-[var(--interactive-primary)] text-[var(--text-inverted)]',
              'hover:bg-[var(--interactive-primary-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
            )}
          >
            로그인
          </a>
        </div>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="py-8" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4" role="alert">
        <p className="text-[var(--state-danger-fg)] [word-break:keep-all]">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={clsx(
            'px-4 py-2 text-sm rounded-[var(--radius-md)] transition-colors',
            'border border-[var(--border-default)] text-[var(--text-secondary)]',
            'hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
          )}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <main
      className="max-w-6xl mx-auto px-4 py-6"
      aria-label="마이페이지"
    >
      {/* 프로필 헤더 */}
      {profile && <ProfileHeader profile={profile} credits={credits} />}

      {/* 데스크톱: 사이드바(220px) + 콘텐츠  /  모바일: 가로탭 위, 콘텐츠 아래 */}
      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-6">
        {/* 탭 네비게이션 */}
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 탭 콘텐츠 패널 */}
      <div className="min-w-0">
        <div
          role="tabpanel"
          id={`tab-panel-profile`}
          aria-labelledby="tab-profile"
          hidden={activeTab !== 'profile'}
        >
          {activeTab === 'profile' && profile && (
            <Tab1Profile profile={profile} onProfileUpdate={setProfile} />
          )}
        </div>

        <div
          role="tabpanel"
          id="tab-panel-bots"
          aria-labelledby="tab-bots"
          hidden={activeTab !== 'bots'}
        >
          {activeTab === 'bots' && (
            <Tab2BotManage bots={bots} onBotsChange={setBots} />
          )}
        </div>

        <div
          role="tabpanel"
          id="tab-panel-learning"
          aria-labelledby="tab-learning"
          hidden={activeTab !== 'learning'}
        >
          {activeTab === 'learning' && <Tab3Learning />}
        </div>

        <div
          role="tabpanel"
          id="tab-panel-skills"
          aria-labelledby="tab-skills"
          hidden={activeTab !== 'skills'}
        >
          {activeTab === 'skills' && (
            <Tab4Skills skills={skills} onSkillsChange={setSkills} />
          )}
        </div>

        <div
          role="tabpanel"
          id="tab-panel-operations"
          aria-labelledby="tab-operations"
          hidden={activeTab !== 'operations'}
        >
          {activeTab === 'operations' && <Tab5Operations />}
        </div>

        <div
          role="tabpanel"
          id="tab-panel-inheritance"
          aria-labelledby="tab-inheritance"
          hidden={activeTab !== 'inheritance'}
        >
          {activeTab === 'inheritance' && <Tab6Inheritance />}
        </div>

        <div
          role="tabpanel"
          id="tab-panel-credits"
          aria-labelledby="tab-credits"
          hidden={activeTab !== 'credits'}
        >
          {activeTab === 'credits' && <Tab7Credits />}
        </div>

        <div
          role="tabpanel"
          id="tab-panel-shop"
          aria-labelledby="tab-shop"
          hidden={activeTab !== 'shop'}
        >
          {activeTab === 'shop' && <Tab8Shop />}
        </div>

        <div
          role="tabpanel"
          id="tab-panel-security"
          aria-labelledby="tab-security"
          hidden={activeTab !== 'security'}
        >
          {activeTab === 'security' && <Tab8Security />}
        </div>

        {/* 관리자 링크 — 본인만 알아보는 수준의 아주 옅은 텍스트 (호버 시 선명) */}
        <div className="mt-12 mb-4 text-center">
          <a
            href="/admin"
            aria-label="관리자 대시보드"
            className="inline-block text-[10px] tracking-wider opacity-30 hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none"
            style={{ color: 'var(--text-tertiary)' }}
          >
            🔒 관리자
          </a>
        </div>
      </div>
      </div>
    </main>
  );
}
