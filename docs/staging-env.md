# Staging Environment — CoCoBot World

> @task S8DV1 — Vercel Preview + Supabase Branch DB 로 분리된 스테이징 구축

## 목표

production 과 분리된 staging 환경에서:
- DB 스키마 마이그레이션 dry-run
- 새 기능 사전 QA
- PR별 격리된 preview 배포 제공

## 아키텍처

```
GitHub PR → Vercel Preview Deploy → Supabase Branch DB (PR별)
                                          ↓
                                 자동 마이그레이션 적용
                                          ↓
                                 E2E/smoke 테스트 실행
```

## Vercel Preview 설정 (이미 활성)

Vercel 은 기본으로 `main` 외 모든 브랜치/PR에 대해 preview 배포 생성. 도메인 예:
```
https://mychatbot-world-git-feature-xxx-<team>.vercel.app
```

## Supabase Branching 활성화 (PO 수행)

Supabase Pro 플랜(이미 사용 중)에 포함된 기능 — 플랜 업그레이드 불필요. 대시보드에서 활성화만 하면 됨.

### 1. Dashboard 활성화

```
Supabase Dashboard → Project → Branches
  [ ] Enable database branching
  GitHub integration: connect mychatbot-world repo
```

### 2. 자동 생성 조건

`supabase/config.toml` 또는 `supabase/migrations/` 변경 포함 PR → preview branch DB 자동 생성.

### 3. 환경변수 자동 주입

Vercel 이 Supabase GitHub integration 을 통해 preview 배포에:
```
NEXT_PUBLIC_SUPABASE_URL   = <branch-db-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY = <branch-anon-key>
SUPABASE_SERVICE_ROLE_KEY  = <branch-service-key>
```
자동 주입.

## 차이점 (production vs staging)

| 항목 | Production | Staging (Preview) |
|------|-----------|-------------------|
| 도메인 | mychatbot.world | *.vercel.app |
| DB | 본 프로젝트 | Branch DB (PR마다 격리) |
| 결제 | 실결제 | 테스트 모드 (무통장 확인 admin key 만 유효) |
| 이메일 | 실 발송 | noop (mailhog 권장) |
| OpenRouter | 실 모델 | free tier 우선 |
| Sentry env | `production` | `preview` |
| Uptime 모니터 | 6개 | 없음 |

## 씨드 데이터

Branch DB 는 Supabase 가 production 스키마를 자동 복사하지만 **데이터는 복사하지 않음**. 필요 시:

```bash
# supabase/seed.sql 을 preview 생성 시 자동 실행
# - 관리자 계정 1개 (seed_admin@example.com)
# - 샘플 Bot 5개
# - 샘플 Skill 10개
```

## Preview URL 생명주기

- PR 열림 → preview 생성
- PR push → preview 갱신
- PR 머지 또는 close → 3일 후 자동 삭제 + branch DB 삭제

## PR 별 E2E 실행 (기존 e2e.yml)

`.github/workflows/e2e.yml` 이 이미 `pull_request` 에 트리거. preview URL 을 `TEST_BASE_URL` 로 주입하려면:

```yaml
# (추후 개선)
- name: Get Vercel Preview URL
  uses: patrickedqvist/wait-for-vercel-preview@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    max_timeout: 300
  id: preview

- name: Run E2E against preview
  env:
    TEST_BASE_URL: ${{ steps.preview.outputs.url }}
```

## PO 체크리스트

- [x] Supabase Pro 플랜 (이미 활성)
- [ ] Branching 활성화
- [ ] GitHub Integration 연결
- [ ] seed.sql 작성 (관리자 + 샘플 데이터)
- [ ] Preview 배포로 PR 1건 테스트
- [ ] E2E 워크플로에 preview URL 주입 step 추가

## 관련

- Backup: `docs/runbooks/backup.md`
- PITR drill: `docs/pitr-drill.md` (S8DV2), `docs/pitr-drill-2026Q2.md` (S9DB3 분기별)
- Deploy: `docs/runbooks/deploy.md`

---

## S9DV1 확장 — Seed + 고정 Staging

### `scripts/seed-staging.ts` 사용

Branch DB 생성 후 또는 장기 고정 staging 환경에 테스트 데이터 주입용.

```bash
SUPABASE_URL=https://<branch>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<branch-service-key> \
pnpm tsx scripts/seed-staging.ts
```

주입 데이터:
- 테스트 유저 3명 (`test+001@mychatbot.world` ~ `test+003@...`)
- 샘플 봇 5개 (다양한 persona)
- 크레딧 잔고 각 100,000원
- 결제 내역 1건 (status=approved, 무통장 테스트)

### 고정 Staging 도메인 (선택)

PR별 preview URL은 휘발성이므로 장기 QA 환경이 필요하면:

1. Vercel → Domains → `staging.mychatbot.world` 추가 → Branch: `staging`
2. `staging` 브랜치를 main 직전 합류 지점으로 운영
3. Supabase Branches → `staging` 브랜치 고정 생성 → Vercel env Scope "Preview: staging"

### 격리 검증 체크리스트 (S9DV1)

- [ ] `staging.mychatbot.world` 접속 → 랜딩 OK
- [ ] Staging DB `SELECT COUNT(*) FROM mcw_profiles` → Production DB와 다른 수치
- [ ] Staging 회원가입 → Production 계정 목록에 없음
- [ ] Staging 결제 → Production 결제 내역에 없음
- [ ] Upstash Redis 키 네임스페이스 충돌 없음
- [ ] Sentry 환경 태그 `staging` 정확히 분리

### 데이터 보호 규칙

- Staging 데이터는 **익명화된 합성 데이터만** — 실제 유저 데이터 복사 금지 (개인정보보호법)
- 실 결제 연동 절대 금지 — 무통장 테스트 모드만 허용
