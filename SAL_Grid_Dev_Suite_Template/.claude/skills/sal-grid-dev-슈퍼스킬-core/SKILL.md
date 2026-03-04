---
description: "SAL Grid 3D 좌표계 개발방법론 - 프로젝트 개발 전 과정 관리 (Stage-Area-Level)"
user-invocable: true
---

# /sal-grid-dev — SAL Grid Dev Suite

> **"포크레인이 나왔는데 여전히 삽질하는 방법을 이야기합니까?"**
> **과거 개발 방법은 버리세요. AI 시대에 맞는 방법론을 사용하세요.**

특허 출원된 3차원 좌표계(Stage-Area-Level) 기반 개발방법론 **Project SAL Grid**의 **Single Source of Truth**.
이 Dev Suite 하나만 실행하면 `.claude/CLAUDE.md`부터 폴더 구조, 데이터, 실행, 검증까지 **전부 자동 생성**됩니다.

---

## 프로젝트 전체 생명주기

```
[Dev Suite 실행 전]
─────────────────────────────────────
  프로토타입 제작 + 브레인스토밍        ← AI + 인간 협업 (자료가 이미 존재)

[/sal-grid-dev Dev Suite 실행]
─────────────────────────────────────
  (디렉토리 구조 즉시 설치)             ← Dev Suite 자동 (단계 아님)
  P1  사업계획                         ← AI + 인간 협업
  P2  프로젝트 기획                    ← AI + 인간 협업 (Vanilla↔React 결정)
  S0  Project SAL Grid 생성            ← AI-driven (산출물 맥락 계승)
  S1  개발 준비                        ← AI-driven
  S2  개발 1차                         ← AI-driven
  S3  개발 2차                         ← AI-driven
  S4  개발 마무리                      ← AI-driven
```

프로토타입/브레인스토밍 자료가 있는 상태에서 Dev Suite를 실행하면:
1. 디렉토리 구조와 `.claude/` 인프라를 즉시 설치
2. P1~P2는 AI + 인간이 함께 사업계획과 프로젝트를 기획
3. S0~S4는 AI가 주도하여 개발, PO(Product Owner)는 승인만

---

## Usage

```
/sal-grid-dev                    # 전체 실행 — Pre-flight → S0 Grid 생성 → S1~S4 실행
/sal-grid-dev add                # 기존 Grid에 Task 추가 (5개 위치 동시 업데이트)
/sal-grid-dev status             # 현재 Grid 상태 확인 (Stage별 진행률)
/sal-grid-dev rebuild            # 백업 후 Grid 전체 재생성
```

- `$ARGUMENTS` (optional): 프로젝트 설명, 기획서 경로, 또는 특수 명령

---

## Dev Suite 실행 흐름

```
PART 1 Pre-flight
  → 프로젝트 진단 → 사용자 입력 수집 → 5×11 매트릭스 분석
     ↓
PART 2 .claude/ 인프라 생성 ★
  → CLAUDE.md + 7개 rules + methods + compliance + CAUTION + work_logs
     ↓
PART 3 폴더 구조 생성
  → Process/ (P1~P2~S0~S4) + 프로덕션 폴더 (Vanilla/React)
     ↓
PART 4 SAL Grid 데이터 생성
  → TASK_PLAN.md + task-instructions + verification-instructions
  → index.json + grid_records/*.json + stage_gate_records/*.json
     ↓
PART 5 Pre-commit Hook + 자동화 스크립트 설정
     ↓
PART 6 Task 실행 프로세스
  → Stage별 배치 실행 → Task Agent 투입 → JSON 업데이트
     ↓
PART 7 Task 검증 프로세스
  → Verification Agent 투입 → Needs Fix 루프
     ↓
PART 8 Stage Verification + PO 승인
  → Stage Gate 체크리스트 → 리포트 생성 → PO 테스트 → 승인
     ↓
PART 9 프로젝트 완료 + 배포
  → GitHub Pages (Viewer) + 최종 보고
```

---

## 지원 방법론

| 방법론 | 감지 조건 | 적용 범위 |
|--------|-----------|-----------|
| **Vanilla** (HTML/CSS/JavaScript) | next.config.js 없음 | 정적 파일, pages/, api/ |
| **React/Next.js** | next.config.js 또는 "next" 의존성 감지 | app/, components/, lib/ |

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 1: Pre-flight Analysis (사전 진단 및 분석)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1.1 프로젝트 진단

Dev Suite 실행 시 다음 경로를 스캔하여 프로젝트 현재 상태를 파악한다.

### 스캔 대상

| 경로 | 내용 | 처리 방식 |
|------|------|-----------|
| `Brainstorming/` | 브레인스토밍 자료 (아이디어, 경쟁사 분석, 기능 목록) | .md/.txt/.docx 전체 읽기 |
| 프로토타입 관련 폴더/파일 | 초기 HTML, 이미지, 코드 | 기술 스택 판별에 활용 |
| `package.json`, `vercel.json`, `next.config.js` | 기술 스택 메타 정보 | Vanilla vs React 자동 감지 |
| `Dev_Package/Process/S0_Project-SAL-Grid_생성/` | 기존 SAL Grid | index.json 존재 시 상태 출력 |
| `Dev_Package/.claude/work_logs/current.md` | 이전 세션 작업 기록 | 세션 재개 시 확인 |

### 진단 절차

1. **Brainstorming/ 분석**: `.md` / `.txt` / `.docx` 파일 읽기 → 프로젝트 핵심 가치, 기능 후보, 경쟁사 분석 결과 추출
2. **기술 스택 감지**: `package.json` / `vercel.json` / `next.config.js` 확인 → Vanilla vs React 자동 결정
3. **기존 SAL Grid 확인**: `index.json` 존재 시 현재 진행 상태 출력 후 이어하기/재생성 안내
4. **맥락 계승**: Brainstorming 내용 + 기존 코드 → PART 1.3 매트릭스 분석에 반영

### 기존 SAL Grid 존재 시 출력

```
이 프로젝트에는 이미 SAL Grid가 적용되어 있습니다.

현재 상태:
- 총 Task: XX개
- Completed: XX개 (XX%)
- In Progress: XX개
- Pending: XX개
- 마지막 수정: YYYY-MM-DD

선택:
  추가 Task → /sal-grid-dev add
  Grid 재생성 → /sal-grid-dev rebuild
  상태 확인 → /sal-grid-dev status
  세션 재개 → (계속 진행)
```

---

## 1.2 사용자 입력 수집 (AskUserQuestion)

다음 3가지 정보를 AskUserQuestion으로 수집한다.
Brainstorming 스캔으로 추론 가능한 항목은 기본값을 제안한다.

**질문 1 — 프로젝트명**
- 옵션: Brainstorming 파일에서 감지된 후보 이름 + "직접 입력"
- 예: "MyChatbot World", "직접 입력"

**질문 2 — 개발 방법론**
- 옵션: "Vanilla (HTML/CSS/JavaScript)", "React/Next.js"
- next.config.js 감지 시 → React를 기본 추천

**질문 3 — 기획 문서 위치**
- 옵션: "Dev_Package/Process/P2_프로젝트_기획/ (자동 스캔)", "직접 설명"
- P2 폴더 미존재 시 → "브레인스토밍 자료로 진행" 옵션 제공

---

## 1.3 5×11 매트릭스 분석

P2 기획서 내용과 Brainstorming 자료를 종합하여 Stage×Area 매트릭스를 분석한다.

### 5개 Stage × 11개 Area 매핑

| Stage | M | U | F | BI | BA | D | S | T | O | E | C | 합계 |
|-------|---|---|---|----|----|---|---|---|---|---|---|------|
| S0 | | | | | | | | | | | | ? |
| S1 | | | | | | | | | | | | ? |
| S2 | | | | | | | | | | | | ? |
| S3 | | | | | | | | | | | | ? |
| S4 | | | | | | | | | | | | ? |

각 Cell에 Task 개수를 채워 전체 Task 후보 수를 도출한다.

### 분석 출력 형식

```
[5×11 매트릭스 분석 결과]
- 핵심 기능: N개 기능 파악
- 예상 Task 수: ~N개
- 주요 Area: F ({N}개), BA ({N}개), D ({N}개), S ({N}개)
- 권장 Stage 배분:
    S0 {N}개 (SAL Grid 생성)
    S1 {N}개 (개발 준비: 환경설정, DB, 인증)
    S2 {N}개 (개발 1차: 핵심 기능)
    S3 {N}개 (개발 2차: 부가 기능, 통합)
    S4 {N}개 (개발 마무리: 테스트, 배포, 문서)

사용자 승인 후 TASK_PLAN.md 초안 생성 → SAL ID Provisional 부여 시작
```

---

## 1.4 세션 재개 시 확인

`/sal-grid-dev`를 기존 진행 중인 프로젝트에서 호출하면:

1. `Dev_Package/.claude/work_logs/current.md` 읽기 → 마지막 작업 내용 파악
2. `index.json` 읽어 진행 상태 파악 (Stage별 완료율)
3. 다음 실행할 Task 특정 후 사용자에게 확인

**재개 출력 형식:**
```
[세션 재개]
마지막 작업: {TaskID} — {Task Name} ({날짜} 완료)
다음 Task: {TaskID} — {Task Name}

→ 계속 진행하겠습니다.
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 2: .claude/ 인프라 자동 생성 (★ 핵심)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 개요

이 파트는 Dev Suite 실행 시 AI가 `.claude/` 인프라를 자동으로 생성하는 절차를 정의한다.
**이 스킬 파일이 모든 `.claude/` 파일의 유일한 소스 오브 트루스(Single Source of Truth)다.**

실행 원칙:
- 각 섹션에 명시된 경로에 파일이 **존재하지 않으면** Write tool로 생성한다.
- 이미 존재하면 **스킵**한다 (덮어쓰지 않음).
- 플레이스홀더는 PART 1(1.2 정보 수집)에서 확보한 실제 값으로 치환한다.
  - `{PROJECT_NAME}` → 수집한 프로젝트명 (예: `mychatbot-world`)
  - `{METHOD_TYPE}` → `Vanilla` 또는 `React`
  - `{TODAY}` → 실행 당일 날짜 (예: `2026-02-17`)
  - `{PROJECT_ROOT}` → 프로젝트 루트 절대 경로

생성 순서: 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8 → 2.9 → 2.10 → 2.11 → 2.12 → 2.13

---

## 2.1 CLAUDE.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/CLAUDE.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.
플레이스홀더 `{PROJECT_NAME}`, `{METHOD_TYPE}`, `{TODAY}` 를 실제 값으로 치환할 것.

```markdown
# {PROJECT_NAME} — Dev Package 운영 규칙

> 이 파일은 Claude Code 세션이 시작될 때 자동으로 읽히는 프로젝트 컨텍스트다.
> **수정 전 반드시 PO(프로젝트 오너)와 협의**하라.
> 최초 생성: {TODAY} | 방법론: SAL Grid Dev Suite

---

## 7대 작업 규칙 (반드시 준수)

| # | 규칙 파일 | 핵심 요약 |
|---|-----------|-----------|
| 1 | `rules/01_file-naming.md` | 모든 파일은 kebab-case, [기능]-[동작].확장자 형식 |
| 2 | `rules/02_save-location.md` | Stage 폴더 우선 저장, Root 직접 수정 금지 |
| 3 | `rules/03_area-stage.md` | 11개 Area, 5개 Stage 정의 및 SAL ID 체계 |
| 4 | `rules/04_grid-writing-json.md` | 22개 속성 정의, Individual File Approach |
| 5 | `rules/05_execution-process.md` | 6단계 실행 프로세스, Sub-agent 모델 원칙 |
| 6 | `rules/06_verification.md` | Task Agent ≠ Verification Agent, 상태 전이 규칙 |
| 7 | `rules/07_task-crud.md` | 5개 동기화 위치, SAL ID Finalization 프로세스 |

---

## 5대 절대 규칙

1. **SAL ID 없이 작업 금지** — 모든 Task는 고유 SAL ID를 가져야 한다.
2. **Task Agent = Verification Agent 금지** — 자기 검증 절대 불가.
3. **Root 직접 수정 금지** — 반드시 Stage 폴더에서 작업 후 동기화.
4. **index.json과 grid_records 동시 갱신** — Task 추가/수정 시 두 곳 모두 업데이트.
5. **Completed ⇔ Verified 쌍 규칙** — task_status=Completed는 반드시 verification_status=Verified를 수반.

---

## 데이터 관리: JSON Method

이 프로젝트는 **Individual File Approach**를 사용한다.

```
Dev_Package/
  Grid/
    index.json                  ← Task 목록 (ID, 제목, 상태만)
    grid_records/
      {SAL_ID}.json             ← Task별 완전한 22개 속성
    task-instructions/
      {SAL_ID}-instruction.md   ← Task 실행 지시서
    verification-instructions/
      {SAL_ID}-verify.md        ← Task 검증 지시서
```

- **읽기**: Read tool 또는 Grep tool 사용
- **수정**: Edit tool 사용 (JSON 부분 수정)
- **신규 생성**: Write tool 사용
- **절대 금지**: Bash `echo >` 또는 heredoc으로 JSON 덮어쓰기

---

## SAL ID 의존성 규칙 요약

- SAL ID 형식: `S{stage}{area}{sequence}` (예: `S1BA1`, `S2UI3`)
- Stage 숫자가 낮을수록 먼저 실행 (S0 → S1 → S2 → S3 → S4)
- 같은 Stage 내 Area 간 의존성은 `dependencies` 필드로 명시
- 순환 의존성 절대 금지
- 의존 Task가 Verified 완료되기 전까지 후속 Task 착수 금지

---

## 상태 전이 규칙 요약

### task_status
```
Pending → InProgress → Completed → (검증 후 유지)
                    → Blocked (의존성 미해결 시)
                    → Failed (실행 실패 시) → InProgress (재시도)
```

### verification_status
```
NotStarted → InVerification → Verified
                           → VerificationFailed → InVerification (재검증)
```

**쌍 규칙**: task_status=Completed일 때만 verification_status가 Verified 가능.

---

## 프로덕션 폴더 구조

[IF:VANILLA]
```
{PROJECT_NAME}/
  pages/          ← HTML 파일 (Stage별 서브폴더 없음, Root에 바로)
  styles/         ← CSS 파일
  scripts/        ← JavaScript 파일
  assets/
    images/
    fonts/
  api/            ← Serverless functions (Vercel)
  supabase/
    migrations/   ← SQL 마이그레이션
  Dev_Package/    ← 개발 관리 패키지 (프로덕션 무관)
```
[/IF:VANILLA]

[IF:REACT]
```
{PROJECT_NAME}/
  src/
    components/   ← React 컴포넌트
    pages/        ← 페이지 컴포넌트
    hooks/        ← Custom hooks
    stores/       ← 상태 관리 (Zustand/Jotai)
    utils/        ← 유틸리티 함수
    styles/       ← 전역 스타일
  public/         ← 정적 파일
  api/            ← Serverless functions (Vercel)
  supabase/
    migrations/   ← SQL 마이그레이션
  Dev_Package/    ← 개발 관리 패키지 (프로덕션 무관)
```
[/IF:REACT]

---

## Methods 참조

| 파일 | 설명 |
|------|------|
| `methods/00_initial-setup.md` | 개발 환경 초기 설정 체크리스트 |
| `methods/01_json-crud.md` | Grid JSON 데이터 읽기/쓰기 워크플로우 |

---

## 배포 정보

- **플랫폼**: Vercel (자동 배포, main 브랜치 push 시)
- **데이터베이스**: Supabase (PostgreSQL)
- **Pre-commit hooks**: `.claude/pre-commit-hooks.md` 참조
- **GitHub Pages**: Grid Viewer 확인용 (`/Dev_Package/Grid/viewer/`)

---

## 세션 시작 시 확인 사항

세션 시작 시 AI는 반드시 아래를 확인하라:

1. `Dev_Package/Grid/index.json` — 현재 Task 목록과 상태 파악
2. `Dev_Package/.claude/work_logs/current.md` — 이전 세션 작업 내역
3. `Dev_Package/.claude/CAUTION.md` — 프로젝트별 주의사항
4. `Dev_Package/.claude/compliance/AI_12_COMPLIANCE.md` — AI 협업 원칙 숙지

이 4개 파일을 읽지 않고 작업을 시작하지 말라.
```

---

## 2.2 rules/01_file-naming.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/rules/01_file-naming.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# 규칙 01: 파일 명명 규칙 (File Naming)

> 위반 시 Pre-commit hook이 커밋을 차단한다.

---

## 핵심 원칙: kebab-case 필수

모든 파일명은 **소문자 + 하이픈(-)** 조합만 허용한다.

| 위반 (금지) | 정상 (허용) |
|-------------|-------------|
| `UserProfile.js` | `user-profile.js` |
| `chat_handler.py` | `chat-handler.py` |
| `LoginPage.jsx` | `login-page.jsx` |
| `API_utils.js` | `api-utils.js` |
| `sendMessage.js` | `send-message.js` |

---

## 파일명 형식: [기능]-[동작].확장자

```
[기능]    : 컴포넌트/모듈이 다루는 도메인 (명사)
[동작]    : 해당 파일의 역할 (동사 또는 형용사)
.확장자   : .js .jsx .ts .tsx .css .html .md .json
```

### 올바른 예시

```
chat-send.js          ← 채팅 전송 로직
user-profile.jsx      ← 사용자 프로필 컴포넌트
auth-validate.ts      ← 인증 유효성 검사
bot-create.html       ← 봇 생성 페이지
avatar-display.css    ← 아바타 표시 스타일
session-init.js       ← 세션 초기화
```

---

## Area별 파일명 예시

[IF:VANILLA]
| Area | 폴더 | 파일명 예시 |
|------|------|-------------|
| BA (Backend API) | `api/` | `chat-send.js`, `user-get.js`, `bot-create.js` |
| DB (Database) | `supabase/migrations/` | `20260217_create-users.sql`, `20260217_add-bots.sql` |
| UI (UI/UX) | `pages/`, `styles/` | `chat-main.html`, `chat-style.css` |
| AU (Auth) | `api/auth/` | `auth-login.js`, `auth-logout.js` |
| ST (Storage) | `api/storage/` | `file-upload.js`, `file-delete.js` |
| RL (Realtime) | `scripts/` | `realtime-connect.js`, `realtime-handler.js` |
| IN (Integration) | `api/integrations/` | `openai-chat.js`, `tts-generate.js` |
| DV (DevOps) | 루트 | `vercel.json`, `.env.example` |
| TS (Testing) | `tests/` | `chat-send.test.js`, `auth-login.test.js` |
| DC (Documentation) | `docs/` | `api-reference.md`, `setup-guide.md` |
| PM (Project Mgmt) | `Dev_Package/` | 내부 규칙 적용 |
[/IF:VANILLA]

[IF:REACT]
| Area | 폴더 | 파일명 예시 |
|------|------|-------------|
| BA (Backend API) | `api/` | `chat-send.js`, `user-get.js`, `bot-create.js` |
| DB (Database) | `supabase/migrations/` | `20260217_create-users.sql`, `20260217_add-bots.sql` |
| UI (UI/UX) | `src/components/`, `src/pages/` | `ChatMain.jsx`, `UserProfile.jsx` |
| AU (Auth) | `src/hooks/`, `api/auth/` | `use-auth.ts`, `auth-login.js` |
| ST (Storage) | `api/storage/` | `file-upload.js`, `file-delete.js` |
| RL (Realtime) | `src/hooks/` | `use-realtime.ts`, `realtime-handler.ts` |
| IN (Integration) | `api/integrations/` | `openai-chat.js`, `tts-generate.js` |
| DV (DevOps) | 루트 | `vercel.json`, `.env.example` |
| TS (Testing) | `src/__tests__/` | `chat-send.test.tsx`, `auth-login.test.ts` |
| DC (Documentation) | `docs/` | `api-reference.md`, `setup-guide.md` |
| PM (Project Mgmt) | `Dev_Package/` | 내부 규칙 적용 |
[/IF:REACT]

---

## Task ID 주석 필수

모든 프로덕션 파일 상단에 해당 Task의 SAL ID를 주석으로 명시하라.

```javascript
// @task S1BA1 — Chat Send API 구현
// @area BA | @stage S1 | @author AI

export async function sendChat(req, res) { ... }
```

```css
/* @task S1UI3 — Chat Main 스타일 */
/* @area UI | @stage S1 */

.chat-container { ... }
```

---

## Dev Package 내부 파일명 규칙

`Dev_Package/.claude/` 내부 파일은 별도 규칙을 따른다:

| 파일 | 명명 규칙 | 예시 |
|------|-----------|------|
| Grid records | `{SAL_ID}.json` | `S1BA1.json`, `S2UI3.json` |
| Task instructions | `{SAL_ID}-instruction.md` | `S1BA1-instruction.md` |
| Verification instructions | `{SAL_ID}-verify.md` | `S1BA1-verify.md` |
| Work logs | `YYYY-MM-DD.md` | `2026-02-17.md` |
| Rules | `NN_kebab-name.md` | `01_file-naming.md` |
| Methods | `NN_kebab-name.md` | `00_initial-setup.md` |
```

---

## 2.3 rules/02_save-location.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/rules/02_save-location.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# 규칙 02: 저장 위치 규칙 (Save Location)

> **핵심 원칙: Stage 폴더 우선. Root 직접 수정 절대 금지.**

---

## Stage 폴더 우선 원칙

AI는 새 파일을 생성하거나 기존 파일을 수정할 때:

1. **항상 Stage 폴더(`Dev_Package/Process/S{N}_*/`)에 먼저 저장**한다.
2. Stage 폴더에서 작업이 완료되고 Verified 상태가 되면,
3. Pre-commit hook이 자동으로 **Stage → Root로 파일을 동기화**한다.

Root 폴더(`pages/`, `src/`, `api/` 등)를 직접 수정하면:
- Pre-commit hook이 Stage 파일로 **덮어씌워** 변경사항이 사라질 수 있다.
- 검증 없이 프로덕션에 배포되는 위험이 생긴다.

---

## Stage → Root 매핑 표

[IF:VANILLA]
| Stage 폴더 (작업 위치) | Root 폴더 (배포 위치) | 동기화 조건 |
|------------------------|----------------------|-------------|
| `Dev_Package/Process/S1_개발/pages/` | `pages/` | task_status=Completed + verification_status=Verified |
| `Dev_Package/Process/S1_개발/styles/` | `styles/` | 동일 |
| `Dev_Package/Process/S1_개발/scripts/` | `scripts/` | 동일 |
| `Dev_Package/Process/S1_개발/api/` | `api/` | 동일 |
| `Dev_Package/Process/S2_통합/pages/` | `pages/` | 동일 |
| `Dev_Package/Process/S2_통합/api/` | `api/` | 동일 |
| `Dev_Package/Process/S3_테스트/tests/` | `tests/` | 동일 |
| `Dev_Package/Process/S4_배포/` | 루트 설정 파일 | 동일 |
[/IF:VANILLA]

[IF:REACT]
| Stage 폴더 (작업 위치) | Root 폴더 (배포 위치) | 동기화 조건 |
|------------------------|----------------------|-------------|
| `Dev_Package/Process/S1_개발/src/components/` | `src/components/` | task_status=Completed + verification_status=Verified |
| `Dev_Package/Process/S1_개발/src/pages/` | `src/pages/` | 동일 |
| `Dev_Package/Process/S1_개발/src/hooks/` | `src/hooks/` | 동일 |
| `Dev_Package/Process/S1_개발/api/` | `api/` | 동일 |
| `Dev_Package/Process/S2_통합/src/` | `src/` | 동일 |
| `Dev_Package/Process/S2_통합/api/` | `api/` | 동일 |
| `Dev_Package/Process/S3_테스트/src/__tests__/` | `src/__tests__/` | 동일 |
| `Dev_Package/Process/S4_배포/` | 루트 설정 파일 | 동일 |
[/IF:REACT]

---

## 절대 금지 사항

| 금지 행동 | 이유 |
|-----------|------|
| Root 폴더 직접 파일 생성 | Stage 검증 우회, 품질 보장 불가 |
| Stage 폴더 없이 Root 수정 | 동기화 충돌 발생 |
| 여러 Stage 동시 작업 | 의존성 위반, 롤백 불가 |
| Verified 전 Root 동기화 수동 실행 | 미검증 코드 배포 위험 |
| `Dev_Package/` 내 파일을 Root에 복사 | 관리 파일이 프로덕션에 노출 |

---

## Pre-commit Hook 설명

커밋 시 자동 실행되는 훅:

1. **Manual MD → HTML 변환**: `Dev_Package/Grid/viewer/` 내 MD 파일을 HTML로 변환
2. **Progress JSON 생성**: `index.json`에서 진행률 통계 자동 계산
3. **Stage → Root 동기화**: Verified Task의 Stage 파일을 Root로 복사

자세한 내용: `.claude/pre-commit-hooks.md` 참조
```

---

## 2.4 rules/03_area-stage.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/rules/03_area-stage.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# 규칙 03: Area & Stage 정의

---

## 11개 Area 정의표

| 코드 | 영문명 | 한글명 | 폴더명 | Task Agent | Verification Agent |
|------|--------|--------|--------|------------|-------------------|
| PM | Project Management | 프로젝트 관리 | `project-mgmt/` | Sonnet | Sonnet (다른 세션) |
| DB | Database | 데이터베이스 | `database/` | Sonnet | Sonnet (다른 세션) |
| AU | Authentication | 인증/권한 | `auth/` | Sonnet | Sonnet (다른 세션) |
| BA | Backend API | 백엔드 API | `backend-api/` | Sonnet | Sonnet (다른 세션) |
| UI | UI/UX | 사용자 인터페이스 | `ui-ux/` | Sonnet | Sonnet (다른 세션) |
| ST | Storage | 파일/미디어 저장 | `storage/` | Sonnet | Sonnet (다른 세션) |
| RL | Realtime | 실시간 처리 | `realtime/` | Sonnet | Sonnet (다른 세션) |
| IN | Integration | 외부 연동 | `integration/` | Sonnet | Sonnet (다른 세션) |
| DV | DevOps | 개발운영 | `devops/` | Sonnet | Sonnet (다른 세션) |
| TS | Testing | 테스트 | `testing/` | Sonnet | Sonnet (다른 세션) |
| DC | Documentation | 문서화 | `documentation/` | Haiku | Sonnet (다른 세션) |

> Task Agent와 Verification Agent는 **반드시 다른 세션(인스턴스)**이어야 한다.
> DC(문서화) Area의 Task Agent는 단순 변환/생성이므로 Haiku 사용 가능.

---

## 5개 Stage 정의표

| Stage | 한글명 | 영문명 | 폴더명 | 설명 |
|-------|--------|--------|--------|------|
| S0 | 프로토타입 제작 | Prototype | `S0_프로토타입_제작/` | 검증 전 아이디어 구현, 실험적 코드 |
| S1 | 개발 | Development | `S1_개발/` | 핵심 기능 구현 (DB, Auth, API, UI) |
| S2 | 통합 | Integration | `S2_통합/` | 컴포넌트 간 연동, API 통합 |
| S3 | 테스트 | Testing | `S3_테스트/` | 단위/통합/E2E 테스트 작성 및 실행 |
| S4 | 배포 | Deployment | `S4_배포/` | 프로덕션 배포, CI/CD, 모니터링 |

---

## SAL ID 형식

```
S{stage}{area}{sequence}

예시:
  S0PM1   ← Stage 0, Project Management, 1번째 Task
  S1BA1   ← Stage 1, Backend API, 1번째 Task
  S1UI3   ← Stage 1, UI/UX, 3번째 Task
  S2IN1   ← Stage 2, Integration, 1번째 Task
  S3TS2   ← Stage 3, Testing, 2번째 Task
  S4DV1   ← Stage 4, DevOps, 1번째 Task
```

- `{stage}`: 0~4 (숫자 한 자리)
- `{area}`: 위 11개 코드 중 하나 (대문자 2자리)
- `{sequence}`: 해당 Area 내 순서 (1부터 시작, 중복 불가)

**Provisional ID**: Task 계획 단계에서 임시 할당 (`S1BA?1` 형식, ?=미확정)
**Finalized ID**: TASK_PLAN.md 승인 후 확정 (`S1BA1` 형식)

---

## Stage 배정 원칙 (의존성 깊이 기반)

```
의존하는 Task가 없음 (독립) → S0 또는 S1
다른 S1 Task에 의존         → S1 (같은 Stage, dependencies 명시)
S1 Task 결과물을 사용       → S2
S2 결과물 검증              → S3
S3 완료 후 배포             → S4
```

Stage 배정 시 자문:
- "이 Task를 수행하려면 어떤 Task가 먼저 완료되어야 하는가?"
- 선행 Task의 Stage + 1 이상을 배정하라.
- 단, 동일 Stage 내 병렬 실행 가능한 Task는 같은 Stage에 배정 가능.

---

## 의존성 규칙

1. **순환 의존성 절대 금지**: A→B→C→A 불가
2. **상위 Stage 의존 금지**: S2 Task가 S3 Task에 의존 불가
3. **의존 Task 완료 전 착수 금지**: `dependencies` 내 모든 SAL ID가 Verified 상태여야 착수 가능
4. **의존성 변경 시 재검토**: 의존성 추가/삭제 시 TASK_PLAN.md를 PO에게 재승인 요청
5. **Cross-Area 의존성 허용**: 같은 Stage 내에서 다른 Area Task에 의존 가능

의존성 선언 예시 (grid_records JSON):
```json
{
  "sal_id": "S2IN1",
  "dependencies": ["S1BA2", "S1DB1"]
}
```
```

---

## 2.5 rules/04_grid-writing-json.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/rules/04_grid-writing-json.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# 규칙 04: Grid 데이터 & JSON 관리

---

## 22개 속성 정의표

| # | 필드명 | 설명 | 타입 | 작성 시점 | 초기값 |
|---|--------|------|------|-----------|--------|
| 1 | `sal_id` | SAL Grid 고유 식별자 | string | Task 생성 시 | `"S?XX?"` (Provisional) |
| 2 | `title` | Task 제목 (동작+목적) | string | Task 생성 시 | `""` |
| 3 | `description` | Task 상세 설명 | string | Task 생성 시 | `""` |
| 4 | `area_code` | Area 코드 (BA/DB/UI 등) | string | Task 생성 시 | `""` |
| 5 | `area_name` | Area 한글명 | string | Task 생성 시 | `""` |
| 6 | `stage` | Stage 번호 (0~4) | number | Task 생성 시 | `0` |
| 7 | `stage_name` | Stage 한글명 | string | Task 생성 시 | `""` |
| 8 | `priority` | 우선순위 (High/Medium/Low) | string | Task 생성 시 | `"Medium"` |
| 9 | `complexity` | 복잡도 (High/Medium/Low) | string | Task 생성 시 | `"Medium"` |
| 10 | `dependencies` | 선행 SAL ID 목록 | array | Task 생성 시 | `[]` |
| 11 | `task_status` | Task 진행 상태 | string | 실행 중 갱신 | `"Pending"` |
| 12 | `verification_status` | 검증 상태 | string | 검증 중 갱신 | `"NotStarted"` |
| 13 | `task_agent` | 실행 AI 에이전트 | string | 착수 시 | `""` |
| 14 | `verification_agent` | 검증 AI 에이전트 | string | 검증 착수 시 | `""` |
| 15 | `estimated_time` | 예상 소요 시간 | string | Task 생성 시 | `""` |
| 16 | `actual_time` | 실제 소요 시간 | string | 완료 시 | `""` |
| 17 | `output_files` | 생성된 파일 목록 | array | 완료 시 | `[]` |
| 18 | `notes` | 메모/이슈 기록 | string | 필요 시 | `""` |
| 19 | `created_at` | Task 생성 일시 | string (ISO8601) | Task 생성 시 | 자동 |
| 20 | `started_at` | 착수 일시 | string (ISO8601) | 착수 시 | `null` |
| 21 | `completed_at` | 완료 일시 | string (ISO8601) | 완료 시 | `null` |
| 22 | `verified_at` | 검증 완료 일시 | string (ISO8601) | 검증 완료 시 | `null` |

---

## Individual File Approach 폴더 구조

```
Dev_Package/
  Grid/
    index.json                          ← Task 목록 (경량 인덱스)
    grid_records/
      S0PM1.json                        ← Task별 완전한 22개 속성
      S1BA1.json
      S1BA2.json
      S1DB1.json
      ...
    task-instructions/
      S0PM1-instruction.md              ← Task 실행 지시서
      S1BA1-instruction.md
      ...
    verification-instructions/
      S0PM1-verify.md                   ← Task 검증 지시서
      S1BA1-verify.md
      ...
    viewer/
      index.html                        ← Grid Viewer (GitHub Pages)
      progress.json                     ← Pre-commit 자동 생성 통계
```

### index.json 구조 (경량 인덱스)

```json
{
  "project": "{PROJECT_NAME}",
  "method_type": "{METHOD_TYPE}",
  "generated_at": "{TODAY}",
  "tasks": [
    {
      "sal_id": "S1BA1",
      "title": "Chat Send API 구현",
      "area_code": "BA",
      "stage": 1,
      "task_status": "Pending",
      "verification_status": "NotStarted",
      "priority": "High"
    }
  ]
}
```

---

## JSON CRUD 방법

### Read (읽기)
```
Read tool: Dev_Package/Grid/index.json         ← 전체 목록 파악
Read tool: Dev_Package/Grid/grid_records/S1BA1.json  ← 특정 Task 상세
Grep tool: "task_status.*InProgress"          ← 진행 중 Task 검색
```

### Edit (수정 — 기존 파일 부분 수정)
```
Edit tool 사용:
- 단일 필드 값 변경 (상태 업데이트, 메모 추가 등)
- 배열에 항목 추가 (output_files, dependencies)

주의: Edit tool은 정확한 문자열 매칭이 필요하므로
JSON 들여쓰기와 공백을 정확히 일치시켜야 한다.
```

### Write (신규 생성 — 새 파일)
```
Write tool 사용:
- 새 Task 레코드 생성 (grid_records/{SAL_ID}.json)
- 새 지시서 생성 (task-instructions/{SAL_ID}-instruction.md)
- index.json은 Edit tool로 tasks 배열에 항목 추가
```

**절대 금지**: Bash echo, heredoc, sed로 JSON 파일 덮어쓰기

---

## Viewer 확인 방법

### 로컬 확인
```
Dev_Package/Grid/viewer/index.html 을 브라우저에서 열기
또는 VS Code Live Server 사용
```

### GitHub Pages 확인
```
https://{github-username}.github.io/{PROJECT_NAME}/Dev_Package/Grid/viewer/
```

Pre-commit hook이 `progress.json`을 자동 갱신하므로
커밋 후 GitHub Pages에서 최신 진행률을 확인할 수 있다.
```

---

## 2.6 rules/05_execution-process.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/rules/05_execution-process.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# 규칙 05: 실행 프로세스

---

## 6단계 실행 프로세스

### ① 세션 시작 — 컨텍스트 파악 (필수)

```
1. Read: Dev_Package/Grid/index.json          → 전체 Task 목록 파악
2. Read: Dev_Package/.claude/work_logs/current.md  → 이전 세션 내역
3. Read: Dev_Package/.claude/CAUTION.md       → 주의사항 확인
4. Grep: task_status=InProgress               → 진행 중 Task 있으면 우선 처리
```

위 4개를 읽지 않고 작업을 시작하지 말라.

---

### ② Task 선택 — 착수 가능 여부 확인

착수 가능 조건:
- `task_status` = `Pending` 또는 `Blocked`가 해소된 상태
- `dependencies` 목록의 모든 SAL ID가 `verification_status` = `Verified`
- 동일 Area의 이전 번호 Task가 완료 상태

우선순위 선택 기준:
1. Stage 숫자가 낮은 Task 우선 (S0 > S1 > S2 > S3 > S4)
2. 같은 Stage에서는 `priority=High` 우선
3. `dependencies`가 없는 독립 Task 우선

---

### ③ 착수 선언 — 상태 업데이트

```
1. Edit: grid_records/{SAL_ID}.json
   - task_status: "Pending" → "InProgress"
   - task_agent: "Claude Sonnet / Haiku" (모델 명시)
   - started_at: "2026-02-17T00:00:00Z" (현재 시각)
2. Edit: index.json (해당 Task의 task_status 동기화)
3. Read: task-instructions/{SAL_ID}-instruction.md (실행 지시서 확인)
```

---

### ④ 실행 — Stage 폴더에서 작업

```
Stage 폴더: Dev_Package/Process/S{N}_{이름}/
모든 코드/파일을 Stage 폴더에 생성한다.
Root 폴더에 직접 쓰지 않는다. (rules/02_save-location.md 참조)
```

실행 중 이슈 발생 시:
- `notes` 필드에 이슈 내용 기록 (Edit tool)
- 해결 불가 시 `task_status` = `Blocked`로 변경 후 PO에게 보고
- 해결 방법 3가지 이상 제시 (AI_12_COMPLIANCE.md 원칙 4번)

---

### ⑤ 완료 선언 — 상태 업데이트

```
1. Edit: grid_records/{SAL_ID}.json
   - task_status: "InProgress" → "Completed"
   - completed_at: 현재 시각
   - output_files: 생성된 파일 목록
   - actual_time: 실제 소요 시간
2. Edit: index.json (task_status 동기화)
3. Edit: work_logs/current.md (작업 내용 기록)
```

---

### ⑥ 검증 요청 — Verification Agent 호출

```
1. Read: verification-instructions/{SAL_ID}-verify.md (검증 지시서 확인)
2. Edit: grid_records/{SAL_ID}.json
   - verification_status: "NotStarted" → "InVerification"
3. Verification Agent(별도 세션)에게 검증 지시서 전달
4. 검증 완료 후:
   - Verified: verification_status → "Verified", verified_at 기록
   - Failed: verification_status → "VerificationFailed", notes에 실패 이유 기록
```

---

## PO 도움 요청 (Human-AI Task)

아래 상황에서는 반드시 PO에게 보고하고 대기하라:

| 상황 | 보고 방법 |
|------|-----------|
| Task 의존성 충돌 발견 | TASK_PLAN.md 이슈 명시 후 대기 |
| 외부 서비스 API 키 필요 | `.env` 파일 설정 요청 |
| 비즈니스 로직 결정 필요 | 선택지 3개 이상 제시 후 선택 요청 |
| Stage 전환 전 승인 필요 | 현재 Stage 요약 보고 후 승인 요청 |
| 예상치 못한 오류 (해결 불가) | 원인 분석 + 해결 방안 제시 |

---

## Sub-agent 모델 원칙

| 작업 유형 | 권장 모델 | 예시 |
|-----------|-----------|------|
| 단순 반복/변환 | Haiku | 파일 복사, 패턴 교체, 텍스트 추출, MD→HTML 변환 |
| 코드 작성/분석 | Sonnet | API 구현, 컴포넌트 개발, 테스트 작성 |
| 아키텍처 설계 | Sonnet | DB 스키마, API 설계, 시스템 구조 |
| 문서 구조화 | Sonnet | 복잡한 문서 작성, 분석 보고서 |
| Orchestration | Opus (메인 세션만) | 소대장 역할, 전체 조율 |

> Sub-agent에서 Opus 절대 금지. Sonnet이 최고 등급.
```

---

## 2.7 rules/06_verification.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/rules/06_verification.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# 규칙 06: 검증 프로세스

---

## 절대 원칙: Task Agent ≠ Verification Agent

자신이 작성한 코드를 자신이 검증하는 것은 **절대 금지**다.

- Task Agent: Task를 실행한 AI 세션
- Verification Agent: **다른** AI 세션 (또는 PO)

같은 Claude Code 세션이더라도 새 대화(새 컨텍스트 창)로 시작해야 한다.
PO가 직접 검증하는 것도 유효한 방법이다.

---

## task_status 전이 규칙

```
Pending
  ↓ (착수 결정)
InProgress
  ↓ (구현 완료)          ↓ (의존성 차단)
Completed              Blocked
  ↓ (검증 실패 후 재작업)    ↓ (차단 해소)
InProgress ←───────────────┘
  ↓ (최종 완료)
Completed (유지)

Failed  ← InProgress에서 복구 불가 오류 발생 시
  ↓ (원인 파악 후 재시도)
InProgress
```

**허용 전이**:
- Pending → InProgress
- InProgress → Completed
- InProgress → Blocked
- InProgress → Failed
- Blocked → InProgress (차단 해소 시)
- Failed → InProgress (재시도 시)
- Completed → InProgress (검증 실패로 재작업 시)

**금지 전이**:
- Completed → Pending (되돌리기 금지)
- Verified → 어떤 상태로도 변경 금지 (Verified는 최종 상태)

---

## verification_status 전이 규칙

```
NotStarted
  ↓ (검증 착수)
InVerification
  ↓ (검증 통과)       ↓ (검증 실패)
Verified           VerificationFailed
                     ↓ (재검증)
                   InVerification
```

**허용 전이**:
- NotStarted → InVerification
- InVerification → Verified
- InVerification → VerificationFailed
- VerificationFailed → InVerification (재검증)

---

## 조합 규칙 표 (유효/무효 조합)

| task_status | verification_status | 유효 여부 | 설명 |
|-------------|--------------------|-----------|----- |
| Pending | NotStarted | 유효 | 미착수 상태 |
| InProgress | NotStarted | 유효 | 작업 중 |
| InProgress | InVerification | 무효 | 작업 중에 검증 불가 |
| Completed | NotStarted | 유효 | 완료 후 검증 대기 |
| Completed | InVerification | 유효 | 검증 진행 중 |
| Completed | Verified | 유효 | 정상 완료 상태 |
| Completed | VerificationFailed | 유효 | 재작업 필요 |
| InProgress | Verified | 무효 | 진행 중인데 검증 완료 불가 |
| Pending | Verified | 무효 | 미착수인데 검증 완료 불가 |
| Failed | Verified | 무효 | 실패 상태에서 검증 완료 불가 |
| Blocked | Verified | 무효 | 차단 상태에서 검증 완료 불가 |

---

## ABSOLUTE RULE: Completed ⇔ Verified

```
task_status = "Completed"
  + verification_status = "Verified"
  = 진정한 완료 상태
```

- `task_status=Completed`만으로는 완료가 아니다.
- `verification_status=Verified` 없이 다음 Stage로 진행 금지.
- 후속 Task의 `dependencies` 해소 조건: 선행 Task가 **Verified** 상태.

---

## Task Verification vs Stage Verification 비교표

| 구분 | Task Verification | Stage Verification |
|------|-------------------|-------------------|
| 단위 | 개별 Task (SAL ID 단위) | Stage 전체 (S0~S4) |
| 시점 | Task 완료 직후 | 해당 Stage의 모든 Task Verified 후 |
| 수행자 | Verification Agent (별도 세션) | PO + Verification Agent |
| 결과 기록 | `grid_records/{SAL_ID}.json` | `TASK_PLAN.md` Stage 섹션 |
| 실패 시 | 해당 Task만 재작업 | 해당 Stage 전체 검토 |
| 다음 단계 조건 | 후속 Task 착수 허용 | 다음 Stage 착수 허용 |
```

---

## 2.8 rules/07_task-crud.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/rules/07_task-crud.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# 규칙 07: Task CRUD 규칙

---

## 5개 필수 동기화 위치

Task를 추가/수정/삭제할 때 아래 5개 위치를 **모두** 동기화해야 한다.

| # | 위치 | 파일 | 도구 | 설명 |
|---|------|------|------|------|
| 1 | `Dev_Package/TASK_PLAN.md` | Markdown | Edit tool | Task 목록, 의존성 다이어그램 |
| 2 | `Dev_Package/Grid/index.json` | JSON | Edit tool | 경량 인덱스 (sal_id, title, status) |
| 3 | `Dev_Package/Grid/grid_records/{SAL_ID}.json` | JSON | Write/Edit tool | 22개 속성 완전한 레코드 |
| 4 | `Dev_Package/Grid/task-instructions/{SAL_ID}-instruction.md` | Markdown | Write tool | AI 실행 지시서 |
| 5 | `Dev_Package/Grid/verification-instructions/{SAL_ID}-verify.md` | Markdown | Write tool | AI 검증 지시서 |

**5개 중 하나라도 빠지면 Task CRUD가 불완전한 것이다.**

---

## Task 추가 시 2단계 프로세스

### Step 1: SAL ID Provisional 할당

TASK_PLAN.md에 Task를 추가할 때 SAL ID가 미확정이면 Provisional ID를 사용:

```
형식: S{stage}{area}?{sequence}
예시: S1BA?1, S2UI?3
```

PO의 TASK_PLAN.md 승인 후 Finalization.

### Step 2: SAL ID Finalization

PO 승인 후 확정 절차:

```
1. TASK_PLAN.md에서 Provisional ID → Finalized ID 교체
   예: S1BA?1 → S1BA1

2. grid_records/ 에 {SAL_ID}.json 신규 생성 (Write tool)
   22개 속성 모두 초기값으로 작성

3. index.json 에 Task 항목 추가 (Edit tool)
   { "sal_id": "S1BA1", "title": "...", ... }

4. task-instructions/{SAL_ID}-instruction.md 생성 (Write tool)
   실행 지시서 작성

5. verification-instructions/{SAL_ID}-verify.md 생성 (Write tool)
   검증 지시서 작성
```

---

## task-instructions 작성 형식

```markdown
# Task 실행 지시서: {SAL_ID}

## Task 개요
- **SAL ID**: {SAL_ID}
- **제목**: {title}
- **Area**: {area_code} — {area_name}
- **Stage**: S{stage} — {stage_name}
- **우선순위**: {priority}
- **의존성**: {dependencies}

## 실행 목표
(이 Task에서 달성해야 할 구체적인 목표)

## 수행 단계
1. (첫 번째 단계)
2. (두 번째 단계)
...

## 예상 산출물
- 파일: (생성될 파일 목록)
- 변경: (수정될 파일 목록)

## 완료 기준
- [ ] (체크리스트 항목 1)
- [ ] (체크리스트 항목 2)

## 주의사항
(Area별 특수 주의사항, 보안, 성능 등)
```

---

## verification-instructions 작성 형식

```markdown
# Task 검증 지시서: {SAL_ID}

## 검증 대상
- **SAL ID**: {SAL_ID}
- **제목**: {title}
- **Task Agent**: (실행한 AI 에이전트)

## 검증 전 확인사항
1. task_status = "Completed" 확인
2. output_files 목록의 파일 존재 확인
3. 본인이 Task Agent가 아님을 확인 (자기 검증 금지)

## 검증 항목
- [ ] (기능 동작 확인 항목)
- [ ] (코드 품질 확인 항목)
- [ ] (보안 확인 항목)
- [ ] (성능 확인 항목)

## 검증 결과 기록
- Verified: grid_records/{SAL_ID}.json의 verification_status → "Verified"
- Failed: notes 필드에 실패 이유 기록, verification_status → "VerificationFailed"
```

---

## 의존성 검증 체크리스트

Task 추가/수정 시 아래를 확인하라:

- [ ] 새 Task의 `dependencies`에 명시된 모든 SAL ID가 존재하는가?
- [ ] 순환 의존성이 없는가? (A→B→A 형태 금지)
- [ ] 의존 Task의 Stage가 현재 Task보다 낮거나 같은가?
- [ ] 의존 Task 삭제 시 해당 Task를 의존하는 다른 Task가 없는가?
- [ ] TASK_PLAN.md의 의존성 다이어그램이 grid_records와 일치하는가?
```

---

## 2.9 methods/ 생성 (2개 파일)

### 2.9.1 methods/00_initial-setup.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/methods/00_initial-setup.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# Method 00: 초기 설정 (Initial Setup)

> SAL Grid Dev Suite 실행 후 가장 먼저 수행하는 환경 확인 및 설정.

---

## 개발 도구 확인 체크리스트

### 필수 CLI 도구
- [ ] Node.js: `node --version` (v18 이상 권장)
- [ ] npm/pnpm: `npm --version` 또는 `pnpm --version`
- [ ] Git: `git --version`
- [ ] Vercel CLI: `vercel --version` (없으면 `npm i -g vercel`)

### 필수 계정/서비스
- [ ] Vercel 계정 연결: `vercel whoami`
- [ ] Supabase 프로젝트 생성 완료
- [ ] GitHub 저장소 생성 완료
- [ ] `.env` 파일 존재 확인 (`.env.example` 참조)

### 환경 변수 확인 (.env)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

---

## Dev Package 구조 확인

초기 실행 시 아래 폴더 구조가 생성되어 있어야 한다:

```
Dev_Package/
  .claude/
    CLAUDE.md           ← 이 파일이 있으면 초기화 완료
    CAUTION.md
    pre-commit-hooks.md
    compliance/
      AI_12_COMPLIANCE.md
    rules/
      01_file-naming.md
      02_save-location.md
      03_area-stage.md
      04_grid-writing-json.md
      05_execution-process.md
      06_verification.md
      07_task-crud.md
    methods/
      00_initial-setup.md   ← 현재 파일
      01_json-crud.md
    work_logs/
      current.md
  Grid/
    index.json
    grid_records/           ← Task JSON 파일들
    task-instructions/      ← Task 지시서들
    verification-instructions/  ← 검증 지시서들
    viewer/
      index.html
      progress.json
  TASK_PLAN.md
  Process/
    S0_프로토타입_제작/
    S1_개발/
    S2_통합/
    S3_테스트/
    S4_배포/
```

---

## GitHub 배포 준비

### GitHub Pages 설정 (Grid Viewer용)
1. GitHub 저장소 → Settings → Pages
2. Source: `main` 브랜치, `/ (root)` 폴더
3. 저장 후 URL 확인: `https://{username}.github.io/{repo}/`

### Vercel 배포 연결
```bash
vercel link          # 기존 프로젝트 연결 또는
vercel              # 신규 프로젝트로 배포
```

### Pre-commit Hook 설치
`.claude/pre-commit-hooks.md` 참조하여 Git hook 설치 확인.
```

---

### 2.9.2 methods/01_json-crud.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/methods/01_json-crud.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# Method 01: JSON CRUD 워크플로우

> Grid 데이터를 안전하게 읽고, 수정하고, 새로 쓰는 방법.

---

## Individual File Approach 설명

이 프로젝트는 하나의 거대한 JSON 파일 대신
**Task 하나당 독립된 JSON 파일**을 사용한다.

**장점**:
- 특정 Task 수정 시 다른 Task에 영향 없음
- Git diff가 명확 (어떤 Task가 변경되었는지 파악 쉬움)
- 대규모 프로젝트에서도 파일 크기 관리 용이
- Task별 독립 검증 가능

**파일 위치**:
```
Grid/
  index.json              ← 경량 인덱스 (전체 목록 파악용)
  grid_records/
    {SAL_ID}.json         ← 개별 Task 완전한 데이터
```

---

## Read → Modify → Write 워크플로우

### Task 상태 업데이트 (Edit tool 사용)

```
1. Read: Grid/grid_records/S1BA1.json
   → 현재 상태 파악

2. Edit: Grid/grid_records/S1BA1.json
   old: "task_status": "Pending"
   new: "task_status": "InProgress"

3. Edit: Grid/index.json
   old: "task_status": "Pending"  (S1BA1 항목)
   new: "task_status": "InProgress"
```

### 새 Task 추가 (Write + Edit 사용)

```
Step 1: Write tool
  파일: Grid/grid_records/S1BA2.json
  내용: 22개 속성 초기값으로 새 파일 생성

Step 2: Edit tool
  파일: Grid/index.json
  tasks 배열 끝에 새 항목 추가:
  {
    "sal_id": "S1BA2",
    "title": "...",
    ...
  }

Step 3: Write tool
  파일: Grid/task-instructions/S1BA2-instruction.md
  내용: 실행 지시서 작성

Step 4: Write tool
  파일: Grid/verification-instructions/S1BA2-verify.md
  내용: 검증 지시서 작성
```

---

## Edit tool vs Write tool 구분

| 상황 | 사용 도구 | 이유 |
|------|-----------|------|
| 기존 JSON 필드 값 변경 | Edit tool | 부분 수정, 나머지 보존 |
| 기존 JSON 배열에 항목 추가 | Edit tool | 부분 수정 |
| 새 JSON 파일 생성 | Write tool | 새 파일 |
| 새 Markdown 파일 생성 | Write tool | 새 파일 |
| 기존 파일 전체 교체 | Write tool | 완전 재작성 필요 시만 |

**주의사항**:
- Edit tool은 old_string이 파일에서 **고유하게** 존재해야 한다.
  (같은 문자열이 2곳 이상이면 실패)
- JSON 들여쓰기는 2칸 스페이스 기준으로 통일
- 배열 마지막 항목 뒤 쉼표 없음 (trailing comma 금지)
- Write tool로 JSON을 덮어쓸 때 22개 속성 중 누락 없는지 확인

---

## 주의사항

1. **Bash로 JSON 수정 금지**: `echo`, `sed`, `jq`로 파일을 덮어쓰면
   다른 필드가 사라질 위험이 있다.

2. **index.json과 grid_records 동시 갱신 필수**: 하나만 수정하면
   두 파일이 불일치 상태가 된다.

3. **SAL ID 변경 금지**: Finalized ID는 변경 불가.
   파일명, JSON 내부, index.json 참조, 의존성 배열 모두 일치해야 한다.

4. **읽기 전 수정 금지**: 반드시 Read tool로 현재 상태 확인 후 Edit.
```

---

## 2.10 compliance/AI_12_COMPLIANCE.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/compliance/AI_12_COMPLIANCE.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# AI 협업 12대 원칙 (AI_12_COMPLIANCE)

> 이 프로젝트에서 AI는 아래 12개 원칙을 반드시 준수한다.
> 위반 시 PO에게 즉시 보고하고 작업을 중단한다.

---

## 원칙 목록

### 1. AI-First 원칙
모든 반복적이고 구조화된 작업은 AI가 먼저 수행한다.
PO는 의사결정, 검토, 승인에 집중한다.
"이 작업을 AI가 할 수 있는가?"를 항상 먼저 자문하라.

### 2. 거짓 보고 금지
작업 완료 보고 시 실제로 파일이 존재하는지, 코드가 실행되는지 확인 후 보고하라.
"완료했습니다"는 증거(파일 경로, 실행 결과)와 함께 보고한다.
추측으로 보고하지 말라.

### 3. 시간 예측 금지
"약 10분 소요됩니다", "곧 완료됩니다" 같은 시간 예측은 하지 않는다.
대신 남은 작업 단계를 구체적으로 나열하라.
예: "다음 3단계가 남았습니다: ①파일 생성 ②JSON 업데이트 ③검증 요청"

### 4. 3개 이상 대안 제시
문제 발생 시 해결 방법을 최소 3가지 제시하고 각각의 장단점을 설명한다.
PO가 선택하게 하라. AI 단독으로 중요한 방향을 결정하지 말라.

### 5. 필수 검증
자신이 작성한 코드나 생성한 파일은 반드시 다른 에이전트(또는 PO)가 검증한다.
자기 검증은 무효다. (rules/06_verification.md 참조)

### 6. 작업 로그 기록
모든 작업 세션에서 `work_logs/current.md`를 갱신한다.
기록 항목: 수행한 Task, 생성한 파일, 발견한 이슈, 다음 세션 시작점.

### 7. 문서 생성 승인
PO가 명시적으로 요청하지 않은 문서(README, 가이드, 보고서 등)를 생성하지 않는다.
문서가 필요하다고 판단되면 생성 여부를 먼저 확인하라.

### 8. 폴더 생성 승인
새 폴더를 생성하기 전 PO에게 확인한다.
단, TASK_PLAN.md에 명시된 구조(Stage 폴더, Area 폴더)는 승인 없이 생성 가능.

### 9. 도구 활용
가능하면 CLI 명령 대신 Read/Edit/Write/Grep/Glob 도구를 사용한다.
특히 JSON 파일 수정 시 Bash echo/sed 사용 금지.

### 10. 불확실하면 질문
요구사항이 모호하거나 기술적 결정이 필요한 경우 추측으로 진행하지 말고 질문한다.
질문은 구체적으로: "A와 B 중 어느 것을 원하십니까?" 형식으로.

### 11. 실행 전 계획
복잡한 Task(3단계 이상)는 실행 전 계획을 요약 보고하고 착수한다.
특히 파일 구조 변경, DB 마이그레이션, 배포 관련 Task는 반드시 계획 확인 후 실행.

### 12. 과잉 설계 금지
요청하지 않은 기능, 추가 최적화, 확장성 고려를 무단으로 구현하지 않는다.
"지금 당장 필요한 것"만 구현한다. YAGNI(You Ain't Gonna Need It) 원칙 준수.

---

> 최초 작성: {TODAY} | 이 원칙은 PO 승인 없이 수정 불가.
```

---

## 2.11 CAUTION.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/CAUTION.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# 주의사항 (CAUTION)

> 이 파일은 세션 시작 시 반드시 읽어야 하는 프로젝트별 주의사항이다.
> AI는 이 파일을 무시하거나 건너뛰지 말라.

---

## 보안 주의사항 (모든 프로젝트 공통)

### RLS (Row Level Security)
- Supabase의 모든 테이블에 RLS 정책이 적용되어 있는지 확인하라.
- 새 테이블 생성 시 RLS 활성화 및 정책 추가를 Migration SQL에 포함하라.
- `service_role` 키는 서버 사이드에서만 사용한다. 클라이언트에 노출 금지.

### .env 파일
- `.env` 파일을 절대 Git에 커밋하지 말라. (`.gitignore`에 포함 확인)
- API 키, 비밀 키, 연결 문자열은 반드시 환경 변수로 관리한다.
- `.env.example`에는 키 이름만 기입하고 실제 값은 비워둔다.

### API 키 관리
- 클라이언트 사이드 코드에 API 키 하드코딩 절대 금지.
- OpenAI, Supabase 등 외부 서비스 키는 Vercel 환경 변수에 등록하라.
- 만약 코드에서 API 키가 발견되면 즉시 PO에게 보고하고 키를 재발급하라.

---

## {PROJECT_NAME} 프로젝트별 주의사항

> 아래 섹션은 프로젝트 진행 중 발견되는 사항을 추가한다.
> 초기에는 비워두며, 이슈 발생 시 AI 또는 PO가 채운다.

### 알려진 이슈
(없음 — 진행 중 발견 시 추가)

### 특수 의존성
(없음 — 진행 중 발견 시 추가)

### 배포 주의사항
(없음 — 진행 중 발견 시 추가)

### 비즈니스 로직 주의사항
(없음 — 진행 중 발견 시 추가)

---

> 최초 생성: {TODAY} | 수정 시 날짜와 수정자(AI/PO)를 기록하라.
```

---

## 2.12 work_logs/current.md 초기화

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/work_logs/current.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.
`{N}`, `{X}` 값은 실제 생성된 Task 수로 치환할 것.

```markdown
# 작업 로그

## {TODAY} — Project SAL Grid 생성
### 작업 상태: 완료

### 생성된 Grid
- 총 Task: {N}개
- S0: {X}개 | S1: {X}개 | S2: {X}개 | S3: {X}개 | S4: {X}개

### 생성된 파일
**Dev Package 인프라**
- Dev_Package/.claude/CLAUDE.md
- Dev_Package/.claude/CAUTION.md
- Dev_Package/.claude/pre-commit-hooks.md
- Dev_Package/.claude/compliance/AI_12_COMPLIANCE.md
- Dev_Package/.claude/rules/01_file-naming.md
- Dev_Package/.claude/rules/02_save-location.md
- Dev_Package/.claude/rules/03_area-stage.md
- Dev_Package/.claude/rules/04_grid-writing-json.md
- Dev_Package/.claude/rules/05_execution-process.md
- Dev_Package/.claude/rules/06_verification.md
- Dev_Package/.claude/rules/07_task-crud.md
- Dev_Package/.claude/methods/00_initial-setup.md
- Dev_Package/.claude/methods/01_json-crud.md
- Dev_Package/.claude/work_logs/current.md (현재 파일)

**Grid 데이터**
- Dev_Package/Grid/index.json
- Dev_Package/Grid/grid_records/ ({N}개 파일)
- Dev_Package/Grid/task-instructions/ ({N}개 파일)
- Dev_Package/Grid/verification-instructions/ ({N}개 파일)

**기획 문서**
- Dev_Package/TASK_PLAN.md

### 다음 세션 시작점
1. Dev_Package/Grid/index.json 에서 Pending 상태 Task 확인
2. S0 Stage Task부터 순서대로 착수
3. 각 Task 착수 전 task-instructions/{SAL_ID}-instruction.md 확인

### 이슈 및 메모
(없음)
```

---

## 2.13 pre-commit-hooks.md 생성

**경로:** `{PROJECT_ROOT}/Dev_Package/.claude/pre-commit-hooks.md`

파일이 없으면 아래 내용으로 **Write tool**로 생성하라.

```markdown
# Pre-commit Hook 자동 실행

> Git commit 시 자동으로 실행되는 3가지 훅.
> AI는 커밋 전 이 파일을 확인하고, 훅이 설치되어 있는지 점검하라.

---

## Hook 설치 확인

```bash
ls .git/hooks/pre-commit
```

파일이 없으면 `.git/hooks/pre-commit`을 생성하고 실행 권한 부여:
```bash
chmod +x .git/hooks/pre-commit
```

---

## 자동 실행 3가지

### Hook 1: Manual MD → HTML 변환

**목적**: Grid Viewer의 Markdown 파일을 HTML로 자동 변환하여 GitHub Pages에서 표시.

**대상 파일**:
```
Dev_Package/Grid/viewer/TASK_PLAN.md → Dev_Package/Grid/viewer/task-plan.html
Dev_Package/Grid/viewer/README.md   → Dev_Package/Grid/viewer/index.html
```

**동작**:
- MD 파일이 변경되었을 때만 변환 실행 (변경 없으면 스킵)
- HTML 변환 도구: `marked` (Node.js) 또는 `python-markdown`
- 변환 실패 시 커밋 차단 (오류 메시지 출력)

---

### Hook 2: Progress JSON 생성

**목적**: Grid Viewer에 표시할 진행률 통계 자동 계산.

**출력 파일**: `Dev_Package/Grid/viewer/progress.json`

**생성 데이터**:
```json
{
  "generated_at": "2026-02-17T00:00:00Z",
  "total": 20,
  "by_status": {
    "Pending": 8,
    "InProgress": 2,
    "Completed": 5,
    "Verified": 4,
    "Blocked": 1,
    "Failed": 0
  },
  "by_stage": {
    "S0": { "total": 3, "verified": 3 },
    "S1": { "total": 8, "verified": 1 },
    "S2": { "total": 5, "verified": 0 },
    "S3": { "total": 3, "verified": 0 },
    "S4": { "total": 1, "verified": 0 }
  },
  "completion_rate": 20
}
```

**동작**:
- `Grid/index.json`을 읽어 통계 계산
- `progress.json` 항상 갱신 (변경 여부 무관)
- 계산 실패 시 커밋 차단

---

### Hook 3: Stage → Root 파일 동기화

**목적**: Verified Task의 Stage 폴더 파일을 프로덕션 Root로 자동 복사.

**동작 조건**: `grid_records/{SAL_ID}.json`에서
- `task_status == "Completed"` AND
- `verification_status == "Verified"`

**동기화 매핑**:

[IF:VANILLA]
| Stage 원본 | Root 대상 | 파일 유형 |
|------------|-----------|-----------|
| `Dev_Package/Process/S{N}_*/pages/*.html` | `pages/` | HTML 페이지 |
| `Dev_Package/Process/S{N}_*/styles/*.css` | `styles/` | 스타일시트 |
| `Dev_Package/Process/S{N}_*/scripts/*.js` | `scripts/` | JavaScript |
| `Dev_Package/Process/S{N}_*/api/**/*.js` | `api/` | API 함수 |
| `Dev_Package/Process/S{N}_*/supabase/migrations/*.sql` | `supabase/migrations/` | DB 마이그레이션 |
[/IF:VANILLA]

[IF:REACT]
| Stage 원본 | Root 대상 | 파일 유형 |
|------------|-----------|-----------|
| `Dev_Package/Process/S{N}_*/src/components/**` | `src/components/` | React 컴포넌트 |
| `Dev_Package/Process/S{N}_*/src/pages/**` | `src/pages/` | 페이지 컴포넌트 |
| `Dev_Package/Process/S{N}_*/src/hooks/**` | `src/hooks/` | Custom hooks |
| `Dev_Package/Process/S{N}_*/src/stores/**` | `src/stores/` | 상태 관리 |
| `Dev_Package/Process/S{N}_*/api/**/*.js` | `api/` | API 함수 |
| `Dev_Package/Process/S{N}_*/supabase/migrations/*.sql` | `supabase/migrations/` | DB 마이그레이션 |
[/IF:REACT]

**동작**:
- Verified Task의 `output_files` 목록을 기준으로 복사
- 이미 동일한 파일이 Root에 있으면 덮어씌움
- 동기화 로그를 커밋 메시지 앞에 자동 추가

---

## Pre-commit Hook 스크립트 (참고)

```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "[Hook 1] MD → HTML 변환..."
# node Dev_Package/Grid/viewer/convert.js

echo "[Hook 2] Progress JSON 생성..."
# node Dev_Package/Grid/viewer/gen-progress.js

echo "[Hook 3] Stage → Root 동기화..."
# node Dev_Package/Grid/viewer/sync-stage.js

echo "Pre-commit hooks 완료."
```

> Hook 스크립트 상세 구현은 S4_배포 Stage의 DV Area Task에서 처리한다.
> 현재는 위 주석 처리된 명령어를 수동으로 실행하라.

---

## AI 수동 실행 (Hook 미설치 시)

커밋 전 AI가 아래를 수동으로 수행:

1. `progress.json` 갱신: `Grid/index.json`을 Read하여 통계 계산 후 Write
2. Verified Task 확인: Grep으로 `verification_status.*Verified` 검색
3. 해당 Task의 Stage 파일을 Root에 복사 (Write tool)
```

---

## 실행 체크리스트 (PART 2 완료 확인)

PART 2 실행 후 AI는 아래 13개 파일이 모두 생성되었는지 확인하라:

```
[ ] Dev_Package/.claude/CLAUDE.md
[ ] Dev_Package/.claude/rules/01_file-naming.md
[ ] Dev_Package/.claude/rules/02_save-location.md
[ ] Dev_Package/.claude/rules/03_area-stage.md
[ ] Dev_Package/.claude/rules/04_grid-writing-json.md
[ ] Dev_Package/.claude/rules/05_execution-process.md
[ ] Dev_Package/.claude/rules/06_verification.md
[ ] Dev_Package/.claude/rules/07_task-crud.md
[ ] Dev_Package/.claude/methods/00_initial-setup.md
[ ] Dev_Package/.claude/methods/01_json-crud.md
[ ] Dev_Package/.claude/compliance/AI_12_COMPLIANCE.md
[ ] Dev_Package/.claude/CAUTION.md
[ ] Dev_Package/.claude/work_logs/current.md
[ ] Dev_Package/.claude/pre-commit-hooks.md
```

13개 모두 확인되면 PART 3으로 진행한다.
미생성 파일이 있으면 해당 섹션으로 돌아가 재생성한다.

# SAL Grid Dev Suite — PART 3 + PART 4 + PART 5

---

# PART 3: 폴더 구조 자동 생성

## 3.1 전체 폴더 구조 즉시 설치

Dev Suite 실행 시 아래 전체 구조를 즉시 생성한다. 이미 존재하는 폴더는 스킵.

### P1~P2 단계 폴더 (선택)

```
{PROJECT_ROOT}/Dev_Package/Process/
├── P1_사업계획/
│   ├── Business_Model/
│   ├── BusinessPlan/
│   ├── Market_Analysis/
│   ├── Patent/
│   └── Vision_Mission/
├── P2_프로젝트_기획/
│   ├── Features/
│   ├── Personas/
│   ├── Requirements/
│   ├── Sitemap/
│   └── Wireframes/
```

생성 조건: 사용자가 P1/P2 단계를 포함하는 경우에만 생성. SAL Grid Dev Suite 진입 시 `AskUserQuestion`으로 확인.

### S0 (필수) — SAL Grid 생성 단계 폴더

```
{PROJECT_ROOT}/Dev_Package/Process/
└── S0_Project-SAL-Grid_생성/
    ├── sal-grid/
    │   ├── task-instructions/
    │   ├── verification-instructions/
    │   ├── stage-gates/
    │   └── TASK_PLAN.md
    ├── method/
    │   └── json/
    │       └── data/
    │           ├── index.json
    │           ├── grid_records/
    │           └── stage_gate_records/
    ├── manual/
    │   └── PROJECT_SAL_GRID_MANUAL.md
    └── viewer/
        ├── viewer_json.html
        └── viewer_database.html
```

S0 폴더는 SAL Grid 방법론의 핵심 구조로 반드시 생성한다.

### S1~S4 (필수) — 개발 단계 폴더 (11 Area 하위)

각 Stage(S1~S4)에 동일한 11개 Area 폴더를 생성한다:

```
S1_개발_준비/
├── Documentation/
├── Design/
├── Frontend/
├── Backend_Infra/
├── Backend_APIs/
├── Database/
├── Security/
├── Testing/
├── DevOps/
├── External/
└── Content_System/
```

S2, S3, S4도 동일한 구조로 생성:

```
S2_개발_1차/     ← 11개 Area 폴더
S3_개발_2차/     ← 11개 Area 폴더
S4_개발_마무리/  ← 11개 Area 폴더
```

Area 코드 → 폴더명 매핑:
| Area 코드 | 폴더명 | 설명 |
|-----------|--------|------|
| M | Documentation/ | 문서화 |
| D | Design/ | 디자인 |
| F | Frontend/ | 프론트엔드 |
| BI | Backend_Infra/ | 백엔드 인프라 |
| BA | Backend_APIs/ | 백엔드 API |
| DB | Database/ | 데이터베이스 |
| S | Security/ | 보안 |
| T | Testing/ | 테스팅 |
| DO | DevOps/ | 데브옵스 |
| E | External/ | 외부 연동 |
| CS | Content_System/ | 콘텐츠 시스템 |

### 지원 폴더

```
Dev_Package/
├── Human_ClaudeCode_Bridge/
│   └── Reports/
├── Process_Monitor/
└── scripts/
```

## 3.2 프로덕션 폴더 생성

방법론(Vanilla / React)에 따라 분기 생성.

### Vanilla 프로덕션 구조

```
{PROJECT_ROOT}/
├── pages/
│   ├── auth/
│   ├── dashboard/
│   └── mypage/
├── api/
│   ├── Backend_APIs/
│   ├── Security/
│   ├── Backend_Infra/
│   └── External/
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── fonts/
├── scripts/
├── index.html
└── 404.html
```

index.html, 404.html은 빈 파일로 생성 (이미 존재하면 스킵).

### React/Next.js 프로덕션 구조

```
{PROJECT_ROOT}/
├── app/
│   ├── api/
│   ├── (pages)/
│   └── layout.tsx
├── components/
│   ├── ui/
│   └── common/
├── lib/
│   ├── utils/
│   └── hooks/
├── public/
│   └── assets/
├── styles/
├── types/
├── .env.local          ← 생성하되 .gitignore에 포함 안내
├── next.config.js
├── tailwind.config.js  ← Tailwind 사용 시
├── tsconfig.json
└── package.json        ← 이미 존재하면 스킵
```

React의 경우 `npx create-next-app@latest` 실행 여부를 사용자에게 확인.

## 3.3 .claude/ 구조

```
Dev_Package/.claude/
├── CLAUDE.md                    ← 프로젝트 전체 컨텍스트 + 운영 원칙
├── CAUTION.md                   ← AI 주의 사항 및 금지 행동
├── pre-commit-hooks.md          ← Pre-commit Hook 규칙 설명
├── rules/
│   ├── 01_file-naming.md        ← 파일명 kebab-case 규칙
│   ├── 02_save-location.md      ← Stage 폴더 우선 저장 규칙
│   ├── 03_area-stage.md         ← 11 Area × 5 Stage 정의
│   ├── 04_grid-writing-json.md  ← JSON 데이터 작성 규칙
│   ├── 05_execution-process.md  ← Task 실행 순서 및 프로세스
│   ├── 06_verification.md       ← 검증 절차 및 기준
│   └── 07_task-crud.md          ← Task 생성/수정/삭제 규칙
├── methods/
│   ├── 00_initial-setup.md      ← 초기 설정 가이드
│   └── 01_json-crud.md          ← JSON CRUD 조작 가이드
├── compliance/
│   └── AI_12_COMPLIANCE.md      ← AI 12대 준수 사항
└── work_logs/
    └── current.md               ← 현재 작업 로그
```

.claude/ 파일들은 SAL Grid Dev Suite 스킬 내 템플릿에서 복사 생성.

## 3.4 폴더 생성 실행 지시

### 실행 원칙

- Bash tool로 `mkdir -p` 명령 사용
- 이미 존재하면 에러 없이 스킵 (mkdir -p의 기본 동작)
- 생성 완료 후 트리 구조 출력으로 확인

### Bash 명령 예시 (Vanilla 기준)

```bash
# S0 핵심 구조
mkdir -p "{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/sal-grid/task-instructions"
mkdir -p "{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/sal-grid/verification-instructions"
mkdir -p "{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/sal-grid/stage-gates"
mkdir -p "{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/method/json/data/grid_records"
mkdir -p "{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/method/json/data/stage_gate_records"
mkdir -p "{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/manual"
mkdir -p "{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/viewer"

# S1~S4 각각 11개 Area
for STAGE in S1_개발_준비 S2_개발_1차 S3_개발_2차 S4_개발_마무리; do
  for AREA in Documentation Design Frontend Backend_Infra Backend_APIs Database Security Testing DevOps External Content_System; do
    mkdir -p "{PROJECT_ROOT}/Dev_Package/Process/${STAGE}/${AREA}"
  done
done

# 지원 폴더
mkdir -p "{PROJECT_ROOT}/Dev_Package/Human_ClaudeCode_Bridge/Reports"
mkdir -p "{PROJECT_ROOT}/Dev_Package/Process_Monitor"
mkdir -p "{PROJECT_ROOT}/Dev_Package/scripts"

# Vanilla 프로덕션
mkdir -p "{PROJECT_ROOT}/pages/auth"
mkdir -p "{PROJECT_ROOT}/pages/dashboard"
mkdir -p "{PROJECT_ROOT}/pages/mypage"
mkdir -p "{PROJECT_ROOT}/api/Backend_APIs"
mkdir -p "{PROJECT_ROOT}/api/Security"
mkdir -p "{PROJECT_ROOT}/api/Backend_Infra"
mkdir -p "{PROJECT_ROOT}/api/External"
mkdir -p "{PROJECT_ROOT}/assets/css"
mkdir -p "{PROJECT_ROOT}/assets/js"
mkdir -p "{PROJECT_ROOT}/assets/images"
mkdir -p "{PROJECT_ROOT}/assets/fonts"
mkdir -p "{PROJECT_ROOT}/scripts"
```

### 생성 완료 확인

```bash
# 폴더 트리 출력 (Windows)
tree "{PROJECT_ROOT}/Dev_Package/Process" /F /A

# 또는 Linux/Mac
find "{PROJECT_ROOT}/Dev_Package/Process" -type d | sort
```

---

# PART 4: SAL Grid 데이터 생성

## 4.1 Task 선정 프로세스 (Provisional ID 부여)

### 단계별 프로세스

**Step 1 — P2 기획서 분석**
- P2_프로젝트_기획/Features/ 또는 Requirements/ 폴더의 문서를 읽는다
- 기능 목록, 사용자 스토리, 요구사항 추출
- 없으면 사용자에게 프로젝트 개요 입력 요청

**Step 2 — 5×11 매트릭스 매핑**
- 각 기능을 Stage(S0~S4) × Area(11개) 교점에 배치
- 배치 기준:
  - S0: SAL Grid 자체 생성 관련 Task
  - S1: 환경 설정, 아키텍처 설계, 공통 모듈
  - S2: 핵심 기능 1차 구현 (로그인, 기본 CRUD)
  - S3: 부가 기능 2차 구현 (고급 기능, 연동)
  - S4: 최적화, 배포, 문서화 마무리

**Step 3 — Task 후보 목록 작성 + Provisional ID 부여**
- SAL ID 형식: `S{Stage}{AreaCode}{순번}` (예: S1F1, S2BA3)
- Area 코드: M/D/F/BI/BA/DB/S/T/DO/E/CS
- 순번: Area 내 동일 Stage에서 1부터 순차 부여

**Step 4 — 의존성 설정**
- 각 Task의 선행 Task(Dependencies) 명시
- 의존성 규칙:
  - 선행 Task Stage ≤ 후행 Task Stage
  - 순환 의존성 없음
  - 존재하지 않는 Task ID 참조 없음
  - Task ID 중복 없음

**Step 5 — 사용자 승인**
- TASK_PLAN.md 초안을 출력하여 확인 요청
- `AskUserQuestion` 사용: "Task 목록이 적절한가요? 추가/수정/삭제할 Task가 있으면 알려주세요."
- 승인 후 다음 단계 진행

**Step 6 — SAL ID Finalization**
- 의존성 검증 재확인
- Task ID 확정 및 모든 데이터 파일 생성

### 의존성 검증 규칙 (상세)

```
Rule 1: Stage 순서 준수
  - dependencies에 명시된 모든 Task의 Stage ≤ 현재 Task의 Stage
  - S2F1이 S3BA1에 의존 → 불가 (S3 > S2)

Rule 2: 순환 의존성 금지
  - A→B→C→A 형태의 순환 의존 불가
  - DAG(Directed Acyclic Graph) 구조 유지

Rule 3: 참조 무결성
  - Dependencies에 명시된 모든 Task ID가 task_ids 목록에 존재해야 함

Rule 4: ID 유일성
  - 동일 Task ID가 두 번 이상 등장하면 오류
```

## 4.2 TASK_PLAN.md 생성

### 파일 경로

```
{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/sal-grid/TASK_PLAN.md
```

### 완전한 내용 구조

```markdown
# TASK PLAN — {PROJECT_NAME}

> 생성일: {TODAY} | 총 Task: {N}개 | 방법론: {Vanilla/React}
> SAL Grid Dev Suite 자동 생성

---

## Stage별 Task 목록

### S0 — Project SAL Grid 생성 ({N}개)

| Task ID | Task 이름 | Area | Dependencies | 실행 방식 | 담당 Agent |
|---------|-----------|------|-------------|----------|-----------|
| S0M1 | SAL Grid 매뉴얼 작성 | M (Documentation) | - | AI-Only | doc-writer |
| S0D1 | 아키텍처 다이어그램 초안 | D (Design) | S0M1 | AI-Only | designer |
| S0BI1 | Pre-commit Hook 설정 | BI (Backend_Infra) | - | AI-Only | devops-engineer |

### S1 — 개발 준비 ({N}개)

| Task ID | Task 이름 | Area | Dependencies | 실행 방식 | 담당 Agent |
|---------|-----------|------|-------------|----------|-----------|
| S1M1 | 기술 스펙 문서 작성 | M (Documentation) | S0M1 | AI-Only | doc-writer |
| S1D1 | UI 디자인 시스템 구축 | D (Design) | S0D1 | AI-Only | designer |
| S1F1 | 공통 컴포넌트 구성 | F (Frontend) | S1D1 | AI-Only | frontend-developer |
| S1BI1 | 서버 환경 설정 | BI (Backend_Infra) | S0BI1 | Human-AI | devops-engineer |
| S1BA1 | API 구조 설계 | BA (Backend_APIs) | S1M1 | AI-Only | backend-developer |
| S1DB1 | 데이터베이스 스키마 설계 | DB (Database) | S1BA1 | AI-Only | db-engineer |
| S1S1 | 보안 정책 수립 | S (Security) | S1M1 | AI-Only | security-engineer |

### S2 — 개발 1차 ({N}개)

| Task ID | Task 이름 | Area | Dependencies | 실행 방식 | 담당 Agent |
|---------|-----------|------|-------------|----------|-----------|
| S2F1 | 로그인/회원가입 페이지 | F (Frontend) | S1F1, S1S1 | AI-Only | frontend-developer |
| S2BA1 | 인증 API 구현 | BA (Backend_APIs) | S1BA1, S1DB1 | AI-Only | backend-developer |
| S2DB1 | 사용자 테이블 마이그레이션 | DB (Database) | S1DB1 | AI-Only | db-engineer |
| S2S1 | JWT 토큰 보안 설정 | S (Security) | S2BA1 | AI-Only | security-engineer |
| S2T1 | 인증 단위 테스트 | T (Testing) | S2BA1, S2F1 | AI-Only | qa-specialist |

### S3 — 개발 2차 ({N}개)

| Task ID | Task 이름 | Area | Dependencies | 실행 방식 | 담당 Agent |
|---------|-----------|------|-------------|----------|-----------|
| S3F1 | 대시보드 페이지 구현 | F (Frontend) | S2F1 | AI-Only | frontend-developer |
| S3BA1 | 핵심 비즈니스 API | BA (Backend_APIs) | S2BA1 | AI-Only | backend-developer |
| S3E1 | 외부 서비스 연동 | E (External) | S3BA1 | Human-AI | backend-developer |
| S3T1 | 통합 테스트 | T (Testing) | S3F1, S3BA1 | AI-Only | qa-specialist |

### S4 — 개발 마무리 ({N}개)

| Task ID | Task 이름 | Area | Dependencies | 실행 방식 | 담당 Agent |
|---------|-----------|------|-------------|----------|-----------|
| S4DO1 | CI/CD 파이프라인 구성 | DO (DevOps) | S3T1 | Human-AI | devops-engineer |
| S4T1 | E2E 테스트 작성 | T (Testing) | S4DO1 | AI-Only | qa-specialist |
| S4M1 | 최종 기술 문서 정리 | M (Documentation) | S4T1 | AI-Only | doc-writer |
| S4BI1 | 프로덕션 배포 | BI (Backend_Infra) | S4DO1 | Human-AI | devops-engineer |

---

## Area별 분포

| Area | S0 | S1 | S2 | S3 | S4 | 합계 |
|------|----|----|----|----|----|----|
| M (Documentation) | 1 | 1 | 0 | 0 | 1 | 3 |
| D (Design) | 1 | 1 | 0 | 0 | 0 | 2 |
| F (Frontend) | 0 | 1 | 1 | 1 | 0 | 3 |
| BI (Backend_Infra) | 1 | 1 | 0 | 0 | 1 | 3 |
| BA (Backend_APIs) | 0 | 1 | 1 | 1 | 0 | 3 |
| DB (Database) | 0 | 1 | 1 | 0 | 0 | 2 |
| S (Security) | 0 | 1 | 1 | 0 | 0 | 2 |
| T (Testing) | 0 | 0 | 1 | 1 | 1 | 3 |
| DO (DevOps) | 0 | 0 | 0 | 0 | 1 | 1 |
| E (External) | 0 | 0 | 0 | 1 | 0 | 1 |
| CS (Content_System) | 0 | 0 | 0 | 0 | 0 | 0 |
| **합계** | **3** | **7** | **5** | **4** | **4** | **23** |

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| {TODAY} | 초기 생성 (SAL Grid Dev Suite 자동 생성) |
```

## 4.3 Task Instruction 파일 생성

### 파일 경로

```
{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/sal-grid/task-instructions/{TaskID}_instruction.md
```

### 완전한 템플릿

```markdown
# {TaskID}: {Task Name}

## Task 정보

| 항목 | 값 |
|------|---|
| Task ID | {TaskID} |
| Task 이름 | {Task Name} |
| Stage | S{N} — {Stage Name} |
| Area | {AreaCode} — {Area Name} |
| Dependencies | {선행 Task ID 쉼표 구분, 없으면 "-"} |
| 실행 방식 | AI-Only / Human-AI |
| Task Agent | {agent-name} |
| 모델 | sonnet / haiku |

## 배경 및 목적

{기획서에서 추출한 이 Task가 필요한 이유와 맥락.
이 Task를 완료해야 다음 단계로 진행 가능한 이유를 서술.
비즈니스 관점에서 왜 이 기능이 필요한지 포함.}

## 생성/수정 대상 파일

| 파일 경로 | 변경 내용 | 저장 위치 규칙 |
|----------|----------|--------------|
| `Dev_Package/Process/S{N}_{StageName}/{AreaFolder}/{filename}` | {설명} | Stage 폴더 우선 |
| `{RootFolder}/{filename}` | Pre-commit 시 Stage에서 자동 동기화 | Root 자동 동기화 |

저장 위치 원칙: 모든 개발 파일은 Stage 폴더에 먼저 저장. Pre-commit Hook 실행 시 Root로 자동 동기화.

## 세부 작업 지시

1. {구체적 작업 1 — 무엇을, 어떻게, 왜}
2. {구체적 작업 2}
3. {구체적 작업 3}
...

### 코드 작성 기준

- 파일 최상단에 `@task {TaskID}` 주석 필수
- 환경 변수는 `.env.local`에서 불러오기 (하드코딩 금지)
- 파일명은 kebab-case 사용
- 함수/변수명은 camelCase (JS/TS) 또는 snake_case (Python)

## 완료 기준 (Definition of Done)

- [ ] {파일명} 생성 완료 및 내용 정상 확인
- [ ] {기능} 정상 작동 확인 (브라우저/API 테스트)
- [ ] 선행 Task({Dependencies}) 결과와 호환 확인
- [ ] JSON 상태 업데이트 완료 (`task_status: "Completed"`, `task_progress: 100`)
- [ ] @task 주석이 각 생성 파일 최상단에 존재

## 참조 규칙 파일

- `.claude/rules/01_file-naming.md` — 파일명 규칙
- `.claude/rules/02_save-location.md` — 저장 위치 (Stage 폴더 우선)
- `.claude/rules/03_area-stage.md` — Area/Stage 정의 및 분류 기준
- `.claude/rules/04_grid-writing-json.md` — JSON 데이터 작성 방법
- `.claude/rules/05_execution-process.md` — Task 실행 순서
- `.claude/rules/06_verification.md` — 검증 절차 및 기준
```

### 생성 지시

모든 확정된 Task에 대해 Write tool로 각 `{TaskID}_instruction.md` 파일을 개별 생성.
파일 수 = 총 Task 수.

## 4.4 Verification Instruction 파일 생성

### 파일 경로

```
{PROJECT_ROOT}/Dev_Package/Process/S0_Project-SAL-Grid_생성/sal-grid/verification-instructions/{TaskID}_verification.md
```

### 완전한 템플릿

```markdown
# {TaskID} 검증 지시서

## 검증 정보

| 항목 | 값 |
|------|---|
| Task ID | {TaskID} |
| Task 이름 | {Task Name} |
| Verification Agent | {code-reviewer / qa-specialist / security-auditor / ...} |
| 모델 | sonnet |
| 검증 일시 | {검증 완료 후 기록} |

## 검증 체크리스트

### 1. 파일 존재 확인

- [ ] `{파일 경로 1}` 존재하는가
- [ ] `{파일 경로 2}` 존재하는가
- [ ] 파일명이 kebab-case 규칙을 따르는가
- [ ] `@task {TaskID}` 주석이 파일 최상단에 있는가

### 2. 코드 품질 검증

- [ ] ESLint / Prettier 에러 없음 (해당 언어/환경 시)
- [ ] 하드코딩된 민감 값 없음 (API Key, 비밀번호 등)
- [ ] 환경 변수를 `.env.local`에서 참조하는가
- [ ] 불필요한 console.log / 디버그 코드 제거
- [ ] 주석 적절성 (복잡한 로직에 설명 주석 존재)

### 3. 기능 검증

- [ ] {기능 1} 정상 작동 — 기대 결과: {expected}
- [ ] {기능 2} 정상 작동 — 기대 결과: {expected}
- [ ] 엣지 케이스 처리
  - [ ] 빈 값 / null 입력 처리
  - [ ] 오류 상황 fallback 처리
  - [ ] 네트워크 오류 처리 (API 호출 Task의 경우)

### 4. 통합 검증

- [ ] 선행 Task({Dependencies}) 결과와 호환 확인
- [ ] 다른 Task와 데이터 충돌 없음
- [ ] Stage 폴더 저장 규칙 준수 (`Dev_Package/Process/S{N}_*/`)

### 5. 보안 검증 (해당 시)

- [ ] SQL Injection 방어 (DB 관련 Task)
- [ ] XSS 방어 (Frontend Task)
- [ ] 인증/인가 처리 적절성 (API Task)

## 검증 결과 기록 형식

검증 완료 후 아래 JSON을 `grid_records/{TaskID}.json`에 업데이트:

```json
{
  "task_status": "Completed",
  "task_progress": 100,
  "verification_status": "Verified",
  "test_result": {
    "unit_test": "PASS",
    "integration_test": "PASS",
    "edge_cases": "PASS"
  },
  "build_verification": {
    "compile": "PASS",
    "lint": "PASS",
    "runtime": "PASS"
  },
  "integration_verification": {
    "dependency_propagation": "PASS",
    "data_flow": "PASS"
  },
  "blockers": {
    "count": 0,
    "items": []
  },
  "comprehensive_verification": {
    "status": "Passed",
    "note": "모든 검증 항목 통과"
  }
}
```

검증 실패 시 `blockers.items`에 구체적 이유 기록 후 Task 재실행 요청.
```

## 4.5 JSON 데이터 파일 생성

### 4.5.1 index.json

파일 경로: `method/json/data/index.json`

```json
{
  "project_id": "{프로젝트-이름-kebab-case}",
  "project_name": "{PROJECT_NAME}",
  "method_type": "{Vanilla 또는 React}",
  "created_at": "{TODAY}",
  "updated_at": "{TODAY}",
  "total_tasks": 23,
  "completed_tasks": 0,
  "overall_progress": 0,
  "task_ids": [
    "S0M1", "S0D1", "S0BI1",
    "S1M1", "S1D1", "S1F1", "S1BI1", "S1BA1", "S1DB1", "S1S1",
    "S2F1", "S2BA1", "S2DB1", "S2S1", "S2T1",
    "S3F1", "S3BA1", "S3E1", "S3T1",
    "S4DO1", "S4T1", "S4M1", "S4BI1"
  ],
  "stages": {
    "S0": {
      "name": "Project SAL Grid 생성",
      "name_en": "Project SAL Grid Creation",
      "task_count": 3,
      "completed_count": 0,
      "progress": 0
    },
    "S1": {
      "name": "개발 준비",
      "name_en": "Development Setup",
      "task_count": 7,
      "completed_count": 0,
      "progress": 0
    },
    "S2": {
      "name": "개발 1차",
      "name_en": "Development Phase 1",
      "task_count": 5,
      "completed_count": 0,
      "progress": 0
    },
    "S3": {
      "name": "개발 2차",
      "name_en": "Development Phase 2",
      "task_count": 4,
      "completed_count": 0,
      "progress": 0
    },
    "S4": {
      "name": "개발 마무리",
      "name_en": "Development Finalization",
      "task_count": 4,
      "completed_count": 0,
      "progress": 0
    }
  }
}
```

### 4.5.2 grid_records/{TaskID}.json (22속성 전체)

파일 경로: `method/json/data/grid_records/{TaskID}.json`
총 파일 수: 총 Task 수와 동일

```json
{
  "task_id": "S1F1",
  "task_name": "공통 컴포넌트 구성",
  "stage": 1,
  "area": "F",
  "task_status": "Pending",
  "task_progress": 0,
  "verification_status": "Not Verified",
  "dependencies": "S1D1",
  "task_instruction": "sal-grid/task-instructions/S1F1_instruction.md",
  "task_agent": "frontend-developer",
  "tools": "",
  "execution_type": "AI-Only",
  "generated_files": "",
  "modification_history": "",
  "verification_instruction": "sal-grid/verification-instructions/S1F1_verification.md",
  "verification_agent": "code-reviewer",
  "test_result": "",
  "build_verification": "",
  "integration_verification": "",
  "blockers": "",
  "comprehensive_verification": "",
  "remarks": ""
}
```

22개 속성 목록 (순서 고정):
1. task_id
2. task_name
3. stage
4. area
5. task_status
6. task_progress
7. verification_status
8. dependencies
9. task_instruction
10. task_agent
11. tools
12. execution_type
13. generated_files
14. modification_history
15. verification_instruction
16. verification_agent
17. test_result
18. build_verification
19. integration_verification
20. blockers
21. comprehensive_verification
22. remarks

### 4.5.3 stage_gate_records/S{N}_gate.json

파일 경로: `method/json/data/stage_gate_records/S{N}_gate.json`
총 5개 파일 (S0_gate.json ~ S4_gate.json)

```json
{
  "stage_gate_id": "S1GATE",
  "stage": 1,
  "stage_name": "개발 준비",
  "stage_name_en": "Development Setup",
  "total_tasks": 7,
  "completed_tasks": 0,
  "completion_percentage": 0,
  "verification_checklist": {
    "all_tasks_completed": false,
    "all_tasks_verified": false,
    "no_blockers": false,
    "build_success": false,
    "dependency_chain_complete": false
  },
  "ai_verification_status": "Not Started",
  "ai_verification_timestamp": null,
  "ai_verification_note": "",
  "po_test_status": "Not Started",
  "po_feedback": "",
  "stage_gate_status": "Pending",
  "approved_at": null,
  "verification_report_path": "sal-grid/stage-gates/S1GATE_verification_report.md"
}
```

Stage Gate 상태 흐름:
```
Pending → In Progress → AI Verified → PO Review → Approved
                                              ↘ Rejected → (재작업) → AI Verified
```

Stage Gate 통과 조건:
- `all_tasks_completed: true` — 해당 Stage 모든 Task 완료
- `all_tasks_verified: true` — 모든 Task 검증 통과
- `no_blockers: true` — blockers.count == 0
- `build_success: true` — 빌드 성공 확인
- `dependency_chain_complete: true` — 다음 Stage Dependencies 모두 충족

## 4.6 Viewer HTML 설정

### viewer_json.html

파일 경로: `viewer/viewer_json.html`

- 기존 파일이 있으면 스킵
- 없으면 SSAL Works 공식 viewer 복사:
  - 원본 경로: `G:\내 드라이브\!SSAL_Works_Private\Dev_Package\Process\S0_Project-SAL-Grid_생성\viewer\viewer_json.html`
  - 복사 후 프로젝트 경로에 맞게 data-path 속성 수정

### viewer_database.html

파일 경로: `viewer/viewer_database.html`

- Supabase 연동 viewer (프로젝트에 Supabase가 설정된 경우)
- Supabase URL, anon key를 `viewer_database.html` 내부 설정 섹션에 입력 안내

## 4.7 SAL Grid 생성 완료 보고

모든 파일 생성 완료 후 아래 형식으로 보고:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PROJECT SAL GRID 생성 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  프로젝트: {PROJECT_NAME}
  방법론:   {Vanilla / React}
  총 Task:  {N}개
  생성일:   {TODAY}

  Stage별 Task 수
━━━━━━━━━━━━━━━━━━━━
  S0 Project SAL Grid 생성 ... {N}개
  S1 개발 준비 .............. {N}개
  S2 개발 1차 ............... {N}개
  S3 개발 2차 ............... {N}개
  S4 개발 마무리 ............ {N}개

  생성된 파일 목록
━━━━━━━━━━━━━━━━━━━━
  TASK_PLAN.md                          1개
  task-instructions/*.md               {N}개
  verification-instructions/*.md       {N}개
  index.json                            1개
  grid_records/*.json                  {N}개
  stage_gate_records/*_gate.json        5개
  .claude/ 파일                        13개
  viewer HTML                           2개

  다음 단계: S0 Task 실행 시작
  명령: /sal-grid-dev 또는 S0M1 Task 직접 실행
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# PART 5: Pre-commit Hook + 자동화 스크립트 설정

## 5.1 scripts/sync-to-root.js 생성

Stage 폴더에서 개발된 파일을 Root 프로덕션 폴더로 자동 동기화하는 스크립트.

파일 경로: `{PROJECT_ROOT}/scripts/sync-to-root.js`

```javascript
// scripts/sync-to-root.js
// @task S0BI1 (Pre-commit Hook 설정)
// Stage 폴더 → Root 프로덕션 폴더 자동 동기화

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// ── Vanilla: Stage Area → Root 경로 매핑 ──────────────────────────
const VANILLA_MAPPING = [
  {
    from: 'Dev_Package/Process/S*/Frontend',
    to: 'pages/',
    desc: 'Frontend → pages/'
  },
  {
    from: 'Dev_Package/Process/S*/Backend_APIs',
    to: 'api/Backend_APIs/',
    desc: 'Backend_APIs → api/Backend_APIs/'
  },
  {
    from: 'Dev_Package/Process/S*/Security',
    to: 'api/Security/',
    desc: 'Security → api/Security/'
  },
  {
    from: 'Dev_Package/Process/S*/Backend_Infra',
    to: 'api/Backend_Infra/',
    desc: 'Backend_Infra → api/Backend_Infra/'
  },
  {
    from: 'Dev_Package/Process/S*/External',
    to: 'api/External/',
    desc: 'External → api/External/'
  },
];

// ── 파일 재귀 탐색 ─────────────────────────────────────────────────
function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  });
  return fileList;
}

// ── glob 패턴 → 실제 경로 목록 변환 ──────────────────────────────
function resolveGlobPattern(pattern) {
  // S* 패턴: S1~S4 Stage 폴더 매핑
  const stages = ['S1_개발_준비', 'S2_개발_1차', 'S3_개발_2차', 'S4_개발_마무리'];
  const basePart = pattern.replace('S*', '');
  const dirs = stages.map(stage =>
    path.join(ROOT, basePart.replace('S*', stage))
  );
  return dirs;
}

// ── 파일 복사 실행 ────────────────────────────────────────────────
let totalCopied = 0;
let totalSkipped = 0;

console.log('\n[sync-to-root] Stage → Root 동기화 시작...\n');

VANILLA_MAPPING.forEach(({ from, to, desc }) => {
  const sourceDirs = resolveGlobPattern(from);
  const destBase = path.join(ROOT, to);

  sourceDirs.forEach(sourceDir => {
    if (!fs.existsSync(sourceDir)) return;

    const files = walkDir(sourceDir);
    files.forEach(srcFile => {
      // .md 파일 및 _instruction/_verification 파일 제외
      const basename = path.basename(srcFile);
      if (
        basename.endsWith('_instruction.md') ||
        basename.endsWith('_verification.md') ||
        basename === 'TASK_PLAN.md'
      ) {
        totalSkipped++;
        return;
      }

      const relativePath = path.relative(sourceDir, srcFile);
      const destFile = path.join(destBase, relativePath);

      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      console.log(`  [COPY] ${path.relative(ROOT, srcFile)}`);
      console.log(`      -> ${path.relative(ROOT, destFile)}`);
      totalCopied++;
    });
  });

  if (totalCopied > 0) {
    console.log(`  ${desc} — 완료\n`);
  }
});

console.log(`\n[sync-to-root] 동기화 완료`);
console.log(`  복사된 파일: ${totalCopied}개`);
console.log(`  스킵된 파일: ${totalSkipped}개\n`);
```

생성 지시: Write tool로 `scripts/sync-to-root.js`에 저장.

## 5.2 scripts/build-web-assets.js 생성

Manual MD → HTML 변환 및 진행률 JSON 생성 스크립트.

파일 경로: `{PROJECT_ROOT}/scripts/build-web-assets.js`

```javascript
// scripts/build-web-assets.js
// @task S0BI1 (Pre-commit Hook 설정)
// SAL Grid 진행률 계산 + Manual HTML 변환

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'Dev_Package/Process/S0_Project-SAL-Grid_생성/method/json/data');
const PUBLIC_DIR = path.join(ROOT, 'public');

// ── 1. index.json + grid_records/*.json 읽어 진행률 계산 ──────────
function calculateProgress() {
  const indexPath = path.join(DATA_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) {
    console.warn('[build-web-assets] index.json 없음, 스킵');
    return null;
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const gridDir = path.join(DATA_DIR, 'grid_records');

  let completedCount = 0;
  const stageProgress = {};

  index.task_ids.forEach(taskId => {
    const taskFile = path.join(gridDir, `${taskId}.json`);
    if (!fs.existsSync(taskFile)) return;

    const task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    const stage = `S${task.stage}`;

    if (!stageProgress[stage]) {
      stageProgress[stage] = { total: 0, completed: 0 };
    }
    stageProgress[stage].total++;

    if (task.task_status === 'Completed') {
      stageProgress[stage].completed++;
      completedCount++;
    }
  });

  return {
    project_id: index.project_id,
    project_name: index.project_name,
    total_tasks: index.total_tasks,
    completed_tasks: completedCount,
    overall_progress: Math.round((completedCount / index.total_tasks) * 100),
    stage_progress: stageProgress,
    generated_at: new Date().toISOString()
  };
}

// ── 2. public/progress.json 생성 ──────────────────────────────────
function writeProgressJson(progress) {
  if (!progress) return;
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const outPath = path.join(PUBLIC_DIR, 'progress.json');
  fs.writeFileSync(outPath, JSON.stringify(progress, null, 2), 'utf8');
  console.log(`[build-web-assets] progress.json 생성: 전체 ${progress.overall_progress}% 완료`);
}

// ── 3. manual/*.md → HTML 변환 (간단 변환) ────────────────────────
function convertManualToHtml() {
  const manualDir = path.join(ROOT, 'Dev_Package/Process/S0_Project-SAL-Grid_생성/manual');
  if (!fs.existsSync(manualDir)) return;

  const mdFiles = fs.readdirSync(manualDir).filter(f => f.endsWith('.md'));
  mdFiles.forEach(mdFile => {
    const mdPath = path.join(manualDir, mdFile);
    const content = fs.readFileSync(mdPath, 'utf8');

    // 간단 MD→HTML 변환 (marked 라이브러리 사용 권장)
    // 여기서는 골격만 생성
    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>SAL Grid Manual</title>
  <style>body { font-family: sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; }</style>
</head>
<body>
<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;

    const htmlFile = mdFile.replace('.md', '.html');
    const htmlPath = path.join(PUBLIC_DIR, htmlFile);
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log(`[build-web-assets] ${mdFile} → ${htmlFile} 변환 완료`);
  });
}

// ── 실행 ──────────────────────────────────────────────────────────
console.log('\n[build-web-assets] 빌드 시작...\n');
const progress = calculateProgress();
writeProgressJson(progress);
convertManualToHtml();
console.log('\n[build-web-assets] 빌드 완료\n');
```

생성 지시: Write tool로 `scripts/build-web-assets.js`에 저장.

## 5.3 .git/hooks/pre-commit 설정

파일 경로: `{PROJECT_ROOT}/.git/hooks/pre-commit`

```bash
#!/bin/sh
# SAL Grid Dev Suite — Pre-commit Hook
# @task S0BI1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PRE-COMMIT HOOK 실행 중..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Stage → Root 동기화 (Vanilla 방법론)
if [ -f "scripts/sync-to-root.js" ]; then
  echo "\n[1/3] Stage → Root 동기화..."
  node scripts/sync-to-root.js
  if [ $? -ne 0 ]; then
    echo "ERROR: sync-to-root.js 실행 실패"
    exit 1
  fi
fi

# 2. 빌드 에셋 생성 (선택)
# echo "\n[2/3] 빌드 에셋 생성..."
# node scripts/build-web-assets.js

# 3. 동기화된 파일 자동 스테이징
echo "\n[2/3] 동기화된 파일 스테이징..."
git add pages/ api/ public/ 2>/dev/null || true

echo "\n[3/3] Pre-commit 검사 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PRE-COMMIT HOOK 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
```

실행 권한 부여:
```bash
chmod +x .git/hooks/pre-commit
```

생성 지시: Write tool로 `.git/hooks/pre-commit`에 저장 후 Bash tool로 `chmod +x` 실행.

## 5.4 React vs Vanilla 분기

### Vanilla 방법론

- `scripts/sync-to-root.js` 생성 및 pre-commit Hook 연결
- Stage 폴더 → Root 폴더 자동 동기화 활성화
- pre-commit에서 `node scripts/sync-to-root.js` 실행

### React / Next.js 방법론

- `sync-to-root.js` 불필요 (Next.js 빌드 시스템이 파일 관리)
- 대신 pre-commit에서 타입 체크만 실행:

```bash
#!/bin/sh
# React/Next.js Pre-commit Hook

echo "PRE-COMMIT HOOK 실행 중..."

# TypeScript 타입 체크
echo "[1/2] TypeScript 타입 체크..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "ERROR: TypeScript 에러 발견. 커밋 취소."
  exit 1
fi

# ESLint 검사
echo "[2/2] ESLint 검사..."
npx eslint . --ext .ts,.tsx --quiet
if [ $? -ne 0 ]; then
  echo "ERROR: ESLint 에러 발견. 커밋 취소."
  exit 1
fi

echo "PRE-COMMIT HOOK 완료"
```

Next.js의 경우 `next build` 자동 실행은 시간이 오래 걸리므로 pre-commit에서는 제외.
대신 CI/CD (GitHub Actions 등)에서 `next build` 실행 권장.

## 5.5 Hook 설정 완료 확인

### 설치 확인

```bash
# 1. Hook 파일 존재 확인
ls -la .git/hooks/pre-commit

# 2. 실행 권한 확인
stat .git/hooks/pre-commit

# 3. Hook 내용 확인
cat .git/hooks/pre-commit
```

### Dry-run 테스트

```bash
# 실제 커밋 없이 Hook만 실행 (테스트용)
bash .git/hooks/pre-commit

# 또는 git commit dry-run
git add .
git stash  # 실제 변경사항 임시 저장
git stash pop
```

### 동기화 확인

```bash
# Stage 폴더에 테스트 파일 생성 후 Hook 실행 확인
echo "test" > Dev_Package/Process/S1_개발_준비/Frontend/test.html
git add .
git commit -m "test: pre-commit hook 확인"
# → pages/test.html 자동 생성 확인
```

## 5.6 Pre-commit Hook 설정 완료 보고

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PRE-COMMIT HOOK 설정 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  방법론:   {Vanilla / React}
  Hook 경로: .git/hooks/pre-commit
  실행 권한: chmod +x 완료

  {Vanilla 시}
  scripts/sync-to-root.js       생성 완료
  scripts/build-web-assets.js   생성 완료

  {React 시}
  TypeScript 타입 체크 Hook     설정 완료
  ESLint 검사 Hook              설정 완료

  테스트 방법:
  $ bash .git/hooks/pre-commit

  다음 단계: S1 Task 실행 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

# SAL Grid Dev Suite — PART 6~9 + APPENDIX + Special Commands

---

# PART 6: Task 실행 프로세스 ★★★ 핵심 확장

## 6.1 6단계 실행 루프 (상세)

각 Task에 대해 아래 순서를 정확히 따릅니다.
순서를 건너뛰거나 바꾸지 마세요. 반드시 이 순서대로 실행합니다.

```
① Task Instruction 읽기
   Read tool → sal-grid/task-instructions/{TaskID}_instruction.md

② 규칙 파일 확인
   Read tool → .claude/rules/01_file-naming.md   (파일명 규칙)
   Read tool → .claude/rules/02_save-location.md (저장 위치 규칙)
   Read tool → .claude/rules/03_area-stage.md    (Area 정의 확인)

③ JSON 상태 업데이트 (In Progress)
   Read tool → sal-grid/grid_records/{TaskID}.json
   Edit tool → task_status: "In Progress"
   Edit tool → task_progress: 0

④ Task Agent 서브에이전트 투입 (Task tool)
   → PART 6.2 참조: 프롬프트 작성 방법

⑤ Task 완료 처리 (서브에이전트 결과 수신 후)
   Edit tool → task_status: "In Progress" → "Executed"
   Edit tool → task_progress: 100
   Edit tool → generated_files: "파일1, 파일2, ..."
   Edit tool → modification_history: "{TODAY}: 최초 생성"

⑥ JSON 기록 및 work_logs 업데이트
   Edit tool → sal-grid/grid_records/{TaskID}.json (나머지 필드 갱신)
   Edit tool → .claude/work_logs/current.md (실행 결과 기록)
```

> 주의: ③단계에서 반드시 Read tool로 기존 JSON을 먼저 읽은 뒤 Edit tool로 수정합니다.
> Write tool로 JSON 전체를 덮어쓰는 것은 절대 금지입니다.

---

## 6.2 Task Agent 프롬프트 작성 가이드 ★★★

Task tool을 호출할 때 `prompt` 필드에 아래 구조로 작성하세요.
각 플레이스홀더({...})는 실제 값으로 치환합니다.

```
## 당신의 역할
당신은 {task_agent} 역할의 서브에이전트입니다.
아래 Task를 완전히 수행하고 결과를 반환하세요.
작업 중간에 멈추거나 확인을 요청하지 말고 끝까지 수행하세요.

## Task 정보
- Task ID:    {TaskID}
- Task 이름:  {Task Name}
- Stage:      S{N} — {Stage Name}
- Area:       {Area Code} — {Area Name}
- 방법론:     {Vanilla / React}

## Task Instruction
(sal-grid/task-instructions/{TaskID}_instruction.md 파일 내용 전체를 여기에 붙여넣기)

## 필수 준수 규칙

### 파일명 규칙 (01_file-naming.md)
- 모든 프로덕션 파일은 kebab-case 사용
- 파일 최상단에 반드시 @task {TaskID} 주석 삽입
- 예시: <!-- @task S1F1 --> (HTML), // @task S1BA1 (JS)

### 저장 위치 규칙 (02_save-location.md)
- F Area   → Process/S{N}_{StageName}/Frontend/
- BA Area  → Process/S{N}_{StageName}/Backend_APIs/
- D Area   → supabase/migrations/ 또는 Process/S{N}_{StageName}/Database/
- S Area   → Process/S{N}_{StageName}/Security/
- BI Area  → Process/S{N}_{StageName}/Backend_Infra/
- E Area   → Process/S{N}_{StageName}/External/
- (해당 Area 코드에 맞는 경로를 사용하세요)

## 프로덕션 환경
- 호스팅:     Vercel (서버리스 함수 지원)
- 데이터베이스: Supabase PostgreSQL (해당되는 경우)
- 인증:       Supabase Auth (해당되는 경우)
- 정적 자원:  public/ 디렉토리

## 완료 조건
(Instruction 파일의 "완료 기준" 목록을 그대로 붙여넣기)

## 중요 사항
1. 파일 생성 전 Read tool로 기존 파일 존재 여부 확인 (덮어쓰기 금지)
2. JSON 파일은 반드시 Edit tool로만 수정 (Write tool 전체 덮어쓰기 금지)
3. 하드코딩 금지: API 키, URL, 비밀번호는 환경 변수로 처리
4. 오류 처리(try-catch 또는 .catch()) 반드시 포함
5. 작업 완료 후 생성/수정된 파일 전체 경로 목록을 반환
```

### 모델 선택 기준

| 작업 유형 | 모델 | 이유 |
|-----------|------|------|
| JSON 파일 생성 / 갱신 | `haiku` | 단순 구조화 작업 |
| 텍스트 문서 작성 | `haiku` | 단순 변환 |
| 파일 복사 / 이동 | `haiku` | 단순 반복 |
| HTML / CSS 코드 작성 | `sonnet` | UI 품질 보장 |
| JavaScript / API 로직 | `sonnet` | 복잡한 로직 |
| 보안 / 인증 구현 | `sonnet` | 정확성 중요 |
| 테스트 작성 / 분석 | `sonnet` | 분석적 사고 필요 |
| **opus** | **절대 금지** | 메인 세션(소대장) 전용 |

---

## 6.3 Stage 단위 배치 실행

### 의존성 기반 배치 구성 원칙

Stage를 실행하기 전에 해당 Stage의 모든 Task를 파악하고,
의존성(`dependencies` 필드)을 분석하여 배치(Batch)를 구성합니다.

```
Step 1: Stage S{N} 내 Task 목록 파악
         → sal-grid/index.json 읽기 → task_ids 필터 (S{N}으로 시작)

Step 2: 각 Task의 dependencies 확인
         → 의존성 없는 Task 그룹 → Batch A (동시 투입 가능)
         → Batch A에 의존하는 Task → Batch B (Batch A 완료 후 투입)
         → Batch B에 의존하는 Task → Batch C
         → ... (의존성 체인이 끊어질 때까지 반복)

Step 3: 배치 순서대로 Task tool 병렬 호출
         → Batch A 완료 확인 → Batch B 투입
         → Batch B 완료 확인 → Batch C 투입
```

### 배치 실행 예시 (S1)

```
S1 Task 목록:
  S1F1  (dependencies: [])       ← Batch A
  S1BA1 (dependencies: [])       ← Batch A
  S1D1  (dependencies: [])       ← Batch A
  S1S1  (dependencies: [])       ← Batch A
  S1F2  (dependencies: ["S1D1"]) ← Batch B (S1D1 완료 후)

실행 순서:
  Batch A: [S1F1, S1BA1, S1D1, S1S1] → 동시 4개 서브에이전트 투입
    ↓ (전부 Executed 상태 확인 후)
  Batch B: [S1F2] → 1개 서브에이전트 투입 (S1D1 의존)
```

### 병렬 Task tool 호출 시 주의사항

- 같은 응답에서 여러 Task tool을 동시에 호출하면 병렬 실행됩니다.
- 최대 3~5개 병렬 투입을 권장합니다 (리소스 고려).
- 동일한 파일을 수정하는 Task는 반드시 순서대로 투입하세요 (충돌 방지).

---

## 6.4 Human-AI Task 처리

`execution_type`이 `"Human-AI"` 또는 `"Human-Assisted"`인 Task는
PO의 직접 참여가 필요합니다. AI가 단독으로 완료할 수 없습니다.

### 사전 안내 메시지 형식

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Human-AI Task] {TaskID}: {Task Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이 Task는 PO의 직접 참여가 필요합니다.

필요한 설정:
  1. {외부 서비스} 계정 생성
     URL: {서비스 URL}
  2. API 키 발급
     방법: {발급 절차}
  3. 환경 변수 설정
     파일: .env.local
     변수: {ENV_VAR_NAME}={설명}

설정 완료 후 "완료"라고 말씀해주세요.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

AskUserQuestion tool로 PO 설정 완료 여부를 확인한 뒤,
확인이 되면 나머지 AI 수행 부분을 Task Agent로 투입합니다.
PO가 설정한 환경 변수를 Task Agent 프롬프트에 명시합니다.

---

## 6.5 작업 완료 시 로그 기록 형식

Task 실행 완료 후 `.claude/work_logs/current.md`에 아래 형식으로 추가합니다.
기존 내용을 덮어쓰지 말고 맨 아래에 추가(append)합니다.

```markdown
## {TODAY} — {TaskID} 실행 완료

### 실행 결과
- Task:     {TaskID} — {Task Name}
- Stage:    S{N} — {Stage Name}
- Area:     {Area Code} — {Area Name}
- 상태:     Executed (Verification Agent 투입 대기)
- 모델:     {haiku / sonnet}

### 생성/수정 파일
- `Process/S{N}_{StageName}/Frontend/{파일명}.html` — {간단 설명}
- `Process/S{N}_{StageName}/Backend_APIs/{파일명}.js` — {간단 설명}

### 다음 단계
- Verification Agent ({verification_agent}) 투입 예정
- 검증 완료 후 task_status: "Completed" 업데이트
```

---

## 6.6 실행 중 오류 처리

| 상황 | 대응 방법 |
|------|----------|
| 서브에이전트 파일 생성 실패 | 오류 메시지 읽기 → 원인 분석 → 수정된 프롬프트로 재투입 |
| 의존성 파일 없음 | 선행 Task의 task_status 확인 → 선행 Task를 먼저 완료 |
| 경로 / 권한 오류 | 정확한 절대 경로 사용, 대안 경로 시도 후 PO에게 보고 |
| API 키 없음 | PO에게 Human-AI Task로 전환 안내 → 환경 변수 설정 요청 |
| JSON 파싱 오류 | 생성된 JSON 검토 → 문법 교정 후 Edit tool로 재적용 |
| 서브에이전트 타임아웃 | 단일 Task를 더 작은 단위로 분할하여 재투입 |

---

# PART 7: Task 검증 프로세스 ★★★ 핵심 확장

## 7.1 Verification Agent 투입 원칙

**Task Agent != Verification Agent** — 같은 Agent가 자신의 작업을 검증할 수 없습니다.
이 원칙은 SAL Grid의 품질 보증 핵심 규칙입니다. 절대 예외 없습니다.

Main Agent(소대장)가 아래 기준으로 Verification Agent를 선택합니다:

| Area | Verification Agent |
|------|--------------------|
| F (Frontend) | Frontend Verification Engineer |
| BA (Backend APIs) | Backend Verification Engineer |
| D (Database) | Database Verification Engineer |
| S (Security) | Security Verification Engineer |
| BI (Backend Infra) | Backend Verification Engineer |
| E (External) | Integration Verification Engineer |
| T (Test) | QA Verification Engineer |

---

## 7.2 Verification Agent 프롬프트 작성 가이드 ★★★

Task tool로 Verification Agent 투입 시 아래 구조로 프롬프트를 작성합니다.

```
## 당신의 역할
당신은 {verification_agent} 역할의 검증 서브에이전트입니다.
아래 Task의 결과물을 검증하고 상세한 검증 결과를 반환하세요.

[중요] 작업자와 검증자는 반드시 분리되어야 합니다.
당신은 이 Task를 직접 수행한 Agent가 아닙니다.
검증 중 발견한 문제를 직접 수정하지 말고, fix_instructions에 기록하세요.

## 검증 대상
- Task ID:        {TaskID}
- Task 이름:      {Task Name}
- Task Agent:     {task_agent}
- 생성된 파일:    {generated_files 목록}
- 선행 의존성:    {dependencies 목록}

## Verification Instruction
(sal-grid/verification-instructions/{TaskID}_verification.md 파일 내용 전체를 여기에 붙여넣기)

## 검증 수행 절차

1. 파일 존재 확인
   → generated_files의 각 경로를 Read tool로 읽기
   → 파일이 없으면 즉시 "Needs Fix" 반환

2. 코드 품질 검토
   → 파일 내용을 읽어 아래 항목 검증

3. 기능 완성도 검증
   → Task Instruction의 완료 기준 항목을 하나씩 확인

4. 통합 호환성 확인
   → 선행 Task({dependencies}) 파일도 Read tool로 읽어 연동 확인

## 검증 기준

### 공통 파일/코드 품질
- [ ] 파일이 지정된 경로에 실제로 존재하는가
- [ ] 파일명이 kebab-case를 따르는가
- [ ] 파일 최상단에 @task {TaskID} 주석이 있는가
- [ ] 하드코딩된 API 키, URL, 비밀번호가 없는가
- [ ] 오류 처리(try-catch 또는 .catch())가 포함되어 있는가
- [ ] 환경 변수를 올바르게 참조하는가

### 기능 완성도
- [ ] Task Instruction의 완료 기준이 모두 충족되었는가
- [ ] 엣지 케이스(빈 입력, 네트워크 오류, 권한 없음)를 처리하는가
- [ ] 응답 코드/데이터 형식이 명세와 일치하는가

### 통합 호환성
- [ ] 선행 Task({dependencies}) 결과물과 인터페이스가 호환되는가
- [ ] 함수 시그니처, API 경로, 데이터 스키마가 일치하는가

## 검증 결과 반환 형식

반드시 아래 JSON 형식으로만 결과를 반환하세요.
JSON 외 추가 텍스트를 앞뒤에 붙이지 마세요.

{
  "task_id": "{TaskID}",
  "verification_result": "Verified",
  "test_result": {
    "unit_test":        "PASS — 각 함수/컴포넌트 단독 동작 확인",
    "integration_test": "PASS — 선행 Task 결과물과 연동 정상",
    "edge_cases":       "PASS — 예외 입력 처리 확인",
    "manual_test":      "PASS — 파일 구조 및 로직 검토 완료"
  },
  "build_verification": {
    "compile": "PASS — 문법 오류 없음",
    "lint":    "PASS — 코딩 컨벤션 준수",
    "runtime": "PASS — 실행 시 오류 없음"
  },
  "integration_verification": {
    "dependency_propagation": "PASS — 선행 Task 결과 정상 활용",
    "data_flow":              "PASS — 입출력 데이터 흐름 정상"
  },
  "blockers": {
    "count": 0,
    "items": []
  },
  "comprehensive_verification": {
    "status": "Passed",
    "note": "모든 검증 항목 통과. 선행 Task와의 통합도 문제없음."
  },
  "fix_instructions": ""
}

검증 실패(Needs Fix) 시에는:
  "verification_result": "Needs Fix"
  "fix_instructions": |
    수정 필요 항목:
    1. {파일 경로}: {구체적 수정 내용}
    2. {파일 경로}: {구체적 수정 내용}
    수정 후 재검증 필요.
```

---

## 7.3 검증 결과 JSON 기록

Verification Agent로부터 결과를 수신한 즉시 Main Agent가 기록합니다.
반드시 Edit tool을 사용합니다 (Write tool 전체 덮어쓰기 금지).

업데이트 대상 필드 (`sal-grid/grid_records/{TaskID}.json`):

```json
"verification_status":      "Verified" 또는 "Needs Fix",
"test_result":              { ...검증 Agent 반환값 그대로 },
"build_verification":       { ...검증 Agent 반환값 그대로 },
"integration_verification": { ...검증 Agent 반환값 그대로 },
"blockers":                 { ...검증 Agent 반환값 그대로 },
"comprehensive_verification": { ...검증 Agent 반환값 그대로 }
```

검증 결과가 **Verified**이면:
  → `task_status`: `"Executed"` → `"Completed"` 업데이트
  → `task_progress`: 이미 100이면 유지

검증 결과가 **Needs Fix**이면:
  → PART 7.4 Needs Fix 루프 진행

---

## 7.4 Needs Fix 루프

```
Needs Fix 수신
    |
    v
1. fix_instructions 내용 파악
   (어느 파일의 어떤 항목을 수정해야 하는가)

    |
    v
2. JSON 상태 되돌림
   task_status:          "Executed" → "In Progress"
   verification_status:  "Needs Fix" (유지)

    |
    v
3. Task Agent 재투입 (수정 프롬프트)
   → 원래 Task 프롬프트 + 아래 섹션 추가:

   ## 수정 요청 (이전 검증 실패)
   이전 검증에서 아래 항목이 Needs Fix로 처리되었습니다.
   아래 수정 사항만 반영하고, 나머지 파일은 건드리지 마세요.

   {fix_instructions 내용 전체}

   수정 완료 후 수정된 파일 경로 목록과 변경 내용을 반환하세요.

    |
    v
4. 수정 완료 → task_status: "In Progress" → "Executed" 재업데이트

    |
    v
5. Verification Agent 재투입 (동일 또는 다른 Agent)
   → 동일한 검증 프롬프트 사용 (TaskID 동일)

    |
    v
6. Verified → task_status: "Completed"
   반복 Needs Fix → 3회 이상이면 PO에게 보고 후 수동 처리 요청
```

---

## 7.5 Area별 검증 특이사항

Area 코드에 따라 검증 Agent가 특별히 집중해야 할 항목이 다릅니다.
검증 프롬프트의 "검증 기준" 섹션에 아래 항목을 추가하세요.

| Area | 추가 검증 포인트 |
|------|----------------|
| F (Frontend) | HTML 시맨틱 태그 사용, 반응형 CSS(미디어쿼리), XSS 방지(innerHTML 미사용), 접근성(alt, label) |
| BA (Backend APIs) | SQL Injection 방지(파라미터 바인딩), 입력 검증(타입/범위), HTTP 상태 코드 정확성, 인증 헤더 확인 |
| D (Database) | 정규화(중복 컬럼 없음), 인덱스 존재, 마이그레이션 순서(외래키 순서), RLS 정책 적용 |
| S (Security) | 인증 플로우(토큰 발급/갱신/만료), CORS 허용 도메인, 민감 정보 노출 방지, Rate Limiting |
| BI (Backend Infra) | 환경 변수 분리(.env 미커밋), Supabase 클라이언트 초기화 중복 방지, 서버리스 함수 Cold Start 고려 |
| E (External) | API 응답 처리(status 코드별 분기), 타임아웃 설정, 재시도(retry) 로직, Webhook 검증 |
| T (Test) | 테스트 커버리지(핵심 시나리오 포함), 픽스처/목(Mock) 적절성, CI 통합 가능 여부 |

---

# PART 8: Stage Verification + PO 승인

## 8.1 Stage Gate 체크리스트 (5항목)

Stage 내 모든 Task가 `"Completed"` 상태가 된 후,
Main Agent가 직접 아래 5개 항목을 확인합니다.
자동화 스크립트가 아닌 Read tool로 각 파일을 직접 읽어 확인합니다.

```
항목 1. 모든 Task가 task_status = "Completed"인가?
  → sal-grid/index.json 읽기 → task_ids에서 해당 Stage Task 필터
  → 각 sal-grid/grid_records/{TaskID}.json 읽어 task_status 확인
  → 하나라도 "Completed"가 아니면 Stage Gate 중단

항목 2. 모든 Task의 comprehensive_verification.status가 "Passed"인가?
  → 각 grid_records에서 comprehensive_verification 확인
  → "Failed" 또는 누락이 있으면 해당 Task 재검증 후 재확인

항목 3. 전체 Blocker가 0개인가?
  → 각 grid_records에서 blockers.count 확인
  → 0이 아닌 Task가 있으면 해당 Task Needs Fix 처리

항목 4. 전체 빌드가 성공하는가?
  → Vanilla 방법론: 파일 존재 확인 + JS 문법 오류 없음 확인
  → React 방법론: PO에게 "npm run build 실행 요청" (Human-AI Task)

항목 5. 의존성 체인이 완결되었는가?
  → 다음 Stage(S{N+1}) Task들의 dependencies 확인
  → 해당 dependencies가 모두 "Completed"인지 검증
```

모든 항목이 통과되면 Stage Gate Report를 생성합니다.
하나라도 실패하면 해당 항목을 먼저 해결한 뒤 재확인합니다.

---

## 8.2 Stage Verification Report 생성

경로: `sal-grid/stage-gates/S{N}GATE_verification_report.md`

```markdown
# S{N}GATE Verification Report
> 생성일: {TODAY} | Stage: S{N} — {Stage Name} | 방법론: {Vanilla/React}

## 1. Task 완료 현황

| Task ID | Task 이름 | Status | Verification | Blocker | 비고 |
|---------|-----------|--------|-------------|---------|------|
| S{N}F1  | {Task 이름} | Completed | Verified | 0 | - |
| S{N}BA1 | {Task 이름} | Completed | Verified | 0 | - |
| S{N}D1  | {Task 이름} | Completed | Verified | 0 | - |

**완료율: {X}/{N} (100%)**
**전체 Blocker: 0개**

## 2. 빌드/테스트 결과

| 항목 | 결과 | 상세 |
|------|------|------|
| 전체 Task 완료 | PASS | {X}/{N} Completed |
| 종합 검증 | PASS | 전체 Passed |
| 단위 테스트 | PASS | 모든 검증 통과 |
| 통합 테스트 | PASS | 선행 Task 연동 확인 |
| Blocker | PASS | 0개 |
| 의존성 체인 | PASS | S{N+1} 진행 가능 |
| 빌드 | PASS | {파일 존재 확인 / npm run build 결과} |

## 3. AI 검증 의견

{Stage 전체에 대한 종합 평가.
완성도, 코드 품질, 특이사항, 개선 권고 등을
2~4문장으로 기술합니다.}

## 4. PO 테스트 가이드

### 테스트 전 준비
- [ ] 로컬 서버 실행: `npx serve .` (기본 포트 5000) 또는 `npm start` (React)
- [ ] 브라우저 개발자 도구 콘솔 열기 (오류 확인용)
- [ ] 필요 환경 변수 확인: `.env.local` 파일 존재 여부

### 기능별 테스트

#### 기능 1: {기능명}
- **테스트 파일**: `{경로}/{파일명}.html`
- **테스트 방법**:
  1. 브라우저에서 `http://localhost:5000/{파일명}.html` 접속
  2. {조작 순서를 번호로 기술}
- **예상 결과**: {정상 동작 시 보여야 할 결과}
- **실패 기준**: {이런 경우 실패로 판단}

#### 기능 2: {기능명}
(동일 형식 반복)

## 5. AI 권고

이 Stage는 모든 자동 검증 항목을 통과하였습니다.
PO의 직접 테스트를 통한 최종 승인을 요청합니다.
```

---

## 8.3 Stage Gate JSON 업데이트

`sal-grid/stage_gate_records/S{N}_gate.json` 업데이트 (Edit tool 사용):

```json
{
  "total_tasks":             {N},
  "completed_tasks":         {N},
  "completion_percentage":   100,
  "verification_checklist": {
    "all_tasks_completed":       true,
    "all_tasks_verified":        true,
    "no_blockers":               true,
    "build_success":             true,
    "dependency_chain_complete": true
  },
  "ai_verification_status":    "Passed",
  "ai_verification_timestamp": "{TODAY}",
  "ai_verification_note":      "{종합 평가 내용 1~2문장}",
  "po_test_status":            "Pending",
  "stage_gate_status":         "AI Verified"
}
```

---

## 8.4 PO 테스트 요청

Stage Gate JSON 업데이트 완료 후 PO에게 아래 메시지를 출력합니다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  S{N} Stage Gate — AI 검증 완료 (PO 테스트 필요)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AI 검증 결과:  PASSED
완료 Task:     {N}/{N}개 (100%)
Blocker:       0개
빌드:          성공

PO님의 직접 테스트가 필요합니다.
위의 Stage Verification Report에 따라 테스트를 진행해주세요.

보고서 위치:
  sal-grid/stage-gates/S{N}GATE_verification_report.md

테스트 완료 후 아래 중 하나로 응답해주세요:
  "승인"            → S{N+1} Stage 진행
  "거부 + 피드백"  → 수정 후 재검증

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

AskUserQuestion tool로 PO 응답을 기다립니다.

---

## 8.5 PO 승인/거부 처리

### Approved (승인)

PO가 "승인"이라고 응답한 경우:

```json
// sal-grid/stage_gate_records/S{N}_gate.json 업데이트
{
  "po_test_status":    "Tested",
  "po_feedback":       "승인",
  "stage_gate_status": "Approved",
  "approved_at":       "{TODAY}"
}
```

작업 흐름:
1. JSON 업데이트 (위)
2. Git 커밋: `feat: S{N} Stage Gate — PO 승인 완료`
3. 다음 Stage (S{N+1}) 실행 시작

### Rejected (거부)

PO가 "거부 + 피드백"으로 응답한 경우:

```json
// sal-grid/stage_gate_records/S{N}_gate.json 업데이트
{
  "po_test_status":    "Tested",
  "po_feedback":       "{PO가 제공한 피드백 내용}",
  "stage_gate_status": "Rejected"
}
```

작업 흐름:
1. JSON 업데이트 (위)
2. PO 피드백 분석 → 영향을 받는 Task 식별
3. 해당 Task들을 `task_status`: `"Completed"` → `"In Progress"` 되돌림
4. Task Agent 재투입 (피드백 내용을 프롬프트에 포함)
5. 수정 완료 → Verification Agent 재투입
6. Verified → `"Completed"` 업데이트
7. Stage Gate 체크리스트 재확인 → PO 재승인 요청

---

## 8.6 Task Verification vs Stage Verification 명확 구분

| 구분 | Task Verification | Stage Verification |
|------|------------------|-------------------|
| 범위 | 개별 Task 1개 | Stage 내 전체 Task |
| 주체 | Verification Agent (AI 서브에이전트) | Main Agent 직접 수행 |
| 시점 | Task 실행(Executed) 직후 즉시 | 전체 Stage Task Completed 후 |
| 기록 위치 | `grid_records/{TaskID}.json` | `stage_gate_records/S{N}_gate.json` |
| 승인 방식 | AI 자동 (Verified / Needs Fix) | PO 수동 승인 (Approved / Rejected) |
| 보고서 | JSON 데이터 (구조화) | `stage-gates/S{N}GATE_verification_report.md` |
| 실패 시 | Needs Fix 루프 → Task Agent 재투입 | PO 피드백 → Task 수정 → 재승인 |

---

# PART 9: 프로젝트 완료 + 배포

## 9.1 전체 Stage Gate 확인

모든 Stage가 완료된 후 아래 체크리스트를 확인합니다.
각 gate.json을 Read tool로 직접 읽어 `stage_gate_status` 필드를 확인하세요.

```
sal-grid/stage_gate_records/S0_gate.json → stage_gate_status: "Approved"
sal-grid/stage_gate_records/S1_gate.json → stage_gate_status: "Approved"
sal-grid/stage_gate_records/S2_gate.json → stage_gate_status: "Approved"
sal-grid/stage_gate_records/S3_gate.json → stage_gate_status: "Approved"
sal-grid/stage_gate_records/S4_gate.json → stage_gate_status: "Approved"

sal-grid/index.json → task_ids 전체 건수 확인
sal-grid/grid_records/ → 전체 TaskID의 task_status: "Completed" 확인
전체 Task 완료율: 100%
```

5개 Stage 모두 "Approved"이고 Task 완료율 100%인 경우에만 배포를 진행합니다.

---

## 9.2 GitHub Pages 배포 (Viewer)

### 사전 조건 확인

GitHub CLI(gh)가 설치되어 있고 로그인되어 있어야 합니다.
아래 명령어로 확인합니다 (Bash tool 또는 PO에게 요청):

```bash
gh --version    # GitHub CLI 버전 확인
gh auth status  # 로그인 상태 확인
```

### GitHub Pages 배포 절차

```bash
# Step 1: Git 초기화 (기존 repo가 없는 경우)
git init
git branch -M main

# Step 2: 전체 스테이징 및 커밋
git add .
git commit -m "feat: {PROJECT_NAME} — 개발 완료 S0~S4 Stage Gate 통과"

# Step 3: GitHub 레포 생성 및 푸시
gh repo create {프로젝트명-소문자-kebab-case} \
  --public \
  --source=. \
  --push

# Step 4: GitHub Pages 활성화 (main 브랜치 루트)
gh api repos/{GitHub-username}/{repo-name}/pages \
  -X POST \
  -f source='{"branch":"main","path":"/"}'
```

### Viewer URL 패턴

```
https://{GitHub-username}.github.io/{repo-name}/Dev_Package/Process/S0_Project-SAL-Grid_생성/viewer/viewer_json.html
```

배포 후 약 1~2분 뒤 GitHub Pages가 활성화됩니다.
PO에게 URL을 안내하고 접속 가능 여부를 확인받습니다.

---

## 9.3 SSAL Works 플랫폼 연동 (선택)

**PO의 명시적 요청이 있을 때만 수행합니다.**
AI가 자동으로 판단하여 수행하지 않습니다.

PO가 "Viewer 연결해줘" 또는 "SSAL Works에 등록해줘"라고 요청하면:
  → `scripts/connect-viewer.js` 스크립트 실행 (해당 파일이 있는 경우)
  → 없으면 PO에게 스크립트 경로 확인 요청

---

## 9.4 최종 완료 보고

모든 배포가 완료되면 아래 형식으로 최종 보고를 출력합니다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PROJECT SAL GRID — 개발 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  프로젝트: {PROJECT_NAME}
  방법론:   {Vanilla / React}
  완료일:   {TODAY}

  Stage 실행 결과
  ──────────────────────
  S0 Project SAL Grid 생성 ... Approved
  S1 개발 준비 .............. Approved
  S2 개발 1차 ............... Approved
  S3 개발 2차 ............... Approved
  S4 개발 마무리 ............ Approved

  총 Task: {N}개 | 완료: {N}개 (100%)

  배포 현황
  ──────────────────────
  Production:  {Vercel 배포 URL}
  Viewer:      {GitHub Pages URL}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 9.5 최종 Git 커밋

```bash
git add .
git commit -m "feat: {PROJECT_NAME} 개발 완료 — {N}개 Task, S0~S4 Stage Gate 통과"
git push
```

커밋 메시지에는 Task 수와 완료된 Stage 범위를 반드시 포함합니다.

---

# APPENDIX: 참조 테이블

---

## APPENDIX A: 11 Area 정의표

| 코드 | 영문명 | 한글명 | 폴더명 | Task Agent | Verification Agent |
|------|--------|--------|--------|------------|--------------------|
| F | Frontend | 프론트엔드 | Frontend/ | Frontend Developer | Frontend Verification Engineer |
| BA | Backend APIs | 백엔드 API | Backend_APIs/ | Backend API Developer | Backend Verification Engineer |
| D | Database | 데이터베이스 | Database/ | Database Engineer | Database Verification Engineer |
| S | Security | 보안/인증 | Security/ | Security Engineer | Security Verification Engineer |
| BI | Backend Infra | 백엔드 인프라 | Backend_Infra/ | Backend Infra Engineer | Backend Verification Engineer |
| E | External | 외부 연동 | External/ | Integration Engineer | Integration Verification Engineer |
| T | Test | 테스트 | Test/ | QA Engineer | QA Verification Engineer |
| DV | DevOps | 배포/운영 | DevOps/ | DevOps Engineer | DevOps Verification Engineer |
| DS | Design | 디자인 시스템 | Design/ | UI/UX Designer | Frontend Verification Engineer |
| DC | Documentation | 문서화 | Documentation/ | Technical Writer | QA Verification Engineer |
| PM | Project Management | 프로젝트 관리 | Project_Mgmt/ | Project Manager | QA Verification Engineer |

> S0 Stage에서만 PM Area Task가 사용되며, SAL Grid 구조 자체를 생성합니다.
> DS Area는 디자인 토큰, 컴포넌트 가이드라인 등을 관리합니다.

---

## APPENDIX B: 22속성 정의표

| 번호 | 필드명 | 설명 | 타입 | 작성 시점 | 초기값 |
|------|--------|------|------|-----------|--------|
| 1 | task_id | SAL ID (예: S1F1) | String | 생성 시 | 필수 |
| 2 | task_name | Task 이름 (한글) | String | 생성 시 | 필수 |
| 3 | stage | 소속 Stage 번호 (0~4) | Integer | 생성 시 | 필수 |
| 4 | area | Area 코드 (F, BA, D, S, BI, E, T, DV, DS, DC, PM) | String | 생성 시 | 필수 |
| 5 | level | Level 번호 (1~N, Area 내 순번) | Integer | 생성 시 | 필수 |
| 6 | task_status | Task 진행 상태 | Enum | 실행 단계 | "Not Started" |
| 7 | task_progress | 진행률 (0~100) | Integer | 실행 단계 | 0 |
| 8 | task_agent | 수행 Agent 이름 | String | 생성 시 | 필수 |
| 9 | verification_agent | 검증 Agent 이름 | String | 생성 시 | 필수 |
| 10 | verification_status | 검증 상태 | Enum | 검증 후 | "Not Started" |
| 11 | execution_type | 실행 유형 (AI-Only / Human-AI / Human-Assisted) | Enum | 생성 시 | "AI-Only" |
| 12 | dependencies | 선행 Task ID 목록 | Array[String] | 생성 시 | [] |
| 13 | generated_files | 생성된 파일 경로 목록 (콤마 구분) | String | 실행 후 | "" |
| 14 | test_result | 검증 단위/통합 테스트 결과 | Object | 검증 후 | {} |
| 15 | build_verification | 빌드/컴파일/린트 결과 | Object | 검증 후 | {} |
| 16 | integration_verification | 통합 연동 확인 결과 | Object | 검증 후 | {} |
| 17 | blockers | Blocker 수 및 목록 | Object | 검증 후 | {"count":0,"items":[]} |
| 18 | comprehensive_verification | 종합 검증 결과 및 노트 | Object | 검증 후 | {} |
| 19 | modification_history | 수정 이력 (날짜: 내용) | String | 수정 시 | "" |
| 20 | fix_instructions | Needs Fix 시 수정 지침 | String | Needs Fix 시 | "" |
| 21 | notes | 기타 메모 | String | 언제든 | "" |
| 22 | priority | 우선순위 (High / Medium / Low) | Enum | 생성 시 | "Medium" |

---

## APPENDIX C: 상태 전이 규칙

### task_status 전이 다이어그램

```
Not Started
    |
    | (실행 시작 / JSON 업데이트)
    v
In Progress
    |
    | (Task Agent 완료 / generated_files 기록)
    v
Executed
    |               |
    | (Verified)    | (Needs Fix → 재수정)
    v               v
Completed       In Progress  (되돌림 후 재실행)
```

### verification_status 전이 다이어그램

```
Not Started
    |
    | (Verification Agent 투입)
    v
In Review
    |               |
    | (Verified)    | (Needs Fix)
    v               v
Verified        Needs Fix
                    |
                    | (수정 완료 → 재검증)
                    v
                In Review (재투입)
                    |
                    v
                Verified
```

### 상태 전이 규칙 표

| 현재 상태 | 다음 상태 | 조건 |
|-----------|-----------|------|
| Not Started | In Progress | Main Agent가 Task를 시작할 때 |
| In Progress | Executed | Task Agent가 파일 생성 완료 후 |
| Executed | In Review | Verification Agent 투입 시 |
| In Review | Verified | 모든 검증 항목 통과 |
| In Review | Needs Fix | 하나 이상의 검증 항목 실패 |
| Needs Fix | In Progress | 수정 Task Agent 재투입 시 |
| Verified | Completed | Main Agent가 확인 후 최종 업데이트 |
| Completed | In Progress | PO 거부 피드백으로 재작업 시 (예외) |

> "Completed"에서 다시 "In Progress"로 되돌리는 것은 PO가 Stage Gate를 거부한 경우에만 허용됩니다.

---

## APPENDIX D: Vanilla vs React 차이 매핑표

| 항목 | Vanilla (HTML/CSS/JS) | React (Next.js or CRA) |
|------|----------------------|------------------------|
| Root 디렉토리 | `Process/S{N}_{StageName}/` | `Process/S{N}_{StageName}/` |
| 메인 페이지 | `index.html` | `pages/index.jsx` 또는 `app/page.tsx` |
| 에러 페이지 | `404.html` | `pages/404.jsx` 또는 `not-found.tsx` |
| F Area 산출물 | `.html` + `.css` + `.js` | `.jsx`/`.tsx` 컴포넌트 |
| BA Area 산출물 | `api/{기능}.js` (Vercel Functions) | `pages/api/{기능}.js` 또는 `app/api/{기능}/route.ts` |
| 정적 자원 | `assets/` (이미지, 폰트 등) | `public/` (이미지, 폰트 등) |
| 스타일 | `styles/` 또는 파일별 `<style>` | CSS Modules / Tailwind / styled-components |
| 환경 변수 | `.env.local` (`window.env` 또는 Vercel 환경 변수) | `.env.local` (`process.env.NEXT_PUBLIC_*`) |
| 빌드 명령어 | 없음 (정적 파일 그대로 배포) | `npm run build` |
| 배포 방식 | Vercel 정적 호스팅 | Vercel Next.js 빌드 |
| GitHub Pages | 직접 지원 (정적) | `next export` 후 배포 |
| @task 주석 | `<!-- @task {TaskID} -->` (HTML 최상단) | `// @task {TaskID}` (파일 최상단 주석) |
| 패키지 관리 | 없음 (CDN 사용 가능) | `package.json` + `node_modules/` |

---

## APPENDIX E: Stage Gate JSON 템플릿

`sal-grid/stage_gate_records/S{N}_gate.json` 완전 구조:

```json
{
  "stage_id": "S{N}",
  "stage_name": "{Stage Name}",
  "methodology": "Vanilla",
  "total_tasks": 0,
  "completed_tasks": 0,
  "completion_percentage": 0,
  "task_ids": [],
  "verification_checklist": {
    "all_tasks_completed": false,
    "all_tasks_verified": false,
    "no_blockers": false,
    "build_success": false,
    "dependency_chain_complete": false
  },
  "ai_verification_status": "Pending",
  "ai_verification_timestamp": "",
  "ai_verification_note": "",
  "stage_gate_report": "sal-grid/stage-gates/S{N}GATE_verification_report.md",
  "po_test_status": "Pending",
  "po_feedback": "",
  "stage_gate_status": "Pending",
  "approved_at": "",
  "created_at": "{TODAY}",
  "updated_at": "{TODAY}"
}
```

### stage_gate_status 전이

| 값 | 의미 |
|----|------|
| "Pending" | Stage 진행 전 또는 진행 중 |
| "AI Verified" | AI 검증 완료, PO 테스트 대기 |
| "Approved" | PO 승인 완료, 다음 Stage 진행 가능 |
| "Rejected" | PO 거부, 수정 후 재승인 필요 |

---

## APPENDIX F: Sub-agent 레지스트리

### Task Agent 종류 (모델: sonnet 기준)

| 번호 | Agent 이름 | 담당 Area | 주요 책임 |
|------|------------|-----------|----------|
| 1 | Frontend Developer | F | HTML/CSS/JS UI 구현, 반응형 레이아웃, 접근성 |
| 2 | Backend API Developer | BA | REST API, Supabase 쿼리, 서버리스 함수 |
| 3 | Database Engineer | D | 스키마 설계, 마이그레이션, RLS 정책 |
| 4 | Security Engineer | S | 인증/인가, JWT, CORS, Rate Limiting |
| 5 | Backend Infra Engineer | BI | Supabase 클라이언트 설정, 환경 변수 관리 |
| 6 | Integration Engineer | E | 외부 API 연동, Webhook, SDK 통합 |
| 7 | QA Engineer | T | 테스트 코드 작성, 테스트 케이스 정의 |
| 8 | DevOps Engineer | DV | Vercel 설정, CI/CD, 배포 자동화 |

> haiku 모델: JSON 파일 생성 전담 서브에이전트, 텍스트 변환 전담 서브에이전트
> opus 모델: 절대 서브에이전트로 사용 금지 (메인 세션 전용)

### Verification Agent 종류 (모델: sonnet 기준)

| 번호 | Agent 이름 | 검증 대상 Area | 주요 검증 포인트 |
|------|------------|--------------|----------------|
| 1 | Frontend Verification Engineer | F, DS | 시맨틱 HTML, 반응형, 접근성, XSS |
| 2 | Backend Verification Engineer | BA, BI | SQL Injection, 입력 검증, 상태 코드, 인증 |
| 3 | Database Verification Engineer | D | 정규화, 인덱스, 마이그레이션 순서, RLS |
| 4 | Security Verification Engineer | S | 인증 플로우, 토큰, CORS, 민감 정보 노출 |
| 5 | Integration Verification Engineer | E | API 응답 처리, 타임아웃, 재시도 |
| 6 | QA Verification Engineer | T, DC, PM | 테스트 커버리지, 문서 정확성 |

---

# 특수 명령어 (Special Commands)

---

## `/sal-grid-dev add` — 기존 Grid에 Task 추가

기존 SAL Grid가 생성된 상태에서 Task를 추가합니다.

### 실행 절차

```
Step 1: 기존 Grid 현황 파악
  → sal-grid/index.json 읽기
  → 현재 task_ids 목록 및 각 Stage별 분포 확인
  → 가장 마지막 SAL ID 확인 (예: S2F3이 마지막이면 다음은 S2F4)

Step 2: PO에게 새 Task 정보 수집 (AskUserQuestion)
  - Task 이름은 무엇인가요?
  - 어느 Stage(0~4)에 속하는 Task인가요?
  - Area는 무엇인가요? (F/BA/D/S/BI/E/T/DV/DS/DC/PM)
  - 선행 의존성이 있다면 어느 Task ID인가요?
  - 실행 유형은? (AI-Only / Human-AI / Human-Assisted)

Step 3: SAL ID 결정
  → 해당 Stage + Area의 기존 마지막 Level 번호 + 1
  → 예: S2F3이 마지막이면 새 Task는 S2F4

Step 4: 의존성 검증
  → dependencies에 명시된 TaskID가 모두 선행 Stage 이하인지 확인
  → 역방향 의존성(후행 Stage → 선행 Stage) 금지

Step 5: 5개 파일 동시 생성/업데이트 (07_task-crud.md 준수)
  1. sal-grid/grid_records/{NewTaskID}.json (새 파일 생성)
  2. sal-grid/task-instructions/{NewTaskID}_instruction.md (새 파일 생성)
  3. sal-grid/verification-instructions/{NewTaskID}_verification.md (새 파일 생성)
  4. sal-grid/index.json (task_ids에 신규 ID 추가)
  5. sal-grid/stage_gate_records/S{N}_gate.json (total_tasks +1)

Step 6: 완료 보고
  "S{N}{Area}{L}이 추가되었습니다."
  생성 파일 목록 출력
```

---

## `/sal-grid-dev status` — 전체 진행 현황 조회

SAL Grid의 현재 진행 상태를 시각화합니다.

### 실행 절차

```
Step 1: sal-grid/index.json 읽기 → task_ids 전체 목록 파악
Step 2: 각 grid_records/{TaskID}.json 읽기 → task_status 수집
Step 3: stage_gate_records/S{N}_gate.json × 5 읽기 → stage_gate_status 수집
Step 4: 아래 형식으로 출력
```

### 출력 형식

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SAL GRID STATUS — {PROJECT_NAME}
  조회일: {TODAY}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Overall: XX% (XX/XX tasks completed)

  Stage 현황
  ─────────────────────────────────────────────
  S0  [██████████] 10/10 (100%)  [Approved]
  S1  [████░░░░░░]  4/10  (40%)  [In Progress]
  S2  [░░░░░░░░░░]  0/15   (0%)  [Pending]
  S3  [░░░░░░░░░░]  0/12   (0%)  [Pending]
  S4  [░░░░░░░░░░]  0/ 8   (0%)  [Pending]

  현황 요약
  ─────────────────────────────────────────────
  Completed:    XX개
  In Progress:   X개 (현재 실행 중)
  Executed:      X개 (검증 대기)
  Not Started:  XX개
  Active:        X개 | Blockers: X개

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

진행 바 계산:
- 전체 10칸 기준
- 완료 비율(%)에 따라 채워진 블록(█) 수 계산
- 예: 40% → █ 4개 + 빈칸 6개

---

## `/sal-grid-dev rebuild` — SAL Grid 전체 재생성

TASK_PLAN.md를 기반으로 SAL Grid를 처음부터 재생성합니다.

### 실행 절차

```
Step 1: 기존 진행 상태 백업
  → sal-grid/ 폴더를 sal-grid-backup-{YYYYMMDD-HHMMSS}/ 로 복사
  → 백업 완료 메시지 출력

Step 2: TASK_PLAN.md 재파싱
  → Read tool로 sal-grid/TASK_PLAN.md 읽기
  → 전체 Task 목록 재추출

Step 3: 기존 진행 상태 복원 여부 확인 (AskUserQuestion)
  "sal-grid-backup-{timestamp}/에 기존 진행 내역이 백업되었습니다.
   재생성 후 기존 진행 상태(Completed, Verified 등)를 복원할까요?
   예) 복원 O   / 아니오) 새로 시작"

Step 4-A: 복원 O인 경우
  → sal-grid/ 전체 재생성 (PART 2~5 절차대로)
  → 백업 파일에서 task_status, verification_status, generated_files,
    test_result, modification_history 등 진행 관련 필드 복사
  → stage_gate_records의 승인 상태도 복원

Step 4-B: 새로 시작인 경우
  → sal-grid/ 전체 재생성 (PART 2~5 절차대로)
  → 모든 상태를 초기값으로 설정

Step 5: 완료 보고
  "SAL Grid가 재생성되었습니다.
   기존 백업: sal-grid-backup-{timestamp}/
   총 Task: {N}개"
```

---

## 주의사항 (전체 스킬 공통)

1. **폴더 임의 생성 금지** — 반드시 PO 승인 후 생성. 사전 경로 안내 후 확인 요청.
2. **기존 파일 덮어쓰기 금지** — Read tool로 파일 존재 여부를 먼저 확인. 이미 존재하면 스킵 또는 확인 요청.
3. **SAL ID 역방향 의존성 금지** — 선행 Stage 번호는 항상 후행 Stage 번호보다 작거나 같아야 함. S2가 S3에 의존할 수 없음.
4. **Completed는 Verified 후에만** — Verification Agent가 "Verified"를 반환한 후에만 task_status를 "Completed"로 변경. 절대 예외 없음.
5. **Task Agent != Verification Agent** — 동일 Agent가 자신의 결과물을 검증하는 것은 절대 금지.
6. **JSON 문법 확인** — JSON 파일 생성/수정 후 필드 누락, 쉼표 오류, 따옴표 오류가 없는지 반드시 확인.
7. **프로젝트 맥락 계승** — 실행 전 Brainstorming 자료 및 프로토타입 파일을 반드시 읽고 시작. 맥락 없이 진행 금지.
8. **sub-agent 모델 원칙** — haiku(단순 반복/변환), sonnet(복잡한 코드/분석), opus는 서브에이전트로 절대 사용 금지.
9. **Edit tool 우선** — JSON 파일은 항상 Edit tool로 부분 수정. Write tool로 전체 덮어쓰기는 데이터 손실 위험.
10. **의존성 먼저 완료** — dependencies에 명시된 Task가 "Completed" 상태인지 확인 후 해당 Task를 시작.

---

## 관련 특허

> 3차원 좌표계(Stage-Area-Level)가 인코딩된 식별자 기반으로 구축하는 소프트웨어 개발 방법론 (특허 출원)
>
> SAL Grid의 핵심 개념:
> - S(Stage): 개발 단계 (0~4)
> - A(Area): 기술 영역 (F, BA, D, S, BI, E, T, DV, DS, DC, PM)
> - L(Level): Area 내 순번 (1~N)
>
> SAL ID 예시: S2BA3 = Stage 2, Backend APIs, Level 3