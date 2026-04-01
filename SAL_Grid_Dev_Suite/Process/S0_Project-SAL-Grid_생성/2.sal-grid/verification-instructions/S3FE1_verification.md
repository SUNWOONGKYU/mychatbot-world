# Verification Instruction - S3FE1

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
S3FE1

## Task Name
School(학습) 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Frontend/app/learning/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/learning/curriculum/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/learning/certificate/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/components/learning/session.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/components/learning/grade-result.tsx` 존재
- [ ] 각 파일 상단 `@task S3FE1` 주석 존재

### 2. 데이터 소스 검증 (최우선)
- [ ] `const CURRICULUM_DATA = [...]` 같은 하드코딩 배열 없음
- [ ] 대시보드: `fetch('/api/school/progress')` 또는 동등한 API 호출
- [ ] 커리큘럼: API 호출로 데이터 로드
- [ ] 인증서: API 호출로 데이터 로드

### 3. 학습 대시보드 검증
- [ ] 진도율 표시 컴포넌트
- [ ] 최근 세션 목록 표시
- [ ] 로딩 상태 (skeleton 또는 spinner)
- [ ] 에러 상태 처리

### 4. 시나리오 세션 컴포넌트 검증
- [ ] 시나리오 텍스트 표시
- [ ] 답변 입력 폼
- [ ] 채점 버튼 → POST `/api/school/grade` 호출
- [ ] 점수(score) + 피드백(feedback) 표시
- [ ] 85점 이상 인증서 획득 알림

### 5. 인증서 페이지 검증
- [ ] 획득 인증서 목록 (API 기반)
- [ ] 인증서 날짜, 점수, 커리큘럼명 표시

### 6. 반응형 검증
- [ ] 모바일 레이아웃 지원 (미디어 쿼리 또는 Tailwind 반응형 클래스)

### 7. TypeScript 검증
- [ ] TypeScript 컴파일 오류 없음
- [ ] Props 타입 정의 (`interface` 또는 `type`)

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Frontend/app/learning/"
ls -la "Process/S3_개발-2차/Frontend/components/learning/"

# 하드코딩 데이터 검사 (핵심!)
grep -rn "const.*DATA.*=.*\[" "Process/S3_개발-2차/Frontend/app/learning/"
grep -rn "CURRICULUM_DATA\|LESSON_DATA" "Process/S3_개발-2차/Frontend/"

# API 호출 확인
grep -rn "fetch\|/api/school" "Process/S3_개발-2차/Frontend/app/learning/page.tsx"

# TypeScript 빌드
npx tsc --noEmit
```

## Expected Results
- 5개 파일 모두 존재
- 하드코딩 데이터 배열 없음
- `/api/school/*` 엔드포인트 fetch 호출 확인
- TypeScript 오류 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] **하드코딩 데이터 배열 없음** (핵심 조건)
- [ ] TypeScript 빌드 에러 없음
- [ ] API fetch 호출 확인
- [ ] Blocker 없음
