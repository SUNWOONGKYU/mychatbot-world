# Task Instruction - S1EX1

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

## Task ID
S1EX1

## Task Name
Telegram 연동 (소급)

## Task Goal
Telegram Bot API 웹훅 연동 코드가 구현된 상태를 문서화한다. 이 Task는 이미 구현 완료되어 소급 등록된 항목이다. `api/telegram.js` 파일을 통해 Telegram 메시지를 수신하고 처리하는 기능을 확인한다.

## Prerequisites (Dependencies)
- S1BI2 (Supabase 클라이언트 + 환경변수 설정) — 소급 완료된 상태

## Specific Instructions

### 1. 기존 구현 내용 확인 (소급)
아래 파일이 실제로 존재하는지 확인한다:

```
api/telegram.js    ← Telegram 웹훅 처리 서버리스 함수
```

### 2. api/telegram.js 구현 내용

```js
/**
 * @task S1EX1
 * @description Telegram Bot 웹훅 핸들러 — 메시지 수신 및 응답
 */
const { supabase } = require('./_shared');

module.exports = async (req, res) => {
  // 웹훅 검증 (GET 요청: 연결 테스트)
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'telegram-webhook' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const update = req.body;

    // Telegram 메시지 처리
    if (update.message) {
      const { chat, text, from } = update.message;
      const chatId = chat.id;
      const userId = from?.id;

      // Telegram 사용자 ID로 MCW 봇 조회
      const { data: botData } = await supabase
        .from('mcw_bots')
        .select('id, settings')
        .eq('settings->>telegram_chat_id', chatId.toString())
        .eq('is_active', true)
        .single();

      if (!botData) {
        // 등록되지 않은 채팅 — 기본 안내 메시지
        await sendTelegramMessage(chatId, '이 봇은 아직 설정되지 않았습니다.');
        return res.status(200).json({ ok: true });
      }

      // 대화 로그 저장
      await supabase.from('mcw_chat_logs').insert({
        bot_id: botData.id,
        session_id: `telegram_${chatId}`,
        user_message: text || '',
        bot_response: '처리 중...', // AI 응답은 S2EX1에서 구현
        created_at: new Date().toISOString(),
      });

      // 응답 전송 (플레이스홀더)
      await sendTelegramMessage(chatId, `메시지를 받았습니다: ${text}`);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Telegram 메시지 전송 유틸
 */
async function sendTelegramMessage(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  return response.json();
}
```

### 3. 환경변수 추가
`.env.local`에 Telegram 관련 변수 추가:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=bot[token]
TELEGRAM_WEBHOOK_SECRET=[random-secret]
```

### 4. vercel.json에 Telegram 라우팅 확인
```json
{
  "rewrites": [
    {
      "source": "/api/telegram",
      "destination": "/api/telegram"
    }
  ]
}
```

### 5. Telegram 웹훅 등록 (PO 수행)
```bash
# 웹훅 등록 (Vercel 배포 후)
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=https://[your-domain].vercel.app/api/telegram" \
  -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}"
```

## Expected Output Files
- `api/telegram.js` (기존 파일 확인)

## Completion Criteria
- [ ] `api/telegram.js` 존재
- [ ] GET 요청 시 `{ status: 'ok' }` 응답
- [ ] POST 요청 수신 및 처리 로직 존재
- [ ] `TELEGRAM_BOT_TOKEN` 환경변수 사용
- [ ] Supabase 로그 저장 코드 포함

## Tech Stack
- Telegram Bot API
- Node.js (서버리스)
- Vercel (서버리스 함수)
- Supabase

## Tools
- curl (웹훅 등록)
- Telegram BotFather (PO 수행)

## Execution Type
Human-AI (Telegram Bot 생성 및 웹훅 등록은 PO가 수행)

## Remarks
- 이 Task는 소급(Retroactive) 등록 항목 — 이미 구현 완료
- 현재 구현은 메시지 수신/로그 저장까지만 — AI 응답은 S2BA에서 구현
- Telegram Bot 생성: Telegram @BotFather에서 `/newbot` 명령
- `TELEGRAM_WEBHOOK_SECRET`은 웹훅 보안 검증용 (Telegram이 헤더에 포함)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1EX1 → `Process/S1_개발_준비/External/`

### 제2 규칙: Production 코드는 이중 저장
- EX Area: Stage 폴더 + `api/External/` (Pre-commit Hook 자동 복사)
