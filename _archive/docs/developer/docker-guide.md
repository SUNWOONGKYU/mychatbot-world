# Docker 사용 가이드

Docker를 사용한 AI Avatar Chat Platform 실행 가이드입니다.

---

## 🚀 빠른 시작

### 1. Docker 설치

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac)
- Docker Engine (Linux)

### 2. 환경 변수 설정

루트 디렉토리에 `.env` 파일 생성:

```bash
# AI API Keys
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 3. 컨테이너 실행

```bash
# 모든 서비스 시작
docker-compose up

# 백그라운드 실행
docker-compose up -d

# 빌드 강제
docker-compose up --build
```

### 4. 접속

- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin** (optional): http://localhost:5050

---

## 🐳 Docker Compose 서비스

### backend (FastAPI)
- **Port**: 8000
- **Dependencies**: postgres, redis
- **Hot Reload**: 개발 모드에서 활성화

### postgres (PostgreSQL 15)
- **Port**: 5432
- **User**: postgres
- **Password**: postgres
- **Database**: chatbot_db
- **Volume**: `postgres_data`

### redis (Redis 7)
- **Port**: 6379
- **Persistence**: AOF 활성화
- **Volume**: `redis_data`

### pgAdmin (optional)
- **Port**: 5050
- **Email**: admin@example.com
- **Password**: admin
- **Profile**: `dev-tools`

---

## 📋 주요 명령어

### 서비스 관리

```bash
# 시작
docker-compose up

# 중지
docker-compose down

# 중지 + 볼륨 삭제
docker-compose down -v

# 재시작
docker-compose restart

# 특정 서비스만 시작
docker-compose up backend
docker-compose up postgres redis
```

### 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs backend
docker-compose logs postgres

# 실시간 로그 (tail -f)
docker-compose logs -f backend
```

### 컨테이너 접속

```bash
# Backend 컨테이너 쉘
docker-compose exec backend bash

# PostgreSQL 접속
docker-compose exec postgres psql -U postgres -d chatbot_db

# Redis CLI
docker-compose exec redis redis-cli
```

### 빌드 및 정리

```bash
# 이미지 재빌드
docker-compose build

# 특정 서비스 빌드
docker-compose build backend

# 사용하지 않는 이미지/컨테이너 정리
docker system prune -a

# 볼륨 정리 (주의: 데이터 삭제됨)
docker volume prune
```

---

## 🔧 개발 환경 설정

### Hot Reload

개발 모드에서는 코드 변경 시 자동으로 서버가 재시작됩니다.

```yaml
volumes:
  - ./src/backend:/app  # 로컬 코드를 컨테이너에 마운트
```

### 데이터베이스 마이그레이션

```bash
# 컨테이너 내에서 마이그레이션 실행
docker-compose exec backend alembic upgrade head

# 새 마이그레이션 생성
docker-compose exec backend alembic revision -m "add_new_table"

# 마이그레이션 히스토리
docker-compose exec backend alembic history
```

### 테스트 실행

```bash
# pytest 실행
docker-compose exec backend pytest

# 커버리지 포함
docker-compose exec backend pytest --cov=app
```

---

## 🏗️ 프로덕션 배포

### 프로덕션 설정 사용

```bash
# 프로덕션 설정 오버라이드
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 환경 변수 필수 (.env 파일)
# DATABASE_URL, REDIS_URL, SECRET_KEY, etc.
```

### 프로덕션 환경 변수

```env
DATABASE_URL=postgresql://user:password@db.example.com:5432/chatbot_prod
REDIS_URL=redis://:password@redis.example.com:6379/0
SECRET_KEY=your-super-secure-production-secret-key
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DEBUG=false
ENVIRONMENT=production
```

---

## 🔍 트러블슈팅

### "Port already in use" 에러

```bash
# 포트 사용 중인 프로세스 찾기
# Windows:
netstat -ano | findstr :8000

# macOS/Linux:
lsof -i :8000

# 포트 변경 (docker-compose.yml)
ports:
  - "8001:8000"  # 외부:내부
```

### 데이터베이스 연결 실패

```bash
# 컨테이너 상태 확인
docker-compose ps

# 헬스체크 확인
docker inspect chatbot-postgres | grep -A 10 Health

# 로그 확인
docker-compose logs postgres
```

### 볼륨 초기화

```bash
# 모든 데이터 삭제 후 재시작
docker-compose down -v
docker-compose up
```

### 이미지 빌드 캐시 문제

```bash
# 캐시 무시하고 빌드
docker-compose build --no-cache

# 또는
docker-compose up --build --force-recreate
```

---

## 📚 참고 자료

- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- 프로젝트 백엔드 문서: `src/backend/README.md`

---

**작성일**: 2026-02-09  
**버전**: 1.0
