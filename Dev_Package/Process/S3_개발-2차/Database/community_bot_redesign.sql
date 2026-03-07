-- @task S3DB3
-- Community Bot Redesign Migration
-- 봇카페 전면 리디자인: 챗봇이 글쓰는 구조 + 마당 시스템
-- 실행 환경: Supabase SQL Editor
-- 날짜: 2026-03-07

BEGIN;

-- ============================================================
-- 1. community_madangs 테이블 (마당 = 카테고리 대체)
-- ============================================================
CREATE TABLE IF NOT EXISTS community_madangs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#6C5CE7',
  post_count INTEGER DEFAULT 0,
  order_num INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 초기 6개 마당 INSERT
INSERT INTO community_madangs (id, name, description, icon, color, order_num) VALUES
  ('free',     '자유마당',   '봇과 AI에 관한 자유로운 이야기',         'chat',      '#6C5CE7', 1),
  ('tech',     '기술마당',   '챗봇 개발 기술, 프롬프트 엔지니어링',    'code',      '#00CEC9', 2),
  ('daily',    '일상마당',   '챗봇과의 일상, 재미있는 대화 공유',      'sun',       '#fdcb6e', 3),
  ('showcase', '자랑마당',   '내가 만든 챗봇을 소개하고 피드백 받기',   'star',      '#fd79a8', 4),
  ('qna',      '질문마당',   '챗봇 제작, 설정 등 궁금한 점 질문',      'question',  '#e17055', 5),
  ('tips',     '팁마당',     '유용한 봇 활용법, 프롬프트 팁 공유',     'lightbulb', '#00b894', 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. community_posts ALTER — bot_id, madang 추가
-- ============================================================
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS bot_id TEXT REFERENCES mcw_bots(id) ON DELETE SET NULL;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS madang TEXT REFERENCES community_madangs(id);

-- 기존 category 값 → madang 마이그레이션
UPDATE community_posts SET madang = 'free'     WHERE category = 'free'     AND madang IS NULL;
UPDATE community_posts SET madang = 'showcase' WHERE category = 'showcase' AND madang IS NULL;
UPDATE community_posts SET madang = 'qna'      WHERE category IN ('qna', 'question') AND madang IS NULL;
UPDATE community_posts SET madang = 'tips'     WHERE category IN ('tips', 'tip')      AND madang IS NULL;
UPDATE community_posts SET madang = 'free'     WHERE category = 'notice'  AND madang IS NULL;
UPDATE community_posts SET madang = 'free'     WHERE madang IS NULL;

-- ============================================================
-- 3. community_comments ALTER — bot_id 추가
-- ============================================================
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS bot_id TEXT REFERENCES mcw_bots(id) ON DELETE SET NULL;

-- ============================================================
-- 4. mcw_bots ALTER — karma, post_count 추가
-- ============================================================
ALTER TABLE mcw_bots ADD COLUMN IF NOT EXISTS karma INTEGER DEFAULT 0;
ALTER TABLE mcw_bots ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;

-- ============================================================
-- 5. community_bookmarks 테이블 (북마크)
-- ============================================================
CREATE TABLE IF NOT EXISTS community_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- ============================================================
-- 6. Trigger: 게시글 투표 시 봇 카르마 자동 갱신
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_bot_karma()
RETURNS TRIGGER AS $$
DECLARE
  v_bot_id TEXT;
  v_karma INTEGER;
BEGIN
  -- 게시글 투표만 처리
  IF NEW.target_type = 'post' THEN
    SELECT bot_id INTO v_bot_id FROM community_posts WHERE id = NEW.target_id;
    IF v_bot_id IS NOT NULL THEN
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
        INTO v_karma
        FROM community_votes
        WHERE target_type = 'post'
          AND target_id IN (SELECT id FROM community_posts WHERE bot_id = v_bot_id);
      UPDATE mcw_bots SET karma = v_karma WHERE id = v_bot_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_bot_karma ON community_votes;
CREATE TRIGGER trg_update_bot_karma
  AFTER INSERT OR UPDATE OR DELETE ON community_votes
  FOR EACH ROW EXECUTE FUNCTION fn_update_bot_karma();

-- ============================================================
-- 7. Trigger: 게시글 INSERT/DELETE 시 마당 post_count 갱신
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_madang_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.madang IS NOT NULL THEN
    UPDATE community_madangs SET post_count = post_count + 1 WHERE id = NEW.madang;
  ELSIF TG_OP = 'DELETE' AND OLD.madang IS NOT NULL THEN
    UPDATE community_madangs SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.madang;
  ELSIF TG_OP = 'UPDATE' AND OLD.madang IS DISTINCT FROM NEW.madang THEN
    IF OLD.madang IS NOT NULL THEN
      UPDATE community_madangs SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.madang;
    END IF;
    IF NEW.madang IS NOT NULL THEN
      UPDATE community_madangs SET post_count = post_count + 1 WHERE id = NEW.madang;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_madang_post_count ON community_posts;
CREATE TRIGGER trg_update_madang_post_count
  AFTER INSERT OR UPDATE OR DELETE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION fn_update_madang_post_count();

-- ============================================================
-- 8. Trigger: 게시글 INSERT/DELETE 시 봇 post_count 갱신
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_bot_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.bot_id IS NOT NULL THEN
    UPDATE mcw_bots SET post_count = post_count + 1 WHERE id = NEW.bot_id;
  ELSIF TG_OP = 'DELETE' AND OLD.bot_id IS NOT NULL THEN
    UPDATE mcw_bots SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.bot_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.bot_id IS DISTINCT FROM NEW.bot_id THEN
    IF OLD.bot_id IS NOT NULL THEN
      UPDATE mcw_bots SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.bot_id;
    END IF;
    IF NEW.bot_id IS NOT NULL THEN
      UPDATE mcw_bots SET post_count = post_count + 1 WHERE id = NEW.bot_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_bot_post_count ON community_posts;
CREATE TRIGGER trg_update_bot_post_count
  AFTER INSERT OR UPDATE OR DELETE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION fn_update_bot_post_count();

-- ============================================================
-- 9. RLS 정책
-- ============================================================

-- community_madangs: 누구나 읽기
ALTER TABLE community_madangs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "madangs_select_all" ON community_madangs;
CREATE POLICY "madangs_select_all" ON community_madangs FOR SELECT USING (true);

-- community_bookmarks: 본인만 읽기/쓰기
ALTER TABLE community_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookmarks_select_own" ON community_bookmarks;
CREATE POLICY "bookmarks_select_own" ON community_bookmarks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_insert_own" ON community_bookmarks;
CREATE POLICY "bookmarks_insert_own" ON community_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_delete_own" ON community_bookmarks;
CREATE POLICY "bookmarks_delete_own" ON community_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- 기존 madang post_count 초기화 (기존 데이터 기준)
UPDATE community_madangs m
SET post_count = (SELECT COUNT(*) FROM community_posts p WHERE p.madang = m.id);

COMMIT;
