# Task Instruction - S3T1

---

## 필수 참조 규칙 파일 (2026-01-04)

> **작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |

---

## Task ID
S3T1

## Task Name
AI 튜터 통합 테스트

## Task Goal
AI 튜터 시스템의 End-to-End 테스트 및 전체 기능 검증

## Prerequisites (Dependencies)
- S3F2 (AI 튜터 UI 개발) 완료
- S3BA3 (AI 튜터 API 개발) 완료

## Specific Instructions

### 1. API 단위 테스트

```javascript
// S3_개발-2차/Testing/ai-tutor-api.test.js

describe('AI Tutor API Tests', () => {
    // 채팅 API 테스트
    describe('POST /api/ai-tutor/chat', () => {
        test('should return streaming response for valid request', async () => {
            // 테스트 구현
        });

        test('should return 401 for unauthorized request', async () => {
            // 테스트 구현
        });

        test('should return 402 for insufficient credits', async () => {
            // 테스트 구현
        });

        test('should return 429 for rate limit exceeded', async () => {
            // 테스트 구현
        });
    });

    // 대화 관리 API 테스트
    describe('Conversations API', () => {
        test('GET /api/ai-tutor/conversations should list user conversations', async () => {
            // 테스트 구현
        });

        test('POST /api/ai-tutor/conversations should create new conversation', async () => {
            // 테스트 구현
        });

        test('DELETE /api/ai-tutor/conversations/:id should delete conversation', async () => {
            // 테스트 구현
        });
    });
});
```

### 2. RAG 파이프라인 테스트

```javascript
// S3_개발-2차/Testing/rag-pipeline.test.js

describe('RAG Pipeline Tests', () => {
    test('should generate embeddings for text', async () => {
        // Gemini 임베딩 생성 테스트
    });

    test('should find relevant documents for query', async () => {
        // 벡터 유사도 검색 테스트
    });

    test('should build correct prompt with context', async () => {
        // 프롬프트 빌더 테스트
    });

    test('should chunk text correctly', async () => {
        // 청킹 로직 테스트
        const { chunkText } = require('../Backend_Infra/rag/chunker');
        const text = 'A'.repeat(2500);
        const chunks = chunkText(text, 1000, 200);

        expect(chunks.length).toBe(3);
        expect(chunks[0].length).toBe(1000);
    });
});
```

### 3. E2E 테스트 (Playwright)

```javascript
// S3_개발-2차/Testing/ai-tutor-e2e.test.js

const { test, expect } = require('@playwright/test');

test.describe('AI Tutor E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // 로그인
        await page.goto('/');
        await page.click('#login-button');
        // ... 로그인 로직
    });

    test('should open AI Tutor modal', async ({ page }) => {
        await page.click('#ai-tutor-btn');
        await expect(page.locator('#ai-tutor-modal')).toBeVisible();
    });

    test('should send message and receive streaming response', async ({ page }) => {
        await page.click('#ai-tutor-btn');
        await page.fill('#ai-tutor-input', 'SSAL Works란 무엇인가요?');
        await page.click('#ai-tutor-send');

        // 스트리밍 응답 확인
        await expect(page.locator('.message.assistant')).toBeVisible();
        await expect(page.locator('.message.assistant .content')).not.toBeEmpty();
    });

    test('should show sources after response', async ({ page }) => {
        await page.click('#ai-tutor-btn');
        await page.fill('#ai-tutor-input', '프로젝트 등록 방법은?');
        await page.click('#ai-tutor-send');

        // 소스 표시 확인
        await expect(page.locator('.message.assistant .sources')).toBeVisible();
    });

    test('should create and list conversations', async ({ page }) => {
        await page.click('#ai-tutor-btn');
        await page.fill('#ai-tutor-input', '테스트 질문입니다');
        await page.click('#ai-tutor-send');

        // 대화 목록 확인
        await page.click('#ai-tutor-sidebar-toggle');
        await expect(page.locator('#ai-tutor-conversation-list .conversation-item')).toHaveCount(1);
    });

    test('should deduct credits after question', async ({ page }) => {
        const initialCredits = await page.locator('#ai-tutor-credits').textContent();

        await page.click('#ai-tutor-btn');
        await page.fill('#ai-tutor-input', '크레딧 테스트');
        await page.click('#ai-tutor-send');

        // 크레딧 차감 확인
        await page.waitForTimeout(3000);
        const finalCredits = await page.locator('#ai-tutor-credits').textContent();
        expect(parseInt(finalCredits)).toBeLessThan(parseInt(initialCredits));
    });
});
```

### 4. 크레딧 차감 검증

```javascript
// S3_개발-2차/Testing/credit-deduction.test.js

describe('Credit Deduction Tests', () => {
    test('should deduct 1 credit per question', async () => {
        // 1. 초기 크레딧 확인
        // 2. 질문 전송
        // 3. 크레딧 1 감소 확인
    });

    test('should reject question when credits are 0', async () => {
        // 크레딧 0일 때 402 에러 확인
    });

    test('should not deduct credits on API error', async () => {
        // API 에러 시 크레딧 유지 확인
    });
});
```

### 5. 모바일 반응형 테스트

```javascript
// S3_개발-2차/Testing/ai-tutor-mobile.test.js

test.describe('AI Tutor Mobile Tests', () => {
    test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

    test('should display full-width modal on mobile', async ({ page }) => {
        await page.goto('/');
        await page.click('#ai-tutor-btn');

        const modal = page.locator('#ai-tutor-modal');
        const box = await modal.boundingBox();
        expect(box.width).toBe(375);
    });

    test('should have responsive input area', async ({ page }) => {
        await page.goto('/');
        await page.click('#ai-tutor-btn');

        await expect(page.locator('.ai-tutor-input-area')).toBeVisible();
    });
});
```

## Expected Output Files
- `S3_개발-2차/Testing/ai-tutor-api.test.js`
- `S3_개발-2차/Testing/rag-pipeline.test.js`
- `S3_개발-2차/Testing/ai-tutor-e2e.test.js`
- `S3_개발-2차/Testing/credit-deduction.test.js`
- `S3_개발-2차/Testing/ai-tutor-mobile.test.js`

## Completion Criteria
- [ ] API 단위 테스트 작성 및 통과
- [ ] RAG 파이프라인 테스트 통과
- [ ] E2E 테스트 (메시지 전송, 스트리밍, 대화 관리) 통과
- [ ] 크레딧 차감 검증 통과
- [ ] 모바일 반응형 테스트 통과
- [ ] 에러 핸들링 테스트 통과

## Tech Stack
- Jest (API 테스트)
- Playwright (E2E 테스트)
- Supabase Test Client

## Task Agent
`test-engineer`

## Verification Agent
`qa-specialist`

## Execution Type
AI-Only

## Remarks
- 모든 테스트는 실제 Gemini API 호출 포함 (테스트 환경에서)
- Rate limit 테스트는 실제 제한 확인
- 크레딧 차감은 테스트 계정으로 검증
- Stage Gate 통과 전 모든 테스트 통과 필수
