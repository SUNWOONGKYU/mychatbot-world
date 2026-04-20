-- @task S8BA1
-- @description 크레딧 증가/차감을 단일 PostgreSQL 트랜잭션에서 원자적으로 처리
--
-- 기존 문제:
--   SELECT balance → 계산 → UPSERT → INSERT transaction 로그
--   위 4단계가 애플리케이션 레벨 Redis 락(3~5초)에만 의존 → fail-open 시 race
--
-- 해결:
--   FOR UPDATE 행 락 + UPSERT + INSERT 를 하나의 BEGIN/COMMIT 안에서 실행.
--   serverless fail-open 및 중복 커밋, 네트워크 재시도에 대해 DB 레벨 무결성 보장.

-- ────────────────────────────────────────────────────────────────────────────
-- add_credits_tx : 크레딧 충전 (무통장 승인, 결제 확인 등)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_credits_tx(
  p_user_id         UUID,
  p_amount          NUMERIC,
  p_type            TEXT DEFAULT 'purchase',
  p_description     TEXT DEFAULT NULL,
  p_reference_id    UUID DEFAULT NULL,
  p_reference_type  TEXT DEFAULT NULL
)
RETURNS TABLE(new_balance NUMERIC, total_purchased NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance        NUMERIC := 0;
  v_current_total_purchased NUMERIC := 0;
  v_new_balance            NUMERIC;
  v_new_total_purchased    NUMERIC;
  v_now                    TIMESTAMPTZ := NOW();
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive: %', p_amount
      USING ERRCODE = '22023';
  END IF;

  -- 1) 현재 행 잠금 조회 (행 없을 수도 있음)
  SELECT balance, COALESCE(total_purchased, 0)
    INTO v_current_balance, v_current_total_purchased
  FROM mcw_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_new_balance         := COALESCE(v_current_balance, 0) + p_amount;
  v_new_total_purchased := v_current_total_purchased + p_amount;

  -- 2) UPSERT (행 없으면 INSERT, 있으면 UPDATE)
  INSERT INTO mcw_credits (user_id, balance, total_purchased, created_at, updated_at)
  VALUES (p_user_id, v_new_balance, v_new_total_purchased, v_now, v_now)
  ON CONFLICT (user_id) DO UPDATE
    SET balance         = EXCLUDED.balance,
        total_purchased = EXCLUDED.total_purchased,
        updated_at      = EXCLUDED.updated_at;

  -- 3) 이력 기록 (동일 트랜잭션)
  INSERT INTO mcw_credit_transactions (
    user_id, type, amount, balance_after,
    description, reference_id, reference_type, created_at
  )
  VALUES (
    p_user_id, p_type, p_amount, v_new_balance,
    p_description, p_reference_id, p_reference_type, v_now
  );

  RETURN QUERY SELECT v_new_balance, v_new_total_purchased;
END;
$$;

COMMENT ON FUNCTION public.add_credits_tx IS
  'Atomically add credits: row lock + upsert balance + insert transaction log. S8BA1.';

-- ────────────────────────────────────────────────────────────────────────────
-- deduct_credits_tx : 크레딧 차감 (기능 활성화, 채팅 비용 등)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_credits_tx(
  p_user_id     UUID,
  p_amount      NUMERIC,
  p_type        TEXT DEFAULT 'usage',
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_balance NUMERIC, success BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance     NUMERIC := 0;
  v_current_sub_balance NUMERIC := 0;
  v_new_balance         NUMERIC;
  v_new_sub_balance     NUMERIC;
  v_now                 TIMESTAMPTZ := NOW();
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive: %', p_amount
      USING ERRCODE = '22023';
  END IF;

  -- 1) 행 잠금 + 잔액 조회 (없으면 0)
  SELECT balance, COALESCE(subscription_balance, 0)
    INTO v_current_balance, v_current_sub_balance
  FROM mcw_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_current_balance := COALESCE(v_current_balance, 0);

  -- 2) 잔액 부족 → 차감 실패 (트랜잭션 롤백)
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT v_current_balance, FALSE;
    RETURN;
  END IF;

  v_new_balance     := v_current_balance - p_amount;
  v_new_sub_balance := GREATEST(0, v_current_sub_balance - p_amount);

  -- 3) 차감 UPDATE
  UPDATE mcw_credits
     SET balance              = v_new_balance,
         subscription_balance = v_new_sub_balance,
         updated_at           = v_now
   WHERE user_id = p_user_id;

  -- 4) 이력 기록
  INSERT INTO mcw_credit_transactions (
    user_id, type, amount, balance_after, description, created_at
  )
  VALUES (
    p_user_id, p_type, -p_amount, v_new_balance, p_description, v_now
  );

  RETURN QUERY SELECT v_new_balance, TRUE;
END;
$$;

COMMENT ON FUNCTION public.deduct_credits_tx IS
  'Atomically deduct credits: row lock + balance check + update + transaction log. S8BA1.';

-- ────────────────────────────────────────────────────────────────────────────
-- 권한: service_role 만 호출 가능 (클라이언트 직접 호출 차단)
-- ────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.add_credits_tx     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_credits_tx  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.add_credits_tx     TO service_role;
GRANT  EXECUTE ON FUNCTION public.deduct_credits_tx  TO service_role;
