# Verification Instruction - S2BA5

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2BA5

## Task Name
대화 API 기본 (chat, chat-stream) (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/api/chat.js` 존재
- [ ] `Process/S2_개발-1차/Backend_APIs/api/chat-stream.js` 존재
- [ ] 각 파일 `@task S2BA5` 주석 존재
- [ ] 원본 루트 `api/chat.js`, `api/chat-stream.js` 존재

### 2. 기능 검증
- [ ] `chat.js`: AI API 호출 로직 구현, JSON 응답 반환
- [ ] `chat-stream.js`: 스트리밍 응답 구현 (SSE 또는 chunked transfer)
- [ ] API 키가 `process.env` 환경변수로 참조 (하드코딩 금지)
- [ ] 에러 발생 시 JSON 에러 응답 반환

### 3. 통합 검증
- [ ] S2BA2(강화 버전)와 역할 분리됨 (기본 vs 페르소나+KB 버전)
- [ ] S2FE6(게스트 모드 프론트엔드)에서 호출 가능한 구조

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/` 에 파일이 복사되었는가?
- [ ] Grid JSON `S2BA5.json`이 Completed 상태로 업데이트되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Backend_APIs/api/
ls -la api/chat.js api/chat-stream.js

# 문법 검사
node --check api/chat.js
node --check api/chat-stream.js

# 환경변수 참조 확인
grep -n "process.env" api/chat.js
```

## Expected Results
- 두 파일 모두 Stage 폴더와 루트 api/ 폴더에 존재
- 환경변수로 API 키 참조 확인
- 문법 오류 없음

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
