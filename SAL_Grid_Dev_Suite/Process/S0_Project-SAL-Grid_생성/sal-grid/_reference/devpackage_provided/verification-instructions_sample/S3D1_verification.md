# Verification Instruction - S3D1

---

## 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |

---

## Task ID
S3D1

## Task Name
AI 튜터 DB 스키마

## Verification Agent
`database-specialist`

---

## 검증 항목

### 1. pgvector 확장 검증
```sql
-- pgvector 확장 활성화 확인
SELECT * FROM pg_extension WHERE extname = 'vector';
```
- [ ] pgvector 확장이 활성화되어 있는가?

### 2. content_embeddings 테이블 검증
```sql
-- 테이블 존재 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'content_embeddings';
```
- [ ] 테이블이 생성되었는가?
- [ ] embedding 컬럼이 vector(768) 타입인가?
- [ ] 벡터 인덱스 (ivfflat)가 생성되었는가?

### 3. tutor_conversations 테이블 검증
```sql
-- RLS 정책 확인
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'tutor_conversations';
```
- [ ] 테이블이 생성되었는가?
- [ ] user_id 외래키가 올바르게 설정되었는가?
- [ ] RLS 정책 (SELECT, INSERT, UPDATE, DELETE)이 모두 적용되었는가?

### 4. tutor_messages 테이블 검증
- [ ] 테이블이 생성되었는가?
- [ ] conversation_id 외래키가 올바르게 설정되었는가?
- [ ] RLS 정책이 적용되었는가?
- [ ] ON DELETE CASCADE가 동작하는가?

### 5. search_content 함수 검증
```sql
-- 함수 테스트 (더미 벡터 사용)
SELECT * FROM search_content(
    array_fill(0.1::float8, ARRAY[768])::vector(768),
    0.0,
    5
);
```
- [ ] 함수가 정상 실행되는가?
- [ ] similarity 값이 반환되는가?

---

## 통과 기준

| 항목 | 기준 |
|------|------|
| 테이블 생성 | 3개 테이블 모두 존재 |
| 인덱스 | 벡터 인덱스 + 일반 인덱스 생성 |
| RLS | 모든 정책 활성화 |
| 함수 | search_content 정상 동작 |

---

## 검증 결과 기록 양식

```json
{
    "unit_test": "✅ 테이블 구조 검증 통과",
    "integration_test": "✅ RLS 정책 동작 확인",
    "edge_cases": "✅ 빈 테이블에서 함수 호출 정상",
    "manual_test": "✅ Supabase Dashboard에서 테이블 확인"
}
```
