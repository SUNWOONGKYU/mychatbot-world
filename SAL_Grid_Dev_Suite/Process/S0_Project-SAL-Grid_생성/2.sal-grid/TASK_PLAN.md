# My Chatbot World — Task Plan

> **작성일**: 2026-03-31
> **수정일**: 2026-03-31
> **버전**: v2.0
> **프로젝트**: My Chatbot World (mychatbot.world)
> **총 Task 수**: 60개
> **아키텍처**: Vanilla → React/Next.js 점진적 전환
> **배포**: Vercel | **DB**: Supabase
> **현황**: 170+ 파일, 52페이지, 33 API 엔드포인트, 6 DB 테이블

---

## Stage별 Task 수

| Stage | 한글명 | Task 수 | 완료율 |
|-------|--------|---------|--------|
| S1 | 개발 준비 | 12 | ~50% (소급 6개 완료) |
| S2 | 핵심 기능 | 15 | ~40% (소급 3개 완료) |
| S3 | 확장 기능 | 18 | ~50% (소급 8개 완료) |
| S4 | 개발 마무리 | 15 | ~20% (소급 3개 완료) |
| **합계** | | **60** | **~40%** |

---

## Area별 분포 (N×11 Matrix)

| Area | S1 | S2 | S3 | S4 | 합계 |
|------|:--:|:--:|:--:|:--:|:----:|
| FE (Frontend) | 1 | 7 | 4 | 3 | 15 |
| BA (Backend APIs) | 0 | 6 | 8 | 6 | 20 |
| DB (Database) | 2 | 0 | 1 | 0 | 3 |
| SC (Security) | 1 | 0 | 1 | 0 | 2 |
| BI (Backend Infra) | 3 | 1 | 0 | 0 | 4 |
| EX (External) | 1 | 1 | 2 | 0 | 4 |
| TS (Testing) | 0 | 0 | 0 | 2 | 2 |
| DV (DevOps) | 1 | 0 | 0 | 1 | 2 |
| DS (Design) | 1 | 0 | 0 | 1 | 2 |
| DC (Documentation) | 1 | 0 | 0 | 2 | 3 |
| CS (Content System) | 1 | 0 | 2 | 0 | 3 |
| **합계** | **12** | **15** | **18** | **15** | **60** |

> 참고: S2는 S2FE4~FE7을 포함하면 15개, S4는 DS1+DV1 합산으로 15개. 위 표는 실제 task 분류 기준.

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

---

## S4 — 개발 마무리 (15 Tasks)

> 목표: Business 대시보드, 결제, 피상속, 테스트, 문서, 배포 완성

| Task ID | Task명 | Area | Dependencies | Agent | Status |
|---------|--------|------|-------------|-------|--------|
| S4BA1 | 수익 API (매출·정산 조회) | BA | S3BA3, S3SC1 | `api-developer-core` | Pending |
| S4BA2 | 결제 시스템 (결제수단 관리, 크레딧) | BA | S1DB2, S3SC1 | `api-developer-core` | Pending |
| S4BA3 | 피상속 API (피상속인 지정, 동의, 전환) | BA | S1DB2, S3SC1 | `api-developer-core` | Pending |
| S4BA4 | Marketplace API (소급) | BA | S1DB1, S3SC1 | `api-developer-core` | Completed |
| S4BA5 | 피상속 API 기본 (소급) | BA | S1DB1 | `api-developer-core` | Completed |
| S4BA6 | 수익 API 기본 (소급) | BA | S1DB1, S3BA3 | `api-developer-core` | Completed |
| S4FE1 | Business(수익 대시보드) 페이지 React 전환 | FE | S1FE1, S4BA1 | `frontend-developer-core` | Pending |
| S4FE2 | MyPage 페이지 React 전환 | FE | S1FE1, S4BA3 | `frontend-developer-core` | Pending |
| S4FE3 | Marketplace 페이지 React 전환 | FE | S1FE1, S4BA4 | `frontend-developer-core` | Pending |
| S4TS1 | E2E 테스트 (Playwright) | TS | S4FE1, S4FE2, S4FE3 | `test-runner-core` | Pending |
| S4TS2 | API 단위 테스트 확장 | TS | S4BA1, S4BA2, S4BA3 | `test-runner-core` | Pending |
| S4DC1 | 사용자 가이드 작성 | DC | S4FE1, S4FE2, S4FE3 | `documentation-writer-core` | Pending |
| S4DC2 | API 문서 완성 | DC | S4BA1, S4BA2, S4BA3 | `documentation-writer-core` | Pending |
| S4DV1 | 프로덕션 배포 최적화 (성능, SEO, PWA) | DV | S4TS1, S4TS2 | `devops-troubleshooter-core` | Pending |
| S4DS1 | 반응형 QA + 접근성 검수 | DS | S4FE1, S4FE2, S4FE3 | `ux-ui-designer-core` | Pending |

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
