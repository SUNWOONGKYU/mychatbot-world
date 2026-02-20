# SSALWorks Task 기획서 [★ 실전용 ★]

> **작성일**: 2025-11-27
> **수정일**: 2026-02-08
> **버전**: v5.0
> **프로젝트**: SSALWorks v1.0 (프로덕션)
> **총 Task 수**: 74개 (GRID 관리 범위: S1-S5)
> **유형**: ★ 실전용 (템플릿 아님) ★
> **아키텍처**: HTML + Serverless Functions (Vercel)

---

## 1. 개요

이 문서는 SSALWorks v1.0 프로덕션 개발을 위한 **실전용** 상세 Task 기획서입니다.
PROJECT SAL GRID 5×11 매트릭스 체계에 따라 작성되었습니다.

> **중요 변경사항 (v3.0)**:
> - **아키텍처 확정**: HTML + Serverless (Next.js 전환 불필요)
> - **P3 중복 제거**: 이미 완료된 UI 관련 Task 제거
> - **누락 항목 추가**: Vercel, Google OAuth, Resend, 결제, 도메인 등
> - **PoliticianFinder 프로젝트 참조하여 실전 검증됨**
> - **50 tasks → 42 tasks**로 최적화 (GRID 자체 기능 6개 제거)

### 아키텍처 결정 배경

**P3에서 완료된 것:**
- ✅ 모든 프론트엔드 UI (HTML/CSS/JS)
- ✅ Supabase 직접 연결 (공개 데이터)
- ✅ 기본 인증 플로우
- ✅ 그리드 뷰어 UI
- ✅ Books 콘텐츠 뷰어

**S1-S5에서 해야 할 것:**
- Serverless API (결제, AI 등 보안 필요 기능)
- Google OAuth 연동
- Resend 이메일 서비스
- AI 연동 (Gemini, ChatGPT, Perplexity 3개)
- 결제 시스템 (토스페이먼츠)
- Vercel 배포 및 도메인 연결
- 테스트 및 품질 보증

### 프로세스 구조

```
╔═══════════════════════════════════════════════════════════════════════╗
║              PRELIMINARY (예비단계) - GRID 범위 밖                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║   [P1 사업계획] ──→ [P2 프로젝트 기획] ──→ [P3 프로토타입 제작] ✅     ║
║                                                     (완료됨)           ║
║   - 모든 HTML/CSS/JS UI 완성                                          ║
║   - Supabase 직접 연결 완성                                            ║
║   - 기본 인증 완성                                                     ║
╚═══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔═══════════════════════════════════════════════════════════════════════╗
║                PROJECT SAL GRID 관리 범위 (S1-S5)                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║   Stage 1: 개발 준비 (9 tasks) - Vercel/도메인/환경/Sentry 설정       ║
║   Stage 2: 개발 1차 (16 tasks) - OAuth/이메일/핵심 API/회원가입       ║
║   Stage 3: 개발 2차 (6 tasks) - AI연동/구독권한/AI UI                 ║
║   Stage 4: 개발 3차 (14 tasks) - 결제/관리자/테스트/크레딧            ║
║   Stage 5: 개발 마무리 (9 tasks) - 배포/QA/안정화                     ║
║                                                                       ║
║   ※ GRID 자체 기능(뷰어, Task CRUD)은 GRID 생성 단계에서 별도 처리   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Task 분포 요약

| Stage | 설명 | Task 수 |
|-------|------|---------|
| S1 개발 준비 | Vercel 설정 + 환경 준비 + 도메인 연결 + Sentry | 9 |
| S2 개발 1차 | OAuth + 이메일 + 핵심 API + 회원가입 + 프로젝트관리 | 17 |
| S3 개발 2차 | AI 연동 + 구독 권한 + AI UI + **AI 튜터** | 12 |
| S4 개발 3차 | 결제 (무통장 입금) + 관리자 + QA + 크레딧 + 이메일 템플릿 + 인앱 알림 + Viewer + 폴더연결 | 22 |
| S5 개발 마무리 | 배포 + QA + 안정화 + 코드 최적화 | 10 |
| **합계** | | **70** |

### Area별 분포

| Stage | M | U | F | BI | BA | D | S | T | O | E | C | 합계 |
|-------|---|---|---|----|----|----|---|---|---|---|---|------|
| S1 | 1 | - | 2 | 2 | - | 1 | 1 | 1 | 1 | - | - | **9** |
| S2 | 2 | - | 3 | 3 | 5 | 1 | 1 | 1 | - | - | 1 | **17** |
| S3 | - | - | 2 | 2 | 3 | 1 | 1 | 1 | - | 1 | 1 | **12** |
| S4 | 1 | - | 7 | 1 | 6 | 2 | 2 | 2 | 1 | - | - | **22** |
| S5 | - | 2 | 2 | - | 1 | 1 | 1 | 1 | 2 | - | - | **10** |
| **합계** | 4 | 2 | 14 | 8 | 15 | 6 | 6 | 6 | 4 | 1 | 2 | **68** |

> **참고**:
> - Area U (Design)는 P3에서 대부분 완료됨 (S5U1: 디자인 QA, S5U2: 반응형 디자인 최적화)
> - Project SAL GRID 자체 기능(그리드 뷰어, Task CRUD 등)은 GRID 생성 단계에서 별도 처리

---

## 2. Stage 1: 개발 준비 (9 Tasks)

> **목표**: Vercel 배포 환경 + 도메인 + 인프라 설정 + Sentry 에러 트래킹
> **Areas**: M(1), F(2), BI(2), D(1), S(1), T(1), O(1)

### Area M - Manual/Documentation (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S1M1 | 개발 가이드 | 코딩 컨벤션, 파일 명명 규칙, Serverless API 구조 | - |

### Area F - Frontend (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S1F1 | Vercel 프로젝트 설정 | Vercel 프로젝트 생성, Git 연결, 프레임워크 설정 | - |
| S1F2 | vercel.json 설정 | 빌드 설정, 라우팅, 보안 헤더, CORS 설정 | S1F1 |

### Area BI - Backend Infrastructure (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S1BI1 | 환경변수 설정 | .env 파일 구조, Vercel 환경변수 설정 | S1F1 |
| S1BI2 | Sentry 에러 트래킹 설정 | 클라이언트/서버 에러 모니터링, 개발 초기 버그 조기 발견 | S1BI1 |

### Area D - Database (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S1D1 | DB 스키마 확정 | 마이그레이션 파일 점검, RLS 정책 확인 | - |

### Area S - Security (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S1S1 | Supabase Auth Provider 설정 | Google OAuth Provider 설정, Redirect URL 등록 | S1BI1 |

### Area T - Test (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S1T1 | 테스트 환경 설정 | Jest/Vitest 설정, Playwright 설정 | S1F1 |

### Area O - Operations (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S1O1 | DNS 설정 및 도메인 연결 | DNS 레코드 설정 + Vercel 도메인 연결 (✅ 완료: ssalworks.ai.kr) | - |

---

## 3. Stage 2: 개발 1차 (17 Tasks)

> **목표**: Google OAuth + 이메일 서비스 + 핵심 API + 회원가입 + 프로젝트 관리
> **Areas**: M(2), F(3), BI(3), BA(5), D(1), S(1), T(1), C(1)

### Area M - Manual/Documentation (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S2M1 | API 문서 v1 | Serverless API 명세서 (인증/구독 API) | S2BA1, S2BA2, S2BA3 |
| S2M2 | 프로젝트 등록 프로세스 문서화 | 프로젝트 등록 프로세스 문서화, 안내문/서약서 이중 저장 | - |

### Area F - Frontend (3)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S2F1 | Google 소셜 로그인 UI | Google 로그인 버튼, OAuth 콜백 페이지 | S2BA1 |
| S2F2 | 비밀번호 재설정 UI | 이메일 인증 기반 재설정 폼 + 이메일 전송 연동 | S2BA2 |
| S2F3 | 회원가입 UI | 이메일/비밀번호 회원가입 폼 (Google OAuth 외 별도) | S2BA4 |

### Area BI - Backend Infrastructure (3)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S2BI1 | Resend 이메일 서비스 설정 | Resend API 키 설정, 발신자 설정 | S1BI1 |
| S2BI2 | 에러 핸들링 시스템 | 전역 에러 처리, 토스트 알림, 에러 로깅 | - |
| S2BI3 | 이메일 도메인 인증 (Resend) | Whois DNS 설정으로 ssalworks.ai.kr 도메인 인증 | S2BI1 |

### Area BA - Backend APIs (5)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S2BA1 | Google OAuth Serverless API | /api/auth/google, /api/auth/google/callback | S1S1 |
| S2BA2 | 이메일 발송 API (Resend) | 비밀번호 재설정, 환영 메일 API | S2BI1 |
| S2BA3 | 구독 관리 API | 구독 신청/상태 조회/해지 API | S1D1 |
| S2BA4 | 회원가입 API | POST /api/auth/signup (이메일/비밀번호 회원가입) | S1S1 |
| S2BA5 | 프로젝트 관리 API | POST /api/projects (생성), GET (목록), PUT (수정), POST /complete (완료) | S1D1 |

### Area D - Database (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S2D1 | 인덱스 최적화 | 자주 사용 쿼리 인덱스 추가 | S1D1 |

### Area S - Security (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S2S1 | 인증 미들웨어 | Serverless API 인증 미들웨어, 토큰 검증 | S2BA1 |

### Area T - Test (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S2T1 | 인증 API 테스트 | OAuth/이메일 API 유닛 테스트 | S2BA1, S2BA2 |

### Area C - Content (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S2C1 | Books 콘텐츠 업로드 | viewer.html/index.html 콘텐츠 목록 동기화 (DB 미사용, jsdelivr CDN) | - |

---

## 4. Stage 3: 개발 2차 (12 Tasks)

> **목표**: AI 연동 + 구독 권한 + AI UI + **AI 튜터 (RAG 기반 자체 개발)**
> **Areas**: F(2), BI(2), BA(3), D(1), S(1), T(1), E(1)
> **참고**: Project SAL GRID 자체 기능(그리드 뷰어, Task CRUD 등)은 GRID 생성 단계에서 별도 처리

### Area D - Database (1) ⭐ NEW

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S3D1 | AI 튜터 DB 스키마 | content_embeddings, tutor_conversations, tutor_messages 테이블, pgvector 확장 | S1D1 |

### Area F - Frontend (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S3F1 | AI Q&A 인터페이스 | Gemini/ChatGPT/Perplexity 선택, 질문 입력, 답변 표시, 크레딧, 크레딧 부족 모달/경고 UI | S3BA1 |
| S3F2 | AI 튜터 UI 개발 | iframe 제거, 자체 채팅 모달, 스트리밍 렌더링, 대화 히스토리 | S3BA3 |

### Area BI - Backend Infrastructure (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S3BI1 | AI API 클라이언트 통합 | Gemini, ChatGPT, Perplexity 3개 서비스 연동 구조 | - |
| S3BI2 | RAG 파이프라인 구축 | Gemini 임베딩, 벡터 검색, 컨텍스트 증강, 225개 MD 파일 청킹 | S3D1 |

### Area BA - Backend APIs (3)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S3BA1 | AI Q&A API | Gemini, ChatGPT, Perplexity 프록시 API, 크레딧 차감 | S3BI1 |
| S3BA2 | AI 가격 조회 API | GET /api/ai/pricing (실시간 가격 조회) | S3BI1 |
| S3BA3 | AI 튜터 API 개발 | POST /api/ai-tutor/chat (RAG+스트리밍), 대화 CRUD API | S3BI2 |

### Area S - Security (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S3S1 | AI 서비스 구독 상태 확인 (Health Check) | Books/AI 접근 권한 검증 | S2S1 |

### Area T - Testing (1) ⭐ NEW

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S3T1 | AI 튜터 통합 테스트 | E2E 테스트, 크레딧 차감 검증, RAG 정확도 테스트 | S3F2, S3BA3 |

### Area E - External (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S3E1 | AI API 키 설정 | Gemini, ChatGPT, Perplexity API 키 환경변수 설정 | S1BI1 |

### Area C - Content (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S3C2 | Custom Skills 다운로드 라이브러리 구축 | 우측 사이드바 Custom Skills 섹션 + 모달 뷰어 + 복사/다운로드 기능 | S2F1 |

---

## 5. Stage 4: 개발 3차 (20 Tasks)

> **목표**: 결제 시스템 (무통장 입금) + 관리자 대시보드 + 품질 보증 + 크레딧 + 인앱 알림 + SAL Grid Viewer
> **Areas**: M(1), F(5), BI(1), BA(6), D(2), S(2), T(2), O(1)

### Area M - Manual/Documentation (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S4M1 | 관리자 가이드 | Admin Dashboard 사용법 | S4F1 |

### Area F - Frontend (5)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S4F1 | 관리자 대시보드 강화 | 통계, 사용자 관리, 구독 승인 | S4BA2 |
| S4F3 | 크레딧 충전 UI | 충전 금액 선택, 결제 수단 선택 페이지 | S4BA4 |
| S4F4 | 결제 수단 등록 UI | 카드/계좌 정보 입력 페이지 | S4BA3 |
| S4F5 | 프로젝트 등록 API 연동 | localhost:3030 → Vercel API 변경, 인증 토큰 포함 | S2BA5 |
| S4F6 | My Page 기능 (알림/문의) | 인앱 알림 UI + My Page 문의 관리 페이지 | S4D2 |
| S4F8 | SAL Grid Viewer UI 구현 | Viewer 4종 (DB/CSV × Desktop/Mobile), 22개 속성 표시, 필터링 | S4F5 |
| S4F9 | 사이드바 Project UI 개선 | 등록 버튼 위치 이동/스타일, 프로젝트 액션 버튼(완료/폴더연결) | S4F5 |
| S4F10 | File System Access API 로컬 폴더 연결 | 로컬 프로젝트 폴더 접근(읽기/쓰기), IndexedDB 핸들 저장, Chrome/Edge 지원 | S4F9 |

### Area BI - Backend Infrastructure (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S4BI1 | SAL Grid JSON/CSV 빌드 시스템 | Supabase → CSV 빌드, JSON ↔ CSV 변환 스크립트 | S1BI1 |

### Area BA - Backend APIs (6)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S4BA1 | 무통장 입금 결제 API | 입금 요청 접수, 입금 정보 저장, 상태 관리 API | S2BA3 |
| S4BA2 | 입금 확인 API (관리자용) | 관리자 입금 확인 처리, 구독/크레딧 활성화 | S4BA1 |
| S4BA3 | 토스페이먼츠 결제 API | 크레딧 충전, 빌링키 발급, 월 이용료 자동결제, 웹훅 처리 | S4D1 |
| S4BA4 | 크레딧 충전 API | POST /api/credit/purchase (크레딧 구매) | S4D1 |
| S4BA5 | 설치비 입금 확인 API | POST /api/payment/installation-confirm, POST /api/admin/confirm-installation | S4D1 |
| S4BA6 | 결제/알림 이메일 템플릿 | 결제/자동화 시스템 이메일 템플릿 (영수증, 결제 실패, 리마인더 등 13종) | S2BA2 |

### Area D - Database (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S4D1 | 결제/크레딧 테이블 | billing_history, credit_history, ai_pricing, api_usage_log 테이블 | S1D1 |
| S4D2 | user_notifications 테이블 | 인앱 알림 시스템용 테이블, RLS 정책 포함 | S1D1 |

### Area S - Security (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S4S1 | 관리자 권한 체크 | Admin 전용 라우트 보호, 역할 검증 | S2S1 |
| S4S2 | Viewer 접근 보안 구현 | RLS 정책, JWT 인증, 로그인 상태별 접근 제어 | S4F8, S2S1 |

### Area T - Test (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S4T1 | E2E 테스트 | 주요 사용자 시나리오 (회원가입→결제→그리드) | S4F1 |
| S4T2 | API 통합 테스트 | 모든 Serverless API 엔드포인트 테스트 | S4BA2 |

### Area O - Operations (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S4O1 | Cron Jobs 설정 | 정기 작업 (구독 만료 체크, 통계 집계 등) | S1F2 |

---

## 6. Stage 5: 개발 마무리 (10 Tasks)

> **목표**: 프로덕션 배포 및 안정화 + 디자인/프로덕션 QA + 코드 최적화
> **Areas**: U(2), F(2), BA(1), D(1), S(1), T(1), O(2)

### Area U - Design (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S5U1 | 디자인 QA 및 일관성 점검 | 색상/폰트/간격 일관성, 반응형 테스트, 디자인 시스템 준수 점검 | S5O1 |
| S5U2 | 반응형 디자인 최적화 | 모바일 가독성 확보, 레이아웃 조정, PC 전용 안내 | S5U1 |

### Area F - Frontend (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S5F1 | 버그 수정 (프론트엔드) | 버그 수정 + UX 필수 패턴 적용 (유호현 체크리스트 반영) | S5O1 |
| S5F2 | 프로젝트 완료 처리 및 완료 프로젝트 관리 | 진행중 프로젝트 완료 처리 기능, PoliticianFinder 완료 프로젝트 표시 | S4F5 |
| S5F3 | 단일 파일 비대화 해결 (코드 분할) | index.html/admin-dashboard.html 코드 분할, 공통 JS/CSS 외부 파일 분리, 단계별 테스트 | S5F1 |

### Area BA - Backend APIs (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S5BA1 | API 버그 수정 및 최적화 | Serverless API 성능 개선, 버그 수정 | S5O1 |

### Area D - Database (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S5D1 | Supabase 백업 설정 확인 | Supabase 자동 백업 설정 확인 및 복구 절차 문서화 | S5O1 |

### Area S - Security (2)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S5S1 | 보안 점검 및 패치 | 취약점 스캔, 보안 패치, 의존성 업데이트 | S5O1 |
| S5BA2 | 예시 프로젝트 서약서 시스템 | 예시 프로젝트 열람 전 서약서 동의, DB 저장, 이메일 발송 | - |

### Area T - Testing (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S5T1 | 프로덕션 완성도 점검 | Edge Case, 상태 관리, UX 디테일 포함 종합 점검 (유호현 체크리스트 반영) | S5O1 |

### Area O - Operations (1)

| Task ID | Task명 | 설명 | 의존성 |
|---------|--------|------|--------|
| S5O1 | 배포상황 최종 검증 | 프로덕션 환경 최종 검증 + SSL 인증서 확인 (S5O3 통합) | S4T2 |

> **참고**: 도메인 연결(구 S5O2)은 S1O1로, SSL 확인(구 S5O3)은 S5O1로 통합됨

---

## 7. Task 의존성 다이어그램

### S1 (개발 준비) 의존성
```
S1F1 (Vercel 프로젝트) ──> S1F2 (vercel.json)
S1F1 ──> S1BI1 (환경변수) ──> S1S1 (Auth Provider)
S1BI1 ──> S1BI2 (Sentry)
S1F1 ──> S1T1 (테스트환경)
```

### S1 → S2 의존성
```
S1S1 (Auth Provider) ──> S2BA1 (OAuth API)
S1BI1 (환경변수) ──> S2BI1 (Resend 설정)
S1D1 (스키마) ──> S2D1 (인덱스)
S1D1 ──> S2BA3 (구독 API)
```

### S2 → S3 의존성
```
S2BA1 (OAuth) ──> S2S1 (인증 미들웨어) ──> S3S1 (구독 권한)
S1BI1 ──> S3E1 (AI API 키)
S3BI1 (API 클라이언트) ──> S3BA1 (AI Q&A API)
S3BI1 ──> S3BA2 (AI 가격 조회)
S3BA1 ──> S3F1 (AI Q&A UI)

# AI 튜터 의존성 (NEW)
S1D1 ──> S3D1 (AI 튜터 DB 스키마)
S3D1 ──> S3BI2 (RAG 파이프라인)
S3BI2 ──> S3BA3 (AI 튜터 API)
S3BA3 ──> S3F2 (AI 튜터 UI)
S3F2, S3BA3 ──> S3T1 (AI 튜터 통합 테스트)
```

### S3 → S4 의존성
```
S2BA3 (구독 API) ──> S4BA1 (결제 API) ──> S4BA2 (웹훅)
S4BA2 ──> S4F1 (관리자 대시보드)
S2S1 ──> S4S1 (관리자 권한)
S1D1 ──> S4D1 (결제/크레딧 테이블)
S4D1 ──> S4BA3, S4BA4, S4BA5
S4BA4 ──> S4F3 (크레딧 충전 UI)
S4BA3 ──> S4F4 (결제 수단 등록 UI)
```

### S4 → S5 의존성
```
S4T2 (통합 테스트) ──> S5O1 (배포상황 최종 검증)
S5O1 + S1O1 (도메인 연결) ──> S5O3 (SSL)
S5O1 ──> S5F1, S5BA1, S5D1, S5S1
```
> **참고**: S5O2 삭제됨 - 도메인 연결은 S1O1에서 완료

### 전체 의존성 요약
```
                    S1 (9 tasks)
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    Vercel설정      환경변수/Sentry   DB스키마확정
         │               │               │
         └───────────────┼───────────────┘
                         ▼
                    S2 (16 tasks)
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    OAuth/회원가입   이메일 API    구독/프로젝트 API
         │               │               │
         └───────────────┼───────────────┘
                         ▼
                    S3 (11 tasks)
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    AI Q&A API      AI UI          권한체크
         │               │               │
         └───────────────┼───────────────┘
                         ▼
                    S4 (14 tasks)
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    결제/크레딧     관리자           테스트
         │               │               │
         └───────────────┼───────────────┘
                         ▼
                    S5 (7 tasks)
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
      배포           QA             안정화
```

---

## 8. Gate 체크리스트

### P3 → S1 Gate (프로토타입 → 개발준비) ✅ 완료
- [x] 프로토타입 핵심 기능 작동 (Agenda #1~#10 완료)
- [x] 모든 HTML/CSS/JS UI 완성
- [x] Supabase 직접 연결 작동
- [x] 개발 범위 확정 (HTML + Serverless)

### S1 → S2 Gate (개발준비 → 개발1차)
- [ ] Vercel 프로젝트 설정 완료
- [ ] vercel.json 보안 헤더 설정
- [ ] 환경변수 설정 완료
- [ ] Sentry 에러 트래킹 설정 완료
- [ ] DNS 설정 완료 (도메인은 P2에서 구매 완료)
- [ ] Google OAuth Provider 설정 완료

### S2 → S3 Gate (개발1차 → 개발2차)
- [ ] Google OAuth 로그인 작동
- [ ] Resend 이메일 발송 작동
- [ ] 구독 API 작동
- [ ] 인증 API 테스트 통과

### S3 → S4 Gate (개발2차 → 개발3차)
- [ ] AI Q&A API 작동 (Gemini, ChatGPT, Perplexity)
- [ ] AI Q&A 인터페이스 완성
- [ ] AI 가격 조회 API 작동
- [ ] 구독 권한 체크 작동

### S4 → S5 Gate (개발3차 → 개발 마무리)
- [ ] 결제 시스템 작동 (무통장 입금 방식)
- [ ] 크레딧 충전 시스템 작동
- [ ] 관리자 대시보드 완성 (입금 확인 기능 포함)
- [ ] 결제/알림 이메일 템플릿 작동
- [ ] E2E 테스트 통과
- [ ] API 통합 테스트 통과

---

## 9. 변경 이력

### v5.0 (2026-02-08)
- **신규 Task 추가 2개**: 사이드바 UI 개선 + File System Access API
  - S4F9: 사이드바 Project UI 개선 (등록 버튼 위치/스타일, 액션 버튼)
  - S4F10: File System Access API 로컬 폴더 연결 (Chrome/Edge 로컬 파일 접근)
- **Task 수 변경**: 72 → 74 tasks (+2)
- **S4 Task 수**: 20 → 22
- **Area 분포 변경**: F(5→7)
- **이유**: 웹 플랫폼에서 사용자 로컬 프로젝트 폴더에 직접 접근하는 기능 추가

### v4.9 (2026-02-01)
- **신규 Task 추가**: S3C2 (Custom Skills 다운로드 라이브러리 구축)
- **Task 수 변경**: 71 → 72 tasks (+1)
- **S3 Task 수**: 11 → 12
- **Area 분포 변경**: C(1→2)
- **이유**: Custom Skills 다운로드/복사 기능 구현 (우측 사이드바 라이브러리)

### v4.8 (2026-01-04)
- **신규 Task 추가 5개**: AI 튜터 자체 개발 (RAG 기반)
  - S3D1: AI 튜터 DB 스키마 (content_embeddings, tutor_conversations, tutor_messages)
  - S3BI2: RAG 파이프라인 구축 (Gemini 임베딩, 벡터 검색, 컨텍스트 증강)
  - S3BA3: AI 튜터 API 개발 (채팅 API, 대화 CRUD API)
  - S3F2: AI 튜터 UI 개발 (iframe 제거, 자체 채팅 모달, 스트리밍 렌더링)
  - S3T1: AI 튜터 통합 테스트 (E2E 테스트, 크레딧 검증)
- **Task 수 변경**: 66 → 71 tasks (+5)
- **S3 Task 수**: 6 → 11
- **Area 분포 변경**: D(5→6), BI(7→8), BA(14→15), F(13→14), T(5→6)
- **기술 선택**: Gemini만 사용 (임베딩 + 답변 모두)
- **이유**: 외부 서비스(aitalker.co.kr) iframe을 제거하고 RAG 기반 자체 AI 튜터 시스템 구축

### v4.7 (2026-01-02)
- **신규 Task 추가**: S5F3 (단일 파일 비대화 해결 - 코드 분할)
- **Task 수 변경**: 65 → 66 tasks (+1)
- **S5 Task 수**: 9 → 10
- **Area 분포 변경**: F(12→13)
- **작업 내용**:
  - index.html (732KB), admin-dashboard.html (315KB) 코드 분할
  - 공통 JS/CSS를 외부 파일로 분리
  - 단계별 작업 + 단계별 테스트 방식으로 진행
- **이유**: 초기 로딩 성능 개선 및 코드 유지보수성 향상

### v4.5 (2025-12-25)
- **신규 Task 추가 3개**:
  - S4F8: SAL Grid Viewer UI 구현 (Viewer 4종, 22개 속성 표시, 필터링)
  - S4S2: Viewer 접근 보안 구현 (RLS, JWT 인증, 로그인 상태별 접근 제어)
  - S4BI1: SAL Grid JSON/CSV 빌드 시스템 (DB→CSV, JSON↔CSV 변환)
- **Task 수 변경**: 60 → 63 tasks (+3)
- **S4 Task 수**: 17 → 20
- **Area 분포 변경**: F(11→12), BI(6→7), S(5→6)
- **이유**: SAL Grid Viewer UI 및 빌드 시스템 구현 완료, 접근 보안 Task 추가

### v4.4 (2025-12-25)
- **신규 Task 추가**: S5F2 (프로젝트 완료 처리 및 완료 프로젝트 관리)
- **Task 수 변경**: 59 → 60 tasks (+1)
- **S5 F Task 수**: 1 → 2
- **이유**: 진행중 프로젝트 완료 처리 기능 및 PoliticianFinder 완료 프로젝트 표시 기능 구현 완료

### v4.3 (2025-12-22)
- **신규 Task 추가**: S4D2 (user_notifications 테이블), S4F6 (My Page 기능)
- **Task 수 변경**: 55 → 57 tasks (+2)
- **S4 Task 수**: 15 → 17
- **Area 분포 변경**: D(4→5), F(10→11)
- **이유**: 인앱 알림 시스템 구현 (DB 테이블 + UI)

### v4.2 (2025-12-20)
- **신규 Task 추가**: S5U1 (디자인 QA 및 일관성 점검), S5T1 (프로덕션 완성도 점검)
- **Task 수 변경**: 53 → 55 tasks (+2)
- **S5 Task 수**: 7 → 9
- **Area 분포 변경**: U(0→1), T(4→5)
- **이유**: 프로덕션 배포 전 디자인 일관성 및 완성도 종합 점검 필요

### v4.1 (2025-12-19)
- **결제 시스템 변경**: 토스페이먼츠 → 무통장 입금 방식
  - S4BA1: "결제 API (토스페이먼츠)" → "무통장 입금 결제 API"
  - S4BA2: "결제 웹훅 API" → "입금 확인 API (관리자용)"
- **신규 Task 추가**: S4BA6 (결제/알림 이메일 템플릿)
  - 영수증, 결제 실패, 리마인더 등 13종 이메일 템플릿
- **S3F1 기능 추가**: 크레딧 부족 모달/경고 UI 포함
- **Task 수 변경**: 52 → 53 tasks (+1)
- **S4 Task 수**: 14 → 15
- **BA 전체**: 13 → 14
- **이유**: 토스페이먼츠 연동을 추후로 미루고 MVP 단계에서는 무통장 입금으로 운영

### v4.0 (2025-12-19)
- **대규모 Task 추가/이동 작업**
- **Task 수 변경**: 42 → 52 tasks (+10)
- **누락 Task 10개 추가**:
  - S2: S2BA4 (회원가입 API), S2BA5 (프로젝트 관리 API), S2F3 (회원가입 UI)
  - S3: S3BA2 (AI 가격 조회 API)
  - S4: S4BA3 (결제 수단 등록 API), S4BA4 (크레딧 충전 API), S4BA5 (설치비 입금 확인 API), S4F3 (크레딧 충전 UI), S4F4 (결제 수단 등록 UI), S4D1 (결제/크레딧 테이블)
- **Stage 이동 2건**:
  - S4BI1 (Sentry) → S1BI2 (개발 초기 설정 필요)
  - S4F2 (AI Q&A UI) → S3F1 (AI 연동 Stage에서 함께 처리)
- **Stage별 Task 수 변경**:
  - S1: 8 → 9
  - S2: 13 → 16
  - S3: 4 → 6
  - S4: 10 → 14
  - S5: 7 (변동 없음)
- **이유**: User Flow 분석 결과 누락된 Task 추가, Stage 목표에 맞는 Task 재배치

### v3.5 (2025-12-23)
- **S4F6 Task 확장**: "인앱 알림 UI" → "My Page 기능 (알림/문의)"
- **변경 내용**: 기존 인앱 알림 UI에 My Page 문의 관리 페이지 추가
- **신규 기능**: 사용자 문의 목록, 상태 확인(대기/처리중/완료), 새 문의 작성, 상세 보기
- **Task 수 변경**: 42 tasks (변동 없음)
- **이유**: 사용자가 문의 처리 상태를 확인할 수 있도록 My Page 기능 확장

### v3.4 (2025-12-19)
- **S2C1 이름 통일**: "학습용 콘텐츠 시스템 정비" → "Books 콘텐츠 업로드" (Grid 기준)
- **S3S1 이름 통일**: "구독 권한 체크" → "AI 서비스 구독 상태 확인 (Health Check)" (Grid 기준)
- **S5O2 Grid에서 삭제**: S1O1로 통합됨 (Task Plan v3.1 반영)
- **Task 수 변경**: 42 → 42 tasks (변동 없음, S5O2는 이미 Task Plan에서 삭제됨)
- **이유**: Task Plan과 Grid 데이터 불일치 해소

### v3.3 (2025-12-18)
- **S2BI3 추가**: 이메일 도메인 인증 (Resend) - Whois DNS 설정으로 ssalworks.ai.kr 도메인 인증
- **Task 수 변경**: 41 → 42 tasks
- **이유**: Grid에 S2BI3가 존재하나 Task Plan에 누락되어 있어 추가

### v3.2 (2025-12-17)
- **S2C1 수정**: "Books 콘텐츠 업로드" → "학습용 콘텐츠 시스템 정비"
- **S2C1 아키텍처 변경**: DB 기반 → jsdelivr CDN 방식
- **S2C1 의존성 제거**: S1D1 의존성 삭제 (DB 미사용)
- **이유**: 학습 콘텐츠는 GitHub + jsdelivr + Marked.js로 DB 없이 제공

### v3.1 (2025-12-17)
- **S5O2 삭제**: 도메인 연결 Task를 S1O1로 통합
- **S1O1 확장**: "DNS 설정" → "DNS 설정 및 도메인 연결"
- **S1O1 완료**: ssalworks.ai.kr 도메인 연결 완료
- **Task 수 변경**: 42 → 41 tasks
- **이유**: OAuth/이메일 테스트에 실제 도메인 필요하여 개발 초기에 연결

### v3.0 (2025-12-12)
- **아키텍처 확정**: HTML + Serverless (Next.js 전환 불필요)
- **P3 중복 제거**: UI 관련 Task 모두 제거
- **GRID 자체 기능 분리**: 그리드 뷰어, Task CRUD 등 6개 Task 제거 (GRID 생성 단계에서 별도 처리)
- **AI 연동 3개 반영**: Gemini, ChatGPT, Perplexity
- **누락 항목 추가**:
  - Vercel 프로젝트 설정 (S1F1, S1F2)
  - Google OAuth API (S2BA1)
  - Resend 이메일 서비스 (S2BI1, S2BA2)
  - 결제 API (S4BA1, S4BA2)
  - DNS/도메인 연결 설정 (S1O1, S5O2, S5O3) - 도메인은 P2에서 구매 완료
  - Sentry 에러 트래킹 (S4BI1)
  - Cron Jobs (S4O1)
- **Task 수 최적화**: 50 → 42 tasks
- PoliticianFinder 프로젝트 참조하여 실전 검증

### v2.0 (2025-12-12)
- **구조 변경**: S1-S6 (86 tasks) → S1-S5 (50 tasks)
- **P1-P3**: GRID 범위 밖으로 분리
- Gate 체크리스트 추가
- 의존성 다이어그램 업데이트

### v1.0 (2025-11-27)
- 초기 Task 기획서 작성
- 총 86개 Task 정의
- 6개 Stage별 Task 배분

---

## 10. 참고 문서

| 문서 | 위치 |
|------|------|
| 5×11 매트릭스 | `Project-SSAL-Grid/ssal-grid/SSALWORKS_5x11_MATRIX.md` |
| Task 선정 매트릭스 | `Project-SSAL-Grid/manual/references/TASK_SELECTION_MATRIX.md` |
| 프로세스 워크플로우 | `Development_Process_Monitor/DEVELOPMENT_PROCESS_WORKFLOW.md` |
| PROJECT SAL GRID 매뉴얼 | `Project-SSAL-Grid/manual/PROJECT_SSAL_GRID_MANUAL.md` |
| PoliticianFinder (참조) | `C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder` |

---

## 11. 병렬 작업 가능 Task

### S1 병렬 작업
```
┌─ S1M1 (개발 가이드)
├─ S1D1 (DB 스키마 확정)     ── 동시 진행 가능
└─ S1O1 (도메인 구매)
```

### S2 병렬 작업
```
S2BA1 (OAuth API) 완료 후:
┌─ S2F1 (Google 로그인 UI)
├─ S2T1 (인증 API 테스트)     ── 동시 진행 가능
└─ S2C1 (Books 콘텐츠)

S2BI1 (Resend 설정) 완료 후:
┌─ S2BA2 (이메일 API)
└─ S2F2 (비밀번호 재설정 UI)   ── 동시 진행 가능
```

### S3 병렬 작업
```
┌─ S3BA1 (Task API)
└─ S3BA2 (AI API)              ── 동시 진행 가능 (의존성 다름)

S3BA1 완료 후:
┌─ S3F1 (그리드 뷰어)
├─ S3F2 (Task 팝업)
└─ S3F3 (Export)               ── 순차 진행
```

### S4 병렬 작업
```
┌─ S4BA1 (결제 API)
├─ S4BI1 (Sentry)              ── 동시 진행 가능
└─ S4S1 (관리자 권한)

S4BA2 완료 후:
┌─ S4F1 (관리자 대시보드)
└─ S4T1 (E2E 테스트)           ── 동시 진행 가능
```

---

**문서 끝**
