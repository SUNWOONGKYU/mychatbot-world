# Task Instruction - S2FE2

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

# Task Instruction - S2FE2

## Task ID
S2FE2

## Task Name
Bot 대화 페이지 React 전환

## Task Goal
기존 HTML 기반 챗봇 대화 페이지를 React(Next.js App Router) 컴포넌트로 전환한다. 감성슬라이더, TTS/STT 컨트롤, 대화 기록 UI를 포함하며, S2BA2 API와 연동한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기본 설정
- S2BA2 — 대화 API 강화 (페르소나 로딩, 감성슬라이더)

## Specific Instructions

### 1. Bot 대화 페이지 (app/bot/page.tsx)
- URL 파라미터: `?botId={id}` 또는 dynamic route `app/bot/[botId]/page.tsx`
- 페이지 마운트 시 botId로 챗봇 정보(이름, 설정) 로딩
- ChatWindow, EmotionSlider 컴포넌트 렌더링
- 대화 히스토리를 localStorage에 임시 저장

### 2. 채팅 창 컴포넌트 (components/bot/chat-window.tsx)
- 메시지 버블 UI (user: 우측, bot: 좌측)
- 스크롤 자동 하단 이동 (새 메시지 수신 시)
- 입력창: 텍스트 입력 + 전송 버튼 + STT 버튼
- 스트리밍 응답 표시 (SSE 수신 중 타이핑 애니메이션)
- `/api/chat/stream` 엔드포인트 사용

### 3. 감성슬라이더 컴포넌트 (components/bot/emotion-slider.tsx)
- 1~100 범위의 range input
- 왼쪽: 이성적/간결 / 오른쪽: 감성적/풍부 레이블
- 슬라이더 값이 변경되면 다음 메시지 전송 시 `emotionLevel` 파라미터에 반영
- 현재 선택된 모델 계층 표시 (저비용/중간/고품질)

### 4. TTS/STT 컨트롤
- STT: 마이크 버튼 → MediaRecorder → `/api/stt` 호출 → 텍스트 자동 입력
- TTS: 봇 응답 텍스트 → `/api/tts` 호출 → 오디오 자동 재생
- TTS/STT 각각 on/off 토글 버튼

### 5. 파일 상단 Task ID 주석
```tsx
/**
 * @task S2FE2
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Frontend/app/bot/page.tsx`
- `Process/S2_개발-1차/Frontend/components/bot/chat-window.tsx`
- `Process/S2_개발-1차/Frontend/components/bot/emotion-slider.tsx`

## Completion Criteria
- [ ] botId 기반으로 챗봇 정보가 로딩된다
- [ ] 메시지 전송 시 `/api/chat/stream` SSE 스트리밍 응답이 표시된다
- [ ] 감성슬라이더 값이 API 요청에 반영된다
- [ ] STT 버튼으로 음성 → 텍스트 변환 후 입력창에 채워진다
- [ ] TTS 버튼으로 봇 응답이 음성으로 재생된다
- [ ] TypeScript 오류 없음

## Tech Stack
- TypeScript, React, Next.js (App Router)
- Tailwind CSS
- MediaRecorder API, Web Audio API

## Tools
- npm

## Execution Type
AI-Only

## Remarks
- STT/TTS API가 미완성이면 UI만 구현하고 API 연동은 S2EX1 완료 후 연결
- 스트리밍 수신은 `EventSource` 또는 `fetch` + ReadableStream 사용
- 모바일 친화적 UI 필수

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2FE2 → `Process/S2_개발-1차/Frontend/`
