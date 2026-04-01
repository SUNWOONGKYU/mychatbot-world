# AI 아바타 챗봇 - 설치 및 사용 가이드

## 소개
음성 대화가 가능한 AI 아바타 챗봇입니다.
6개 페르소나, 5개 AI 모델(GPT-4o, Gemini 3 Pro, Claude, Perplexity, 무료모델)을 지원합니다.

---

## 필요한 것
- GitHub 계정
- Vercel 계정 (무료)
- OpenRouter 계정 (https://openrouter.ai)

---

## 설치 과정

### 1단계: 소스코드 가져오기

GitHub에서 Fork 또는 Clone합니다.

```bash
git clone https://github.com/SUNWOONGKYU/ai_avatar_chat.git
```

### 2단계: OpenRouter API 키 발급

1. https://openrouter.ai 가입
2. Dashboard → API Keys → Create Key
3. 발급된 API 키를 복사해둡니다

### 3단계: Vercel 배포

1. https://vercel.com 가입 (GitHub 계정으로 로그인)
2. "New Project" 클릭
3. GitHub 저장소 연결 (fork한 저장소 선택)
4. **Settings → Environment Variables**에서 아래 설정:

```
OPENROUTER_API_KEY = 본인의 OpenRouter API 키
```

5. Deploy 클릭 → 배포 완료

### 4단계: 사용

배포된 URL로 접속하면 바로 사용 가능합니다.

---

## 커스터마이즈

### 페르소나 변경
`docs/index.html`에서 personas 객체를 수정합니다.

```javascript
'customer-service': {
    icon: '👨',
    avatar: '👨',
    name: '원하는 이름',
    greeting: '인사말',
    systemPrompt: 'AI에게 부여할 역할과 성격',
    voice: 'Korean Male',  // 또는 'Korean Female'
    rate: 0.9,              // 음성 속도 (0.5~1.5)
    pitch: 0.8              // 음높이 (0.5~1.5)
}
```

### AI 모델 변경
`api/chat.js`에서 models 배열을 수정합니다.

```javascript
const models = [
    'openai/gpt-4o',
    'google/gemini-3-pro-preview',
    'perplexity/sonar',
    'anthropic/claude-sonnet-4.5',
    'openrouter/free'
];
```

사용 가능한 모델 목록: https://openrouter.ai/models

### 지식베이스 추가 (선택)
Supabase를 연결하면 자체 지식베이스 기반 답변이 가능합니다.

1. https://supabase.com 가입 (무료)
2. 프로젝트 생성
3. Vercel 환경변수에 추가:

```
SUPABASE_URL = Supabase 프로젝트 URL
SUPABASE_ANON_KEY = Supabase anon 키
```

---

## 프로젝트 구조

```
ai_avatar_chat/
├── docs/
│   └── index.html    ← 프론트엔드 (UI, TTS, 페르소나)
├── api/
│   ├── chat.js       ← AI 대화 API (OpenRouter)
│   └── tts.js        ← 음성 생성 API (선택)
├── package.json
└── vercel.json
```
