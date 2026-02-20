# JSON Data Folder Structure (개별 파일 방식)

> Project SAL Grid JSON 데이터 관리 가이드
> **방식:** 개별 Task 파일 방식 (index.json + grid_records/*.json)

---

## 폴더 구조

```
data/
├── index.json             ← 프로젝트 메타데이터 + task_ids 배열
├── grid_records/          ← 개별 Task JSON 파일
│   ├── S1BI1.json
│   ├── S1BI2.json
│   ├── S1D1.json
│   └── ... (Task ID별 파일)
└── README.md              ← 이 파일
```

---

## 파일 역할 구분

| 파일/폴더 | 역할 | 용도 |
|-----------|------|------|
| `index.json` | 프로젝트 메타데이터 + Task ID 목록 | Viewer가 먼저 로드 |
| `grid_records/{TaskID}.json` | 개별 Task 상세 데이터 | 22개 속성 전체 저장 |

---

## index.json 구조

```json
{
  "project_id": "프로젝트ID",
  "project_name": "프로젝트명",
  "total_tasks": 66,
  "task_ids": ["S1BI1", "S1BI2", "S1D1", "S1F1", ...]
}
```

**필드 설명:**
- `project_id`: 고유 프로젝트 식별자
- `project_name`: 프로젝트 표시명
- `total_tasks`: 전체 Task 수
- `task_ids`: 모든 Task ID 배열 (Viewer가 순회하여 개별 파일 로드)

---

## grid_records/{TaskID}.json 구조

```json
{
  "task_id": "S1F1",
  "task_name": "Task 이름",
  "stage": 1,
  "area": "F",
  "task_status": "Pending",
  "task_progress": 0,
  "verification_status": "Not Verified",
  "dependencies": "-",
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

---

## Viewer 데이터 로딩 순서

```
1. index.json 로드
     ↓
2. task_ids 배열 확인
     ↓
3. 각 Task ID에 대해 grid_records/{taskId}.json 로드
     ↓
4. 전체 Task 데이터 조합하여 표시
```

**코드 예시:**
```javascript
// 1. index.json 로드
const indexUrl = `${baseUrl}/method/json/data/index.json`;
const indexData = await fetch(indexUrl).then(r => r.json());

// 2. 각 Task JSON 파일 로드
const allTasks = [];
for (const taskId of indexData.task_ids) {
    const taskUrl = `${baseUrl}/method/json/data/grid_records/${taskId}.json`;
    const taskData = await fetch(taskUrl).then(r => r.json());
    allTasks.push(taskData);
}
```

---

## Claude Code가 JSON 수정하는 방법

### Task 상태 업데이트

```
1. Read 도구로 grid_records/{TaskID}.json 파일 읽기
2. Edit 도구로 필요한 필드 수정
3. 저장 확인
```

**예시 - Task 완료 처리:**
```json
// 변경 전
"task_status": "In Progress",
"task_progress": 50,

// 변경 후
"task_status": "Completed",
"task_progress": 100,
```

### 새 Task 추가

```
1. index.json의 task_ids 배열에 새 Task ID 추가
2. total_tasks 값 업데이트
3. grid_records/ 폴더에 새 {TaskID}.json 파일 생성
```

### Task 삭제

```
1. index.json의 task_ids 배열에서 해당 Task ID 제거
2. total_tasks 값 업데이트
3. grid_records/{TaskID}.json 파일 삭제
```

---

## 주의사항

- JSON 문법 유지 (쉼표, 중괄호 등)
- UTF-8 인코딩 유지
- index.json과 grid_records/ 동기화 유지
- Task ID는 중복 불가
- stage 필드는 정수 (1, 2, 3, 4, 5)

---

## 관련 문서

- 상세 규칙: `.claude/rules/04_grid-writing-json.md`
- Task CRUD: `.claude/rules/07_task-crud.md`
- JSON CRUD 방법: `.claude/methods/01_json-crud.md`
