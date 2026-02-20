# S4BI1: SAL Grid JSON/CSV 빌드 시스템

## Task 정보
- **Task ID**: S4BI1
- **Task Name**: SAL Grid JSON/CSV 빌드 시스템
- **Stage**: S4 (개발 3차)
- **Area**: BI (Backend Infrastructure)
- **Dependencies**: S1BI1
- **Task Agent**: backend-developer
- **Verification Agent**: code-reviewer

## Task 목표

SAL Grid 데이터를 JSON과 CSV 형식으로 변환하는 빌드 시스템을 구현합니다.

## 구현 내용

### 1. 빌드 스크립트
| 스크립트 | 용도 | 입력 | 출력 |
|---------|------|------|------|
| `build-sal-grid-csv.js` | DB → CSV | Supabase | sal_grid.csv |
| `build-progress.js` | 폴더/CSV → JSON | 폴더 + CSV | phase_progress.json |

### 2. 데이터 변환 스크립트 (CSV Method용)
| 스크립트 | 용도 |
|---------|------|
| `json-to-csv.js` | JSON → CSV 변환 |
| `csv-to-json.js` | CSV → JSON 변환 |

### 3. 데이터 파일
| 파일 | 용도 |
|------|------|
| `Production/data/sal_grid.csv` | SAL Grid Task 목록 (57개) |
| `Production/data/phase_progress.json` | P0~S5 진행률 |

### 4. JSON 템플릿
| 파일 | 용도 |
|------|------|
| `CSV_Method/templates/project_sal_grid_template.json` | 새 프로젝트용 템플릿 |

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `Production/build-sal-grid-csv.js` | Supabase → CSV 빌드 |
| `Production/build-progress.js` | 진행률 JSON 생성 |
| `S0_.../CSV_Method/scripts/json-to-csv.js` | JSON → CSV |
| `S0_.../CSV_Method/scripts/csv-to-json.js` | CSV → JSON |
| `Production/data/sal_grid.csv` | SAL Grid CSV |
| `Production/data/phase_progress.json` | 진행률 JSON |

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/04_grid-writing-supabase.md` | Grid 22개 속성 | 데이터 구조 참조 |
