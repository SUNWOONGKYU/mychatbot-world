# Verification Instruction - S3BA3

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
S3BA3

## Task Name
Jobs API 강화 (매칭 알고리즘, 정산 20%)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/jobs/match/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/jobs/settle/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/jobs/hire/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/jobs/route.ts` 존재
- [ ] 각 파일 상단 `@task S3BA3` 주석 존재

### 2. AI 매칭 API 검증
- [ ] POST handler — AI 매칭 실행 로직
- [ ] `required_skills` 기반 프롬프트 구성
- [ ] AI 응답 파싱 후 `job_matches` INSERT
- [ ] GET handler — 매칭 결과 조회 (score 내림차순)

### 3. 채용 워크플로우 검증
- [ ] 채용 확정 시 `job_matches.status` → 'hired' 변경
- [ ] 나머지 지원자 → 'rejected' 처리
- [ ] 채용 공고 `status` → 'filled' 업데이트

### 4. 정산 API 검증 (핵심)
- [ ] `COMMISSION_RATE = 0.20` (20%) 상수 정의
- [ ] `commission_amount = gross_amount * 0.20` 계산
- [ ] `net_amount = gross_amount - commission_amount` 계산
- [ ] `Math.round()` 등 정수 처리
- [ ] `job_settlements` INSERT (commission_rate, gross_amount, net_amount 모두 저장)

### 5. 리뷰 시스템 검증
- [ ] 정산 완료(status='completed') 조건 확인 로직
- [ ] 미완료 시 리뷰 거부 처리

### 6. 기존 소급 파일 통합 검증
- [ ] S3BA7 소급 파일 (`api/Backend_APIs/job-*.js`)과 기능 중복 여부 확인
- [ ] 신규 API가 기존 파일 기능을 포괄

### 7. 데이터 소스 검증
- [ ] 하드코딩된 채용 데이터 배열 없음
- [ ] `job_postings`, `job_matches`, `job_settlements` DB 테이블 참조

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Backend_APIs/app/api/jobs/"

# 20% 수수료 로직
grep -n "0.20\|COMMISSION_RATE\|commission" "Process/S3_개발-2차/Backend_APIs/app/api/jobs/settle/route.ts"

# 워크플로우 상태 전이
grep -n "hired\|rejected\|filled" "Process/S3_개발-2차/Backend_APIs/app/api/jobs/hire/route.ts"

# TypeScript 빌드
npx tsc --noEmit
```

## Expected Results
- 5개 route.ts 파일 존재
- 20% 수수료 계산 로직 (`COMMISSION_RATE = 0.20`)
- 채용 확정 워크플로우 상태 전이 코드
- `job_settlements` INSERT 로직
- TypeScript 오류 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] TypeScript 빌드 에러 없음
- [ ] 20% 수수료 계산 정확성 확인
- [ ] DB 연동 확인 (하드코딩 없음)
- [ ] Blocker 없음
