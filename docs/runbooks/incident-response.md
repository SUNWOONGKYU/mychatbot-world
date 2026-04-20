# Incident Response Runbook — CoCoBot World

> @task S8DC2 — 운영 장애 대응 절차서

## 개요

프로덕션 장애 발생 시 따라야 할 표준 절차.

## 심각도 분류

| Severity | 정의 | 대응 시간 |
|----------|------|----------|
| **SEV1** | 전면 장애 (사이트 접속 불가, DB 다운, 결제 실패) | 즉시 (≤ 15분) |
| **SEV2** | 핵심 기능 장애 (AI 채팅 불가, 로그인 불가) | 1시간 이내 |
| **SEV3** | 일부 기능 장애 (커뮤니티 불안정, 일부 API 500) | 24시간 이내 |
| **SEV4** | 사용자 체감 미미 (내부 로그 경고, 성능 저하) | 주간 작업 |

## 대응 절차 (SEV1/SEV2)

### 1. 탐지 (Detect)

- **UptimeRobot 알림** (예정: S8BI3)
- **Sentry 에러 스파이크** (예정: S8BI1)
- 사용자 제보 → `/support` 또는 Slack

### 2. 확인 (Acknowledge)

```bash
# 프로덕션 헬스체크
curl -sS https://mychatbot.world/api/health | jq
# 기대: { "status": "ok", "checks": { "env": "ok", "supabase": "ok" } }

# 공개 페이지 smoke
curl -sSI https://mychatbot.world/ | head -1   # HTTP/2 200
curl -sSI https://mychatbot.world/bots | head -1
```

### 3. 격리 (Isolate)

문제 범위 확인:
- **전면 장애** → Vercel 대시보드에서 최근 배포 확인 → 즉시 롤백 (`rollback.md`)
- **DB 장애** → Supabase Dashboard → Database → Logs
- **특정 API** → Vercel Functions 로그 → 해당 route 검사

### 4. 완화 (Mitigate)

| 유형 | 즉시 대응 |
|------|-----------|
| 잘못된 배포 | `vercel rollback` 또는 이전 커밋 태그로 강제 배포 |
| DB 연결 실패 | Supabase 프로젝트 재시작 또는 connection pool 리셋 |
| 레이트 리밋 오작동 | `UPSTASH_REDIS_REST_URL` env 확인, fail-open 재확인 |
| Env 누락 | Vercel env 추가 후 재배포 |
| 메모리 누수 | 함수 timeout/memory 증설, 원인 핫픽스 |

### 5. 복구 (Recover)

- 30분 이상 장애면 상태 페이지 게시 (`/support` 배너)
- 결제 데이터 손실 의심 시 PITR 드릴 절차 참조 (`backup.md`)

### 6. 사후 분석 (Postmortem)

24시간 이내 작성:
```markdown
# [YYYY-MM-DD] <Incident title>
- Severity: SEV?
- Duration: HH:MM ~ HH:MM (KST)
- Impact: 영향 범위 + 숫자 (예: 5분간 /api/chat 500)
- Timeline: 탐지/확인/완화/복구 시각
- Root Cause: 원인
- Remediation: 즉시 조치
- Follow-ups: SAL Grid Task 등록
```

## On-call 연락처

- **Primary**: (운영자)
- **Secondary**: (백업 담당)
- **Escalation**: PO (최종 의사결정)

## 자주 보는 대시보드

| 도구 | URL | 용도 |
|------|-----|------|
| Vercel | vercel.com/[team]/mychatbot-world | 배포·함수 로그 |
| Supabase | supabase.com/dashboard | DB·Auth·Storage |
| UptimeRobot | uptimerobot.com (예정) | 외부 모니터링 |
| Sentry | sentry.io (예정) | 에러/APM |
| `/api/health` | https://mychatbot.world/api/health | 자체 헬스체크 |
