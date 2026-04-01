# Verification Instruction - S2EX1

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2EX1

## Task Name
TTS/STT 연동 강화

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/External/lib/tts-client.ts` 존재
- [ ] `Process/S2_개발-1차/External/lib/stt-client.ts` 존재
- [ ] `Process/S2_개발-1차/External/app/api/tts/route.ts` 존재
- [ ] `Process/S2_개발-1차/External/app/api/stt/route.ts` 존재
- [ ] 각 파일 `@task S2EX1` 주석 존재

### 2. 기능 검증
- [ ] `tts-client.ts`: `synthesize(text, options)` 함수 export 확인
- [ ] `tts-client.ts`: 캐시 키 생성 로직 (md5 또는 hash) 존재
- [ ] POST /api/tts: 오디오 응답 Content-Type `audio/mpeg` 확인
- [ ] POST /api/tts: 텍스트 500자 초과 시 400 응답
- [ ] POST /api/tts: 동일 요청 2회 시 캐시 Hit 응답 (`X-Cache: HIT`) 또는 Cache-Control 헤더
- [ ] `stt-client.ts`: `transcribe(audioBuffer, options)` 함수 export 확인
- [ ] `stt-client.ts`: `language` 파라미터 지원 (ISO 코드)
- [ ] POST /api/stt: `{ text, confidence, language }` 반환
- [ ] POST /api/stt: 25MB 초과 파일 시 에러 응답
- [ ] API 키가 환경변수(`process.env.OPENAI_API_KEY`)로 참조 (하드코딩 금지)

### 3. 통합 검증
- [ ] S1EX1(기본 TTS/STT) 기능을 교체 또는 확장하는 구조
- [ ] S2BA2(대화 API)에서 STT 결과를 입력으로 받을 수 있는 구조
- [ ] S2FE2(Bot 대화 페이지)에서 `/api/tts`, `/api/stt` 경로로 호출 가능

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/External/` 에 원본 저장되었는가?
- [ ] git commit 후 `api/External/` 로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/External/lib/
ls -la Process/S2_개발-1차/External/app/api/tts/
ls -la Process/S2_개발-1차/External/app/api/stt/

# 타입 검사
npx tsc --noEmit

# 빌드 확인
npm run build

# API 키 하드코딩 검사 (없어야 함)
grep -rn "sk-\|OPENAI_API_KEY.*=.*\"" Process/S2_개발-1차/External/lib/

# TTS API 테스트 (OPENAI_API_KEY 환경변수 설정 필요)
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"안녕하세요","voice":"alloy","language":"ko"}' \
  -o /tmp/test.mp3 -v
```

## Expected Results
- TypeScript 컴파일 에러 0개
- TTS API: audio/mpeg 응답 반환
- STT API: { text, confidence, language } JSON 반환
- 캐시 헤더 또는 X-Cache 존재 확인

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
