# Verification Instruction - S2FE2

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2FE2

## Task Name
Bot 대화 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Frontend/app/bot/page.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/bot/chat-window.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/bot/emotion-slider.tsx` 존재
- [ ] 각 파일 `@task S2FE2` 주석 존재

### 2. 기능 검증 (FE 데이터 소스 검증 포함)
- [ ] 페이지 마운트 시 botId로 API fetch 호출 (하드코딩 챗봇 정보 금지)
- [ ] 메시지 전송 시 `/api/chat` 또는 `/api/chat/stream` fetch 호출 확인
- [ ] 감성슬라이더의 `emotionLevel` 값이 API 요청 body에 포함
- [ ] 스트리밍 응답 수신 시 타이핑 애니메이션으로 메시지 표시
- [ ] STT 버튼 클릭 시 MediaRecorder 시작 → `/api/stt` 호출 로직 존재
- [ ] TTS 버튼으로 음성 재생 로직 존재 (`/api/tts` 연동)
- [ ] 새 메시지 수신 시 채팅창 자동 스크롤 하단

### 3. 통합 검증
- [ ] S1FE1(Next.js 설정)과 App Router 구조 호환
- [ ] S2BA2(대화 API) 엔드포인트와 연동 가능한 구조
- [ ] S2EX1(TTS/STT) API 경로(`/api/tts`, `/api/stt`) 참조

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Frontend/` 에 원본 저장되었는가?
- [ ] git commit 후 루트 폴더로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Frontend/app/bot/
ls -la Process/S2_개발-1차/Frontend/components/bot/

# 타입 검사
npx tsc --noEmit

# 빌드 확인
npm run build

# 하드코딩 검사
grep -n "const.*messages\s*=\s*\[\|mock" Process/S2_개발-1차/Frontend/components/bot/chat-window.tsx
```

## Expected Results
- 빌드 성공, TypeScript 오류 0개
- 메시지 전송이 API fetch로 구현됨 확인
- emotion-slider가 emotionLevel 값 관리

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
