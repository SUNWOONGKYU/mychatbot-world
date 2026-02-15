# AI 통합 아키텍처 — 원소스 멀티유즈

> 작성일: 2026-02-15
> 핵심 원칙: 하나의 소스, 여러 채널 (플랫폼 + 텔레그램 + 음성)

---

## 1. 설계 원칙

- **원소스 멀티유즈**: 동일한 AI 모델 스택을 모든 채널에서 공유
- **가성비 최적화**: 최고 모델 바로 밑 단계, 비용 대비 성능 최우선
- **OpenRouter 게이트웨이**: 단일 API 키로 여러 AI 제공사 접근
- **폴백 체인**: 1순위 실패 시 자동으로 다음 모델 시도
- **음성 통합**: STT/TTS도 플랫폼과 텔레그램이 동일한 서비스 사용

---

## 2. 통합 모델 스택 (채팅)

### 가성비 순서 — 모든 채널 공통

| 순위 | 모델 ID | 표시 이름 | 특징 |
|------|---------|-----------|------|
| 1순위 | `google/gemini-2.5-flash` | Gemini 2.5 Flash | 가성비 최강, 빠른 응답 |
| 2순위 | `openai/gpt-4o` | GPT-4o | 안정적 범용, 높은 품질 |
| 3순위 | `anthropic/claude-sonnet-4.5` | Claude Sonnet 4.5 | 고품질 대안, 세밀한 이해력 |
| 4순위 | `deepseek/deepseek-chat` | DeepSeek V3 | 저비용 백업, 코딩에 강함 |

### 특수 모델

| 용도 | 모델 ID | 비고 |
|------|---------|------|
| 인터넷 검색 | `perplexity/sonar` | 텔레그램 `/search` 전용 |
| 무료 폴백 | `openrouter/free` | API 키 없을 때 / 최후 수단 |

### 설정 소스 (원소스)

```
클라이언트: js/app.js → MCW.models.chat[]
서버 API:   각 파일 내 MODEL_STACK[] (동일 값)
```

---

## 3. 음성 통합 아키텍처 (STT + TTS)

### STT (음성→텍스트)

| 구분 | 서비스 | 모델 | 비용 |
|------|--------|------|------|
| 기본 | OpenAI Whisper | `whisper-1` | $0.006/분 |
| 폴백 (플랫폼) | Browser SpeechRecognition | - | 무료 |

```
플랫폼 경로:   브라우저 → /api/stt → Whisper → 텍스트
              (폴백: 브라우저 SpeechRecognition)

텔레그램 경로: .ogg 파일 → Whisper API → 텍스트
              (api/telegram.js 내 직접 호출)
```

### TTS (텍스트→음성)

| 구분 | 서비스 | 모델 | 비용 |
|------|--------|------|------|
| 기본 | OpenAI TTS | `tts-1` | $15/1M자 |
| 폴백 1 (플랫폼) | Google Translate TTS | - | 무료 |
| 폴백 2 (플랫폼) | Browser SpeechSynthesis | - | 무료 |

```
플랫폼 경로:   /api/tts → OpenAI TTS-1 → MP3 → 재생
              (폴백: Google Translate TTS → SpeechSynthesis)

텔레그램 경로: (현재 텍스트만 전송, 향후 음성 메시지 전송 가능)
```

### 음성 설정 (원소스)

```js
// js/app.js
MCW.models = {
  stt: 'whisper-1',      // OpenAI Whisper
  tts: 'tts-1',          // OpenAI TTS-1
  ttsVoice: 'alloy',     // 기본 음성
};
```

---

## 4. API 엔드포인트 구조

| 엔드포인트 | 기능 | AI 서비스 | API 키 |
|-----------|------|-----------|--------|
| `POST /api/chat` | 채팅 응답 | OpenRouter (4모델 폴백) | OPENROUTER_API_KEY |
| `POST /api/create-bot` | 봇 생성 (인사말+FAQ) | OpenRouter (4모델 폴백) | OPENROUTER_API_KEY |
| `POST /api/telegram` | 텔레그램 웹훅 | OpenRouter (5모델+폴백) | OPENROUTER_API_KEY |
| `POST /api/tts` | 텍스트→음성 | OpenAI TTS-1 | OPENAI_API_KEY |
| `POST /api/stt` | 음성→텍스트 | OpenAI Whisper | OPENAI_API_KEY |

### 필요한 환경변수 (Vercel)

| 키 | 용도 |
|----|------|
| `OPENROUTER_API_KEY` | 모든 채팅 AI (OpenRouter 게이트웨이) |
| `OPENAI_API_KEY` | 음성 전용 (Whisper STT + TTS-1) |
| `SUPABASE_URL` | 데이터베이스 |
| `SUPABASE_ANON_KEY` | 데이터베이스 |

---

## 5. 채널별 동작 흐름

### 플랫폼 (웹 브라우저)

```
사용자 입력 (텍스트/음성)
    │
    ├─ 텍스트: 직접 전송
    └─ 음성: SpeechRecognition (폴백) / MediaRecorder → /api/stt (Whisper)
           │
           ▼
      /api/chat (서버) ← OpenRouter
        │ 모델 폴백: Gemini Flash → GPT-4o → Sonnet 4.5 → DeepSeek V3
        ▼
      AI 응답 텍스트
        │
        ├─ 화면 표시
        └─ TTS 재생: /api/tts (OpenAI TTS-1)
                      → 폴백: Google Translate TTS
                      → 폴백: SpeechSynthesis
```

### 텔레그램

```
사용자 메시지 (텍스트/음성)
    │
    ├─ 텍스트: 직접 처리
    └─ 음성 (.ogg): Whisper API → 텍스트 변환
           │
           ▼
      processMessage() ← OpenRouter
        │ 모델: 사용자 선택 모델 우선 → 나머지 랜덤
        │ 스택: Gemini Flash, GPT-4o, Sonnet 4.5, DeepSeek V3, Free
        ▼
      AI 응답 텍스트
        │
        └─ Telegram sendMessage()
```

---

## 6. 비용 구조 — 결제처 2곳

### 결제처 요약

| # | 결제처 | 용도 | 결제 방식 |
|---|--------|------|----------|
| 1 | **OpenRouter** | 채팅 AI 전체 (텍스트 생성) | OpenRouter 크레딧 충전 |
| 2 | **OpenAI** | 음성 전용 (STT + TTS) | OpenAI 크레딧 충전 |

> OpenRouter는 Whisper(STT)와 TTS-1 엔드포인트를 제공하지 않음
> 따라서 음성은 OpenAI 직접 결제가 필수

### 인프라 비용 (무료 플랜)

| 서비스 | 용도 | 비용 |
|--------|------|------|
| **Vercel** | 웹 호스팅 + Serverless Functions | 무료 (Hobby) |
| **Supabase** | 데이터베이스 (텔레그램 메모리, 봇 프로필) | 무료 (Free Tier) |
| **GitHub Pages** | 정적 페이지 배포 | 무료 |

### 채팅 비용 상세 (OpenRouter 크레딧)

| 모델 | 입력 비용 | 출력 비용 | 비고 |
|------|----------|----------|------|
| Gemini 2.5 Flash | ~$0.15/1M토큰 | ~$0.60/1M토큰 | 1순위, 대부분의 요청 처리 |
| GPT-4o | ~$2.50/1M토큰 | ~$10.0/1M토큰 | 2순위, Flash 실패 시만 |
| Claude Sonnet 4.5 | ~$3.00/1M토큰 | ~$15.0/1M토큰 | 3순위, 거의 안 씀 |
| DeepSeek V3 | ~$0.27/1M토큰 | ~$1.10/1M토큰 | 4순위, 최후 백업 |

> 예상: 1순위 Gemini Flash가 90%+ 처리하므로 월간 비용 매우 낮음

### 음성 비용 상세 (OpenAI 크레딧)

| 서비스 | 모델 | 비용 | 건당 추정 |
|--------|------|------|----------|
| STT | whisper-1 | $0.006/분 | 30초 음성 = $0.003 |
| TTS | tts-1 | $15/1M자 | 200자 응답 = $0.003 |

> tts-1 선택 이유: tts-1-hd ($30/1M자) 대비 절반 가격, 챗봇 용도로 충분한 품질

### 월간 비용 시뮬레이션 (사용량별)

| 규모 | 채팅 요청/월 | 음성 사용/월 | OpenRouter | OpenAI | 합계 |
|------|------------|------------|-----------|--------|------|
| 소규모 (개인) | ~1,000건 | ~100건 | ~$0.50 | ~$0.60 | **~$1.10** |
| 중규모 (소상공인) | ~10,000건 | ~1,000건 | ~$5.00 | ~$6.00 | **~$11.00** |
| 대규모 (기업) | ~100,000건 | ~10,000건 | ~$50.00 | ~$60.00 | **~$110.00** |

> 소규모 사용 시 월 $1~2 수준으로 매우 저렴

---

## 7. 파일 맵

```
js/app.js           ← MCW.models (원소스 설정)
js/chat.js          ← 클라이언트 채팅 + TTS (MCW.models 참조)
js/create.js        ← 클라이언트 봇 생성 (MCW.models 참조)

api/chat.js         ← 서버 채팅 (MODEL_STACK 동일)
api/create-bot.js   ← 서버 봇 생성 (MODEL_STACK 동일)
api/telegram.js     ← 텔레그램 웹훅 (models[] 동일)
api/tts.js          ← 서버 TTS (OpenAI TTS-1)
api/stt.js          ← 서버 STT (OpenAI Whisper)
```

---

## 8. API 키 관리

### 필요한 API 키 (총 2개)

| API 키 | 발급처 | 용도 | 설정 위치 |
|--------|--------|------|----------|
| `OPENROUTER_API_KEY` | openrouter.ai | 채팅 AI 전체 | Vercel 환경변수 + js/secrets.js |
| `OPENAI_API_KEY` | platform.openai.com | 음성 (STT/TTS) | Vercel 환경변수 |

### 키 발급 방법

**OpenRouter:**
1. https://openrouter.ai 회원가입
2. API Keys 메뉴에서 키 생성
3. Credits 메뉴에서 크레딧 충전 ($5~)

**OpenAI:**
1. https://platform.openai.com 회원가입
2. API Keys 메뉴에서 키 생성
3. Billing 메뉴에서 크레딧 충전 ($5~)

### Vercel 환경변수 설정

```
Vercel Dashboard → Settings → Environment Variables

OPENROUTER_API_KEY = sk-or-v1-...
OPENAI_API_KEY = sk-...
SUPABASE_URL = https://...supabase.co
SUPABASE_ANON_KEY = eyJ...
```

### 클라이언트 키 (개발용)

```
js/secrets.js → MCW_SECRETS.OPENROUTER_API_KEY
js/config.js  → CONFIG.OPENROUTER_API_KEY
localStorage  → mcw_openrouter_key (캐시)
```

> 프로덕션에서는 Vercel 환경변수만 사용 (서버 API 경유)
> 클라이언트 키는 개발/로컬 테스트용 폴백

---

## 9. 향후 확장 가능성

- **음성 복제**: OpenAI의 커스텀 보이스가 API로 열리면 통합 가능
- **실시간 음성 대화**: OpenAI Realtime API / gpt-4o-audio-preview
- **다국어**: Whisper가 99개 언어 지원 → 자동 다국어 STT
- **텔레그램 음성 응답**: /api/tts로 생성한 MP3를 sendVoice로 전송
- **비용 최적화**: Gemini Flash 비율 추적 → 폴백 빈도 모니터링
- **OpenRouter 음성 지원**: 향후 OpenRouter가 STT/TTS 지원하면 OpenAI 키 불필요

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-02-15 | 초안 작성 — 원소스 멀티유즈 통합 아키텍처 |
| 2026-02-15 | 결제처 2곳 (OpenRouter + OpenAI) 구분, 비용 시뮬레이션 추가 |
| 2026-02-15 | API 키 관리 섹션 추가 |
