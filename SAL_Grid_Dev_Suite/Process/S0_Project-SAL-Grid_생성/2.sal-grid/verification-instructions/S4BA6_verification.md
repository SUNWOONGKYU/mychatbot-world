# Verification Instruction - S4BA6

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S4BA6

## Task Name
수익 API 기본 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/revenue.js` 존재
- [ ] 파일 상단에 `@task S4BA6` 주석 존재

### 2. 기본 API 검증
- [ ] 매출 조회 기본 API 구현 (`GET /api/revenue` 또는 유사)
- [ ] 정산 조회 기본 API 구현 (`GET /api/revenue/settlement` 또는 유사)
- [ ] 수수료 20% 계산 로직 존재
- [ ] 인증 미들웨어 적용

### 3. S4BA1 관계 명시 검증
- [ ] S4BA1(고도화)와의 관계가 주석으로 명시되어 있는가?
- [ ] 대시보드 API는 S4BA1에서 처리함이 명시되어 있는가?

### 4. 코드 품질 검증
- [ ] 에러 처리 구현
- [ ] DB 실제 조회 (하드코딩 mock 없음)

### 5. 저장 위치 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/` 에 저장되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Backend_APIs/revenue.js"

# Task ID 주석 확인
grep "@task S4BA6" "Process/S4_개발_마무리/Backend_APIs/revenue.js"

# S4BA1 관계 주석 확인
grep -n "S4BA1\|고도화" "Process/S4_개발_마무리/Backend_APIs/revenue.js"

# 수수료 계산 로직 확인 (20% = 0.8 또는 0.2)
grep -n "0\.8\|0\.2\|fee\|수수료" "Process/S4_개발_마무리/Backend_APIs/revenue.js"
```

## Expected Results
- `revenue.js` 파일이 존재한다
- 기본 수익 API가 구현되어 있다
- 수수료 20% 계산 로직이 있다
- S4BA1 관계가 주석으로 명시되어 있다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] `@task S4BA6` 주석 존재
- [ ] S4BA1 관계 주석 존재
- [ ] 수수료 계산 로직 확인
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Backend_APIs/`에 저장되었는가?
