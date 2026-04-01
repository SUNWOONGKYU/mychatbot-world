# Verification Instruction - S4FE1

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
S4FE1

## Task Name
Business(수익 대시보드) 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Frontend/app/business/page.tsx` 존재
- [ ] `Process/S4_개발_마무리/Frontend/app/business/settlement/page.tsx` 존재
- [ ] `Process/S4_개발_마무리/Frontend/app/business/revenue/page.tsx` 존재
- [ ] 각 파일 상단에 `@task S4FE1` 주석 존재

### 2. 데이터 소스 검증 (최우선)
- [ ] 모든 데이터가 `fetch('/api/revenue/...')` 로 로드됨 (하드코딩 배열 없음)
- [ ] 하드코딩된 매출 데이터 배열 없음 (`const revenueData = [...]` 형태 금지)
- [ ] API 연동: `GET /api/revenue/dashboard` 호출 확인
- [ ] API 연동: `GET /api/revenue/settlement` 호출 확인
- [ ] API 연동: `GET /api/revenue` (날짜 필터 포함) 호출 확인

### 3. 기능 검증
- [ ] 이번 달 매출 카드 표시 (금액 + 증감률)
- [ ] 보류 중인 정산 금액 카드 표시
- [ ] 매출 차트 렌더링 (Line 또는 Bar)
- [ ] 정산 내역 테이블 (상태 뱃지 포함)
- [ ] 정산 요청 버튼 최소 금액 조건 활성화/비활성화
- [ ] 날짜 범위 필터 동작
- [ ] 로딩 스켈레톤 표시

### 4. 반응형 검증
- [ ] 모바일 뷰(375px)에서 레이아웃 깨짐 없음
- [ ] 데스크톱 뷰(1280px)에서 레이아웃 정상

### 5. 통합 검증
- [ ] S1FE1 의존성: 공통 레이아웃/컴포넌트 사용
- [ ] S4BA1 의존성: 수익 API 엔드포인트와 일치

### 6. 저장 위치 검증
- [ ] `Process/S4_개발_마무리/Frontend/` 에 저장되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Frontend/app/business/"

# 하드코딩 데이터 없음 확인 (금지 패턴)
grep -n "const.*=.*\[{" "Process/S4_개발_마무리/Frontend/app/business/page.tsx"

# API fetch 호출 확인
grep -n "fetch\|useSWR\|useQuery\|revenue" \
  "Process/S4_개발_마무리/Frontend/app/business/page.tsx"

# TypeScript 타입 검사
npx tsc --noEmit
```

## Expected Results
- 3개 파일이 모두 존재한다
- 데이터를 API에서 `fetch`로 로드한다 (하드코딩 없음)
- 매출 차트가 컴포넌트로 구현되어 있다
- 정산 요청 버튼이 조건부 활성화된다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 하드코딩 데이터 없음 (fetch API 사용)
- [ ] TypeScript 타입 오류 없음
- [ ] 반응형 레이아웃 확인
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Frontend/`에 저장되었는가?
- [ ] git commit 시 `pages/`로 자동 복사될 구조인가?
