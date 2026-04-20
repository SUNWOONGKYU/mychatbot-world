# 환경변수 감사 (S9BA4)

> **작성일**: 2026-04-20
> **검증 로직**: `lib/env.ts` (`checkServerEnv`, `assertServerEnv`)

## 환경변수 전수 표

| Key | 필수 | 용도 | 설정 위치 | 참조 |
|-----|:----:|------|-----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL | Vercel Prod/Preview/Dev | `@supabase/ssr` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon 키 | Vercel 전 환경 | 브라우저 RLS 쿼리 |
| `SUPABASE_SERVICE_ROLE_KEY` | 선택 | 서비스 롤 (RPC/어드민) | Vercel Prod/Preview | `add_credits_tx` 호출 |
| `OPENROUTER_API_KEY` | 선택 | AI 라우팅 | Vercel Prod/Preview | `lib/openrouter-client.ts` |
| `ADMIN_API_KEY` | 선택 | `/admin` 접근 키 | Vercel Prod (회전 3개월) | `requireAdmin()` |
| `UPSTASH_REDIS_REST_URL` | 선택 | Rate limit / 캐시 | Vercel Prod/Preview | `@upstash/redis` |
| `UPSTASH_REDIS_REST_TOKEN` | 선택 | Upstash 토큰 | 동일 | 동일 |
| `PAYMENT_BANK_NAME` | 선택 | 무통장 은행명 | Vercel Prod | `/api/payments` |
| `PAYMENT_ACCOUNT_NUMBER` | 선택 | 계좌번호 | Vercel Prod | 동일 |
| `PAYMENT_ACCOUNT_HOLDER` | 선택 | 예금주 | Vercel Prod | 동일 |
| `SENTRY_DSN` | 선택 | 에러 수집 (서버) | Vercel Prod | `sentry.server.config.ts` |
| `NEXT_PUBLIC_SENTRY_DSN` | 선택 | 에러 수집 (클라) | Vercel Prod | `sentry.client.config.ts` |
| `NEXT_PUBLIC_POSTHOG_KEY` | 선택 | 제품 분석 | Vercel Prod/Preview | `lib/analytics.ts` (S9BA6) |
| `NEXT_PUBLIC_POSTHOG_HOST` | 선택 | PostHog 호스트 | Vercel Prod/Preview | 동일 |
| `VERCEL_GIT_COMMIT_SHA` | 자동 | Release 태깅 | Vercel 자동 주입 | Sentry release |
| `VERCEL_ENV` | 자동 | 환경 식별 | Vercel 자동 주입 | 환경 분기 |

## 프로덕션 런칭 필수 체크

### 1차 (런칭 차단)
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `ADMIN_API_KEY`
- [x] `OPENROUTER_API_KEY`
- [x] `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`

### 2차 (런칭 당일)
- [ ] `PAYMENT_BANK_NAME` / `PAYMENT_ACCOUNT_NUMBER` / `PAYMENT_ACCOUNT_HOLDER` — 사업자 계좌 개설 후
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — Sentry 프로젝트 생성 후 (docs/sentry-setup.md)

### 3차 (런칭 후 1주)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` — PostHog 연동 (S9BA6)

## Deprecated / 미사용 (삭제 후보)

- (현재 없음 — 발견 시 이 섹션에 기록)

## 자동 검증

빌드 시 `assertServerEnv()` 호출 위치:
- 모든 API 라우트 초기에 (예: `app/api/health/route.ts`)
- `instrumentation.ts` 에서 server runtime 진입 시

누락·형식 오류 시 명확한 에러로 조기 실패. 선택 env는 warning만 출력.

## PO 설정 절차

```bash
# Vercel CLI로 환경변수 일괄 설정
npx vercel env pull .env.production.local  # 현재 상태 백업
npx vercel env add SENTRY_DSN production    # 프롬프트에 값 붙여넣기
# ... 나머지 env 반복
npx vercel env ls                           # 확인
```

회전 주기:
- `ADMIN_API_KEY`: 3개월
- `SUPABASE_SERVICE_ROLE_KEY`: 6개월 또는 유출 의심 시 즉시
- `OPENROUTER_API_KEY`: 6개월
- `SENTRY_AUTH_TOKEN`: 1년

## 문서 참조

- `.env.example` — 로컬 개발 템플릿
- `lib/env.ts` — 검증 스키마
- `docs/sentry-setup.md` — S9BI1
- `docs/staging-env.md` — S9DV1
