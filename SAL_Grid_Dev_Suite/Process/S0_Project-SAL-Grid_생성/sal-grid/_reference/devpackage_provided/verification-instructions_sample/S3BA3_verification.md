# Verification Instruction - S3BA3

---

## 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |

---

## Task ID
S3BA3

## Task Name
AI 튜터 API 개발

## Verification Agent
`code-reviewer`

---

## 검증 항목

### 1. API 파일 존재 확인
- [ ] `api/External/ai-tutor-chat.js` 존재
- [ ] `api/External/ai-tutor-conversations.js` 존재
- [ ] `vercel.json`에 라우트 추가됨

### 2. 채팅 API 테스트

#### 2-1. 인증 검증
```bash
# 401 Unauthorized (토큰 없음)
curl -X POST https://ssalworks.ai.kr/api/ai-tutor/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "테스트"}'
```
- [ ] 토큰 없이 요청 시 401 반환

#### 2-2. 정상 요청
```bash
# SSE 스트리밍 응답
curl -X POST https://ssalworks.ai.kr/api/ai-tutor/chat \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"message": "SSAL Works란?"}'
```
- [ ] SSE 형식 응답 (data: {...})
- [ ] content 타입 청크 수신
- [ ] sources 타입 수신
- [ ] done 타입으로 종료

#### 2-3. 크레딧 부족
- [ ] 크레딧 0일 때 402 반환

#### 2-4. Rate Limiting
- [ ] 30회/분 초과 시 429 반환

### 3. 대화 관리 API 테스트

#### 3-1. 대화 목록 조회
```bash
curl https://ssalworks.ai.kr/api/ai-tutor/conversations \
  -H "Authorization: Bearer {token}"
```
- [ ] 배열 형태 반환
- [ ] 본인 대화만 반환 (RLS)

#### 3-2. 대화 생성
```bash
curl -X POST https://ssalworks.ai.kr/api/ai-tutor/conversations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title": "테스트 대화"}'
```
- [ ] 201 Created 반환
- [ ] 생성된 대화 ID 반환

#### 3-3. 대화 상세 조회
```bash
curl https://ssalworks.ai.kr/api/ai-tutor/conversations/{id} \
  -H "Authorization: Bearer {token}"
```
- [ ] 대화 정보 + 메시지 목록 반환

#### 3-4. 대화 삭제
```bash
curl -X DELETE https://ssalworks.ai.kr/api/ai-tutor/conversations/{id} \
  -H "Authorization: Bearer {token}"
```
- [ ] 204 No Content 반환
- [ ] 메시지도 함께 삭제 (CASCADE)

### 4. 크레딧 차감 검증
- [ ] 질문 성공 시 1 크레딧 차감
- [ ] API 에러 시 크레딧 미차감
- [ ] 차감 내역 credit_history 테이블에 기록

### 5. vercel.json 라우트 확인
```json
{
    "rewrites": [
        { "source": "/api/ai-tutor/chat", "destination": "..." },
        { "source": "/api/ai-tutor/conversations", "destination": "..." }
    ]
}
```
- [ ] 채팅 라우트 추가됨
- [ ] 대화 관리 라우트 추가됨

---

## 통과 기준

| 항목 | 기준 |
|------|------|
| 채팅 API | SSE 스트리밍 정상 동작 |
| 대화 CRUD | 모든 엔드포인트 동작 |
| 인증 | 401/402/429 에러 처리 |
| 크레딧 | 차감 로직 정확 |
| 라우팅 | vercel.json 설정 완료 |

---

## 검증 결과 기록 양식

```json
{
    "unit_test": "✅ 개별 API 엔드포인트 테스트 통과",
    "integration_test": "✅ RAG + 스트리밍 + DB 저장 통합 동작",
    "edge_cases": "✅ 인증 실패, 크레딧 부족, Rate limit",
    "manual_test": "✅ curl 또는 Postman으로 직접 테스트"
}
```
