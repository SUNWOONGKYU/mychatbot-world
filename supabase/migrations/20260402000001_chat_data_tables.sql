-- Migration: Chat Data Tables (faqs, conversations, messages)
-- Created: 2026-04-02
-- Task: S4DB (missing tables from code analysis)
-- Note: mcw_personas already has faqs as JSONB field.
--       This standalone faqs table is for chatbot-level FAQ management via /api/faq.
--       conversations + messages provide proper user-conversation hierarchy
--       (distinct from mcw_chat_logs which is session-based without user tracking).

-- ============================================================
-- 1. faqs table
-- ============================================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id TEXT NOT NULL REFERENCES mcw_bots(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_chatbot_id ON faqs(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(chatbot_id, order_index);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- FAQ 소유자: chatbot_id → mcw_bots.owner_id = auth.uid()::text
CREATE POLICY "faqs_select_owner" ON faqs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = faqs.chatbot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "faqs_insert_owner" ON faqs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = faqs.chatbot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "faqs_update_owner" ON faqs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = faqs.chatbot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = faqs.chatbot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "faqs_delete_owner" ON faqs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mcw_bots
      WHERE mcw_bots.id = faqs.chatbot_id
        AND mcw_bots.owner_id = auth.uid()::text
    )
  );

-- ============================================================
-- 2. conversations table
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  bot_id TEXT NOT NULL REFERENCES mcw_bots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_id ON conversations(bot_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 대화 소유자: user_id = auth.uid()::text
-- (mcw_bots.owner_id가 TEXT이므로 auth.uid()::text 캐스트 필수)
CREATE POLICY "conversations_select_owner" ON conversations
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "conversations_insert_owner" ON conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "conversations_update_owner" ON conversations
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "conversations_delete_owner" ON conversations
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- ============================================================
-- 3. messages table
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 메시지 소유자: conversation_id → conversations.user_id = auth.uid()::text
CREATE POLICY "messages_select_owner" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "messages_insert_owner" ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "messages_update_owner" ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "messages_delete_owner" ON messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()::text
    )
  );
