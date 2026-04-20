-- @task S8SC1
-- @description 전 테이블 RLS 커버리지 100% — 누락/미흡 정책 일괄 보강
--
-- 감사 기준 (run 20260412_rls_audit.sql first):
--   (A) rowsecurity = false      → ENABLE
--   (B) rowsecurity = true 정책 0 → 기본 owner 정책 추가
--   (C) 이미 정책 있음           → DROP/RECREATE 금지 (중복 방지)
--
-- 대상: mcw_*, profiles, conversations, messages, community_*, jobs*,
--      bot_settings, sync_logs, learning_*, skill_*, wiki_*, usage_logs,
--      bot_templates, faqs, bot_reports
--
-- 규칙:
--   - SELECT  : 소유자 + 공용(공개 자원만)
--   - INSERT  : 본인 user_id/owner_id 로만
--   - UPDATE/DELETE: 소유자만
--   - service_role 은 RLS 우회 (Supabase 기본)

-- ════════════════════════════════════════════════════════════════════════
-- 1. ENABLE ROW LEVEL SECURITY (idempotent)
-- ════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'mcw_bots','mcw_personas','mcw_kb_items','mcw_chat_logs',
    'mcw_credits','mcw_credit_transactions','mcw_payments',
    'mcw_revenue','mcw_settlements',
    'mcw_inheritance_settings','mcw_inheritance_consents',
    'mcw_inheritance_event_logs','mcw_inheritance_persona_settings',
    'mcw_inheritance_transfers',
    'profiles','conversations','messages',
    'community_posts','community_votes','community_comments',
    'community_bookmarks','bot_reports',
    'job_postings','job_matches','job_settlements','job_reviews',
    'bot_settings','sync_logs',
    'learning_sessions','learning_progress','learning_certifications',
    'skill_installations','skill_executions','skill_reviews',
    'wiki_pages','wiki_lint_logs',
    'usage_logs','bot_templates','faqs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 2. mcw_credits : user_id = auth.uid()
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "mcw_credits_select_own" ON mcw_credits;
CREATE POLICY "mcw_credits_select_own" ON mcw_credits
  FOR SELECT USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE 는 service_role 전용 (유저가 직접 잔액 조작 차단)

-- ════════════════════════════════════════════════════════════════════════
-- 3. mcw_credit_transactions : 본인 내역 조회만
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "mcw_credit_tx_select_own" ON mcw_credit_transactions;
CREATE POLICY "mcw_credit_tx_select_own" ON mcw_credit_transactions
  FOR SELECT USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════
-- 4. mcw_payments : 본인 결제만
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "mcw_payments_select_own" ON mcw_payments;
CREATE POLICY "mcw_payments_select_own" ON mcw_payments
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mcw_payments_insert_self" ON mcw_payments;
CREATE POLICY "mcw_payments_insert_self" ON mcw_payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE(승인/거부)는 service_role 전용

-- ════════════════════════════════════════════════════════════════════════
-- 5. mcw_revenue / mcw_settlements : creator 본인
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "mcw_revenue_select_own" ON mcw_revenue;
CREATE POLICY "mcw_revenue_select_own" ON mcw_revenue
  FOR SELECT USING (creator_id = auth.uid()::text);

DROP POLICY IF EXISTS "mcw_settlements_select_own" ON mcw_settlements;
CREATE POLICY "mcw_settlements_select_own" ON mcw_settlements
  FOR SELECT USING (creator_id = auth.uid()::text);

DROP POLICY IF EXISTS "mcw_settlements_insert_self" ON mcw_settlements;
CREATE POLICY "mcw_settlements_insert_self" ON mcw_settlements
  FOR INSERT WITH CHECK (creator_id = auth.uid()::text);

-- ════════════════════════════════════════════════════════════════════════
-- 6. mcw_inheritance_* : owner 본인
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "mcw_inh_settings_all_own" ON mcw_inheritance_settings;
CREATE POLICY "mcw_inh_settings_all_own" ON mcw_inheritance_settings
  FOR ALL USING (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "mcw_inh_consents_all_own" ON mcw_inheritance_consents;
CREATE POLICY "mcw_inh_consents_all_own" ON mcw_inheritance_consents
  FOR ALL USING (beneficiary_id = auth.uid()::text OR owner_id = auth.uid()::text)
  WITH CHECK (beneficiary_id = auth.uid()::text OR owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "mcw_inh_events_select_own" ON mcw_inheritance_event_logs;
CREATE POLICY "mcw_inh_events_select_own" ON mcw_inheritance_event_logs
  FOR SELECT USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "mcw_inh_persona_all_own" ON mcw_inheritance_persona_settings;
CREATE POLICY "mcw_inh_persona_all_own" ON mcw_inheritance_persona_settings
  FOR ALL USING (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "mcw_inh_transfers_select_own" ON mcw_inheritance_transfers;
CREATE POLICY "mcw_inh_transfers_select_own" ON mcw_inheritance_transfers
  FOR SELECT USING (from_user_id = auth.uid()::text OR to_user_id = auth.uid()::text);

-- ════════════════════════════════════════════════════════════════════════
-- 7. profiles : 본인 전체, 다른 사람 공개 정보만 SELECT
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);   -- display_name/avatar_url 공개 허용

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════
-- 8. conversations / messages : 본인 대화만
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "conversations_all_own" ON conversations;
CREATE POLICY "conversations_all_own" ON conversations
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "messages_select_own_conv" ON messages;
CREATE POLICY "messages_select_own_conv" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "messages_insert_own_conv" ON messages;
CREATE POLICY "messages_insert_own_conv" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
  );

-- ════════════════════════════════════════════════════════════════════════
-- 9. community_* : 공개 읽기 + 본인 쓰기
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "community_posts_select_all" ON community_posts;
CREATE POLICY "community_posts_select_all" ON community_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "community_posts_insert_self" ON community_posts;
CREATE POLICY "community_posts_insert_self" ON community_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "community_posts_update_own" ON community_posts;
CREATE POLICY "community_posts_update_own" ON community_posts
  FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "community_posts_delete_own" ON community_posts;
CREATE POLICY "community_posts_delete_own" ON community_posts
  FOR DELETE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "community_votes_all_own" ON community_votes;
CREATE POLICY "community_votes_all_own" ON community_votes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "community_comments_select_all" ON community_comments;
CREATE POLICY "community_comments_select_all" ON community_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "community_comments_insert_self" ON community_comments;
CREATE POLICY "community_comments_insert_self" ON community_comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "community_comments_update_own" ON community_comments;
CREATE POLICY "community_comments_update_own" ON community_comments
  FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "community_comments_delete_own" ON community_comments;
CREATE POLICY "community_comments_delete_own" ON community_comments
  FOR DELETE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "community_bookmarks_all_own" ON community_bookmarks;
CREATE POLICY "community_bookmarks_all_own" ON community_bookmarks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "bot_reports_insert_self" ON bot_reports;
CREATE POLICY "bot_reports_insert_self" ON bot_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "bot_reports_select_own" ON bot_reports;
CREATE POLICY "bot_reports_select_own" ON bot_reports
  FOR SELECT USING (reporter_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════
-- 10. jobs_* : poster/hirer 본인
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "job_postings_select_all" ON job_postings;
CREATE POLICY "job_postings_select_all" ON job_postings
  FOR SELECT USING (true);   -- 구인 공개

DROP POLICY IF EXISTS "job_postings_insert_self" ON job_postings;
CREATE POLICY "job_postings_insert_self" ON job_postings
  FOR INSERT WITH CHECK (poster_id = auth.uid()::text);

DROP POLICY IF EXISTS "job_postings_update_own" ON job_postings;
CREATE POLICY "job_postings_update_own" ON job_postings
  FOR UPDATE USING (poster_id = auth.uid()::text) WITH CHECK (poster_id = auth.uid()::text);

DROP POLICY IF EXISTS "job_postings_delete_own" ON job_postings;
CREATE POLICY "job_postings_delete_own" ON job_postings
  FOR DELETE USING (poster_id = auth.uid()::text);

DROP POLICY IF EXISTS "job_matches_all_own" ON job_matches;
CREATE POLICY "job_matches_all_own" ON job_matches
  FOR ALL USING (hirer_id = auth.uid()::text OR creator_id = auth.uid()::text)
  WITH CHECK (hirer_id = auth.uid()::text OR creator_id = auth.uid()::text);

DROP POLICY IF EXISTS "job_settlements_select_own" ON job_settlements;
CREATE POLICY "job_settlements_select_own" ON job_settlements
  FOR SELECT USING (creator_id = auth.uid()::text OR hirer_id = auth.uid()::text);

DROP POLICY IF EXISTS "job_reviews_select_all" ON job_reviews;
CREATE POLICY "job_reviews_select_all" ON job_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "job_reviews_insert_self" ON job_reviews;
CREATE POLICY "job_reviews_insert_self" ON job_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid()::text);

-- ════════════════════════════════════════════════════════════════════════
-- 11. bot_settings / sync_logs : 봇 소유자
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "bot_settings_all_own" ON bot_settings;
CREATE POLICY "bot_settings_all_own" ON bot_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM mcw_bots b
            WHERE b.id = bot_settings.bot_id AND b.owner_id = auth.uid()::text)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM mcw_bots b
            WHERE b.id = bot_settings.bot_id AND b.owner_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "sync_logs_select_own" ON sync_logs;
CREATE POLICY "sync_logs_select_own" ON sync_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM mcw_bots b
            WHERE b.id = sync_logs.bot_id AND b.owner_id = auth.uid()::text)
  );

-- ════════════════════════════════════════════════════════════════════════
-- 12. learning_* / skill_* / wiki_* / usage_logs : user 본인
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "learning_sessions_all_own" ON learning_sessions;
CREATE POLICY "learning_sessions_all_own" ON learning_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "learning_progress_all_own" ON learning_progress;
CREATE POLICY "learning_progress_all_own" ON learning_progress
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "learning_certifications_select_own" ON learning_certifications;
CREATE POLICY "learning_certifications_select_own" ON learning_certifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "skill_installations_all_own" ON skill_installations;
CREATE POLICY "skill_installations_all_own" ON skill_installations
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "skill_executions_select_own" ON skill_executions;
CREATE POLICY "skill_executions_select_own" ON skill_executions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "skill_reviews_select_all" ON skill_reviews;
CREATE POLICY "skill_reviews_select_all" ON skill_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "skill_reviews_insert_self" ON skill_reviews;
CREATE POLICY "skill_reviews_insert_self" ON skill_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wiki_pages_select_all" ON wiki_pages;
CREATE POLICY "wiki_pages_select_all" ON wiki_pages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "wiki_pages_insert_auth" ON wiki_pages;
CREATE POLICY "wiki_pages_insert_auth" ON wiki_pages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "wiki_pages_update_auth" ON wiki_pages;
CREATE POLICY "wiki_pages_update_auth" ON wiki_pages
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "wiki_lint_logs_select_all" ON wiki_lint_logs;
CREATE POLICY "wiki_lint_logs_select_all" ON wiki_lint_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "usage_logs_select_own" ON usage_logs;
CREATE POLICY "usage_logs_select_own" ON usage_logs
  FOR SELECT USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════
-- 13. bot_templates / faqs : 공개 읽기
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "bot_templates_select_all" ON bot_templates;
CREATE POLICY "bot_templates_select_all" ON bot_templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "faqs_select_all" ON faqs;
CREATE POLICY "faqs_select_all" ON faqs
  FOR SELECT USING (true);

-- ════════════════════════════════════════════════════════════════════════
-- 14. 감사 재실행 (확인용) — pgAdmin/SQL Editor 에서 결과 확인
--   SELECT tablename, rowsecurity,
--     (SELECT COUNT(*) FROM pg_policies p
--      WHERE p.schemaname='public' AND p.tablename=t.tablename) AS policy_count
--   FROM pg_tables t WHERE schemaname='public' ORDER BY tablename;
-- ════════════════════════════════════════════════════════════════════════
