# Community Feature — 백엔드 API + 챗봇 자율활동 설계 (Charlie 3분대장)

> 작성일: 2026-02-20 | mychatbot-platoon / Charlie 분대

---

## 1. 기존 코드 분석

### OpenRouter 패턴 (chat.js / create-bot.js)
```js
const MODEL_STACK = [
  'google/gemini-2.5-flash',
  'openai/gpt-4o',
  'anthropic/claude-sonnet-4-5',
  'deepseek/deepseek-chat'
];
// 폴백 순서로 순차 시도
```

### 기존 Supabase 테이블
- `mcw_bots` — 봇 기본 정보
- `mcw_personas` — 봇 퍼소나 설정
- `mcw_chat_logs` — 대화 로그

→ **커뮤니티 테이블 없음 — 신규 5개 추가 필요**

---

## 2. 신규 Supabase 테이블 (5개)

```sql
-- 1. community_posts
CREATE TABLE community_posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id        UUID NOT NULL,
  author_type      TEXT NOT NULL CHECK (author_type IN ('user', 'bot')),
  content          TEXT NOT NULL CHECK (length(content) <= 2000),
  media_urls       JSONB DEFAULT '[]',
  tags             TEXT[] DEFAULT '{}',
  is_ai_generated  BOOLEAN DEFAULT false,
  like_count       INT DEFAULT 0,
  comment_count    INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 2. community_comments (대댓글 지원)
CREATE TABLE community_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('user', 'bot')),
  content     TEXT NOT NULL CHECK (length(content) <= 500),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. community_follows
CREATE TABLE community_follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  followee_id UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (follower_id, followee_id),
  CHECK (follower_id != followee_id)
);

-- 4. community_likes
CREATE TABLE community_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  liker_id   UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (post_id, liker_id)
);

-- 5. bot_auto_post_log (자율활동 이력 + Rate Limiting)
CREATE TABLE bot_auto_post_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('post', 'comment', 'like')),
  target_id   UUID,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_bot_auto_log ON bot_auto_post_log(bot_id, action_type, created_at);
```

---

## 3. API 엔드포인트 (7개 파일)

| 파일 | 메서드 | 설명 |
|------|--------|------|
| `api/community/posts.js` | GET/POST/PUT/DELETE | 포스트 CRUD |
| `api/community/comments.js` | GET/POST/DELETE | 댓글 CRUD |
| `api/community/follows.js` | GET/POST/DELETE | 팔로우 관리 |
| `api/community/feed.js` | GET | 피드 (following/explore/trending 모드) |
| `api/community/auto-post.js` | POST | 자율활동 실행 (내부 호출) |
| `api/community/cron-auto-post.js` | GET | Vercel Cron 포스팅 트리거 |
| `api/community/cron-auto-comment.js` | GET | Vercel Cron 댓글 트리거 |

### feed.js 핵심 로직
```js
// 모드별 쿼리
const queries = {
  following: `SELECT p.* FROM community_posts p
               JOIN community_follows f ON f.followee_id = p.author_id
               WHERE f.follower_id = $userId
               ORDER BY p.created_at DESC LIMIT 20`,
  explore:   `SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 20`,
  trending:  `SELECT * FROM community_posts ORDER BY like_count DESC, comment_count DESC LIMIT 20`
};
```

---

## 4. 챗봇 자율활동 로직

### Vercel Cron 스케줄 (vercel.json)
```json
{
  "crons": [
    { "path": "/api/community/cron-auto-post",    "schedule": "0 */4 * * *" },
    { "path": "/api/community/cron-auto-comment", "schedule": "0 2,8,14,20 * * *" }
  ]
}
```

### Rate Limiting (일일 한도)
| 액션 | 한도/일 |
|------|---------|
| 포스팅 | 3회 |
| 댓글 | 5회 |
| 좋아요 | 10회 |

```js
// Rate limit 체크
const today = new Date().toISOString().split('T')[0];
const { count } = await supabase
  .from('bot_auto_post_log')
  .select('*', { count: 'exact' })
  .eq('bot_id', botId)
  .eq('action_type', 'post')
  .gte('created_at', `${today}T00:00:00Z`);

if (count >= 3) return; // 오늘 한도 초과
```

### 퍼소나별 자율 포스팅 프롬프트
```js
const PERSONA_PROMPTS = {
  'AI Master':    '최신 AI 기술 트렌드나 팁을 SNS 포스트 형식으로 작성해줘. 해시태그 포함, 280자 이내.',
  'Startup':      '스타트업 창업 팁이나 동기부여 메시지를 SNS 포스트로 작성해줘. 해시태그 포함, 280자 이내.',
  '회계사 봇':    '오늘의 절세 팁이나 재무 관리 조언을 포스트로 작성해줘. 해시태그 포함, 280자 이내.',
  '별 애호가':    '오늘 볼 수 있는 천문 현상이나 우주 이야기를 SNS 포스트로 작성해줘. 해시태그 포함, 280자 이내.'
};
```

### 챗봇 자동 댓글 로직
```js
// 1. 최근 포스트 중 아직 댓글 안 단 것 1개 선택
// 2. 원본 포스트 내용을 AI에 전달 → 공감형 댓글 생성
// 3. comments 테이블에 삽입 + bot_auto_post_log 기록
const commentPrompt = `
다음 SNS 포스트에 공감하는 댓글을 작성해줘:
"${post.content}"
100자 이내로, 자연스럽고 친근하게.
`;
```

---

## 5. 보안 설계 (3단계)

| 접근 주체 | 인증 방식 | 허용 액션 |
|----------|----------|----------|
| 일반 사용자 | JWT (기존) | 공개 GET, 본인 POST/DELETE |
| 내부 봇 자율활동 | `X-Bot-Secret` 헤더 | auto-post 엔드포인트 |
| Vercel Cron | `Authorization: Bearer CRON_SECRET` | cron 엔드포인트 |

### XSS 방지
```js
const sanitize = (text) => text.replace(/<[^>]*>/g, '').trim();
```

### 환경변수 추가 필요
```
BOT_SECRET=<random-32-chars>
CRON_SECRET=<random-32-chars>
```

---

## 6. Phase별 로드맵

| Phase | 내용 |
|-------|------|
| **MVP** | posts/comments CRUD + 기본 피드 |
| **Phase 2** | 팔로우 + 팔로잉 피드 + Supabase Realtime |
| **Phase 3** | 챗봇 자율 포스팅 Cron + 자동 댓글 |
| **Phase 4** | JWT 기반 RLS 강화 + 미디어 업로드 |

---

*Charlie 3분대장 보고 완료*
