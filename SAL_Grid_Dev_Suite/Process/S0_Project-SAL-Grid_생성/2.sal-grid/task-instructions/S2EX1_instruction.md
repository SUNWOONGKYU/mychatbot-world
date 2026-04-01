# Task Instruction - S2EX1

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
- **EX** = External (외부 연동)

---

# Task Instruction - S2EX1

## Task ID
S2EX1

## Task Name
TTS/STT 연동 강화

## Task Goal
TTS(Text-to-Speech)와 STT(Speech-to-Text) API를 고도화한다. 음성 품질 개선, 다국어 지원, 음성 캐싱을 구현하여 음성 대화 경험을 향상시킨다.

## Prerequisites (Dependencies)
- S1EX1 — TTS/STT 기본 연동 (기존 클라이언트 라이브러리)
- S2BA2 — 대화 API 강화 (음성 흐름 연계)

## Specific Instructions

### 1. TTS 클라이언트 강화 (lib/tts-client.ts)
- 지원 음성 엔진 확장:
  - OpenAI TTS (`tts-1`, `tts-1-hd` 모델)
  - ElevenLabs API (고품질 선택 옵션)
- 음성 파라미터 지원: voice(성별), speed(0.5~2.0), language
- 응답 캐싱: 동일 텍스트+파라미터 → 캐시된 오디오 반환
  - 캐시 키: `md5(text + voice + language)`
  - 캐시 저장소: `/tmp/tts-cache/` (서버 임시 파일)
  - 캐시 TTL: 24시간
- `synthesize(text, options): Promise<Buffer>` 함수 export

### 2. TTS API 엔드포인트 (app/api/tts/route.ts)
- POST 요청으로 `{ text, voice, language, speed }` 수신
- `tts-client` 호출 후 오디오 Buffer 반환
- Content-Type: `audio/mpeg`
- 텍스트 길이 제한: 최대 500자 (초과 시 400 에러)
- 캐시 Hit 시 응답 헤더에 `X-Cache: HIT` 포함

### 3. STT 클라이언트 강화 (lib/stt-client.ts)
- 지원 STT 엔진:
  - OpenAI Whisper (`whisper-1`)
  - 브라우저 Web Speech API (클라이언트 사이드, lib에 타입만 정의)
- 다국어 지원: `language` 파라미터 (ISO 639-1 코드: ko, en, ja 등)
- 신뢰도 점수 반환: `{ text, confidence, language }`
- `transcribe(audioBuffer, options): Promise<TranscriptionResult>` 함수 export

### 4. STT API 엔드포인트 (app/api/stt/route.ts)
- POST 요청으로 `multipart/form-data` 오디오 파일 수신
- `stt-client` 호출 후 `{ text, confidence, language }` 반환
- 지원 형식: webm, wav, mp3, ogg
- 파일 크기 제한: 최대 25MB (Whisper 제한)

### 5. 파일 상단 Task ID 주석
```typescript
/**
 * @task S2EX1
 */
```

## Expected Output Files
- `Process/S2_개발-1차/External/lib/tts-client.ts`
- `Process/S2_개발-1차/External/lib/stt-client.ts`
- `Process/S2_개발-1차/External/app/api/tts/route.ts`
- `Process/S2_개발-1차/External/app/api/stt/route.ts`

## Completion Criteria
- [ ] POST /api/tts 호출 시 오디오 Buffer 반환
- [ ] 동일 텍스트 2회 요청 시 캐시 Hit (`X-Cache: HIT`)
- [ ] POST /api/stt 호출 시 텍스트와 신뢰도 반환
- [ ] 다국어(`language` 파라미터) 지원 확인
- [ ] TypeScript 오류 없음

## Tech Stack
- TypeScript, Next.js (App Router)
- OpenAI TTS/Whisper API
- ElevenLabs API (선택적)
- Node.js fs/tmp (캐시)

## Tools
- npm
- openai-sdk

## Execution Type
Hybrid (API 키 환경변수 설정 필요 — PO 액션)

## Remarks
- OpenAI API 키: `OPENAI_API_KEY` 환경변수 필요
- ElevenLabs 연동은 `ELEVENLABS_API_KEY` 없으면 OpenAI로 fallback
- 캐시 디렉토리 `/tmp/tts-cache/`는 서버 재시작 시 삭제 허용 (Vercel Edge 호환 불필요)
- 서버리스 환경(Vercel)에서는 캐시 대신 응답 헤더 `Cache-Control: max-age=86400`으로 대체 가능

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2EX1 → `Process/S2_개발-1차/External/`

### 제2 규칙: Production 코드 이중 저장
- git commit → Pre-commit Hook → `api/External/` 자동 복사
