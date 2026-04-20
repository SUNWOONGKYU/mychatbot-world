# Log Drain 설정 — CoCoBot World

> @task S8BI2 — Vercel stdout → 외부 저장소 수집

## 아키텍처

```
Vercel Function (stdout/stderr as JSON)
        ↓
    Log Drain (HTTPS webhook)
        ↓
    Axiom (추천) / Betterstack / Datadog
        ↓
    질의·알림·대시보드
```

## 구조화 로그 (이미 적용)

`lib/logger.ts` — 모든 로그가 단일 라인 JSON:

```json
{"ts":"2026-04-20T10:00:00.000Z","level":"info","service":"cocobot-world","version":"abc1234","message":"payment confirmed","userId":"u_xxx","paymentId":"p_xxx"}
```

사용 예:
```ts
import { logger } from '@/lib/logger';
logger.info('payment confirmed', { userId, paymentId, amount });
logger.error('OpenRouter failed', { err: String(err), model });
```

자동 마스킹:
- 키에 `password|token|secret|authorization|cookie|admin_key|api_key` 포함 → `[REDACTED]`
- 길이 32+ 의 hex/base64 → `앞4자…[REDACTED:길이]`

## Axiom 연결 (추천)

### 1. Axiom 계정 + Dataset

1. [axiom.co](https://axiom.co) 가입 (Personal 무료 — 월 500GB)
2. "Create Dataset" → 이름: `cocobot-prod`
3. "Settings → API tokens" → `Ingest` 토큰 발급

### 2. Vercel Log Drain 연결

```
Vercel Dashboard → Project → Integrations → Log Drains
  + Add → Axiom
  - Dataset: cocobot-prod
  - Token: (위에서 발급)
  - Source: lambda,static,edge,build
  - Filter: (비움 — 전량 수집)
```

설정 즉시 Axiom 에 로그 스트림 시작.

### 3. 주요 쿼리 예시

```
// 전체 에러율 (지난 1시간)
| where level == "error" | summarize count() by bin(_time, 5m)

// 특정 사용자 최근 이벤트
| where userId == "u_xxx" | order by _time desc | limit 50

// /api/chat p95 latency
| where message startswith "chat" | summarize p95=percentile(duration, 95)

// RLS 실패(서비스 키 탈취 의심 신호)
| where message contains "row level security"
```

### 4. 알림 (Axiom Monitors)

- **High error rate** — `level=error` count > 50 in 5min → Slack
- **Payment anomaly** — `message ~ "payment"` level=error > 0 → Slack (즉시)
- **Auth bypass attempt** — 401/403 스파이크 → Slack

## 대안: Betterstack / Datadog

- Betterstack: 월 $12 에 30일 retention. Axiom 과 동일한 Vercel 연동.
- Datadog: 엔터프라이즈. 과금 복잡.

## 비활성 상태 (현재)

Log drain 이 설정되지 않아도 `logger.*` 호출은 Vercel 콘솔에 출력되고, 10분간 Vercel Dashboard 에서 확인 가능. 장기 저장만 불가.

## 환경변수

```bash
LOG_LEVEL=info        # debug | info | warn | error (기본 info)
```

`LOG_LEVEL=debug` 는 로컬 디버깅 전용 — production 에서 토큰 빠른 소모 유발.

## 보존 기간 정책

- 에러/경고: 90일
- 일반 info: 30일
- debug: log drain 에 보내지 않음 (production 에선 MIN_LEVEL=info 로 필터)

## 관련

- Sentry(에러 심층 분석): `docs/sentry-setup.md` — Sentry 와 중복 아님. Axiom 은 전량, Sentry 는 스택트레이스/리플레이.
- Secret rotation: `docs/secret-rotation.md` (Axiom 토큰 180일 회전)
- 장애 대응: `docs/runbooks/incident-response.md` (Axiom 쿼리 템플릿 활용)
