# Task Instruction - S2FE6

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

# Task Instruction - S2FE6

## Task ID
S2FE6

## Task Name
Guest 모드 React 전환

## Task Goal
비로그인 사용자가 챗봇을 체험할 수 있는 게스트 모드 페이지를 React(Next.js App Router)로 전환한다. 인증 없이 데모 챗봇과 대화할 수 있는 UI를 구현하고 S2BA5(기본 chat API)와 연동한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기본 설정
- S2BA5 — 대화 API 기본 (chat, chat-stream) 소급

## Specific Instructions

### 1. Guest 페이지 (app/guest/page.tsx)
- URL 파라미터: `?botId={id}` (없으면 기본 데모 봇 사용)
- 인증 없이 접근 가능
- GuestChat 컴포넌트 렌더링
- 상단 배너: "5분 만에 내 챗봇 만들기" CTA → `/create`

### 2. 게스트 채팅 컴포넌트 (components/guest/guest-chat.tsx)
- 메시지 버블 UI (S2FE2의 ChatWindow와 유사하나 별도 컴포넌트)
- `/api/chat` 호출 시 Authorization 헤더 없이 전송
- 대화 제한: 10회 초과 시 "회원가입 후 무제한 이용" 팝업 표시
- 대화 로그: localStorage에만 저장 (DB 저장 없음)
- 감성슬라이더 포함 (읽기 전용 또는 조작 가능)

### 3. 대화 제한 팝업
- 10회 초과 시 모달 표시
- "무료 가입하기" → `/api/auth/signup` 또는 소셜 로그인
- "더 보기 없음" → 모달 닫기만

### 4. 파일 상단 Task ID 주석
```tsx
/**
 * @task S2FE6
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Frontend/app/guest/page.tsx`
- `Process/S2_개발-1차/Frontend/components/guest/guest-chat.tsx`

## Completion Criteria
- [ ] 로그인 없이 `/guest` 접근 가능하다
- [ ] 메시지 전송 시 `/api/chat` 호출 (인증 헤더 없음)
- [ ] 10회 초과 시 제한 팝업이 표시된다
- [ ] 상단 CTA 버튼이 `/create`로 이동한다
- [ ] TypeScript 오류 없음

## Tech Stack
- TypeScript, React, Next.js (App Router)
- Tailwind CSS

## Tools
- npm

## Execution Type
AI-Only

## Remarks
- guest-create API(S2BA4)는 이 Task에서 연동하지 않음 (게스트 대화만)
- 대화 횟수는 localStorage `guestChatCount` 키로 관리
- 새로고침 시 대화 기록 초기화 허용

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2FE6 → `Process/S2_개발-1차/Frontend/`
