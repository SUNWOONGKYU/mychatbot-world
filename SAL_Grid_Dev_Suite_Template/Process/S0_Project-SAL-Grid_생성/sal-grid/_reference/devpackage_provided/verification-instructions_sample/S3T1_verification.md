# Verification Instruction - S3T1

---

## 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |

---

## Task ID
S3T1

## Task Name
AI 튜터 통합 테스트

## Verification Agent
`qa-specialist`

---

## 검증 항목

### 1. 테스트 파일 존재 확인
- [ ] `S3_개발-2차/Testing/ai-tutor-api.test.js`
- [ ] `S3_개발-2차/Testing/rag-pipeline.test.js`
- [ ] `S3_개발-2차/Testing/ai-tutor-e2e.test.js`
- [ ] `S3_개발-2차/Testing/credit-deduction.test.js`
- [ ] `S3_개발-2차/Testing/ai-tutor-mobile.test.js`

### 2. 단위 테스트 결과

```bash
npm test -- --grep "AI Tutor"
```

| 테스트 | 결과 |
|--------|------|
| 채팅 API 테스트 | ✅/❌ |
| 대화 관리 API 테스트 | ✅/❌ |
| 청킹 로직 테스트 | ✅/❌ |
| 임베딩 생성 테스트 | ✅/❌ |
| 프롬프트 빌더 테스트 | ✅/❌ |

### 3. E2E 테스트 결과

```bash
npx playwright test ai-tutor-e2e.test.js
```

| 테스트 | 결과 |
|--------|------|
| 모달 열기 | ✅/❌ |
| 메시지 전송 & 스트리밍 | ✅/❌ |
| 참조 문서 표시 | ✅/❌ |
| 대화 생성/목록 | ✅/❌ |
| 크레딧 차감 | ✅/❌ |

### 4. 크레딧 차감 검증

```sql
-- 테스트 전 크레딧
SELECT credit_balance FROM users WHERE id = '{test_user_id}';

-- 질문 수행

-- 테스트 후 크레딧 (1 감소)
SELECT credit_balance FROM users WHERE id = '{test_user_id}';
```
- [ ] 질문당 1 크레딧 정확히 차감
- [ ] 에러 시 크레딧 유지
- [ ] credit_history 기록 확인

### 5. RAG 정확도 검증

| 질문 | 예상 참조 문서 | 실제 참조 문서 | 정확도 |
|------|--------------|--------------|--------|
| "SSAL Works란?" | 서비스 소개 문서 | | |
| "프로젝트 등록 방법" | 가이드 문서 | | |
| "AI Q&A 사용법" | Tips 문서 | | |

- [ ] 관련 문서를 정확히 검색하는가?
- [ ] similarity 점수가 적절한가? (> 0.5)
- [ ] 무관한 문서가 포함되지 않는가?

### 6. 모바일 테스트 결과

```bash
npx playwright test ai-tutor-mobile.test.js
```

| 항목 | iPhone X | Galaxy S21 |
|------|----------|------------|
| 모달 전체 화면 | ✅/❌ | ✅/❌ |
| 입력창 위치 | ✅/❌ | ✅/❌ |
| 스크롤 동작 | ✅/❌ | ✅/❌ |

### 7. 성능 테스트

| 항목 | 목표 | 실측 |
|------|------|------|
| 첫 응답 시간 (TTFB) | < 2초 | |
| 전체 응답 시간 | < 10초 | |
| 임베딩 검색 시간 | < 500ms | |

---

## 통과 기준

| 항목 | 기준 |
|------|------|
| 단위 테스트 | 모든 테스트 통과 |
| E2E 테스트 | 모든 시나리오 통과 |
| 크레딧 | 정확한 차감 동작 |
| RAG | 관련 문서 정확히 검색 |
| 모바일 | 주요 기기에서 정상 동작 |

---

## Stage Gate 체크리스트

AI 튜터 관련 5개 Task 완료 후 Stage Gate 통과 조건:

- [ ] S3D1: DB 스키마 생성 및 검증 완료
- [ ] S3BI2: RAG 파이프라인 구축 및 임베딩 생성 완료
- [ ] S3BA3: API 개발 및 테스트 완료
- [ ] S3F2: UI 개발 및 테스트 완료
- [ ] S3T1: 통합 테스트 통과

---

## 검증 결과 기록 양식

```json
{
    "unit_test": "✅ N/N 테스트 통과",
    "integration_test": "✅ E2E 전체 플로우 동작",
    "edge_cases": "✅ 에러 핸들링, 경계값 테스트",
    "manual_test": "✅ 실제 사용 시나리오 테스트"
}
```

---

## PO 테스트 가이드

### 테스트 전 확인사항
- [ ] 빌더 계정으로 로그인
- [ ] 크레딧 잔액 확인 (최소 5 크레딧)
- [ ] content_embeddings 테이블에 데이터 존재

### 테스트 시나리오

1. **기본 대화 테스트**
   - AI 튜터 버튼 클릭
   - "SSAL Works란 무엇인가요?" 질문
   - 스트리밍 응답 확인
   - 참조 문서 표시 확인

2. **대화 관리 테스트**
   - 새 대화 생성
   - 대화 목록에서 이전 대화 선택
   - 대화 삭제

3. **크레딧 테스트**
   - 질문 전 크레딧 확인
   - 질문 후 크레딧 1 감소 확인

4. **모바일 테스트**
   - 모바일 기기에서 AI 튜터 사용
   - 전체 화면 모달 확인
   - 키보드 입력 정상 동작 확인
