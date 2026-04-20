// @task S7FE7 (S5FE7) - 관리자 대시보드 레이아웃 (S7 Semantic 토큰)
// 관리자 전용 레이아웃 — 일반 Navbar/TabBar 완전 분리
// 다크 테마 강제 적용, 사이드바 240px + 메인 콘텐츠

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MCW Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 루트 레이아웃의 Navbar/TabBar를 덮어쓰기 위해 독립 shell 사용
    // data-theme="dark" 강제 — 관리자 UI는 항상 다크
    <div
      className="admin-shell"
      data-theme="dark"
      style={{ minHeight: '100vh', background: 'var(--surface-0)' }}
    >
      {children}
    </div>
  );
}
