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

Supabase 유료 플랜(Pro 월 $25+)에서 제공.

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

- [ ] Supabase Pro 플랜 업그레이드 (Branching 에 필수)
- [ ] Branching 활성화
- [ ] GitHub Integration 연결
- [ ] seed.sql 작성 (관리자 + 샘플 데이터)
- [ ] Preview 배포로 PR 1건 테스트
- [ ] E2E 워크플로에 preview URL 주입 step 추가

## 관련

- Backup: `docs/runbooks/backup.md`
- PITR drill: `docs/pitr-drill.md` (S8DV2)
- Deploy: `docs/runbooks/deploy.md`
