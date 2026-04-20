# On-call Runbook — CoCoBot World

> @task S8DC2 — On-call 당직 가이드

## On-call 이란

CoCoBot World 프로덕션에 대한 1차 대응 책임자. 주 단위 교대.

## 책임

1. **알림 수신** — UptimeRobot / Sentry / Slack 알림을 15분 이내 확인
2. **분류** — `incident-response.md` 의 SEV 분류 적용
3. **초기 대응** — SEV1/SEV2 는 15분 이내 mitigate 착수
4. **에스컬레이션** — 15분 내 해결 불가 시 Secondary 호출, 1시간 내 해결 불가 시 PO 호출
5. **기록** — Slack `#incidents` 에 Timeline 실시간 기록
6. **Postmortem** — 장애 종료 후 24h 이내 작성

## On-call 시작 시 체크

주 시작일 (월 오전 10:00 KST):

```bash
# 1. 최근 배포 상태
curl -sS https://mychatbot.world/api/health | jq

# 2. 미해결 incident 있는지 Slack #incidents 확인

# 3. 최근 에러 스파이크 (Sentry 예정)

# 4. DB 상태 — Supabase Dashboard → Database → "Used storage"

# 5. Vercel 함수 사용량 — Vercel Dashboard → Usage

# 6. 예정된 변경사항 — 이번 주 merge 예정 PR 검토
```

## 당직 중 접근 권한

| 시스템 | 권한 |
|--------|------|
| Vercel | Team member (배포 promote/rollback) |
| Supabase | Developer role (SQL Editor, Logs, Auth) |
| GitHub | Triage+ (PR review, merge 권한은 별도) |
| `/api/admin/*` | `ADMIN_API_KEY` 헤더로 접근 |
| Uptime/Sentry | Read + Ack |

## 흔한 알림 대응

### "500 errors spiked on /api/chat"

```
1. Vercel Functions 로그 → 최근 에러 확인
2. OpenRouter 상태 페이지 확인 (status.openrouter.ai)
3. 외부 API 장애면 상태 페이지 안내 + 60/120s 타임아웃 동작 확인
4. 내부 원인이면 롤백 고려
```

### "Supabase connection failed"

```
1. Supabase Dashboard → Project Status 확인 (유지보수 중?)
2. 프로젝트 일시정지 상태인지 확인 (무료 플랜 idle timeout)
3. 연결 제한 초과면 connection pool 재시작
4. 여러 시도 실패 시 DB 마이그레이션 시나리오 점검 (rollback.md)
```

### "Payment amount exceeded"

- C1 방어(`max 5,000,000`)가 무력화됐다는 뜻
- 즉시 Vercel 로그에서 문제 요청 IP/userId 확인
- `mcw_payments` 에 해당 row 확인 → status=pending 이면 수동 cancel
- 우회 시도자 IP 밴 고려 (Cloudflare 등)

### "RLS bypass suspected"

- 누군가 service_role key 를 탈취했을 수 있음 → 즉시 **SC3 Secret Rotation** 절차 (`../secret-rotation.md`)
- Vercel env 즉시 회전, Supabase Dashboard 에서 neue service_role key 발급

## 장애 템플릿 (Slack)

```
🚨 [SEV?] <한 줄 요약>
Time: YYYY-MM-DD HH:MM KST
Impact: <영향 범위 + 수치>
Status: Detected / Ack / Mitigating / Resolved
Action: <지금 하고 있는 일>
Updates every 15min until resolved.
```

## 핸드오프 (월 오전 10:00)

- 미해결 티켓 / 진행 중 이슈 전달
- 이번 주 예정 배포 일정 공유
- 접근 권한 이전 (문서 편집 권한 등)
- 이전 주 postmortem 리뷰

## 피로 관리

- 같은 사람이 연속 2주 on-call 금지
- SEV1 대응 후 8시간 휴식 권고
- 한밤 대응 후 다음날 오전 늦게 업무 시작 OK
