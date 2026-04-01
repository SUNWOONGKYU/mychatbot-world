# Task Instruction - S3FE3

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

### Stage 명칭
- **S3** = 개발 2차 (Additional Development)

### Area 명칭
- **FE** = Frontend (프론트엔드)

---

## ⚠️ FE Task 필수 사전 확인

> **작업 전 반드시 확인!**

- [ ] S3DB1 완료 — `job_postings`, `job_matches` 테이블 존재
- [ ] S3BA3 완료 — Jobs API (`/api/jobs`, `/api/jobs/match` 등) 존재
- [ ] 하드코딩 금지: `const MOCK_JOBS = [...]` 절대 금지

---

# Task Instruction - S3FE3

## Task ID
S3FE3

## Task Name
Jobs(수익활동) 페이지 React 전환

## Task Goal
수익활동(Jobs) 섹션의 채용 목록/상세/검색/매칭 UI를 Next.js App Router 기반 React 컴포넌트로 구현한다. AI 매칭 결과 표시, 채용 지원, 정산 현황 UI를 포함한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js 기본 레이아웃 완료
- S3BA3 — Jobs API 완료

## Specific Instructions

### 1. 채용 목록 페이지

**`app/jobs/page.tsx`**
```typescript
/**
 * @task S3FE3
 * @description 채용 공고 목록 — 필터/정렬/카드
 */
'use client';
import { useState, useEffect } from 'react';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(d => setJobs(d.jobs ?? []));
  }, []);

  return (
    <div>
      <h1>수익활동</h1>
      {/* 채용 공고 카드 목록 */}
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

### 2. 채용 상세 페이지
- `app/jobs/[id]/page.tsx` 작성
- 채용 공고 상세 정보 표시
- 지원 버튼 (POST `/api/jobs/hire` 또는 지원 API)
- AI 매칭 점수 표시 (해당 공고에 대한 내 매칭 점수)
- 고용주 정보

### 3. 채용 검색 페이지
- `app/jobs/search/page.tsx` 작성
- 키워드 검색 (GET `/api/jobs?q=...`)
- 필터: 예산 범위, 필요 스킬, 상태
- 검색 결과 목록

### 4. AI 매칭 결과 컴포넌트
- `components/jobs/match-result.tsx` 작성
- 매칭 점수 게이지 (0~100%)
- 매칭 이유(reason) 텍스트 표시
- "매칭 요청" 버튼 → POST `/api/jobs/match`

### 5. 채용 등록 폼 (고용주용)
- `app/jobs/create/page.tsx` 작성
- 채용 공고 등록 폼
- 필요 스킬 태그 입력
- 예산 범위 슬라이더
- POST `/api/jobs` 호출

## Expected Output Files
- `Process/S3_개발-2차/Frontend/app/jobs/page.tsx`
- `Process/S3_개발-2차/Frontend/app/jobs/[id]/page.tsx`
- `Process/S3_개발-2차/Frontend/app/jobs/search/page.tsx`
- `Process/S3_개발-2차/Frontend/app/jobs/create/page.tsx`
- `Process/S3_개발-2차/Frontend/components/jobs/match-result.tsx`

## Completion Criteria
- [ ] 채용 목록에서 실제 API fetch (하드코딩 없음)
- [ ] 검색 기능 동작
- [ ] 채용 상세 페이지 동작
- [ ] AI 매칭 점수 표시
- [ ] 채용 공고 등록 폼 동작
- [ ] TypeScript 타입 오류 없음
- [ ] 반응형 레이아웃

## Tech Stack
- TypeScript, React, Next.js (App Router)
- Tailwind CSS

## Tools
- npm

## Task Agent
`frontend-developer-core`

## Verification Agent
`code-reviewer-core`

## Execution Type
AI-Only

## Remarks
- **하드코딩 절대 금지**: `const MOCK_JOBS = [...]` 금지
- 채용 상태(`open`, `closed`, `filled`) 배지 표시
- 예산 금액은 한국 원화 형식으로 표시 (`toLocaleString('ko-KR')`)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3FE3 → `Process/S3_개발-2차/Frontend/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `pages/`

---

## 📝 파일 명명 규칙
- Next.js App Router: `page.tsx`
- 컴포넌트: `kebab-case.tsx` (`match-result.tsx`)
- 파일 상단 `@task S3FE3` 주석 필수
