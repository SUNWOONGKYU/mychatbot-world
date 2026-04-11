-- S4SC2: mcw_chat_logs RLS 보안 강화
-- 기존 USING (true) 전체 허용 정책을 제거하고 소유자 기반 정책으로 교체

-- ============================
-- 기존 정책 제거
-- ============================

DROP POLICY IF EXISTS "Allow all" ON mcw_chat_logs;
DROP POLICY IF EXISTS "Enable all access" ON mcw_chat_logs;
DROP POLICY IF EXISTS "allow_all" ON mcw_chat_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON mcw_chat_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON mcw_chat_logs;
DROP POLICY IF EXISTS "chat_logs_all" ON mcw_chat_logs;
DROP POLICY IF EXISTS "mcw_chat_logs_read" ON mcw_chat_logs;
DROP POLICY IF EXISTS "mcw_chat_logs_write" ON mcw_chat_logs;

-- RLS 활성화 (이미 활성화된 경우 무시)
ALTER TABLE mcw_chat_logs ENABLE ROW LEVEL SECURITY;

-- ============================
-- SELECT: 봇 소유자 또는 관리자만 조회 가능
-- ============================
-- 봇 소유자: mcw_bots.owner_id = auth.uid() 인 봇의 chat_log만 조회 가능
-- 관리자: app_metadata에 role='admin' 이 있는 경우 전체 조회 가능

CREATE POLICY "chat_logs_select_owner_or_admin"
ON mcw_chat_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mcw_bots
    WHERE mcw_bots.id = mcw_chat_logs.bot_id
      AND mcw_bots.owner_id = auth.uid()::text
  )
  OR
  (auth.jwt() ->> 'role') = 'admin'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- ============================
-- INSERT: 봇 소유자만 삽입 가능
-- ============================

CREATE POLICY "chat_logs_insert_owner"
ON mcw_chat_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mcw_bots
    WHERE mcw_bots.id = mcw_chat_logs.bot_id
      AND mcw_bots.owner_id = auth.uid()::text
  )
);

-- ============================
-- UPDATE: 봇 소유자만 수정 가능
-- ============================

CREATE POLICY "chat_logs_update_owner"
ON mcw_chat_logs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM mcw_bots
    WHERE mcw_bots.id = mcw_chat_logs.bot_id
      AND mcw_bots.owner_id = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mcw_bots
    WHERE mcw_bots.id = mcw_chat_logs.bot_id
      AND mcw_bots.owner_id = auth.uid()::text
  )
);

-- ============================
-- DELETE: 봇 소유자만 삭제 가능
-- ============================

CREATE POLICY "chat_logs_delete_owner"
ON mcw_chat_logs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM mcw_bots
    WHERE mcw_bots.id = mcw_chat_logs.bot_id
      AND mcw_bots.owner_id = auth.uid()::text
  )
);

-- ============================
-- 서비스 롤 예외: 백엔드에서 service_role로 접근 시 RLS 우회 (Supabase 기본 동작)
-- service_role 키 사용 시 모든 정책을 우회하므로 별도 정책 불필요
-- ============================
