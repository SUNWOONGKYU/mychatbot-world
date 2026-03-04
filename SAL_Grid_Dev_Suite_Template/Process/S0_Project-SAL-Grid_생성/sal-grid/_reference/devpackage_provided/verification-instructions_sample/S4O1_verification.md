# Verification Instruction - S4O1

---

## Task ID
S4O1

## Task Name
Cron Jobs 설정

## Verification Agent
qa-specialist

## Verification Criteria

### 1. vercel.json Cron 설정 확인
- [ ] crons 배열 존재
- [ ] 구독 만료 체크 cron 설정
- [ ] 자동 결제 cron 설정
- [ ] 통계 집계 cron 설정
- [ ] 정리 작업 cron 설정

### 2. Cron API 엔드포인트 존재 확인
- [ ] api/cron/subscription-expiry.js
- [ ] api/cron/auto-payment.js
- [ ] api/cron/stats-aggregate.js
- [ ] api/cron/cleanup.js

### 3. Cron 인증 검증
- [ ] CRON_SECRET 환경변수 사용
- [ ] Authorization 헤더 검증
- [ ] 인증 실패 시 401 응답

### 4. 구독 만료 체크 로직 검증
- [ ] 만료된 구독 상태 변경 (active → expired)
- [ ] 만료 예정 알림 발송 (7일/1일 전)
- [ ] 로그 기록

### 5. 자동 결제 로직 검증
- [ ] 갱신일 도달 구독 결제 시도
- [ ] 결제 성공 시 갱신일 연장
- [ ] 결제 실패 시 재시도 로직

### 6. 스케줄 확인
- [ ] subscription-expiry: 매일 00:00 UTC
- [ ] auto-payment: 매일 09:00 KST
- [ ] stats-aggregate: 매일 01:00 UTC
- [ ] cleanup: 매주 일요일 03:00 UTC

## Test Commands
```bash
# Cron API 수동 호출 (로컬 테스트)
curl -X POST http://localhost:3000/api/cron/subscription-expiry \
  -H "Authorization: Bearer $CRON_SECRET"

# vercel.json crons 확인
cat vercel.json | jq '.crons'

# 환경변수 확인
vercel env ls | grep CRON_SECRET
```

## Build Verification
- [ ] vercel.json 문법 오류 없음
- [ ] Cron API 파일 문법 오류 없음
- [ ] 환경변수 설정 완료

## Integration Verification
- [ ] S1F2 vercel.json과 통합
- [ ] S2BA3 구독 관리 API와 연동
- [ ] S4BA1 결제 API와 연동

## Expected Files
- Production/Frontend/vercel.json (crons 섹션)
- Production/Backend_APIs/api/cron/*.js
- S4_개발-3차/DevOps/CRON_JOBS.md

## Pass Criteria
- 모든 Cron job 정상 설정
- 인증 보안 적용
- 각 job 수동 호출 테스트 통과

---

## 저장 위치 검증 항목
- [ ] S4_개발-3차/DevOps/ 폴더에 문서 저장되었는가?
- [ ] Production/Backend_APIs/api/cron/ 폴더에 코드 저장되었는가?
