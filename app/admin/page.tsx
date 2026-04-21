// @task S5FE7 - 관리자 대시보드 메인 페이지 (섹션1~4)
// @task S5FE8 - 관리자 대시보드 섹션5~8 (코코봇/스킬/구봇구직/커뮤니티) 추가
// @update 2026-04-21 - Admin Key 폼 제거, Supabase 세션 + profiles.is_admin 기반 자동 인증
'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './components/AdminSidebar';
import SectionDashboard from './sections/SectionDashboard';
import SectionNotices from './sections/SectionNotices';
import SectionUsers from './sections/SectionUsers';
import SectionPayments from './sections/SectionPayments';
import SectionBots from './sections/SectionBots';
import SectionSkills from './sections/SectionSkills';
import SectionJobs from './sections/SectionJobs';
import SectionCommunity from './sections/SectionCommunity';
import { getToken } from '@/lib/auth-client';

// ── 타입 ──────────────────────────────────────────────────────────────────
export type AdminSection =
  | 'dashboard'
  | 'notices'
  | 'users'
  | 'payments'
  | 'bots'
  | 'skills'
  | 'jobs'
  | 'community';

export interface BadgeCounts {
  payments: number;   // 입금 대기
  skillReview: number; // 스킬 검수 대기
  reports: number;    // 신고 건수
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [badges, setBadges] = useState<BadgeCounts>({ payments: 0, skillReview: 0, reports: 0 });
  const [adminKey, setAdminKey] = useState<string>('');
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [authError, setAuthError] = useState<string>('');

  // ── Supabase 세션 기반 자동 인증 (profiles.is_admin 검증) ───────────────
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        window.location.href = '/login?next=/admin';
        return;
      }
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setAdminKey(token);
          setAuthed(true);
        } else if (res.status === 403) {
          setAuthError('관리자 권한이 없습니다.');
        } else {
          setAuthError('인증 확인에 실패했습니다.');
        }
      } catch {
        setAuthError('네트워크 오류가 발생했습니다.');
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  // ── 배지 로드 ─────────────────────────────────────────────────────────
  const loadBadges = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const d = await res.json();
      setBadges({
        payments: d.pendingPayments ?? 0,
        skillReview: 0,
        reports: 0,
      });
    } catch {
      // 무시
    }
  }, []);

  useEffect(() => {
    if (authed && adminKey) {
      loadBadges(adminKey);
    }
  }, [authed, adminKey, loadBadges]);

  // ── 인증 체크 중 로딩 ─────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    );
  }

  // ── 권한 없음: /mypage 로 돌아가는 안내 ──────────────────────────────
  if (!authed) {
    return (
      <div className="admin-loading" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem' }}>🔒</div>
        <p style={{ color: 'rgb(var(--text-primary-rgb))', fontSize: '1rem', fontWeight: 600 }}>
          {authError || '관리자 권한이 없습니다.'}
        </p>
        <a
          href="/mypage"
          style={{
            padding: '0.6rem 1.2rem',
            background: '#818cf8',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          마이페이지로 돌아가기
        </a>
        <style>{`
          .admin-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: rgb(var(--bg-base));
          }
        `}</style>
      </div>
    );
  }

  // ── 메인 대시보드 ─────────────────────────────────────────────────────
  return (
    <div className="admin-root">
      <AdminSidebar
        active={activeSection}
        onNav={setActiveSection}
        badges={badges}
        adminKey={adminKey}
        onLogout={() => {
          // Supabase 세션 로그아웃 — /login으로 이동
          window.location.href = '/login';
        }}
      />
      <main className="admin-main">
        {activeSection === 'dashboard' && (
          <SectionDashboard adminKey={adminKey} onBadgeChange={loadBadges} />
        )}
        {activeSection === 'notices' && (
          <SectionNotices adminKey={adminKey} />
        )}
        {activeSection === 'users' && (
          <SectionUsers adminKey={adminKey} />
        )}
        {activeSection === 'payments' && (
          <SectionPayments
            adminKey={adminKey}
            onBadgeChange={() => loadBadges(adminKey)}
          />
        )}
        {activeSection === 'bots' && (
          <SectionBots adminKey={adminKey} />
        )}
        {activeSection === 'skills' && (
          <SectionSkills
            adminKey={adminKey}
            badgeCount={badges.skillReview}
            onBadgeChange={() => loadBadges(adminKey)}
          />
        )}
        {activeSection === 'jobs' && (
          <SectionJobs adminKey={adminKey} />
        )}
        {activeSection === 'community' && (
          <SectionCommunity
            adminKey={adminKey}
            badgeCount={badges.reports}
            onBadgeChange={() => loadBadges(adminKey)}
          />
        )}
      </main>

      {/* 관리자 전용 스타일 */}
      <style>{adminStyles}</style>
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────
const adminStyles = `
  :root {
    /* S7 Semantic 토큰 브리지 — admin-* 별칭 */
    --admin-bg: var(--surface-0);
    --admin-sidebar: var(--surface-1);
    --admin-card: var(--surface-1);
    --admin-border: var(--border-default);
    --admin-text: var(--text-primary);
    --admin-muted: var(--text-tertiary);
    --admin-primary: var(--interactive-primary);
    --admin-primary-hover: var(--interactive-hover);
    --admin-success: var(--state-success-fg);
    --admin-danger: var(--state-danger-fg);
    --admin-warning: var(--state-warning-fg);
    --admin-sidebar-w: 240px;
  }

  .admin-root {
    display: flex;
    min-height: 100vh;
    background: var(--admin-bg);
    color: var(--admin-text);
    font-family: 'PretendardVariable', 'Pretendard', 'Malgun Gothic', -apple-system, sans-serif;
  }

  .admin-main {
    margin-left: var(--admin-sidebar-w);
    flex: 1;
    padding: 2rem 2.5rem;
    min-height: 100vh;
    overflow-y: auto;
  }

  .admin-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--surface-0);
  }

  .admin-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid color-mix(in srgb, var(--interactive-primary) 20%, transparent);
    border-top-color: var(--interactive-primary);
    border-radius: 50%;
    animation: adminSpin 0.8s linear infinite;
  }

  @keyframes adminSpin {
    to { transform: rotate(360deg); }
  }

  /* 공통 카드 */
  .admin-card {
    background: var(--admin-card);
    border: 1px solid var(--admin-border);
    border-radius: 12px;
    padding: 1.5rem;
  }

  /* 공통 섹션 헤더 */
  .admin-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .admin-section-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--admin-text);
  }

  /* KPI 카드 그리드 */
  .admin-kpi-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
    margin-bottom: 1.75rem;
  }

  @media (max-width: 1400px) {
    .admin-kpi-grid { grid-template-columns: repeat(3, 1fr); }
  }

  .admin-kpi-card {
    background: var(--admin-card);
    border: 1px solid var(--admin-border);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    transition: border-color 0.15s;
  }

  .admin-kpi-card:hover {
    border-color: rgba(129,140,248,0.3);
  }

  .admin-kpi-label {
    font-size: 0.78rem;
    color: var(--admin-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.4rem;
  }

  .admin-kpi-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--admin-text);
    line-height: 1;
  }

  .admin-kpi-sub {
    font-size: 0.72rem;
    color: var(--admin-muted);
    margin-top: 0.3rem;
  }

  /* 차트 영역 */
  .admin-charts-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 1rem;
    margin-bottom: 1.75rem;
  }

  @media (max-width: 1200px) {
    .admin-charts-grid { grid-template-columns: 1fr; }
  }

  .admin-chart-card {
    background: var(--admin-card);
    border: 1px solid var(--admin-border);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .admin-chart-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--admin-muted);
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  /* 테이블 */
  .admin-table-wrap {
    background: var(--admin-card);
    border: 1px solid var(--admin-border);
    border-radius: 12px;
    overflow: hidden;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .admin-table th {
    background: rgb(var(--bg-subtle));
    text-align: left;
    padding: 0.75rem 1rem;
    font-size: 0.72rem;
    color: var(--admin-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--admin-border);
    font-weight: 600;
    white-space: nowrap;
  }

  .admin-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--admin-border);
    color: var(--admin-text);
    vertical-align: middle;
  }

  .admin-table tr:last-child td {
    border-bottom: none;
  }

  .admin-table tr:hover td {
    background: rgb(var(--bg-subtle));
  }

  .admin-table-empty {
    text-align: center;
    padding: 2.5rem;
    color: var(--admin-muted);
    font-size: 0.88rem;
  }

  /* 툴바 */
  .admin-toolbar {
    display: flex;
    gap: 0.6rem;
    margin-bottom: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .admin-input {
    background: rgb(var(--bg-muted));
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    padding: 0.5rem 0.8rem;
    color: var(--admin-text);
    font-size: 0.85rem;
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s;
  }

  .admin-input:focus {
    border-color: var(--admin-primary);
  }

  .admin-select {
    background: rgb(var(--bg-muted));
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    padding: 0.5rem 0.8rem;
    color: var(--admin-text);
    font-size: 0.85rem;
    outline: none;
    cursor: pointer;
    font-family: inherit;
  }

  .admin-select option {
    background: rgb(var(--surface-2));
    color: var(--admin-text);
  }

  /* 버튼 */
  .admin-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    font-family: inherit;
    white-space: nowrap;
  }

  .admin-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .admin-btn:hover:not(:disabled) { opacity: 0.85; }

  .admin-btn-primary { background: var(--admin-primary); color: rgb(var(--text-primary-rgb)); }
  .admin-btn-success { background: var(--admin-success); color: #000; }
  .admin-btn-danger  { background: var(--admin-danger); color: rgb(var(--text-primary-rgb)); }
  .admin-btn-outline { background: transparent; border: 1px solid var(--admin-border); color: var(--admin-text); }
  .admin-btn-sm { padding: 0.3rem 0.65rem; font-size: 0.75rem; border-radius: 6px; }

  /* 배지 */
  .admin-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.4;
  }

  .admin-badge-pending  { background: rgba(251,191,36,0.15); color: var(--admin-warning); }
  .admin-badge-success  { background: rgba(52,211,153,0.15); color: var(--admin-success); }
  .admin-badge-danger   { background: rgba(248,113,113,0.15); color: var(--admin-danger); }
  .admin-badge-muted    { background: rgb(var(--bg-muted)); color: var(--admin-muted); }
  .admin-badge-primary  { background: rgba(129,140,248,0.15); color: var(--admin-primary); }

  /* 탭 바 */
  .admin-tab-bar {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .admin-tab-btn {
    padding: 0.4rem 1rem;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    background: transparent;
    color: var(--admin-muted);
    cursor: pointer;
    font-size: 0.83rem;
    font-weight: 500;
    font-family: inherit;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .admin-tab-btn:hover { color: var(--admin-text); border-color: rgb(var(--border)); }
  .admin-tab-btn.active { background: rgba(129,140,248,0.12); color: var(--admin-primary); border-color: var(--admin-primary); }

  /* 페이지네이션 */
  .admin-pagination {
    display: flex;
    justify-content: center;
    gap: 0.3rem;
    margin-top: 1rem;
    padding: 0.5rem 0;
  }

  .admin-pagination button {
    padding: 0.35rem 0.65rem;
    border: 1px solid var(--admin-border);
    border-radius: 6px;
    background: transparent;
    color: var(--admin-text);
    cursor: pointer;
    font-size: 0.78rem;
    font-family: inherit;
    transition: all 0.15s;
  }

  .admin-pagination button.active {
    background: var(--admin-primary);
    color: rgb(var(--text-primary-rgb));
    border-color: var(--admin-primary);
  }

  .admin-pagination button:hover:not(.active) {
    border-color: rgb(var(--text-muted));
    background: rgb(var(--bg-muted));
  }

  /* 긴급 알림 배너 */
  .admin-urgent-bar {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    background: rgba(248,113,113,0.06);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .admin-urgent-label {
    font-size: 0.8rem;
    color: var(--admin-danger);
    font-weight: 600;
  }

  /* 모달 오버레이 */
  .admin-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
  }

  .admin-modal {
    background: rgb(var(--surface-1));
    border: 1px solid var(--admin-border);
    border-radius: 16px;
    padding: 1.75rem;
    width: 100%;
    max-width: 480px;
    position: relative;
  }

  .admin-modal-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 1.25rem;
    color: var(--admin-text);
  }

  .admin-modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: var(--admin-muted);
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-family: inherit;
  }

  .admin-modal-close:hover { color: var(--admin-text); background: rgb(var(--bg-muted)); }

  .admin-field {
    margin-bottom: 1rem;
  }

  .admin-field label {
    display: block;
    font-size: 0.8rem;
    color: var(--admin-muted);
    margin-bottom: 0.35rem;
    font-weight: 500;
  }

  .admin-field label.required::after {
    content: ' *';
    color: var(--admin-danger);
  }

  .admin-textarea {
    background: rgb(var(--bg-muted));
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    color: var(--admin-text);
    font-size: 0.85rem;
    outline: none;
    font-family: inherit;
    resize: vertical;
    width: 100%;
    transition: border-color 0.15s;
  }

  .admin-textarea:focus { border-color: var(--admin-primary); }

  /* 토스트 */
  .admin-toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: rgb(var(--surface-2));
    border: 1px solid var(--admin-border);
    padding: 0.75rem 1.2rem;
    border-radius: 10px;
    color: var(--admin-text);
    font-size: 0.875rem;
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
    z-index: 10000;
    transform: translateY(8px);
    pointer-events: none;
    max-width: 320px;
  }

  .admin-toast.show {
    opacity: 1;
    transform: translateY(0);
  }

  /* 타임라인 */
  .admin-timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .admin-timeline-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.6rem 0;
    position: relative;
  }

  .admin-timeline-item:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 28px;
    bottom: 0;
    width: 1px;
    background: var(--admin-border);
  }

  .admin-timeline-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--admin-border);
    flex-shrink: 0;
    margin-top: 3px;
  }

  .admin-timeline-dot.success { background: var(--admin-success); }
  .admin-timeline-dot.warning { background: var(--admin-warning); }
  .admin-timeline-dot.danger  { background: var(--admin-danger); }
  .admin-timeline-dot.primary { background: var(--admin-primary); }

  .admin-timeline-content {
    flex: 1;
    min-width: 0;
  }

  .admin-timeline-text {
    font-size: 0.83rem;
    color: var(--admin-text);
    line-height: 1.4;
  }

  .admin-timeline-time {
    font-size: 0.72rem;
    color: var(--admin-muted);
    margin-top: 0.1rem;
  }

  /* 섹션 패딩 */
  .admin-section {
    animation: fadeInSection 0.2s ease;
  }

  @keyframes fadeInSection {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* 크레딧 타입 구분 */
  .credit-type-charge { color: var(--admin-success); }
  .credit-type-grant  { color: var(--admin-primary); }
  .credit-type-usage  { color: var(--admin-warning); }
  .credit-type-refund { color: var(--admin-danger); }

  /* ID 텍스트 */
  .admin-id {
    font-size: 0.72rem;
    color: var(--admin-muted);
    font-family: 'JetBrains Mono', monospace;
  }
`;

