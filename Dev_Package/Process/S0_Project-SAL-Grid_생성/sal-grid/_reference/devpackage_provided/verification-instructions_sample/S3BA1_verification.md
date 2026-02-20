# Verification Instruction - S3BA1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S3BA1

## Task Name
AI Q&A API

## Verification Checklist

### 1. 파일 존재 검증
- [ ] api/ai/qa.js 존재
- [ ] api/lib/ai/context-loader.js 존재

### 2. Q&A API 기능 검증
- [ ] POST /api/ai/qa 엔드포인트
- [ ] question 필수 파라미터
- [ ] 인증 필수 (withAuth)
- [ ] AI 응답 반환

### 3. 시스템 프롬프트 검증
- [ ] 역할 정의 (AI 튜터)
- [ ] 한국어 응답 설정
- [ ] 콘텐츠 컨텍스트 포함

### 4. 사용량 연동 검증
- [ ] checkUsageLimit 호출
- [ ] 한도 초과 시 429 반환
- [ ] 사용량 로깅

### 5. 응답 형식 검증
```json
{
  "answer": "AI 응답 내용",
  "usage": {
    "inputTokens": 100,
    "outputTokens": 200
  },
  "remainingTokens": 4500
}
```

## Test Commands
```bash
# 파일 존재 확인
ls -la api/ai/qa.js

# API 테스트
curl -X POST http://localhost:3000/api/ai/qa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"question": "테스트 질문"}'
```

## Expected Results
- Q&A API 동작
- AI 응답 생성
- 사용량 추적

## Verification Agent
backend-developer

## Pass Criteria
- AI 응답 생성 성공
- 사용량 제한 동작
- 에러 핸들링 정상

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Task ID의 Stage에 맞는 폴더에 저장되었는가? (S1→S1_개발_준비/, S2→S2_개발-1차/, ...)
- [ ] Task ID의 Area에 맞는 폴더에 저장되었는가? (S→Security/, F→Frontend/, ...)
- [ ] Production 관련 코드(F, BA, D)는 Production 폴더에도 저장되었는가?

