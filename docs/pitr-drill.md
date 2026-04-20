# PITR 복구 드릴 — CoCoBot World

> @task S8DV2 — Supabase Point-in-Time Recovery 실 드릴 + 기록

## 목표

분기별 1회 PITR 복구 드릴을 수행하여:
1. 복구 절차가 실 동작함을 증명
2. 복구 소요 시간(RTO) 측정 — 목표 < 1시간
3. 데이터 손실 윈도(RPO) 확인 — Supabase PITR 기본 2분 이내

## 사전 조건

- Supabase 플랜: **Pro 이상** (PITR 포함)
- Staging DB 있음 (`docs/staging-env.md`)
- 드릴은 **staging 에서만 수행** — production 은 절대 impact 금지

## 드릴 시나리오 3종

### 시나리오 A: 특정 시점 복구 (의도된 데이터 삭제)

```
T+0   : staging DB 에 테스트 row 1000건 insert
T+5m  : 의도적으로 `DELETE FROM mcw_credits WHERE 1=1` 실행
T+10m : PITR 로 T+4m 시점 복구
Goal  : 1000건 복원 확인
```

### 시나리오 B: 전체 프로젝트 롤백 (광범위 스키마 오류)

```
T+0   : 잘못된 마이그레이션 적용 (DROP TABLE mcw_bots 등)
T+5m  : PITR 로 마이그레이션 직전 시점 복구
Goal  : 테이블 + 데이터 + 정책 전량 복원
```

### 시나리오 C: 단일 테이블 부분 복구 (운영 실수)

```
T+0   : `UPDATE mcw_users SET credits = 0` 실행 (범위 오류)
T+5m  : PITR 복구본에서 `mcw_users` 만 pg_dump + main DB 에 restore
Goal  : 다른 테이블 영향 없이 users 복원
```

## 표준 절차

### 1. 복구 시점 결정

```
Supabase Dashboard → Database → Backups → Point in Time Recovery
  - 복구 시점: T-1 min ~ T-7 days 중 선택 (분 단위)
```

### 2. 복구 대상 프로젝트

옵션:
- **A) 기존 프로젝트로 덮어쓰기** — ⚠️ 신중 (production 에는 절대 금지)
- **B) 새 프로젝트로 복구** (권장) — 독립 DB 에 복원 후 필요 데이터만 수동 이식

### 3. 복구 명령 (Dashboard)

```
"Restore" 클릭 → 시점 확인 → "I understand, restore"
```

예상 소요: 5~30분 (DB 크기에 비례)

### 4. 검증

```sql
-- 복구본 프로젝트에 접속 후
SELECT count(*) FROM mcw_bots;       -- 원본과 일치?
SELECT count(*) FROM mcw_credits;    -- 원본과 일치?
SELECT max(created_at) FROM mcw_transactions; -- 복구 시점과 일치?
```

### 5. 애플리케이션 연결 전환 (광범위 복구 시)

```bash
# 새 프로젝트로 복구한 경우 Vercel env 업데이트
npx vercel env rm NEXT_PUBLIC_SUPABASE_URL production
echo "<새 프로젝트 URL>" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... (anon, service_role 동일)
npx vercel --prod --archive=tgz --yes
```

### 6. 정리

- 드릴 종료 후 staging DB 원복 또는 삭제
- 본 문서 하단 "드릴 기록" 에 결과 기록

## RTO / RPO 목표

| 지표 | 목표 | 측정 방법 |
|------|:----:|-----------|
| RTO (Recovery Time Objective) | < 1h | 복구 명령 → 서비스 재개까지 |
| RPO (Recovery Point Objective) | < 5min | 복구 시점 vs 장애 시점 |

## 분기 드릴 일정

| 분기 | 시기 | 시나리오 |
|------|------|----------|
| 2026 Q2 | 2026-06-15 | A (특정 시점 복구) |
| 2026 Q3 | 2026-09-15 | B (전체 롤백) |
| 2026 Q4 | 2026-12-15 | C (단일 테이블) |
| 2027 Q1 | 2027-03-15 | A (재검증) |

## 드릴 기록 (결과 누적)

| 일시 | 담당 | 시나리오 | RTO 실측 | RPO 실측 | 결과 | 이슈 |
|------|------|---------|:--------:|:--------:|:----:|------|
| (pending) | — | — | — | — | — | 첫 드릴은 S8DV1 완료 후 수행 |

## 금지 사항

- ❌ production DB 에 직접 PITR 복구 (새 프로젝트로만)
- ❌ 드릴 중 production 트래픽 연결 전환
- ❌ 복구본 DB 에 실 사용자 로그인 허용
- ❌ 드릴 스크립트를 CI 에 자동화 (PITR 과금 + 리소스 소모)

## PO 체크리스트

- [ ] Supabase Pro 플랜 (PITR 포함)
- [ ] Staging DB 준비 (S8DV1)
- [ ] 분기별 캘린더 알림 등록 (위 4건)
- [ ] 첫 드릴 수행 + 본 문서 "드릴 기록" 업데이트
- [ ] RTO/RPO 목표 초과 시 원인 분석 + 개선안 문서화

## 관련

- Backup runbook: `docs/runbooks/backup.md`
- Rollback runbook: `docs/runbooks/rollback.md`
- Incident response: `docs/runbooks/incident-response.md`
