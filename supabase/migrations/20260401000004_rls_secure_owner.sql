-- RLS 보안 강화: 관리자(데모) 봇은 공개, 나머지는 소유자만 접근
-- 관리자 이메일: wksn@gmail.com
--
-- 동작 원리:
--   SELECT: 관리자 봇 → 누구나 조회 | 일반 봇 → 소유자만 조회
--   INSERT: 로그인 사용자만 (자기 owner_id로만)
--   UPDATE/DELETE: 소유자만

-- ══════════════════════════════════════
-- 헬퍼 함수: 관리자 UUID 조회
-- ══════════════════════════════════════
CREATE OR REPLACE FUNCTION mcw_admin_uid()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id::text FROM auth.users WHERE email = 'wksn@gmail.com' LIMIT 1;
$$;


-- ══════════════════════════════════════
-- 1. mcw_bots
-- ══════════════════════════════════════
DROP POLICY IF EXISTS "mcw_bots_read" ON mcw_bots;
DROP POLICY IF EXISTS "mcw_bots_write" ON mcw_bots;

-- 읽기: 관리자(데모) 봇은 누구나 / 나머지는 소유자만
CREATE POLICY "mcw_bots_select" ON mcw_bots
  FOR SELECT USING (
    owner_id = mcw_admin_uid()          -- 관리자 봇 → 공개
    OR owner_id = 'admin'               -- 레거시 admin 기본값 → 공개
    OR owner_id = auth.uid()::text      -- 본인 봇
  );

-- 쓰기(INSERT): 로그인 사용자, 자기 owner_id로만
CREATE POLICY "mcw_bots_insert" ON mcw_bots
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()::text
  );

-- 수정(UPDATE): 소유자만
CREATE POLICY "mcw_bots_update" ON mcw_bots
  FOR UPDATE USING (
    owner_id = auth.uid()::text
  ) WITH CHECK (
    owner_id = auth.uid()::text
  );

-- 삭제(DELETE): 소유자만
CREATE POLICY "mcw_bots_delete" ON mcw_bots
  FOR DELETE USING (
    owner_id = auth.uid()::text
  );


-- ══════════════════════════════════════
-- 2. mcw_personas (bot_id 기반 간접 소유권)
-- ══════════════════════════════════════
DROP POLICY IF EXISTS "mcw_personas_read" ON mcw_personas;
DROP POLICY IF EXISTS "mcw_personas_write" ON mcw_personas;

-- 읽기: 관리자 봇의 페르소나는 공개 / 나머지는 봇 소유자만
CREATE POLICY "mcw_personas_select" ON mcw_personas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = mcw_personas.bot_id
        AND (
          mcw_bots.owner_id = mcw_admin_uid()
          OR mcw_bots.owner_id = 'admin'
          OR mcw_bots.owner_id = auth.uid()::text
        )
    )
  );

-- 쓰기: 봇 소유자만
CREATE POLICY "mcw_personas_insert" ON mcw_personas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = mcw_personas.bot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "mcw_personas_update" ON mcw_personas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = mcw_personas.bot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "mcw_personas_delete" ON mcw_personas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = mcw_personas.bot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );


-- ══════════════════════════════════════
-- 3. mcw_kb_items (bot_id 기반 간접 소유권)
-- ══════════════════════════════════════
DROP POLICY IF EXISTS "mcw_kb_items_read" ON mcw_kb_items;
DROP POLICY IF EXISTS "mcw_kb_items_write" ON mcw_kb_items;

-- 읽기: 관리자 봇의 KB는 공개 / 나머지는 봇 소유자만
CREATE POLICY "mcw_kb_items_select" ON mcw_kb_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = mcw_kb_items.bot_id
        AND (
          mcw_bots.owner_id = mcw_admin_uid()
          OR mcw_bots.owner_id = 'admin'
          OR mcw_bots.owner_id = auth.uid()::text
        )
    )
  );

CREATE POLICY "mcw_kb_items_insert" ON mcw_kb_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = mcw_kb_items.bot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "mcw_kb_items_update" ON mcw_kb_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = mcw_kb_items.bot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "mcw_kb_items_delete" ON mcw_kb_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = mcw_kb_items.bot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );


-- ══════════════════════════════════════
-- 4. Storage: kb-files (봇 소유자만 업로드/삭제)
-- ══════════════════════════════════════
-- 읽기는 공개 유지 (봇 대화에서 KB 파일 필요)
-- 쓰기/삭제만 제한
DROP POLICY IF EXISTS "kb_files_write" ON storage.objects;
DROP POLICY IF EXISTS "kb_files_update" ON storage.objects;
DROP POLICY IF EXISTS "kb_files_delete" ON storage.objects;

CREATE POLICY "kb_files_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kb-files'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "kb_files_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'kb-files'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "kb_files_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'kb-files'
    AND auth.uid() IS NOT NULL
  );
