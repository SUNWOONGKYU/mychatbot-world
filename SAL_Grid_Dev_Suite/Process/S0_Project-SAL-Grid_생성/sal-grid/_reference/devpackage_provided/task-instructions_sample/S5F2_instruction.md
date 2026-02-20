# S5F2: 프로젝트 완료 처리 및 완료 프로젝트 관리

## Task 정보
- **Task ID**: S5F2
- **Task Name**: 프로젝트 완료 처리 및 완료 프로젝트 관리
- **Stage**: S5 (개발 마무리)
- **Area**: F (Frontend)
- **Dependencies**: S4F5

## Task 목표

대시보드에서 진행중 프로젝트를 완료 처리하고, 완료된 프로젝트(PoliticianFinder 등)를 관리하는 기능을 구현한다.

## 구현 내용

### 1. 프로젝트 완료 처리 기능

- 진행중 프로젝트 클릭 시 완료 확인 다이얼로그 표시
- 확인 시 projects 테이블의 status를 'completed'로 업데이트
- 진행률 100%, completed_at 타임스탬프 기록
- 완료 후 '완료 Project' 섹션으로 자동 이동

### 2. 완료 프로젝트 표시

- PoliticianFinder 완료 프로젝트 표시
- 버튼 3개: 사이트 바로가기 / 안내문 / Order Sheet
- 녹색 '완료' 배지로 상태 표시
- 버튼은 항상 표시 (펼침/접힘 없이)

### 3. 관련 데이터

- STAGE_DATA['politician_finder']: 안내문 URL 정보
- STAGE_DATA['completed_project_revision']: Order Sheet URL 정보

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `Production/index.html` | completeProject() 함수, loadCompletedProjects() 수정, STAGE_DATA 추가 |
| `Briefings_OrderSheets/Situational_Guides/Politician_Finder_Briefing.md` | PoliticianFinder 안내문 생성 |
| `Production/guides.js` | guides.js 빌드 |

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
