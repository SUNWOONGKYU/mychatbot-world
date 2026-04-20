# Sentry 통합 절차 — CoCoBot World

> @task S8BI1 — Error + Performance + Source maps 통합

## 개요

서버리스/브라우저 에러와 성능을 Sentry로 수집한다. 환경변수 `NEXT_PUBLIC_SENTRY_DSN` 이 설정돼 있을 때만 활성화되고, 미설정 시 모든 wiring 은 no-op 로 동작하여 현 배포에 영향 없음.

## 활성화 체크리스트 (PO 수행)

1. [sentry.io](https://sentry.io) 계정/조직 생성 (Team plan, 익월 $26)
2. Project 생성: platform = **Next.js**
3. 발급된 DSN 복사 (`https://<hash>@oXXXXX.ingest.sentry.io/YYY`)
4. Vercel 환경변수 추가:
   ```bash
   npx vercel env add NEXT_PUBLIC_SENTRY_DSN production
   # (값 붙여넣기)
   npx vercel env add SENTRY_ORG production
   npx vercel env add SENTRY_PROJECT production
   npx vercel env add SENTRY_AUTH_TOKEN production   # (source maps 업로드용)
   ```
5. 재배포 — 최초 배포 시 자동으로 `@sentry/nextjs` 가 source map 을 업로드.
6. Sentry 대시보드에서 **"Your first error"** 테스트 이벤트 확인.

## 설치 (PO 수행 1회)

```bash
npm install @sentry/nextjs@^8
npx @sentry/wizard@latest -i nextjs
```

Wizard 가 다음을 자동 생성:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.js` 에 `withSentryConfig(...)` 래핑

## 수집 정책

| 구분 | 샘플레이트 | 비고 |
|------|-----------|------|
| Error | 100% | 전량 수집 |
| Transaction (Perf) | 10% | 비용 최적화 |
| Session Replay | 5% (error 시 100%) | 사용자 재현 |
| Profiler | 0% | 미사용 |

## 민감 데이터 필터

`beforeSend` 훅으로 다음을 스크러빙:

- `request.headers.authorization`, `cookie`, `x-admin-key`
- URL query 중 `token`, `key`, `secret` 파라미터
- body 중 `password`, `phone`, `email` 전체 문자열

## 사용자 컨텍스트

로그인 후 `Sentry.setUser({ id: userId })` — **개인정보(email, phone) 기록 금지**, 내부 ID 만.

## release tagging

빌드 시 `SENTRY_RELEASE=<git-sha>` 로 자동 태깅 (Vercel `VERCEL_GIT_COMMIT_SHA`).
source maps 는 동일 release 로 업로드돼 스택트레이스 매핑.

## 알림 규칙 (Sentry Dashboard)

- **P0 (SEV1)**: new issue + `environment:production` + first-seen → Slack `#incidents`
- **P1**: error rate > 1% for 5min → Slack `#alerts`
- **Perf**: p95 latency > 2s on `/api/chat` → Slack `#alerts`

## 비활성 상태 확인

현재 코드는 DSN 미설정 시:

```ts
if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, ... });
```

→ `Sentry.init` 이 호출되지 않아 모든 수집 경로가 no-op.

## 관련

- 장애 대응: `docs/runbooks/incident-response.md`
- Secret 관리: `docs/secret-rotation.md` (Sentry DSN 은 회전 불필요 — 저위험)
- Log drain 연동: `docs/log-drain.md` (S8BI2)
