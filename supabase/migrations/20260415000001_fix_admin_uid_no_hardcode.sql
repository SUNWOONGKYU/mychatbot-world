-- ══════════════════════════════════════
-- mcw_admin_uid() — 하드코딩 이메일 제거
-- profiles.is_admin = true 기반으로 변경
-- ══════════════════════════════════════
CREATE OR REPLACE FUNCTION mcw_admin_uid()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id::text FROM auth.users
  WHERE id IN (SELECT id FROM profiles WHERE is_admin = true)
  LIMIT 1;
$$;
