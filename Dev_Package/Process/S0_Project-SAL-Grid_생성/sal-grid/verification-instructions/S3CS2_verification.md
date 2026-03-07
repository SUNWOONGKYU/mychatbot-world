# S3CS2 검증 지시서

## 검증 정보
| 항목 | 값 |
|------|---|
| Task ID | S3CS2 |
| Task Name | 누락 시나리오 템플릿 추가 |
| Verification Agent | code-reviewer-core |

## 검증 체크리스트

### 1. 파일 존재 확인
- [ ] `templates/school/advanced-qa.json` 존재
- [ ] `templates/school/master-eval.json` 존재

### 2. 코드 품질 검증
- [ ] JSON 문법 유효성 (파싱 에러 없음)
- [ ] UTF-8 인코딩
- [ ] 기존 3개 시나리오와 동일한 구조

### 3. 기능 검증
- [ ] advanced-qa.json이 5 steps인가
- [ ] master-eval.json이 6 steps인가
- [ ] scenarioId가 코드 참조와 일치하는가
- [ ] expectedTopics 배열이 적절한가
- [ ] xpReward 값이 적절한가

### 4. 통합 검증
- [ ] school-session.js에서 정상 로드 가능한가
- [ ] 시나리오 진행 시 모든 Step이 처리되는가

## 검증 결과 기록 형식
검증 완료 후 `grid_records/S3CS2.json` 업데이트
