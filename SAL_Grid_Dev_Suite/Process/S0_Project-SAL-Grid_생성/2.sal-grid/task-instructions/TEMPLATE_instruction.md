# Task Instruction Template

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

> **이 규칙을 반드시 준수하세요! Grid 데이터 품질 보장을 위한 필수 사항입니다.**

### 1. Stage 명칭 (절대 변경 금지)
| Stage | 정확한 명칭 |
|-------|-------------|
| S1 | 개발 준비 (Development Setup) |
| S2 | 개발 1차 (Core Development) |
| S3 | 개발 2차 (Additional Development) |
| S4 | 개발 3차 (Advanced Development) |
| S5 | 운영 (Operations) |

❌ 금지: "기반 구축", "설정", "셋업" 등 임의 변경

### 2. Area 명칭 (정확히 사용)
| Code | 정확한 명칭 |
|------|-------------|
| FE | Frontend (프론트엔드) |
| BA | Backend APIs (백엔드 API) |
| DB | Database (데이터베이스) |
| SC | Security (보안) |
| BI | Backend Infrastructure (백엔드 기반) |
| EX | External (외부 연동) |
| TS | Testing (테스트) |
| DV | DevOps (데브옵스) |
| DS | Design (UI/UX 디자인) |
| DC | Documentation (문서화) |
| CS | Content System (콘텐츠) |

❌ 금지: 1글자 코드 사용 (M, F, D 등은 V2 구 코드)

### 3. Task Agent vs Verification Agent
- **Task Agent**: 실제 작업 수행자
  - 예: backend-developer, frontend-developer, database-developer
- **Verification Agent**: 검증 수행자 (작업자와 반드시 다른 Agent)
  - 예: code-reviewer, test-engineer

❌ 금지: Task Agent에 code-reviewer 할당 (검증자는 작성자가 될 수 없음)

### 🔄 종합 검증 프로세스 규칙 (2025-12-13 확정)

#### **1단계: Task 실행 및 검증**

| 단계 | 수행자 | 기록자 | 기록 필드 |
|------|--------|--------|----------|
| Task 작업 | Task Agent **서브에이전트** | Main Agent | Grid #10-13 |
| Task 검증 | Verification Agent **서브에이전트** | Main Agent | Grid #16-21 |

**프로세스:**
```
[Task 작업]
Main Agent → Task Agent 서브에이전트 투입
           → 서브에이전트 작업 수행 → 결과 반환
           → Main Agent가 Grid에 기록

[Task 검증]
Main Agent → Verification Agent 서브에이전트 투입
           → 서브에이전트 검증 수행 → 결과 반환
           → Main Agent가 Grid에 기록
```

**❌ 금지:**
- Main Agent가 직접 Task 작업/검증 수행
- Task Agent가 검증까지 수행 (작성자 ≠ 검증자)
- 서브에이전트 투입 없이 완료 표시

#### **2단계: Stage Gate 검증 (Main Agent 직접)**

```
[Stage Gate 검증]
1. Main Agent가 직접 검증 수행
2. 검증 리포트 파일 생성 → sal-grid/stage-gates/S{N}GATE_verification_report.md
3. DB에 파일 경로 기록 → verification_report_path 필드
```

**Stage Gate 리포트 저장 위치:**
```
S0_Project-SAL-Grid/sal-grid/stage-gates/
├── S1GATE_verification_report.md
├── S2GATE_verification_report.md
└── ...
```

### 4. Tools 필드 작성 규칙
Tools는 실제 개발 도구를 의미합니다:
- **Skills**: api-builder, db-schema, test-runner 등
- **Commands**: /commit, /review, /test 등
- **MCP Servers**: supabase, github, memory 등
- **CLI Tools**: npm, node, git, vercel 등

❌ 금지: "Read", "Write", "Glob" (이것은 Claude 기본 도구이며 Tools가 아님)

### 5. Verification 필드 (JSON 형식)
작업 완료 전에는 비워두지 말고, 검증 후 반드시 JSON으로 기록:

```json
{
  "test": {"unit": "24/24 passed", "e2e": "5/5 passed"},
  "build": {"status": "success", "size": "245KB"},
  "integration": {"api": "ok", "db": "ok"},
  "blockers": [],
  "comprehensive": {"coverage": "85%", "quality": "A"}
}
```

❌ 금지: 검증 없이 Verification Status를 "Verified"로 설정

### 6. Status 필드 규칙
- **Pending**: 작업 시작 전
- **In Progress**: 작업 중
- **Completed**: 작업 완료 (검증 전)
- **Verified**: 검증 완료

❌ 금지: 작업하지 않은 Task를 "Completed" 또는 "Verified"로 설정

---

# Task Instruction - {TASK_ID}

## Task ID
{TASK_ID}

## Task Name
{Task 한글 이름}

## Task Goal
{Task의 목표를 명확하게 기술}

## Prerequisites (Dependencies)
- {선행 Task ID 또는 "없음 (독립 Task)"}

## Specific Instructions

### 1. {세부 항목 1}
- 상세 지시사항

### 2. {세부 항목 2}
- 상세 지시사항

## Expected Output Files
- `{경로/파일명}`

## Completion Criteria
- [ ] {완료 기준 1}
- [ ] {완료 기준 2}
- [ ] {완료 기준 3}

## Tech Stack
- {사용 기술}

## Tools
- {Skills, Commands, MCP, CLI 도구 - Read/Write/Glob 제외}

## Execution Type
{AI-Only / Human-Required / Hybrid}

## Remarks
- {추가 참고사항}

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** FE→Frontend, BA→Backend_APIs, DB→Database, SC→Security, BI→Backend_Infra, EX→External, TS→Testing, DV→DevOps, DS→Design, DC→Documentation, CS→Content_System
---

## 📝 파일 명명 규칙 (2025-12-18 확정)

> **비개발자도 직관적으로 이해할 수 있는 파일명!**

### 1. 파일명: 직관적인 이름 사용
```
✅ 좋은 예:
- google-login.js      (뭐하는 파일인지 바로 앎)
- user-profile.js
- email-send.js

❌ 나쁜 예:
- auth.js             (뭐하는 건지 모름)
- handler.js
- utils.js
```

### 2. 파일 상단: Task ID 주석 필수
```javascript
/**
 * @task S2BA1
 */
export default async function handler(req, res) {
  // ...
}
```

### 3. Task ID의 힘 (3차원 구조)
- `S2BA1` = Stage(S2) + Area(BA) + 순서(1)
- Task ID 하나로 Stage, Area, 순서 모두 파악!
- **1 파일 = 1 Task 원칙** (파일이 여러 Task에 걸치면 안 됨)
