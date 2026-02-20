# Task Instruction - S1BI2

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
S1BI2

## Task Name
Sentry 에러 트래킹 설정

## Task Goal
클라이언트/서버 에러 모니터링을 위한 Sentry 설정으로 개발 초기 버그 조기 발견

## Prerequisites (Dependencies)
- S1BI1 (환경변수 설정) 완료

## Specific Instructions

### 1. Sentry 프로젝트 설정
- Sentry 계정 생성 (https://sentry.io)
- 새 프로젝트 생성: SSALWorks (JavaScript)
- DSN 키 발급

### 2. 클라이언트 사이드 설정
- 위치: `P3_프로토타입_제작/Frontend/Prototype/lib/sentry-client.js`

```javascript
// lib/sentry-client.js
/**
 * @task S1BI2
 * Sentry 클라이언트 초기화
 */

const SENTRY_DSN = window.SENTRY_DSN || '';

class SentryClient {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (!SENTRY_DSN) {
            console.warn('Sentry DSN not configured');
            return;
        }

        // Sentry SDK 동적 로드
        await this.loadScript('https://browser.sentry-cdn.com/7.x/bundle.min.js');

        if (window.Sentry) {
            window.Sentry.init({
                dsn: SENTRY_DSN,
                environment: window.location.hostname === 'localhost' ? 'development' : 'production',
                tracesSampleRate: 1.0,
                replaysSessionSampleRate: 0.1,
                replaysOnErrorSampleRate: 1.0,
            });
            this.initialized = true;
            console.log('Sentry initialized');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    captureException(error, context = {}) {
        if (this.initialized && window.Sentry) {
            window.Sentry.captureException(error, { extra: context });
        }
        console.error('Captured:', error);
    }

    captureMessage(message, level = 'info') {
        if (this.initialized && window.Sentry) {
            window.Sentry.captureMessage(message, level);
        }
    }

    setUser(user) {
        if (this.initialized && window.Sentry) {
            window.Sentry.setUser({
                id: user.id,
                email: user.email,
            });
        }
    }
}

export const sentry = new SentryClient();
export default sentry;
```

### 3. Serverless API 에러 핸들러
- 위치: `api/lib/sentry-server.js`

```javascript
// api/lib/sentry-server.js
/**
 * @task S1BI2
 * Sentry 서버사이드 에러 핸들링
 */

const Sentry = require('@sentry/node');

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
    });
}

function captureApiError(error, req) {
    if (!SENTRY_DSN) return;

    Sentry.withScope((scope) => {
        scope.setExtra('url', req.url);
        scope.setExtra('method', req.method);
        scope.setExtra('body', req.body);
        Sentry.captureException(error);
    });
}

function wrapApiHandler(handler) {
    return async (req, res) => {
        try {
            return await handler(req, res);
        } catch (error) {
            captureApiError(error, req);
            throw error;
        }
    };
}

module.exports = {
    Sentry,
    captureApiError,
    wrapApiHandler
};
```

### 4. 환경변수 설정
- `.env.local` 및 Vercel 환경변수에 추가:
```
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
```

### 5. 전역 에러 핸들링 설정
- 위치: `P3_프로토타입_제작/Frontend/Prototype/lib/error-handler.js`

```javascript
// lib/error-handler.js
/**
 * @task S1BI2
 * 전역 에러 핸들러
 */

import { sentry } from './sentry-client.js';

// 전역 에러 핸들러
window.addEventListener('error', (event) => {
    sentry.captureException(event.error, {
        type: 'uncaught_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
    });
});

// Promise rejection 핸들러
window.addEventListener('unhandledrejection', (event) => {
    sentry.captureException(event.reason, {
        type: 'unhandled_rejection'
    });
});

export function initErrorHandling() {
    sentry.init();
}
```

## Expected Output Files
- `P3_프로토타입_제작/Frontend/Prototype/lib/sentry-client.js`
- `api/lib/sentry-server.js`
- `P3_프로토타입_제작/Frontend/Prototype/lib/error-handler.js`
- `.env.local` (SENTRY_DSN 추가)

## Completion Criteria
- [ ] Sentry 프로젝트 생성 및 DSN 발급
- [ ] 클라이언트 Sentry SDK 설정
- [ ] 서버사이드 Sentry 설정
- [ ] 전역 에러 핸들러 설정
- [ ] 테스트 에러 발생 시 Sentry 대시보드에 기록 확인

## Tech Stack
- Sentry SDK (@sentry/browser, @sentry/node)
- JavaScript (ES6+)

## Task Agent
`devops-troubleshooter`

## Verification Agent
`qa-specialist`

## Tools
- Sentry Dashboard
- Vercel Environment Variables

## Execution Type
AI-Only

## Remarks
- 개발 초기에 설정하여 버그 조기 발견에 활용
- 프로덕션에서는 tracesSampleRate 낮춤 권장 (비용 관리)
- 민감한 정보 (비밀번호 등) 로깅 주의

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
