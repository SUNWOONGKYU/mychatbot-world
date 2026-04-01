# Task Instruction - S2FE3

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

# Task Instruction - S2FE3

## Task ID
S2FE3

## Task Name
Home 대시보드 React 전환

## Task Goal
기존 HTML 기반 홈 대시보드를 React(Next.js App Router)로 전환한다. 사용자의 챗봇 목록, KB 관리, 사용량 차트, 설정 화면을 React 컴포넌트로 구현하고 S2BA3 API와 연동한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기본 설정
- S2BA3 — Home API (KB 임베딩, 설정 저장, 클라우드 동기화)

## Specific Instructions

### 1. Home 대시보드 페이지 (app/home/page.tsx)
- 로그인 사용자의 챗봇 목록 표시 (`/api/bots` 호출)
- 탭 구조: 챗봇 목록 | KB 관리 | 사용량 | 설정
- 각 챗봇 카드: 이름, 배포 URL, QR, 대화 횟수, 수정/삭제 버튼
- 새 챗봇 만들기 버튼 → `/create` 페이지 이동

### 2. 대시보드 컴포넌트 (components/home/dashboard.tsx)
- 챗봇 카드 목록 렌더링
- 사용량 요약 (총 대화 수, 사용 토큰, 비용 추정)
- 사용량 차트: recharts 또는 chart.js 라이브러리 사용
  - 날짜별 대화 횟수 막대 차트
  - 모델별 비용 파이 차트

### 3. KB 관리 컴포넌트 (components/home/kb-manager.tsx)
- 선택된 챗봇의 KB 문서 목록 조회 (`/api/kb?botId={id}`)
- 새 문서 추가: 텍스트 입력 → `/api/kb` POST 후 `/api/kb/embed` POST
- 문서 삭제: `/api/kb` DELETE
- 임베딩 중 로딩 스피너 표시

### 4. 설정 화면
- 선택된 챗봇의 설정 조회/수정 (`/api/settings`)
- 설정 항목: 기본 감성 레벨, 기본 비용 레벨, 언어, 인사말
- 자동 저장 (debounce 1초)

### 5. 파일 상단 Task ID 주석
```tsx
/**
 * @task S2FE3
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Frontend/app/home/page.tsx`
- `Process/S2_개발-1차/Frontend/components/home/dashboard.tsx`
- `Process/S2_개발-1차/Frontend/components/home/kb-manager.tsx`

## Completion Criteria
- [ ] 챗봇 목록이 API에서 로딩된다 (하드코딩 금지)
- [ ] KB 문서 추가/삭제가 정상 동작한다
- [ ] 사용량 차트가 API 데이터로 렌더링된다
- [ ] 설정 변경이 자동 저장된다
- [ ] TypeScript 오류 없음

## Tech Stack
- TypeScript, React, Next.js (App Router)
- Tailwind CSS
- recharts (차트)

## Tools
- npm

## Execution Type
AI-Only

## Remarks
- 인증 상태 확인 (미로그인 시 `/` 리다이렉트)
- 챗봇 목록 API가 없으면 `/api/bots` 또는 Supabase 직접 조회

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2FE3 → `Process/S2_개발-1차/Frontend/`
