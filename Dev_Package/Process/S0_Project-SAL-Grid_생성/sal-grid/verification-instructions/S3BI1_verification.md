# S3BI1: Obsidian 지식베이스 연동 - Verification

## Verification 정보
- **Task ID**: S3BI1
- **Verification Agent**: code-reviewer
- **검증 기준**: MD 파일 파싱/청킹/임베딩/벡터검색 파이프라인 정상 동작 여부

## 검증 항목

### 1. Unit Test
- [ ] MD 파일 업로드 API 정상 응답
- [ ] 청킹 로직 정확성 (청크 크기, 오버랩 등)
- [ ] 임베딩 생성 및 pgvector 저장 확인

### 2. Build Verification
- [ ] api/obsidian.js 문법 오류 없음
- [ ] 필요한 라이브러리 의존성 확인

### 3. Integration Verification
- [ ] 챗봇 대화 시 Obsidian 지식베이스 RAG 검색 연동
- [ ] home.js UI에서 업로드/삭제/목록 조회 정상 동작

### 4. Blockers
- [ ] pgvector 확장 활성화 여부 (S1D1 의존)
- [ ] OpenAI Embeddings API 키 설정 여부
