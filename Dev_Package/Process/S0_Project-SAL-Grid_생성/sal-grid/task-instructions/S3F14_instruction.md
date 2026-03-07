# S3F14: Learning 학습→시나리오 AI 대화 연결

## Task 정보
- **Task ID**: S3F14
- **Task Name**: Learning 학습→시나리오 AI 대화 연결
- **Stage**: S3 (개발 2차)
- **Area**: F (Frontend)
- **Dependencies**: S3F8, S3CS1, S3BA8

## Task 목표

Learning 페이지의 "학습 시작" 버튼 클릭 시 카운터만 증가하는 것이 아닌, 실제 `school-session` API를 호출하여 시나리오 기반 AI 롤플레이 대화를 진행하도록 수정한다. 진행률을 Supabase와 동기화한다.

## 배경 및 목적

현재 `learning.js`의 `startModule()` 함수는 진행률을 25%씩 증가시키고 토스트 메시지만 표시한다. 실제 학습 콘텐츠를 전달하지 않는다.

그러나 백엔드에는 이미:
- `/api/Backend_APIs/school-session.js` — 시나리오 기반 AI 대화 API (OpenRouter 연동)
- `templates/school/` — 3개 시나리오 템플릿 (basic-greeting, complaint-handling, product-inquiry)
- `bot_growth` 테이블 — XP/레벨 추적

이 기존 인프라를 프론트엔드에서 연결해야 한다.

## 기능 요구사항

### 1. 학습 시작 → 시나리오 대화 UI
- "학습 시작" 클릭 → 대화 모달/인라인 영역 표시
- 시나리오 시작: `POST /api/Backend_APIs/school-session` 호출
  - `{ botId, scenarioId, userMessage, currentStep: 0 }`
- AI 응답 표시 (고객 역할)
- 사용자 입력 (챗봇 응답 작성)
- Step 완료 시 진행률 갱신
- 전체 시나리오 완료 시 XP 획득 표시

### 2. 시나리오별 매핑
- Basic 커리큘럼 → `basic-greeting` 시나리오
- Intermediate 커리큘럼 → `complaint-handling` 시나리오
- Advanced 커리큘럼 → `product-inquiry` 시나리오
- Master 커리큘럼 → `advanced-qa` + `master-eval` 시나리오 (S3CS2에서 생성)

### 3. 진행률 Supabase 동기화
- S3BA8에서 생성하는 `/api/Backend_APIs/learning-progress` API 활용
- 학습 시작 시: 서버에서 진행률 로드
- 학습 완료 시: 서버에 진행률 저장
- LocalStorage는 오프라인 캐시로 유지

### 4. 학습 이력 실시간 갱신
- 시나리오 완료 시 "최근 학습 이력" 섹션 자동 갱신
- 통계 카드 (완료 과정, 전체 진행률, 학습 세션) 실시간 업데이트

## 코드 작성 기준
- 파일 상단에 `@task S3F14` 주석 필수
- 기존 `learning.js`의 DOM ID, 클래스명 보존
- school-session API 응답 형식: `{ response, sessionProgress: { currentStep, totalSteps, percentage }, nextHint, model }`

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `js/learning.js` | `startModule()` 대폭 수정 — API 호출 + 대화 UI |
| `pages/learning/index.html` | 시나리오 대화 영역 추가 (모달 또는 인라인) |
| `pages/learning/curriculum.html` | 시나리오 대화 UI 연동 |
| `css/learning.css` | 대화 UI 스타일 추가 |

## 완료 기준
- [ ] "학습 시작" 클릭 시 시나리오 AI 대화가 시작된다
- [ ] 사용자가 챗봇 역할로 응답을 작성할 수 있다
- [ ] AI(고객 역할)가 시나리오에 따라 응답한다
- [ ] 시나리오 완료 시 진행률이 갱신된다
- [ ] 진행률이 Supabase와 동기화된다
- [ ] 학습 이력과 통계 카드가 실시간 업데이트된다
