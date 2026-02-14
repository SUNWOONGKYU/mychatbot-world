-- 지식 베이스 테이블
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  category VARCHAR(50),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_bot ON chatbot_knowledge (bot_id, category);

-- 문서 업로드 테이블
CREATE TABLE IF NOT EXISTS chatbot_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  filename VARCHAR(255),
  file_type VARCHAR(50),
  file_url TEXT,
  extracted_text TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_bot ON chatbot_documents (bot_id);

-- FAQ 테이블
CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  priority INTEGER DEFAULT 0,
  hit_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_bot ON chatbot_faqs (bot_id, is_active);

-- 통계/분석 테이블
CREATE TABLE IF NOT EXISTS chatbot_analytics (
  id BIGSERIAL PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_response_time FLOAT,
  satisfaction_score FLOAT,
  top_questions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(bot_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_bot_date ON chatbot_analytics (bot_id, date DESC);

-- 학습 데이터 테이블
CREATE TABLE IF NOT EXISTS chatbot_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_bot ON chatbot_training_data (bot_id, is_approved);
