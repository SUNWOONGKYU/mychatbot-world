# S10DB2 검증 지침

## 검증 Agent
`database-developer-core`

## 검증 체크리스트

- [ ] 마이그레이션이 IF NOT EXISTS로 idempotent한가?
- [ ] 기존 데이터가 손실되지 않는가?
- [ ] RLS 정책이 본인 소유 봇에만 적용되는가?
- [ ] 인덱스/unique 제약이 올바른가?

## 검증 방법

- 정적: tsc --noEmit / ESLint / 코드 리뷰
- 동적: 프로덕션 URL 실측 (배포 후)
- DB: Supabase SQL Editor로 스키마 확인

## 통과 기준

모든 체크리스트 통과 + `verification_status: Verified` 기록.
