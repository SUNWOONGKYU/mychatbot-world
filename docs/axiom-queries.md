# Axiom 저장 쿼리 6종

> @task S9BI3
> APL (Axiom Processing Language) 기준 — 2026-04

## 1. 에러율 (5xx / 전체) — 최근 1시간

```apl
['cocobot-production']
| where _time > ago(1h)
| where isnotempty(status)
| summarize
    total = count(),
    errors = countif(toint(status) >= 500),
    error_rate_pct = round(100.0 * countif(toint(status) >= 500) / count(), 2)
  by bin(_time, 5m)
| order by _time desc
```

**알림 기준**: `error_rate_pct > 1` 지속 10분 → Slack

## 2. p95 응답 시간 — 엔드포인트별, 최근 1시간

```apl
['cocobot-production']
| where _time > ago(1h)
| where isnotempty(duration) and isnotempty(path)
| summarize p50 = percentile(toreal(duration), 50),
            p95 = percentile(toreal(duration), 95),
            p99 = percentile(toreal(duration), 99),
            count = count()
  by path
| where count > 10
| order by p95 desc
| take 20
```

**알림 기준**: `/api/chat` `p95 > 3000ms` 지속 15분

## 3. 5xx 급증 탐지 — 엔드포인트별

```apl
['cocobot-production']
| where _time > ago(30m)
| where toint(status) >= 500
| summarize count_5xx = count() by path, bin(_time, 5m)
| order by count_5xx desc
| take 10
```

**알림 기준**: 동일 path 5분 내 5xx 20건 이상

## 4. 결제 실패 집계 — 최근 24시간

```apl
['cocobot-production']
| where _time > ago(24h)
| where path startswith "/api/payments" or path startswith "/api/admin/payments"
| where toint(status) >= 400
| project _time, path, status, method, message, user_id
| order by _time desc
| take 100
```

**알림 기준**: 1시간 내 실패 10건 초과 → PO 즉시

## 5. RLS 정책 위반 의심 — 401/403 급증

```apl
['cocobot-production']
| where _time > ago(1h)
| where toint(status) in (401, 403)
| where path startswith "/api/"
| summarize count = count() by user_id, path, status
| where count > 5
| order by count desc
```

**해석**: 단일 유저가 여러 RLS-protected 엔드포인트에 연속 403 발생 → 공격 시도 또는 권한 버그

## 6. 크레딧 이상치 — 비정상 소비

```apl
['cocobot-production']
| where _time > ago(24h)
| where message contains "credit_debit" or message contains "credit_spend"
| extend amount = toint(extract(@"amount=(-?\d+)", 1, tostring(message)))
| where isnotnull(amount)
| summarize total_spent = sum(abs(amount)), tx_count = count() by user_id
| where total_spent > 100000 or tx_count > 500
| order by total_spent desc
| take 30
```

**해석**: 24시간 내 100,000원 이상 또는 500건 이상 소비 유저 → 어뷰징/봇 공격 의심

---

## 저장 방법

각 쿼리를 Axiom Dashboard → **Save as query** → 이름 부여:
1. `cocobot_error_rate_1h`
2. `cocobot_p95_by_path`
3. `cocobot_5xx_spikes`
4. `cocobot_payment_failures`
5. `cocobot_rls_suspicious`
6. `cocobot_credit_anomalies`

## Monitor/Alert 등록

각 쿼리를 Monitor 로 등록 시:
- Check frequency: 5분
- Threshold: 쿼리별 위 기준
- Notification: Slack #ops 또는 Email PO
