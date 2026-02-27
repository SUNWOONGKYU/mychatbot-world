-- ==========================================
-- Schema v2 Additions
-- My Chatbot World — 사업계획서 기능 구현
-- Created: 2026-02-28
-- ==========================================

-- Enable pgvector for Obsidian RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================
-- 6. user_bots table (실제 운영 챗봇)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    bot_name VARCHAR(100) NOT NULL,
    bot_desc TEXT,
    avatar_emoji VARCHAR(50) DEFAULT 'robot',
    avatar_image_url TEXT,
    theme_mode VARCHAR(10) DEFAULT 'dark' CHECK (theme_mode IN ('dark', 'light')),
    theme_color VARCHAR(20) DEFAULT 'purple',
    voice VARCHAR(30) DEFAULT 'fable',
    deploy_channels JSONB DEFAULT '["web"]',
    dm_policy VARCHAR(20) DEFAULT 'public' CHECK (dm_policy IN ('public', 'allowlist', 'pairing')),
    pairing_code VARCHAR(10),
    allowed_users JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_bots_owner ON user_bots(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_bots_username ON user_bots(username);

COMMENT ON TABLE user_bots IS '사용자가 생성한 챗봇 (8단계 위저드)';

-- ==========================================
-- 7. bot_personas table (봇별 페르소나)
-- ==========================================
CREATE TABLE IF NOT EXISTS bot_personas (
    id VARCHAR(100) PRIMARY KEY,
    bot_id UUID NOT NULL REFERENCES user_bots(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role TEXT,
    category VARCHAR(20) DEFAULT 'avatar' CHECK (category IN ('avatar', 'helper')),
    helper_type VARCHAR(20),
    model VARCHAR(20) DEFAULT 'logic',
    iq_eq INTEGER DEFAULT 50 CHECK (iq_eq >= 0 AND iq_eq <= 100),
    user_title VARCHAR(50) DEFAULT '고객님',
    greeting TEXT,
    faqs JSONB DEFAULT '[]',
    is_visible BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_personas_bot ON bot_personas(bot_id);

COMMENT ON TABLE bot_personas IS '봇별 페르소나 (대면/도우미)';

-- ==========================================
-- 8. credits table (크레딧 계정)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_charged INTEGER NOT NULL DEFAULT 0,
    total_used INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);

COMMENT ON TABLE user_credits IS '사용자 크레딧 잔액';

-- ==========================================
-- 9. credit_transactions table (크레딧 내역)
-- ==========================================
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('charge', 'use_ai', 'use_db', 'use_tts', 'use_stt', 'refund', 'bonus')),
    amount INTEGER NOT NULL,  -- 양수=충전, 음수=차감
    balance_after INTEGER NOT NULL,
    price_krw INTEGER DEFAULT 0,  -- 결제 금액 (충전 시)
    note TEXT,
    bot_id UUID REFERENCES user_bots(id) ON DELETE SET NULL,
    persona_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);

COMMENT ON TABLE credit_transactions IS '크레딧 충전/차감 내역';

-- ==========================================
-- 10. skill_api_keys table (스킬 외부 API 키)
-- ==========================================
CREATE TABLE IF NOT EXISTS skill_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,  -- AES 암호화된 API 키
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_api_keys_user ON skill_api_keys(user_id);

COMMENT ON TABLE skill_api_keys IS '스킬별 외부 API 키 (ElevenLabs, Google 등)';

-- ==========================================
-- 11. revenue_settings table (수익활동 설정)
-- ==========================================
CREATE TABLE IF NOT EXISTS revenue_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    consulting_enabled BOOLEAN DEFAULT false,
    consulting_price INTEGER DEFAULT 30000,
    reservation_enabled BOOLEAN DEFAULT false,
    reservation_price INTEGER DEFAULT 5000,
    referral_enabled BOOLEAN DEFAULT false,
    referral_rate DECIMAL(5,2) DEFAULT 10.0,
    content_enabled BOOLEAN DEFAULT false,
    content_payment_url TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE revenue_settings IS '수익활동 중개 설정 (수수료 20% 정산)';

-- ==========================================
-- 12. revenue_transactions table (수익 내역)
-- ==========================================
CREATE TABLE IF NOT EXISTS revenue_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bot_id UUID REFERENCES user_bots(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('consulting', 'reservation', 'referral', 'content')),
    gross_amount INTEGER NOT NULL,   -- 총 수익
    commission INTEGER NOT NULL,     -- 수수료 20%
    net_amount INTEGER NOT NULL,     -- 정산 금액 (80%)
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revenue_tx_user ON revenue_transactions(user_id, created_at DESC);

COMMENT ON TABLE revenue_transactions IS '수익활동 거래 내역 (수수료 20% 자동 계산)';

-- ==========================================
-- 13. obsidian_documents table (Obsidian 지식베이스)
-- ==========================================
CREATE TABLE IF NOT EXISTS obsidian_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bot_id UUID REFERENCES user_bots(id) ON DELETE CASCADE,
    persona_id VARCHAR(100),
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT,
    content TEXT NOT NULL,
    content_hash VARCHAR(64),  -- SHA-256 for dedup
    tags JSONB DEFAULT '[]',
    word_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    is_indexed BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obsidian_docs_user ON obsidian_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_obsidian_docs_bot ON obsidian_documents(bot_id);
CREATE INDEX IF NOT EXISTS idx_obsidian_docs_hash ON obsidian_documents(content_hash);

COMMENT ON TABLE obsidian_documents IS 'Obsidian 마크다운 파일 원본 저장';

-- ==========================================
-- 14. obsidian_chunks table (RAG용 청크)
-- ==========================================
CREATE TABLE IF NOT EXISTS obsidian_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id UUID NOT NULL REFERENCES obsidian_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_id VARCHAR(100),
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),  -- OpenAI text-embedding-3-small
    token_count INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obsidian_chunks_doc ON obsidian_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_obsidian_chunks_persona ON obsidian_chunks(persona_id);
-- pgvector IVFFlat 인덱스 (RAG 검색용)
-- CREATE INDEX idx_obsidian_chunks_embedding ON obsidian_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE obsidian_chunks IS 'Obsidian RAG 검색용 청크 + 임베딩';

-- ==========================================
-- Views
-- ==========================================

-- 사용자별 크레딧 현황 뷰
CREATE OR REPLACE VIEW user_credit_summary AS
SELECT
    u.id AS user_id,
    u.email,
    COALESCE(c.balance, 0) AS balance,
    COALESCE(c.total_charged, 0) AS total_charged,
    COALESCE(c.total_used, 0) AS total_used
FROM users u
LEFT JOIN user_credits c ON u.id = c.user_id;

-- 수익 정산 현황 뷰 (이번 달)
CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT
    user_id,
    SUM(gross_amount) AS total_gross,
    SUM(commission) AS total_commission,
    SUM(net_amount) AS total_net,
    COUNT(*) AS transaction_count,
    DATE_TRUNC('month', CURRENT_DATE) AS month
FROM revenue_transactions
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND status != 'pending'
GROUP BY user_id;

-- ==========================================
-- Triggers
-- ==========================================

-- user_bots updated_at 자동 업데이트
CREATE TRIGGER update_user_bots_updated_at BEFORE UPDATE ON user_bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- bot_personas updated_at
CREATE TRIGGER update_bot_personas_updated_at BEFORE UPDATE ON bot_personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- skill_api_keys updated_at
CREATE TRIGGER update_skill_api_keys_updated_at BEFORE UPDATE ON skill_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- revenue_settings updated_at
CREATE TRIGGER update_revenue_settings_updated_at BEFORE UPDATE ON revenue_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- obsidian_documents updated_at
CREATE TRIGGER update_obsidian_docs_updated_at BEFORE UPDATE ON obsidian_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- RLS (Row Level Security) Policies
-- ==========================================

-- user_bots: 본인 봇만 접근
ALTER TABLE user_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_bots_owner ON user_bots FOR ALL USING (owner_id = auth.uid());
-- 공개 봇 조회 허용
CREATE POLICY user_bots_public_read ON user_bots FOR SELECT USING (is_active = true);

-- user_credits: 본인만 접근
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_credits_owner ON user_credits FOR ALL USING (user_id = auth.uid());

-- credit_transactions: 본인만 접근
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_tx_owner ON credit_transactions FOR ALL USING (user_id = auth.uid());

-- revenue_settings: 본인만 접근
ALTER TABLE revenue_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_settings_owner ON revenue_settings FOR ALL USING (user_id = auth.uid());

-- obsidian_documents: 본인만 접근
ALTER TABLE obsidian_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY obsidian_docs_owner ON obsidian_documents FOR ALL USING (user_id = auth.uid());

-- obsidian_chunks: 본인만 접근
ALTER TABLE obsidian_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY obsidian_chunks_owner ON obsidian_chunks FOR ALL USING (user_id = auth.uid());

-- ==========================================
-- 15. Skill 연동 테이블들 (7개 무료 스킬)
-- ==========================================

-- 예약 수집
CREATE TABLE IF NOT EXISTS skill_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID REFERENCES user_bots(id) ON DELETE CASCADE,
    persona_id VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    datetime TIMESTAMP NOT NULL,
    contact VARCHAR(100) NOT NULL,
    note TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reservations_bot ON skill_reservations(bot_id, datetime);

-- 설문 응답
CREATE TABLE IF NOT EXISTS skill_survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID REFERENCES user_bots(id) ON DELETE CASCADE,
    persona_id VARCHAR(100),
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_survey_bot ON skill_survey_responses(bot_id);

-- 쿠폰
CREATE TABLE IF NOT EXISTS skill_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID REFERENCES user_bots(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    recipient_name VARCHAR(100),
    expiry_date TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coupons_bot_code ON skill_coupons(bot_id, code);

-- 리드 수집
CREATE TABLE IF NOT EXISTS skill_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID REFERENCES user_bots(id) ON DELETE CASCADE,
    name VARCHAR(100),
    contact VARCHAR(100),
    email VARCHAR(255),
    note TEXT,
    is_contacted BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_bot ON skill_leads(bot_id, created_at DESC);

-- ==========================================
-- pgvector RAG 검색 함수
-- ==========================================
CREATE OR REPLACE FUNCTION search_obsidian_chunks(
    query_embedding vector(1536),
    match_user_id UUID,
    match_persona_id TEXT DEFAULT NULL,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    doc_id UUID,
    content TEXT,
    similarity FLOAT,
    file_name TEXT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        c.id,
        c.doc_id,
        c.content,
        1 - (c.embedding <=> query_embedding) AS similarity,
        d.file_name
    FROM obsidian_chunks c
    JOIN obsidian_documents d ON c.doc_id = d.id
    WHERE c.user_id = match_user_id
      AND c.embedding IS NOT NULL
      AND (match_persona_id IS NULL OR c.persona_id = match_persona_id)
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
$$;

SELECT 'Schema v2 additions created successfully' AS status;
