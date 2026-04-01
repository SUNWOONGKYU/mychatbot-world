# 빠른 실행 가이드

## 🚀 방법 1: 백엔드만 실행 (API 문서 확인)

### 1단계: Python 가상환경 설정
```bash
cd C:\ai-chatbot-avatar-project\src\backend
python -m venv venv
venv\Scripts\activate
```

### 2단계: 패키지 설치
```bash
pip install -r requirements.txt
```

### 3단계: 환경 변수 설정
```bash
copy .env.sample .env
```

`.env` 파일 편집 (최소 설정):
```
SECRET_KEY=your-secret-key-change-this-min-32-characters-long
DEBUG=true
```

### 4단계: 서버 실행
```bash
uvicorn app.main:app --reload
```

### 5단계: 브라우저에서 확인
- **API 문서**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **API v1**: http://localhost:8000/api/v1/

---

## 🐳 방법 2: Docker Compose (전체 실행)

### 1단계: 환경 변수 설정
루트 디렉토리에 `.env` 파일 생성:
```bash
ANTHROPIC_API_KEY=your-api-key-here
```

### 2단계: Docker Compose 실행
```bash
cd C:\ai-chatbot-avatar-project
docker-compose up
```

### 3단계: 접속
- **백엔드 API**: http://localhost:8000/docs
- **프론트엔드**: http://localhost:5173
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 📱 방법 3: 프론트엔드만 실행

### 1단계: Node 패키지 설치
```bash
cd C:\ai-chatbot-avatar-project\src\frontend
npm install
```

### 2단계: 개발 서버 실행
```bash
npm run dev
```

### 3단계: 접속
- http://localhost:5173

---

## 🔍 생성된 파일 확인

### 백엔드 주요 파일
```
src/backend/
├── app/
│   ├── main.py              ← FastAPI 앱
│   ├── config.py            ← 설정
│   ├── api/v1/              ← API 엔드포인트
│   │   ├── auth.py          ← 인증
│   │   ├── chat.py          ← 채팅
│   │   ├── conversations.py ← 대화 관리
│   │   └── websocket.py     ← WebSocket
│   ├── services/            ← 비즈니스 로직
│   │   ├── chatbot.py       ← Claude 통합
│   │   ├── emotion.py       ← 감정 분석
│   │   └── stt.py           ← 음성 인식
│   ├── security/            ← 보안
│   │   ├── jwt.py           ← JWT 토큰
│   │   └── password.py      ← 비밀번호
│   └── schemas/             ← 데이터 모델
└── tests/                   ← 테스트

```

### 프론트엔드 주요 파일
```
src/frontend/
├── src/
│   ├── components/
│   │   ├── ChatWindow.jsx        ← 채팅 창
│   │   ├── Message.jsx           ← 메시지 버블
│   │   ├── InputBox.jsx          ← 입력창
│   │   ├── AvatarViewer.jsx      ← 3D 아바타
│   │   ├── PersonaSelector.jsx   ← 페르소나 선택
│   │   └── VoiceInput.jsx        ← 음성 입력
│   ├── App.jsx                   ← 메인 앱
│   └── main.jsx                  ← 엔트리
├── package.json
└── vite.config.js
```

---

## ✅ 확인 체크리스트

### 백엔드 확인
- [ ] uvicorn 서버 시작 성공
- [ ] http://localhost:8000/health → `{"status": "healthy"}`
- [ ] http://localhost:8000/docs → Swagger UI 표시
- [ ] API 엔드포인트 목록 확인

### 프론트엔드 확인
- [ ] npm run dev 실행 성공
- [ ] http://localhost:5173 → 화면 표시
- [ ] 채팅 UI 렌더링
- [ ] 3D 아바타 표시

### 통합 확인
- [ ] 프론트엔드에서 메시지 입력
- [ ] 백엔드 API 호출
- [ ] 응답 표시

---

## 🐛 문제 해결

### Python 패키지 설치 오류
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Node 패키지 설치 오류
```bash
npm cache clean --force
npm install
```

### Docker 오류
```bash
docker-compose down -v
docker-compose up --build
```

---

**생성일**: 2026-02-09  
**프로젝트**: AI Avatar Chat Platform
