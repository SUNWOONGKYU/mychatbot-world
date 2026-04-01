# 🔑 API 키 설정 가이드

## 📋 준비된 파일

**환경 변수 파일**: `src/backend/.env`

---

## 🎯 API 키 붙여넣기

### 1. 파일 열기

```bash
# VS Code로 열기 (추천)
code C:\ai-chatbot-avatar-project\src\backend\.env

# 또는 메모장
notepad C:\ai-chatbot-avatar-project\src\backend\.env
```

### 2. API 키 입력

파일에서 이 부분을 찾아서 실제 키를 붙여넣으세요:

```env
# AI API Keys - 여기에 API 키를 붙여넣으세요! 👇
ANTHROPIC_API_KEY=여기에_Anthropic_키_붙여넣기
GEMINI_API_KEY=여기에_Gemini_키_붙여넣기
OPENAI_API_KEY=여기에_OpenAI_키_붙여넣기
```

**예시**:
```env
ANTHROPIC_API_KEY=sk-ant-api03-abc123xyz...
GEMINI_API_KEY=AIzaSyABC123XYZ...
OPENAI_API_KEY=sk-proj-abc123...
```

### 3. 저장하기

- **Ctrl + S** (저장)
- 파일 닫기

---

## ✅ 확인 방법

API 키가 제대로 설정되었는지 확인:

```bash
cd C:\ai-chatbot-avatar-project\src\backend
python -c "from app.config import settings; print('Anthropic:', 'OK' if settings.ANTHROPIC_API_KEY else 'Missing'); print('Gemini:', 'OK' if settings.GEMINI_API_KEY else 'Missing')"
```

---

## 🚀 백엔드 실행

API 키 설정 후 백엔드 실행:

```bash
cd C:\ai-chatbot-avatar-project\src\backend

# 가상환경 활성화 (처음만)
python -m venv venv
venv\Scripts\activate

# 패키지 설치 (처음만)
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload
```

**접속**: http://localhost:8000/docs

---

## 🧪 API 키 테스트

백엔드가 실행되면 Swagger UI에서 테스트:

1. http://localhost:8000/docs 접속
2. `/api/v1/chat/` 엔드포인트 클릭
3. "Try it out" 클릭
4. 메시지 입력:
   ```json
   {
     "message": "안녕하세요",
     "persona_id": "business-assistant"
   }
   ```
5. "Execute" 클릭
6. 응답 확인!

---

## 📁 파일 위치

```
C:\ai-chatbot-avatar-project\
└── src\
    └── backend\
        ├── .env              ← API 키 여기에 입력! ⭐
        ├── .env.sample       (템플릿)
        └── app\
            └── config.py     (설정 로드)
```

---

## ⚠️ 보안 주의사항

- ✅ `.env` 파일은 **절대 Git에 커밋하지 마세요**
- ✅ 이미 `.gitignore`에 추가되어 있습니다
- ✅ API 키는 **비밀**로 유지하세요
- ✅ 공개 저장소에 업로드하지 마세요

---

## 🔑 API 키 얻는 방법

### Anthropic (Claude)
1. https://console.anthropic.com/ 접속
2. "API Keys" 메뉴
3. "Create Key" 클릭
4. 키 복사

### Google Gemini
1. https://makersuite.google.com/app/apikey 접속
2. "Create API Key" 클릭
3. 키 복사

### OpenAI (선택)
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 키 복사

---

## 💰 무료 사용량

- **Anthropic Claude**: $5 무료 크레딧
- **Google Gemini**: 무료 티어 (일일 한도)
- **OpenAI**: $5 무료 크레딧 (신규 가입)

---

**준비 완료!** 이제 API 키를 붙여넣으세요! 🚀
