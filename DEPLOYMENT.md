# AI Avatar Chat - 배포 가이드

## 🏗️ 아키텍처

```
사용자 질문
    ↓
Vercel Serverless Function (API)
    ↓
Supabase에서 관련 지식 검색 (pgvector)
    ↓
Claude API에 지식 + 질문 전달
    ↓
AI 답변 → 사용자에게 반환
```

## 📋 필요한 것

1. **Vercel 계정** (무료)
2. **Supabase 계정** (무료)
3. **Claude API 키** (Anthropic)

---

## 🚀 1단계: Supabase 설정

### 1.1 프로젝트 생성
https://supabase.com/dashboard
- **New Project** 클릭
- 프로젝트 이름, 비밀번호 설정
- Region: Southeast Asia (Singapore) 선택

### 1.2 pgvector 활성화
SQL Editor에서 실행:
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 1.3 API 키 복사
**Settings → API**:
- `Project URL` 복사 → `SUPABASE_URL`
- `anon public` 키 복사 → `SUPABASE_ANON_KEY`

---

## 🔧 2단계: Vercel 환경변수 설정

Vercel 프로젝트 설정:
1. **Settings → Environment Variables**
2. 다음 3개 추가:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | Supabase anon 키 |

---

## 🧪 3단계: 테스트

### 직접 모드 (RAG 없이)
ANTHROPIC_API_KEY만 설정하면 Claude API 직접 사용

### RAG 모드
모든 환경변수 설정하면 Supabase 지식 검색 + Claude 응답

---

## 📊 현재 상태

- ✅ Vercel Functions 코드 준비됨
- ✅ Supabase 연동 코드 준비됨
- ⏳ 환경변수 설정 필요
- ⏳ 지식 벡터 임베딩 (향후)

---

## 🎯 다음 단계

1. Supabase 프로젝트 생성
2. Vercel 환경변수 설정
3. 배포 후 테스트
4. 지식 데이터 추가 (선택사항)
