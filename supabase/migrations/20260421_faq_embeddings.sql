-- ============================================================
-- S5DB4: FAQ 임베딩 + match_faqs RPC (FAQ 캐스케이드 추가)
-- Created: 2026-04-21
--
-- 목적: 챗 RAG 캐스케이드의 3단계로 FAQ 의미 검색 추가
--   wiki → kb → FAQ → AI 자유 답변
--
-- 변경:
--   1. faqs.embedding vector(1536) 컬럼 추가
--   2. ivfflat 인덱스 (vector_cosine_ops)
--   3. match_faqs RPC 함수 (bot_id 필터, 임계값/탑K 파라미터)
-- ============================================================

-- 1. embedding 컬럼 추가
ALTER TABLE faqs
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 2. 벡터 인덱스 (코사인 거리)
CREATE INDEX IF NOT EXISTS idx_faqs_embedding
  ON faqs
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 3. match_faqs RPC: 봇별 임베딩 유사도 검색
CREATE OR REPLACE FUNCTION match_faqs(
  p_bot_id TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 2
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM faqs f
  WHERE f.chatbot_id = p_bot_id
    AND f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) >= match_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_faqs TO anon, authenticated;
