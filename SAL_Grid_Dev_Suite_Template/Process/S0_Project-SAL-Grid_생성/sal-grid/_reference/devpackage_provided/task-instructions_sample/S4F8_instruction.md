# S4F8: SAL Grid Viewer UI 구현

## Task 정보
- **Task ID**: S4F8
- **Task Name**: SAL Grid Viewer UI 구현
- **Stage**: S4 (개발 3차)
- **Area**: F (Frontend)
- **Dependencies**: S4F5
- **Task Agent**: frontend-developer
- **Verification Agent**: code-reviewer

## Task 목표

SAL Grid 데이터를 조회할 수 있는 Viewer UI를 DB Method와 CSV Method 두 가지 방식으로 구현합니다.

## 구현 내용

### 1. Viewer 파일 4종 생성
| 파일 | 방식 | 디바이스 |
|------|------|----------|
| viewer_database.html | DB Method (Supabase) | Desktop |
| viewer_csv.html | CSV Method (로컬 파일) | Desktop |
| viewer_mobile_database.html | DB Method | Mobile |
| viewer_mobile_csv.html | CSV Method | Mobile |

### 2. 주요 기능
- 22개 속성 전체 표시
- Stage 필터링 (S1~S5)
- Area 필터링 (11개)
- Task 상세 모달
- 상태별 색상 구분 (Pending, In Progress, Executed, Completed)

### 3. index.html 2컬럼 레이아웃
- 좌측: SSALWORKS 예시 (Supabase DB)
- 우측: 진행중 프로젝트 (CSV 기반)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `Production/viewer_database.html` | DB Method Desktop Viewer |
| `Production/viewer_csv.html` | CSV Method Desktop Viewer |
| `Production/viewer_mobile_database.html` | DB Method Mobile Viewer |
| `Production/viewer_mobile_csv.html` | CSV Method Mobile Viewer |
| `Production/index.html` | 2컬럼 Viewer 버튼 레이아웃 |

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/04_grid-writing-supabase.md` | Grid 22개 속성 | UI 구현 시 |
