# Task Instruction - S3BI2

---

## 필수 참조 규칙 파일 (2026-01-04)

> **작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## Task ID
S3BI2

## Task Name
RAG 파이프라인 구축

## Task Goal
Gemini 임베딩을 사용한 RAG (Retrieval-Augmented Generation) 파이프라인 구축 및 225개 MD 파일 임베딩 생성

## Prerequisites (Dependencies)
- S3D1 (AI 튜터 DB 스키마) 완료
- S3E1 (AI API 키 설정) 완료

## Specific Instructions

### 1. RAG 유틸리티 모듈 생성

#### 1-1. 텍스트 청킹 모듈
```javascript
// S3_개발-2차/Backend_Infra/rag/chunker.js

/**
 * 텍스트를 지정된 크기의 청크로 분할
 * @param {string} text - 분할할 텍스트
 * @param {number} chunkSize - 청크 크기 (기본 1000자)
 * @param {number} overlap - 오버랩 크기 (기본 200자)
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start = end - overlap;
        if (start + overlap >= text.length) break;
    }

    return chunks;
}

module.exports = { chunkText };
```

#### 1-2. 임베딩 모듈
```javascript
// S3_개발-2차/Backend_Infra/rag/embeddings.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gemini 임베딩 생성 (768차원, 무료)
 */
async function generateEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

/**
 * 벡터 유사도 검색
 */
async function searchSimilarContent(supabase, queryEmbedding, options = {}) {
    const { matchThreshold = 0.5, matchCount = 5 } = options;

    const { data, error } = await supabase.rpc('search_content', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount
    });

    if (error) throw error;
    return data;
}

module.exports = { generateEmbedding, searchSimilarContent };
```

#### 1-3. 프롬프트 빌더
```javascript
// S3_개발-2차/Backend_Infra/rag/prompt-builder.js

const SYSTEM_PROMPT = `당신은 SSAL Works의 AI 튜터입니다.
SSAL Works의 학습 콘텐츠를 기반으로 사용자의 질문에 답변합니다.

규칙:
1. 제공된 컨텍스트 문서를 기반으로 답변하세요.
2. 컨텍스트에 없는 내용은 "해당 내용은 학습 자료에서 찾을 수 없습니다"라고 안내하세요.
3. 답변은 친절하고 명확하게 작성하세요.
4. 필요시 예시나 비유를 사용하세요.`;

function buildPrompt(question, contextDocs) {
    const context = contextDocs
        .map((doc, i) => `[문서 ${i + 1}: ${doc.title}]\n${doc.content}`)
        .join('\n\n---\n\n');

    return {
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `## 참조 문서\n${context}\n\n## 질문\n${question}`,
        sources: contextDocs.map(doc => ({
            content_id: doc.content_id,
            title: doc.title,
            similarity: doc.similarity
        }))
    };
}

module.exports = { buildPrompt, SYSTEM_PROMPT };
```

#### 1-4. RAG 파이프라인 메인
```javascript
// S3_개발-2차/Backend_Infra/rag/index.js
const { generateEmbedding, searchSimilarContent } = require('./embeddings');
const { buildPrompt } = require('./prompt-builder');

async function ragPipeline(supabase, question) {
    // 1. 질문 임베딩 생성
    const queryEmbedding = await generateEmbedding(question);

    // 2. 유사 문서 검색
    const similarDocs = await searchSimilarContent(supabase, queryEmbedding, {
        matchThreshold: 0.5,
        matchCount: 5
    });

    // 3. 프롬프트 구성
    const { systemPrompt, userPrompt, sources } = buildPrompt(question, similarDocs);

    return {
        systemPrompt,
        userPrompt,
        sources,
        contextCount: similarDocs.length
    };
}

module.exports = { ragPipeline };
```

### 2. 임베딩 생성 스크립트

```javascript
// scripts/generate-embeddings.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chunkText } = require('../api/Backend_Infra/rag/chunker');

// 설정
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 콘텐츠 경로
const CONTENT_PATHS = {
    tips: '부수적_고유기능/콘텐츠/Tips',
    books: '부수적_고유기능/콘텐츠/Books',
    guides: 'Briefings_OrderSheets/Briefings',
    briefings: 'Briefings_OrderSheets/Briefings'
};

async function generateEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

async function processFile(filePath, contentType) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');

    // 제목 추출 (첫 번째 # 라인)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : fileName;

    // 청킹
    const chunks = chunkText(content, 1000, 200);

    // 각 청크 임베딩 및 저장
    for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);

        await supabase.from('content_embeddings').insert({
            content_type: contentType,
            content_id: fileName,
            chunk_index: i,
            title: title,
            content: chunks[i],
            embedding: embedding,
            metadata: { file_path: filePath }
        });

        console.log(`Processed: ${fileName} chunk ${i + 1}/${chunks.length}`);

        // Rate limiting (Gemini 무료 티어)
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

async function main() {
    console.log('Starting embedding generation...');

    for (const [type, basePath] of Object.entries(CONTENT_PATHS)) {
        const fullPath = path.join(process.cwd(), basePath);
        if (!fs.existsSync(fullPath)) continue;

        const files = fs.readdirSync(fullPath)
            .filter(f => f.endsWith('.md'))
            .map(f => path.join(fullPath, f));

        for (const file of files) {
            await processFile(file, type);
        }
    }

    console.log('Embedding generation complete!');
}

main().catch(console.error);
```

## Expected Output Files
- `S3_개발-2차/Backend_Infra/rag/index.js`
- `S3_개발-2차/Backend_Infra/rag/embeddings.js`
- `S3_개발-2차/Backend_Infra/rag/chunker.js`
- `S3_개발-2차/Backend_Infra/rag/prompt-builder.js`
- `scripts/generate-embeddings.js`

## Completion Criteria
- [ ] 텍스트 청킹 모듈 구현 (1000자/200자 오버랩)
- [ ] Gemini 임베딩 생성 함수 구현
- [ ] 벡터 유사도 검색 함수 구현
- [ ] 프롬프트 빌더 구현
- [ ] RAG 파이프라인 메인 모듈 구현
- [ ] 임베딩 생성 스크립트 구현
- [ ] 225개 MD 파일 임베딩 생성 완료

## Tech Stack
- Gemini Embedding API (768차원, 무료)
- Supabase pgvector
- Node.js

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Execution Type
AI-Only

## Remarks
- Gemini 임베딩은 무료 (Rate limit 주의)
- 약 675개 청크 예상 (225 파일 × 평균 3 청크)
- 임베딩 생성은 1회성 작업 (콘텐츠 변경 시 재실행)
