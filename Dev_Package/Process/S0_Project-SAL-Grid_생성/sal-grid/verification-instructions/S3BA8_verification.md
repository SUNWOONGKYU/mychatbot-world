# S3BA8 검증 지시서

## 검증 정보
| 항목 | 값 |
|------|---|
| Task ID | S3BA8 |
| Task Name | Learning 진행률 Supabase 동기화 API |
| Verification Agent | code-reviewer-core |

## 검증 체크리스트

### 1. 파일 존재 확인
- [ ] `api/Backend_APIs/learning-progress.js` — `@task S3BA8` 주석 존재

### 2. 코드 품질 검증
- [ ] JWT 토큰 검증 (`supabase.auth.getUser(token)`)
- [ ] 인증 없는 요청 시 401 반환
- [ ] SQL Injection 방지 (Supabase client 사용)
- [ ] 에러 핸들링 — DB 실패 시 적절한 HTTP 상태 코드

### 3. 기능 검증
- [ ] GET: botId로 진행률 조회 가능한가
- [ ] POST: 진행률 저장 가능한가
- [ ] XP/레벨 자동 재계산 동작하는가
- [ ] 병합 전략(max)이 올바르게 동작하는가
- [ ] 존재하지 않는 botId에 대한 에러 처리

### 4. 통합 검증
- [ ] `bot_growth` 테이블과 정상 연동
- [ ] S3F14 (Learning 프론트엔드)에서 호출 가능

## 검증 결과 기록 형식
검증 완료 후 `grid_records/S3BA8.json` 업데이트
