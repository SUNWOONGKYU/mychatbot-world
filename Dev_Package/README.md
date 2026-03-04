# SAL Grid Dev Suite

**SAL Grid 3D 좌표계 개발방법론** 기반의 Claude Code 완전 패키지.
새 프로젝트마다 이 패키지를 복사해서 독립적으로 운영한다.

---

## 사용 방법 (신규 프로젝트)

```
1. 이 폴더를 복사
      SAL_Grid_Dev_Suite/ → SAL_Grid_Dev_Suite_for_{ProjectName}/

2. Claude Code로 새 폴더 열기

3. /sal-grid-dev-슈퍼스킬-core 실행
      → .claude/, Process/, scripts/ 자동 생성 + SAL Grid 데이터 셋업
```

**명명 규칙:** `SAL_Grid_Dev_Suite_for_MyChatbotWorld`, `SAL_Grid_Dev_Suite_for_PoliticianFinder` 등

---

## 전체 구조

```
SAL_Grid_Dev_Suite/
├── .claude/
│   ├── CLAUDE.md              ← 7대 작업 규칙 + 절대 규칙 5개
│   ├── CAUTION.md
│   ├── pre-commit-hooks.md
│   ├── mcp_servers.json
│   ├── rules/                 ← 7개 규칙 파일
│   ├── methods/               ← 2개 방법 가이드
│   ├── compliance/            ← AI 12대 준수사항
│   ├── agents/                ← Sub-Agent 16개
│   ├── skills/                ← Core Skill 19개
│   ├── commands/              ← 커맨드 5개
│   └── work_logs/current.md   ← 세션 작업 기록
├── Human_ClaudeCode_Bridge/   ← PO-Claude 협업 브릿지
├── Process/
│   ├── P1_사업계획/
│   ├── P2_프로젝트_기획/
│   ├── S0_Project-SAL-Grid_생성/  ← SAL Grid 데이터 + Viewer
│   ├── S1_개발_준비/          ← 11 Area 폴더
│   ├── S2_개발-1차/           ← 11 Area 폴더
│   ├── S3_개발-2차/           ← 11 Area 폴더
│   └── S4_개발_마무리/        ← 11 Area 폴더
├── scripts/                   ← sync-to-root.js 등 (슈퍼스킬이 생성)
├── .gitignore
├── .env.sample
└── README.md
```

---

## skills/ — Core Skill Package (19개)

> 설치 위치: `~/.claude/skills/{폴더명}/SKILL.md`

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
| **CAPABILITY** | `/api-builder-core` | REST API 구축, CRUD 템플릿, Zod 검증, 표준 응답 구조 |
| **CAPABILITY** | `/ui-ux-builder-core` | UX 경험 설계 + UI 컴포넌트 구현 통합 |
| **DATABASE** | `/db-schema-core` | Supabase/PostgreSQL 스키마 설계, RLS 정책, 마이그레이션 |
| **SECURITY** | `/security-audit-core` | OWASP Top 10 보안 감사, 취약점 분석 |
| **TESTING** | `/e2e-test-core` | Playwright E2E 테스트 전체 패턴, 시나리오 자동화 |
| **TESTING** | `/api-test-core` | Jest/Supertest 단위·통합 테스트 + Artillery 부하 테스트 |
| **DEBUGGING** | `/troubleshoot-core` | Next.js/Supabase 에러 플레이북, 근본 원인 분석(RCA) |
| **PERFORMANCE** | `/performance-check-core` | Lighthouse, Core Web Vitals, DB N+1, 번들 최적화 |
| **DEVOPS** | `/cicd-setup-core` | GitHub Actions 워크플로우 5종, 자동 배포 파이프라인 |
| **CPC 인프라** | `/cpc-setup` | CPC 인프라 구축 (Supabase + Vercel + 소대 등록, 1회용) |

---

## agents/ — Sub-Agent Package (Core 11 + Auxiliary 5 = 16개)

> 설치 위치: `~/.claude/agents/{파일명}.md`
> 모든 에이전트는 오케스트레이터(메인 세션) 지시에 따라 Task tool로 투입된다.

### Core Agents (11개)

| 파일명 | 역할 | SAL Grid Area | 모델 |
|--------|------|--------------|------|
| `frontend-developer-core.md` | HTML/CSS/JS UI 구현, 반응형 레이아웃 | F (Frontend) | Sonnet |
| `ux-ui-designer-core.md` | UX 설계 → UI 시각화, 와이어프레임 | U (Design) | Sonnet |
| `api-developer-core.md` | REST API 설계·구현·문서화 | BA (Backend APIs) | Sonnet |
| `backend-developer-core.md` | 비즈니스 로직, 인증, 인프라, 외부 연동 | BA·BI·E | Sonnet |
| `database-developer-core.md` | 스키마 설계, 마이그레이션, Supabase/RLS | D (Database) | Sonnet |
| `security-specialist-core.md` | 보안 취약점 분석, OWASP, 인증·인가 | S (Security) | Sonnet |
| `test-runner-core.md` | 테스트 작성·실행·커버리지 보고 | T (Testing) | Haiku |
| `code-reviewer-core.md` | 코드 품질 검토, 개선 제안 (Read-only) | 전 영역 | Sonnet |
| `debugger-core.md` | 버그 추적·근본 원인 분석·수정 | 전 영역 | Sonnet |
| `documentation-writer-core.md` | 개발 문서 작성 (README, API docs) | M (Documentation) | Haiku |
| `devops-troubleshooter-core.md` | 배포, CI/CD, Vercel/GitHub 트러블슈팅 | O (DevOps) | Sonnet |

### Auxiliary Agents (5개)

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

## Human_ClaudeCode_Bridge/

PO(사용자)와 Claude Code 간 비동기 협업 브릿지.

| 파일 | 역할 |
|------|------|
| `bridge_server.js` | 로컬 API 서버 (Orders/Reports 폴더 감시) |
| `order_watcher.ps1` | Orders 폴더 감시 → Claude에 자동 입력 |
| `result_notifier.ps1` | Reports 폴더 감시 → PO에게 알림 |
| `claude_auto_typer.ps1` | Claude Code 창에 자동 타이핑 |
| `HUMAN_CLAUDECODE_BRIDGE_GUIDE.md` | 전체 사용 가이드 |

---

## Process/ — SAL Grid 데이터 구조

```
Process/S0_Project-SAL-Grid_생성/
├── sal-grid/
│   ├── task-instructions/           ← Task 수행 지침 (샘플 3개 포함)
│   ├── verification-instructions/   ← 검증 지침 (샘플 3개 포함)
│   ├── stage-gates/                 ← Stage Gate 리포트
│   ├── task-results/
│   ├── TASK_PLAN.md                 ← 빈 템플릿
│   └── _reference/                  ← SSAL Works 샘플 자료 (참고용)
│       ├── devpackage_provided/
│       │   ├── task-instructions_sample/     ← 70+ 샘플
│       │   └── verification-instructions_sample/ ← 70+ 샘플
│       └── chatgpt_created/
├── method/json/data/
│   ├── index.json                   ← 빈 템플릿
│   ├── grid_records/                ← Task JSON (_TEMPLATE.json)
│   └── stage_gate_records/          ← Stage Gate JSON (_TEMPLATE.json)
├── manual/                          ← SAL Grid 매뉴얼
└── viewer/                          ← viewer_json.html
```

**샘플 파일 (각 3개):**
- `task-instructions/`: S1M1(문서화), S1BI1(백엔드인프라), S2F1(프론트엔드) + TEMPLATE
- `verification-instructions/`: S1M1, S1BI1, S2F1
- 전체 샘플(70+개)은 `_reference/devpackage_provided/`에서 참고

---

## .claude/rules/ — 7대 작업 규칙

| 파일 | 확인 시점 | 핵심 내용 |
|------|----------|---------|
| `01_file-naming.md` | 파일명 정할 때 | kebab-case 강제, Task ID는 파일 상단 주석에 |
| `02_save-location.md` | 파일 저장할 때 ⭐ | Stage 폴더 원본 저장 → Pre-commit Hook이 루트로 자동 복사 |
| `03_area-stage.md` | 폴더 선택할 때 | 11 Area + 5 Stage 매핑, SAL ID 의존성 규칙 |
| `04_grid-writing-json.md` | Grid/JSON/Viewer 작업할 때 ⭐ | 22속성 정의, JSON CRUD, Viewer 확인 방법 |
| `05_execution-process.md` | Task 실행할 때 | 6단계 실행 프로세스 |
| `06_verification.md` | 검증할 때 | 상태 전이 규칙, Task/Stage 검증 기준, PO 승인 |
| `07_task-crud.md` | Task 추가/삭제/수정할 때 ⭐ | 5개 위치 동시 업데이트, SAL ID Finalization |

**핵심 규칙 요약:**
- `Stage 폴더 → 루트 자동 복사` (F→pages/, BA→api/Backend_APIs/ 등)
- `Completed = Verified 후에만` (상태 건너뛰기 절대 금지)
- `Task Agent ≠ Verification Agent` (작성자·검증자 분리)

---

## SAL Grid 개발방법론

**SAL** = **S**tage × **A**rea × **L**evel (3D 좌표계 특허 출원)

| Stage | 코드 | 한글명 | 설명 |
|-------|------|--------|------|
| 0 | S0 | Project SAL Grid 생성 | 방법론 인프라 셋업 (슈퍼스킬 자동 생성) |
| 1 | S1 | 개발 준비 | 환경 구성, 인프라 초기화 |
| 2 | S2 | 개발 1차 | 핵심 기능 구현 |
| 3 | S3 | 개발 2차 | 추가 기능 구현 |
| 4 | S4 | 개발 마무리 | 안정화, 배포 |

슈퍼스킬 `/sal-grid-dev-슈퍼스킬-core` 하나로 S0~S4 전 과정을 자동 관리한다.

---

## 사용 권한 모델

| 대상 | 모델 | 사용 가능 스킬 |
|------|------|--------------|
| 소대장 (메인 세션) | Opus | 모든 스킬 |
| 분대장 (Teammate) | Sonnet | `/deploy-subagent-core` 제외 전부 |
| 서브에이전트 | Haiku/Sonnet | `/deploy-subagent-core` 제외 전부 |

---

## skills/agents/commands 설치

```bash
# skills 복사
cp -r SAL_Grid_Dev_Suite/.claude/skills/* ~/.claude/skills/

# agents 복사
cp SAL_Grid_Dev_Suite/.claude/agents/* ~/.claude/agents/

# commands 복사
cp SAL_Grid_Dev_Suite/.claude/commands/* ~/.claude/commands/
```

---

*Built with Claude Code · Opus 4.6 · 2026*
