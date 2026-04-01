# Task 추가/삭제/수정 프로세스

> Task 추가, 삭제, 수정 시 반드시 아래 **5개 위치**를 모두 업데이트해야 함

---

## 📋 업데이트 필수 위치 (5개)

| # | 위치 | 설명 |
|---|------|------|
| 1 | TASK_PLAN.md | Task 목록 및 수치 |
| 2 | Task Instruction 파일 | Task 수행 지침 |
| 3 | Verification Instruction 파일 | 검증 지침 |
| 4 | **JSON 파일** | Task 상태 데이터 |
| 5 | 작업 로그 (work_logs/current.md) | 작업 기록 |

---

## ⚠️ 상태 전이 규칙 (필수 준수)

> `.claude/CLAUDE.md` 절대 규칙 3 참조

```
task_status 전이:
Pending → In Progress → Executed → Completed
                                      ↑
                              Verified 후만 가능!

verification_status 전이:
Not Verified → In Review → Verified (또는 Needs Fix)
```

**핵심**: `Completed`는 `verification_status = 'Verified'`일 때만 설정 가능!

---

## Task 추가 시나리오 구분

| 시나리오 | 설명 | task_status | verification_status |
|----------|------|-------------|---------------------|
| **A. 신규 Task** | 아직 작업 안 한 Task 추가 | `Pending` | `Not Verified` |
| **B. 완료된 Task** | 이미 작업 완료한 것을 Task로 등록 | `Completed` | `Verified` |

---

## Task 신규 추가 프로세스

### Step 1: Task ID 결정 + SAL ID 부여 (Provisional, 가확정)

```
형식: S[Stage][Area][번호]
예시: S3FE5 = Stage 3 + Frontend + 5번째
```

**⚠️ SAL ID 부여 규칙 (의존성 기반):**
```
┌─────────────────────────────────────────────────────────────┐
│ SAL ID는 의존성·병렬성·인접성을 인코딩합니다                  │
│                                                             │
│ 1. 선행 Task ID < 후행 Task ID (의존성 방향)                │
│    예: S0DB1 → S1FE1 (O), S1FE1 → S0DB1 (X)                │
│                                                             │
│ 2. 동일 Stage·Area 내 Task는 병렬 실행 가능                 │
│    예: S1FE1, S1FE2, S1FE3는 동시 실행 가능                 │
│                                                             │
│ 3. Stage 번호가 작을수록 먼저 실행됨                         │
│    S0 → S1 → S2 → S3 → S4 순서                            │
└─────────────────────────────────────────────────────────────┘
```

**이 단계에서 ID는 '가확정(Provisional)' 상태입니다.**
→ Step 5에서 의존성 검증 후 '최종 확정(Finalization)'됩니다.

**기존 Task 확인:**
```bash
ls Process/S0_Project-SAL-Grid_생성/sal-grid/task-instructions/ | grep "S3FE"
```

### Step 2: TASK_PLAN.md 업데이트

**파일 위치:** `Process/S0_Project-SAL-Grid_생성/sal-grid/TASK_PLAN.md`

**업데이트 항목:**
1. **총 Task 수 업데이트**: 헤더의 `총 Task 수` 변경
2. **Stage별 Task 수 표**: 해당 Stage 행 수정
3. **Area별 분포 표**: 해당 Area 열 수정
4. **Stage 섹션**: 해당 Stage의 Area 섹션에 Task 추가
5. **버전 및 수정일**: 버전 증가, 수정일 업데이트
6. **변경 이력 섹션**: 변경 내용 기록

### Step 3: Task Instruction 파일 생성

**저장 위치:** `Process/S0_Project-SAL-Grid_생성/sal-grid/task-instructions/{TaskID}_instruction.md`

**템플릿:**
```markdown
# {TaskID}: {Task Name}

## Task 정보
- **Task ID**: {TaskID}
- **Task Name**: {Task Name}
- **Stage**: S{N} ({Stage Name})
- **Area**: {Area Code} ({Area Name})
- **Dependencies**: {선행 Task ID}

## Task 목표

{목표 설명}

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `파일경로` | 변경 설명 |
```

### Step 4: Verification Instruction 파일 생성

**저장 위치:** `Process/S0_Project-SAL-Grid_생성/sal-grid/verification-instructions/{TaskID}_verification.md`

### Step 5: 의존성 검증 (SAL ID Finalization)

> **⚠️ JSON 파일 저장 전 반드시 의존성 검증 수행!**

**의존성 검증 체크리스트:**
```
┌─────────────────────────────────────────────────────────────┐
│ □ 선행 Task ID < 후행 Task ID인가?                          │
│   → dependencies 필드에 명시된 Task가 현재 Task보다 작아야 함 │
│   → 예: S1FE1의 dependencies가 "S0DB1"이면 OK (0 < 1)       │
│   → 예: S1FE1의 dependencies가 "S2BA1"이면 ERROR (1 < 2 위반)│
│                                                             │
│ □ 순환 의존성이 없는가?                                      │
│   → A → B → A 같은 순환 금지                                │
│                                                             │
│ □ 존재하지 않는 Task를 참조하지 않는가?                      │
│   → dependencies에 없는 Task ID 참조 금지                   │
└─────────────────────────────────────────────────────────────┘
```

**검증 결과 처리:**
| 결과 | 조치 |
|------|------|
| ✅ 통과 | SAL ID **확정(Finalization)** → Step 6 진행 |
| ❌ 위반 | Step 1로 돌아가 **ID 수정** 후 재검증 |

### Step 6: JSON 파일 업데이트 (개별 파일 방식)

**JSON 폴더 위치:**
```
Process/S0_Project-SAL-Grid_생성/method/json/data/
├── index.json             ← task_ids 배열에 새 Task ID 추가
└── grid_records/          ← 새 Task JSON 파일 생성
    └── {TaskID}.json
```

#### 시나리오 A: 신규 Task (아직 작업 안 함)

**1단계: index.json에 task_id 추가**
```json
{
  "project_id": "프로젝트ID",
  "project_name": "프로젝트명",
  "total_tasks": 67,  // ← 1 증가
  "task_ids": ["S0BI1", ..., "S3FE5"]  // ← 새 Task ID 추가
}
```

**2단계: grid_records/S3FE5.json 파일 생성**
```json
{
    "task_id": "S3FE5",
    "task_name": "Task 이름",
    "stage": 3,
    "area": "FE",
    "task_status": "Pending",
    "task_progress": 0,
    "verification_status": "Not Verified"
}
```

#### 시나리오 B: 완료된 Task (이미 작업 완료)

**1단계: index.json에 task_id 추가** (동일)

**2단계: grid_records/S3FE5.json 파일 생성**
```json
{
    "task_id": "S3FE5",
    "task_name": "Task 이름",
    "stage": 3,
    "area": "FE",
    "task_status": "Completed",
    "task_progress": 100,
    "verification_status": "Verified",
    "generated_files": "파일1, 파일2"
}
```

**Stage 번호:**
| Stage | 번호 |
|-------|------|
| S0 | 0 |
| S1 | 1 |
| S2 | 2 |
| S3 | 3 |
| S4 | 4 |

### Step 7: 작업 로그 업데이트

**파일 위치:** `.claude/work_logs/current.md`

```markdown
## {TaskID} Task 추가 (YYYY-MM-DD)

### 작업 상태: ✅ 완료

### 추가된 Task
| Task ID | Task Name | Area | 설명 |
|---------|-----------|------|------|
| {TaskID} | {Task Name} | {Area} | {설명} |

### 업데이트된 파일
1. TASK_PLAN.md
2. task-instructions/{TaskID}_instruction.md
3. verification-instructions/{TaskID}_verification.md
4. index.json (task_ids 배열)
5. grid_records/{TaskID}.json (새 파일)
```

### Step 8: Git 커밋 & 푸시

```bash
git add Process/S0_Project-SAL-Grid_생성/
git add .claude/work_logs/current.md
git commit -m "feat: {TaskID} {Task Name} Task 추가"
git push
```

---

## Task 삭제 프로세스

### Step 1: TASK_PLAN.md에서 제거

수치 업데이트 및 해당 Task 행 삭제

### Step 2: Instruction 파일 삭제

```bash
rm Process/S0_Project-SAL-Grid_생성/sal-grid/task-instructions/{TaskID}_instruction.md
rm Process/S0_Project-SAL-Grid_생성/sal-grid/verification-instructions/{TaskID}_verification.md
```

### Step 3: JSON 파일에서 삭제 (개별 파일 방식)

**1단계: index.json에서 task_id 제거**
- `task_ids` 배열에서 해당 Task ID 삭제
- `total_tasks` 감소

**2단계: grid_records/{TaskID}.json 파일 삭제**
```bash
rm Process/S0_Project-SAL-Grid_생성/method/json/data/grid_records/{TaskID}.json
```

### Step 4: 작업 로그 업데이트 & Git 커밋

---

## Task 수정 프로세스

### Step 1: 수정 내용 정의

**수정 가능 항목:**
- task_name, task_instruction, verification_instruction
- remarks, dependencies, task_agent, verification_agent

### Step 2-4: 파일 업데이트

1. TASK_PLAN.md 수정
2. Task Instruction 파일 수정
3. Verification Instruction 파일 수정

### Step 5: JSON 파일 업데이트 (개별 파일 방식)

**파일 위치:** `Process/S0_Project-SAL-Grid_생성/method/json/data/grid_records/{TaskID}.json`

해당 Task의 JSON 파일을 직접 수정

### Step 6-7: 작업 로그 & Git 커밋

---

## Task 상태 업데이트 (작업/검증 완료 시)

**파일 위치:** `Process/S0_Project-SAL-Grid_생성/method/json/data/grid_records/{TaskID}.json`

### 작업 완료 시 (Executed)

해당 Task의 JSON 파일 직접 수정:
```json
{
    "task_status": "Executed",
    "task_progress": 100,
    "generated_files": "생성된 파일 목록",
    "updated_at": "현재 시간"
}
```

### 검증 완료 시 (Verified → Completed)

```json
{
    "verification_status": "Verified",
    "task_status": "Completed"  // ← Verified 후에만!
}
```

---

## 체크리스트

### 신규 추가 시

- [ ] **시나리오 확인**: 신규(Pending) vs 완료됨(Completed)?
- [ ] TASK_PLAN.md 업데이트 (Task 추가 + 수치 변경 + 변경 이력)
- [ ] task-instructions/{TaskID}_instruction.md 생성
- [ ] verification-instructions/{TaskID}_verification.md 생성
- [ ] **의존성 검증 수행** (Step 5)
  - [ ] 선행 Task ID < 후행 Task ID 확인
  - [ ] 순환 의존성 없음 확인
  - [ ] 존재하지 않는 Task 참조 없음 확인
- [ ] index.json의 task_ids 배열에 Task ID 추가
- [ ] grid_records/{TaskID}.json 파일 생성
- [ ] .claude/work_logs/current.md 작업 로그 기록
- [ ] Git 커밋 & 푸시

### 삭제 시

- [ ] TASK_PLAN.md 업데이트
- [ ] Instruction 파일 삭제
- [ ] index.json의 task_ids 배열에서 Task ID 제거
- [ ] grid_records/{TaskID}.json 파일 삭제
- [ ] 작업 로그 기록
- [ ] Git 커밋 & 푸시

### 수정 시

- [ ] TASK_PLAN.md 업데이트
- [ ] Instruction 파일 수정
- [ ] grid_records/{TaskID}.json 파일 수정
- [ ] 작업 로그 기록
- [ ] Git 커밋 & 푸시

---

## 주의사항

1. **5개 위치 모두 수행**: 하나라도 빠지면 불일치 발생
2. **Task ID 중복 금지**: 기존 Task 확인 후 번호 결정
3. **Stage 번호는 integer**: S3 → 3 (문자열 아님)
4. **상태 전이 규칙 준수**: Completed는 반드시 Verified 후에만 설정 가능
5. **verification_status 필수**: 추가 시 반드시 명시적 설정
6. **⚠️ SAL ID 의존성 규칙**: 선행 Task ID < 후행 Task ID (역방향 금지)
7. **⚠️ 순환 의존성 금지**: A → B → A 같은 순환 참조 불가
8. **⚠️ 존재하지 않는 Task 참조 금지**: dependencies에 Grid에 없는 Task ID 사용 금지

---

## 관련 파일

| 항목 | 위치 |
|------|------|
| Task Plan | `Process/S0_Project-SAL-Grid_생성/sal-grid/TASK_PLAN.md` |
| Task Instructions | `Process/S0_Project-SAL-Grid_생성/sal-grid/task-instructions/` |
| Verification Instructions | `Process/S0_Project-SAL-Grid_생성/sal-grid/verification-instructions/` |
| 프로젝트 메타데이터 | `Process/S0_Project-SAL-Grid_생성/method/json/data/index.json` |
| 개별 Task 데이터 | `Process/S0_Project-SAL-Grid_생성/method/json/data/grid_records/{TaskID}.json` |
| Stage Gates | `Process/S0_Project-SAL-Grid_생성/method/json/stage-gates/` |
| 작업 로그 | `.claude/work_logs/current.md` |

---

## JSON 폴더 구조 (개별 파일 방식)

```
Process/S0_Project-SAL-Grid_생성/method/json/data/
├── index.json             ← 프로젝트 메타데이터 + task_ids 배열
└── grid_records/          ← 개별 Task JSON 파일
    ├── S0BI1.json
    ├── S0BI2.json
    ├── S0DB1.json
    └── ... (Task ID별 파일)
```

**index.json 구조:**
```json
{
  "project_id": "프로젝트ID",
  "project_name": "프로젝트명",
  "total_tasks": 66,
  "task_ids": ["S0BI1", "S0BI2", "S0DB1", ...]
}
```

**Viewer 로딩 순서:**
1. `index.json` 로드 → `task_ids` 배열 확인
2. 각 Task ID에 대해 `grid_records/{taskId}.json` 로드
3. 개별 Task 데이터 표시
