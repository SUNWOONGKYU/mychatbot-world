-- KB embeddings and text entry tables
-- kb_embeddings: pgvector chunks for semantic search (used by /api/kb/embed)
-- mcw_kb_entries: plain-text KB entries (used by /api/kb/text)

-- Requires pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLE: kb_embeddings
-- pgvector chunks — each KB item split into chunks with embeddings
-- ============================================================
CREATE TABLE IF NOT EXISTS kb_embeddings (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    kb_item_id  TEXT        NOT NULL REFERENCES mcw_kb_items(id) ON DELETE CASCADE,
    chunk_index INT         NOT NULL,
    chunk_text  TEXT        NOT NULL,
    token_count INT,
    char_start  INT,
    char_end    INT,
    embedding   vector(1536),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE kb_embeddings ENABLE ROW LEVEL SECURITY;

-- service_role full access (embed API uses service_role key)
CREATE POLICY "kb_embeddings_service_all"
    ON kb_embeddings FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- authenticated read own items via kb_item_id → mcw_kb_items join
CREATE POLICY "kb_embeddings_select_own"
    ON kb_embeddings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM mcw_kb_items k
            JOIN mcw_bots b ON b.id = k.bot_id
            WHERE k.id = kb_item_id
              AND b.owner_id = auth.uid()::text
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kb_embeddings_kb_item_id
    ON kb_embeddings (kb_item_id);

CREATE INDEX IF NOT EXISTS idx_kb_embeddings_embedding
    ON kb_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ============================================================
-- TABLE: mcw_kb_entries
-- Plain-text knowledge base entries (from /api/kb/text)
-- ============================================================
CREATE TABLE IF NOT EXISTS mcw_kb_entries (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bot_id      TEXT        REFERENCES mcw_bots(id) ON DELETE SET NULL,
    title       TEXT        NOT NULL,
    content     TEXT        NOT NULL,
    source_type TEXT        NOT NULL DEFAULT 'text',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE mcw_kb_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mcw_kb_entries_own"
    ON mcw_kb_entries FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcw_kb_entries_user_id
    ON mcw_kb_entries (user_id);

CREATE INDEX IF NOT EXISTS idx_mcw_kb_entries_bot_id
    ON mcw_kb_entries (bot_id)
    WHERE bot_id IS NOT NULL;
