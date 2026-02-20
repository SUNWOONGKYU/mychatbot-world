# Task Instruction - S3BA3

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
S3BA3

## Task Name
AI 튜터 API 개발

## Task Goal
RAG 기반 AI 튜터 채팅 API 및 대화 관리 API 개발 (SSE 스트리밍 지원)

## Prerequisites (Dependencies)
- S3BI2 (RAG 파이프라인 구축) 완료
- S3D1 (AI 튜터 DB 스키마) 완료

## Specific Instructions

### 1. AI 튜터 채팅 API

```javascript
// S3_개발-2차/External/ai-tutor-chat.js
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ragPipeline } = require('../Backend_Infra/rag');
const { checkRateLimit } = require('../Backend_Infra/rate-limiter');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, conversationId } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Rate limiting (30 req/min)
    const rateLimitOk = await checkRateLimit(user.id, 'ai-tutor', 30);
    if (!rateLimitOk) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    // 크레딧 확인 및 차감
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credit_balance')
        .eq('id', user.id)
        .single();

    if (userError || userData.credit_balance < 1) {
        return res.status(402).json({ error: 'Insufficient credits' });
    }

    try {
        // RAG 파이프라인 실행
        const { systemPrompt, userPrompt, sources } = await ragPipeline(supabase, message);

        // SSE 헤더 설정
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Gemini 스트리밍 응답
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const chat = model.startChat({
            history: [],
            generationConfig: { maxOutputTokens: 2048 }
        });

        const result = await chat.sendMessageStream([
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'user', parts: [{ text: userPrompt }] }
        ]);

        let fullResponse = '';

        for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ type: 'content', text })}\n\n`);
        }

        // 소스 정보 전송
        res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

        // 대화 저장
        let convId = conversationId;
        if (!convId) {
            // 새 대화 생성
            const { data: newConv } = await supabase
                .from('tutor_conversations')
                .insert({ user_id: user.id, title: message.slice(0, 50) })
                .select()
                .single();
            convId = newConv.id;
        }

        // 메시지 저장 (사용자 + AI)
        await supabase.from('tutor_messages').insert([
            { conversation_id: convId, role: 'user', content: message },
            { conversation_id: convId, role: 'assistant', content: fullResponse, sources }
        ]);

        // 크레딧 차감
        await supabase.rpc('decrement_credit', { user_id: user.id, amount: 1 });

        // 완료 신호
        res.write(`data: ${JSON.stringify({ type: 'done', conversationId: convId })}\n\n`);
        res.end();

    } catch (error) {
        console.error('AI Tutor error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
};
```

### 2. 대화 관리 API

```javascript
// S3_개발-2차/External/ai-tutor-conversations.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    switch (req.method) {
        case 'GET': {
            // 대화 목록 조회
            const { id } = req.query;

            if (id) {
                // 특정 대화 + 메시지
                const { data: conversation } = await supabase
                    .from('tutor_conversations')
                    .select('*, tutor_messages(*)')
                    .eq('id', id)
                    .single();
                return res.json(conversation);
            } else {
                // 대화 목록
                const { data: conversations } = await supabase
                    .from('tutor_conversations')
                    .select('id, title, created_at, updated_at')
                    .order('updated_at', { ascending: false });
                return res.json(conversations);
            }
        }

        case 'POST': {
            // 새 대화 생성
            const { title } = req.body;
            const { data, error } = await supabase
                .from('tutor_conversations')
                .insert({ user_id: user.id, title: title || '새 대화' })
                .select()
                .single();

            if (error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(201).json(data);
        }

        case 'DELETE': {
            // 대화 삭제
            const { id } = req.query;
            const { error } = await supabase
                .from('tutor_conversations')
                .delete()
                .eq('id', id);

            if (error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(204).end();
        }

        case 'PATCH': {
            // 대화 제목 수정
            const { id } = req.query;
            const { title } = req.body;
            const { data, error } = await supabase
                .from('tutor_conversations')
                .update({ title, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return res.status(400).json({ error: error.message });
            }
            return res.json(data);
        }

        default:
            return res.status(405).json({ error: 'Method not allowed' });
    }
};
```

### 3. vercel.json 라우트 추가

```json
{
    "rewrites": [
        { "source": "/api/ai-tutor/chat", "destination": "/api/External/ai-tutor-chat" },
        { "source": "/api/ai-tutor/conversations", "destination": "/api/External/ai-tutor-conversations" },
        { "source": "/api/ai-tutor/conversations/:id", "destination": "/api/External/ai-tutor-conversations?id=:id" }
    ]
}
```

### 4. gemini-client.js 스트리밍 메서드 추가

```javascript
// api/Backend_Infra/ai/gemini-client.js에 추가
async function sendGeminiMessageStream(systemPrompt, userMessage) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContentStream([
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: userMessage }] }
    ]);

    return result.stream;
}

module.exports = { sendGeminiMessage, sendGeminiMessageStream };
```

## Expected Output Files
- `S3_개발-2차/External/ai-tutor-chat.js`
- `S3_개발-2차/External/ai-tutor-conversations.js`
- `vercel.json` (수정)
- `api/Backend_Infra/ai/gemini-client.js` (수정)

## Completion Criteria
- [ ] 채팅 API 구현 (RAG + SSE 스트리밍)
- [ ] 대화 목록 조회 API 구현
- [ ] 대화 상세 조회 API 구현
- [ ] 대화 생성 API 구현
- [ ] 대화 삭제 API 구현
- [ ] 크레딧 차감 로직 구현
- [ ] Rate limiting 적용
- [ ] vercel.json 라우트 추가

## Tech Stack
- Vercel Serverless Functions
- Gemini 1.5 Flash
- Supabase
- SSE (Server-Sent Events)

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Execution Type
AI-Only

## Remarks
- SSE로 실시간 스트리밍 응답
- 크레딧 1개/질문 차감 (Gemini 고정)
- Rate limit: 30 requests/minute
- 대화 히스토리는 DB에 저장하여 여러 기기에서 이어서 대화 가능
