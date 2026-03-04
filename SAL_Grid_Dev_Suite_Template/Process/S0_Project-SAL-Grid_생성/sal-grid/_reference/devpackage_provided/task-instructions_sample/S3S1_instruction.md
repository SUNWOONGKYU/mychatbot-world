# Task Instruction - S3S1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S3S1

## Task Name
AI 서비스 구독 상태 확인 (Health Check)

## Task Goal
Project Owner(PO)의 AI 서비스(Gemini, ChatGPT, Perplexity) 구독 상태가 사용 가능한지 확인하는 헬스체크 기능 구현

## Background
- PO가 AI API 비용을 지불 (도매)
- 사용자들은 PO의 API를 통해 AI 기능 사용 (소매)
- API 키가 있어도 요금 미납, 쿼터 초과, 구독 만료 등으로 사용 불가할 수 있음
- **실제 사용 가능한 상태인지** 주기적으로 확인 필요

## Prerequisites (Dependencies)
- S3E1 (AI API 키 설정) 완료
- S3BI1 (AI 클라이언트 통합) 완료

## Specific Instructions

### 1. AI 서비스 헬스체크 API 생성
- 위치: `api/External/ai-health.js`

```javascript
/**
 * @task S3S1
 * @description AI 서비스 구독 상태 헬스체크
 * PO의 AI 서비스(Gemini, ChatGPT, Perplexity)가 사용 가능한지 확인
 */

const { sendMessage, VALID_PROVIDERS } = require('../Backend_Infrastructure/ai');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {};
  const testMessage = 'Health check. Reply with OK only.';

  // 모든 AI 프로바이더 병렬 테스트
  const checks = VALID_PROVIDERS.map(async (provider) => {
    try {
      const startTime = Date.now();
      const result = await sendMessage(provider, testMessage, { maxTokens: 10 });
      const latency = Date.now() - startTime;

      results[provider] = {
        status: result.success ? 'active' : 'error',
        usable: result.success,
        latency: `${latency}ms`,
        model: result.model,
        error: result.error || null
      };
    } catch (error) {
      results[provider] = {
        status: 'error',
        usable: false,
        error: error.message
      };
    }
  });

  await Promise.all(checks);

  // 전체 상태 요약
  const allActive = Object.values(results).every(r => r.usable);
  const activeCount = Object.values(results).filter(r => r.usable).length;

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    overall: allActive ? 'healthy' : 'degraded',
    summary: `${activeCount}/${VALID_PROVIDERS.length} services active`,
    services: results
  });
};
```

### 2. vercel.json에 라우트 추가
```json
{
  "source": "/api/ai/health",
  "destination": "/api/External/ai-health"
}
```

### 3. 헬스체크 응답 예시

**모든 서비스 정상:**
```json
{
  "timestamp": "2025-12-19T10:00:00.000Z",
  "overall": "healthy",
  "summary": "3/3 services active",
  "services": {
    "gemini": {
      "status": "active",
      "usable": true,
      "latency": "450ms",
      "model": "gemini-2.5-flash"
    },
    "chatgpt": {
      "status": "active",
      "usable": true,
      "latency": "380ms",
      "model": "gpt-3.5-turbo"
    },
    "perplexity": {
      "status": "active",
      "usable": true,
      "latency": "520ms",
      "model": "sonar"
    }
  }
}
```

**일부 서비스 문제:**
```json
{
  "timestamp": "2025-12-19T10:00:00.000Z",
  "overall": "degraded",
  "summary": "2/3 services active",
  "services": {
    "gemini": { "status": "active", "usable": true },
    "chatgpt": {
      "status": "error",
      "usable": false,
      "error": "Insufficient quota"
    },
    "perplexity": { "status": "active", "usable": true }
  }
}
```

### 4. 구독 상태 문제 시 가능한 원인

| Provider | 가능한 오류 원인 |
|----------|-----------------|
| Gemini | 쿼터 초과, 결제 실패, API 비활성화 |
| ChatGPT | 크레딧 소진, 결제 실패, Rate limit |
| Perplexity | 구독 만료, 결제 실패 |

### 5. 프론트엔드 활용 (선택적)

```javascript
// Admin 대시보드에서 AI 서비스 상태 표시
async function checkAIHealth() {
  const response = await fetch('/api/ai/health');
  const data = await response.json();

  if (data.overall === 'degraded') {
    alert('일부 AI 서비스에 문제가 있습니다. 관리자에게 문의하세요.');
  }

  return data;
}
```

## Expected Output Files
- `Production/api/External/ai-health.js`
- `Production/vercel.json` (라우트 추가)

## Completion Criteria
- [ ] AI 헬스체크 API 구현 (`/api/ai/health`)
- [ ] 3개 AI 프로바이더 모두 테스트
- [ ] 응답 지연시간(latency) 측정
- [ ] 오류 시 원인 메시지 반환
- [ ] vercel.json 라우트 추가
- [ ] 실제 배포 후 테스트 완료

## Tech Stack
- Vercel Serverless Functions
- @google/generative-ai
- openai
- fetch (Perplexity)

## Task Agent
`security-specialist`

## Verification Agent
`security-auditor`

## Tools
- Write, Read
- Bash (API 테스트)

## Execution Type
AI-Only

## Remarks
- 이 API는 **PO(관리자) 전용**으로, AI 서비스 구독 상태 모니터링에 사용
- 주기적 호출로 서비스 상태 감시 가능 (Vercel Cron 등)
- 문제 발견 시 PO에게 알림 전송 가능 (추후 확장)

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- S3S1 → `S3_개발-2차/Security/` (문서)
- S3S1 → `Production/api/External/` (코드)

### 제2 규칙: Production 코드는 이중 저장
- API 코드는 Production 폴더에 저장
- 문서는 Stage 폴더에만 저장
