-- ============================================================
-- S5 Wiki-e-RAG 마이그레이션
-- S5DB1: wiki_pages 테이블
-- S5DB2: wiki_lint_logs 테이블
-- S5DB3: match_wiki_pages RPC 함수
-- S5SC1: RLS 정책
-- ============================================================

-- S5DB1: wiki_pages 테이블 생성
CREATE TABLE IF NOT EXISTS wiki_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT NOT NULL REFERENCES mcw_bots(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  page_type TEXT DEFAULT 'concept' CHECK (page_type IN ('concept','faq','summary','comparison','entity','crossref')),
  source_kb_ids TEXT[] DEFAULT '{}',
  auto_generated BOOLEAN DEFAULT true,
  quality_score FLOAT DEFAULT 0.0,
  view_count INT DEFAULT 0,
  is_stale BOOLEAN DEFAULT false,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bot_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_bot_id ON wiki_pages(bot_id);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_page_type ON wiki_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_is_stale ON wiki_pages(is_stale);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_embedding ON wiki_pages
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- S5DB2: wiki_lint_logs 테이블 생성
CREATE TABLE IF NOT EXISTS wiki_lint_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT NOT NULL REFERENCES mcw_bots(id) ON DELETE CASCADE,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  orphan_count INT DEFAULT 0,
  stale_count INT DEFAULT 0,
  conflict_count INT DEFAULT 0,
  total_pages INT DEFAULT 0,
  quality_avg FLOAT DEFAULT 0.0,
  fixed_count INT DEFAULT 0,
  summary TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_wiki_lint_logs_bot_id ON wiki_lint_logs(bot_id);
CREATE INDEX IF NOT EXISTS idx_wiki_lint_logs_run_at ON wiki_lint_logs(run_at DESC);

-- S5DB3: match_wiki_pages RPC 함수 생성
CREATE OR REPLACE FUNCTION match_wiki_pages(
  p_bot_id TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  content TEXT,
  page_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.slug,
    w.title,
    w.content,
    w.page_type,
    1 - (w.embedding <=> query_embedding) AS similarity
  FROM wiki_pages w
  WHERE w.bot_id = p_bot_id
    AND w.embedding IS NOT NULL
    AND w.is_stale = false
    AND 1 - (w.embedding <=> query_embedding) >= match_threshold
  ORDER BY w.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_wiki_pages TO anon, authenticated;

-- S5SC1: RLS 정책 설정

-- wiki_pages RLS
ALTER TABLE wiki_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wiki_pages_select" ON wiki_pages;
CREATE POLICY "wiki_pages_select" ON wiki_pages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "wiki_pages_insert" ON wiki_pages;
CREATE POLICY "wiki_pages_insert" ON wiki_pages
  FOR INSERT WITH CHECK (
    bot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "wiki_pages_update" ON wiki_pages;
CREATE POLICY "wiki_pages_update" ON wiki_pages
  FOR UPDATE USING (
    bot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "wiki_pages_delete" ON wiki_pages;
CREATE POLICY "wiki_pages_delete" ON wiki_pages
  FOR DELETE USING (
    bot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );

-- wiki_lint_logs RLS
ALTER TABLE wiki_lint_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wiki_lint_logs_select" ON wiki_lint_logs;
CREATE POLICY "wiki_lint_logs_select" ON wiki_lint_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "wiki_lint_logs_write" ON wiki_lint_logs;
CREATE POLICY "wiki_lint_logs_write" ON wiki_lint_logs
  FOR ALL USING (
    bot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );
