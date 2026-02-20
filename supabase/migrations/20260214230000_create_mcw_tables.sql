-- MCW Storage Manager v2.0 — Supabase 테이블 생성
-- 실행: Supabase Dashboard > SQL Editor에서 실행

-- ══════════════════════════════════════
-- 1. mcw_bots: 봇 프로필 (공개 데이터)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS mcw_bots (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  owner_id TEXT DEFAULT 'admin',
  bot_name TEXT NOT NULL,
  bot_desc TEXT DEFAULT '',
  emoji TEXT DEFAULT '🤖',
  greeting TEXT DEFAULT '',
  faqs JSONB DEFAULT '[]'::jsonb,
  input_text TEXT DEFAULT '',
  category TEXT DEFAULT 'bot-profile',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책: 모든 사용자 읽기 가능, anon key로 쓰기 가능
ALTER TABLE mcw_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mcw_bots_read" ON mcw_bots
  FOR SELECT USING (true);

CREATE POLICY "mcw_bots_write" ON mcw_bots
  FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════
-- 2. mcw_personas: 페르소나 (공개 A형)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS mcw_personas (
  id TEXT PRIMARY KEY,
  bot_id TEXT REFERENCES mcw_bots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  category TEXT DEFAULT 'avatar',  -- avatar | helper
  template_id TEXT,
  helper_type TEXT,
  model TEXT DEFAULT 'logic',
  iq_eq INTEGER DEFAULT 50,
  is_visible BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  greeting TEXT DEFAULT '',
  faqs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mcw_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mcw_personas_read" ON mcw_personas
  FOR SELECT USING (true);

CREATE POLICY "mcw_personas_write" ON mcw_personas
  FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════
-- 3. mcw_kb_items: 지식베이스 메타데이터
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS mcw_kb_items (
  id TEXT PRIMARY KEY,
  bot_id TEXT REFERENCES mcw_bots(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'public-faq',
  data JSONB,
  storage_path TEXT,        -- Supabase Storage 경로 (대용량 파일)
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mcw_kb_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mcw_kb_items_read" ON mcw_kb_items
  FOR SELECT USING (true);

CREATE POLICY "mcw_kb_items_write" ON mcw_kb_items
  FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════
-- 4. Indexes
-- ══════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_mcw_personas_bot_id ON mcw_personas(bot_id);
CREATE INDEX IF NOT EXISTS idx_mcw_kb_items_bot_id ON mcw_kb_items(bot_id);
CREATE INDEX IF NOT EXISTS idx_mcw_kb_items_category ON mcw_kb_items(category);
CREATE INDEX IF NOT EXISTS idx_mcw_bots_username ON mcw_bots(username);


-- ══════════════════════════════════════
-- 5. Storage Bucket (대용량 파일)
-- ══════════════════════════════════════
-- Supabase Dashboard > Storage에서 수동 생성 또는:
INSERT INTO storage.buckets (id, name, public)
VALUES ('kb-files', 'kb-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 모든 사용자 읽기/쓰기
CREATE POLICY "kb_files_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'kb-files');

CREATE POLICY "kb_files_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kb-files');

CREATE POLICY "kb_files_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'kb-files');

CREATE POLICY "kb_files_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'kb-files');
