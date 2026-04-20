-- bot_settings + sync_logs 테이블 생성
-- app/api/settings/route.ts 및 app/api/sync/route.ts 참조
-- RLS: chatbot_id → mcw_bots.owner_id = auth.uid()::text (소유자 기반)

-- ============================================================
-- 1. bot_settings: 챗봇별 설정 (1봇 1설정, upsert 방식)
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id    TEXT NOT NULL UNIQUE REFERENCES mcw_bots(id) ON DELETE CASCADE,
  persona       TEXT NOT NULL DEFAULT '당신은 도움이 되는 AI 어시스턴트입니다.',
  greeting      TEXT NOT NULL DEFAULT '안녕하세요! 무엇을 도와드릴까요?',
  model         TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperature   NUMERIC(3,1) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens    INTEGER NOT NULL DEFAULT 2048 CHECK (max_tokens >= 100 AND max_tokens <= 16384),
  language      TEXT NOT NULL DEFAULT 'ko',
  fallback_message TEXT NOT NULL DEFAULT '죄송합니다. 해당 내용에 대한 답변을 드리기 어렵습니다.',
  use_kb        BOOLEAN NOT NULL DEFAULT true,
  kb_top_k      INTEGER NOT NULL DEFAULT 5 CHECK (kb_top_k >= 1 AND kb_top_k <= 20),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_settings_chatbot_id ON bot_settings(chatbot_id);

-- RLS 활성화
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: 소유자 본인만 (chatbot_id → mcw_bots.owner_id = auth.uid()::text)
CREATE POLICY "bot_settings_select" ON bot_settings
  FOR SELECT USING (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );

-- INSERT: 소유자 본인 봇에만
CREATE POLICY "bot_settings_insert" ON bot_settings
  FOR INSERT WITH CHECK (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );

-- UPDATE: 소유자 본인 봇만
CREATE POLICY "bot_settings_update" ON bot_settings
  FOR UPDATE USING (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  ) WITH CHECK (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );

-- DELETE: 소유자 본인 봇만
CREATE POLICY "bot_settings_delete" ON bot_settings
  FOR DELETE USING (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );


-- ============================================================
-- 2. sync_logs: 클라우드 동기화 실행 로그
-- ============================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id      TEXT NOT NULL REFERENCES mcw_bots(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,
  scope           TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'kb', 'settings')),
  status          TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'done', 'failed')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER,
  kb_synced       INTEGER NOT NULL DEFAULT 0,
  kb_embedded_new INTEGER NOT NULL DEFAULT 0,
  kb_embed_failed INTEGER NOT NULL DEFAULT 0,
  settings_synced BOOLEAN NOT NULL DEFAULT false,
  error_log       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_chatbot_id ON sync_logs(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(chatbot_id, created_at DESC);

-- RLS 활성화
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: 소유자 본인 봇의 로그만
CREATE POLICY "sync_logs_select" ON sync_logs
  FOR SELECT USING (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );

-- INSERT: 소유자 본인 봇의 로그만 (user_id도 본인이어야 함)
CREATE POLICY "sync_logs_insert" ON sync_logs
  FOR INSERT WITH CHECK (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
    AND user_id = auth.uid()::text
  );

-- UPDATE: 소유자 본인 봇의 로그만 (running → done/failed 상태 갱신용)
CREATE POLICY "sync_logs_update" ON sync_logs
  FOR UPDATE USING (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  ) WITH CHECK (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );

-- DELETE: 소유자 본인 봇의 로그만
CREATE POLICY "sync_logs_delete" ON sync_logs
  FOR DELETE USING (
    chatbot_id IN (
      SELECT id FROM mcw_bots WHERE owner_id = auth.uid()::text
    )
  );
