# S3F14 검증 지시서

## 검증 정보
| 항목 | 값 |
|------|---|
| Task ID | S3F14 |
| Task Name | Learning 학습→시나리오 AI 대화 연결 |
| Verification Agent | code-reviewer-core |

## 검증 체크리스트

### 1. 파일 존재 확인
- [ ] `js/learning.js` — `@task S3F14` 주석 존재
- [ ] `pages/learning/index.html` — 시나리오 대화 UI 영역 존재
- [ ] `css/learning.css` — 대화 UI 스타일 포함

### 2. 코드 품질 검증
- [ ] API 호출 시 에러 핸들링 (네트워크 실패, 401 등)
- [ ] 사용자 입력 XSS escape 처리
- [ ] 기존 DOM ID/클래스명 보존 (회귀 방지)

### 3. 기능 검증
- [ ] "학습 시작" 클릭 시 시나리오 대화 UI가 표시되는가
- [ ] school-session API가 정상 호출되는가
- [ ] AI 응답(고객 역할)이 표시되는가
- [ ] 사용자 입력 후 다음 Step으로 진행되는가
- [ ] 시나리오 완료 시 진행률이 갱신되는가
- [ ] XP 획득이 표시되는가
- [ ] 통계 카드가 실시간 업데이트되는가
- [ ] 학습 이력이 갱신되는가

### 4. 통합 검증
- [ ] S3BA8 (진행률 동기화 API)와 연동 정상
- [ ] S3CS2 (누락 시나리오)가 없어도 graceful 처리
- [ ] 로그인/비로그인 상태 모두 동작

## 검증 결과 기록 형식
검증 완료 후 `grid_records/S3F14.json` 업데이트
