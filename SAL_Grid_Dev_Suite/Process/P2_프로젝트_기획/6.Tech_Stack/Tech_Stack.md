# My Chatbot World — 기술 스택

> 작성일: 2026-03-31

---

## 현재 스택 (Vanilla)

| 계층 | 기술 | 비고 |
|------|------|------|
| **Frontend** | HTML5 + CSS3 + Vanilla JS | 52 페이지, 22 JS, 13 CSS |
| **Backend** | Vercel Serverless Functions (Node.js) | 33 API 엔드포인트 |
| **Database** | Supabase (PostgreSQL + Auth + Storage) | 6 메인 테이블 |
| **AI** | OpenRouter (멀티 AI 라우팅) | GPT-4, Claude, Gemini 등 |
| **TTS/STT** | 외부 API (tts-proxy) | Docker 컨테이너 |
| **Deploy** | Vercel | mychatbot.world |
| **Domain** | mychatbot.world | Vercel 연결 |
| **Monitoring** | Vercel Analytics | 기본 |

## 전환 목표 스택 (React/Next.js)

| 계층 | 기술 | 전환 사유 |
|------|------|----------|
| **Frontend** | Next.js 15+ (App Router) | SSR/SSG, 성능, SEO |
| **UI** | React 19+ / Tailwind CSS | 컴포넌트 재사용, 유지보수 |
| **State** | React Context / Zustand | 전역 상태 관리 |
| **Backend** | Next.js API Routes | Vercel Serverless 유지 |
| **Database** | Supabase | 변경 없음 |
| **AI** | OpenRouter | 변경 없음 |
| **Deploy** | Vercel | 변경 없음 |

## 전환 전략: 점진적 마이그레이션

```
Phase 1: Next.js 프로젝트 초기화 + 공통 레이아웃
Phase 2: 핵심 페이지 전환 (Landing, Create, Bot, Home)
Phase 3: 확장 페이지 전환 (School, Skills, Jobs, Community)
Phase 4: 나머지 (Business, MyPage, Guest) + 정리
```

## 의존성 패키지

### 현재 (package.json)

| 패키지 | 용도 |
|--------|------|
| @supabase/supabase-js | DB/Auth |
| @xsai/generate-text | AI 텍스트 생성 |
| @xsai/providers | AI 프로바이더 |
| form-data | 파일 업로드 |
| vitest | 테스트 |

### 추가 예정 (React 전환)

| 패키지 | 용도 |
|--------|------|
| next | React 프레임워크 |
| react, react-dom | UI 라이브러리 |
| tailwindcss | 스타일링 |
| typescript | 타입 안전성 |
