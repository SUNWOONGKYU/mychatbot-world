-- @task S2DB1
-- Phase 1 DB 스키마: usage_logs, bot_templates
-- 기존 테이블 참고: mcw_bots (TEXT PK), mcw_personas, mcw_chat_logs
-- 생성일: 2026-03-04

-- ══════════════════════════════════════
-- 1. usage_logs 테이블
--    사용자/게스트의 액션(메시지, TTS, 봇 생성 등) 로그
--    bot_id → mcw_bots(id) TEXT FK (기존 스키마와 일치)
--    user_id → auth.users(id) UUID FK (Supabase Auth)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS usage_logs (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  bot_id           TEXT    REFERENCES mcw_bots(id) ON DELETE SET NULL,
  guest_session_id TEXT,                              -- 비로그인 게스트 식별자
  action_type      TEXT    NOT NULL                   -- 'message' | 'tts' | 'bot_create'
                   CHECK (action_type IN ('message', 'tts', 'bot_create')),
  tokens_used      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS: usage_logs ──────────────────────────────────────────────────────────
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- 로그인 사용자: 본인 레코드만 SELECT
CREATE POLICY "usage_logs_select_own" ON usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 로그인 사용자: 본인 레코드 INSERT (user_id 강제)
CREATE POLICY "usage_logs_insert_own" ON usage_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 게스트: guest_session_id 기반 INSERT (user_id IS NULL)
CREATE POLICY "usage_logs_insert_guest" ON usage_logs
  FOR INSERT
  WITH CHECK (user_id IS NULL AND guest_session_id IS NOT NULL);

-- service_role: 전체 접근 (백엔드 집계용)
-- ※ service_role은 RLS를 bypass하므로 별도 정책 불필요

-- ── 인덱스: usage_logs ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created
  ON usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_bot_id
  ON usage_logs(bot_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_guest_session
  ON usage_logs(guest_session_id)
  WHERE guest_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type
  ON usage_logs(action_type);


-- ══════════════════════════════════════
-- 2. bot_templates 테이블
--    봇 생성 시 선택할 수 있는 업종별 프리셋 템플릿
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS bot_templates (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  category        TEXT    NOT NULL,                  -- 'lawyer', 'restaurant', 'hospital', etc.
  template_name   TEXT    NOT NULL,
  persona_prompt  TEXT    NOT NULL,
  greeting        TEXT    NOT NULL,
  sample_faqs     JSONB   DEFAULT '[]'::jsonb,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS: bot_templates ───────────────────────────────────────────────────────
ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;

-- 전체 공개 SELECT (로그인/비로그인 모두)
CREATE POLICY "bot_templates_select_public" ON bot_templates
  FOR SELECT
  USING (is_active = TRUE);

-- INSERT/UPDATE/DELETE: service_role만 허용 (anon/authenticated 차단)
-- ※ authenticated 사용자도 직접 수정 불가 — 관리자(service_role)만 템플릿 관리
CREATE POLICY "bot_templates_insert_service" ON bot_templates
  FOR INSERT
  WITH CHECK (FALSE);   -- anon/authenticated 삽입 차단; service_role은 RLS bypass

CREATE POLICY "bot_templates_update_service" ON bot_templates
  FOR UPDATE
  USING (FALSE);        -- anon/authenticated 수정 차단

CREATE POLICY "bot_templates_delete_service" ON bot_templates
  FOR DELETE
  USING (FALSE);        -- anon/authenticated 삭제 차단

-- ── 인덱스: bot_templates ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bot_templates_category
  ON bot_templates(category);

CREATE INDEX IF NOT EXISTS idx_bot_templates_active
  ON bot_templates(is_active)
  WHERE is_active = TRUE;
