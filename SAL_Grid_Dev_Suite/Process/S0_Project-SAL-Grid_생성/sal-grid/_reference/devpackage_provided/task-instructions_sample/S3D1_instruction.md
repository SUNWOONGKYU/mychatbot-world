# Task Instruction - S3D1

---

## 필수 참조 규칙 파일 (2026-01-04)

> **작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## Task ID
S3D1

## Task Name
AI 튜터 DB 스키마

## Task Goal
RAG 기반 AI 튜터 시스템을 위한 Supabase 데이터베이스 스키마 설계 및 생성

## Prerequisites (Dependencies)
- S1D1 (DB 스키마 확정) 완료

## Specific Instructions

### 1. pgvector 확장 활성화
```sql
-- Supabase SQL Editor에서 실행
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. content_embeddings 테이블 생성
```sql
-- 학습 콘텐츠 임베딩 저장 (225개 MD 파일 → ~675 청크)
CREATE TABLE content_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,  -- 'tip', 'book', 'guide', 'briefing'
    content_id VARCHAR(100) NOT NULL,   -- 원본 파일 식별자
    chunk_index INTEGER NOT NULL,       -- 청크 순서
    title VARCHAR(500),                 -- 콘텐츠 제목
    content TEXT NOT NULL,              -- 청크 텍스트
    embedding vector(768) NOT NULL,     -- Gemini 임베딩 (768차원)
    metadata JSONB,                      -- 카테고리, 태그 등
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 검색용 인덱스
CREATE INDEX idx_content_embeddings_vector
ON content_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 콘텐츠 타입별 인덱스
CREATE INDEX idx_content_embeddings_type ON content_embeddings(content_type);
```

### 3. tutor_conversations 테이블 생성
```sql
-- 대화 세션 저장
CREATE TABLE tutor_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200),                 -- 자동 생성 또는 사용자 지정
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자별 대화 목록 조회용 인덱스
CREATE INDEX idx_tutor_conversations_user ON tutor_conversations(user_id, updated_at DESC);

-- RLS 정책
ALTER TABLE tutor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON tutor_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON tutor_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON tutor_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON tutor_conversations
    FOR DELETE USING (auth.uid() = user_id);
```

### 4. tutor_messages 테이블 생성
```sql
-- 개별 메시지 저장
CREATE TABLE tutor_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,          -- 'user' 또는 'assistant'
    content TEXT NOT NULL,
    sources JSONB,                       -- 참조된 문서 정보 [{content_id, title, similarity}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 대화별 메시지 조회용 인덱스
CREATE INDEX idx_tutor_messages_conversation ON tutor_messages(conversation_id, created_at ASC);

-- RLS 정책
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of own conversations" ON tutor_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutor_conversations
            WHERE id = tutor_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to own conversations" ON tutor_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tutor_conversations
            WHERE id = tutor_messages.conversation_id
            AND user_id = auth.uid()
        )
    );
```

### 5. 벡터 유사도 검색 함수 생성
```sql
-- 유사 콘텐츠 검색 함수
CREATE OR REPLACE FUNCTION search_content(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content_type VARCHAR,
    content_id VARCHAR,
    title VARCHAR,
    content TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.id,
        ce.content_type,
        ce.content_id,
        ce.title,
        ce.content,
        1 - (ce.embedding <=> query_embedding) AS similarity
    FROM content_embeddings ce
    WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
    ORDER BY ce.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

## Expected Output Files
- `S3_개발-2차/Database/ai_tutor_schema.sql`
- `P3_프로토타입_제작/Database/ai_tutor_schema.sql` (복사)

## Completion Criteria
- [ ] pgvector 확장 활성화
- [ ] content_embeddings 테이블 생성 (벡터 인덱스 포함)
- [ ] tutor_conversations 테이블 생성 (RLS 포함)
- [ ] tutor_messages 테이블 생성 (RLS 포함)
- [ ] search_content 함수 생성
- [ ] 모든 테이블에 적절한 인덱스 생성

## Tech Stack
- Supabase PostgreSQL
- pgvector 확장
- RLS (Row Level Security)

## Task Agent
`database-specialist`

## Verification Agent
`database-specialist`

## Execution Type
AI-Only

## Remarks
- Gemini 임베딩 768차원 사용 (무료)
- content_embeddings는 서비스 역할로만 쓰기 가능 (임베딩 생성 스크립트용)
- 대화 관련 테이블은 RLS로 사용자별 격리
