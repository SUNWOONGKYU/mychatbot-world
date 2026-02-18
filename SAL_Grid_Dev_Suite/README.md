# SAL Grid Dev Suite

**SAL Grid 3D 좌표계 개발방법론** 기반의 Claude Code 완전 패키지.
스킬 · 에이전트 · 커맨드를 한 곳에 모아 관리한다.

---

## 구성 현황

```
SAL_Grid_Dev_Suite/
├── .claude/
│   ├── skills/      # Core Skills (18개)
│   ├── agents/      # Sub-Agent Package (Core 11 + Auxiliary 5 = 16개)
│   └── commands/    # 커맨드 (5개)
└── README.md
```

---

## skills/ — Sunny Core Skill Package (18개)

> 설치 위치: `~/.claude/skills/{폴더명}/SKILL.md`

### 핵심 스킬 (9개) — 방법론·통제·범용

| 레이어 | 슬래시 커맨드 | 설명 |
|--------|-------------|------|
| **METHODOLOGY** | `/sal-grid-dev-슈퍼스킬-core` | SAL Grid 개발방법론 — 프로젝트 전 과정 일괄 관리 (S0~S4) |
| **명령·통제** | `/review-evaluate-core` | 산출물 검토 + 5기준 100점 품질 평가 |
| **DEPLOYMENT** | `/deploy-subagent-core` | 서브에이전트 편성 + 최적 모델 선택 전략 |
| **DEPLOYMENT** | `/deploy-skill-core` | 스킬 조합 편성 / 커뮤니티 검색 |
| **CAPABILITY** | `/create-image-core` | 이미지 생성 (SVG / HTML / Mermaid / Pillow) |
| **CAPABILITY** | `/doc-generator-core` | 문서 생성 (PDF / DOCX / PPTX / XLSX / HWP) |
| **CAPABILITY** | `/youtube-generate-core` | YouTube 영상 올인원 제작 (리서치 → 대본 → 음성 → 블로그) |
| **CAPABILITY** | `/find-skills-core` | 스킬 검색 + 설치 (skills.sh 오픈 생태계) |
| **CPC 인프라** | `/cpc-setup` | CPC 인프라 구축 (Supabase + Vercel + 소대 등록, 1회용) |

### 개발 전문 스킬 (9개) — 개발·테스트·보안·운영

| 레이어 | 슬래시 커맨드 | 설명 |
|--------|-------------|------|
| **DATABASE** | `/db-schema-core` | Supabase/PostgreSQL 스키마 설계, RLS 정책, 마이그레이션 |
| **CAPABILITY** | `/api-builder-core` | REST API 구축, CRUD 템플릿, Zod 검증, 표준 응답 구조 |
| **CAPABILITY** | `/ui-builder-core` | React+Tailwind 컴포넌트 패턴, 접근성(A11y), 반응형 레이아웃 |
| **SECURITY** | `/security-audit-core` | OWASP Top 10 보안 감사, 취약점 분석, 보안 헤더, 의존성 검사 |
| **TESTING** | `/e2e-test-core` | Playwright E2E 테스트 전체 패턴, 시나리오 자동화 |
| **TESTING** | `/api-test-core` | Jest/Supertest 단위·통합 테스트 + Artillery 부하·보안 테스트 |
| **DEBUGGING** | `/troubleshoot-core` | Next.js/Supabase 에러 플레이북, 근본 원인 분석(RCA) |
| **PERFORMANCE** | `/performance-check-core` | Lighthouse, Core Web Vitals, DB N+1, 번들 최적화 |
| **DEVOPS** | `/cicd-setup-core` | GitHub Actions 워크플로우 5종, 자동 배포 파이프라인 |

---

## agents/ — Sub-Agent Package (Core 11 + Auxiliary 5 = 16개)

> 설치 위치: `~/.claude/agents/{파일명}.md`
> 모든 에이전트는 오케스트레이터(메인 세션) 지시에 따라 Task tool로 투입된다.

### Core Agents (11개) — 주요 개발 역할

| 파일명 | 역할 | SAL Grid Area | 모델 |
|--------|------|--------------|------|
| `frontend-developer-core.md` | HTML/CSS/JS UI 구현, 반응형 레이아웃 | F (Frontend) | Sonnet |
| `ux-ui-designer-core.md` | UX 설계 → UI 시각화, 와이어프레임 | DS (Design) | Sonnet |
| `api-developer-core.md` | REST API 설계·구현·문서화 | BA (Backend APIs) | Sonnet |
| `backend-developer-core.md` | 비즈니스 로직, 인증, 인프라, 외부 연동 | BA·BI·E | Sonnet |
| `database-developer-core.md` | 스키마 설계, 마이그레이션, Supabase/RLS | D (Database) | Sonnet |
| `security-specialist-core.md` | 보안 취약점 분석, OWASP, 인증·인가 | S (Security) | Sonnet |
| `test-runner-core.md` | 테스트 작성·실행·커버리지 보고 | T (Testing) | Haiku |
| `code-reviewer-core.md` | 코드 품질 검토, 개선 제안 (Read-only) | 전 영역 | Sonnet |
| `debugger-core.md` | 버그 추적·근본 원인 분석·수정 | 전 영역 | Sonnet |
| `documentation-writer-core.md` | 개발 문서 작성 (README, API docs) | M (Documentation) | Haiku |
| `devops-troubleshooter-core.md` | 배포, CI/CD, Vercel/GitHub 트러블슈팅 | O (DevOps) | Sonnet |

### Auxiliary Agents (5개) — 지원 역할

| 파일명 | 역할 | 모델 |
|--------|------|------|
| `refactoring-specialist.md` | 코드 구조 개선 (기능 변경 없이 직접 수정) | Sonnet |
| `performance-optimizer.md` | 성능 측정·병목 분석·최적화 | Sonnet |
| `qa-specialist.md` | 기능·UI·통합 테스트 검증 및 품질 판정 (Read-only) | Sonnet |
| `content-specialist.md` | 사용자 가이드, FAQ, 릴리즈 노트 작성 | Sonnet |
| `copywriter.md` | 마케팅 카피, 광고 문구, 브랜드 메시지 작성 | Sonnet |

---

## commands/ — 커맨드 (5개)

> 설치 위치: `~/.claude/commands/{파일명}.md`

| 커맨드 파일 | 설명 | 사용 시점 |
|------------|------|----------|
| `cpc-engage-1.md` | 1소대장으로 CPC 접속 + 대기 명령 수신 | 매 세션 시작 시 |
| `cpc-engage-2.md` | 2소대장으로 CPC 접속 + 대기 명령 수신 | 2소대 세션 |
| `cpc-engage-3.md` | 3소대장으로 CPC 접속 + 대기 명령 수신 | 3소대 세션 |
| `build-web.md` | 웹 자산 빌드 (Manual MD→HTML + 진행률 JSON) | 배포 전 빌드 |
| `deploy.md` | GitHub Pages 배포 실행 | 배포 시 |

---

## 사용 권한 모델

| 대상 | 모델 | 사용 가능 스킬 |
|------|------|--------------|
| 소대장 (메인 세션) | Opus | 모든 스킬 |
| 분대장 (Teammate) | Sonnet | `/deploy-subagent-core` 제외 전부 |
| 서브에이전트 | Haiku/Sonnet | `/deploy-subagent-core` 제외 전부 |

---

## 설치 방법

```bash
# skills 복사
cp -r SAL_Grid_Dev_Suite/.claude/skills/* ~/.claude/skills/

# agents 복사
cp SAL_Grid_Dev_Suite/.claude/agents/* ~/.claude/agents/

# commands 복사
cp SAL_Grid_Dev_Suite/.claude/commands/* ~/.claude/commands/
```

---

## SAL Grid 개발방법론

**SAL** = **S**tage × **A**rea × **L**evel (3D 좌표계 특허 출원)

| Stage | 코드 | 한글명 | 설명 |
|-------|------|--------|------|
| 0 | S0 | Project SAL Grid 생성 | 방법론 인프라 셋업 |
| 1 | S1 | 개발 준비 | 환경 구성, 기획 확정 |
| 2 | S2 | 개발 1차 | 핵심 기능 구현 |
| 3 | S3 | 개발 2차 | 추가 기능 구현 |
| 4 | S4 | 개발 마무리 | 안정화, 배포 |

슈퍼스킬 `/sal-grid-dev-슈퍼스킬-core` 하나로 S0~S4 전 과정을 자동 관리한다.

---

## PENDING — 향후 추가 예정 스킬

> 현재 스킬 18개로 개발·테스트·보안·운영을 커버하나, 아래 영역은 추후 스킬로 확장한다.

| 우선순위 | 스킬명 (예정) | 커버 영역 | 비고 |
|---------|-------------|---------|------|
| ⭐ 1 | `data-analyst-core` | 데이터 분석, 시각화, 인사이트 도출 | CSV/JSON/Excel → 리포트 |
| ⭐ 2 | `research-core` | 시장 조사, 경쟁사 분석, 트렌드 리서치 | 웹 검색 + 문서화 |
| ⭐ 3 | `email-marketing-core` | 이메일 캠페인, 뉴스레터, 시퀀스 작성 | Mailchimp 등 연동 |
| ⭐ 4 | `web-scraping-core` | 웹 스크래핑, 데이터 수집·정제 자동화 | Playwright/BeautifulSoup |

---

## .claude/rules/ — 7대 작업 규칙

> Claude Code가 작업 전 반드시 참조하는 규칙 파일. 파일명 앞 번호 순으로 적용한다.

| 파일 | 확인 시점 | 핵심 내용 |
|------|----------|---------|
| `01_file-naming.md` | 파일명 정할 때 | kebab-case 강제, Task ID는 파일 상단 주석에 |
| `02_save-location.md` | 파일 저장할 때 ⭐ | Stage 폴더 원본 저장 → Pre-commit Hook이 루트로 자동 복사 |
| `03_area-stage.md` | 폴더 선택할 때 | 11 Area + 5 Stage 매핑, SAL ID 의존성 규칙 |
| `04_grid-writing-json.md` | Grid/JSON/Viewer 작업할 때 ⭐ | 22속성 정의, JSON CRUD, Viewer 확인 방법 |
| `05_execution-process.md` | Task 실행할 때 | 6단계 실행 프로세스 (Task → PO 요청 → 검증 → Gate → 배포) |
| `06_verification.md` | 검증할 때 | 상태 전이 규칙, Task/Stage 검증 기준, PO 승인 |
| `07_task-crud.md` | Task 추가/삭제/수정할 때 ⭐ | 5개 위치 동시 업데이트, SAL ID Finalization |

**핵심 규칙 요약:**
- `Stage 폴더 → 루트 자동 복사` (F→pages/, BA→api/Backend_APIs/ 등)
- `Completed = Verified 후에만` (상태 건너뛰기 절대 금지)
- `Task Agent ≠ Verification Agent` (작성자·검증자 분리)

---

## .claude/compliance/ — AI 행동 준수사항

| 파일 | 내용 |
|------|------|
| `AI_12_COMPLIANCE.md` | AI 협업 12대 준수사항 — 작업 규칙과 별개로 AI의 기본 행동 원칙 정의 |

> 작업 규칙(rules/)이 "무엇을·어디에 저장하는가"라면,
> compliance는 "AI가 어떻게 행동해야 하는가"를 정의한다.

---

## .claude/methods/ — 작업 방법 가이드

| 파일 | 적용 시점 | 핵심 내용 |
|------|----------|---------|
| `00_initial-setup.md` | Dev Package 첫 실행 시 ⭐ | 개발 도구 확인, git 초기화, 프로젝트 설정 파일 생성 |
| `01_json-crud.md` | JSON CRUD 작업 시 | Edit tool로 직접 수정, index.json + grid_records/ 동기화 유지 |

---

*Built with Claude Code · Opus 4.6 · 2026*
