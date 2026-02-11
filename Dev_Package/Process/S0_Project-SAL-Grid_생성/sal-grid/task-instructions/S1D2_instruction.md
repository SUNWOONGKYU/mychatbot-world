# S1D2: 데이터베이스 마이그레이션 설정

> **Task ID**: S1D2  
> **Task Name**: 데이터베이스 마이그레이션 설정  
> **Stage**: S1 (개발 준비)  
> **Area**: D (Database)  
> **Agent**: backend-developer  
> **Dependencies**: S1D1

---

## 🎯 Task 목표

Alembic을 사용하여 데이터베이스 마이그레이션 시스템을 설정합니다.

---

## 📋 작업 내용

### 1. Alembic 초기화

**위치**: `src/backend/`

**명령어**:
```bash
alembic init alembic
```

### 2. Alembic 설정 파일

**위치**: `src/backend/alembic.ini`

**설정**:
- SQLAlchemy URL 설정 (환경 변수 사용)
- 로깅 설정

### 3. env.py 수정

**위치**: `src/backend/alembic/env.py`

**내용**:
- SQLAlchemy models import
- 환경 변수에서 DB URL 로드
- target_metadata 설정

### 4. 첫 번째 마이그레이션 생성

**내용**: S1D1에서 설계한 스키마 기반
- users, conversations, messages, chatbot_personas, user_preferences 테이블

---

## ✅ 완료 조건

- [ ] Alembic 초기화 완료
- [ ] alembic.ini 설정
- [ ] env.py 수정
- [ ] 첫 번째 마이그레이션 파일 생성
- [ ] `alembic upgrade head` 테스트 성공

---

## 📝 산출물

1. `src/backend/alembic.ini`
2. `src/backend/alembic/env.py`
3. `src/backend/alembic/versions/XXXXXX_initial_schema.py`
4. `docs/developer/migration-guide.md`

---

## 🔍 참고 사항

- Alembic 버전: 1.13+
- 마이그레이션 네이밍: `{revision}_{description}.py`
- downgrade 스크립트 필수 작성

---

**작성일**: 2026-02-09  
**작성자**: 써니봇2
