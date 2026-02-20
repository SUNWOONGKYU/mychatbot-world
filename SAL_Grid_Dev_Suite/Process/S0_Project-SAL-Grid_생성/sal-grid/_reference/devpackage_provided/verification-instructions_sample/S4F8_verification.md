# S4F8: SAL Grid Viewer UI 구현 - 검증 지침

## 검증 정보
- **Task ID**: S4F8
- **Task Name**: SAL Grid Viewer UI 구현
- **Verification Agent**: code-reviewer

## 검증 항목

### 1. 파일 존재 확인
- [ ] `Production/viewer_database.html` 존재
- [ ] `Production/viewer_csv.html` 존재
- [ ] `Production/viewer_mobile_database.html` 존재
- [ ] `Production/viewer_mobile_csv.html` 존재

### 2. 22개 속성 표시 확인
- [ ] Task 상세 모달에 22개 속성 모두 표시
- [ ] 속성명이 Grid 22개 속성과 일치
- [ ] JSON 필드 포맷팅 (modification_history 등)

### 3. 필터링 기능
- [ ] Stage 필터 (S1~S5) 정상 작동
- [ ] Area 필터 (11개) 정상 작동
- [ ] 필터 조합 시 정상 작동

### 4. 상태별 색상 구분
- [ ] Pending: 회색
- [ ] In Progress: 파란색
- [ ] Executed: 주황색
- [ ] Completed: 초록색

### 5. index.html 레이아웃
- [ ] 2컬럼 레이아웃 적용
- [ ] 좌측: SSALWORKS 예시 버튼
- [ ] 우측: 진행중 프로젝트 버튼

### 6. 데이터 로딩 확인
- [ ] DB Method: Supabase 연동 정상
- [ ] CSV Method: 로컬 CSV 파일 로딩 정상

## 통과 기준

1. 4개 Viewer 파일 모두 브라우저에서 정상 렌더링
2. 22개 속성이 모달에서 모두 표시
3. 필터링 기능 정상 작동
4. index.html 2컬럼 레이아웃 정상

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |
| `.claude/rules/04_grid-writing-supabase.md` | Grid 22개 속성 | 속성 확인 시 |
