-- Add missing columns to profiles table
-- Required by /api/auth/me/route.ts (notification_enabled, language)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'ko';
