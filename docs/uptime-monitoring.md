# Uptime Monitoring — CoCoBot World

> @task S8BI3 — 외부 모니터링 + 알림

## 왜 외부 모니터링인가

Vercel/Supabase 의 상태 페이지는 사업자 자체 문제를 은폐할 수 있다. 제3자(예: UptimeRobot)가 5분마다 외부망에서 HTTP 요청을 보내 실제 사용자 경험을 기준으로 다운타임을 측정·알림.

## 서비스: UptimeRobot 추천

- 무료 플랜: 50 monitors, 5분 간격, HTTP/HTTPS/Keyword
- 유료(월 $7): 1분 간격, SSL 만료 감지, Slack 다중 채널
- 대안: Better Stack, Pingdom, StatusCake

## 모니터 설정

### 필수 모니터 6종

| # | 이름 | URL | 간격 | Keyword | 비고 |
|---|------|-----|:----:|---------|------|
| 1 | `Home Landing` | `https://mychatbot.world/` | 5m | `CoCoBot` | SSR 정상 동작 확인 |
| 2 | `API Health` | `https://mychatbot.world/api/health` | 5m | `"status":"ok"` | DB/Redis/OpenRouter 체크 |
| 3 | `Skills Catalog` | `https://mychatbot.world/skills` | 5m | — | 공개 카탈로그 가용성 |
| 4 | `Community Feed` | `https://mychatbot.world/community` | 5m | — | 공개 읽기 DB 가용성 |
| 5 | `SSL Cert` | `https://mychatbot.world/` | — | SSL check | 14일 전 알림 |
| 6 | `DNS` | `mychatbot.world` | 5m | ping | DNS 가용성 |

### 선택 모니터 (유료)

- `Login page load time < 3s` (Response time threshold)
- `Chat API cold start latency < 5s`

## 알림 채널

### 우선순위

1. **P0 (다운)**: 2회 연속 실패 → Slack `#incidents` + 이메일 + SMS
2. **P1 (느림)**: response time > 5s 5분 지속 → Slack `#alerts`
3. **SSL 만료**: 14일/7일/1일 전 → 이메일

### Slack 연동

```
UptimeRobot Dashboard → My Settings → Alert Contacts
  + Add → Slack webhook
  - Channel: #incidents
  - URL: (Slack webhook)
  - Monitor-level assignment
```

## 복구 알림

장애 종료(Up 재개) 시 자동으로 같은 채널에 복구 메시지.

## Status Page (공개)

UptimeRobot Free 는 간단한 public status page 제공:
```
https://stats.uptimerobot.com/<hash>
```

배포 시 `/about` 또는 footer 에서 링크.

## On-call 연동

- `docs/runbooks/on-call.md` — 알림 수신 시 15분 내 ack.
- SEV 분류는 `docs/runbooks/incident-response.md` 기준.
- 2회 연속 실패 = SEV1 또는 SEV2 (영향 범위에 따라).

## PO 작업 체크리스트

- [ ] UptimeRobot 계정 생성
- [ ] 위 6개 모니터 등록
- [ ] Slack webhook 생성 (`#incidents`, `#alerts`)
- [ ] Alert Contact 에 webhook 등록
- [ ] 각 모니터 Alert Contact 할당
- [ ] Test 알림 1회 (모니터 pause → 재개로 검증)
- [ ] Status page URL 을 README/about 페이지에 추가

## 비용 예상

- Free: 충분 (5분 간격으로도 다운 2회 연속 = 10분 감지 가능)
- Pro($7/월): 1분 간격 + 더 많은 채널 필요 시

## 관련

- Incident response: `docs/runbooks/incident-response.md`
- On-call: `docs/runbooks/on-call.md`
- Health API: `app/api/health/route.ts` (S6BI2 에서 DB/Redis/OpenRouter 실 체크로 고도화됨)
