# S3T2 검증 지시서

## 검증 정보
| 항목 | 값 |
|------|---|
| Task ID | S3T2 |
| Task Name | Jobs/Community API 정합성 수정 |
| Verification Agent | code-reviewer-core |

## 검증 체크리스트

### 1. 파일 존재 확인
- [ ] `js/jobs.js` — 수정 반영
- [ ] `js/community.js` — 수정 반영

### 2. 코드 품질 검증
- [ ] API 경로에 `.js` 확장자 없음
- [ ] 모든 API 파라미터가 snake_case로 통일
- [ ] 기존 기능 회귀 없음

### 3. 기능 검증
- [ ] Jobs: 탭 전환 정상 동작
- [ ] Jobs: 카테고리 필터 정상 동작
- [ ] Jobs: 정렬 정상 동작
- [ ] Jobs: 검색 정상 동작
- [ ] Jobs: 카드 클릭 → detail.html 이동
- [ ] Community: 카테고리 탭 전환 정상 동작
- [ ] Community: 정렬 정상 동작
- [ ] Community: 검색 정상 동작
- [ ] Community: 신고 모달 submit → API 호출 연결

### 4. 통합 검증
- [ ] Jobs API 응답 데이터 렌더링 정상
- [ ] Community API 응답 데이터 렌더링 정상

## 검증 결과 기록 형식
검증 완료 후 `grid_records/S3T2.json` 업데이트
