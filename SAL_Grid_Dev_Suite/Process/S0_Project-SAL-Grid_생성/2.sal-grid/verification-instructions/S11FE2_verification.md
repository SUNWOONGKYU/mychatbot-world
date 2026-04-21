# S11FE2 Verification

- **Verification Agent**: `code-reviewer-core`

## 검증 체크리스트

- [ ] 로그인/회원가입/비밀번호재설정 폼 입력 높이 ≥44px
- [ ] 입력 폰트 ≥16px (iOS 자동 zoom 방지)
- [ ] 키보드 오픈 시 CTA 가려지지 않음 (실기기 or devtools 에뮬)
- [ ] 에러/알림이 화면 밖으로 나가지 않음
- [ ] 390px 가로 스크롤 0
- [ ] 기존 Auth 플로우(S7SC1/S7SC2) 회귀 없음 — Playwright 스모크
