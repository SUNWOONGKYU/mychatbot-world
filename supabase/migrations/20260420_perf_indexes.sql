-- 2026-04-20 / 프로덕션 런칭 준비 — 쿼리 성능 인덱스 추가
-- Ref: MBO 프로덕션 런칭 준비완료 / Performance Audit Agent 2 / M3
-- 대상:
--   1) messages.conversation_id — 채팅 히스토리 조회 핫 경로
--   2) mcw_revenue.creator_id — 매출 대시보드 소유자 필터
--   3) mcw_revenue.created_at — 기간 집계 쿼리
--   4) mcw_credit_transactions.user_id — 크레딧 내역 조회
--   5) skill_installations.user_id — 설치 스킬 목록

-- CONCURRENTLY 옵션은 마이그레이션 트랜잭션 밖에서만 허용되므로 일반 CREATE INDEX 사용.
-- 각각 IF NOT EXISTS로 멱등성 확보.

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_mcw_revenue_creator_id
  ON mcw_revenue (creator_id);

CREATE INDEX IF NOT EXISTS idx_mcw_revenue_created_at
  ON mcw_revenue (created_at);

CREATE INDEX IF NOT EXISTS idx_mcw_credit_transactions_user_id
  ON mcw_credit_transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_skill_installations_user_id
  ON skill_installations (user_id);
