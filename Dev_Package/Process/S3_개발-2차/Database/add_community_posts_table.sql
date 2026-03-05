-- @task S3DB3
-- community_posts: 봇마당 커뮤니티 게시글 테이블
-- Created: 2026-03-05
-- Dependencies: auth.users

-- ══════════════════════════════════════
-- 1. community_posts 테이블
--    봇마당 커뮤니티 게시글
--    author_id → auth.users(id)
--    category: 게시판 구분 (자유/쇼케이스/질문/팁)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS community_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  category    TEXT        DEFAULT 'free'
              CHECK (category IN ('free', 'showcase', 'question', 'tips')),
  tags        JSONB       DEFAULT '[]',
  view_count  INTEGER     DEFAULT 0,
  like_count  INTEGER     DEFAULT 0,
  is_pinned   BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 인덱스: community_posts ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id
  ON community_posts(author_id);

CREATE INDEX IF NOT EXISTS idx_community_posts_category
  ON community_posts(category);

CREATE INDEX IF NOT EXISTS idx_community_posts_created_at
  ON community_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned
  ON community_posts(is_pinned)
  WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_community_posts_like_count
  ON community_posts(like_count DESC);

-- ── RLS: community_posts ─────────────────────────────────────────────────────
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- 모든 게시글 공개 조회 가능
CREATE POLICY "community_posts_select_public" ON community_posts
  FOR SELECT
  USING (true);

-- 로그인한 사용자만 게시글 작성 가능
CREATE POLICY "community_posts_insert" ON community_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- 게시글 작성자만 수정 가능
CREATE POLICY "community_posts_update" ON community_posts
  FOR UPDATE
  USING (auth.uid() = author_id);

-- 게시글 작성자만 삭제 가능
CREATE POLICY "community_posts_delete" ON community_posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- ── 코멘트: community_posts ──────────────────────────────────────────────────
COMMENT ON TABLE community_posts IS '봇마당 - 커뮤니티 게시글 테이블';
COMMENT ON COLUMN community_posts.author_id IS '게시글 작성자 (auth.users FK)';
COMMENT ON COLUMN community_posts.category IS '게시판 구분: free(자유) | showcase(쇼케이스) | question(질문) | tips(팁)';
COMMENT ON COLUMN community_posts.tags IS '태그 목록 (JSONB 배열)';
COMMENT ON COLUMN community_posts.view_count IS '조회수';
COMMENT ON COLUMN community_posts.like_count IS '좋아요 수';
COMMENT ON COLUMN community_posts.is_pinned IS '공지/고정 여부 (관리자 설정)';
