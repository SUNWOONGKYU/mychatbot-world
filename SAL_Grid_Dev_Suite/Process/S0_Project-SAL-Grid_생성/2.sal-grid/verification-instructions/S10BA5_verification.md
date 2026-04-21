# S10BA5 Verification

## 검증 범위
- `/api/chat/stream/route.ts` 에서 `generateQueryEmbedding`, `searchWiki`, `searchFaqs` 가 실제 호출되는지
- Wiki 히트 시 KB/FAQ 건너뛰는 단락 분기 정상
- `[지식베이스 — 위키]` 또는 `[지식베이스 — FAQ]` prefix 가 system 메시지에 들어가는지
- 중복 `lib/chat-rag.ts` 가 존재하지 않는지

## 검증 방법
1. `tsc --noEmit` 통과
2. grep 으로 import 확인
3. 배포 후 실제 봇과 대화하여 FAQ/위키 내용이 답변에 반영되는지 PO 육안 검증

## 합격 기준
- 빌드 성공
- cascade 구조가 `/api/chat/route.ts` 와 동등
- 런타임: 위키/FAQ 지식이 답변에 나타남
