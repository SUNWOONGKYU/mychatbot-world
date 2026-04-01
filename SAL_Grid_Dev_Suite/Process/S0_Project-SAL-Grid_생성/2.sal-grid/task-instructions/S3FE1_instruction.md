# Task Instruction - S3FE1

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

- [ ] S3DB1 완료 — `learning_sessions`, `learning_progress`, `learning_certifications` 테이블 존재
- [ ] S3BA1 완료 — School API (`/api/school/session`, `/api/school/grade` 등) 존재
- [ ] 하드코딩 금지: `const CURRICULUM_DATA = [...]` 같은 배열 절대 금지

---

# Task Instruction - S3FE1

## Task ID
S3FE1

## Task Name
School(학습) 페이지 React 전환

## Task Goal
기존 Vanilla JS로 구현된 학습(School) 섹션 페이지를 Next.js App Router 기반 React 컴포넌트로 전환한다. 학습 대시보드, 시나리오 세션, 채점 결과, 인증서, 커리큘럼 페이지를 구현한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js 기본 레이아웃/공통 컴포넌트 완료
- S3BA1 — School API 완료 (data fetch 대상)

## Specific Instructions

### 1. 학습 대시보드 페이지

**`app/learning/page.tsx`**
```typescript
/**
 * @task S3FE1
 * @description 학습 대시보드 — 진도 현황, 최근 세션, 추천 커리큘럼
 */
'use client';
import { useState, useEffect } from 'react';

export default function LearningDashboard() {
  const [progress, setProgress] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    // 진도 fetch: GET /api/school/progress
    // 최근 세션 fetch: GET /api/school/session
    fetch('/api/school/progress').then(r => r.json()).then(d => setProgress(d.progress));
    fetch('/api/school/session').then(r => r.json()).then(d => setRecentSessions(d.sessions));
  }, []);

  return (
    <div className="learning-dashboard">
      <h1>학습 대시보드</h1>
      {/* 전체 진도율 표시 */}
      {/* 최근 세션 목록 */}
      {/* 추천 커리큘럼 카드 */}
    </div>
  );
}
```

### 2. 커리큘럼 목록 페이지
- `app/learning/curriculum/page.tsx` 작성
- 커리큘럼 카테고리별 목록 표시
- 각 커리큘럼의 진도율 프로그레스 바
- 학습 시작/계속 버튼

### 3. 시나리오 세션 컴포넌트
- `components/learning/session.tsx` 작성
- 학습 세션 UI (시나리오 텍스트 표시, 사용자 답변 입력)
- 채점 요청 버튼 및 결과 표시
- 멘토 힌트 요청 버튼

```typescript
/**
 * @task S3FE1
 */
'use client';
interface SessionProps {
  sessionId: string;
  scenario: string;
}

export function LearningSession({ sessionId, scenario }: SessionProps) {
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState<{ score: number; feedback: string } | null>(null);

  const handleGrade = async () => {
    const res = await fetch('/api/school/grade', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, user_answer: answer }),
    });
    const data = await res.json();
    setGrade(data);
  };

  // ...
}
```

### 4. 채점 결과 표시 컴포넌트
- `components/learning/grade-result.tsx` 작성
- 점수 게이지 (0~100)
- AI 피드백 텍스트
- 85점 이상 시 인증서 획득 축하 메시지

### 5. 인증서 페이지
- `app/learning/certificate/page.tsx` 작성
- 획득한 인증서 목록
- 인증서 상세 뷰 (날짜, 점수, 커리큘럼명)

## Expected Output Files
- `Process/S3_개발-2차/Frontend/app/learning/page.tsx`
- `Process/S3_개발-2차/Frontend/app/learning/curriculum/page.tsx`
- `Process/S3_개발-2차/Frontend/app/learning/certificate/page.tsx`
- `Process/S3_개발-2차/Frontend/components/learning/session.tsx`
- `Process/S3_개발-2차/Frontend/components/learning/grade-result.tsx`

## Completion Criteria
- [ ] 학습 대시보드에서 실제 진도 데이터 API fetch (하드코딩 없음)
- [ ] 커리큘럼 목록에서 실제 커리큘럼 데이터 API fetch
- [ ] 시나리오 세션 — 채점 버튼 → 점수+피드백 표시
- [ ] 85점 이상 시 인증서 획득 메시지
- [ ] 인증서 목록 페이지 동작
- [ ] TypeScript 타입 오류 없음
- [ ] 반응형 레이아웃 (모바일 지원)

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
- **하드코딩 절대 금지**: `const CURRICULUM_DATA = [...]` 같은 배열 사용 금지
- 데이터는 반드시 `/api/school/*` 엔드포인트에서 fetch
- 로딩 상태(skeleton) 및 에러 상태 UI 필수

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3FE1 → `Process/S3_개발-2차/Frontend/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `pages/` (또는 `app/`)

---

## 📝 파일 명명 규칙
- Next.js App Router: `page.tsx`, `layout.tsx`
- 컴포넌트: `kebab-case.tsx` (`grade-result.tsx`)
- 파일 상단 `@task S3FE1` 주석 필수
