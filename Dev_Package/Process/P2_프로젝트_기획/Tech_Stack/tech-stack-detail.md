# 기술 스택 상세

> **프로젝트**: AI 챗봇 & 아바타 개발 프로젝트
> **작성일**: 2026-02-09
> **작성자**: 써니봇2

---

## 📚 기술 스택 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                    프론트엔드 (Web)                      │
│  React 18 + Vite + Three.js + Tailwind CSS              │
└─────────────────────────────────────────────────────────┘
                         ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────┐
│                     백엔드 API                           │
│  Python 3.11 + FastAPI + WebSocket                      │
└─────────────────────────────────────────────────────────┘
                         ↕
┌──────────────┬──────────────┬───────────────────────────┐
│  AI/ML       │  데이터베이스 │   외부 서비스            │
│  Claude      │  PostgreSQL  │   ElevenLabs (TTS)       │
│  Gemini      │  Redis       │   Ready Player Me        │
│  Pinecone    │              │                          │
└──────────────┴──────────────┴───────────────────────────┘
```

---

## 🤖 AI/ML 스택

### Claude API (Anthropic)
**버전**: Opus 4.6, Sonnet 4.5

**용도**:
- 메인 챗봇 엔진
- 서브에이전트 시스템
- 코드 생성

**구현**:
```python
# config/ai.py
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def chat_stream(messages: list):
    async with client.messages.stream(
        model="claude-sonnet-4-5",
        max_tokens=4096,
        messages=messages
    ) as stream:
        async for text in stream.text_stream:
            yield text
```

**비용 (예상)**:
- Opus: $15/1M input, $75/1M output
- Sonnet: $3/1M input, $15/1M output
- 월 예상 비용: $2K - $5K (1,000 사용자 기준)

---

### Gemini API (Google)
**버전**: 2.5 Flash, Flash 1.5

**용도**:
- 빠른 콘텐츠 생성
- 브레인스토밍
- 보조 작업

**구현**:
```bash
# Gemini CLI 사용
gemini "콘텐츠 생성 프롬프트"
gemini --output-format json "JSON 형식 응답"
```

**비용 (예상)**:
- 매우 저렴 (Claude 대비 1/10)
- 월 예상 비용: $200 - $500

---

### Pinecone (벡터 DB)
**용도**:
- 대화 히스토리 검색
- 의미 기반 검색
- 컨텍스트 관리

**구현**:
```python
import pinecone

pinecone.init(
    api_key=os.getenv("PINECONE_API_KEY"),
    environment="us-west1-gcp"
)

index = pinecone.Index("chatbot-memory")

# 임베딩 저장
index.upsert(vectors=[
    {"id": "msg-123", "values": embedding, "metadata": {...}}
])

# 유사도 검색
results = index.query(vector=query_embedding, top_k=5)
```

**비용**:
- Starter: $0 (100K vectors)
- Standard: $70/월 (1M vectors)

---

## 💻 백엔드 스택

### Python 3.11+
**선택 이유**:
- AI/ML 라이브러리 풍부
- FastAPI 고성능
- 타입 힌트 지원

---

### FastAPI
**버전**: 0.110+

**특징**:
- 빠른 성능 (Starlette 기반)
- 자동 API 문서화 (Swagger, ReDoc)
- 비동기 지원
- WebSocket 지원

**프로젝트 구조**:
```
src/backend/
├── app/
│   ├── main.py              # FastAPI 앱
│   ├── api/
│   │   └── v1/
│   │       ├── chat.py      # 채팅 API
│   │       ├── auth.py      # 인증
│   │       └── user.py      # 사용자
│   ├── models/              # Pydantic 모델
│   ├── services/            # 비즈니스 로직
│   │   ├── chatbot.py
│   │   ├── emotion.py
│   │   └── avatar.py
│   ├── db/                  # 데이터베이스
│   │   ├── models.py        # SQLAlchemy 모델
│   │   └── database.py
│   └── config.py
├── requirements.txt
└── Dockerfile
```

**주요 엔드포인트**:
```python
@app.post("/api/v1/chat")
async def chat(message: str, user_id: str):
    # 챗봇 처리
    pass

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    # 실시간 채팅
    pass

@app.get("/api/v1/conversations")
async def get_conversations(user_id: str):
    # 대화 목록
    pass
```

---

### PostgreSQL 15
**용도**:
- 사용자 데이터
- 대화 히스토리
- 챗봇 설정

**스키마**:
```sql
-- users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    chatbot_type VARCHAR(50),
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

-- messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    role VARCHAR(20),  -- 'user' or 'assistant'
    content TEXT,
    emotion VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Redis 7
**용도**:
- 세션 캐싱
- 실시간 데이터
- Rate Limiting

**구현**:
```python
import redis

redis_client = redis.Redis(
    host='localhost',
    port=6379,
    decode_responses=True
)

# 세션 저장
redis_client.setex(
    f"session:{user_id}",
    3600,  # 1시간
    json.dumps(session_data)
)
```

---

## 🎨 프론트엔드 스택

### React 18+
**용도**:
- UI 컴포넌트
- 상태 관리
- 라우팅

**프로젝트 구조**:
```
src/frontend/
├── src/
│   ├── components/
│   │   ├── ChatWindow.jsx
│   │   ├── AvatarViewer.jsx
│   │   ├── InputBox.jsx
│   │   └── EmotionIndicator.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Chat.jsx
│   │   └── Settings.jsx
│   ├── hooks/
│   │   ├── useChat.js
│   │   ├── useAvatar.js
│   │   └── useWebSocket.js
│   ├── store/
│   │   └── chatStore.js
│   └── App.jsx
├── package.json
└── vite.config.js
```

---

### Three.js
**용도**:
- 3D 아바타 렌더링
- 애니메이션
- 립싱크

**구현 예시**:
```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const AvatarViewer = ({ emotion }) => {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    // 아바타 로드
    const loader = new GLTFLoader();
    loader.load('/models/avatar.glb', (gltf) => {
      scene.add(gltf.scene);
      applyEmotion(gltf.scene, emotion);
    });
    
    // 렌더링 루프
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();
  }, [emotion]);
};
```

---

### Tailwind CSS
**용도**:
- 유틸리티 우선 스타일링
- 반응형 디자인

**설정**:
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
      },
    },
  },
}
```

---

### Zustand (상태 관리)
**용도**:
- 전역 상태
- 채팅 상태

**구현**:
```javascript
import create from 'zustand';

const useChatStore = create((set) => ({
  messages: [],
  currentEmotion: 'neutral',
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  setEmotion: (emotion) => set({ currentEmotion: emotion }),
}));
```

---

### Vite
**용도**:
- 빌드 도구
- 개발 서버
- HMR

**설정**:
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
```

---

## 🎭 아바타/그래픽 스택

### Ready Player Me
**용도**:
- 아바타 생성 (무료)
- GLB/GLTF 내보내기

**통합**:
```html
<iframe
  src="https://demo.readyplayer.me/avatar?frameApi"
  allow="camera *; microphone *"
/>
```

---

### Mixamo
**용도**:
- 무료 애니메이션
- 립싱크 기본 동작

---

## 🚀 DevOps 스택

### Docker
**Dockerfile (백엔드)**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### GitHub Actions (CI/CD)
**.github/workflows/test.yml**:
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run tests
        run: pytest
```

---

### Vercel (프론트엔드 배포)
**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.example.com/api/$1" }
  ]
}
```

---

## 📊 모니터링 & 로깅

### Sentry
**용도**:
- 에러 트래킹
- 성능 모니터링

---

### Prometheus + Grafana
**용도**:
- 메트릭 수집
- 대시보드

---

## 💰 예상 비용 (월)

| 항목 | 비용 (MVP) | 비용 (성장기) |
|------|-----------|--------------|
| Claude API | $2K - $5K | $10K - $20K |
| Gemini API | $200 - $500 | $1K - $2K |
| Pinecone | $0 - $70 | $70 - $200 |
| PostgreSQL (RDS) | $50 - $100 | $200 - $500 |
| Redis | $30 - $50 | $100 - $200 |
| 서버 (AWS/GCP) | $200 - $500 | $1K - $2K |
| CDN | $50 - $100 | $200 - $500 |
| **총계** | **$2.5K - $6.3K** | **$12.5K - $25.4K** |

---

**작성일**: 2026-02-09  
**버전**: 1.0  
**작성자**: 써니봇2
