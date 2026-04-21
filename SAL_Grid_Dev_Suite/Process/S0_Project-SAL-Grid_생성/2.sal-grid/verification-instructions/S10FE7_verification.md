# S10FE7 검증 지침

## 검증 Agent
`code-reviewer-core`

## 검증 체크리스트

- [ ] 플레이스홀더 텍스트가 제거되었는가?
- [ ] 실 API 호출이 있는가?
- [ ] 로딩/에러 상태가 표시되는가?
- [ ] 프로덕션 배포 후 육안 확인 완료인가? (memory: feedback_verification_rigor)

## 검증 방법

- 정적: tsc --noEmit / ESLint / 코드 리뷰
- 동적: 프로덕션 URL 실측 (배포 후)
- DB: Supabase SQL Editor로 스키마 확인

## 통과 기준

모든 체크리스트 통과 + `verification_status: Verified` 기록.
