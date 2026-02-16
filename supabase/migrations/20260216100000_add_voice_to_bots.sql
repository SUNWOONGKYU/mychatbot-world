-- Add voice column to mcw_bots table
-- TTS voice selection per bot (OpenAI TTS-1 voices)
ALTER TABLE mcw_bots ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'fable';
