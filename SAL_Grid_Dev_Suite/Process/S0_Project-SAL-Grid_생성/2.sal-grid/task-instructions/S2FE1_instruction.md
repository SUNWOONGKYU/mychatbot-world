# Task Instruction - S2FE1

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

# Task Instruction - S2FE1

## Task ID
S2FE1

## Task Name
Create 위저드 React 전환

## Task Goal
기존 5분 생성 위저드를 React(Next.js App Router) 컴포넌트로 전환한다. 음성 입력 → AI 분석 → FAQ 확인 → 배포의 4단계 스텝퍼 UI를 구현하고, S2BA1 API와 연동한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기본 설정
- S2BA1 — Create API (AI 분석 → FAQ → 배포)

## Specific Instructions

### 1. Create 페이지 (app/create/page.tsx)
- Next.js App Router 페이지 컴포넌트
- 4단계 스텝퍼 상태 관리: `step: 1~4`
- 각 스텝에 맞는 하위 컴포넌트 렌더링
- 완료 시 `/birth/{botId}` 페이지로 이동

### 2. 위저드 스텝 컴포넌트 (components/create/wizard-steps.tsx)
- Step 1: 기본 정보 입력 (챗봇 이름, 설명)
- Step 2: 음성 녹음 또는 텍스트 입력 (VoiceRecorder 컴포넌트 포함)
- Step 3: AI 분석 결과 확인 및 FAQ 검토 (editable list)
- Step 4: 배포 완료 — URL + QR 코드 표시
- 단계 간 진행 표시바(ProgressBar) 포함

### 3. 음성 녹음 컴포넌트 (components/create/voice-recorder.tsx)
- 브라우저 MediaRecorder API 사용
- 녹음 시작/중지/재생 UI
- 녹음 완료 시 Blob → base64 또는 FormData로 변환
- S2EX1(STT API)에 전송 준비 (실제 STT 호출은 S2EX1 완료 후)

### 4. API 연동
- Step 2 완료 시 `/api/create-bot/analyze` 호출
- Step 3에서 FAQ 편집 후 `/api/create-bot/faq` 호출 (수정된 FAQ 반영)
- Step 4에서 `/api/create-bot/deploy` 호출

### 5. 파일 상단 Task ID 주석
```tsx
/**
 * @task S2FE1
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Frontend/app/create/page.tsx`
- `Process/S2_개발-1차/Frontend/components/create/wizard-steps.tsx`
- `Process/S2_개발-1차/Frontend/components/create/voice-recorder.tsx`

## Completion Criteria
- [ ] 4단계 스텝퍼가 순서대로 진행된다
- [ ] 각 단계에서 해당 API가 호출된다
- [ ] 음성 녹음 UI가 동작한다 (MediaRecorder)
- [ ] FAQ 목록이 Step 3에서 표시되고 편집 가능하다
- [ ] Step 4에서 배포 URL과 QR이 표시된다
- [ ] TypeScript 오류 없음

## Tech Stack
- TypeScript, React, Next.js (App Router)
- Tailwind CSS
- MediaRecorder API (브라우저 내장)

## Tools
- npm
- gh (GitHub)

## Execution Type
AI-Only

## Remarks
- 실제 STT 처리는 S2EX1에 위임, 이 Task는 UI와 흐름만 구현
- FAQ 편집 시 낙관적 업데이트 적용 (저장 전 UI 먼저 반영)
- 반응형 디자인 필수 (모바일에서도 사용 가능)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2FE1 → `Process/S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드 이중 저장
- git commit → Pre-commit Hook → `pages/` 자동 복사 (또는 App Router 구조 그대로)
