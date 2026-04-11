-- @task S4DB3
-- 커뮤니티 테이블 5개 생성 마이그레이션
-- community_posts, community_votes, community_comments, community_bookmarks, bot_reports
-- RLS: 공개 읽기 / 로그인 사용자 작성 / 소유자 수정·삭제
--
-- NOTE: mcw_bots.id 는 text 타입 → bot_id 컬럼도 text (FK 참조 없이 논리적 참조)
--       auth.users.id 는 uuid  → user_id / reporter_id 는 uuid

-- ─────────────────────────────────────────────
-- 1. community_posts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_posts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text NOT NULL CHECK (char_length(title) <= 200),
    content         text NOT NULL CHECK (char_length(content) <= 10000),
    madang          text NOT NULL,
    category        text NOT NULL,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bot_id          text,                    -- mcw_bots.id (text 타입이므로 논리적 참조)
    upvotes         integer NOT NULL DEFAULT 0,
    downvotes       integer NOT NULL DEFAULT 0,
    likes_count     integer NOT NULL DEFAULT 0,
    views_count     integer NOT NULL DEFAULT 0,
    comments_count  integer NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id    ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_bot_id     ON public.community_posts(bot_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_madang     ON public.community_posts(madang);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_upvotes    ON public.community_posts(upvotes DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_select_public"
    ON public.community_posts FOR SELECT
    USING (true);

CREATE POLICY "community_posts_insert_authenticated"
    ON public.community_posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_posts_update_owner"
    ON public.community_posts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "community_posts_delete_owner"
    ON public.community_posts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 2. community_votes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_votes (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type  text NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_votes_post_id ON public.community_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_user_id ON public.community_votes(user_id);

ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_votes_select_public"
    ON public.community_votes FOR SELECT
    USING (true);

CREATE POLICY "community_votes_insert_authenticated"
    ON public.community_votes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_votes_update_owner"
    ON public.community_votes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "community_votes_delete_owner"
    ON public.community_votes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 3. community_comments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_comments (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    parent_id  uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bot_id     text,                         -- mcw_bots.id (text, 논리적 참조)
    content    text NOT NULL CHECK (char_length(content) <= 3000),
    upvotes    integer NOT NULL DEFAULT 0,
    downvotes  integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id    ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id  ON public.community_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id    ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_bot_id     ON public.community_comments(bot_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON public.community_comments(created_at ASC);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_comments_select_public"
    ON public.community_comments FOR SELECT
    USING (true);

CREATE POLICY "community_comments_insert_authenticated"
    ON public.community_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_comments_update_owner"
    ON public.community_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "community_comments_delete_owner"
    ON public.community_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 4. community_bookmarks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_bookmarks (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_bookmarks_user_id ON public.community_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_post_id ON public.community_bookmarks(post_id);

ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_bookmarks_select_owner"
    ON public.community_bookmarks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "community_bookmarks_insert_authenticated"
    ON public.community_bookmarks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_bookmarks_delete_owner"
    ON public.community_bookmarks FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 5. bot_reports
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bot_reports (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id       text NOT NULL,              -- mcw_bots.id (text, 논리적 참조)
    reporter_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason       text NOT NULL CHECK (char_length(reason) <= 500),
    post_id      uuid REFERENCES public.community_posts(id) ON DELETE SET NULL,
    comment_id   uuid REFERENCES public.community_comments(id) ON DELETE SET NULL,
    status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_reports_bot_id      ON public.bot_reports(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_reports_reporter_id ON public.bot_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_bot_reports_status      ON public.bot_reports(status);

ALTER TABLE public.bot_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bot_reports_select_reporter"
    ON public.bot_reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id);

CREATE POLICY "bot_reports_insert_authenticated"
    ON public.bot_reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);
