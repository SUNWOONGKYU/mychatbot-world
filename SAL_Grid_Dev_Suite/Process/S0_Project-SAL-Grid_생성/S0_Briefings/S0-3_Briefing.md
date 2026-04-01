# method

## 개요

SAL Grid 데이터 저장 방식을 설정합니다. **JSON Method (기본)**와 **Database Method (선택)**을 병행할 수 있습니다.

## JSON Method (기본)

로컬 JSON 파일로 Task 상태를 관리합니다. 외부 서비스 없이 독립적으로 운영 가능합니다.

### 제공 파일

- `index.json`: 프로젝트 메타데이터 + task_ids 배열
- `grid_records/*.json`: 개별 Task 데이터 (22개 속성)

### 저장 위치

```
S0_Project-SAL-Grid_생성/
└── method/
    └── json/
        └── data/
            ├── index.json           ← 프로젝트 정보 + Task ID 목록
            └── grid_records/        ← 개별 Task JSON 파일
                ├── S1BI1.json
                ├── S1BI2.json
                └── ...
```

## Database Method (선택)

Supabase DB를 사용하여 Task 상태를 관리합니다. SSAL Works 플랫폼 연동 시 사용합니다.

### 사용 방법

1. JSON Method: `index.json` + `grid_records/*.json` 파일 직접 수정
2. Database Method: Supabase REST API로 `project_sal_grid` 테이블 업데이트
3. 둘 다 사용 시: JSON과 DB 모두 업데이트 (SSAL Works 내부 관리용)

