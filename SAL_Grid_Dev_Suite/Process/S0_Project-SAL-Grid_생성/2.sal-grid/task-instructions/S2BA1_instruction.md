# Task Instruction - S2BA1

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
- **BA** = Backend APIs (백엔드 API)

---

# Task Instruction - S2BA1

## Task ID
S2BA1

## Task Name
Create API 강화 (AI 분석 → FAQ 자동생성 → 배포 URL+QR)

## Task Goal
챗봇 생성 전체 파이프라인 API를 구현한다. 음성 입력 → STT → AI 분석 → 페르소나 생성 → FAQ 자동생성 → 챗봇 등록 → 배포 URL + QR코드 발급의 5단계 흐름을 REST API로 완성한다.

## Prerequisites (Dependencies)
- S1DB1 — 데이터베이스 스키마 (bots, personas, faqs 테이블)
- S1SC1 — 인증/보안 미들웨어

## Specific Instructions

### 1. create-bot 메인 API (app/api/create-bot/route.ts)
- POST 요청으로 챗봇 기본 정보(name, description, audioUrl) 수신
- 인증 미들웨어로 사용자 검증
- Supabase `bots` 테이블에 챗봇 레코드 생성
- 하위 API(analyze, faq, deploy) 순차 호출 오케스트레이션
- 최종 `{ botId, deployUrl, qrUrl }` 반환

### 2. AI 분석 API (app/api/create-bot/analyze/route.ts)
- 음성 URL 또는 텍스트 설명을 입력으로 수신
- OpenRouter를 통해 AI 분석: 비즈니스 유형, 대상 고객, 톤앤매너 추출
- 페르소나 객체 생성: `{ name, personality, tone, expertise, greeting }`
- Supabase `personas` 테이블에 저장 후 personaId 반환

### 3. FAQ 자동생성 API (app/api/create-bot/faq/route.ts)
- personaId와 분석 결과를 입력으로 수신
- AI에게 5~10개 FAQ 생성 요청 (질문-답변 쌍)
- Supabase `faqs` 테이블에 배치 insert
- 생성된 FAQ 목록 반환

### 4. 배포 URL + QR 생성 API (app/api/create-bot/deploy/route.ts)
- botId를 입력으로 수신
- 배포 URL 생성: `https://{domain}/bot/{botId}`
- QR코드 생성: qr-code npm 라이브러리 또는 외부 QR API 활용
- Supabase `bots` 테이블에 `deploy_url`, `qr_url` 업데이트
- `{ deployUrl, qrUrl }` 반환

### 5. 파일 상단 Task ID 주석
```typescript
/**
 * @task S2BA1
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Backend_APIs/app/api/create-bot/route.ts`
- `Process/S2_개발-1차/Backend_APIs/app/api/create-bot/analyze/route.ts`
- `Process/S2_개발-1차/Backend_APIs/app/api/create-bot/faq/route.ts`
- `Process/S2_개발-1차/Backend_APIs/app/api/create-bot/deploy/route.ts`

## Completion Criteria
- [ ] POST /api/create-bot 호출 시 챗봇 생성 전체 파이프라인 실행
- [ ] AI 분석으로 페르소나가 자동 생성된다
- [ ] FAQ 5개 이상 자동 생성된다
- [ ] 배포 URL과 QR 이미지 URL이 반환된다
- [ ] Supabase에 bots, personas, faqs 레코드가 저장된다
- [ ] 인증되지 않은 요청은 401 반환

## Tech Stack
- TypeScript, Next.js (App Router)
- Supabase (PostgreSQL)
- OpenRouter API
- qr-code 라이브러리

## Tools
- npm
- supabase (MCP)
- openai-sdk (OpenRouter 호환)

## Execution Type
AI-Only

## Remarks
- 각 하위 API는 독립적으로도 호출 가능하도록 설계
- STT 처리는 S2EX1에서 담당, 이 Task는 분석 이후 단계부터 담당
- QR 생성 실패 시 fallback으로 외부 QR API URL 사용 허용

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2BA1 → `Process/S2_개발-1차/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- git commit → Pre-commit Hook → `api/Backend_APIs/` 자동 복사

---

## 📝 파일 명명 규칙
- kebab-case 폴더/파일명 사용
- 파일 상단 `@task S2BA1` 주석 필수
