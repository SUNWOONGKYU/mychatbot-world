# S10QA1: E2E 검증 (마이페이지 6도구)

## Task 정보
- **Task ID**: S10QA1
- **Task Name**: E2E 검증 (마이페이지 6도구)
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: TS
- **Dependencies**: S10FE1, S10FE2, S10FE3, S10FE4, S10FE5, S10FE6, S10FE7
- **Agent**: `test-runner-core`

## Task 목표

Playwright로 마이페이지 Tab2 카드 6패널 + QR 전체 flow 검증.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `tests/e2e/mypage-tab2-tools.spec.ts, scripts/verify-s10-flow.mjs` | E2E 검증 (마이페이지 6도구) |

## 구현 사양

실 로그인 세션 → 봇 선택 → 각 패널 열기/액션/저장 → API 200 확인. 프로덕션 endpoint 대상.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
