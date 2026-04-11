-- Add content, title, is_embedded columns to mcw_kb_items
-- Required by /api/kb/embed/route.ts for text chunking and embedding status tracking

ALTER TABLE mcw_kb_items
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS is_embedded BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_mcw_kb_items_is_embedded
  ON mcw_kb_items (is_embedded)
  WHERE is_embedded = false;
