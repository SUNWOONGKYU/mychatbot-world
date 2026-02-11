# Developer Contributing Guide

개발자를 위한 상세 기여 가이드입니다.

---

## 🏗️ 아키텍처 개요

### 백엔드
- **Framework**: FastAPI
- **Database**: PostgreSQL + Alembic
- **Cache**: Redis
- **AI**: Claude (Anthropic), Whisper (OpenAI)

### 프론트엔드
- **Framework**: React 18 + Vite
- **3D**: Three.js + React Three Fiber
- **State**: Zustand
- **Styling**: Tailwind CSS

---

## 📂 프로젝트 구조

```
ai-chatbot-avatar-project/
├── src/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/     # API 엔드포인트
│   │   │   ├── services/   # 비즈니스 로직
│   │   │   ├── models/     # DB 모델
│   │   │   ├── schemas/    # Pydantic 스키마
│   │   │   └── security/   # 인증/보안
│   │   ├── tests/          # 테스트
│   │   └── alembic/        # DB 마이그레이션
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/ # React 컴포넌트
│       │   ├── pages/      # 페이지
│       │   └── stores/     # 상태 관리
│       └── public/         # 정적 파일
│
├── docs/                   # 문서
├── infrastructure/         # Terraform
└── Dev_Package/           # SAL Grid 시스템
```

---

## 🔧 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/your-org/ai-chatbot-avatar-project.git
cd ai-chatbot-avatar-project
```

### 2. 백엔드 설정
```bash
cd src/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.sample .env  # 환경 변수 설정
alembic upgrade head
```

### 3. 프론트엔드 설정
```bash
cd src/frontend
npm install
```

### 4. 실행
```bash
# 백엔드 (터미널 1)
cd src/backend
uvicorn app.main:app --reload

# 프론트엔드 (터미널 2)
cd src/frontend
npm run dev
```

---

## 🧪 테스트

```bash
# 백엔드 테스트
cd src/backend
pytest --cov=app

# 프론트엔드 테스트
cd src/frontend
npm test

# E2E 테스트
playwright test
```

---

## 📝 코딩 스타일

### Python
- **Formatter**: Black (line length 88)
- **Linter**: Flake8
- **Type Checker**: MyPy
- **Imports**: isort

### JavaScript/React
- **Formatter**: Prettier
- **Linter**: ESLint
- **Naming**: camelCase (함수), PascalCase (컴포넌트)

---

## 🔀 Git Workflow

1. **Feature 브랜치 생성**
   ```bash
   git checkout -b feature/S2BA1-chat-api
   ```

2. **개발 & 커밋**
   ```bash
   git add .
   git commit -m "feat(S2BA1): Add chat API endpoint"
   ```

3. **Push & PR**
   ```bash
   git push origin feature/S2BA1-chat-api
   ```

4. **PR 생성** → GitHub

5. **코드 리뷰** → 승인

6. **Merge** → `develop` 브랜치

---

## 🎯 우선순위

1. **필수 (Priority A)**: MVP 기능
2. **중요 (Priority B)**: 확장 기능
3. **유용 (Priority C)**: 고급 기능

---

**질문이 있으신가요?** GitHub Discussions 또는 Discord
