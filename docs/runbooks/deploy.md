# Deploy Runbook — CoCoBot World

> @task S8DC2 — 배포 표준 절차

## 배포 방식

Vercel + GitHub Actions. `main` 브랜치 push 시 자동 배포.

## 사전 체크

### 코드

- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npm run build` 성공 (로컬 또는 CI)
- [ ] Playwright E2E production-smoke 5/5 PASS (로컬 또는 PR CI)
- [ ] lint 경고 신규 없음

### 환경변수 (Vercel Production)

필수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_API_KEY`
- `NEXT_PUBLIC_APP_URL=https://mychatbot.world`

선택 (있으면 기능 활성화):
- `OPENROUTER_API_KEY` — AI 채팅
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — 분산 rate limit
- `SENTRY_DSN` (예정) — 에러 추적
- `AXIOM_TOKEN` / `VERCEL_LOG_DRAIN_URL` (예정) — 로그 드레인

### DB 마이그레이션

코드 배포 **이전**에 Supabase SQL Editor 에서 실행:

```
1. supabase/migrations/ 에서 신규 SQL 파일 복사
2. Supabase Dashboard → SQL Editor → New query
3. 붙여넣기 → Run
4. Error 없음 확인 → "Query run successfully"
5. 필요한 경우 verification 쿼리로 결과 확인
```

주요 최근 마이그레이션:
- `20260420_perf_indexes.sql` — 성능 인덱스
- `20260420_credit_atomic_rpc.sql` — 크레딧 atomic RPC (S8BA1)
- `20260420_rls_coverage_s8sc1.sql` — RLS 전 테이블 커버리지 (S8SC1)

## 배포 절차

### 표준 (main push)

```bash
git checkout main
git pull
# 변경 확인
git status
git diff --stat
# 커밋·푸시 (pre-commit hook: API key scan + stage sync)
git add <specific-files>
git commit -m "..."
git push origin main
# Vercel 자동 배포 시작 (2~5분)
```

### 수동 (Vercel CLI, large repo 시)

```bash
# --archive=tgz 로 대용량 업로드 문제 우회 (19,000+ files)
npx vercel --prod --archive=tgz --yes
```

## 배포 후 검증

```bash
# 1. 헬스체크 (warnings 필드 없어야 함 — 선택 env 모두 설정 시)
curl -sS https://mychatbot.world/api/health?v=$(date +%s) | jq
# 기대: { "status": "ok", "checks": { "env": "ok", "supabase": "ok" } }

# 2. 공개 페이지 smoke
for path in / /bots /skills /jobs /community /customer-service; do
  code=$(curl -sI -o /dev/null -w '%{http_code}' "https://mychatbot.world$path")
  echo "$path → $code"
done
# 기대: 모두 200

# 3. robots.txt / sitemap
curl -sS https://mychatbot.world/robots.txt | head
curl -sS https://mychatbot.world/sitemap.xml | head
```

## 실패 시

- Vercel 배포 실패 → 로그 확인 → 원인 수정 → 재배포
- Runtime 오류 스파이크 → `rollback.md` 절차
- DB 마이그레이션 실패 → **절대로 배포 진행 금지** → 마이그레이션 수정 후 재시도

## 긴급 Hotfix

```bash
git checkout -b hotfix/<issue>
# 최소 수정
git commit -m "hotfix: ..."
git push origin hotfix/<issue>
gh pr create --base main --title "hotfix: ..." --body "..."
# CI 통과 확인 → Merge
# main 에 머지되면 자동 배포
```

## 배포 주기

- **정기**: 필요 시 수시 (main merge 즉시)
- **Feature flag**: 현재 없음 (필요 시 envFlag 도입)
- **Merge freeze**: 모바일 앱 릴리스 브랜치 cut 시점 준수
