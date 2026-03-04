# _reference - 참고자료 보관

> **이 폴더의 파일들은 참고자료입니다. 실제 프로젝트에서 사용하지 않습니다.**

---

## 폴더 구분

### 1. `devpackage_provided/` — Dev Package(SSALWorks)에서 제공된 자료

SSALWorks 플랫폼의 Dev Package에 원래 포함되어 있던 샘플 및 참고 문서입니다.

| 파일/폴더 | 설명 |
|----------|------|
| `SSALWORKS_TASK_PLAN.md` | SSALWorks 프로젝트의 태스크 플랜 (참고용) |
| `SSALWORKS_5x11_MATRIX.md` | SSALWorks 5x11 매트릭스 문서 |
| `SSALWORKS_TASK_DEPENDENCY_DIAGRAM.md` | SSALWorks 태스크 의존성 다이어그램 |
| `task-instructions_sample/` | Task Instruction 샘플 파일 76개 |
| `verification-instructions_sample/` | Verification Instruction 샘플 파일 76개 |
| `task-results_sample/` | Task Result 샘플 파일 25개 |
| `stage-gates_sample/` | Stage Gate 리포트 샘플 7개 |

### 2. `chatgpt_created/` — ChatGPT(Codex)가 생성한 자료

ChatGPT(Codex)가 mychatbot-world 프로젝트용으로 생성한 파일들입니다.
Stage를 메뉴별로 분류한 방식이므로, 추후 스테이지별 분류로 재설계 시 참고만 합니다.

| 파일/폴더 | 설명 |
|----------|------|
| `task-instructions/` | ChatGPT가 생성한 Task Instruction 9개 |
| `grid_records/` | ChatGPT가 생성한 Grid Record JSON 46개 |
| `index.json` | ChatGPT가 생성한 프로젝트 메타데이터 |

---

## 참고 사항

- 이 폴더의 자료는 새 SAL Grid 설계 시 **구조/형식 참고**용으로만 사용
- 실제 SAL Grid 데이터는 상위 폴더(`sal-grid/`, `method/json/data/`)에 새로 생성
- 정리일: 2026-02-14
