# S8FE4 검증

## 검증 항목
- [ ] TabNav signature에 `isAdmin?: boolean` prop 추가
- [ ] NAV_ITEMS.map 직후 `{isAdmin && (...)}` 조건부 블록 존재
- [ ] 구분선 `<div className="my-1 border-t border-[var(--border-default)]" />`
- [ ] 링크 `<a href="/admin" aria-label="관리자 대시보드 이동">`
- [ ] TabNav 호출 시 `isAdmin={!!profile?.is_admin}` 전달
- [ ] 기존 하단 중앙 관리자 링크 블록(513-529줄) 삭제됨
- [ ] 네비 4대 메뉴 동일 유지
- [ ] TypeScript 컴파일 클린

## Agent
- code-reviewer-core
