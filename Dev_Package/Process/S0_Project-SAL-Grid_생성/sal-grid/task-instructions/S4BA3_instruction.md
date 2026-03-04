# S4BA3: 상속 API

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S4BA3 |
| Task 이름 | 상속 API |
| Stage | S4 — 개발 마무리 |
| Area | BA — Backend APIs |
| Dependencies | S4DB1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

디지털 자산(챗봇) 상속 기능의 백엔드 API를 구현한다. S4DB1의 bot_inheritance 테이블을 기반으로 상속 설정, 수락, 이전 처리를 담당한다.

## 세부 작업 지시

1. POST /api/inheritance (api/Backend_APIs/inheritance.js):
   - 인증 필요
   - 요청: { heirEmail, botIds, conditionMonths }
   - bot_inheritance 테이블에 상속 설정 저장
   - 상속인에게 이메일 알림 발송 (Supabase Edge Function 또는 이메일 API)
   - 응답: { inheritanceId, status: 'pending' }

2. GET /api/inheritance (inheritance.js):
   - 인증 필요
   - 현재 사용자의 상속 설정 목록 반환
   - 상속인으로 지정된 목록도 포함

3. PATCH /api/inheritance/:id/accept (inheritance.js):
   - 상속인이 수락 처리
   - 상태를 'accepted'로 변경
   - 조건 충족 시 봇 소유권 이전

4. DELETE /api/inheritance/:id (inheritance.js):
   - 상속 설정 취소/삭제

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| api/Backend_APIs/inheritance.js | 상속 API (설정, 조회, 수락, 삭제) 신규 생성 |

## 완료 기준
- [ ] POST /api/inheritance 설정 저장
- [ ] GET /api/inheritance 목록 반환
- [ ] PATCH /api/inheritance/:id/accept 수락 처리
- [ ] DELETE /api/inheritance/:id 삭제
- [ ] 본인 상속 설정만 조회/수정 가능
- [ ] @task S4BA3 주석 포함
- [ ] 오류 처리 포함 (400, 403, 404, 500)
