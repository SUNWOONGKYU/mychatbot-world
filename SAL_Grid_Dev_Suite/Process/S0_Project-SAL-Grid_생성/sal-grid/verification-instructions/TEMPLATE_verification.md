# Verification Instruction - {TaskID}

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
{TaskID}

## Task Name
{Task명}

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `{생성 파일 경로}` 존재
- [ ] 파일 문법/형식 유효성

### 2. 기능 검증
- [ ] {검증 항목 1}
- [ ] {검증 항목 2}
- [ ] {검증 항목 3}

### 3. 통합 검증
- [ ] 선행 Task 결과와 연동 정상 동작
- [ ] 다른 Task와 충돌 없음
- [ ] 데이터 흐름 정상

### 4. 저장 위치 검증
- [ ] `Process/S{N}_{Stage명}/{Area}/` 에 원본 저장되었는가?
- [ ] Production 저장 대상이면 루트 폴더에도 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la {파일경로}

# 빌드/실행 확인 (해당 시)
# node {파일명}
```

## Expected Results
- {예상 결과 1}
- {예상 결과 2}

## Verification Agent
{code-reviewer-core / qa-specialist / security-specialist-core / database-developer-core}

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
