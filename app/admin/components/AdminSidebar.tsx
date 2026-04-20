// @task S7FE7 - 관리자 사이드바 (S7 리디자인 — Semantic 토큰)
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
      aria-label="관리자 메뉴"
      className="fixed top-0 left-0 h-screen flex flex-col overflow-y-auto z-[100]"
      style={{
        width: 'var(--admin-sidebar-w, 240px)',
        background: 'var(--surface-1)',
        borderRight: '1px solid var(--border-default)',
        padding: '1.25rem 0.75rem',
      }}
    >
      {/* 브랜드 */}
      <div className="text-lg font-extrabold mb-7 px-2 tracking-tight" style={{ color: 'var(--interactive-primary)' }}>
        MCW Admin
      </div>

      {/* 네비게이션 */}
      <ul className="list-none p-0 m-0 flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.id === active;
          const disabled = item.disabled;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={disabled}
                onClick={() => !disabled && onNav(item.id as AdminSection)}
                disabled={disabled}
                className={[
                  'flex items-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
                  isActive
                    ? 'bg-[var(--surface-2)] text-[var(--interactive-primary)] font-semibold'
                    : disabled
                    ? 'text-[var(--text-disabled)] cursor-not-allowed'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {/* 알림 배지 */}
                {item.badge != null && item.badge > 0 && (
                  <span
                    className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded-[var(--radius-full)] leading-snug min-w-[18px] text-center"
                    style={
                      item.badgeColor === 'warning'
                        ? { background: 'var(--state-warning-bg)', color: 'var(--state-warning-fg)', border: '1px solid var(--state-warning-border)' }
                        : { background: 'var(--state-danger-bg)', color: 'var(--state-danger-fg)', border: '1px solid var(--state-danger-border)' }
                    }
                    aria-label={`${item.badge}건`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {disabled && (
                  <span className="text-[0.6rem] text-[var(--text-disabled)] font-normal">준비중</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* 하단 */}
      <div className="border-t border-[var(--border-default)] pt-3 mt-2 space-y-0.5">
        <a
          href="/"
          className="block px-3 py-2 text-xs rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors no-underline"
        >
          ← 서비스로 돌아가기
        </a>
        <button
          type="button"
          onClick={onLogout}
          className="block w-full px-3 py-2 text-xs rounded-[var(--radius-md)] text-left transition-colors text-[var(--state-danger-fg)] hover:bg-[var(--state-danger-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
}
