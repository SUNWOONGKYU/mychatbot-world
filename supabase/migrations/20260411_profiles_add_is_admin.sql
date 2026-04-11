-- Add is_admin flag to profiles table
-- Used by admin-gated API routes (community/report, etc.)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
