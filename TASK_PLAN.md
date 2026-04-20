# My Chatbot World — Task Plan

> **작성일**: 2026-03-31
> **수정일**: 2026-04-12
> **버전**: v4.1
> **프로젝트**: My Chatbot World (mychatbot.world)
> **총 Task 수**: 87개 (v4.5 Round 5 — health check 고도화)
> **아키텍처**: Vanilla → React/Next.js 점진적 전환
> **배포**: Vercel | **DB**: Supabase
> **현황**: 170+ 파일, 52페이지, 33 API 엔드포인트, 6 DB 테이블

---

## Stage별 Task 수

| Stage | 한글명 | Task 수 | 완료율 |
|-------|--------|---------|--------|
| S1 | 개발 준비 | 12 | ~50% (소급 6개 완료) |
| S2 | 핵심 기능 | 16 | ~40% (소급 3개 완료) |
| S3 | 확장 기능 | 19 | ~50% (소급 8개 완료) |
| S4 | 개발 마무리 | 15 | ~20% (소급 3개 완료) |
| S5 | 디자인 혁신 + Wiki-e-RAG | 35 | 100% (35/35 완료) |
| S6 | 사용자 플로우 E2E + 프로덕션 블로커 해결 | 11 | 91% (10/11 완료, S6QA1 Pending) |
| S7 | 프로덕션 런칭 준비 MBO | 5 | 100% (5/5 완료) |
| S8 | 프로덕션 완성도 100점 달성 MBO | 15 | 100% (15/15 완료) |
| **합계** | | **107** | **~45%** |

---

## Area별 분포 (N×11 Matrix)

| Area | S1 | S2 | S3 | S4 | S5 | S6 | 합계 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:----:|
| FE (Frontend) | 1 | 8 | 4 | 3 | 11 | 3 | 30 |
| BA (Backend APIs) | 0 | 6 | 9 | 6 | 0 | 5 | 26 |
| DB (Database) | 2 | 0 | 1 | 0 | 0 | 0 | 3 |
| SC (Security) | 1 | 0 | 1 | 0 | 0 | 0 | 2 |
| BI (Backend Infra) | 3 | 1 | 0 | 0 | 0 | 2 | 6 |
| EX (External) | 1 | 1 | 2 | 0 | 0 | 0 | 4 |
| TS (Testing) | 0 | 0 | 0 | 2 | 0 | 0 | 2 |
| DV (DevOps) | 1 | 0 | 0 | 1 | 0 | 0 | 2 |
| DS (Design) | 1 | 0 | 0 | 1 | 4 | 0 | 6 |
| DC (Documentation) | 1 | 0 | 0 | 2 | 0 | 0 | 3 |
| CS (Content System) | 1 | 0 | 2 | 0 | 0 | 0 | 3 |
| QA (Quality Assurance) | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| **합계** | **12** | **16** | **19** | **15** | **15** | **11** | **87** |

> 참고: S2는 S2FE4~FE7을 포함하면 15개, S4는 DS1+DV1 합산으로 15개. S5는 DS 4개(기획 완료 소급) + FE 10개(신규, v3.1 재구성). 위 표는 실제 task 분류 기준.

---

## S1 — 개발 준비 (12 Tasks)

> 목표: Next.js 프로젝트 셋업, 디자인 시스템, DB 스키마, 인증 인프라

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S1BI1 | Next.js 프로젝트 초기화 + Tailwind CSS 설정 | BI | — | `backend-developer-core` | Pending |
| S1BI2 | Supabase 클라이언트 + 환경변수 설정 (소급) | BI | — | `backend-developer-core` | Completed |
| S1BI3 | Vercel 배포 설정 (소급) | BI | — | `devops-troubleshooter-core` | Completed |
| S1DS1 | 디자인 시스템 구축 (Light/Dark/System 3모드) | DS | S1BI1 | `ux-ui-designer-core` | Pending |
| S1FE1 | 공통 레이아웃 + 사이드바 컴포넌트 (React) | FE | S1BI1, S1DS1 | `frontend-developer-core` | Pending |
| S1DB1 | 기본 DB 스키마 (mcw_bots, personas, kb_items, chat_logs) (소급) | DB | — | `database-developer-core` | Completed |
| S1DB2 | DB 스키마 확장 (크레딧/결제/수익/피상속 테이블) | DB | S1DB1 | `database-developer-core` | Pending |
| S1SC1 | Supabase Auth 강화 (소셜 로그인, 세션 관리) | SC | S1BI2, S1DB1 | `security-specialist-core` | Completed |
| S1DV1 | CI/CD + Pre-commit Hook 설정 (소급) | DV | — | `devops-troubleshooter-core` | Completed |
| S1EX1 | Telegram 연동 (소급) | EX | S1BI2 | `backend-developer-core` | Completed |
| S1CS1 | 직종별 템플릿 10개 (소급) | CS | S1DB1 | `content-specialist` | Completed |
| S1DC1 | API 문서 초안 (소급) | DC | — | `documentation-writer-core` | Completed |

---

## S2 — 핵심 기능 (15 Tasks)

> 목표: Create 위저드, Bot 대화, Home 대시보드 — React 전환 + API 강화

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S2BI1 | 멀티 AI 라우팅 (OpenRouter) 고도화 | BI | S1BI1, S1BI2 | `backend-developer-core` | Pending |
| S2BA1 | Create API 강화 (AI 분석 → FAQ 자동생성 → 배포 URL+QR) | BA | S1DB1, S1SC1 | `api-developer-core` | Pending |
| S2BA2 | 대화 API 강화 (페르소나 로딩, 감성슬라이더, 대화 저장) | BA | S1DB1, S2BI1 | `api-developer-core` | Pending |
| S2BA3 | Home API (KB 임베딩, 설정 저장, 클라우드 동기화) | BA | S1DB1, S1SC1 | `api-developer-core` | Pending |
| S2BA4 | 챗봇 생성 API (소급) | BA | S1DB1 | `api-developer-core` | Completed |
| S2BA5 | 대화 API 기본 (chat, chat-stream) (소급) | BA | S1DB1, S1BI2 | `api-developer-core` | Completed |
| S2BA6 | 사용량 API (소급) | BA | S1DB1, S1SC1 | `api-developer-core` | Completed |
| S2FE1 | Create 위저드 React 전환 | FE | S1FE1, S2BA1 | `frontend-developer-core` | Pending |
| S2FE2 | Bot 대화 페이지 React 전환 | FE | S1FE1, S2BA2 | `frontend-developer-core` | Pending |
| S2FE3 | Home 대시보드 React 전환 | FE | S1FE1, S2BA3 | `frontend-developer-core` | Pending |
| S2FE4 | Landing 페이지 React 전환 | FE | S1FE1, S1DS1 | `frontend-developer-core` | Pending |
| S2FE5 | Birth 페이지 React 전환 | FE | S1FE1, S2BA4 | `frontend-developer-core` | Pending |
| S2FE6 | Guest 모드 React 전환 | FE | S1FE1, S2BA5 | `frontend-developer-core` | Pending |
| S2FE7 | FAQ 관리 페이지 React 전환 | FE | S1FE1, S2BA1 | `frontend-developer-core` | Pending |
| S2EX1 | TTS/STT 연동 강화 | EX | S1EX1, S2BA2 | `backend-developer-core` | Pending |
| S2MT3 | 전역 error.tsx / not-found.tsx / loading.tsx 생성 (소급) | FE | S1BI1 | `frontend-developer-core` | Completed |

---

## S3 — 확장 기능 (18 Tasks)

> 목표: School·Skills·Jobs·Community — React 전환 + API 고도화 + 보안 강화

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S3DB1 | School/Skills/Jobs 추가 테이블 | DB | S1DB2, S2BA1 | `database-developer-core` | Pending |
| S3SC1 | API 인증 미들웨어 (Rate Limiting, CORS 강화) | SC | S1SC1, S2BA1 | `security-specialist-core` | Pending |
| S3BA1 | School API (AI 시나리오, 채점, 멘토링) | BA | S3DB1, S2BA2 | `api-developer-core` | Pending |
| S3BA2 | Skills API (런타임 실행, 결제, 리뷰) | BA | S3DB1, S3SC1 | `api-developer-core` | Pending |
| S3BA3 | Jobs API 강화 (매칭 알고리즘, 정산 20%) | BA | S3DB1, S2BA6 | `api-developer-core` | Pending |
| S3BA4 | Community API 강화 (DB 정합성, 스레딩, 실시간) | BA | S1DB1, S3SC1 | `api-developer-core` | Pending |
| S3BA5 | 학습 진도 API (소급) | BA | S1DB1 | `api-developer-core` | Completed |
| S3BA6 | 커뮤니티 API 7개 (소급) | BA | S1DB1, S1SC1 | `api-developer-core` | Completed |
| S3BA7 | Jobs API 기본 4개 (소급) | BA | S1DB1, S1SC1 | `api-developer-core` | Completed |
| S3BA8 | 스킬 API 기본 (소급) | BA | S1DB1 | `api-developer-core` | Completed |
| S3FE1 | School(학습) 페이지 React 전환 | FE | S1FE1, S3BA1 | `frontend-developer-core` | Pending |
| S3FE2 | Skills(스킬마켓) 페이지 React 전환 | FE | S1FE1, S3BA2 | `frontend-developer-core` | Pending |
| S3FE3 | Jobs(수익활동) 페이지 React 전환 | FE | S1FE1, S3BA3 | `frontend-developer-core` | Pending |
| S3FE4 | Community 페이지 React 전환 | FE | S1FE1, S3BA4 | `frontend-developer-core` | Pending |
| S3EX1 | Obsidian 연동 (소급) | EX | S1EX1 | `backend-developer-core` | Completed |
| S3EX2 | CPC 원격 실행 연동 (소급) | EX | S1BI2 | `backend-developer-core` | Completed |
| S3CS1 | 스킬 프롬프트 10개 (소급) | CS | S3DB1 | `content-specialist` | Completed |
| S3CS2 | 스킬 인테그레이션 4개 (소급) | CS | S3BA8 | `content-specialist` | Completed |
| S3PF3 | OpenRouter fetch AbortController 30초 timeout 추가 (소급) | BA | S2BA2 | `backend-developer-core` | Completed |

---

## S4 — 개발 마무리 (21 Tasks)

> 목표: Business 대시보드, 결제, 피상속, 테스트, 문서, 배포 완성 + 버그픽스/보안

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S4BA1 | 수익 API (매출·정산 조회) | BA | S3BA3, S3SC1 | `api-developer-core` | Completed |
| S4BA2 | 결제 시스템 (결제수단 관리, 크레딧) | BA | S1DB2, S3SC1 | `api-developer-core` | Pending |
| S4BA3 | 피상속 API (피상속인 지정, 동의, 전환) | BA | S1DB2, S3SC1 | `api-developer-core` | Completed |
| S4BA4 | Marketplace API (소급) | BA | S1DB1, S3SC1 | `api-developer-core` | Completed |
| S4BA5 | 피상속 API 기본 (소급) | BA | S1DB1 | `api-developer-core` | Completed |
| S4BA6 | 수익 API 기본 (소급) | BA | S1DB1, S3BA3 | `api-developer-core` | Completed |
| S4FE1 | Business(수익 대시보드) 페이지 React 전환 | FE | S1FE1, S4BA1 | `frontend-developer-core` | Completed |
| S4FE2 | MyPage 페이지 React 전환 | FE | S1FE1, S4BA3 | `frontend-developer-core` | Pending |
| S4FE3 | Marketplace 페이지 React 전환 | FE | S1FE1, S4BA4 | `frontend-developer-core` | Completed |
| S4TS1 | E2E 테스트 (Playwright) | TS | S4FE1, S4FE2, S4FE3 | `test-runner-core` | Pending |
| S4TS2 | API 단위 테스트 확장 | TS | S4BA1, S4BA2, S4BA3 | `test-runner-core` | Pending |
| S4DC1 | 사용자 가이드 작성 | DC | S4FE1, S4FE2, S4FE3 | `documentation-writer-core` | Pending |
| S4DC2 | API 문서 완성 | DC | S4BA1, S4BA2, S4BA3 | `documentation-writer-core` | Pending |
| S4DV1 | 프로덕션 배포 최적화 (성능, SEO, PWA) | DV | S4TS1, S4TS2 | `devops-troubleshooter-core` | Pending |
| S4DS1 | 반응형 QA + 접근성 검수 | DS | S4FE1, S4FE2, S4FE3 | `ux-ui-designer-core` | Pending |
| S4SC1 | API 키 하드코딩 제거 + secrets.js 정리 | SC | — | `security-specialist-core` | Completed |
| S4SC2 | mcw_chat_logs RLS 보안 강화 | SC | — | `security-specialist-core` | Completed |
| S4SC3 | STT/TTS API 인증 추가 + CORS 도메인 제한 | SC | — | `security-specialist-core` | Completed |
| S4DB2 | 테이블명 불일치 통일 (mcw_ prefix) | DB | — | `database-developer-core` | Completed |
| S4DB3 | 커뮤니티 테이블 5개 마이그레이션 추가 | DB | — | `database-developer-core` | Completed |
| S4FE4 | faq.html CSS/JS 경로 수정 | FE | — | `frontend-developer-core` | Completed |

---

## S5 — 디자인 혁신 (15 Tasks)

> 목표: 전면 리디자인 — 다크/라이트 동시 지원, 퍼플+앰버 브랜드, 4대 메뉴 체계, 마이페이지 8탭, 관리자 대시보드 8섹션
> **확정 사항 (PO 승인 2026-04-07)**: 5대 메뉴→4대 메뉴 (Learning 폐지), 마이페이지 8탭, 관리자 대시보드 8섹션

### S5 DS (Design) — 기획 (소급 완료 4개)

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S5DS1 | 네비게이션 구조 설계 | DS | S4FE3 | `ux-ui-designer-core` | Completed |
| S5DS2 | 컬러 시스템 + 디자인 토큰 정의 | DS | S4FE3 | `ux-ui-designer-core` | Completed |
| S5DS3 | 핵심 컴포넌트 디자인 스펙 | DS | S5DS1, S5DS2 | `ux-ui-designer-core` | Completed |
| S5DS4 | 페이지별 와이어프레임 레이아웃 | DS | S5DS1, S5DS2, S5DS3 | `ux-ui-designer-core` | Completed |

### S5 FE (Frontend) — 실행 (신규 11개 + S5FE11 추가)

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S5FE1 | 디자인 시스템 구현 (globals.css + tailwind.config — 다크/라이트 동시 지원) | FE | S5DS2, S5DS3 | `frontend-developer-core` | Completed |
| S5FE2 | 네비게이션 재구축 (상단바 4대 메뉴 + 모바일 탭바) | FE | S5DS1, S5FE1 | `frontend-developer-core` | Completed |
| S5FE3 | 랜딩 페이지 리디자인 | FE | S5DS4, S5FE1, S5FE2 | `frontend-developer-core` | Completed |
| S5FE4 | 4대 메뉴 페이지 리디자인 (Birth/Skills/Jobs/Community + 채팅UI) | FE | S5DS4, S5FE1, S5FE2 | `frontend-developer-core` | Completed |
| S5FE6 | 마이페이지 리디자인 — 탭1~4 (프로필/챗봇관리/챗봇학습/스킬관리) | FE | S5DS4, S5FE1, S5FE2 | `frontend-developer-core` | Completed |
| S5FE7 | 관리자 대시보드 구현 — 섹션1~4 (개요/공지/회원/결제) | FE | S5DS4, S5FE1, S5FE2 | `frontend-developer-core` | Completed |
| S5FE8 | 관리자 대시보드 구현 — 섹션5~8 (챗봇/스킬/구봇구직/커뮤니티) | FE | S5DS4, S5FE1, S5FE2, S5FE7 | `frontend-developer-core` | Completed |
| S5FE9 | 게스트 모드 리디자인 | FE | S5DS4, S5FE1, S5FE2 | `frontend-developer-core` | Completed |
| S5FE10 | 빌드 + 배포 + 크로스브라우저 QA | FE | S5FE3, S5FE4, S5FE6, S5FE7, S5FE8, S5FE9 | `devops-troubleshooter-core` | Completed |
| S5FE11 | 마이페이지 리디자인 — 탭5~8 (운영관리/상속/크레딧/보안) | FE | S5FE1, S5FE2, S5DS4 | `frontend-developer-core` | Completed |
| S5FE12 | 디자인 Quick Win 6개 적용 (CSS 변수 튜닝 — 보더/그림자/타이포/글로우/OpenType) | FE | S5FE1 | `frontend-developer-core` | Completed |

---

## S6 — 사용자 플로우 E2E 보강 + 프로덕션 블로커 해결 (11 Tasks)

> 목표: 바닐라→React 전환 과정에서 페이지 간 연결고리 누락 방지. 회원가입/로그인/결제/봇생성 핵심 플로우를 사용자 관점에서 실사용 검증. 프로덕션 블로커 전수조사·해결.
> **배경 (2026-04-20)**: `/login` 페이지에 이메일/비번 로그인 폼이 누락되고 `/signup` 진입 링크도 없었던 사고(사용자 "회원가입 기능이 없다" 제보) 재발 방지. 추가로 63개 TS 에러·미구현 엔드포인트·mock 데이터 블로커 발견·수정.

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S6FE1 | 로그인 페이지 이메일/비번 폼 + 회원가입/비번찾기 진입로 복원 | FE | S1SC1, S4GA1 | `frontend-developer-core` | Completed |
| S6QA1 | 핵심 사용자 플로우 E2E 점검 (가입→로그인→봇생성→결제→상속) | QA | S6FE1 | `qa-specialist` | Pending |
| S6BI1 | @upstash/redis 의존성 설치 + TS 타입 미스매치 일괄 해결 (ReturnType<typeof createClient> → any) | BI | — | `backend-developer-core` | Completed |
| S6BA1 | inheritance/skills/my 런타임 에러 수정 (getUserByEmail→listUsers, description→metadata.description) | BA | S6BI1 | `api-developer-core` | Completed |
| S6FE2 | Tab5Operations HiredTab mock → /api/operations/hired-bots 실 연동 | FE | — | `frontend-developer-core` | Completed |
| S6BA2 | 고객센터 문의 저장 API 신설 (POST /api/customer-service) + 폼 연동 | BA | — | `api-developer-core` | Completed |
| S6BA3 | chat/stream message 길이 캡(10k) + community POST rate-limit(20/h) | BA | — | `api-developer-core` | Completed |
| S6BA4 | 공개 API CORS 헤더 + OPTIONS preflight (bots/public) | BA | — | `api-developer-core` | Completed |
| S6FE3 | 세그먼트별 error.tsx 바운더리 (/admin, /bot/[botId], /mypage) | FE | — | `frontend-developer-core` | Completed |
| S6BA5 | skills/my N+1 쿼리 제거 (map+Promise.all → 단일 .in 쿼리) + 데드 코드 정리 | BA | — | `api-developer-core` | Completed |
| S6BI2 | /api/health 실질적 헬스체크 고도화 (env + Supabase 검증 → 200/503 분기) | BI | — | `backend-developer-core` | Completed |

---

## S7 — 프로덕션 런칭 준비 MBO (5 Tasks)

> 목표: 2026-04-20 MBO "프로덕션 완성도 극대화" — Security/Reliability/Data Integrity/Performance/Observability/UX·a11y/SEO/Infra/Documentation 9개 영역 일괄 감사 후 Critical·High 0 잔여, Medium 100% 해결.
> **배경**: 컴팩션 직전 승인된 MBO 목표서 기반. Phase A(진단) → B(분류: Critical 2 / High 10 / Medium 9) → C(실행) → D(tsc 0 + next build 클린) → E(기록) + 후속 M4·M6·M8 이월 처리 완료.

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S7PROD1 | 프로덕션 보안 강화 — 결제 상한/타임아웃/동시성 락/Rate-limit async (C1·C2·H1·H2·H3·H4·H10·M1) | SC | — | `security-specialist-core` | Completed |
| S7PROD2 | 프로덕션 UX/a11y 강화 — 옵티미스틱 롤백 + 키보드 접근성 + 모달 Escape (H5·H8·M7) | FE | — | `frontend-developer-core` | Completed |
| S7PROD3 | 프로덕션 SEO/문서 — robots.ts/sitemap.ts/.env.example/README/metadata (H6·H7·H9·M5) | DC | — | `documentation-writer-core` | Completed |
| S7PROD4 | 프로덕션 성능/운영 — 페이지네이션 + DB 인덱스 + 런타임 env 검증 (M2·M3·M9) | BI | — | `backend-developer-core` | Completed |
| S7PROD5 | 후속 처리 — img→Image 5파일 + middleware matcher/rate-limit 확장 + radio a11y + health env audit (M4·M6·M8) | FE | S7PROD1~4 | `frontend-developer-core` | Completed |

---

## S8 — 프로덕션 완성도 100점 달성 MBO (15 Tasks)

> 목표: 2026-04-20 MBO "75점 → 100점" — 9개 영역(Observability/Data Integrity/Documentation/Reliability/Performance/UX·a11y/Infra·Deploy/SEO/Security) 전수 완성.
> **배경**: S7 MBO 이후 75점 달성. 이월되었던 Sentry/E2E/RLS audit/Lighthouse 실측/Staging/JSON-LD/OpenAPI 등 전량 해소.

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S8BI1 | Sentry 통합 (error + performance + source maps) | BI | — | `backend-developer-core` | Completed |
| S8BI2 | Log Drain + 구조화 로그 (Axiom 또는 Vercel Log Drain) | BI | S8BI1 | `backend-developer-core` | Completed |
| S8BI3 | UptimeRobot 외부 모니터링 + Slack/이메일 알림 | BI | — | `backend-developer-core` | Completed |
| S8BA1 | 크레딧 증가/차감 atomic RPC (add_credits_tx/deduct_credits_tx) + confirm/admin/premium/chat 전환 | BA | — | `backend-architect` | Completed |
| S8TS1 | Playwright E2E 5 플로우 + GitHub Actions CI | TS | — | `qa-specialist` | Completed |
| S8SC1 | Supabase RLS 전 테이블 감사 + 누락 정책 보강 | SC | — | `security-specialist-core` | Completed |
| S8SC2 | Supabase Auth MFA(TOTP) 활성화 + origin 검증 미들웨어 | SC | — | `security-specialist-core` | Completed |
| S8SC3 | Secret rotation 정책서 + 3개월 캘린더 알림 | SC | — | `security-specialist-core` | Completed |
| S8DV1 | Staging 환경 (Vercel preview + Supabase Branch DB) | DV | — | `devops-troubleshooter-core` | Completed |
| S8DV2 | Supabase PITR 백업 복구 드릴 + 결과 문서화 | DV | S8DV1 | `devops-troubleshooter-core` | Completed |
| S8FE1 | Lighthouse 실측 + 번들 분석 + 개선 후 재측정 (90+) | FE | — | `frontend-developer-core` | Completed |
| S8FE2 | Axe 전수 감사 + WCAG AA 위반 0건 + CI 통합 | FE | — | `frontend-developer-core` | Completed |
| S8FE3 | JSON-LD 구조화 데이터 5+ 페이지 + 동적 OG 이미지 | FE | — | `frontend-developer-core` | Completed |
| S8DC1 | OpenAPI 3.0 스펙 (33 엔드포인트) + Swagger UI | DC | — | `documentation-writer-core` | Completed |
| S8DC2 | 운영 런북 (incident/backup/deploy/rollback/on-call) | DC | S8DV2 | `documentation-writer-core` | Completed |

---

## 의존성 요약 다이어그램

```
S1 (개발 준비)
├── S1BI1 ─────────────────────────────────────────────────────┐
├── S1BI2 ────────────────────────────────────────────────┐    │
├── S1BI3                                                 │    │
├── S1DB1 ──────────────────────────────────────────┐    │    │
├── S1DB2 ─────────────────────────────────────┐    │    │    │
├── S1SC1 ← [S1BI2, S1DB1]                     │    │    │    │
├── S1DS1 ← [S1BI1]                            │    │    │    │
├── S1FE1 ← [S1BI1, S1DS1]                     │    │    │    │
├── S1DV1                                      │    │    │    │
├── S1EX1 ← [S1BI2]                            │    │    │    │
├── S1CS1 ← [S1DB1]                            │    │    │    │
└── S1DC1                                      │    │    │    │
                                               │    │    │    │
S2 (핵심 기능)                                  │    │    │    │
├── S2BI1 ← [S1BI1, S1BI2] ─────────────────  ◄────┘    │    │
├── S2BA1 ← [S1DB1, S1SC1] ─────────────────  ◄─────────┘    │
├── S2BA2 ← [S1DB1, S2BI1]                    │              │
├── S2BA3 ← [S1DB1, S1SC1]                    │              │
├── S2BA4 ← [S1DB1]          (소급 완료)       │              │
├── S2BA5 ← [S1DB1, S1BI2]   (소급 완료)       │              │
├── S2BA6 ← [S1DB1, S1SC1]   (소급 완료)       │              │
├── S2FE1 ← [S1FE1, S2BA1]                                   │
├── S2FE2 ← [S1FE1, S2BA2]                                   │
├── S2FE3 ← [S1FE1, S2BA3]                                   │
├── S2FE4 ← [S1FE1, S1DS1]                                   │
├── S2FE5 ← [S1FE1, S2BA4]                                   │
├── S2FE6 ← [S1FE1, S2BA5]                                   │
├── S2FE7 ← [S1FE1, S2BA1]                                   │
└── S2EX1 ← [S1EX1, S2BA2]                                   │
                                                              │
S3 (확장 기능)                                                 │
├── S3DB1 ← [S1DB2, S2BA1]  ◄────────────────────────────────┘
├── S3SC1 ← [S1SC1, S2BA1]
├── S3BA1 ← [S3DB1, S2BA2]
├── S3BA2 ← [S3DB1, S3SC1]
├── S3BA3 ← [S3DB1, S2BA6]
├── S3BA4 ← [S1DB1, S3SC1]
├── S3BA5 ← [S1DB1]          (소급 완료)
├── S3BA6 ← [S1DB1, S1SC1]   (소급 완료)
├── S3BA7 ← [S1DB1, S1SC1]   (소급 완료)
├── S3BA8 ← [S1DB1]          (소급 완료)
├── S3FE1 ← [S1FE1, S3BA1]
├── S3FE2 ← [S1FE1, S3BA2]
├── S3FE3 ← [S1FE1, S3BA3]
├── S3FE4 ← [S1FE1, S3BA4]
├── S3EX1 ← [S1EX1]          (소급 완료)
├── S3EX2 ← [S1BI2]          (소급 완료)
├── S3CS1 ← [S3DB1]          (소급 완료)
└── S3CS2 ← [S3BA8]          (소급 완료)

S4 (개발 마무리)
├── S4BA1 ← [S3BA3, S3SC1]
├── S4BA2 ← [S1DB2, S3SC1]
├── S4BA3 ← [S1DB2, S3SC1]
├── S4BA4 ← [S1DB1, S3SC1]   (소급 완료)
├── S4BA5 ← [S1DB1]          (소급 완료)
├── S4BA6 ← [S1DB1, S3BA3]   (소급 완료)
├── S4FE1 ← [S1FE1, S4BA1]
├── S4FE2 ← [S1FE1, S4BA3]
├── S4FE3 ← [S1FE1, S4BA4]
├── S4TS1 ← [S4FE1, S4FE2, S4FE3]
├── S4TS2 ← [S4BA1, S4BA2, S4BA3]
├── S4DC1 ← [S4FE1, S4FE2, S4FE3]
├── S4DC2 ← [S4BA1, S4BA2, S4BA3]
├── S4DV1 ← [S4TS1, S4TS2]
└── S4DS1 ← [S4FE1, S4FE2, S4FE3]
```

---

## 소급(Retroactive) Tasks 요약

> 이미 구현된 기능을 SAL Grid에 등록한 Task. task_status = Completed.

| Task ID | Task명 | Stage | Area |
|---------|--------|-------|------|
| S1BI2 | Supabase 클라이언트 + 환경변수 설정 | S1 | BI |
| S1BI3 | Vercel 배포 설정 | S1 | BI |
| S1DB1 | 기본 DB 스키마 (mcw_bots, personas, kb_items, chat_logs) | S1 | DB |
| S1DV1 | CI/CD + Pre-commit Hook 설정 | S1 | DV |
| S1EX1 | Telegram 연동 | S1 | EX |
| S1CS1 | 직종별 템플릿 10개 | S1 | CS |
| S1DC1 | API 문서 초안 | S1 | DC |
| S2BA4 | 챗봇 생성 API | S2 | BA |
| S2BA5 | 대화 API 기본 (chat, chat-stream) | S2 | BA |
| S2BA6 | 사용량 API | S2 | BA |
| S3BA5 | 학습 진도 API | S3 | BA |
| S3BA6 | 커뮤니티 API 7개 | S3 | BA |
| S3BA7 | Jobs API 기본 4개 | S3 | BA |
| S3BA8 | 스킬 API 기본 | S3 | BA |
| S3EX1 | Obsidian 연동 | S3 | EX |
| S3EX2 | CPC 원격 실행 연동 | S3 | EX |
| S3CS1 | 스킬 프롬프트 10개 | S3 | CS |
| S3CS2 | 스킬 인테그레이션 4개 | S3 | CS |
| S4BA4 | Marketplace API | S4 | BA |
| S4BA5 | 피상속 API 기본 | S4 | BA |
| S4BA6 | 수익 API 기본 | S4 | BA |

**소급 완료 합계**: 21개 / 60개 (35%)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-03-31 | 최초 생성 (템플릿 초기화) |
| v2.0 | 2026-03-31 | MCW 프로젝트 분석 기반 전체 Task Plan 작성 — 60개 Task, 4 Stages, 소급 21개 |
| v3.0 | 2026-04-07 | S5 디자인 혁신 Stage 추가 — 12개 Task (DS 4개 소급완료 + FE 8개 신규) |
| v3.1 | 2026-04-07 | S5 FE Task 재구성 — PO 확정 사항 반영 (4대 메뉴, 마이페이지 8탭, 관리자 대시보드 8섹션). FE 8개→10개. S5FE4(4대 메뉴 통합), S5FE6(마이페이지 탭1~4), S5FE7(관리자 섹션1~4), S5FE8(관리자 섹션5~8), S5FE9(게스트 모드), S5FE10(빌드+QA) 신규. 총 72개→74개. |
| v3.2 | 2026-04-08 | S5FE12 추가 — 디자인 Quick Win 6개 (CSS 변수 튜닝: 보더 반투명, 그림자 다층화, letter-spacing 스케일, 퍼플 글로우 확장, OpenType). 벤치마크 분석(Vercel/Linear/Stripe/Notion/Supabase) 기반. 총 74개→75개. |
| v3.3 | 2026-04-11 | S5FE1~10+FE11 완료 처리 — 디자인 혁신 FE Task 전체 Completed. S5FE11 TASK_PLAN.md 등록(마이페이지 탭5~8). S5 Stage Gate AI Verified (35/35). 크레딧 차감 시스템(S2BA5) 통합 기록. 총 75개→76개. |
| v4.0 | 2026-04-20 | S6 Stage 신설 (사용자 플로우 E2E 보강). S6FE1(로그인 페이지 이메일/비번 폼 + 회원가입/비번찾기 진입로 복원) Completed, S6QA1(핵심 사용자 플로우 E2E 점검) Pending 추가. 배경: `/login` 페이지에서 이메일 로그인 폼과 `/signup` 진입 링크가 누락되어 사용자가 "회원가입 기능이 없다"고 오인한 사고. 바닐라→React 전환 시 페이지 간 연결고리 누락 재발 방지. S1SC1 상태 Pending→Completed 교정. 총 76개→78개. |
| v3.4 | 2026-04-12 | 모바일 반응형 긴급 수정(버그픽스) — S5FE2: navbar.tsx 서비스 메뉴 hidden md:flex(모바일 오버플로우 해결)+로그인 버튼 숨김+회원가입 축약, mobile-nav.tsx 드로어 max-w-[85vw] 추가. S5FE6: home/page.tsx 260px 고정 사이드바→isMobile 기반 오버레이 슬라이드 전환, 모바일 햄버거 메뉴+탭명 헤더 추가. Supabase Auth 설정: site_url=https://mychatbot.world, uri_allow_list 2개 등록. Google Cloud Console OAuth redirect URI 등록 완료. 총 76개 유지(버그픽스). |
| v4.1 | 2026-04-20 | 프로덕션 블로커 전수조사 일괄 해결 — S6BI1(@upstash/redis 설치 + Supabase 타입 미스매치 13개 API 일괄 수정) Completed, S6BA1(inheritance getUserByEmail→listUsers, skills/my description→metadata.description) Completed, S6FE2(Tab5Operations HiredTab mock→/api/operations/hired-bots 실 연동) Completed, S6BA2(POST /api/customer-service 신설 + 폼 연동 + 42P01 폴백) Completed. 검증: tsc --noEmit 63→0 errors, next build 클린. S6 Stage 2→6 Tasks. 총 78개→82개. commit 16cf88b. |
| v4.2 | 2026-04-20 | 프로덕션 블로커 Round 2 — Explore agent 20개 후보 스캔, 수동 검증 결과 오탐(admin middleware / chat/stream credit / JSON catch) 제외 후 검증된 2건 수정. S6BA3: chat/stream message 10,000자 상한(DoS/토큰 폭주 방어), community POST rate-limit 20/h per IP(스팸 방어). S6 6→7 Tasks. 총 82개→83개. |
| v4.3 | 2026-04-20 | 프로덕션 블로커 Round 3 — 에러 바운더리·CORS 보강. S6BA4: /api/bots/public CORS 헤더 + OPTIONS preflight(외부 임베드/위젯 허용). S6FE3: /admin·/bot/[botId]·/mypage 세그먼트별 error.tsx 추가(글로벌 에러로 전파 방지, digest 노출). .single() 잔존 리스크 검증 결과 PGRST116 핸들링 완비 확인 — 스킵. S6 7→9 Tasks. 총 83개→85개. |
| v4.4 | 2026-04-20 | 프로덕션 블로커 Round 4 — 성능 이슈 수정. S6BA5: GET /api/skills/my N+1 쿼리(installations.map(loadSkillMeta) → 단일 .in) 제거, 쿼리 수 installations+2 → 3 고정. 데드 코드 loadSkillMeta 헬퍼 삭제. payment idempotency는 pending+admin approval 플로우로 실질 위험 낮아 스킵. S6 9→10 Tasks. 총 85개→86개. |
| v4.5 | 2026-04-20 | 프로덕션 블로커 Round 5 — 운영 가시성 강화. S6BI2: /api/health 단순 {status:'ok'} → REQUIRED_ENVS 누락 검사 + Supabase count head 경량 쿼리 검증 → 정상 200 / 실패 503 + checks 상세 + missingEnvs 노출. 로드밸런서·uptime 서비스가 DB 장애/설정 누락을 정확히 감지 가능. S6 10→11 Tasks. 총 86개→87개. |
