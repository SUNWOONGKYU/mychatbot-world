# S4BA2: 마켓플레이스/수익 API

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S4BA2 |
| Task 이름 | 마켓플레이스/수익 API |
| Stage | S4 — 개발 마무리 |
| Area | BA — Backend APIs |
| Dependencies | S3BA3, S4DB1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

스킬 마켓플레이스 운영과 수익 추적을 위한 백엔드 API를 구현한다. S3BA3 수익활동 중개 시스템과 S4DB1 Phase 3 DB를 기반으로 한다.

## 세부 작업 지시

1. POST /api/marketplace/publish (api/Backend_APIs/marketplace.js):
   - 요청: { skillName, description, category, price, skillFiles }
   - skill_marketplace 테이블에 등록
   - 응답: { skillId, status: 'pending_review' }

2. GET /api/marketplace/skills (marketplace.js):
   - 쿼리 파라미터: category, search, page, limit
   - is_active=true인 스킬 목록 반환

3. POST /api/marketplace/install/:skillId (marketplace.js):
   - 인증 필요
   - 무료: 즉시 설치 처리
   - 유료: 크레딧 차감 후 설치

4. GET /api/revenue/:botId (api/Backend_APIs/revenue.js):
   - 인증 필요 (본인 봇만)
   - bot_revenue_events 테이블에서 집계
   - 응답: { total, thisMonth, bySkill, settlements }

5. POST /api/revenue/settle (revenue.js):
   - 정산 요청 API
   - 최소 금액 체크 (예: 10,000 크레딧)

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| api/Backend_APIs/marketplace.js | 마켓플레이스 API (publish, skills, install) 신규 생성 |
| api/Backend_APIs/revenue.js | 수익 조회/정산 API 신규 생성 |

## 완료 기준
- [ ] POST /api/marketplace/publish 동작
- [ ] GET /api/marketplace/skills 목록 반환
- [ ] POST /api/marketplace/install 설치 처리
- [ ] GET /api/revenue/:botId 수익 집계 반환
- [ ] 인증 미들웨어 적용
- [ ] 하드코딩 없음, 환경변수 사용
- [ ] @task S4BA2 주석 포함
