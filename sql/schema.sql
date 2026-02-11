-- AI Avatar Chat Platform Database Schema
-- PostgreSQL 15+
-- Created: 2026-02-09

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. users table
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Comments
COMMENT ON TABLE users IS 'User accounts';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password';

-- ==========================================
-- 2. chatbot_personas table
-- ==========================================
CREATE TABLE chatbot_personas (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    avatar_model VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE chatbot_personas IS 'Chatbot persona definitions';

-- ==========================================
-- 3. conversations table
-- ==========================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_id VARCHAR(50) NOT NULL REFERENCES chatbot_personas(id),
    title VARCHAR(200),
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX idx_conversations_persona ON conversations(persona_id);

-- Comments
COMMENT ON TABLE conversations IS 'Conversation sessions between users and chatbots';
COMMENT ON COLUMN conversations.title IS 'Auto-generated from first message';

-- ==========================================
-- 4. messages table
-- ==========================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    emotion VARCHAR(20) CHECK (emotion IN ('neutral', 'happy', 'sad', 'angry', 'surprised', 'thinking', 'concerned')),
    tokens_used INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Comments
COMMENT ON TABLE messages IS 'Individual messages in conversations';
COMMENT ON COLUMN messages.emotion IS 'Emotion for avatar expression (assistant only)';
COMMENT ON COLUMN messages.tokens_used IS 'Token count for cost tracking';

-- ==========================================
-- 5. user_preferences table
-- ==========================================
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_persona VARCHAR(50) REFERENCES chatbot_personas(id),
    avatar_customization JSONB DEFAULT '{}',
    voice_enabled BOOLEAN NOT NULL DEFAULT false,
    theme VARCHAR(20) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for user_preferences
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- Comments
COMMENT ON TABLE user_preferences IS 'User personalization settings';
COMMENT ON COLUMN user_preferences.avatar_customization IS 'JSON object for avatar customization';

-- ==========================================
-- Triggers for updated_at
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbot_personas_updated_at BEFORE UPDATE ON chatbot_personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Initial Data: Chatbot Personas
-- ==========================================

INSERT INTO chatbot_personas (id, name, description, system_prompt, avatar_model) VALUES
('business-assistant', 
 'Business Assistant', 
 'Professional assistant for scheduling, emails, and data analysis',
 'You are a professional business assistant. Help users with scheduling, email drafting, data analysis, and productivity. Be efficient, clear, and proactive.',
 'models/business_avatar.glb'),

('customer-service', 
 'Customer Service Bot', 
 '24/7 customer support for FAQs and issue resolution',
 'You are a friendly and patient customer service representative. Answer FAQs, troubleshoot issues, and always maintain a positive, helpful attitude.',
 'models/service_avatar.glb'),

('education-tutor', 
 'Education Tutor', 
 'Personalized learning support with quizzes and feedback',
 'You are an encouraging education tutor. Explain concepts clearly, provide examples, create quizzes, and give constructive feedback. Adapt to the student''s level.',
 'models/tutor_avatar.glb'),

('healthcare-advisor', 
 'Healthcare Advisor', 
 'Health information and wellness guidance',
 'You are a knowledgeable healthcare advisor. Provide general health information, wellness tips, and medication reminders. Always remind users to consult healthcare professionals for medical advice.',
 'models/healthcare_avatar.glb'),

('entertainment-bot', 
 'Entertainment Bot', 
 'Storytelling, games, and personalized recommendations',
 'You are a fun and creative entertainment companion. Tell engaging stories, play word games, recommend movies/books/music, and keep conversations enjoyable.',
 'models/entertainment_avatar.glb'),

('personal-assistant', 
 'Personal Assistant', 
 'Customizable daily life support assistant',
 'You are a versatile personal assistant. Help with daily tasks, reminders, planning, and general queries. Be adaptable to the user''s preferences and needs.',
 'models/personal_avatar.glb');

-- ==========================================
-- Views (Optional)
-- ==========================================

-- View: User conversation statistics
CREATE OR REPLACE VIEW user_conversation_stats AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(m.id) as total_messages,
    SUM(m.tokens_used) as total_tokens_used,
    MAX(c.updated_at) as last_conversation_at
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY u.id, u.username;

COMMENT ON VIEW user_conversation_stats IS 'User activity statistics';

-- ==========================================
-- Grants (adjust as needed)
-- ==========================================

-- Create app user (optional, for production)
-- CREATE USER chatbot_app WITH PASSWORD 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO chatbot_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO chatbot_app;

-- ==========================================
-- Database Info
-- ==========================================

-- Display schema version
SELECT 'Database schema v1.0 created successfully' AS status;
