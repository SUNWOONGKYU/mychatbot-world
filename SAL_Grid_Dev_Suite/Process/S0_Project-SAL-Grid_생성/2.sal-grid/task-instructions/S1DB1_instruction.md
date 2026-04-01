# Task Instruction - S1DB1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## Task ID
S1DB1

## Task Name
기본 DB 스키마 (소급)

## Task Goal
My Chatbot World 서비스의 핵심 테이블 스키마가 Supabase에 적용된 상태를 문서화한다. 이 Task는 이미 구현 완료되어 소급 등록된 항목이다. 기존 스키마를 확인하고 마이그레이션 파일로 정리한다.

## Prerequisites (Dependencies)
- S1BI2 (Supabase 클라이언트 + 환경변수 설정) — 소급 완료된 상태

## Specific Instructions

### 1. 기존 구현 내용 확인 (소급)
아래 테이블들이 Supabase에 실제로 생성되어 있는지 확인한다:

```
mcw_bots          ← 챗봇 정보
mcw_personas      ← 봇 페르소나 설정
mcw_kb_items      ← 지식 베이스 항목
mcw_chat_logs     ← 대화 로그
usage_logs        ← API 사용량 로그
bot_templates     ← 봇 템플릿
```

### 2. 마이그레이션 파일 작성 (sql/schema.sql 또는 supabase/migrations/)

```sql
-- @task S1DB1
-- My Chatbot World 기본 스키마

-- =====================================
-- 챗봇 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_bots (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  persona_id   UUID,
  is_public    BOOLEAN DEFAULT false,
  is_active    BOOLEAN DEFAULT true,
  template_id  UUID,
  settings     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- 페르소나 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_personas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  system_prompt   TEXT NOT NULL,
  tone            TEXT DEFAULT 'friendly',
  language        TEXT DEFAULT 'ko',
  is_public       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- 지식 베이스 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_kb_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id      UUID REFERENCES mcw_bots(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  source_url  TEXT,
  file_type   TEXT,
  embedding   VECTOR(1536),
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- 대화 로그 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_chat_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id       UUID REFERENCES mcw_bots(id) ON DELETE CASCADE,
  session_id   TEXT NOT NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  tokens_used  INTEGER DEFAULT 0,
  model_used   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- API 사용량 로그 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS usage_logs (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id         UUID REFERENCES mcw_bots(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  tokens_used    INTEGER DEFAULT 0,
  credits_used   NUMERIC(10, 4) DEFAULT 0,
  model_used     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- 봇 템플릿 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS bot_templates (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL,
  system_prompt    TEXT NOT NULL,
  default_settings JSONB DEFAULT '{}',
  icon_url         TEXT,
  is_featured      BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. RLS 정책 적용

```sql
-- mcw_bots RLS
ALTER TABLE mcw_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bots_select_own" ON mcw_bots
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "bots_insert_own" ON mcw_bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bots_update_own" ON mcw_bots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bots_delete_own" ON mcw_bots
  FOR DELETE USING (auth.uid() = user_id);

-- mcw_personas RLS (동일 패턴)
ALTER TABLE mcw_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personas_select_own" ON mcw_personas
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "personas_insert_own" ON mcw_personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personas_update_own" ON mcw_personas
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "personas_delete_own" ON mcw_personas
  FOR DELETE USING (auth.uid() = user_id);

-- mcw_kb_items RLS
ALTER TABLE mcw_kb_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_select_own" ON mcw_kb_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "kb_insert_own" ON mcw_kb_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kb_update_own" ON mcw_kb_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "kb_delete_own" ON mcw_kb_items
  FOR DELETE USING (auth.uid() = user_id);

-- mcw_chat_logs RLS
ALTER TABLE mcw_chat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chatlogs_select_own_bots" ON mcw_chat_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM mcw_bots WHERE id = bot_id AND user_id = auth.uid())
  );

-- usage_logs RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_select_own" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_insert_service" ON usage_logs
  FOR INSERT WITH CHECK (true); -- 서비스 롤에서만 삽입

-- bot_templates — 전체 공개 읽기
ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select_all" ON bot_templates
  FOR SELECT USING (true);
```

### 4. 인덱스 추가

```sql
CREATE INDEX idx_mcw_bots_user_id ON mcw_bots(user_id);
CREATE INDEX idx_mcw_bots_is_active ON mcw_bots(is_active);
CREATE INDEX idx_mcw_chat_logs_bot_id ON mcw_chat_logs(bot_id);
CREATE INDEX idx_mcw_chat_logs_session_id ON mcw_chat_logs(session_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
```

### 5. 저장 위치
- `supabase/migrations/20260331_initial_schema.sql`
- `Process/S1_개발_준비/Database/` (원본 문서)

## Expected Output Files
- `supabase/migrations/20260331_initial_schema.sql`
- `Process/S1_개발_준비/Database/schema.sql`

## Completion Criteria
- [ ] 6개 테이블 Supabase에 존재 확인
- [ ] 각 테이블에 RLS 활성화 및 정책 적용
- [ ] 인덱스 생성 완료
- [ ] 마이그레이션 파일 작성 완료
- [ ] Supabase Dashboard에서 테이블 스키마 조회 가능

## Tech Stack
- PostgreSQL (Supabase)
- Supabase (RLS, Auth)
- pgvector (embedding 컬럼 — 확장 활성화 필요)

## Tools
- supabase (CLI)
- Supabase Dashboard

## Execution Type
Human-AI (실제 SQL 실행은 Supabase Dashboard 또는 CLI에서 PO가 수행)

## Remarks
- 이 Task는 소급(Retroactive) 등록 항목 — 이미 구현 완료
- `mcw_kb_items`의 `embedding VECTOR(1536)`은 pgvector 확장 활성화 필요
- `embedding` 컬럼은 AI 검색(RAG) 기능 시 사용 — 초기에는 NULL 허용
- S1DB2에서 크레딧/결제/수익/피상속 테이블 추가 예정

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1DB1 → `Process/S1_개발_준비/Database/`

### 제2 규칙: Production 코드는 이중 저장
- DB Area는 Production 저장 대상 아님
- SQL은 Supabase에서 직접 실행, `supabase/migrations/`에 버전 관리
