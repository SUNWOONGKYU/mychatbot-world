# S4F9: 사이드바 Project UI 개선

## Task 정보
- **Task ID**: S4F9
- **Task Name**: 사이드바 Project UI 개선
- **Stage**: S4 (개발 3차)
- **Area**: F (Frontend)
- **Dependencies**: S4F5

## Task 목표

사이드바 PROJECT 섹션의 UI를 개선하여 사용성을 높인다.

## 수정 사항

### 1. "+ 새로운 Project 등록" 버튼 위치 이동 및 스타일 변경

**현재:**
```
진행중 Project ▼
  └ ValueLink [진행중]
  └ + 새로운 Project 등록    ← 프로젝트 아래, 메뉴 항목 느낌
```

**변경 후:**
```
진행중 Project ▼
  └ [+ 새로운 Project 등록]  ← 위로 이동, 명확한 버튼 UI
  └ ValueLink [진행중]
```

- "진행중 Project" 드롭다운 바로 아래, 프로젝트 항목 위로 이동
- 현재 점선(dashed) 테두리 텍스트 → 명확한 버튼 스타일로 변경
- 배경색, 패딩, border-radius 등으로 버튼 느낌 강화

### 2. 진행중 프로젝트 항목 클릭 시 액션 버튼 표시

**현재:**
- 프로젝트명 클릭 → 즉시 `completeProject()` 호출 → "완료 처리하시겠습니까?" confirm

**변경 후:**
- 프로젝트명 클릭 → 항목 아래에 두 개의 액션 버튼 표시:
  1. **[완료 처리]** 버튼 - 기존 completeProject() 기능
  2. **[폴더 연결]** 버튼 - File System Access API 연결 (S4F10에서 구현)

```
진행중 Project ▼
  └ [+ 새로운 Project 등록]
  └ ValueLink [진행중]
      ├ [완료 처리]     ← 기존 completeProject() 호출
      └ [폴더 연결]     ← S4F10에서 기능 구현 (이 Task에서는 버튼 UI만)
```

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `index.html` | 사이드바 PROJECT 섹션 HTML 구조 변경 (라인 152-205) |
| `index.html` | `loadCurrentProject()` 함수 수정 - 동적 렌더링에 액션 버튼 추가 |
| `assets/css/main.css` | 액션 버튼 스타일 추가 (필요 시) |

## 구현 세부사항

### HTML 변경 (정적 구조)
- "새로운 Project 등록" div를 `currentProjectList` div 위로 이동
- 버튼 스타일: solid 테두리, 배경색, 호버 효과

### JS 변경 (동적 렌더링)
- `loadCurrentProject()` 함수 내 `currentProjectList.innerHTML` 수정
- 프로젝트 항목 클릭 시 completeProject() 직접 호출 대신 액션 버튼 토글
- "폴더 연결" 버튼은 `connectLocalFolder()` 함수 호출 (S4F10에서 구현)
- S4F10 미구현 시: "폴더 연결" 버튼 클릭 → "준비 중" 안내

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
