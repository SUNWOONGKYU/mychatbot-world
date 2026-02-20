# S1BI2: Docker 인프라 구성

> **Task ID**: S1BI2  
> **Task Name**: 인프라 구성 (Docker)  
> **Stage**: S1 (개발 준비)  
> **Area**: BI (Backend_Infra)  
> **Agent**: devops-engineer  
> **Dependencies**: S1BI1

---

## 🎯 Task 목표

Docker와 Docker Compose를 사용하여 백엔드, PostgreSQL, Redis를 컨테이너화합니다.

---

## 📋 작업 내용

### 1. Dockerfile 작성

**위치**: `src/backend/Dockerfile`

**내용**:
- Python 3.11 베이스 이미지
- 의존성 설치
- 앱 코드 복사
- Uvicorn 실행

### 2. docker-compose.yml 작성

**위치**: 프로젝트 루트 `docker-compose.yml`

**서비스**:
- backend (FastAPI)
- postgres (PostgreSQL 15)
- redis (Redis 7)

### 3. .dockerignore 작성

**위치**: `src/backend/.dockerignore`

**제외 항목**:
- venv/, __pycache__, .env 등

---

## ✅ 완료 조건

- [ ] Dockerfile 작성
- [ ] docker-compose.yml 작성
- [ ] .dockerignore 작성
- [ ] `docker-compose up` 테스트 성공

---

## 📝 산출물

1. `src/backend/Dockerfile`
2. `docker-compose.yml`
3. `src/backend/.dockerignore`

---

## 🔍 참고 사항

- Multi-stage build 고려
- 헬스체크 추가
- Volume 설정 (데이터 영속성)

---

**작성일**: 2026-02-09  
**작성자**: 써니봇2
