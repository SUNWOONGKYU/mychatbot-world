-- mcw_chat_logs: 대화 기록 (Supabase 영구 저장)
CREATE TABLE IF NOT EXISTS mcw_chat_logs (
  id BIGSERIAL PRIMARY KEY,
  bot_id TEXT REFERENCES mcw_bots(id) ON DELETE CASCADE,
  persona_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  session_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mcw_chat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcw_chat_logs_read" ON mcw_chat_logs FOR SELECT USING (true);
CREATE POLICY "mcw_chat_logs_write" ON mcw_chat_logs FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_chat_logs_bot_persona ON mcw_chat_logs(bot_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON mcw_chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON mcw_chat_logs(created_at DESC);
