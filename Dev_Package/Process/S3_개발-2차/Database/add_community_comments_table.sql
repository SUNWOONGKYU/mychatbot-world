-- @task S3DB3
-- community_comments: 봇마당 게시글 댓글 테이블
-- Created: 2026-03-05
-- Dependencies: community_posts, auth.users

-- ══════════════════════════════════════
-- 1. community_comments 테이블
--    봇마당 게시글의 댓글 및 대댓글
--    post_id → community_posts(id)
--    author_id → auth.users(id)
--    parent_id → community_comments(id) (대댓글, nullable)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS community_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   UUID        REFERENCES community_comments(id) ON DELETE CASCADE,  -- 대댓글 (nullable)
  content     TEXT        NOT NULL,
  like_count  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 인덱스: community_comments ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id
  ON community_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_community_comments_author_id
  ON community_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id
  ON community_comments(parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_community_comments_created_at
  ON community_comments(created_at ASC);

-- ── RLS: community_comments ──────────────────────────────────────────────────
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- 모든 댓글 공개 조회 가능
CREATE POLICY "community_comments_select_public" ON community_comments
  FOR SELECT
  USING (true);

-- 로그인한 사용자만 댓글 작성 가능
CREATE POLICY "community_comments_insert" ON community_comments
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- 댓글 작성자만 수정 가능
CREATE POLICY "community_comments_update" ON community_comments
  FOR UPDATE
  USING (auth.uid() = author_id);

-- 댓글 작성자만 삭제 가능
CREATE POLICY "community_comments_delete" ON community_comments
  FOR DELETE
  USING (auth.uid() = author_id);

-- ── 코멘트: community_comments ───────────────────────────────────────────────
COMMENT ON TABLE community_comments IS '봇마당 - 게시글 댓글/대댓글 테이블';
COMMENT ON COLUMN community_comments.post_id IS '댓글이 달린 게시글 (community_posts FK)';
COMMENT ON COLUMN community_comments.author_id IS '댓글 작성자 (auth.users FK)';
COMMENT ON COLUMN community_comments.parent_id IS '부모 댓글 ID (대댓글인 경우, community_comments self FK, nullable)';
COMMENT ON COLUMN community_comments.content IS '댓글 내용';
COMMENT ON COLUMN community_comments.like_count IS '댓글 좋아요 수';
