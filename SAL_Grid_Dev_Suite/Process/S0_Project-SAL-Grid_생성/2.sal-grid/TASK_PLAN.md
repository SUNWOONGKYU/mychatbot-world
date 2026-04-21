# My Chatbot World — Task Plan

> **작성일**: 2026-03-31
> **수정일**: 2026-04-12
> **버전**: v3.4
> **프로젝트**: My Chatbot World (mychatbot.world)
> **총 Task 수**: 77개 (v3.3 Critical 유지보수성 이슈 2건 추가)
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
| **합계** | | **77** | **~39%** |

---

## Area별 분포 (N×11 Matrix)

| Area | S1 | S2 | S3 | S4 | S5 | 합계 |
|------|:--:|:--:|:--:|:--:|:--:|:----:|
| FE (Frontend) | 1 | 8 | 4 | 3 | 11 | 27 |
| BA (Backend APIs) | 0 | 6 | 9 | 6 | 0 | 21 |
| DB (Database) | 2 | 0 | 1 | 0 | 0 | 3 |
| SC (Security) | 1 | 0 | 1 | 0 | 0 | 2 |
| BI (Backend Infra) | 3 | 1 | 0 | 0 | 0 | 4 |
| EX (External) | 1 | 1 | 2 | 0 | 0 | 4 |
| TS (Testing) | 0 | 0 | 0 | 2 | 0 | 2 |
| DV (DevOps) | 1 | 0 | 0 | 1 | 0 | 2 |
| DS (Design) | 1 | 0 | 0 | 1 | 4 | 6 |
| DC (Documentation) | 1 | 0 | 0 | 2 | 0 | 3 |
| CS (Content System) | 1 | 0 | 2 | 0 | 0 | 3 |
| **합계** | **12** | **16** | **19** | **15** | **15** | **77** |

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
| S1SC1 | Supabase Auth 강화 (소셜 로그인, 세션 관리) | SC | S1BI2, S1DB1 | `security-specialist-core` | Pending |
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
| v3.4 | 2026-04-12 | 모바일 반응형 긴급 수정(버그픽스) — S5FE2: navbar.tsx 서비스 메뉴 hidden md:flex(모바일 오버플로우 해결)+로그인 버튼 숨김+회원가입 축약, mobile-nav.tsx 드로어 max-w-[85vw] 추가. S5FE6: home/page.tsx 260px 고정 사이드바→isMobile 기반 오버레이 슬라이드 전환, 모바일 햄버거 메뉴+탭명 헤더 추가. Supabase Auth 설정: site_url=https://mychatbot.world, uri_allow_list 2개 등록. Google Cloud Console OAuth redirect URI 등록 완료. 총 76개 유지(버그픽스). |
| v3.5 | 2026-04-21 | **S7SC1 신설** — 비밀번호 재설정 플로우 복구. `/reset-password` useEffect re-run으로 setSession이 single-use refresh_token으로 재호출되어 "재설정 링크가 만료되었거나 이미 사용되었습니다" 오류 발생. redirectTo를 `/auth/callback`으로 전환 + setSession once 보장. MBO 승인(2026-04-21 11:06) 기반 신설. Stage=S7 / Area=SC. index.json 114 tasks. |
| v3.6 | 2026-04-21 | **S10 Stage 신설 — 마이페이지 Tab2 6도구 연동 (14 Tasks)**. QR 렌더 + 대화로그/KB/스킬/학습/커뮤니티 패널 + 설정 저장. DB 2개(S10DB1 mcw_bot_skills / S10DB2 mcw_bots 컬럼확장), BA 4개(chat-log / skills CRUD / community 필터 / bot PATCH), FE 7개(QR / 6패널), TS 1개(E2E). MBO 승인 2026-04-21 12:50. index.json 122→136 tasks. |
| v3.7 | 2026-04-21 | **S10 Stage 추가 3 Tasks** — S10BA5 채팅 스트림 RAG 캐스케이드(버그 수정, commit c3c7231), S10BA6 게스트 대화 허용(URL/QR 접속자 정책, commit c3c7231), S10FE8 Tab2 페르소나 섹션 제거 + AI 자동생성 입력 UX(PO 피드백, commit d8ae5ae). index.json 136→139 tasks. |
| v3.8 | 2026-04-21 | **S11 Stage 신설 — 전 페이지 모바일 반응형 최적화 (14 Tasks)**. QA 2개(S11QA1 베이스라인 감사 / S11QA2 회귀 검증), FE 12개(S11FE1 공통 셸, FE2~12 카테고리별 페이지). KPI: 390px 가로 스크롤 0, 터치 타겟 ≥44px, 본문 폰트 ≥12px, Lighthouse mobile ≥80. MBO 승인 2026-04-21 19:10. index.json 139→153 tasks. |
| v3.9 | 2026-04-21 | **S12 Stage 신설 — 페르소나 포털 `/hub` (11 Tasks)**. DS 1개(와이어프레임), DB 1개(order_index), BA 1개(/api/bots 확장), FE 7개(/hub skeleton, PersonaTabBar, TabContext, 활성탭 마운트, + 탭 Birth 모달, 딥링크, 모바일 탭바), TS 1개(E2E). KPI: 탭 전환 <150ms, 상태 복원 100%, 딥링크 100%, 모바일 390 가로 스크롤 0. 사용자 편의성 기준(PO 20:03 승인). MBO 파일 `zz_KingFolder/_TalkTodoPlan/2026_04_21__20.03_MBO_페르소나포털.md`. index.json 153→164 tasks. |

---

## S10 — 마이페이지 Tab2 6도구 연동 (14 Tasks)

> 목표: 봇 카드 하단 6개 도구 패널 + QR을 플레이스홀더에서 실 기능으로 전환
> MBO 승인: 2026-04-21 12:50 (PO "14 Task S10 Stage, 승인")

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S10DB1 | mcw_bot_skills 테이블 생성 (봇-스킬 마운트 메타데이터) | DB | — | `database-developer-core` | Pending |
| S10DB2 | mcw_bots 컬럼 확장 (tone, persona_traits, learning_sources JSONB) | DB | — | `database-developer-core` | Pending |
| S10BA1 | 봇별 chat_logs 조회/삭제 API (/api/bots/[id]/chat-logs) | BA | — | `api-developer-core` | Pending |
| S10BA2 | bot-skills CRUD API (/api/bots/[id]/skills GET/POST/DELETE) | BA | S10DB1 | `api-developer-core` | Pending |
| S10BA3 | community 필터 API (/api/community/posts?bot_id=) | BA | — | `api-developer-core` | Pending |
| S10BA4 | bot PATCH 설정 저장 API (/api/bots/[id] PATCH) | BA | S10DB2 | `api-developer-core` | Pending |
| S10FE1 | QR 코드 렌더 (qrcode pkg, mypage+Step8 공용 컴포넌트) | FE | — | `frontend-developer-core` | Completed |
| S10FE2 | ChatLogPanel 구현 (봇별 대화 로그 리스트/검색/삭제) | FE | S10BA1 | `frontend-developer-core` | Pending |
| S10FE3 | KbPanel 구현 (kb_items 표/추가/삭제) | FE | — | `frontend-developer-core` | Pending |
| S10FE4 | SkillsMountPanel 구현 (마운트된 스킬 목록 + 장착/해제) | FE | S10BA2 | `frontend-developer-core` | Pending |
| S10FE5 | LearningPanel 구현 (학습 진도/통계) | FE | — | `frontend-developer-core` | Pending |
| S10FE6 | CommunityPanel 구현 (봇 작성 글/댓글/카르마 필터) | FE | S10BA3 | `frontend-developer-core` | Pending |
| S10FE7 | BotSettings 저장 통합 (tone/persona/model PATCH 라운드트립) | FE | S10BA4 | `frontend-developer-core` | Pending |
| S10QA1 | E2E 검증 (Playwright — 마이페이지 6도구 전체 flow) | TS | S10FE1, S10FE2, S10FE3, S10FE4, S10FE5, S10FE6, S10FE7 | `test-runner-core` | Pending |
| S10BA5 | 채팅 스트림 RAG 캐스케이드 (/api/chat/stream 에 Wiki/KB/FAQ cascade 적용) | BA | S5BA8, S5BA9 | `api-developer-core` | Completed |
| S10BA6 | 게스트 대화 허용 (URL/QR 접속자 401 해제, guest-UUID 폴백) | BA | S5BA8 | `api-developer-core` | Completed |
| S10FE8 | Tab2 페르소나 섹션 제거 + AI 자동생성 입력 UX (GreetingAutoGen/FaqAutoGen) | FE | S10FE7 | `frontend-developer-core` | Completed |

---

## S11 — 전 페이지 모바일 반응형 최적화 (14 Tasks)

> 목표: 48개 페이지 전부 390px/768px 뷰포트에서 가로 스크롤 0, 터치 타겟 ≥44px, 가독성 확보
> MBO 승인: 2026-04-21 19:10 (PO "승인")
> MBO 파일: `zz_KingFolder/_TalkTodoPlan/2026_04_21__19.09_MBO_모바일반응형최적화.md`

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S11QA1 | 모바일 뷰포트 감사 (베이스라인 — 48페이지 390/768 스크린샷 + KPI 4종) | TS | — | `test-runner-core` | Pending |
| S11FE1 | 공통 셸/네비 모바일 최적화 (layout, Navbar, Header, MobileNav, Sidebar) | FE | S11QA1 | `frontend-developer-core` | Pending |
| S11FE2 | 인증 페이지 (login, signup, reset-password, auth/callback, auth/confirm) | FE | S11QA1 | `frontend-developer-core` | Pending |
| S11FE3 | 홈/랜딩/온보딩 (`/`, home, onboarding) | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11FE4 | Birth/Create 위저드 흐름 | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11FE5 | Skills 계열 (skills, register, my, [id], learning/*) | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11FE6 | Jobs 계열 (jobs, create, search, match, hire, [id]) | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11FE7 | Community 계열 (community, write, gallery, [id]) | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11FE8 | Bot/Wiki (bot/[botId]/*, bot/faq) | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11FE9 | MyPage & Business (mypage 탭 컨텐츠 + business/*) ⚠️사이드바 유지 | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11FE10 | Marketplace (list/upload/[id]) | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11FE11 | 법률/고객지원/게스트 (privacy, terms, refund, customer-service, security, guest) | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11FE12 | Admin + 기타 (admin) | FE | S11FE1 | `frontend-developer-core` | Pending |
| S11QA2 | 전체 모바일 회귀 검증 (Playwright + Lighthouse) | TS | S11FE1~12 | `test-runner-core` | Pending |

---

## S12 — 페르소나 포털 `/hub` (11 Tasks)

> 목표: 한 사용자의 코코봇 최대 10개를 `/hub` 페이지의 탭 UI 로 동시 노출, 탭 전환 시 대화 상태 100% 보존
> MBO 승인: 2026-04-21 20:03 (PO "사용자 입장에서 가장 편리한 방식")
> MBO 파일: `zz_KingFolder/_TalkTodoPlan/2026_04_21__20.03_MBO_페르소나포털.md`

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S12DS1 | 포털 와이어프레임 (390/768/1440 + 상태 다이어그램) | DS | — | `ux-ui-designer-core` | Pending |
| S12DB1 | mcw_bots.order_index INT 컬럼 추가 (탭 순서) | DB | — | `database-developer-core` | Pending |
| S12BA1 | /api/bots 응답 확장 (last_active, unread_count, order_index) | BA | S12DB1 | `api-developer-core` | Pending |
| S12FE1 | /hub 라우트 스켈레톤 (인증 게이트 + 초기 데이터 fetch) | FE | S12BA1 | `frontend-developer-core` | Pending |
| S12FE2 | PersonaTabBar (최대 10 탭 + `...▼` 오버플로우 + `+` 탭) | FE | S12FE1 | `frontend-developer-core` | Pending |
| S12FE3 | TabContext (탭별 conv_id/messages/scrollTop/inputDraft Map) | FE | S12FE2 | `frontend-developer-core` | Pending |
| S12FE4 | 활성 탭 전용 ChatWindow 마운트 (lazy + state 보존) | FE | S12FE3 | `frontend-developer-core` | Pending |
| S12FE5 | `+` 탭 → Birth 위저드 모달 (완료 시 신규 탭 추가+활성화) | FE | S12FE4 | `frontend-developer-core` | Pending |
| S12FE6 | 딥링크 `?tab=botId` ↔ state + localStorage 마지막 탭 복원 | FE | S12FE4 | `frontend-developer-core` | Pending |
| S12FE7 | 모바일 가로 스크롤 sticky 탭바 + GNB "포털" 진입점 | FE | S12FE4 | `frontend-developer-core` | Pending |
| S12QA1 | Playwright E2E (생성/전환 150ms/삭제/딥링크/모바일/10개 경계) | TS | S12FE5, S12FE6, S12FE7 | `test-runner-core` | Pending |
