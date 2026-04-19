# My Chatbot World — 코코봇 월드 (CoCoBot World)

> AI 챗봇을 만들고 공유·거래하는 플랫폼

**Live**: https://mychatbot.world

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)

---

## 핵심 기능

- **코코봇 생성**: 템플릿/프롬프트/지식베이스(KB) 기반 8-step 빌더
- **마켓플레이스**: 공식/회원 제작 스킬 설치·공유
- **채팅**: Wiki-First RAG + Multi-Model (OpenRouter 라우팅)
- **커뮤니티**: 게시판, 갤러리, 댓글, 좋아요
- **크레딧**: 무통장 입금·구독·과금 (1 크레딧 = 1원)
- **Inheritance**: 대화 이력 상속/이관 (보험사 연계)
- **Jobs**: AI 에이전트 매칭 마켓

---

## 빠른 시작

### 요구사항
- Node.js 18+
- Supabase 계정 (DB / Auth / Storage)
- OpenRouter API Key (AI 라우팅)

### 설치

```bash
git clone https://github.com/<user>/mychatbot-world.git
cd mychatbot-world
npm install
```

### 환경변수

```bash
cp .env.example .env.local
# .env.local 열어서 Supabase / OpenRouter / Upstash / 결제 정보 채우기
```

필수 키: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`.

전체 목록은 [`.env.example`](./.env.example) 참조.

### 개발 서버

```bash
npm run dev           # http://localhost:3000
npm run typecheck     # tsc --noEmit
npm run build         # 프로덕션 빌드
```

---

## 배포

### Vercel (권장)

```bash
vercel --prod
```

환경변수는 Vercel 대시보드 → Project Settings → Environment Variables 에 설정.

### 헬스체크

```bash
curl https://mychatbot.world/api/health
# 200 { status: 'ok', checks: { env: 'ok', supabase: 'ok' } }
```

---

## 아키텍처

| 레이어 | 기술 |
|-------|------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind |
| Backend | Next.js API Routes (Serverless on Vercel Edge / Node) |
| DB | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (Email + OAuth: Google, Kakao) |
| AI | OpenRouter (Claude/GPT/Gemini 라우팅), OpenAI, Upstage Vision |
| Storage | Supabase Storage |
| Cache / Rate Limit | Upstash Redis |

---

## 문서

- [`TASK_PLAN.md`](./TASK_PLAN.md) — SAL Grid 태스크 관리 (S1~S6)
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — 배포 가이드
- [`grid_records/`](./grid_records/) — 각 Task별 실행/검증 기록

---

## 라이선스

Proprietary. Contact ops@mychatbot.world for licensing.
