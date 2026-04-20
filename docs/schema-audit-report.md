# DB 스키마 감사 리포트 (템플릿)

> 이 파일은 `pnpm tsx scripts/schema-audit.ts` 실행 시 자동 덮어쓰기 됩니다.
> 현재는 PO 실행 대기 중 — 템플릿/실행 가이드 문서.

## 실행 방법

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=sb_service_role_xxx \
pnpm tsx scripts/schema-audit.ts
```

완료 시 본 파일이 실측 데이터로 갱신됩니다.

## 감사 범위 (5 카테고리)

| Category | 탐지 대상 | Severity |
|----------|-----------|----------|
| FK | `_id` 접미사 컬럼 중 FOREIGN KEY 제약 없는 것 | warning |
| UNIQUE | 전형 고유 컬럼 (user_id, email, slug 등)에 UNIQUE 누락 | warning |
| NOT_NULL | 핵심 필수 컬럼 (owner_id, amount 등)에 NOT NULL 누락 | **critical** |
| INDEX | 자주 WHERE/JOIN 되는 컬럼에 인덱스 없음 | warning |
| UNUSED_INDEX | pg_stat_user_indexes 기반 미사용 인덱스 | info |

## 전제 조건

- `exec_sql` RPC 함수가 public 스키마에 존재해야 함 (Supabase SQL Editor 선실행):

```sql
create or replace function public.exec_sql(sql text)
returns setof json
language plpgsql
security definer
as $$
begin
  return query execute sql;
end;
$$;
revoke all on function public.exec_sql(text) from public, anon, authenticated;
grant execute on function public.exec_sql(text) to service_role;
```

## 임계 기준

- **Critical = 0** → Stage Gate 통과
- **Critical > 0** → 마이그레이션 추가 후 재실행 필요

## Critical 발견 시 조치

| 카테고리 | 조치 |
|---------|------|
| NOT_NULL | `ALTER TABLE ... ALTER COLUMN ... SET NOT NULL` — 기존 NULL 행 백필 선행 |
| FK 누락 | `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES ...` |
| UNIQUE 누락 | `CREATE UNIQUE INDEX CONCURRENTLY ...` (락 회피) |
| INDEX 누락 | `CREATE INDEX CONCURRENTLY ...` — 부하 낮은 시간대 실행 |

---

*실제 리포트는 스크립트 실행 후 본 파일을 덮어씁니다.*
