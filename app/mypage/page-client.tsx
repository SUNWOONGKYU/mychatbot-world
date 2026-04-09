/**
 * @task S5FE6
 * @description 마이페이지 클라이언트 컴포넌트 — 8탭 구조 (탭1~4 구현)
 * S5 디자인 시스템 기반, 다크/라이트 동시 지원
 *
 * Route: /mypage
 * Tabs:
 *   탭1. 프로필 관리 (닉네임/이메일/가입일, 아바타, 알림)
 *   탭2. 챗봇 관리 (카드뷰, 페르소나, 툴6종, 복제/내보내기/삭제)
 *   탭3. 챗봇 학습 (KB주입, Wiki-e-RAG, FAQ, 학습현황)
 *   탭4. 스킬 관리 (다운로드 스킬, 토글, 장착봇, 마켓등록)
 *   탭5~8. 챗봇운영관리 / 상속 / 크레딧결제 / 계정보안 (별도 Task S5FE7)
 *
 * APIs:
 *   /api/auth/me            — 프로필 조회
 *   /api/bots               — 내 챗봇 목록
 *   /api/skills/my          — 내 스킬 목록
 *   /api/credits            — 크레딧 잔액
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
import Tab8Security from '@/components/mypage/Tab8Security';

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

type TabId = 'profile' | 'bots' | 'learning' | 'skills' | 'operations' | 'inheritance' | 'credits' | 'security';

// ── 상수 ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: TabId; label: string; icon: string }[] = [
  { id: 'profile',      label: '프로필 관리',    icon: '👤' },
  { id: 'bots',         label: '챗봇 관리',      icon: '🤖' },
  { id: 'learning',     label: '챗봇 학습',      icon: '📚' },
  { id: 'skills',       label: '스킬 관리',      icon: '⚡' },
  { id: 'operations',   label: '챗봇 운영 관리', icon: '💼' },
  { id: 'inheritance',  label: '상속',           icon: '🏛️' },
  { id: 'credits',      label: '크레딧/결제',    icon: '🪙' },
  { id: 'security',     label: '계정 보안',      icon: '🔒' },
];

// ── 유틸 ─────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('mcw_access_token') || sessionStorage.getItem('mcw_access_token') || '';
}
function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

// ── 프로필 헤더 ───────────────────────────────────────────────────────────

function ProfileHeader({
  profile,
  credits,
}: {
  profile: UserProfile;
  credits: CreditInfo | null;
}) {
  const initials = profile.full_name?.trim()?.[0]?.toUpperCase() ?? profile.email[0].toUpperCase();
  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] px-5 py-4 mb-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center gap-4">
        {/* 아바타 */}
        <div className="flex-shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="프로필 사진"
              className="w-14 h-14 rounded-full object-cover border-2 border-[rgb(var(--color-primary)/0.3)]"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[rgb(var(--color-primary-muted))] border-2 border-[rgb(var(--color-primary)/0.3)] flex items-center justify-center text-2xl font-bold text-[rgb(var(--color-primary))]">
              {initials}
            </div>
          )}
        </div>

        {/* 환영 메시지 */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[rgb(var(--text-primary))] truncate">
            안녕하세요, {profile.full_name || profile.email.split('@')[0]}님 👋
          </p>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
            오늘도 챗봇이 열심히 일하고 있어요!
          </p>
        </div>

        {/* 크레딧 위젯 */}
        {credits !== null && (
          <div className="flex-shrink-0 text-right">
            <p className="text-lg font-bold text-[rgb(var(--color-accent))]">
              {credits.balance.toLocaleString('ko-KR')} CR
            </p>
            <p className="text-xs text-[rgb(var(--text-muted))]">보유 크레딧</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 탭 네비게이션 ─────────────────────────────────────────────────────────

function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (t: TabId) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 mb-6">
      <div className="flex gap-0 border-b border-[rgb(var(--border))] min-w-max px-4 sm:px-0">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === item.id
                ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]'
                : 'border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-strong))]',
            )}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Placeholder (탭5~8 — 추후 S5FE7에서 구현) ───────────────────────────

function TabPlaceholder({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <span className="text-5xl opacity-50">{icon}</span>
      <p className="text-lg font-semibold text-[rgb(var(--text-secondary))]">{label}</p>
      <p className="text-sm text-[rgb(var(--text-muted))]">다음 업데이트에서 구현될 예정입니다.</p>
    </div>
  );
}

// ── 스켈레톤 로딩 ────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={clsx('rounded-[var(--radius-md)] bg-[rgb(var(--bg-muted))] animate-pulse', className)} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
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
          fetch('/api/auth/me', { headers: authHeaders() }),
          fetch('/api/bots', { headers: authHeaders() }),
          fetch('/api/skills/my', { headers: authHeaders() }),
          fetch('/api/credits', { headers: authHeaders() }),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const data = await profileRes.value.json();
          setProfile(data);
        } else {
          setError('프로필 정보를 불러오지 못했습니다.');
        }

        if (botsRes.status === 'fulfilled' && botsRes.value.ok) {
          const data = await botsRes.value.json();
          setBots(Array.isArray(data) ? data : (data.bots ?? []));
        }

        if (skillsRes.status === 'fulfilled' && skillsRes.value.ok) {
          const data = await skillsRes.value.json();
          setSkills(Array.isArray(data) ? data : (data.skills ?? []));
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
        {/* 비로그인 안내 배너 */}
        <div className="mb-6 flex items-center gap-3 rounded-[var(--radius-xl)] border border-[rgb(var(--color-primary)/0.3)] bg-[rgb(var(--color-primary-muted))] px-5 py-4">
          <span className="text-2xl">🔒</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[rgb(var(--text-primary))]">로그인하면 실제 데이터가 표시됩니다</p>
            <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">지금은 미리보기 모드입니다. 로그인 후 내 챗봇, 스킬, 크레딧을 관리하세요.</p>
          </div>
          <a
            href="/login?redirect=/mypage"
            className="shrink-0 px-4 py-2 rounded-[var(--radius-md)] bg-[rgb(var(--color-primary))] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            로그인
          </a>
        </div>

        {/* 탭 네비게이션 (미리보기) */}
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 탭 콘텐츠 미리보기 (빈 상태) */}
        <div className="py-8" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-[rgb(var(--color-error))]">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 프로필 헤더 */}
      {profile && <ProfileHeader profile={profile} credits={credits} />}

      {/* 탭 네비게이션 */}
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === 'profile' && profile && (
          <Tab1Profile
            profile={profile}
            onProfileUpdate={setProfile}
          />
        )}

        {activeTab === 'bots' && (
          <Tab2BotManage
            bots={bots}
            onBotsChange={setBots}
          />
        )}

        {activeTab === 'learning' && (
          <Tab3Learning />
        )}

        {activeTab === 'skills' && (
          <Tab4Skills
            skills={skills}
            onSkillsChange={setSkills}
          />
        )}

        {activeTab === 'operations' && (
          <Tab5Operations />
        )}

        {activeTab === 'inheritance' && (
          <Tab6Inheritance />
        )}

        {activeTab === 'credits' && (
          <Tab7Credits />
        )}

        {activeTab === 'security' && (
          <Tab8Security />
        )}
      </div>
    </div>
  );
}
