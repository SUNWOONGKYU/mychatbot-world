# Verification Instruction - S3BI2

---

## 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |

---

## Task ID
S3BI2

## Task Name
RAG 파이프라인 구축

## Verification Agent
`code-reviewer`

---

## 검증 항목

### 1. 모듈 파일 존재 확인
- [ ] `api/Backend_Infra/rag/index.js` 존재
- [ ] `api/Backend_Infra/rag/embeddings.js` 존재
- [ ] `api/Backend_Infra/rag/chunker.js` 존재
- [ ] `api/Backend_Infra/rag/prompt-builder.js` 존재
- [ ] `scripts/generate-embeddings.js` 존재

### 2. 청킹 로직 검증
```javascript
const { chunkText } = require('./chunker');

// 테스트 케이스
const text = 'A'.repeat(2500);
const chunks = chunkText(text, 1000, 200);

console.assert(chunks.length === 3, 'Should create 3 chunks');
console.assert(chunks[0].length === 1000, 'First chunk should be 1000 chars');
```
- [ ] 1000자 청크 + 200자 오버랩 동작
- [ ] 짧은 텍스트 (< 1000자) 정상 처리
- [ ] 빈 텍스트 예외 처리

### 3. 임베딩 생성 검증
```javascript
const { generateEmbedding } = require('./embeddings');

const embedding = await generateEmbedding('테스트 텍스트');
console.assert(embedding.length === 768, 'Should be 768 dimensions');
```
- [ ] Gemini API 호출 성공
- [ ] 768차원 벡터 반환
- [ ] 에러 핸들링 동작

### 4. 벡터 검색 검증
```javascript
const { searchSimilarContent } = require('./embeddings');

const results = await searchSimilarContent(supabase, queryEmbedding, {
    matchThreshold: 0.5,
    matchCount: 5
});
console.assert(Array.isArray(results), 'Should return array');
```
- [ ] search_content 함수 호출 성공
- [ ] similarity 점수 반환
- [ ] 결과 정렬 확인 (유사도 높은 순)

### 5. 프롬프트 빌더 검증
```javascript
const { buildPrompt } = require('./prompt-builder');

const result = buildPrompt('질문', [
    { title: '문서1', content: '내용1', similarity: 0.9 }
]);

console.assert(result.systemPrompt.includes('AI 튜터'), 'Should have system prompt');
console.assert(result.sources.length === 1, 'Should have sources');
```
- [ ] 시스템 프롬프트 생성
- [ ] 컨텍스트 문서 포맷팅
- [ ] 소스 정보 추출

### 6. 임베딩 데이터 검증
```sql
-- content_embeddings 테이블에 데이터 존재 확인
SELECT content_type, COUNT(*) as count
FROM content_embeddings
GROUP BY content_type;
```
- [ ] Tips 임베딩 생성 완료
- [ ] Books 임베딩 생성 완료
- [ ] Guides 임베딩 생성 완료
- [ ] 총 청크 수 확인 (예상: ~675개)

---

## 통과 기준

| 항목 | 기준 |
|------|------|
| 모듈 파일 | 5개 파일 모두 존재 |
| 청킹 | 1000자/200자 오버랩 정상 동작 |
| 임베딩 | 768차원 벡터 생성 |
| 검색 | 유사도 기반 검색 동작 |
| 데이터 | content_embeddings에 데이터 존재 |

---

## 검증 결과 기록 양식

```json
{
    "unit_test": "✅ 청킹/임베딩/프롬프트 모듈 테스트 통과",
    "integration_test": "✅ RAG 파이프라인 전체 플로우 동작",
    "edge_cases": "✅ 빈 검색 결과, 긴 텍스트 처리",
    "manual_test": "✅ content_embeddings 테이블 데이터 확인"
}
```
