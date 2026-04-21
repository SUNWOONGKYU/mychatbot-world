# S10BA2 검증 지침

## 검증 Agent
`code-reviewer-core`

## 검증 체크리스트

- [ ] Bearer 인증이 강제되는가?
- [ ] 봇 소유권 체크가 있는가?
- [ ] 허용 필드 whitelist가 있는가? (PATCH)
- [ ] 프로덕션 endpoint에서 200 응답이 오는가?

## 검증 방법

- 정적: tsc --noEmit / ESLint / 코드 리뷰
- 동적: 프로덕션 URL 실측 (배포 후)
- DB: Supabase SQL Editor로 스키마 확인

## 통과 기준

모든 체크리스트 통과 + `verification_status: Verified` 기록.
