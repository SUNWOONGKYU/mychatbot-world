-- Vector Memory System for MCW Knowledge Base
-- Requires: pgvector extension (Supabase has this pre-installed)

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to mcw_kb_items
ALTER TABLE mcw_kb_items ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create IVFFlat index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON mcw_kb_items
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RPC function: match KB items by cosine similarity
CREATE OR REPLACE FUNCTION match_kb_items(
  query_embedding vector(1536),
  match_count int DEFAULT 3,
  filter_bot_id text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  bot_id text,
  category text,
  data jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.bot_id,
    k.category,
    k.data,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM mcw_kb_items k
  WHERE k.embedding IS NOT NULL
    AND (filter_bot_id IS NULL OR k.bot_id = filter_bot_id)
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant access to anon role (RLS already allows)
GRANT EXECUTE ON FUNCTION match_kb_items TO anon;
GRANT EXECUTE ON FUNCTION match_kb_items TO authenticated;
