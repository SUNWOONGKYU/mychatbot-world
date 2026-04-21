# S8FE3 검증

## 검증 항목
- [ ] AdminLoginForm 컴포넌트 삭제됨 (기존 152-206줄)
- [ ] loginStyles 상수 삭제됨 (기존 738-833줄)
- [ ] useEffect에 `getToken()` + `/api/admin/stats` Bearer 호출
- [ ] 403 분기 존재 ("관리자 권한이 없습니다.")
- [ ] 토큰 없음 → `/login?next=/admin` 리다이렉트
- [ ] `loadBadges`가 Authorization: Bearer 헤더 사용
- [ ] `onLogout` → `/login` 리다이렉트
- [ ] 총 줄 수 ~737줄로 축소
- [ ] TypeScript 컴파일 클린

## Agent
- code-reviewer-core
