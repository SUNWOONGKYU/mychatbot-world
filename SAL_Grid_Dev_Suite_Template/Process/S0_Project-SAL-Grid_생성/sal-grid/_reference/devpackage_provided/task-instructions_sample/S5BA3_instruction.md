# S5BA3: 크레딧 차감 기능 구현

## Task 정보
- **Task ID**: S5BA3
- **Task Name**: 크레딧 차감 기능 구현
- **Stage**: S5 (개발 마무리)
- **Area**: BA (Backend APIs)
- **Dependencies**: S3BA1 (AI Q&A API), S4BA4 (크레딧 API)

## Task 목표

AI Q&A API 사용 시 사용자 크레딧을 자동으로 차감하고, 잔액 부족 시 사용을 제한하는 기능을 구현합니다.

## 구현 범위

### 1. 크레딧 잔액 확인
- AI API 호출 전 사용자 `credit_balance` 조회
- 잔액 부족 시 402 Payment Required 응답

### 2. 모델별 비용 조회
- `api_costs` 테이블에서 provider/model별 `credit_cost` 조회
- 테이블 조회 실패 시 기본값 사용 (Gemini: 1, ChatGPT: 2, Perplexity: 3)

### 3. 크레딧 차감 처리
- `users.credit_balance` 차감
- `credit_history` 테이블에 사용 이력 기록
- `api_usage_log.cost_credits` 필드에 비용 기록

### 4. 에러 처리
- 크레딧 부족: 402 응답 + 잔액/필요 크레딧 정보
- 차감 실패: 롤백 처리 (AI 응답은 반환하되 로그 기록)

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `api/External/ai-qa.js` | 크레딧 확인/차감 로직 추가 |

## 기술 명세

### 크레딧 차감 플로우
```
1. 사용자 인증 확인
2. 현재 잔액 조회 (users.credit_balance)
3. 모델별 비용 조회 (api_costs.credit_cost)
4. 잔액 >= 비용 확인
   - 부족 시: 402 응답 반환
5. AI API 호출
6. 성공 시: 크레딧 차감 + 이력 기록
7. 응답 반환
```

### API 응답 (크레딧 부족 시)
```json
{
  "error": "Insufficient credits",
  "code": "INSUFFICIENT_CREDITS",
  "required": 2,
  "balance": 1,
  "message": "크레딧이 부족합니다. 충전 후 이용해주세요."
}
```

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/04_grid-writing-supabase.md` | Grid 업데이트 규칙 | Task 완료 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
