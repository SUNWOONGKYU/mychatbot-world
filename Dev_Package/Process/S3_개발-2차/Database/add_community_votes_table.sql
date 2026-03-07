-- @task S3DB3
-- community_votes: 게시글/댓글 업보트·다운보트 테이블
-- Created: 2026-03-07
-- Dependencies: community_posts, community_comments, auth.users
-- Replaces: community_post_likes (단순 좋아요 → 업보트/다운보트)

-- ══════════════════════════════════════
-- 1. community_votes 테이블
--    게시글과 댓글의 업보트/다운보트 투표
--    target_type: 'post' 또는 'comment'
--    target_id: 게시글 또는 댓글의 UUID
--    vote_type: 'up' 또는 'down'
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS community_votes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT        NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id   UUID        NOT NULL,
  vote_type   TEXT        NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ── 인덱스: community_votes ────────────────────────────────────────────────
-- 특정 대상의 투표 조회용
CREATE INDEX IF NOT EXISTS idx_community_votes_target
  ON community_votes(target_type, target_id);

-- 사용자별 투표 조회용
CREATE INDEX IF NOT EXISTS idx_community_votes_user_id
  ON community_votes(user_id);

-- ── RLS: community_votes ───────────────────────────────────────────────────
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;

-- 모든 투표 공개 조회 (집계용)
CREATE POLICY "community_votes_select_public" ON community_votes
  FOR SELECT
  USING (true);

-- 로그인한 사용자만 투표 가능
CREATE POLICY "community_votes_insert" ON community_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 투표만 수정 가능
CREATE POLICY "community_votes_update" ON community_votes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 투표만 삭제 가능
CREATE POLICY "community_votes_delete" ON community_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ── 코멘트: community_votes ───────────────────────────────────────────────
COMMENT ON TABLE community_votes IS '봇카페 - 게시글/댓글 업보트·다운보트 투표 테이블';
COMMENT ON COLUMN community_votes.user_id IS '투표한 사용자 (auth.users FK)';
COMMENT ON COLUMN community_votes.target_type IS '대상 유형: post | comment';
COMMENT ON COLUMN community_votes.target_id IS '대상 ID (community_posts.id 또는 community_comments.id)';
COMMENT ON COLUMN community_votes.vote_type IS '투표 유형: up(추천) | down(비추천)';

-- ══════════════════════════════════════
-- 2. community_posts에 upvotes/downvotes 컬럼 추가
-- ══════════════════════════════════════
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS upvotes   INTEGER DEFAULT 0;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- ══════════════════════════════════════
-- 3. community_comments에 upvotes/downvotes 컬럼 추가
-- ══════════════════════════════════════
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS upvotes   INTEGER DEFAULT 0;
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;
