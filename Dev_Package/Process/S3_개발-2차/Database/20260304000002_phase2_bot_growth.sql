-- @task S3DB2
-- Phase 2 DB Schema: bot_growth table
-- Description: Chatbot growth system supporting bot_growth table
-- Created: 2026-03-04
-- Dependencies: S3DB1 (Phase 1 tables), bots table from 20260214230000_create_mcw_tables.sql

-- ============================================================
-- 1. CREATE bot_growth TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bot_growth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE UNIQUE,
  experience INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  school_sessions_completed INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CREATE INDEXES
-- ============================================================
CREATE INDEX idx_bot_growth_bot_id ON bot_growth(bot_id);
CREATE INDEX idx_bot_growth_level ON bot_growth(level);

-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE bot_growth ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- Policy: Only bot owner can SELECT
CREATE POLICY select_own_bot_growth ON bot_growth
  FOR SELECT
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

-- Policy: Only bot owner can UPDATE
CREATE POLICY update_own_bot_growth ON bot_growth
  FOR UPDATE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can INSERT (including service_role)
CREATE POLICY insert_bot_growth ON bot_growth
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================
-- 5. TRIGGER FOR AUTOMATIC updated_at
-- ============================================================

-- Create moddatetime extension if not exists
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Create trigger to auto-update updated_at field
CREATE TRIGGER handle_bot_growth_updated_at
  BEFORE UPDATE ON bot_growth
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- 6. COMMENTS (Documentation)
-- ============================================================
COMMENT ON TABLE bot_growth IS 'Bot growth and progression system tracking experience, level, and activity metrics';
COMMENT ON COLUMN bot_growth.id IS 'Unique identifier for bot growth record';
COMMENT ON COLUMN bot_growth.bot_id IS 'Reference to bots table, unique constraint to maintain 1:1 relationship';
COMMENT ON COLUMN bot_growth.experience IS 'Accumulated experience points for bot progression';
COMMENT ON COLUMN bot_growth.level IS 'Current level of bot (starting at level 1)';
COMMENT ON COLUMN bot_growth.total_conversations IS 'Total number of conversations the bot has participated in';
COMMENT ON COLUMN bot_growth.total_messages IS 'Total number of messages sent by the bot';
COMMENT ON COLUMN bot_growth.school_sessions_completed IS 'Number of educational/school sessions the bot has completed';
COMMENT ON COLUMN bot_growth.last_activity_at IS 'Timestamp of the most recent bot activity';
COMMENT ON COLUMN bot_growth.created_at IS 'Timestamp when bot growth record was created';
COMMENT ON COLUMN bot_growth.updated_at IS 'Timestamp when bot growth record was last modified (auto-managed)';

-- ============================================================
-- 7. MIGRATION VERIFICATION
-- ============================================================
-- Verify table structure
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'bot_growth';
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'bot_growth';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'bot_growth';
