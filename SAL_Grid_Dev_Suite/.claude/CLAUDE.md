# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🚨🚨🚨 7대 작업 규칙 - 반드시 먼저 확인! 🚨🚨🚨

> **⛔ 파일 생성/저장 전 반드시 해당 규칙 파일을 읽어야 함!**
> **⛔ 규칙 확인 없이 폴더 생성/파일 저장 절대 금지!**
> **⛔ "이렇게 하면 되겠지" 추측 금지 - 규칙 파일이 정답!**

| # | 규칙 파일 | 확인 시점 | 내용 |
|---|----------|----------|------|
| 1 | `01_file-naming.md` | 파일명 정할 때 | 파일 명명 규칙 |
| 2 | `02_save-location.md` | **파일 저장할 때** ⭐ | 저장 위치 규칙 |
| 3 | `03_area-stage.md` | 폴더 선택할 때 | Area/Stage 매핑 |
| 4 | `04_grid-writing-json.md` | **Grid/JSON/Viewer 작업할 때** ⭐ | Grid 작성 + JSON CRUD + **Viewer 확인** |
| 5 | `05_execution-process.md` | Task 실행할 때 | 6단계 실행 프로세스 |
| 6 | `06_verification.md` | 검증할 때 | 검증 기준 |
| 7 | `07_task-crud.md` | **Task 추가/삭제/수정할 때** ⭐ | Task CRUD 프로세스 |

**📁 위치:** `.claude/rules/`

### SAL ID 의존성 규칙 요약 ⭐

> **Task 추가/수정 시 반드시 확인! 상세: `03_area-stage.md` 섹션 3.1**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 의존성 방향: 선행 Task ID < 후행 Task ID                  │
│    → S0DB1 → S1FE1 (O), S1FE1 → S0DB1 (X) 역방향 금지      │
│                                                             │
│ 2. 병렬 실행: 동일 Stage·Area 내 Task는 병렬 가능           │
│    → S1FE1, S1FE2, S1FE3는 동시 실행 가능                   │
│                                                             │
│ 3. 실행 순서: S0 → S1 → S2 → S3 → S4 순서                  │
│                                                             │
│ 4. SAL ID Provisional → Finalization 프로세스 필수          │
│    → 의존성 검증 후에만 ID 확정                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DB vs JSON 데이터 구분 (핵심 개념)

> **이 구분을 이해해야 viewer 관련 작업 시 혼란이 없음!**

### 두 가지 Viewer

| Viewer | 데이터 소스 | 용도 |
|--------|------------|------|
| `viewer_database.html` | SSAL Works DB | **예시** (참고용, 고정) |
| `viewer_json.html` | 본인 JSON 파일 | **내 프로젝트** (진행 중) |

### 작동 원리

```
┌─────────────────────────────────────────────────────────────┐
│  viewer_database.html                                       │
│  → SSAL Works 프로젝트 데이터 = "예시"로 고정                 │
│  → "완성된 프로젝트는 이렇게 보입니다" 참고용                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  viewer_json.html ⭐ 주로 사용                               │
│  → 내가 진행 중인 프로젝트 데이터                              │
│  → Task 완료할 때마다 업데이트됨                              │
│  → 경로: method/json/data/index.json + grid_records/*.json  │
└─────────────────────────────────────────────────────────────┘
```

### ⚠️ 일반 이용자는 JSON 사용

```
✅ 내 프로젝트 진행 상황 = JSON 파일 (index.json + grid_records/*.json)
✅ Task 완료 시 = 해당 Task의 grid_records/{TaskID}.json 파일 업데이트
✅ Task 추가 시 = index.json에 task_id 추가 + grid_records/에 새 파일 생성
✅ 진행 현황 확인 = viewer_json.html

❌ Supabase DB = 사용하지 않음 (SSAL Works 예시용)
```

### 📂 JSON 폴더 구조 (개별 파일 방식)

```
method/json/data/
├── index.json             ← 프로젝트 메타데이터 + task_ids 배열
└── grid_records/          ← 개별 Task JSON 파일
    ├── S0BI1.json
    ├── S0BI2.json
    └── ... (Task ID별 파일)
```

---

## ⛔⛔⛔ 절대 규칙 - 위반 시 작업 중단! ⛔⛔⛔

### 절대 규칙 1: 폴더 임의 생성 금지

```
🚫 폴더를 절대로 임의 생성하지 마라!
🚫 기존 폴더 확인 없이 새 폴더 만들면 파일 추적 불가!
🚫 "일단 만들고 나중에 정리" = 절대 금지!
```

**폴더 생성이 필요할 때 필수 프로세스:**

1. **즉시 작업 중단**
2. **기존 폴더 확인** - 정말 적절한 폴더가 없는가?
3. **사용자에게 승인 요청** (아래 양식 필수)
4. **승인 받은 후에만 폴더 생성**

**승인 요청 양식 (필수):**
```
"폴더 생성 승인 요청

📁 생성할 폴더: [전체 경로]
📝 생성 이유: [왜 이 폴더가 필요한지 구체적으로]
🔍 대안 검토: [기존 폴더 중 사용 가능한 것이 없는 이유]
📂 기존 폴더 목록: [확인한 유사 폴더들]

승인하시겠습니까?"
```

**❌ 절대 금지 행동:**
- 승인 없이 폴더 생성
- 기존 폴더 확인 없이 새 폴더 생성
- 오타나 유사 이름으로 중복 폴더 생성 (sal-grid vs ssal-grid 같은 실수)

---

### 절대 규칙 2: 일반 작업 - 검증 및 문서화 필수

> **적용 대상**: Project SAL Grid Task가 아닌 모든 요청 (한 건씩 처리)

```
🚫 작업만 하고 검증 없이 완료 보고 금지!
🚫 검증 없이 work_logs 업데이트 금지!
🚫 Reports 폴더 저장 생략 금지!
```

**필수 프로세스 (단순 - 4단계):**
```
1. 작업 수행
     ↓
2. 검증 에이전트 투입 (Task tool 사용)
   - Main Agent가 작업 내용을 판단하여 적절한 검증 에이전트를 선택·투입
   - 검증 결과 받기
     ↓
3. 문서화 (두 곳 모두 필수!)
   ✅ .claude/work_logs/current.md - 작업 내역 기록
   ✅ Human_ClaudeCode_Bridge/Reports/{작업명}_report.json - 결과 저장
     ↓
4. 사용자에게 완료 보고
```

---

### 절대 규칙 3: Project SAL Grid Task - 프로세스 및 상태 전이 규칙

> **적용 대상**: Project SAL Grid의 Task 실행 (한 번에 여러 개 처리 가능)
> **핵심**: 6단계 프로세스 + 상태 전이 규칙 반드시 준수!

```
🚫 이 프로세스를 건너뛰면 Grid 데이터가 엉망이 됨!
🚫 상태 전이 순서 반드시 지켜야 함!
🚫 여러 Task를 동시에 처리할 때 각 Task마다 상태 관리 필수!
```

**📋 Task 실행 6단계 프로세스:**

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Task Instruction 읽기                              │
│  → sal-grid/task-instructions/{TaskID}_instruction.md       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: 규칙 파일 확인                                      │
│  → .claude/rules/ 폴더의 관련 규칙 읽기                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Grid 상태 업데이트 (JSON)                           │
│  → task_status: 'Pending' → 'In Progress'                   │
│  → JSON 파일 UPDATE                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Task Agent로 작업 수행                              │
│  → Task Instruction에 따라 작업 실행                         │
│  → 작업 완료 시: task_status: 'In Progress' → 'Executed'    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Verification Agent 투입 (서브에이전트)              │
│  → verification_status: 'Not Verified' → 'In Review'        │
│  → Verification Instruction에 따라 검증                      │
│  → 검증 결과: 'Verified' 또는 'Needs Fix'                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: 최종 상태 업데이트 (JSON)                           │
│  → verification_status: 'Verified'일 때만                    │
│  → task_status: 'Executed' → 'Completed'                    │
│  → work_logs, Reports 저장                                  │
└─────────────────────────────────────────────────────────────┘
```

**📊 상태 전이 규칙 (순서 반드시 준수!):**

```
task_status 전이:
┌─────────┐    ┌─────────────┐    ┌──────────┐    ┌───────────┐
│ Pending │ →  │ In Progress │ →  │ Executed │ →  │ Completed │
└─────────┘    └─────────────┘    └──────────┘    └───────────┘
                                       ↑              ↑
                                   작업 완료      Verified 후만!

verification_status 전이:
┌──────────────┐    ┌───────────┐    ┌──────────┐
│ Not Verified │ →  │ In Review │ →  │ Verified │
└──────────────┘    └───────────┘    └──────────┘
                                           ↓
                                      Needs Fix (실패 시)
```

**⚠️ 핵심 규칙:**
- **Executed** = 작업은 끝났지만 검증 전 상태
- **Completed** = 검증(Verified)까지 완료된 상태
- **Completed는 Verified일 때만 가능!**
- **상태 건너뛰기 금지** (Pending → Completed 불가!)
- **각 Task마다 상태 업데이트 필수** (여러 개 처리 시)

**❌ 절대 금지 행동:**
- Executed 없이 바로 Completed 처리
- 검증 없이 Verified 표시
- 상태 전이 순서 건너뛰기
- Verification Agent 투입 생략
- JSON 상태 업데이트 생략
- **검증만 하고 결과 기록 생략** ⭐ 신규 추가

**⭐ 검증 결과 기록 필수 (절대 생략 금지!):**

```
🚫 검증만 수행하고 기록 안 하면 무의미!
🚫 "검증했습니다" 말만 하고 JSON에 기록 안 하면 안 됨!
✅ 검증 결과는 JSON 파일에 기록!
```

**검증 후 필수 기록 위치:**
```
개별 Task JSON 파일 (method/json/data/grid_records/{TaskID}.json)
   → verification_status: 'Verified' 또는 'Needs Fix'
   → test_result: 테스트 결과
   → build_verification: 빌드 검증
   → integration_verification: 통합 검증
   → blockers: 차단 요소
   → comprehensive_verification: 종합 결과
```

**검증 기록 체크리스트:**
- [ ] JSON에 verification_status 업데이트했는가?
- [ ] JSON에 검증 관련 필드(test_result, build_verification 등) 저장했는가?

---

### 절대 규칙 4: Stage 폴더에 먼저 저장 → Pre-commit Hook 자동 복사

> **적용 대상**: Frontend, Backend_APIs, Security, Backend_Infra, External 코드 파일 생성/수정 시

```
✅ Stage 폴더에 먼저 저장 (원본, 프로세스 관리용)
✅ git commit 시 Pre-commit Hook이 자동으로 루트 폴더에 복사
🚫 수동으로 이중 저장 금지 - 자동화에 맡겨라!
```

**저장 순서:**

```
1. Stage 폴더에 저장 (원본)
      ↓
2. git commit 실행
      ↓
3. Pre-commit Hook 자동 실행 (scripts/sync-to-root.js)
      ↓
4. 루트 폴더로 자동 복사 (배포용)
```

**Stage → 루트 매핑:**
| Area | Stage 폴더 | 루트 폴더 (자동 복사) |
|------|-----------|---------------------|
| FE (Frontend) | `S?_*/Frontend/` | `pages/` |
| BA (Backend_APIs) | `S?_*/Backend_APIs/` | `api/Backend_APIs/` |
| SC (Security) | `S?_*/Security/` | `api/Security/` |
| BI (Backend_Infra) | `S?_*/Backend_Infra/` | `api/Backend_Infra/` |
| EX (External) | `S?_*/External/` | `api/External/` |

**완료 보고 양식:**
```
"코드 파일 저장 완료

📁 Stage 저장: Process/S1_개발-1차/Frontend/pages/auth/login.html (원본)
📁 자동 복사: pages/auth/login.html (배포용)

✅ git commit 시 자동 동기화됨"
```

**❌ 절대 금지 행동:**
- 루트 폴더에 직접 저장 (Stage 거치지 않고)
- 수동으로 이중 저장 (자동화 무시)

**⚠️ 폴더명 변경 금지:** 서버리스 플랫폼(Vercel, Netlify 등)이 `api` 폴더를 자동 인식함

**상세 규칙:** `.claude/rules/02_save-location.md` 참조

---

### 절대 규칙 5: Task 완료/수정 시 Grid 자동 업데이트 ⭐ 신규

> **적용 대상**: SAL Grid Task 작업 완료 또는 버그 수정 시

```
🚫 Task 작업만 하고 Grid 업데이트 없이 끝내지 마라!
🚫 "작업 완료했습니다" 말만 하고 JSON 업데이트 안 하면 안 됨!
✅ 작업 완료 후 반드시 JSON 파일 업데이트!
```

**업데이트 시점:**
| 상황 | 업데이트 필드 |
|------|-------------|
| Task 완료 | `task_status`, `task_progress`, `generated_files`, `remarks` |
| 버그 수정 | `modification_history`, `remarks`, `updated_at` |

**필수 프로세스:**
```
Task 작업 완료
     ↓
개별 Task JSON 파일 (grid_records/{TaskID}.json) 업데이트
     ↓
work_logs/current.md 기록
     ↓
완료 보고
```

**상세 규칙:** `.claude/rules/04_grid-writing-json.md` 섹션 8 참조

---

## 📘 작업 방법 (Methods)

> **특정 작업 수행 시 반드시 해당 방법을 따라야 함!**

| # | 방법 파일 | 적용 시점 | 핵심 |
|---|----------|----------|------|
| 0 | `00_initial-setup.md` | **Dev Package 첫 실행 시** ⭐ | 개발 환경 확인, 프로젝트 초기화 |
| 1 | `01_json-crud.md` | **JSON CRUD 작업 시** | AI가 Edit 도구로 직접 수정 |

**📁 위치:** `.claude/methods/`

### Dev Package 첫 실행 시 (초기 설정)

사용자가 "개발 환경 확인해줘", "프로젝트 초기 설정 해줘" 등을 요청하면:

```
1. 개발 도구 확인 (git --version, node --version)
2. 미설치 도구 안내
3. 프로젝트 초기화 (git init)
4. 설정 파일 확인 (.ssal-project.json 등)
5. 다음 단계 안내
```

**상세 프로세스:** `.claude/methods/00_initial-setup.md` 참조

---

### JSON CRUD 작업 시 필수 준수

```
✅ AI가 Edit 도구로 JSON 파일 직접 수정!
✅ 프로젝트 메타데이터: method/json/data/index.json
✅ 개별 Task 파일: method/json/data/grid_records/{TaskID}.json
✅ 수정 후 반드시 저장 확인!
```

**JSON 파일 수정 프로세스:**
```
1. 해당 Task의 JSON 파일 읽기 (Read 도구)
   → grid_records/{TaskID}.json
     ↓
2. 필드 값 수정 (Edit 도구)
     ↓
3. 저장 확인
```

**Task 추가 시 프로세스:**
```
1. index.json의 task_ids 배열에 새 task_id 추가
     ↓
2. grid_records/{TaskID}.json 파일 생성
```

**⚠️ JSON 수정 시 주의사항:**
- JSON 문법 유지 (쉼표, 중괄호 등)
- UTF-8 인코딩 유지
- index.json과 grid_records/ 동기화 유지

---

## 📊 Progress Monitor - 진행률 자동 업로드 ⭐

> **✅ Dev Package에 이미 설정되어 있음 - 별도 설정 불필요!**
> **✅ git commit 시 자동으로 SSAL Works 플랫폼에 진행률 표시**

### Dev Package에 포함된 것

```
✅ .ssal-project.json (프로젝트 정보)
✅ Pre-commit Hook (자동 실행 설정)
✅ 진행률 계산 스크립트 (build-progress.js)
✅ DB 업로드 스크립트 (upload-progress.js)
```

**프로젝트 등록 시 자동 생성된 파일:**

`.ssal-project.json` (루트 폴더)
```json
{
  "project_id": "2512000001TH-P001",  // ← 프로젝트 등록 시 자동 부여
  "project_name": "내 프로젝트",       // ← 등록 시 입력한 이름
  "created_at": "2025-12-23"
}
```

**이미 설정된 Hook:**

`.git/hooks/pre-commit` (자동 생성됨)
```bash
#!/bin/sh
echo "🔄 Pre-commit Hook 실행 중..."

# 진행률 계산 및 DB 업로드
node scripts/build-progress.js
node scripts/upload-progress.js

git add -A
echo "✅ Pre-commit Hook 완료!"
```

---

### 스크립트 위치 (이미 포함됨)

```
scripts/
├── build-progress.js     ← 진행률 계산
├── upload-progress.js    ← DB 업로드
└── setup-hooks.js        ← Hook 자동 설정
```

**⚠️ 별도 복사 불필요 - 이미 포함되어 있음!**

---

### 작동 흐름

```
git commit 실행
      ↓
Pre-commit Hook 자동 실행
      ↓
build-progress.js (진행률 계산)
      ↓
upload-progress.js (DB 업로드)
      ↓
SSAL Works 플랫폼에서 진행률 표시
```

### RLS 정책 (자동 적용됨)

| 권한 | 대상 | 설명 |
|------|------|------|
| SELECT | anon, authenticated | 누구나 조회 가능 |
| INSERT | anon, authenticated | 누구나 등록 가능 |
| UPDATE | anon, authenticated | 누구나 수정 가능 |
| DELETE | authenticated만 | 로그인 필요 |

### 상세 가이드

> `Process_Monitor/DB_Method/README.md`

---

## 📋 기타 참조 문서

### AI 12대 준수사항
> `.claude/compliance/AI_12_COMPLIANCE.md`

### SAL Grid 매뉴얼 (v4.0 일반화 버전)
> `Process/S0_Project-SAL-Grid_생성/manual/PROJECT_SAL_GRID_MANUAL.md`
> - **Task 데이터 저장: JSON Method 사용**
> - 27개 섹션으로 구성된 완전 매뉴얼

### Progress Monitor DB Method (필수!)
> `Process_Monitor/DB_Method/README.md`
> - **진행률 표시: DB 업로드 필수**
> - 웹에서 개인별 진행률 표시를 위해 반드시 설정

### 주의사항
> `.claude/CAUTION.md` (일반 주의사항, 개발 TODO)

---

## 🌾 세션 시작 시 확인

### 1. 작업 기록
`.claude/work_logs/current.md` 🔴 최우선

### 2. 이전 작업 결과
`Human_ClaudeCode_Bridge/Reports/` 확인

### 3. 프로젝트 상태
- `Process/P0_작업_디렉토리_구조_생성/Project_Status.md`
- `Process/P0_작업_디렉토리_구조_생성/Project_Directory_Structure.md`

---

## 📂 웹 배포 파일 업데이트

Manual 수정 시:
```bash
node scripts/build-web-assets.js
```

---

## 🚀 S0 완료 후: GitHub Pages로 Viewer 배포 ⭐

> **S0 (Project SAL Grid 생성)이 완료되면 Viewer를 배포하여 웹에서 확인 가능!**
> **Claude Code가 자동으로 수행 - 사용자는 GitHub 계정만 있으면 됨**

### 배포 전 사전 조건 확인

**Claude Code가 먼저 확인할 것:**

```bash
# 1. GitHub CLI 설치 확인
gh --version

# 2. GitHub 로그인 상태 확인
gh auth status
```

**❌ 설치 안 됨 또는 로그인 안 됨 → 사용자에게 안내:**

```
"GitHub Pages 배포를 위해 사전 설정이 필요합니다.

1. GitHub CLI 설치:
   - Windows: winget install GitHub.cli
   - Mac: brew install gh
   - 또는: https://cli.github.com/ 에서 다운로드

2. GitHub 로그인:
   gh auth login
   (브라우저에서 인증 진행)

설정 완료 후 '배포 진행해줘'라고 말씀해주세요."
```

### 배포 프로세스 (Claude Code가 자동 수행)

**✅ 사전 조건 충족 시 Claude Code가 실행:**

```bash
# Step 1: Git 초기화 (없으면)
git init

# Step 2: 모든 파일 커밋
git add .
git commit -m "Initial commit: Project SAL Grid setup complete"

# Step 3: GitHub 레포지토리 생성 + 푸시
gh repo create {프로젝트명} --public --source=. --push

# Step 4: GitHub Pages 활성화
gh api repos/{owner}/{repo}/pages -X POST -f source='{"branch":"main","path":"/"}'
```

**⚠️ Step 4 실패 시 대안:**
```
"GitHub Pages 자동 활성화가 안 됩니다. 수동으로 설정해주세요:

1. https://github.com/{username}/{repo}/settings/pages 접속
2. Source: 'Deploy from a branch' 선택
3. Branch: 'main', Folder: '/ (root)' 선택
4. Save 클릭

설정 완료 후 알려주세요."
```

### 배포 완료 후 안내

```
"🎉 배포 완료!

📊 Viewer URL: https://{username}.github.io/{repo}/Process/S0_Project-SAL-Grid_생성/viewer/viewer_json.html

⏱️ 첫 배포는 1-2분 후 접속 가능합니다.
   (GitHub Pages 빌드 시간)

📌 북마크 해두시면 언제든 프로젝트 진행 상황을 확인할 수 있습니다!"
```

### 이후 업데이트 시

Task 완료 후 JSON이 업데이트되면:

```bash
git add .
git commit -m "Update: {TaskID} 완료"
git push
```

**Claude Code가 Task 완료 시 자동으로 커밋 & 푸시!**

### 배포 관련 체크리스트

- [ ] `gh --version` 작동하는가?
- [ ] `gh auth status` 로그인 되어 있는가?
- [ ] GitHub 레포지토리 생성되었는가?
- [ ] GitHub Pages 활성화되었는가?
- [ ] Viewer URL 접속 가능한가?

---

## 🔗 SSAL Works 플랫폼 연동 (Viewer 연결) ⭐

> **GitHub Pages 배포 완료 후, SSAL Works 플랫폼(www.ssalworks.ai.kr)에서도 확인 가능!**
> **"Viewer 연결해줘"라고 말하면 Claude Code가 자동으로 연동**

### 연동 방식 (개인정보 보호)

```
┌─────────────────────────────────────────────────────────────┐
│  📁 프로젝트 데이터 = 본인 GitHub에만 저장 (안전)             │
│  🔗 SSAL Works는 GitHub URL만 저장 (데이터 X)               │
│  📊 Viewer는 GitHub에서 직접 fetch (실시간)                  │
└─────────────────────────────────────────────────────────────┘
```

**개인정보 보호:**
- ✅ 프로젝트 데이터는 **본인 GitHub**에만 저장
- ✅ SSAL Works 서버에는 **GitHub URL 레퍼런스만** 저장
- ✅ 언제든 GitHub에서 직접 삭제/수정 가능
- ❌ SSAL Works가 프로젝트 데이터를 저장하지 않음

### "Viewer 연결해줘" 명령어

**사용 시점:** 프로젝트를 GitHub에 push한 후

**Claude Code가 수행하는 작업:**
```
1. .ssal-project.json에서 owner_email 확인
2. .env에서 SUPABASE_URL, SUPABASE_ANON_KEY 로드
3. git remote get-url origin 실행 → GitHub URL 확인
4. Supabase users 테이블 UPDATE:
   - 조건: email = owner_email
   - 업데이트: github_repo_url = {GitHub URL}
5. 연동 완료 안내
```

**실행 스크립트:** `scripts/connect-viewer.js`

**사용자가 말할 것:**
```
"Viewer 연결해줘"
또는
"SSAL Works에 연결해줘"
```

**Claude Code 응답 예시:**
```
"✅ SSAL Works 플랫폼 연동 완료!

📊 이제 www.ssalworks.ai.kr에서 확인할 수 있습니다:
   1. 사이트 접속 후 로그인
   2. 메인 화면 하단 "Project SAL Grid" 섹션
   3. "{프로젝트명}(진행중) Viewer 열기" 버튼 클릭

🔗 GitHub URL: https://github.com/{username}/{repo}
📁 데이터 위치: Process/S0_Project-SAL-Grid_생성/method/json/data/

💡 Task 완료 후 git push하면 실시간으로 반영됩니다."
```

### 연동 전 필수 조건

1. **GitHub 배포 완료** (앞 섹션 참조)
2. **SSAL Works 계정** (같은 이메일로 로그인)
3. **Git remote 설정됨** (`git remote -v`로 확인)

### 연동 확인 방법

**SSAL Works 사이트에서:**
1. www.ssalworks.ai.kr 접속
2. 같은 이메일로 로그인
3. 메인 화면 하단 "Project SAL Grid" 섹션
4. "{프로젝트명}(진행중) Viewer 열기" 버튼 클릭
5. 프로젝트 진행 현황 확인

**연동 안 되면:**
- "GitHub 연결이 필요합니다" 메시지 표시
- Claude Code에게 "Viewer 연결해줘" 요청

### 연동 관련 체크리스트

- [ ] GitHub 배포 완료되었는가?
- [ ] Git remote URL이 설정되었는가?
- [ ] SSAL Works에 같은 이메일로 로그인했는가?
- [ ] "Viewer 연결해줘" 실행했는가?
- [ ] SSAL Works에서 프로젝트가 보이는가?

### SSAL Works Viewer 데이터 로딩 방식 ⭐

> SSAL Works 플랫폼의 viewer_json.html이 GitHub에서 데이터를 로드하는 과정

**로딩 프로세스:**
```javascript
// 1. 사용자 이메일 확인 (URL 파라미터 또는 Supabase 세션)
const urlParams = new URLSearchParams(window.location.search);
let userEmail = urlParams.get('email') || session?.user?.email;

// 2. Supabase users 테이블에서 github_repo_url 조회
const { data: userData } = await supabaseClient
    .from('users')
    .select('github_repo_url')
    .eq('email', userEmail)
    .single();

// 3. GitHub repo URL → raw URL 변환
// 예: github.com/user/repo → raw.githubusercontent.com/user/repo/master
const rawBaseUrl = githubToRawUrl(userData.github_repo_url);

// 4. index.json + grid_records/*.json 로드
```

**핵심 포인트:**
| 항목 | 설명 |
|------|------|
| 데이터 저장 위치 | 본인 GitHub 레포지토리 |
| SSAL Works 저장 | `github_repo_url` 레퍼런스만 저장 |
| 로딩 방식 | GitHub raw URL에서 직접 fetch |
| 캐시 | 없음 (즉시 반영) |

**함수 위치 (SSAL Works viewer_json.html):**
- `githubToRawUrl()`: 라인 416-425
- 에러 핸들링: 라인 574-598

**에러 핸들링:**

| 에러 상황 | 코드 | UI 표시 |
|----------|------|---------|
| 사용자 미등록 | `PGRST116` | "GitHub 연결 필요" (회색) |
| github_repo_url 없음 | - | "프로젝트 없음" 메시지 |
| JSON 파일 404 | fetch error | "프로젝트 없음" 메시지 |

**상세 규칙:** `.claude/rules/04_grid-writing-json.md` 섹션 9.5 참조

---

## ⚠️ 빌드 vs 서버 구분 (혼동 금지!)

| 작업 | 사용 파일 | 용도 |
|------|----------|------|
| **빌드** (MD→JS 번들) | `build-web-assets.js` | 배포용 파일 생성 |
| **서버** (실시간 API) | `bridge_server.js` | 개발용 로컬 서버 |

**⛔ 혼동 금지:**
- "Manual 빌드해" → `build-web-assets.js` 실행
- **`bridge_server.js`는 빌드 도구가 아님!** (런타임 API 서버)

**빌드 스크립트 위치:**
```
scripts/build-web-assets.js    ← SAL Grid 매뉴얼 MD→HTML 변환
scripts/sync-to-root.js        ← Stage → Root 자동 복사
```

