-- Add upload/file metadata columns to mcw_kb_items
-- Required by /api/kb/route.ts and /api/kb/upload/route.ts

ALTER TABLE mcw_kb_items
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS source_url  TEXT,
  ADD COLUMN IF NOT EXISTS file_name   TEXT,
  ADD COLUMN IF NOT EXISTS char_count  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chunk_count INT NOT NULL DEFAULT 0;
