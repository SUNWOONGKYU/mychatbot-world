# S12DB1 Verification

## 검증 범위
- 마이그레이션 파일 존재
- Supabase 에 컬럼 실제 적용

## 검증 방법
1. `supabase/migrations/20260421_mcw_bots_order_index.sql` 존재
2. Supabase Management API 로 `information_schema.columns` 조회 → `mcw_bots.order_index` 존재
3. Index `idx_mcw_bots_owner_order` 생성 확인
4. 기존 레코드 `order_index = 0` 초기값 확인

## 합격 기준
- 마이그레이션 적용 완료
- 쿼리 `SELECT column_name FROM information_schema.columns WHERE table_name='mcw_bots' AND column_name='order_index'` 1행 반환
