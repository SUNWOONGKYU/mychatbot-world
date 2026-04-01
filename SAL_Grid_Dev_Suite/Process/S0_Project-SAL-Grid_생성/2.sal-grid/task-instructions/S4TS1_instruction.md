# Task Instruction - S4TS1

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
- **S4** = 개발 3차 (Advanced Development)

### Area 명칭
- **TS** = Testing (테스트)

---

# Task Instruction - S4TS1

## Task ID
S4TS1

## Task Name
E2E 테스트 (Playwright)

## Task Goal
Playwright를 설정하고 핵심 사용자 흐름에 대한 E2E 테스트를 작성한다. 로그인 → 봇 생성 → 대화 → 대시보드 확인의 핵심 흐름과 각 주요 메뉴(Business, MyPage, Marketplace)의 스모크 테스트를 구현한다.

## Prerequisites (Dependencies)
- S4FE1 — Business 페이지
- S4FE2 — MyPage 페이지
- S4FE3 — Marketplace 페이지

## Specific Instructions

### 1. Playwright 설정 (`playwright.config.ts`)
- 프로젝트 설정: Chromium, Firefox, Safari (3개 브라우저)
- 테스트 디렉토리: `tests/e2e/`
- Base URL: `http://localhost:3000` (환경 변수 `TEST_BASE_URL`)
- 타임아웃: 30초 (글로벌), 각 테스트 60초
- 스크린샷: 실패 시 자동 캡처 (`on`)
- 비디오: 실패 시 자동 녹화 (`on-first-retry`)
- 리포터: `html` + `list`
- globalSetup: 테스트 계정 로그인 세션 사전 생성

### 2. 인증 테스트 (`tests/e2e/auth.spec.ts`)
- 이메일/패스워드 로그인 성공 흐름
- 잘못된 비밀번호 입력 시 에러 메시지 표시
- 로그인 후 대시보드 리다이렉트 확인
- 로그아웃 후 보호 경로 접근 시 로그인 페이지 리다이렉트

### 3. 봇 생성 테스트 (`tests/e2e/create-bot.spec.ts`)
- 새 페르소나 생성 버튼 클릭
- 이름, 성격, 카테고리 입력
- 저장 후 페르소나 목록에 나타나는지 확인
- 필수 입력값 미입력 시 에러 표시 확인

### 4. 대화 테스트 (`tests/e2e/chat.spec.ts`)
- 특정 페르소나와 대화 시작
- 메시지 입력 및 전송
- AI 응답이 표시되는지 확인 (타임아웃 15초)
- 대화 이력이 유지되는지 확인 (페이지 새로고침 후)

### 5. 스모크 테스트 (각 주요 페이지)
- `/business` → 수익 대시보드 로드 확인
- `/mypage` → 프로필 정보 표시 확인
- `/marketplace` → 페르소나 카드 목록 표시 확인
- 각 페이지에서 콘솔 에러 없음 확인

## Expected Output Files
- `Process/S4_개발_마무리/Testing/playwright.config.ts`
- `Process/S4_개발_마무리/Testing/tests/e2e/auth.spec.ts`
- `Process/S4_개발_마무리/Testing/tests/e2e/create-bot.spec.ts`
- `Process/S4_개발_마무리/Testing/tests/e2e/chat.spec.ts`

## Completion Criteria
- [ ] `npx playwright install` 후 테스트가 실행 가능하다
- [ ] 인증 테스트 4개 케이스가 통과한다
- [ ] 봇 생성 테스트가 통과한다
- [ ] 대화 테스트가 통과한다 (AI 응답 포함)
- [ ] 스모크 테스트 3개 페이지가 통과한다
- [ ] 실패 시 스크린샷이 자동 저장된다

## Tech Stack
- TypeScript, Playwright
- Next.js (테스트 대상)

## Tools
- npm (playwright 설치: `npx playwright install`)
- playwright-mcp (선택적)

## Execution Type
Hybrid (테스트 실행은 로컬 환경 필요)

## Remarks
- 테스트 계정: 환경 변수 `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`로 관리
- AI 응답 테스트는 실제 API 호출 (모킹 최소화)
- 테스트 데이터 정리: 각 테스트 후 생성한 데이터 삭제 권장
- TS 파일은 Testing Area이므로 Production 자동 복사 대상 아님

---

## ⚠️ 작업 결과물 저장 규칙

### Stage + Area 폴더에 저장
- S4TS1 → `Process/S4_개발_마무리/Testing/`
- Testing Area는 Production 자동 복사 대상 아님

---

## 📝 파일 명명 규칙
- 테스트 파일: `{기능}.spec.ts`
- 설정 파일: `playwright.config.ts`
