# Verification Instruction - S2BA6

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2BA6

## Task Name
사용량 API (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/api/usage.js` 존재
- [ ] `@task S2BA6` 주석 존재
- [ ] 원본 루트 `api/usage.js` 존재

### 2. 기능 검증
- [ ] GET /api/usage: 사용량 데이터 반환 (토큰, 호출 횟수, 비용 등)
- [ ] 인증 없는 요청 거부 또는 인증 적용 여부 확인
- [ ] 날짜 범위 파라미터 지원 여부 확인 (`?from=&to=`)
- [ ] 사용량 데이터가 하드코딩이 아닌 DB에서 조회

### 3. 통합 검증
- [ ] S1DB1 사용량 관련 테이블과 호환
- [ ] S2FE3(홈 대시보드)에서 사용량 차트 데이터로 활용 가능

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/` 에 파일이 복사되었는가?
- [ ] Grid JSON `S2BA6.json`이 Completed 상태로 업데이트되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Backend_APIs/api/usage.js
ls -la api/usage.js

# 문법 검사
node --check api/usage.js

# 하드코딩 데이터 확인 (없어야 함)
grep -n "hardcoded\|mock\|const.*=.*\[" api/usage.js
```

## Expected Results
- 파일이 Stage 폴더와 루트 api/ 폴더에 존재
- 문법 오류 없음
- DB에서 실제 사용량 데이터 조회

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
