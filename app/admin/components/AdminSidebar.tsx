// @task S5FE7 - 관리자 사이드바 컴포넌트 (섹션1~4)
// @task S5FE8 - 섹션5~8 활성화 (챗봇/스킬/구봇구직/커뮤니티 disabled 제거)
'use client';

import type { AdminSection, BadgeCounts } from '../page';

interface AdminSidebarProps {
  active: AdminSection;
  onNav: (section: AdminSection) => void;
  badges: BadgeCounts;
  adminKey: string;
  onLogout: () => void;
}

interface NavItem {
  id: AdminSection | string;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: 'danger' | 'warning';
  disabled?: boolean;
}

export default function AdminSidebar({
  active,
  onNav,
  badges,
  onLogout,
}: AdminSidebarProps) {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: '대시보드', icon: '📊' },
    { id: 'notices',   label: '공지사항', icon: '📢' },
    { id: 'users',     label: '회원 관리', icon: '👥' },
    {
      id: 'payments',
      label: '입금/결제',
      icon: '💳',
      badge: badges.payments,
      badgeColor: 'danger',
    },
    { id: 'bots', label: '코코봇 관리', icon: '🤖' },
    {
      id: 'skills',
      label: '스킬 관리',
      icon: '🔧',
      badge: badges.skillReview,
      badgeColor: 'warning' as const,
    },
    { id: 'jobs', label: '구봇구직', icon: '🤝' },
    {
      id: 'community',
      label: '커뮤니티',
      icon: '💬',
      badge: badges.reports,
      badgeColor: 'danger' as const,
    },
  ];

  return (
    <nav
      style={{
        width: 'var(--admin-sidebar-w)',
        background: 'var(--admin-sidebar)',
        borderRight: '1px solid var(--admin-border)',
        padding: '1.25rem 0.75rem',
        position: 'fixed',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
      {/* 브랜드 */}
      <div
        style={{
          fontSize: '1.15rem',
          fontWeight: 800,
          color: 'var(--admin-primary)',
          marginBottom: '1.75rem',
          padding: '0 0.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        MCW Admin
      </div>

      {/* 네비게이션 */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = item.id === active;
          const disabled = item.disabled;
          return (
            <li key={item.id} style={{ marginBottom: '2px' }}>
              <button
                onClick={() => !disabled && onNav(item.id as AdminSection)}
                disabled={disabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'rgba(129,140,248,0.12)' : 'transparent',
                  color: isActive
                    ? 'var(--admin-primary)'
                    : disabled
                    ? 'rgba(255,255,255,0.2)'
                    : 'var(--admin-muted)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !disabled) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.color =
                      'var(--admin-text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = disabled
                      ? 'rgba(255,255,255,0.2)'
                      : 'var(--admin-muted)';
                  }
                }}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {/* 배지 */}
                {item.badge != null && item.badge > 0 && (
                  <span
                    style={{
                      background:
                        item.badgeColor === 'warning'
                          ? 'var(--admin-warning)'
                          : 'var(--admin-danger)',
                      color: item.badgeColor === 'warning' ? '#000' : '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '99px',
                      lineHeight: '1.6',
                      minWidth: '18px',
                      textAlign: 'center',
                    }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {disabled && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.2)',
                      fontWeight: 500,
                    }}
                  >
                    준비중
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* 하단 */}
      <div
        style={{
          borderTop: '1px solid var(--admin-border)',
          paddingTop: '0.75rem',
          marginTop: '0.5rem',
        }}
      >
        <a
          href="/"
          style={{
            display: 'block',
            padding: '0.5rem 0.75rem',
            color: 'var(--admin-muted)',
            textDecoration: 'none',
            fontSize: '0.8rem',
            borderRadius: '8px',
            transition: 'color 0.15s',
          }}
        >
          ← 서비스로 돌아가기
        </a>
        <button
          onClick={onLogout}
          style={{
            display: 'block',
            width: '100%',
            padding: '0.5rem 0.75rem',
            color: 'rgba(248,113,113,0.7)',
            background: 'transparent',
            border: 'none',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'color 0.15s',
          }}
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
}
