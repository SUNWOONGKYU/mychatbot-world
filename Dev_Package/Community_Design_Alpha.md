# Community Feature — DB/API 설계 (Alpha 1분대장)

> 작성일: 2026-02-20 | mychatbot-platoon / Alpha 분대

---

## 1. 기존 구조 분석

### 기술 스택
- **프론트엔드**: Vanilla HTML/CSS/JS (프레임워크 없음)
- **백엔드**: Vercel Serverless Functions (Node.js ESM)
- **DB**: Supabase (`@supabase/supabase-js ^2.39.0`) + PostgreSQL 15+
- **AI**: OpenRouter 멀티모델 폴백 (Gemini 2.5 Flash → GPT-4o → Claude → DeepSeek)

### 기존 `/api/` 엔드포인트 (7개)

| 파일 | 메서드 | 경로 |
|------|--------|------|
| `chat.js` | POST | `/api/chat` |
| `create-bot.js` | POST | `/api/create-bot` |
| `tts.js` | POST | `/api/tts` |
| `stt.js` | POST | `/api/stt` |
| `telegram.js` | POST | `/api/telegram` |
| `cpc-process.js` | POST | `/api/cpc-process` |
| `health.js` | GET | `/api/health` |

### 기존 `/pages/` (7개)
login, signup, reset-password, cleanup, home, create, bot

### 기존 DB 테이블 (sql/schema.sql)
users, chatbot_personas, conversations, messages, user_preferences
→ **커뮤니티 테이블 없음 — 신규 4개 추가 필요**

---

## 2. Supabase 신규 테이블 스키마 (SQL DDL)

```sql
-- 1. posts 테이블
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_type   TEXT NOT NULL CHECK (author_type IN ('user', 'bot')),
  author_id     UUID NOT NULL,              -- users.id 또는 chatbot_personas.id
  content       TEXT NOT NULL,
  media_urls    JSONB DEFAULT '[]',         -- 이미지/영상 URL 배열
  tags          TEXT[] DEFAULT '{}',
  visibility    TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  like_count    INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  repost_count  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. comments 테이블 (1단계 대댓글 지원)
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글
  author_type TEXT NOT NULL CHECK (author_type IN ('user', 'bot')),
  author_id   UUID NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. follows 테이블
CREATE TABLE follows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id     UUID NOT NULL,
  follower_type   TEXT NOT NULL CHECK (follower_type IN ('user', 'bot')),
  following_id    UUID NOT NULL,
  following_type  TEXT NOT NULL CHECK (following_type IN ('user', 'bot')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 4. reactions 테이블 (6종 이모지)
CREATE TABLE reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type   TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id     UUID NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like','love','laugh','wow','sad','angry')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (target_type, target_id, user_id)  -- 유저당 1개 리액션
);

-- DB Trigger: comment_count 자동 동기화
CREATE OR REPLACE FUNCTION sync_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION sync_comment_count();

-- RLS 정책
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- public 포스트는 누구나 조회
CREATE POLICY "public posts readable" ON posts FOR SELECT USING (visibility = 'public');
-- 작성자만 수정/삭제
CREATE POLICY "author can modify post" ON posts FOR ALL USING (author_id = auth.uid());
```

---

## 3. 신규 API 엔드포인트 목록 (12개)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/community/posts` | 피드 조회 (커서 기반 페이지네이션) |
| POST | `/api/community/posts` | 포스트 작성 |
| GET | `/api/community/posts/:postId` | 포스트 상세 조회 |
| PATCH | `/api/community/posts/:postId` | 포스트 수정 |
| DELETE | `/api/community/posts/:postId` | 포스트 삭제 |
| GET | `/api/community/posts/:postId/comments` | 댓글 목록 |
| POST | `/api/community/posts/:postId/comments` | 댓글 작성 |
| DELETE | `/api/community/comments/:commentId` | 댓글 삭제 |
| POST | `/api/community/follows` | 팔로우 |
| DELETE | `/api/community/follows` | 언팔로우 |
| GET | `/api/community/feed/following` | 팔로잉 피드 |
| POST/DELETE | `/api/community/reactions` | 리액션 추가/취소 |

---

## 4. 기술적 고려사항

- **페이지네이션**: 커서 기반 (`WHERE created_at < :cursor`) — 피드 중복/누락 방지
- **실시간**: Supabase Realtime으로 `posts` 테이블 INSERT 이벤트 구독
- **미디어**: Supabase Storage Signed URL 패턴 사용
- **인증**: 기존 JWT 패턴 유지, RLS로 데이터 격리
- **캐시 카운터**: DB Trigger로 자동 동기화 (like_count, comment_count)

---

*Alpha 1분대장 보고 완료*
