# Verification Instruction - S3FE3

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
S3FE3

## Task Name
Jobs(수익활동) 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Frontend/app/jobs/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/jobs/[id]/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/jobs/search/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/jobs/create/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/components/jobs/match-result.tsx` 존재
- [ ] 각 파일 상단 `@task S3FE3` 주석 존재

### 2. 데이터 소스 검증 (최우선)
- [ ] `const MOCK_JOBS = [...]` 같은 하드코딩 배열 없음
- [ ] 목록: `fetch('/api/jobs')` 또는 동등한 호출
- [ ] 검색: `fetch('/api/jobs?q=...')` 호출

### 3. 채용 목록 검증
- [ ] 채용 카드 렌더링 (제목, 예산, 상태)
- [ ] 상태 배지 (`open`, `closed`, `filled`)
- [ ] 로딩/에러 상태 처리

### 4. 매칭 컴포넌트 검증
- [ ] 매칭 점수 표시 (0~100 게이지)
- [ ] POST `/api/jobs/match` 호출 로직
- [ ] 매칭 이유 텍스트 표시

### 5. 채용 등록 폼 검증
- [ ] 필수 필드: 제목, 설명, 필요 스킬, 예산
- [ ] POST `/api/jobs` 호출

### 6. 검색 검증
- [ ] 키워드 입력 → URL searchParams 또는 state 업데이트
- [ ] 필터(예산, 스킬) 적용

### 7. TypeScript 검증
- [ ] TypeScript 컴파일 오류 없음
- [ ] Props 타입 정의

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Frontend/app/jobs/"

# 하드코딩 데이터 검사
grep -rn "const.*JOBS.*=.*\[" "Process/S3_개발-2차/Frontend/"
grep -rn "MOCK_JOBS\|JOB_LIST" "Process/S3_개발-2차/Frontend/"

# API 호출 확인
grep -rn "fetch\|/api/jobs" "Process/S3_개발-2차/Frontend/app/jobs/page.tsx"

# TypeScript 빌드
npx tsc --noEmit
```

## Expected Results
- 5개 파일 존재
- 하드코딩 데이터 없음
- `/api/jobs` fetch 호출 확인
- TypeScript 오류 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 하드코딩 데이터 배열 없음 (핵심 조건)
- [ ] TypeScript 빌드 에러 없음
- [ ] Blocker 없음
