# S10BA1: 봇별 chat_logs 조회/삭제 API

## Task 정보
- **Task ID**: S10BA1
- **Task Name**: 봇별 chat_logs 조회/삭제 API
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: BA
- **Dependencies**: —
- **Agent**: `api-developer-core`

## Task 목표

/api/bots/[id]/chat-logs GET(목록) / DELETE(전체 또는 특정 id) 구현.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/api/bots/[id]/chat-logs/route.ts` | 봇별 chat_logs 조회/삭제 API |

## 구현 사양

Bearer 인증 → bot 소유권 확인 → mcw_chat_logs 필터링. pagination(limit/offset). 본인 봇만.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
