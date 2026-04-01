# Verification Instruction - S2BA3

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2BA3

## Task Name
Home API (KB 임베딩, 설정 저장, 클라우드 동기화)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/app/api/kb/route.ts` 존재
- [ ] `Process/S2_개발-1차/Backend_APIs/app/api/kb/embed/route.ts` 존재
- [ ] `Process/S2_개발-1차/Backend_APIs/app/api/settings/route.ts` 존재
- [ ] 각 파일 `@task S2BA3` 주석 존재

### 2. 기능 검증
- [ ] GET /api/kb: 사용자 KB 문서 목록 반환 (빈 배열도 정상)
- [ ] POST /api/kb: 새 문서 생성 후 documentId 반환
- [ ] DELETE /api/kb?id={id}: 문서 + 임베딩 함께 삭제
- [ ] POST /api/kb/embed: 벡터 임베딩 생성 후 Supabase kb_embeddings에 저장
- [ ] 1000토큰 초과 문서 청크 분할 처리 (chunkCount > 1 반환)
- [ ] GET /api/settings: bot_settings 반환 (미존재 시 기본값)
- [ ] PUT /api/settings: 설정 전체 업데이트 정상
- [ ] POST /api/settings/sync: lastSyncAt 기반 병합 응답 반환
- [ ] 인증 없는 요청 401 반환

### 3. 통합 검증
- [ ] S1DB1 kb_documents, kb_embeddings, bot_settings 테이블 구조와 호환
- [ ] S1SC1 인증 미들웨어와 연동 정상
- [ ] S2BA2(대화 API) KB 검색이 embed된 데이터로 동작 가능한 구조

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/` 에 원본 저장되었는가?
- [ ] git commit 후 `api/Backend_APIs/` 로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Backend_APIs/app/api/kb/
ls -la Process/S2_개발-1차/Backend_APIs/app/api/settings/

# 타입 검사
npx tsc --noEmit

# KB 문서 등록 테스트
curl -X POST http://localhost:3000/api/kb \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"botId":"test","title":"FAQ","content":"자주 묻는 질문입니다."}'
```

## Expected Results
- KB CRUD 정상 동작, DB 반영 확인
- 임베딩 API 호출 시 kb_embeddings에 벡터 저장 확인
- 설정 API upsert 동작 확인

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
