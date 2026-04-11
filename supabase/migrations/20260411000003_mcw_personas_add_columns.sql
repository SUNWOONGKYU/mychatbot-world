-- Add personality and tone columns to mcw_personas
-- Required by persona-loader.ts for system prompt generation

ALTER TABLE mcw_personas
  ADD COLUMN IF NOT EXISTS personality TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tone TEXT NOT NULL DEFAULT 'friendly';
