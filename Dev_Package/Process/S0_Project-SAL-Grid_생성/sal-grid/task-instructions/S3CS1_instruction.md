# S3CS1: 챗봇스쿨 콘텐츠 시스템

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S3CS1 |
| Task 이름 | 챗봇스쿨 콘텐츠 시스템 |
| Stage | S3 — 개발 2차 |
| Area | CS — Content/System |
| Dependencies | S2CS1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

챗봇스쿨은 사용자가 자신의 챗봇을 시나리오 기반 학습 세션을 통해 훈련시킬 수 있는 기능이다. 기존 페르소나 시스템(S2CS1)을 확장하여 구조화된 훈련 콘텐츠를 제공한다.

## 세부 작업 지시

1. POST /api/school/session (api/Backend_APIs/school-session.js):
   - 요청: { botId, scenarioId, userMessage }
   - 해당 시나리오의 컨텍스트로 AI 응답 생성 (S3BA1 고급 대화 API 활용)
   - 세션 진행률 추적
   - 응답: { response, sessionProgress, nextHint }

2. templates/school/ 폴더에 시나리오 JSON 작성:
   - templates/school/basic-greeting.json — 기본 인사 시나리오
   - templates/school/product-inquiry.json — 상품/서비스 문의 시나리오
   - templates/school/complaint-handling.json — 불만 처리 시나리오
   - 각 파일 구조:
     ```json
     {
       "scenarioId": "basic-greeting",
       "scenarioName": "기본 인사 학습",
       "description": "...",
       "steps": [
         { "stepId": 1, "userPrompt": "...", "expectedTopics": [...] }
       ]
     }
     ```

3. 시나리오 완료 시 bot_growth 테이블 경험치 업데이트

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| api/Backend_APIs/school-session.js | 챗봇스쿨 세션 API 신규 생성 |
| templates/school/basic-greeting.json | 기본 인사 시나리오 |
| templates/school/product-inquiry.json | 상품 문의 시나리오 |
| templates/school/complaint-handling.json | 불만 처리 시나리오 |

## 완료 기준
- [ ] POST /api/school/session 정상 응답
- [ ] 시나리오 JSON 3개 이상 생성
- [ ] 세션 진행률 추적
- [ ] 시나리오 컨텍스트 반영된 AI 응답
- [ ] 완료 시 경험치 업데이트
- [ ] @task S3CS1 주석 포함
