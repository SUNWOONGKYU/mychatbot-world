# Verification Instruction - S1EX1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S1EX1

## Task Name
Telegram 연동 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `api/telegram.js` 존재
- [ ] `@task S1EX1` 주석 포함

### 2. 코드 품질 검증
- [ ] `require('./_shared')` 로 Supabase 클라이언트 임포트 (하드코딩 금지)
- [ ] `process.env.TELEGRAM_BOT_TOKEN` 환경변수 사용
- [ ] GET/POST 메서드 분기 처리 존재
- [ ] 에러 핸들링 (`try/catch`) 존재
- [ ] 에러 발생 시 HTTP 500 응답

### 3. 기능 검증
- [ ] GET 요청 → `{ status: 'ok' }` 또는 유사 응답
- [ ] POST 요청 시 `update.message` 파싱 로직 존재
- [ ] `sendTelegramMessage` 함수 존재
- [ ] Supabase `mcw_chat_logs` INSERT 코드 존재

### 4. 보안 검증
- [ ] `TELEGRAM_BOT_TOKEN`이 코드에 하드코딩되지 않음
- [ ] 환경변수 없을 때 조용히 실패 (서비스 중단 없음)
- [ ] 지원하지 않는 HTTP 메서드에 405 응답

### 5. 통합 검증 (PO 테스트 필요)
- [ ] Vercel 배포 후 `GET /api/telegram` → 200 응답
- [ ] Telegram 웹훅 등록 완료 (PO 수행)
- [ ] Telegram Bot에서 메시지 전송 시 웹훅 수신 확인

### 6. 통합 검증 (코드 레벨)
- [ ] S1BI2의 `api/_shared.js`에서 Supabase 클라이언트 올바르게 임포트
- [ ] `mcw_chat_logs` 테이블 구조(S1DB1)와 INSERT 컬럼 일치
- [ ] `vercel.json`에서 `/api/telegram` 라우팅 정상

### 7. 저장 위치 검증
- [ ] `Process/S1_개발_준비/External/`에 Telegram 연동 문서 저장됨
- [ ] `api/External/telegram.js` 또는 `api/telegram.js` 배포 경로 존재

## Test Commands
```bash
# 파일 존재 확인
ls api/telegram.js

# 함수 내보내기 형식 확인
node -e "const fn = require('./api/telegram'); console.log(typeof fn === 'function' ? 'PASS' : 'FAIL')"

# 환경변수 사용 확인 (하드코딩 없음)
grep -n "TELEGRAM_BOT_TOKEN" api/telegram.js

# GET 요청 테스트 (배포 후)
curl -X GET https://[your-domain].vercel.app/api/telegram

# Telegram 웹훅 상태 확인 (PO 수행)
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

## Expected Results
- `api/telegram.js` 파일 존재
- `typeof fn === 'function'` → PASS
- `grep TELEGRAM_BOT_TOKEN` → `process.env.TELEGRAM_BOT_TOKEN` 참조 확인
- `GET /api/telegram` → HTTP 200, `{ status: 'ok' }` 응답

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] GET 요청 200 응답 확인
- [ ] 보안 검증 통과 (하드코딩 없음)
- [ ] Blocker 없음

## ⚠️ Human-AI Task 검증 주의사항
이 Task는 **Human-AI** 유형입니다.
- Telegram Bot 생성(@BotFather)은 PO가 수행
- 웹훅 등록(`setWebhook`)은 PO가 수행
- 실제 Telegram 메시지 수신 테스트는 PO가 수행
- `TELEGRAM_BOT_TOKEN`은 PO만 보유
