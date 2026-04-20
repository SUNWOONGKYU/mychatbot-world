# RLS 감사 리포트 (초기)

> **생성**: 2026-04-20
> **도구**: `scripts/rls-audit.ts`
> **상태**: 초기 placeholder — 실 DB 실행은 PO가 `SUPABASE_SERVICE_ROLE_KEY` 로 수행

## 실행 방법

```bash
export SUPABASE_URL=https://<project>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
pnpm tsx scripts/rls-audit.ts
```

실행 후 이 파일이 덮어쓰기된다. 결과 검토 후 Git 커밋.

## 감사 기준

| 조건 | 판정 |
|------|------|
| `mcw_*` 테이블 + `rowsecurity = true` | PASS |
| `mcw_*` 테이블 + `rowsecurity = false` | **FAIL** (RLS 비활성화) |
| 정책 0건 | **FAIL** (데이터 잠금) |
| SELECT 정책 없음 | WARN |
| `_logs` 아닌 테이블에 UPDATE 정책 없음 | INFO |
| 비 `mcw_*` + 민감 키워드 없음 | PASS (제외) |

## 조치 체크리스트

실행 후 FAIL 발견 시:

1. 해당 테이블에 `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`
2. 사용자별 분리 정책 추가:
   ```sql
   CREATE POLICY "user_can_read_own" ON {table}
     FOR SELECT USING (auth.uid() = user_id);
   ```
3. 재실행하여 PASS 확인
4. 기존 데이터에 대한 soft-migration 검토 (기존 사용자 데이터가 정책에 부합하는지)

## 후속

- 분기별 1회 `pnpm rls-audit` 정례화
- CI에서 migration 후 자동 실행 추가 (S9BA5와 연계)
