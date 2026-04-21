# S8FE1: 봇 페이지 페르소나 이름 표시 수정

## Task 정보
- **Task ID**: S8FE1
- **Stage**: S8
- **Area**: FE
- **Dependencies**: S8BA1

## Task 목표

`/bot/[botId]` 페이지에서 1번째 페르소나 이름이 하드코딩된 "AI Assistant"로 표시되는 버그를 수정한다. 실제 `mcw_personas` 테이블의 `name`이 노출되어야 한다.

## 원인
- 클라이언트의 `createClient(anon)` 직접 호출 → RLS 차단 → 폴백 분기에서 "AI Assistant" 하드코딩 노출
- `raw.personas` 참조 (실제 스키마에 없음)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/bot/[botId]/page.tsx` | 공개 API(S8BA1) fetch로 전환, mcw_personas 조인 결과 매핑, 최종 폴백은 URL decoded botId 사용 |

## 요구사항

- `@/lib/supabase` import 제거
- `/api/bots/public/[botId]` fetch (cache:'no-store')
- 페르소나 0개 시 봇 이름 기반 기본 페르소나 1개 생성
- 최종 폴백 봇 이름은 `decodeURIComponent(botId).replace(/-/g, ' ')`
