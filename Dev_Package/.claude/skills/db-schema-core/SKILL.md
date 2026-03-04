# /db-schema-core

> **SAL Grid Dev Suite** — Supabase(PostgreSQL) 데이터베이스 스키마 설계 및 마이그레이션 전문 스킬
>
> **사용 시점**: 새 프로젝트의 DB 테이블 설계, 마이그레이션 파일 작성, RLS 정책 설정이 필요할 때
> **적용 대상**: Vanilla 및 React/Next.js 모두 적용 가능

---

## 전문 분야

Supabase (PostgreSQL) 데이터베이스 설계, 마이그레이션, RLS 정책 관리

---

## 핵심 역할

1. **스키마 설계**: ERD 작성 및 테이블 구조 설계
2. **마이그레이션**: SQL 마이그레이션 파일 작성
3. **RLS 정책**: Row Level Security 설정
4. **인덱스 최적화**: 쿼리 성능 개선
5. **데이터 무결성**: Constraints, Triggers 관리

---

## AI-only 원칙 준수

### 허용
```bash
# CLI로 마이그레이션 실행
supabase db push

# SQL 파일로 스키마 관리
supabase/migrations/20231016_create_items.sql

# 로컬 개발
supabase start
supabase db reset
```

### 금지
- Supabase Dashboard에서 수동 테이블 생성
- SQL Editor에서 직접 실행
- GUI로 RLS 정책 생성

---

## 프로젝트 데이터베이스 구조 예시

이 프로젝트에 맞는 ERD를 설계합니다. 아래는 일반적인 구조 예시입니다.

### ERD (Entity Relationship Diagram) 예시
```
profiles (사용자 프로필)
  ├── id (PK, FK to auth.users)
  ├── username
  ├── full_name
  ├── role (user/moderator/admin)
  └── created_at

items (주요 엔티티 — 프로젝트에 맞게 이름 변경)
  ├── id (PK)
  ├── title
  ├── description
  ├── status
  ├── created_by (FK to profiles)
  └── created_at

ratings (평가 — 필요 시)
  ├── id (PK)
  ├── user_id (FK to profiles)
  ├── item_id (FK to items)
  ├── score (1-5)
  ├── comment
  └── created_at

comments (댓글 — 필요 시)
  ├── id (PK)
  ├── user_id (FK to profiles)
  ├── item_id (FK to items)
  ├── parent_id (FK to comments, nullable)
  ├── content
  └── created_at
```

---

## 마이그레이션 파일 작성

### 파일 명명 규칙
```
supabase/migrations/
  ├── 20231016000001_create_profiles.sql
  ├── 20231016000002_create_items.sql
  ├── 20231016000003_create_ratings.sql
  └── 20231017000001_add_status_to_items.sql
```

### 1. Profiles 테이블
```sql
-- supabase/migrations/20231016000001_create_profiles.sql

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Comment
COMMENT ON TABLE profiles IS '사용자 프로필 정보';
```

### 2. 주요 엔티티 테이블 (your_table)
```sql
-- supabase/migrations/20231016000002_create_items.sql
-- 프로젝트에 맞게 테이블명과 컬럼을 변경하세요.

CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  avg_score DECIMAL(3, 2) DEFAULT 0 CHECK (avg_score >= 0 AND avg_score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_created_by ON items(created_by);
CREATE INDEX idx_items_avg_score ON items(avg_score DESC);

-- Full-text search index (언어 설정은 프로젝트에 맞게 변경)
CREATE INDEX idx_items_search ON items USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert items"
  ON items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update items"
  ON items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE items IS '이 프로젝트의 주요 엔티티';
```

### 3. Ratings 테이블 (평가 기능이 있을 경우)
```sql
-- supabase/migrations/20231016000003_create_ratings.sql

CREATE TABLE IF NOT EXISTS ratings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Indexes
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_item_id ON ratings(item_id);
CREATE INDEX idx_ratings_score ON ratings(score);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update item avg_score
CREATE OR REPLACE FUNCTION update_item_avg_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE items
  SET avg_score = (
    SELECT COALESCE(AVG(score), 0)
    FROM ratings
    WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
  )
  WHERE id = COALESCE(NEW.item_id, OLD.item_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_avg_score_on_insert
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_item_avg_score();

CREATE TRIGGER update_avg_score_on_update
  AFTER UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_item_avg_score();

CREATE TRIGGER update_avg_score_on_delete
  AFTER DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_item_avg_score();

COMMENT ON TABLE ratings IS '항목 평가 및 리뷰';
```

### 4. Comments 테이블 (댓글 기능이 있을 경우)
```sql
-- supabase/migrations/20231016000004_create_comments.sql

CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_item_id ON comments(item_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE comments IS '항목에 대한 댓글 및 토론';
```

---

## 데이터 시딩

### 개발용 시드 데이터
```sql
-- supabase/seed.sql
-- 프로젝트에 맞는 테스트 데이터를 삽입합니다.

-- Insert test items
INSERT INTO items (title, description, status) VALUES
  ('테스트 항목 1', '설명 1', 'active'),
  ('테스트 항목 2', '설명 2', 'active'),
  ('테스트 항목 3', '설명 3', 'inactive');

-- Insert test ratings (requires actual user_ids from auth.users)
-- 실제 사용자가 생성된 후 실행
```

---

## 쿼리 최적화

### 1. 인덱스 추가
```sql
-- 복합 인덱스
CREATE INDEX idx_items_status_created_at ON items(status, created_at DESC);

-- 전문 검색 인덱스
CREATE INDEX idx_items_full_search ON items USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### 2. 성능 분석
```sql
-- 쿼리 실행 계획 확인
EXPLAIN ANALYZE
SELECT * FROM items
WHERE status = 'active'
ORDER BY created_at DESC;

-- 느린 쿼리 로깅
ALTER DATABASE postgres SET log_min_duration_statement = 1000;
```

---

## RLS 정책 테스트

```sql
-- 현재 사용자 확인
SELECT auth.uid();

-- RLS 정책 테스트 (관리자)
SET request.jwt.claims.sub = 'admin_user_id';
SELECT * FROM items;

-- RLS 정책 테스트 (일반 사용자)
SET request.jwt.claims.sub = 'regular_user_id';
INSERT INTO items (title, status)
VALUES ('테스트', 'active');
-- 실패해야 함
```

---

## 백업 및 복원

```bash
# 스키마 덤프
supabase db dump --schema public > schema.sql

# 데이터 백업
pg_dump -h db.{SUPABASE_URL}.supabase.co -U postgres -d postgres > backup.sql

# 복원
psql -h db.{SUPABASE_URL}.supabase.co -U postgres -d postgres < backup.sql
```

---

## 마이그레이션 관리

### 새 마이그레이션 생성
```bash
# CLI로 마이그레이션 파일 생성
supabase migration new add_tags_to_items
```

### 마이그레이션 적용
```bash
# 로컬 개발
supabase db reset  # 모든 마이그레이션 재적용

# 프로덕션
supabase db push  # 새로운 마이그레이션만 적용
```

### 마이그레이션 롤백
```sql
-- 마이그레이션 롤백용 SQL 작성
-- supabase/migrations/20231016000005_add_tags_rollback.sql

DROP TABLE IF EXISTS tags;
```

---

## 데이터 무결성

### Foreign Key Constraints
```sql
-- ON DELETE CASCADE: 부모 삭제 시 자식도 삭제
-- ON DELETE SET NULL: 부모 삭제 시 자식의 FK를 NULL로
-- ON DELETE RESTRICT: 자식이 있으면 부모 삭제 불가

ALTER TABLE ratings
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;
```

### Check Constraints
```sql
ALTER TABLE items
ADD CONSTRAINT check_score_range
CHECK (avg_score >= 0 AND avg_score <= 5);
```

---

## 작업 완료 보고 템플릿

```markdown
=== DB 스키마 작업 완료 보고 ===

## 생성 테이블
- profiles: 사용자 프로필
- items: 이 프로젝트의 주요 엔티티
- ratings: 평가 (필요 시)
- comments: 댓글 (필요 시)

## 적용된 마이그레이션
- 20231016000001_create_profiles.sql
- 20231016000002_create_items.sql
- 20231016000003_create_ratings.sql
- 20231016000004_create_comments.sql

## RLS 정책
- 모든 테이블에 RLS 활성화
- 읽기: 모든 사용자
- 쓰기: 인증된 사용자/관리자

## 인덱스
- 검색 성능 최적화 인덱스 추가
- 전문 검색 인덱스

## 테스트 결과
- 마이그레이션 적용 성공
- RLS 정책 검증 완료
- 시드 데이터 삽입 성공

## 다음 단계
- 추가 테이블 설계 (프로젝트 요구사항에 따라)
- 성능 모니터링
- 백업 자동화
```

---

**이 스킬을 사용하면 안전하고 확장 가능한 데이터베이스를 설계하고 관리할 수 있습니다.**
