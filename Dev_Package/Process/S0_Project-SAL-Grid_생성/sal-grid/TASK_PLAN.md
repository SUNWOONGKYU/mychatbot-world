# TASK_PLAN.md — CoCoBot SAL Grid

## 프로젝트 정보

| 항목 | 값 |
|------|---|
| 프로젝트 ID | mychatbot-world |
| 프로젝트명 | CoCoBot — AI 챗봇 생성 플랫폼 |
| Method | Vanilla |
| 생성일 | 2026-02-11 |
| 최종 수정 | 2026-03-07 |
| 총 Task 수 | 79 |
| 완료 Task | 72 |
| 전체 진척률 | 91% |

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-02-11 | v1.0 | Dev_Package 최초 생성 (구 아카이브 기반) |
| 2026-03-04 | v2.0 | Dev_Package_archive_20260304에서 신규 Dev_Package로 이식. 프로토타입_개선안 반영하여 21개 신규 Task 추가 (S2: +8, S3: +6, S4: +7). 총 Task 수 35 → 56. |
| 2026-03-05 | v3.0 | 5대 메뉴 확정 (Birth/Learning/Skills/Jobs/Community) + 어드민 기능 추가. 17개 신규 Task (S2: +2, S3: +7, S4: +8). 총 Task 수 56 → 73. |
| 2026-03-07 | v4.0 | 기능 완성도 점검 후 6개 신규 Task 추가 (S3: +6). Skills 마켓플레이스 구현, Birth 데이터 영속화, Learning 시나리오 연결, Jobs/Community 정합성 수정. 전체 Status를 JSON grid_records와 동기화. 총 Task 수 73 → 79. |

---

## Stage별 Task 수

| Stage | 한글명 | Task 수 | 완료 | 진척률 |
|-------|--------|---------|------|--------|
| S1 | 개발 준비 | 4 | 4 | 100% |
| S2 | 개발 1차 | 20 | 19 | 95% |
| S3 | 개발 2차 | 31 | 25 | 81% |
| S4 | 개발 마무리 | 24 | 24 | 100% |
| **합계** | | **79** | **72** | **91%** |

---

## Area별 분포

| Area | S1 | S2 | S3 | S4 | 합계 |
|------|----|----|----|-----|------|
| M (Documentation) | 1 | 0 | 0 | 1 | 2 |
| F (Frontend) | 0 | 8 | 13 | 8 | 29 |
| BA (Backend APIs) | 0 | 4 | 8 | 5 | 17 |
| DB (Database) | 1 | 1 | 3 | 1 | 6 |
| BI (Backend Infra) | 1 | 1 | 1 | 0 | 3 |
| S (Security) | 0 | 2 | 0 | 1 | 3 |
| T (Testing) | 0 | 1 | 2 | 5 | 8 |
| DO (DevOps) | 1 | 0 | 0 | 2 | 3 |
| E (External) | 0 | 1 | 3 | 1 | 5 |
| CS (Content/System) | 0 | 2 | 2 | 0 | 4 |
| **합계** | **4** | **20** | **31** | **24** | **79** |

---

## S1 — 개발 준비 (4 tasks)

| Task ID | Task 이름 | Area | Dependencies | Status | 진척률 |
|---------|-----------|------|-------------|--------|--------|
| S1M1 | API 명세서 작성 | M | — | Completed | 100% |
| S1DB1 | DB 스키마 설계 | DB | S1M1 | Completed | 100% |
| S1BI1 | 서버 인프라 설정 | BI | — | Completed | 100% |
| S1DO1 | CI/CD 파이프라인 | DO | S1BI1 | Completed | 100% |

**S1 완료율: 4/4 (100%) — Stage Gate: Approved**

---

## S2 — 개발 1차 (20 tasks)

| Task ID | Task 이름 | Area | Dependencies | Status | 진척률 |
|---------|-----------|------|-------------|--------|--------|
| S2F1 | 랜딩 페이지 | F | S1BI1 | Completed | 100% |
| S2F2 | 로그인/회원가입 UI | F | S2F1 | Completed | 100% |
| S2F3 | 챗봇 대화 UI | F | S2F1 | Completed | 100% |
| S2F4 | 챗봇 생성 위저드 | F | S2F1 | Completed | 100% |
| S2BA1 | 인증 API | BA | S1M1 | Completed | 100% |
| S2BA2 | 챗봇 CRUD API | BA | S2BA1 | Completed | 100% |
| S2BA3 | 대화 API | BA | S2BA2 | Completed | 100% |
| S2S1 | 보안 미들웨어 | S | S2BA1 | Completed | 100% |
| S2CS1 | 기본 페르소나 시스템 | CS | S2BA2 | Completed | 100% |
| S2T1 | 유닛 테스트 | T | S2BA3, S2F4 | Completed | 100% |
| S2E1 | xsai SDK 통합 + 무료 모델 라우팅 | E | S2BA3 | Completed | 100% |
| S2F5 | VAD 음성 입력 개선 | F | S2F3 | Completed | 100% |
| S2F6 | 게스트 체험 모드 UI | F | S2F1, S2BA4 | Completed | 100% |
| S2S2 | 카카오 소셜 로그인 | S | S2S1 | **Pending** | 0% |
| S2F7 | 음성 확인 절차 UI | F | S2F4 | Completed | 100% |
| S2BA4 | 게스트 생성/템플릿/사용량 API | BA | S2BA2, S2DB1 | Completed | 100% |
| S2DB1 | Phase 1 DB 스키마 (usage_logs, bot_templates) | DB | S1DB1 | Completed | 100% |
| S2CS2 | 직업별 템플릿 콘텐츠 | CS | S2DB1 | Completed | 100% |
| S2F8 | 대메뉴 5개 업데이트 (탄생/학습/스킬장터/구봇구직/봇마당) | F | S2F1 | Completed | 100% |
| S2BI2 | API 미배포 파일 Root 동기화 | BI | S1BI1 | Completed | 100% |

**S2 완료율: 19/20 (95%) — Stage Gate: Pending (S2S2 카카오 로그인 보류)**

---

## S3 — 개발 2차 (31 tasks)

| Task ID | Task 이름 | Area | Dependencies | Status | 진척률 |
|---------|-----------|------|-------------|--------|--------|
| S3F1 | 대시보드 UI | F | S2F2 | Completed | 100% |
| S3F2 | FAQ 관리 UI | F | S3F1 | Completed | 100% |
| S3F4 | 챗봇 생성 위저드 8단계 확장 | F | S2F4 | Completed | 100% |
| S3F5 | 유료 스킬 마이페이지 설정 UI | F | S3F1 | Completed | 100% |
| S3BI1 | Obsidian 지식베이스 연동 | BI | S2BA2 | Completed | 100% |
| S3BA1 | 고급 대화 API | BA | S2BA3 | Completed | 100% |
| S3BA3 | 수익활동 중개 시스템 | BA | S3BA1 | Completed | 100% |
| S3BA4 | 크레딧 결제 시스템 | BA | S3BA3 | Completed | 100% |
| S3DB1 | DB 스키마 확장 (15개 신규 테이블) | DB | S1DB1 | Completed | 100% |
| S3E1 | AI 엔진 연동 | E | S2E1 | Completed | 100% |
| S3E2 | 스킬 외부 API 연동 7개 | E | S3E1 | Completed | 100% |
| S3T1 | 통합 테스트 | T | S3BA4, S3F5 | Completed | 100% |
| S3F6 | 모바일 UX 전면 개선 (PWA, 터치) | F | S3F1 | Completed | 100% |
| S3F7 | 사용량 대시보드 UI | F | S3F1, S2BA4 | Completed | 100% |
| S3E3 | unspeech TTS 마이크로서비스 | E | S3E1 | Completed | 100% |
| S3BA5 | 성장 지표/레벨 API | BA | S3BA1, S3DB2 | Completed | 100% |
| S3CS1 | 챗봇스쿨 콘텐츠 시스템 | CS | S2CS1 | Completed | 100% |
| S3DB2 | Phase 2 DB 스키마 (bot_growth) | DB | S3DB1 | Completed | 100% |
| S3F8 | Learning(학습) 전용 페이지 | F | S2F8, S3BA1 | Completed | 100% |
| S3F9 | Jobs(구봇구직) 챗봇 목록/탐색 페이지 | F | S2F8, S3BA6 | Completed | 100% |
| S3F10 | Jobs(구봇구직) 중개 상세/매칭 페이지 | F | S3F9 | Completed | 100% |
| S3F11 | Community(봇마당) 게시판 페이지 | F | S2F8, S3BA7 | Completed | 100% |
| S3BA6 | Jobs(구봇구직) 중개 API | BA | S3BA3, S3DB3 | Completed | 100% |
| S3BA7 | Community(봇마당) API | BA | S3DB3 | Completed | 100% |
| S3DB3 | Jobs/Community/Admin DB 스키마 확장 | DB | S3DB1 | Completed | 100% |
| S3F12 | Skills 마켓플레이스 기능 구현 | F | S2F8 | **Pending** | 0% |
| S3F13 | Birth 위자드 데이터 영속화 + 랜딩 연결 + 온보딩 | F | S3F4 | **Pending** | 0% |
| S3F14 | Learning 학습→시나리오 AI 대화 연결 | F | S3F8, S3CS1, S3BA8 | **Pending** | 0% |
| S3BA8 | Learning 진행률 Supabase 동기화 API | BA | S3BA5, S3DB2 | **Pending** | 0% |
| S3CS2 | 누락 시나리오 템플릿 추가 | CS | S3CS1 | **Pending** | 0% |
| S3T2 | Jobs/Community API 정합성 수정 | T | S3F9, S3F11, S3BA6, S3BA7 | **Pending** | 0% |

**S3 완료율: 25/31 (81%) — Stage Gate: Pending**

---

## S4 — 개발 마무리 (24 tasks)

| Task ID | Task 이름 | Area | Dependencies | Status | 진척률 |
|---------|-----------|------|-------------|--------|--------|
| S4F1 | 최적화 UI | F | S3F1 | Completed | 100% |
| S4BA1 | 성능 최적화 API | BA | S3BA1 | Completed | 100% |
| S4E1 | 결제 연동 | E | S3BA4 | Completed | 100% |
| S4T1 | E2E 테스트 | T | S4F1, S4BA1 | Completed | 100% |
| S4T2 | 보안 테스트 | T | S2S1, S2S2 | Completed | 100% |
| S4T3 | 성능 테스트 | T | S4BA1 | Completed | 100% |
| S4DO1 | 배포 설정 | DO | S4T1 | Completed | 100% |
| S4DO2 | 도메인 연결 | DO | S4DO1 | Completed | 100% |
| S4M1 | 릴리스 문서 | M | S4DO1 | Completed | 100% |
| S4F2 | 스킬 마켓플레이스 UI | F | S3F5, S4BA2 | Completed | 100% |
| S4F3 | 비즈니스 대시보드 UI | F | S3F7, S4BA2 | Completed | 100% |
| S4F4 | 상속 설정 UI | F | S3F5, S4BA3 | Completed | 100% |
| S4BA2 | 마켓플레이스/수익 API | BA | S3BA3, S4DB1 | Completed | 100% |
| S4BA3 | 상속 API | BA | S4DB1 | Completed | 100% |
| S4DB1 | Phase 3 DB (revenue, marketplace, inheritance) | DB | S3DB2 | Completed | 100% |
| S4T4 | 전체 통합 테스트 | T | S4F2, S4F3, S4F4, S4BA2, S4BA3 | Completed | 100% |
| S4F5 | 어드민 대시보드 UI | F | S4BA5, S4S1 | Completed | 100% |
| S4F6 | 어드민 사용자/챗봇 관리 UI | F | S4F5, S4BA4 | Completed | 100% |
| S4F7 | 어드민 스킬장터/구봇구직 관리 UI | F | S4F5, S4BA4 | Completed | 100% |
| S4F8 | 어드민 결제/콘텐츠/시스템 관리 UI | F | S4F5, S4BA4 | Completed | 100% |
| S4BA4 | 어드민 API (인증 + CRUD) | BA | S4S1, S3DB3 | Completed | 100% |
| S4BA5 | 어드민 통계/대시보드 API | BA | S4BA4 | Completed | 100% |
| S4S1 | 어드민 권한 체계 + 감사 로그 | S | S3DB3, S2S1 | Completed | 100% |
| S4T5 | 신규 기능 통합 테스트 | T | S3F8, S3F9, S3F11, S4F5 | Completed | 100% |

**S4 완료율: 24/24 (100%) — Stage Gate: Approved**

---

## Task ID 전체 목록 (79개)

S1M1, S1DB1, S1BI1, S1DO1,
S2F1, S2F2, S2F3, S2F4, S2BA1, S2BA2, S2BA3, S2S1, S2CS1, S2T1,
S2E1, S2F5, S2F6, S2S2, S2F7, S2BA4, S2DB1, S2CS2,
S2F8, S2BI2,
S3F1, S3F2, S3F4, S3F5, S3BI1, S3BA1, S3BA3, S3BA4, S3DB1, S3E1, S3E2, S3T1,
S3F6, S3F7, S3E3, S3BA5, S3CS1, S3DB2,
S3F8, S3F9, S3F10, S3F11, S3BA6, S3BA7, S3DB3,
S3F12, S3F13, S3F14, S3BA8, S3CS2, S3T2,
S4F1, S4BA1, S4E1, S4T1, S4T2, S4T3, S4DO1, S4DO2, S4M1,
S4F2, S4F3, S4F4, S4BA2, S4BA3, S4DB1, S4T4,
S4F5, S4F6, S4F7, S4F8, S4BA4, S4BA5, S4S1, S4T5
