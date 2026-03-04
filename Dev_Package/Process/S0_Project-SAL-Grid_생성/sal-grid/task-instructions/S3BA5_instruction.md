# S3BA5: 성장 지표/레벨 API

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S3BA5 |
| Task 이름 | 성장 지표/레벨 API |
| Stage | S3 — 개발 2차 |
| Area | BA — Backend APIs |
| Dependencies | S3BA1, S3DB2 |
| 실행 방식 | AI-Only |

## 배경 및 목적

챗봇이 대화를 쌓으면서 레벨업하는 성장 시스템을 구현한다. S3DB2의 bot_growth 테이블을 기반으로 봇의 경험치, 레벨, 성장 지표를 제공하는 API를 만든다.

## 세부 작업 지시

1. GET /api/growth/:botId (api/Backend_APIs/growth.js):
   - bot_growth 테이블에서 해당 봇의 성장 데이터 조회
   - 레벨 계산 로직:
     - 경험치 = (총 대화 수 × 10) + (FAQ 등록 수 × 5) + (긍정 피드백 수 × 2)
     - 레벨 1: 0-99 exp, 레벨 2: 100-299 exp, 레벨 3: 300+ exp
   - 응답:
     ```json
     {
       "botId": "...",
       "level": 2,
       "experience": 150,
       "nextLevelExp": 300,
       "stats": {
         "totalConversations": 12,
         "totalMessages": 87,
         "faqCount": 5,
         "avgRating": 4.3
       }
     }
     ```

2. 인증 미들웨어 적용 (본인 봇만 조회 가능)

3. bot_growth 테이블 업데이트 트리거 또는 API 호출 시점 계산

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| api/Backend_APIs/growth.js | 성장 지표/레벨 API 신규 생성 |

## 완료 기준
- [ ] GET /api/growth/:botId 정상 응답
- [ ] 레벨 계산 로직 구현
- [ ] 경험치/레벨/다음 레벨까지 경험치 반환
- [ ] stats 객체 포함
- [ ] 본인 봇이 아닐 때 403 응답
- [ ] 존재하지 않는 botId에 404 응답
- [ ] @task S3BA5 주석 포함
