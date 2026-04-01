# Verification Instruction - S2BA4

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2BA4

## Task Name
챗봇 생성 API (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/api/create-bot.js` 존재
- [ ] `Process/S2_개발-1차/Backend_APIs/api/guest-create.js` 존재
- [ ] 각 파일 `@task S2BA4` 주석 존재
- [ ] 원본 `api/create-bot.js`, `api/guest-create.js` 루트 파일도 존재

### 2. 기능 검증
- [ ] `create-bot.js`: 챗봇 생성 로직 구현 확인 (DB insert 또는 외부 API 호출)
- [ ] `guest-create.js`: 인증 없는 게스트 챗봇 생성 가능 확인
- [ ] 에러 핸들링 (`try/catch`, 에러 응답 형식) 존재
- [ ] 응답 형식이 `{ success, data }` 또는 유사한 일관된 형식

### 3. 통합 검증
- [ ] S2BA1(강화 버전 Create API)과 기능 중복 없이 역할 분리됨
- [ ] 루트 `api/` 경로에서 API가 정상 호출 가능

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/` 에 파일이 복사되었는가?
- [ ] Grid JSON `S2BA4.json`이 Completed 상태로 업데이트되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Backend_APIs/api/
ls -la api/create-bot.js api/guest-create.js

# 문법 검사
node --check api/create-bot.js
node --check api/guest-create.js
```

## Expected Results
- 두 파일 모두 Stage 폴더와 루트 api/ 폴더에 존재
- 문법 오류 없음
- @task 주석 존재

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
