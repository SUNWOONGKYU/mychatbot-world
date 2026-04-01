# Verification Instruction - S3FE2

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
S3FE2

## Task Name
Skills(스킬마켓) 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Frontend/app/skills/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/skills/[id]/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/skills/my/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/components/skills/skill-runner.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/components/skills/review-form.tsx` 존재
- [ ] 각 파일 상단 `@task S3FE2` 주석 존재

### 2. 데이터 소스 검증 (최우선)
- [ ] `const SKILLS_DATA = [...]` 같은 하드코딩 배열 없음
- [ ] 목록 페이지: `fetch('/api/skills')` 호출
- [ ] 내 스킬: `fetch('/api/skills/my')` 호출

### 3. 스킬 목록 검증
- [ ] 검색 입력 → API 쿼리 파라미터 전달
- [ ] 스킬 카드 그리드 렌더링
- [ ] 평점, 설치 수 표시

### 4. 스킬 상세 검증
- [ ] 설치 버튼 → POST `/api/skills/install` 호출
- [ ] 설치된 스킬 → "실행" 버튼 표시
- [ ] 실행 결과 표시 영역

### 5. 스킬 실행 컴포넌트 검증
- [ ] POST `/api/skills/execute` 호출 로직
- [ ] 실행 결과 표시

### 6. 리뷰 폼 검증
- [ ] 별점 UI (1~5 선택 가능)
- [ ] POST `/api/skills/review` 호출

### 7. 반응형 및 TypeScript 검증
- [ ] 반응형 레이아웃
- [ ] TypeScript 컴파일 오류 없음

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Frontend/app/skills/"
ls -la "Process/S3_개발-2차/Frontend/components/skills/"

# 하드코딩 데이터 검사
grep -rn "const.*SKILLS.*=.*\[" "Process/S3_개발-2차/Frontend/"
grep -rn "SKILLS_DATA\|SKILL_LIST" "Process/S3_개발-2차/Frontend/"

# API 호출 확인
grep -rn "fetch\|/api/skills" "Process/S3_개발-2차/Frontend/app/skills/page.tsx"

# TypeScript 빌드
npx tsc --noEmit
```

## Expected Results
- 5개 파일 존재
- 하드코딩 데이터 배열 없음
- `/api/skills/*` 엔드포인트 fetch 확인
- TypeScript 오류 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 하드코딩 데이터 배열 없음 (핵심 조건)
- [ ] TypeScript 빌드 에러 없음
- [ ] 설치/실행 버튼 동작 로직 확인
- [ ] Blocker 없음
