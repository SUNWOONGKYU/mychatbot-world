# S4BI1: SAL Grid JSON/CSV 빌드 시스템 - 검증 지침

## 검증 정보
- **Task ID**: S4BI1
- **Task Name**: SAL Grid JSON/CSV 빌드 시스템
- **Verification Agent**: code-reviewer

## 검증 항목

### 1. 빌드 스크립트 존재 확인
- [ ] `Production/build-sal-grid-csv.js` 존재
- [ ] `Production/build-progress.js` 존재

### 2. 변환 스크립트 존재 확인
- [ ] `S0_.../CSV_Method/scripts/json-to-csv.js` 존재
- [ ] `S0_.../CSV_Method/scripts/csv-to-json.js` 존재

### 3. 데이터 파일 확인
- [ ] `Production/data/sal_grid.csv` 존재
- [ ] `Production/data/phase_progress.json` 존재

### 4. JSON 템플릿 확인
- [ ] `CSV_Method/templates/project_sal_grid_template.json` 존재
- [ ] 22개 속성 포함 여부

### 5. 빌드 스크립트 실행 테스트
- [ ] `node build-sal-grid-csv.js` 실행 성공
- [ ] `node build-progress.js` 실행 성공
- [ ] 에러 없이 파일 생성

### 6. 변환 스크립트 실행 테스트
- [ ] `node json-to-csv.js` 실행 성공
- [ ] `node csv-to-json.js` 실행 성공
- [ ] 양방향 변환 데이터 무결성

### 7. CSV 데이터 검증
- [ ] 57개 Task 데이터 포함
- [ ] 22개 컬럼 존재
- [ ] 한글 인코딩 정상 (UTF-8)

### 8. phase_progress.json 검증
- [ ] P0~S5 단계 포함
- [ ] 진행률 계산 정확
- [ ] JSON 형식 유효

## 통과 기준

1. 모든 스크립트가 에러 없이 실행
2. CSV/JSON 파일이 정상 생성
3. 데이터 무결성 유지 (22개 속성, 57개 Task)
4. 양방향 변환 테스트 통과

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |
| `.claude/rules/04_grid-writing-supabase.md` | Grid 22개 속성 | 데이터 검증 시 |
