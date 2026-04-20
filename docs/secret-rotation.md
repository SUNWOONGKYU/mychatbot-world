# Secret Rotation Policy — CoCoBot World

> @task S8SC3 — 비밀 로테이션 정책 및 캘린더

## 정책

프로덕션에서 사용되는 모든 비밀(secret)은 정기적으로 회전하여 탈취 시 피해를 최소화한다.

## 대상 비밀 및 주기

| 비밀 | 회전 주기 | 긴급 회전 트리거 |
|------|----------|-----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | **90일** | 키 노출 의심, 직원 이탈, RLS bypass 의심 |
| `ADMIN_API_KEY` | **90일** | 관리자 이탈, 로그 유출 |
| `SUPABASE_JWT_SECRET` | **180일** | 대규모 토큰 위조 의심 |
| `OPENROUTER_API_KEY` | **180일** | 비정상 사용량 스파이크 |
| `UPSTASH_REDIS_REST_TOKEN` | **180일** | Upstash 대시보드 접근 이상 |
| `SENTRY_DSN` (예정) | 회전 불필요 | DSN 노출 자체는 저위험 |
| `AXIOM_TOKEN` (예정) | **180일** | 로그 무단 접근 의심 |
| DB 사용자 비밀번호 | **90일** | Supabase Dashboard |
| Vercel API token (CLI용) | **180일** | CI 토큰 유출 |
| GitHub Actions secrets | **180일** | 워크플로 로그 유출 |

## 2026 로테이션 캘린더

| 월 | 회전 대상 | 담당 | 비고 |
|----|----------|------|------|
| 2026-01 | (신규 프로젝트 — 초기 값 설정) | PO | baseline |
| 2026-04 | `ADMIN_API_KEY` | On-call | 90일 첫 회전 (S7PROD1 생성 기준 4월) |
| 2026-07 | `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_KEY`, DB 비밀 | On-call | Q3 |
| 2026-10 | `ADMIN_API_KEY` | On-call | Q4 |
| 2027-01 | 모든 90일 + 180일 비밀 | PO + On-call | 연 1회 전체 점검 |

## 회전 절차 (표준)

### 1. 신규 비밀 생성

```bash
# 무작위 키 생성 예시 (64 hex chars = 256 bits)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- Supabase `service_role` — Dashboard → Project Settings → API → "Generate new JWT secret" (주의: 기존 토큰 전량 invalidate)
- OpenRouter — https://openrouter.ai/keys → 신규 키 발급
- Upstash — Console → Database → "Rotate token"

### 2. 이전 비밀과 신규 비밀 **병행 수용 기간** (24h)

가능한 시스템은 이전+신규 둘 다 허용하여 장애 없이 전환.
불가한 경우(Supabase service_role 등)는 점검 창을 잡아 전환.

### 3. Vercel 환경 업데이트

```bash
npx vercel env rm <KEY> production --yes
echo "<NEW_VALUE>" | npx vercel env add <KEY> production
# 재배포 트리거
npx vercel --prod --archive=tgz --yes
```

### 4. 검증

```bash
curl -sS https://mychatbot.world/api/health | jq
# warnings/missingEnvs 없어야 함

# admin key 테스트
curl -sSI -H "X-Admin-Key: <NEW_VALUE>" \
  https://mychatbot.world/api/admin/stats
# 200 예상
```

### 5. 이전 비밀 revoke

- Supabase: 자동 (JWT secret 회전 시)
- Admin key: 구 값을 Vercel 에 아예 삭제
- 외부 서비스: 각 대시보드에서 구 키 delete

### 6. 기록

`docs/secret-rotation-log.md` 에 날짜/대상/담당자/검증 결과 기록 (비밀 값은 **절대** 저장 금지).

## 긴급 회전 (Emergency Rotation)

키 노출 의심 시:

```
1. 즉시 신규 키 발급 (위 절차 1)
2. Vercel env 즉시 교체 (위 절차 3)
3. 재배포 (5분 이내)
4. 구 키 즉시 revoke (병행 기간 없음)
5. 로그 조사 — 구 키로 수행된 의심 요청 식별
6. 영향 받은 사용자 통지 (필요 시)
7. Postmortem 작성 (incident-response.md 절차 준용)
```

## 노출 탐지

- GitHub push 시 `pre-commit hook` 이 API key 패턴 스캔 (현재 동작 중)
- Vercel Deploy 로그에 비밀 값이 찍히지 않도록 확인
- Sentry 에러 메시지에 비밀 값 노출 여부 주기적 audit

## 금지 사항

- ❌ 비밀을 git repo 에 커밋 (`.env*` 파일 포함)
- ❌ Slack / 이메일 / 티켓에 비밀 평문 공유 (1Password/Bitwarden 등 사용)
- ❌ 서브에이전트에게 비밀 평문 전달
- ❌ 로그에 비밀 전체 길이 출력 (마스킹 필수)

## 캘린더 알림

GitHub 또는 Google Calendar 로 다음 알림 등록:

```
2026-07-20 09:00 KST — 🔐 Secret Rotation Q3 (Supabase + Admin + DB)
2026-10-20 09:00 KST — 🔐 Secret Rotation Q4 (Admin)
2027-01-20 09:00 KST — 🔐 Secret Rotation Annual (전체)
```

> 담당자 이탈 시 이 문서를 업데이트하여 알림 수신자를 교체할 것.
