'use client';

/**
 * Home Dashboard — Vanilla → React 충실 전환
 * Tabs: 회원정보 | 챗봇관리 | 유료스킬 | 수익활동 | 크레딧&결제 | 보안설정
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
export type { Bot } from '@/types/bot';

// ── 서브 탭 컴포넌트 ─────────────────────────────────────────
import { ProfileTab }       from '@/components/home/ProfileTab';
import { BotsTab }          from '@/components/home/BotsTab';
import { PremiumSkillsTab } from '@/components/home/PremiumSkillsTab';
import { RevenueTab }       from '@/components/home/RevenueTab';
import { CreditsTab }       from '@/components/home/CreditsTab';
import { SecurityTab }      from '@/components/home/SecurityTab';

// ── 타입 ────────────────────────────────────────────────────
type TabId = 'profile' | 'bots' | 'premium-skills' | 'revenue' | 'credits' | 'security';

interface NavItem { id: TabId; icon: string; label: string; }

const NAV_ITEMS: NavItem[] = [
  { id: 'profile',        icon: '👤', label: '회원 정보 관리'   },
  { id: 'bots',           icon: '🤖', label: '챗봇 및 운영 관리' },
  { id: 'premium-skills', icon: '💎', label: '유료 스킬 설정'   },
  { id: 'revenue',        icon: '💰', label: '수익활동 관리'    },
  { id: 'credits',        icon: '🪙', label: '크레딧 & 결제'   },
  { id: 'security',       icon: '🔒', label: '계정 보안 설정'   },
];

// ── 메인 페이지 ─────────────────────────────────────────────
export default function HomePageDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'rgb(var(--bg-base))',
        alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--text-muted))' }}>
        로딩 중...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'rgb(var(--bg-base))' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, background: 'rgb(var(--bg-surface))',
        borderRight: '1px solid rgb(var(--border-subtle))',
        padding: '2rem 1.5rem', position: 'fixed', height: '100vh',
        display: 'flex', flexDirection: 'column', zIndex: 10,
      }}>
        <div style={{
          marginBottom: '3rem', fontSize: '1.25rem', fontWeight: 800,
          color: '#818cf8', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          🤖 <span>마이 페이지</span>
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0, margin: 0 }}>
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%', padding: '12px 16px',
                  color: activeTab === item.id ? 'white' : 'rgb(var(--text-secondary))',
                  borderRadius: 10, cursor: 'pointer', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: activeTab === item.id ? '#6366f1' : 'transparent',
                  border: 'none', textAlign: 'left', fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== item.id) {
                    (e.currentTarget as HTMLElement).style.background = 'rgb(var(--border-subtle))';
                    (e.currentTarget as HTMLElement).style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== item.id) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-secondary))';
                  }
                }}
              >
                {item.icon} {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 'auto' }}>
          <a href="/" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', color: 'rgb(var(--text-muted))',
            fontSize: '0.8rem', textDecoration: 'none', borderRadius: 10,
          }}>🏠 메인 화면으로 이동</a>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 260, padding: '3rem 4rem', minWidth: 0 }}>
        {activeTab === 'profile'        && <ProfileTab user={user} />}
        {activeTab === 'bots'           && <BotsTab user={user} />}
        {activeTab === 'premium-skills' && <PremiumSkillsTab />}
        {activeTab === 'revenue'        && <RevenueTab />}
        {activeTab === 'credits'        && <CreditsTab user={user} />}
        {activeTab === 'security'       && <SecurityTab />}
      </main>
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await supabase.auth.signOut();
    router.replace('/login');
  };
  return (
    <button onClick={handleLogout} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', color: 'rgb(var(--text-secondary))', fontSize: '0.9rem',
      background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10,
    }}>🔌 로그아웃</button>
  );
}
