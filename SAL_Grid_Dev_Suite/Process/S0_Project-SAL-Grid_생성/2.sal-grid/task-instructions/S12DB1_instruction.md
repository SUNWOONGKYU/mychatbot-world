# S12DB1: mcw_bots.order_index INT 컬럼 추가

## Task 정보
- **Task ID**: S12DB1
- **Stage**: S12 / **Area**: DB
- **Dependencies**: —

## 목표
탭 순서를 보존할 수 있도록 `mcw_bots` 테이블에 `order_index INT` 컬럼을 추가한다.

## 생성 파일
- `supabase/migrations/20260421_mcw_bots_order_index.sql`

## SQL
```sql
ALTER TABLE mcw_bots
  ADD COLUMN IF NOT EXISTS order_index INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_mcw_bots_owner_order
  ON mcw_bots(owner_id, order_index);
```

## 주의
- NULLABLE 아님(DEFAULT 0) → 기존 레코드 0 일괄 세팅
- S12BA1 에서 ORDER BY order_index ASC, created_at ASC 로 반환
