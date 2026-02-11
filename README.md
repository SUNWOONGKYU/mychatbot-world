# AI Avatar Chat Platform

3D 아바타와 감정 표현이 가능한 AI 채팅 플랫폼입니다.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Status](https://img.shields.io/badge/status-MVP-green)

---

## 🎯 주요 기능

### ✨ 핵심 기능
- 🤖 **6가지 AI 페르소나** (비즈니스, 교육, 헬스케어 등)
- 🎭 **실시간 감정 표현** (7가지 감정)
- 👤 **3D 사람 모양 아바타** (Three.js)
- 🎤 **음성 입력** (Web Speech API)
- 💬 **실시간 채팅** (WebSocket)
- 📱 **모바일 최적화**

### 🔐 보안
- JWT 인증 (Access/Refresh Token)
- bcrypt 비밀번호 해싱
- Rate Limiting
- CORS 설정

---

## 🚀 빠른 시작

### 1. 데모 실행 (가장 빠름!)

```bash
# 데모 서버 시작
cd demo
python -m http.server 8080

# 브라우저에서 접속
# http://localhost:8080/mobile-demo.html
```

**모바일 접속**:
- QR 코드: http://localhost:8080/qr.html
- 같은 Wi-Fi 연결 필수!

### 2. 개발 환경 실행

**백엔드**:
```bash
cd src/backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**프론트엔드**:
```bash
cd src/frontend
npm install
npm run dev
```

### 3. Docker 실행

```bash
docker-compose up
```

**접속**:
- 백엔드: http://localhost:8000/docs
- 프론트엔드: http://localhost:5173
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 📁 프로젝트 구조

```
ai-chatbot-avatar-project/
├── demo/                      # 데모 HTML 파일
│   ├── mobile-demo.html       # 모바일 최적화 데모 ⭐
│   ├── voice-avatar-demo.html # 음성 입력 데모
│   └── qr.html               # QR 코드 접속 페이지
├── src/
│   ├── backend/              # FastAPI 백엔드
│   │   ├── app/
│   │   │   ├── api/v1/      # API 엔드포인트
│   │   │   ├── services/    # 비즈니스 로직
│   │   │   ├── security/    # 인증/보안
│   │   │   └── data/        # 페르소나 데이터
│   │   └── tests/           # 테스트
│   └── frontend/            # React 프론트엔드
│       └── src/
│           ├── components/  # React 컴포넌트
│           │   ├── MobileOptimized.jsx  # 모바일 뷰 ⭐
│           │   ├── VoiceInput.jsx       # 음성 입력 ⭐
│           │   └── AvatarViewer.jsx     # 3D 아바타
│           └── pages/
├── docs/                    # 문서
├── infrastructure/          # Terraform
└── Dev_Package/            # 개발 과정 기록

총 170+ 파일
```

---

## 💻 기술 스택

### AI/ML
- **Claude** (Opus 4.6, Sonnet 4.5) - 메인 챗봇
- **Gemini** (2.5 Flash) - 콘텐츠 생성
- **Whisper** - 음성 인식 (STT)
- **Web Speech API** - 브라우저 음성 인식

### 백엔드
- **Python 3.11** + **FastAPI 0.109**
- **PostgreSQL 15** (5 tables)
- **Redis 7** (캐시)
- **Alembic** (마이그레이션)
- **JWT** + **bcrypt** (인증)

### 프론트엔드
- **React 18** + **Vite**
- **Three.js** + **React Three Fiber** (3D)
- **Tailwind CSS**
- **Zustand** (상태 관리)

### DevOps
- **Docker** + **Docker Compose**
- **GitHub Actions** (CI/CD)
- **Terraform** (Infrastructure)

---

## 🎭 6가지 AI 페르소나

1. **💼 비즈니스 어시스턴트** - 일정, 이메일, 데이터 분석
2. **🎧 고객 서비스** - FAQ, 문제 해결
3. **📚 교육 튜터** - 학습 지원, 퀴즈
4. **⚕️ 헬스케어 어드바이저** - 건강 정보, 웰니스 팁
5. **🎭 엔터테인먼트 봇** - 스토리, 게임, 추천
6. **🤖 개인 비서** - 일상 지원

---

## 📱 모바일 기능

### 음성 입력
- 🎤 빨간 마이크 버튼
- 한국어 음성 인식
- 실시간 텍스트 변환

### 터치 최적화
- 큰 버튼 (손가락 친화적)
- 스와이프 스크롤
- 터치 피드백

### 반응형 디자인
- 데스크톱 / 태블릿 / 모바일
- 자동 레이아웃 전환
- 부드러운 애니메이션

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

## 🚀 배포

### Vercel (프론트엔드)
```bash
cd src/frontend
vercel --prod
```

### Railway (백엔드)
```bash
railway login
railway init
railway up
```

### AWS (Terraform)
```bash
cd infrastructure/terraform
terraform init
terraform apply
```

자세한 내용: [배포 가이드](docs/deployment/deployment-guide.md)

---

## 📚 문서

- [API 문서](docs/api/README.md)
- [사용자 가이드](docs/user-guide/getting-started.md)
- [개발자 가이드](docs/developer/CONTRIBUTING-GUIDE.md)
- [아키텍처](docs/architecture/)
- [완료 리포트](PROJECT_COMPLETION_REPORT.md)

---

## 🎯 로드맵

### ✅ Phase 1 - MVP (완료)
- [x] 6가지 페르소나
- [x] 3D 아바타
- [x] 감정 표현
- [x] 음성 입력
- [x] 모바일 최적화

### 🔄 Phase 2 - 확장 (진행 중)
- [ ] 실제 3D 모델 (GLB)
- [ ] TTS 음성 출력
- [ ] 대화 저장/불러오기
- [ ] 사용자 프로필

### 📅 Phase 3 - 고급 기능
- [ ] 다국어 지원
- [ ] 커스텀 페르소나
- [ ] 결제 시스템
- [ ] 모바일 앱

---

## 🤝 기여

기여는 언제나 환영합니다! [CONTRIBUTING.md](docs/developer/CONTRIBUTING-GUIDE.md)를 참고하세요.

---

## 📄 라이선스

MIT License

---

## 👥 팀

**프로젝트 오너**: 선웅규 (써니)  
**개발**: 써니봇2 🤖  
**방식**: Dev Package SAL Grid 시스템

---

## 📞 문의

- 이슈: [GitHub Issues](https://github.com/your-org/ai-chatbot-avatar-project/issues)
- 이메일: support@example.com
- 디스코드: [Community](https://discord.gg/your-server)

---

**⭐ 이 프로젝트가 마음에 드셨다면 Star를 눌러주세요!**

---

**마지막 업데이트**: 2026-02-09  
**버전**: 0.1.0  
**상태**: MVP 완료, 배포 준비 완료
