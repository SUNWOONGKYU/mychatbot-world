# S1BI1: 백엔드 환경 설정

> **Task ID**: S1BI1  
> **Task Name**: 백엔드 환경 설정  
> **Stage**: S1 (개발 준비)  
> **Area**: BI (Backend_Infra)  
> **Agent**: devops-engineer  
> **Dependencies**: -

---

## 🎯 Task 목표

Python 백엔드 개발 환경을 설정하고, 필요한 패키지 의존성을 정의합니다.

---

## 📋 작업 내용

### 1. requirements.txt 작성

**위치**: `src/backend/requirements.txt`

**포함 패키지**:
- FastAPI, Uvicorn
- SQLAlchemy, Alembic
- PostgreSQL driver (psycopg2-binary)
- Redis (redis-py)
- JWT (python-jose)
- Password hashing (passlib, bcrypt)
- AI APIs (anthropic, openai)
- 기타 유틸리티

### 2. requirements-dev.txt 작성

**위치**: `src/backend/requirements-dev.txt`

**개발 도구**:
- pytest, pytest-cov, pytest-asyncio
- black, flake8, mypy
- httpx (테스트용)

### 3. .env.sample 작성

**위치**: `src/backend/.env.sample`

**환경 변수 템플릿**:
- DATABASE_URL
- REDIS_URL
- SECRET_KEY
- ANTHROPIC_API_KEY
- 기타 설정

### 4. pyproject.toml 작성

**위치**: `src/backend/pyproject.toml`

**설정**:
- Black, Flake8 설정
- 프로젝트 메타데이터

### 5. .python-version 작성

**위치**: `src/backend/.python-version`

**내용**: `3.11.0`

---

## ✅ 완료 조건

- [ ] requirements.txt 작성
- [ ] requirements-dev.txt 작성
- [ ] .env.sample 작성
- [ ] pyproject.toml 작성
- [ ] .python-version 작성
- [ ] 가상 환경 테스트 가능

---

## 📝 산출물

1. `src/backend/requirements.txt`
2. `src/backend/requirements-dev.txt`
3. `src/backend/.env.sample`
4. `src/backend/pyproject.toml`
5. `src/backend/.python-version`

---

## 🔍 참고 사항

- Python 3.11+ 사용
- FastAPI 최신 버전
- 보안 패키지 버전 고정

---

**작성일**: 2026-02-09  
**작성자**: 써니봇2
