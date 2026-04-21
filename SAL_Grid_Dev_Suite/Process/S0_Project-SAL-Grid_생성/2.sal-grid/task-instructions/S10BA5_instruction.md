# S10BA5: 채팅 스트림 RAG 캐스케이드 (Wiki/KB/FAQ)

## Task 정보
- **Task ID**: S10BA5
- **Task Name**: 채팅 스트림 RAG 캐스케이드 적용
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: BA (Backend APIs)
- **Dependencies**: S5BA8, S5BA9

## 배경 / 버그

채팅 UI(`/bot/[botId]`)가 실제 사용하는 스트림 엔드포인트는 `/api/chat/stream` 인데, 이 라우트는 `loadPersona(botId)`만 호출하고 Wiki/FAQ 벡터 검색을 하지 않아 **FAQ/위키 콘텐츠가 답변에 반영되지 않는** 버그가 있음. 반면 `/api/chat/route.ts` 에는 이미 cascade 로직이 구현되어 있음.

## Task 목표

`/api/chat/stream/route.ts` 에 `/api/chat/route.ts` 와 동일한 RAG cascade 적용:

1. `lib/chat/rag.ts` 의 `generateQueryEmbedding`, `searchWiki`, `searchFaqs` import
2. 미인증 → 게스트 UUID 폴백 (S10BA6 와 함께 처리)
3. ReadableStream `start` 콜백에서:
   - query embedding 생성
   - Wiki 검색 (threshold 0.75, count 3)
   - Wiki 히트 없으면 KB 검색(loadPersona 에 embedding 전달)
   - 둘 다 없으면 FAQ 검색 (threshold 0.78, count 2)
   - `[지식베이스 — 위키/FAQ]` 프리픽스로 system 메시지 주입

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/api/chat/stream/route.ts` | RAG cascade 추가, import 추가 |
| `lib/chat-rag.ts` | 중복 파일 삭제 (기존 `lib/chat/rag.ts` 사용) |

## 커밋

- `c3c7231 fix(chat): 스트림 RAG 캐스케이드 + 게스트 대화 허용`
