# Task Instruction - S2FE7

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

- **S2** = 개발 1차 (Core Development)
- **FE** = Frontend (프론트엔드)

---

# Task Instruction - S2FE7

## Task ID
S2FE7

## Task Name
FAQ 관리 페이지 React 전환

## Task Goal
챗봇 FAQ 목록을 관리할 수 있는 페이지를 React(Next.js App Router)로 전환한다. FAQ 조회, 추가, 수정, 삭제 기능을 구현하고 S2BA1(FAQ 관련 API)과 연동한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기본 설정
- S2BA1 — Create API (FAQ 자동생성 포함)

## Specific Instructions

### 1. FAQ 관리 페이지 (app/bot/faq/page.tsx)
- URL 파라미터: `?botId={id}` 또는 dynamic route
- 로그인 필수 (미인증 시 리다이렉트)
- botId로 해당 챗봇의 FAQ 목록 조회 (`/api/faq?botId={id}`)
- FAQManager 컴포넌트 렌더링

### 2. FAQ 관리 컴포넌트 (components/bot/faq-manager.tsx)
- FAQ 목록 표시: 번호, 질문, 답변, 수정/삭제 버튼
- 인라인 편집: 클릭 시 textarea로 전환, 저장/취소 버튼
- 새 FAQ 추가: 하단 "+추가" 버튼 → 빈 인라인 편집 row 생성
- 삭제: 확인 다이얼로그 후 `/api/faq/{id}` DELETE
- 순서 변경: 드래그앤드롭 (선택사항, 라이브러리: @dnd-kit/core)
- "AI 자동 생성" 버튼: `/api/create-bot/faq` 호출 → 새 FAQ 목록 병합

### 3. API 연동
- GET /api/faq?botId={id} — 목록 조회
- POST /api/faq — 새 FAQ 추가
- PATCH /api/faq/{id} — FAQ 수정
- DELETE /api/faq/{id} — FAQ 삭제
- (필요 시) `/api/create-bot/faq` — AI 자동 생성

### 4. 파일 상단 Task ID 주석
```tsx
/**
 * @task S2FE7
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Frontend/app/bot/faq/page.tsx`
- `Process/S2_개발-1차/Frontend/components/bot/faq-manager.tsx`

## Completion Criteria
- [ ] FAQ 목록이 API에서 로딩된다 (하드코딩 금지)
- [ ] FAQ 인라인 편집 및 저장이 동작한다
- [ ] FAQ 추가/삭제가 API 호출로 동작한다
- [ ] "AI 자동 생성" 버튼이 새 FAQ를 API에서 가져온다
- [ ] TypeScript 오류 없음

## Tech Stack
- TypeScript, React, Next.js (App Router)
- Tailwind CSS
- @dnd-kit/core (선택적 드래그앤드롭)

## Tools
- npm

## Execution Type
AI-Only

## Remarks
- FAQ API 엔드포인트(`/api/faq`)가 미구현이면 `/api/create-bot/faq` 대안 사용
- 드래그앤드롭은 선택사항, 없어도 CRUD가 완성되면 통과
- 낙관적 업데이트 적용 권장 (삭제 시 UI 먼저 반영)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2FE7 → `Process/S2_개발-1차/Frontend/`
