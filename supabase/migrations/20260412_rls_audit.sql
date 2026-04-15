-- =============================================================================
-- @task S5DB2
-- @description RLS 감사 스크립트 — 전체 테이블 RLS 활성화·정책 현황 조회
-- 실행 대상: Supabase SQL Editor (service_role 권한 필요)
-- =============================================================================

-- ── 1. RLS 활성화 여부 전체 조회 ─────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  CASE WHEN rowsecurity THEN '✅ 활성화' ELSE '🚨 비활성화' END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled ASC, tablename;


-- ── 2. 정책 없이 RLS가 비활성화된 테이블 (위험 목록) ─────────────────────────
SELECT
  t.tablename AS "위험_테이블",
  '❌ RLS 비활성화 — 전체 접근 가능' AS "위험_사유"
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND NOT t.rowsecurity
ORDER BY t.tablename;


-- ── 3. RLS 활성화됐으나 정책이 없는 테이블 (접근 차단 — 의도적인지 확인 필요) ──
SELECT
  t.tablename AS "주의_테이블",
  '⚠️ RLS 활성화 + 정책 없음 — 모든 접근 차단됨' AS "주의_사유"
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = t.tablename
  )
ORDER BY t.tablename;


-- ── 4. 전체 RLS 정책 목록 ────────────────────────────────────────────────────
SELECT
  tablename AS "테이블",
  policyname AS "정책명",
  cmd AS "대상_작업",
  permissive AS "허용_여부",
  roles AS "적용_롤",
  qual AS "조건_using",
  with_check AS "조건_with_check"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- ── 5. auth.users 직접 접근 함수 감사 (SECURITY DEFINER 함수 목록) ───────────
SELECT
  routine_name AS "함수명",
  routine_type AS "유형",
  security_type AS "보안_유형",
  CASE WHEN security_type = 'DEFINER'
    THEN '⚠️ SECURITY DEFINER — 권한 확인 필요'
    ELSE '✅ SECURITY INVOKER'
  END AS "감사_결과"
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY security_type DESC, routine_name;


-- ── 6. 핵심 테이블 RLS 상태 요약 (mcw_* + profiles + chatbots) ───────────────
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) FROM pg_policies p
   WHERE p.schemaname = 'public' AND p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'chatbots', 'conversations', 'messages',
    'mcw_bots', 'mcw_credits', 'mcw_chat_logs',
    'admin_audit_logs', 'wiki_pages', 'kb_embeddings'
  )
ORDER BY rls_enabled DESC, policy_count DESC, tablename;
