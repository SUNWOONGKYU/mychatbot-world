# Verification Instruction - S2BA2

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2BA2

## Task Name
대화 API 강화 (페르소나 로딩, 감성슬라이더, 대화 저장)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/app/api/chat/route.ts` 존재
- [ ] `Process/S2_개발-1차/Backend_APIs/app/api/chat/stream/route.ts` 존재
- [ ] `Process/S2_개발-1차/Backend_Infra/lib/persona-loader.ts` 존재
- [ ] 각 파일 `@task S2BA2` 주석 존재

### 2. 기능 검증
- [ ] POST /api/chat 호출 시 페르소나 시스템 프롬프트 적용 확인
- [ ] `emotionLevel` 파라미터가 S2BI1 라우터로 전달되고 모델 선택에 반영
- [ ] 대화 완료 후 Supabase `messages` 테이블에 role/content/timestamp 저장
- [ ] POST /api/chat/stream 호출 시 SSE(text/event-stream) 응답 헤더 확인
- [ ] `persona-loader`의 인메모리 캐시 동작 확인 (동일 botId 2회 호출 시 DB 쿼리 1회만)
- [ ] KB 검색 결과가 시스템 프롬프트 context에 삽입 확인
- [ ] KB 테이블 없을 때 graceful fallback 동작 확인

### 3. 통합 검증
- [ ] S1DB1(DB 스키마) conversations/messages 테이블과 호환
- [ ] S2BI1(AI 라우터) `selectModel()` 연동 정상 동작
- [ ] 인증 없는 요청 시 401 응답

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/` 에 원본 저장되었는가?
- [ ] git commit 후 루트 폴더로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Backend_APIs/app/api/chat/

# 타입 검사
npx tsc --noEmit

# 스트리밍 API 테스트
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"botId":"test-bot","message":"안녕하세요","emotionLevel":50}' \
  --no-buffer
```

## Expected Results
- /api/chat: JSON 응답 `{ reply, conversationId, model }`
- /api/chat/stream: SSE 스트림, 각 청크 `data: {content}\n\n`
- Supabase messages 테이블에 레코드 저장 확인

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
