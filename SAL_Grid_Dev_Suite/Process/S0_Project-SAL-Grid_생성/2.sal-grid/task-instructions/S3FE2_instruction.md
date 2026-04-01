# Task Instruction - S3FE2

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

- [ ] S3DB1 완료 — `skill_installations`, `skill_reviews` 테이블 존재
- [ ] S3BA2 완료 — Skills API (`/api/skills`, `/api/skills/execute` 등) 존재
- [ ] 하드코딩 금지: `const SKILLS_DATA = [...]` 절대 금지

---

# Task Instruction - S3FE2

## Task ID
S3FE2

## Task Name
Skills(스킬마켓) 페이지 React 전환

## Task Goal
스킬마켓 섹션의 목록/상세/내스킬 페이지를 Next.js App Router 기반 React 컴포넌트로 구현한다. 설치/실행 UI, 리뷰/평점 UI를 포함한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js 기본 레이아웃 완료
- S3BA2 — Skills API 완료

## Specific Instructions

### 1. 스킬 마켓 목록 페이지

**`app/skills/page.tsx`**
```typescript
/**
 * @task S3FE2
 * @description 스킬 마켓 목록 — 검색/필터/카드 그리드
 */
'use client';
import { useState, useEffect } from 'react';

export default function SkillsMarket() {
  const [skills, setSkills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`/api/skills?q=${searchQuery}`).then(r => r.json()).then(d => setSkills(d.skills));
  }, [searchQuery]);

  return (
    <div>
      <input
        placeholder="스킬 검색..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      {/* 스킬 카드 그리드 */}
      <div className="grid grid-cols-3 gap-4">
        {skills.map(skill => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
}
```

### 2. 스킬 상세 페이지
- `app/skills/[id]/page.tsx` 작성
- 스킬 설명, 작성자, 평점, 리뷰 목록 표시
- 설치 버튼 (POST `/api/skills/install`)
- 설치된 스킬은 "실행" 버튼 표시
- 실행 결과 표시 영역

### 3. 내 스킬 페이지
- `app/skills/my/page.tsx` 작성
- 설치된 스킬 목록 (GET `/api/skills/my`)
- 실행 횟수, 마지막 사용일
- 제거 버튼 (DELETE `/api/skills/install`)

### 4. 스킬 실행 UI 컴포넌트
- `components/skills/skill-runner.tsx` 작성
- 스킬 실행 입력 폼 (파라미터 입력)
- POST `/api/skills/execute` 호출
- 실행 결과 스트리밍 또는 응답 표시

### 5. 리뷰/평점 컴포넌트
- `components/skills/review-form.tsx` 작성
- 별점 UI (1~5)
- 리뷰 텍스트 입력
- POST `/api/skills/review` 호출

## Expected Output Files
- `Process/S3_개발-2차/Frontend/app/skills/page.tsx`
- `Process/S3_개발-2차/Frontend/app/skills/[id]/page.tsx`
- `Process/S3_개발-2차/Frontend/app/skills/my/page.tsx`
- `Process/S3_개발-2차/Frontend/components/skills/skill-runner.tsx`
- `Process/S3_개발-2차/Frontend/components/skills/review-form.tsx`

## Completion Criteria
- [ ] 스킬 목록에서 실제 API fetch (하드코딩 없음)
- [ ] 검색 기능 동작 (searchParams 활용)
- [ ] 스킬 설치/실행 버튼 동작
- [ ] 내 스킬 페이지에서 설치 목록 표시
- [ ] 리뷰 작성 폼 동작
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
- **하드코딩 절대 금지**: 스킬 데이터를 배열로 정의하면 안 됨
- 스킬 카드에는 평점(rating), 설치 수, 가격 표시
- 유료 스킬 설치 시 결제 플로우 연동 (간략히)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3FE2 → `Process/S3_개발-2차/Frontend/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `pages/`

---

## 📝 파일 명명 규칙
- Next.js App Router: `page.tsx`
- 컴포넌트: `kebab-case.tsx` (`skill-runner.tsx`)
- 파일 상단 `@task S3FE2` 주석 필수
