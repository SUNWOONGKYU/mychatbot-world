# Verification Instruction - S3BA2

## Task ID
S3BA2

## Task Name
AI 가격 조회 API

## Verification Agent
code-reviewer

## Verification Criteria

### 1. API 엔드포인트 확인
- [ ] GET /api/ai/pricing 존재
- [ ] 인증 없이 접근 가능 (공개 정보)

### 2. 응답 데이터 확인
```json
{
  "success": true,
  "data": {
    "gemini": {
      "name": "Gemini Pro",
      "credit_per_query": 10,
      "description": "Google AI"
    },
    "chatgpt": {
      "name": "ChatGPT-4",
      "credit_per_query": 15,
      "description": "OpenAI"
    },
    "perplexity": {
      "name": "Perplexity Pro",
      "credit_per_query": 12,
      "description": "Perplexity AI"
    }
  }
}
```

### 3. 데이터베이스 연동
- [ ] ai_pricing 테이블에서 조회
- [ ] 캐싱 적용 (선택적)

### 4. 에러 처리
- [ ] DB 연결 실패: 500 에러
- [ ] 데이터 없음: 빈 객체 또는 기본값

### 5. 성능 검증
- [ ] 응답 시간 500ms 이내
- [ ] 캐시 헤더 설정

## Test Commands
```bash
# 가격 조회
curl http://localhost:3000/api/ai/pricing

# 캐시 헤더 확인
curl -I http://localhost:3000/api/ai/pricing
```

## Build Verification
- [ ] API 파일 문법 오류 없음
- [ ] DB 쿼리 정상 실행
- [ ] JSON 응답 형식 정확

## Integration Verification
- [ ] S3BI1 AI API 클라이언트와 연동
- [ ] S3F1 AI Q&A 인터페이스에서 호출
- [ ] S4D1 ai_pricing 테이블 참조

## Expected Files
- Production/Backend_APIs/api/ai/pricing.js
- S3_개발-2차/Backend_APIs/api/ai/pricing.js

## Notes
- 가격 변경 시 즉시 반영되어야 함
- 관리자가 가격 수정 가능하도록
