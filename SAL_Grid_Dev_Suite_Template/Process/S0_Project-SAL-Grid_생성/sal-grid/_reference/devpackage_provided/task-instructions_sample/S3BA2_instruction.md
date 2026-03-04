# Task Instruction - S3BA2

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S3BA2

## Task Name
AI 가격 조회 API

## Task Goal
Gemini, ChatGPT, Perplexity AI 서비스의 실시간 가격 정보 조회 API 구현

## Prerequisites (Dependencies)
- S3BI1 (AI API 클라이언트 통합) 완료

## Specific Instructions

### 1. AI 가격 조회 API
- 위치: `api/ai/pricing.js`

```javascript
// api/ai/pricing.js
/**
 * @task S3BA2
 * AI 서비스 가격 조회 API
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 기본 가격 (DB에 없을 경우 사용)
const DEFAULT_PRICING = {
    gemini: {
        name: 'Gemini Pro',
        price_per_query: 100,  // 원
        description: 'Google의 최신 AI 모델',
        features: ['빠른 응답', '한국어 최적화', '다중 턴 대화']
    },
    chatgpt: {
        name: 'ChatGPT-4',
        price_per_query: 150,
        description: 'OpenAI의 고급 AI 모델',
        features: ['높은 정확도', '코드 작성', '창의적 글쓰기']
    },
    perplexity: {
        name: 'Perplexity',
        price_per_query: 120,
        description: '실시간 검색 기반 AI',
        features: ['최신 정보', '출처 제공', '팩트 체크']
    }
};

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 캐시 헤더 설정 (5분)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    try {
        // DB에서 가격 정보 조회
        const { data: dbPricing, error } = await supabase
            .from('ai_pricing')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error('DB pricing fetch error:', error);
        }

        // DB 데이터와 기본값 병합
        const pricing = {};

        for (const [key, defaultValue] of Object.entries(DEFAULT_PRICING)) {
            const dbData = dbPricing?.find(p => p.service_name === key);

            pricing[key] = {
                name: dbData?.display_name || defaultValue.name,
                price: dbData?.price_per_query || defaultValue.price_per_query,
                description: dbData?.description || defaultValue.description,
                features: dbData?.features || defaultValue.features,
                is_available: dbData?.is_available ?? true
            };
        }

        return res.status(200).json({
            success: true,
            pricing,
            currency: 'KRW',
            updated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Pricing API error:', error);

        // 에러 시에도 기본 가격 반환
        const fallbackPricing = {};
        for (const [key, value] of Object.entries(DEFAULT_PRICING)) {
            fallbackPricing[key] = {
                name: value.name,
                price: value.price_per_query,
                description: value.description,
                features: value.features,
                is_available: true
            };
        }

        return res.status(200).json({
            success: true,
            pricing: fallbackPricing,
            currency: 'KRW',
            updated_at: new Date().toISOString(),
            _fallback: true
        });
    }
}
```

### 2. 가격 관리 유틸리티
- 위치: `api/lib/pricing-utils.js`

```javascript
// api/lib/pricing-utils.js
/**
 * @task S3BA2
 * AI 가격 계산 유틸리티
 */

// 모델별 토큰 가격 (원/1K 토큰)
const TOKEN_PRICING = {
    gemini: {
        input: 0.5,
        output: 1.5
    },
    chatgpt: {
        input: 3.0,
        output: 6.0
    },
    perplexity: {
        input: 0.2,
        output: 1.0
    }
};

/**
 * 질문/답변 기반 비용 계산 (토큰 추정)
 */
export function estimateCost(model, inputText, outputText) {
    const pricing = TOKEN_PRICING[model];
    if (!pricing) return 0;

    // 대략적인 토큰 추정 (한글 기준 1자 ≈ 2토큰)
    const inputTokens = Math.ceil(inputText.length * 2 / 1000);
    const outputTokens = Math.ceil(outputText.length * 2 / 1000);

    const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);

    return Math.ceil(cost);  // 원 단위 올림
}

/**
 * 고정 가격 (질문당)
 */
export function getFixedPrice(model) {
    const prices = {
        gemini: 100,
        chatgpt: 150,
        perplexity: 120
    };

    return prices[model] || 100;
}

/**
 * 크레딧 충분 여부 확인
 */
export function hasEnoughCredit(userCredit, model) {
    const requiredCredit = getFixedPrice(model);
    return userCredit >= requiredCredit;
}

/**
 * 할인 적용
 */
export function applyDiscount(basePrice, discountPercent) {
    if (!discountPercent || discountPercent <= 0) return basePrice;
    return Math.ceil(basePrice * (1 - discountPercent / 100));
}
```

### 3. 가격 정보 테이블 스키마 (참고)
```sql
-- ai_pricing 테이블 (S4D1에서 생성)
CREATE TABLE ai_pricing (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL UNIQUE, -- 'gemini', 'chatgpt', 'perplexity'
    display_name VARCHAR(100) NOT NULL,
    price_per_query INTEGER NOT NULL, -- 원 단위
    description TEXT,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 초기 데이터
INSERT INTO ai_pricing (service_name, display_name, price_per_query, description, features)
VALUES
    ('gemini', 'Gemini Pro', 100, 'Google의 최신 AI 모델', '["빠른 응답", "한국어 최적화", "다중 턴 대화"]'),
    ('chatgpt', 'ChatGPT-4', 150, 'OpenAI의 고급 AI 모델', '["높은 정확도", "코드 작성", "창의적 글쓰기"]'),
    ('perplexity', 'Perplexity', 120, '실시간 검색 기반 AI', '["최신 정보", "출처 제공", "팩트 체크"]');
```

## Expected Output Files
- `api/ai/pricing.js`
- `api/lib/pricing-utils.js`

## Completion Criteria
- [ ] GET /api/ai/pricing 엔드포인트 구현
- [ ] DB 기반 가격 조회
- [ ] 기본값 폴백 처리
- [ ] 캐시 헤더 설정
- [ ] 가격 계산 유틸리티 함수
- [ ] 크레딧 검증 함수

## Tech Stack
- Vercel Serverless Functions
- Supabase
- JavaScript (ES6+)

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Tools
- supabase-js SDK

## Execution Type
AI-Only

## Remarks
- 가격은 DB에서 동적 관리 가능
- 캐시를 통해 DB 부하 감소
- 에러 시에도 기본값 반환하여 서비스 유지

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
