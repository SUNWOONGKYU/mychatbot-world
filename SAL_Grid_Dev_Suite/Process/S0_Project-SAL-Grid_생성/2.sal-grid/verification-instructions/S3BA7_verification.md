# Verification Instruction - S3BA7

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

> **⚠️ 소급(Retroactive) Task 검증 안내**

---

## Task ID
S3BA7

## Task Name
Jobs API 기본 4개 (소급)

## Verification Checklist

### 1. 파일 존재 검증 (5개)
- [ ] `api/Backend_APIs/job-list.js` 존재
- [ ] `api/Backend_APIs/job-detail.js` 존재
- [ ] `api/Backend_APIs/job-apply.js` 존재
- [ ] `api/Backend_APIs/job-search.js` 존재
- [ ] `api/Backend_APIs/job-create.js` 존재
- [ ] 각 파일 상단 `@task S3BA7` 주석 존재

### 2. 기능 검증
- [ ] 목록 조회 기능 (`job-list.js`)
- [ ] 상세 조회 기능 (`job-detail.js`)
- [ ] 지원 기능 (`job-apply.js`)
- [ ] 검색 기능 (`job-search.js`)
- [ ] 등록 기능 (`job-create.js`)

### 3. 코드 품질 검증
- [ ] Supabase 연동 (`job_postings` 테이블 참조)
- [ ] 하드코딩된 채용 데이터 배열 없음
- [ ] 에러 처리 로직 존재

### 4. 저장 위치 검증
- [ ] `api/Backend_APIs/` 에 저장되어 있는가?

## Test Commands
```bash
# 파일 5개 존재 확인
ls -la api/Backend_APIs/job-*.js

# Supabase 연동 확인
grep -l "supabase\|job_postings" api/Backend_APIs/job-*.js

# 하드코딩 데이터 확인
grep -n "const.*\[" api/Backend_APIs/job-list.js
```

## Expected Results
- `api/Backend_APIs/job-*.js` 5개 파일 모두 존재
- Supabase `job_postings` 테이블 연동
- 하드코딩 데이터 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 5개 파일 모두 존재 확인
- [ ] Supabase 연동 확인
- [ ] 하드코딩 데이터 없음 확인
- [ ] Blocker 없음
