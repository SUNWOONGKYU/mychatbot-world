# S2BA4: 게스트 생성/템플릿/사용량 API

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S2BA4 |
| Task 이름 | 게스트 생성/템플릿/사용량 API |
| Stage | S2 — 개발 1차 |
| Area | BA — Backend APIs |
| Dependencies | S2BA2, S2DB1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

게스트 체험 모드(S2F6)를 지원하기 위한 백엔드 API 3개를 구현한다. 로그인 없이 봇을 생성하고 템플릿을 조회하며 사용량을 추적할 수 있다. S2DB1의 usage_logs, bot_templates 테이블을 활용한다.

## 세부 작업 지시

1. POST /api/guest-create (api/Backend_APIs/guest-create.js):
   - 로그인 불필요 (인증 미들웨어 스킵)
   - 게스트 세션 ID 생성 (UUID)
   - Supabase에 임시 봇 레코드 저장 (bots 테이블, guest_session_id 컬럼)
   - 응답: { botId, guestSessionId, expiresAt }
2. GET /api/templates (api/Backend_APIs/templates.js):
   - bot_templates 테이블에서 직업별 템플릿 조회
   - 쿼리 파라미터: category (선택)
   - 응답: templates 배열
3. GET /api/usage (api/Backend_APIs/usage.js):
   - 인증된 사용자의 usage_logs 조회
   - 월별 사용량 집계
   - 응답: { currentMonth, limit, used, percentage }
4. 각 파일 상단에 @task S2BA4 주석 포함

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| api/Backend_APIs/guest-create.js | 게스트 봇 생성 API 신규 생성 |
| api/Backend_APIs/templates.js | 직업별 템플릿 조회 API 신규 생성 |
| api/Backend_APIs/usage.js | 사용량 조회 API 신규 생성 |

## 완료 기준
- [ ] POST /api/guest-create 200 응답 확인
- [ ] GET /api/templates 템플릿 목록 반환
- [ ] GET /api/usage 인증 사용자 사용량 반환
- [ ] guest_session_id로 게스트 식별
- [ ] 하드코딩 API 키 없음
- [ ] 각 엔드포인트 오류 처리 (400, 500 응답)
- [ ] kebab-case 파일명 준수
