# manual

## 개요

기존 **PROJECT SAL GRID 매뉴얼**을 검토하고 필요한 부분을 업데이트합니다. 매뉴얼은 이미 완성된 상태이며, 새로운 기능이나 변경 사항이 있을 때 해당 섹션만 수정합니다.

## SAL Grid란

**Stage-Area-Level**의 약자로, 3차원 그리드 기반 작업 관리 시스템입니다.

- **S**tage: 단계 / S1~S5 개발 진행 단계
- **A**rea: 영역 / Frontend, Backend 등 11개 작업 영역
- **L**evel: 순서 / 같은 Stage/Area 내 Task 실행 순서

> **Task ID 예시**: `S2F3` = Stage 2 + Frontend + 3번째 Task

## 매뉴얼 파일 구성

- `PROJECT_SAL_GRID_MANUAL.md`: 완전한 매뉴얼 (27개 섹션, 빌드 결과물)
- `manual_template.md`: 편집용 템플릿 (이 파일을 수정)
- `manual.html`: 웹 브라우저용 HTML 버전
- `manual_mobile.html`: 모바일 최적화 버전
- `build-manual.js`: 템플릿 → 매뉴얼 빌드 스크립트

## 업데이트 프로세스

### 수정이 필요한 경우

1. `manual_template.md` 파일을 수정합니다
2. 빌드 스크립트를 실행합니다:
   ```bash
   node S0_Project-SAL-Grid_생성/manual/build-manual.js
   ```
3. `PROJECT_SAL_GRID_MANUAL.md`가 자동으로 갱신됩니다

### 규칙 파일 연동

매뉴얼 템플릿은 `.claude/rules/` 폴더의 규칙 파일을 자동으로 포함합니다. 규칙 파일을 수정하면 매뉴얼 빌드 시 자동으로 반영됩니다.

## 매뉴얼 구조 (27개 섹션)

### PART 1: 개요 및 프레임워크 (섹션 1-4)
- SAL Grid 개념, 핵심 원칙, 22개 속성 정의

### PART 2: Grid 생성 (섹션 5-8)
- 생성 프로세스, Task 선정, Instruction 작성

### PART 3: 검증 및 추적 시스템 (섹션 9-12)
- 3단계 검증, Stage Gate, Git 통합

### PART 4: Method 설정 (섹션 13-17)
- JSON Method (기본), Database Method (선택)

### PART 5: Viewer 및 자동화 (섹션 18-21)
- HTML Viewer, Task CRUD, Claude Code 자동화

### PART 6: 문제 해결 및 운영 (섹션 22-24)
- 트러블슈팅, 추가 리소스

### PART 7: 정리 및 부록 (섹션 25-27)
- 요약, 마무리, 버전 이력

## 저장 위치

```
S0_Project-SAL-Grid_생성/
└── manual/
    ├── PROJECT_SAL_GRID_MANUAL.md  ← 빌드 결과물
    ├── manual_template.md           ← 이 파일을 수정
    ├── build-manual.js
    ├── manual.html
    └── manual_mobile.html
```

