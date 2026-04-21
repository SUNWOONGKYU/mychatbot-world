# S10QA1 검증 지침

## 검증 Agent
`qa-specialist`

## 검증 체크리스트

- [ ] 6패널 + QR 모두 커버하는 spec이 있는가?
- [ ] 실 로그인 세션으로 실행되는가?
- [ ] 각 시나리오 API 상태코드를 assert 하는가?
- [ ] 실측 리포트가 저장되는가?

## 검증 방법

- 정적: tsc --noEmit / ESLint / 코드 리뷰
- 동적: 프로덕션 URL 실측 (배포 후)
- DB: Supabase SQL Editor로 스키마 확인

## 통과 기준

모든 체크리스트 통과 + `verification_status: Verified` 기록.
