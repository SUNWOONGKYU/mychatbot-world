# Database Migration Guide

Alembic을 사용한 데이터베이스 마이그레이션 가이드입니다.

---

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env` 파일에 데이터베이스 URL 설정:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/chatbot_db
```

### 2. 데이터베이스 생성

```bash
# PostgreSQL CLI
createdb chatbot_db

# 또는 psql
psql -U postgres
CREATE DATABASE chatbot_db;
```

### 3. 마이그레이션 실행

```bash
cd src/backend

# 최신 버전으로 업그레이드
alembic upgrade head

# 특정 버전으로 업그레이드
alembic upgrade 001

# 한 단계만 업그레이드
alembic upgrade +1
```

---

## 📋 Alembic 명령어

### 현재 버전 확인
```bash
alembic current
```

### 마이그레이션 히스토리
```bash
alembic history --verbose
```

### 새 마이그레이션 생성
```bash
# 빈 마이그레이션
alembic revision -m "add_new_column"

# 자동 감지 (모델 변경 후)
alembic revision --autogenerate -m "add_user_avatar"
```

### 업그레이드
```bash
# 최신 버전으로
alembic upgrade head

# 특정 버전으로
alembic upgrade 001

# 상대 업그레이드 (현재 + N 버전)
alembic upgrade +2
```

### 다운그레이드
```bash
# 한 단계 되돌리기
alembic downgrade -1

# 특정 버전으로
alembic downgrade 001

# 모두 되돌리기
alembic downgrade base
```

### SQL 생성 (실제 적용 안 함)
```bash
# 업그레이드 SQL 확인
alembic upgrade head --sql

# 다운그레이드 SQL 확인
alembic downgrade -1 --sql
```

---

## 📝 마이그레이션 작성 가이드

### 1. 새 마이그레이션 생성

```bash
alembic revision -m "add_avatar_settings"
```

생성된 파일: `alembic/versions/xxx_add_avatar_settings.py`

### 2. upgrade() 함수 작성

```python
def upgrade() -> None:
    """Apply changes."""
    op.add_column('users', 
        sa.Column('avatar_url', sa.String(500), nullable=True)
    )
    op.create_index('idx_users_avatar', 'users', ['avatar_url'])
```

### 3. downgrade() 함수 작성 (필수!)

```python
def downgrade() -> None:
    """Revert changes."""
    op.drop_index('idx_users_avatar', 'users')
    op.drop_column('users', 'avatar_url')
```

---

## 🔧 일반적인 작업

### 새 테이블 추가

```python
def upgrade() -> None:
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), 
                  server_default=sa.text('uuid_generate_v4()'), 
                  nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('created_at', sa.TIMESTAMP(), 
                  server_default=sa.text('NOW()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_notifications_user', 'notifications', ['user_id', 'created_at'])

def downgrade() -> None:
    op.drop_table('notifications')
```

### 컬럼 추가

```python
def upgrade() -> None:
    op.add_column('users', 
        sa.Column('phone_number', sa.String(20), nullable=True)
    )

def downgrade() -> None:
    op.drop_column('users', 'phone_number')
```

### 컬럼 수정

```python
def upgrade() -> None:
    op.alter_column('users', 'username',
                    existing_type=sa.String(50),
                    type_=sa.String(100),
                    existing_nullable=False)

def downgrade() -> None:
    op.alter_column('users', 'username',
                    existing_type=sa.String(100),
                    type_=sa.String(50),
                    existing_nullable=False)
```

### 인덱스 추가

```python
def upgrade() -> None:
    op.create_index('idx_messages_emotion', 'messages', ['emotion'])

def downgrade() -> None:
    op.drop_index('idx_messages_emotion', 'messages')
```

### 데이터 마이그레이션

```python
from sqlalchemy import table, column

def upgrade() -> None:
    # 테이블 참조
    users = table('users',
        column('id', sa.UUID),
        column('is_premium', sa.Boolean)
    )
    
    # 데이터 업데이트
    op.execute(
        users.update().values(is_premium=False).where(users.c.is_premium == None)
    )

def downgrade() -> None:
    pass  # 데이터 되돌리기가 필요한 경우 구현
```

---

## 🚨 주의사항

### 1. downgrade() 필수 작성
모든 마이그레이션은 반드시 downgrade() 함수를 구현해야 합니다.

### 2. 데이터 손실 주의
컬럼 삭제나 타입 변경 시 데이터 손실 가능성을 고려하세요.

```python
# ❌ 나쁜 예: 데이터 손실
def upgrade() -> None:
    op.drop_column('users', 'old_field')

# ✅ 좋은 예: 단계적 마이그레이션
# Migration 1: 새 컬럼 추가
def upgrade() -> None:
    op.add_column('users', sa.Column('new_field', sa.String(100)))

# Migration 2: 데이터 복사
def upgrade() -> None:
    op.execute("UPDATE users SET new_field = old_field")

# Migration 3: 구 컬럼 삭제
def upgrade() -> None:
    op.drop_column('users', 'old_field')
```

### 3. 트랜잭션 관리
대용량 데이터 작업은 배치로 처리하세요.

### 4. 프로덕션 적용 전 테스트
```bash
# 로컬에서 upgrade → downgrade → upgrade 테스트
alembic upgrade head
alembic downgrade -1
alembic upgrade head
```

---

## 🔍 트러블슈팅

### "Target database is not up to date" 에러
```bash
# 현재 버전 확인
alembic current

# 강제로 버전 설정 (주의!)
alembic stamp head
```

### 마이그레이션 충돌
```bash
# 두 브랜치에서 동시에 마이그레이션 생성 시
alembic merge -m "merge migrations" rev1 rev2
```

### 마이그레이션 취소
```bash
# 아직 커밋하지 않은 경우
rm alembic/versions/xxx_bad_migration.py

# 이미 적용한 경우
alembic downgrade -1
rm alembic/versions/xxx_bad_migration.py
```

---

## 📚 참고 자료

- [Alembic 공식 문서](https://alembic.sqlalchemy.org/)
- [SQLAlchemy 문서](https://docs.sqlalchemy.org/)
- 프로젝트 DB 스키마: `docs/architecture/database-schema.md`

---

**작성일**: 2026-02-09  
**버전**: 1.0
