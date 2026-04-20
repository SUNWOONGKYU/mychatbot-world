# Backup & Restore Runbook — CoCoBot World

> @task S8DC2 — Supabase PITR 백업 및 복구 절차

## 백업 전략

| 유형 | 방식 | 보관 기간 |
|------|------|----------|
| **자동 DB 백업** | Supabase Daily Backup (Pro 플랜) | 7일 |
| **PITR (Point-In-Time Recovery)** | Supabase WAL archival | 최대 7일 (Pro) / 30일 (Team+) |
| **Storage** | Supabase Storage 자체 복제 (99.999999999%) | 영구 |
| **SQL 스키마** | `supabase/migrations/*.sql` git 버전관리 | 영구 |

## 복구 시나리오

### 시나리오 1 — 특정 테이블 데이터 삭제 (우발적)

```
1. Supabase Dashboard → Database → Backups
2. "Point-in-time recovery" 선택
3. 복구 시점 지정 (삭제 직전 시각)
4. 새 프로젝트로 복구 (기존 프로젝트는 live 유지)
5. 새 프로젝트의 해당 테이블만 pg_dump → psql 로 기존에 주입
```

### 시나리오 2 — 전체 DB 손상

```
1. Supabase Dashboard → Project Settings → General → Pause project
2. Backups → "Restore from backup" 최신 백업 선택
3. 복구 완료 후 /api/health 체크
4. 결제 데이터 불일치 여부 `mcw_payments` vs `mcw_credit_transactions` 대조
```

### 시나리오 3 — 잘못된 마이그레이션

```
1. Supabase SQL Editor 에서 반대 방향 migration 실행
   (예: DROP TABLE / ALTER TABLE DROP COLUMN / DROP FUNCTION)
2. git revert <migration commit>
3. CI 가 auto-deploy 하지 않도록 Vercel 에서 일시 차단
```

## 복구 드릴 (Quarterly)

분기별 1회, staging 환경에서 복구 드릴을 실시하여 절차 유효성 검증.

### 드릴 절차

```
1. Staging DB 에 테스트 데이터 insert (1,000 rows mcw_credits)
2. 임의 행 100개 DELETE
3. PITR 복구 (삭제 30초 전 시점으로)
4. 복구된 데이터가 삭제 전과 동일한지 COUNT + checksum 비교
5. 결과를 docs/runbooks/backup-drill-YYYY-Q?.md 로 기록
```

### 드릴 체크리스트

- [ ] 백업 존재 여부 (최근 24h 이내)
- [ ] PITR 활성화 상태
- [ ] 복구 소요 시간 (목표: ≤ 30분)
- [ ] 데이터 무결성 (row count + sha256)
- [ ] 롤백 가능 여부 (drill 완료 후 기존 상태 복구)

## 결제 데이터 특별 취급

`mcw_payments` / `mcw_credit_transactions` / `mcw_credits` 3 테이블은 **복구 후 반드시 무결성 검증**:

```sql
-- 결제 합계 vs 크레딧 증가 이력 대조
SELECT user_id,
       (SELECT SUM(amount) FROM mcw_payments p
        WHERE p.user_id = c.user_id AND p.status = 'completed') AS paid,
       (SELECT SUM(amount) FROM mcw_credit_transactions t
        WHERE t.user_id = c.user_id AND t.type = 'purchase') AS credited
FROM mcw_credits c
HAVING paid IS DISTINCT FROM credited;
```

불일치 발생 시 즉시 SEV1 선언 + PO 에스컬레이션.

## 참고

- Supabase PITR 문서: https://supabase.com/docs/guides/platform/backups
- PostgreSQL WAL: https://www.postgresql.org/docs/current/wal-intro.html
