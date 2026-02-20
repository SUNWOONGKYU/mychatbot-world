# Task Instruction - S3BA1

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
S3BA1

## Task Name
AI Q&A API

## Task Goal
학습 콘텐츠 기반 AI 질의응답 API 구현 (Gemini, ChatGPT, Perplexity 3개 서비스 지원)

## Prerequisites (Dependencies)
- S3BI1 (AI API 클라이언트 통합) 완료
- S2C1 (학습용 콘텐츠 시스템 정비) 완료

## Specific Instructions

### 1. Q&A API 엔드포인트 생성
- 위치: api/ai/qa.js

```javascript
// api/ai/qa.js
const { sendMessage } = require('../lib/ai');
const { checkUsageLimit } = require('../lib/ai/usage-limiter');
const { withAuth } = require('../lib/auth/withAuth');

module.exports = withAuth(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, provider, context } = req.body;
  const user = req.user;

  // provider 검증 (gemini, chatgpt, perplexity 중 하나)
  const validProviders = ['gemini', 'chatgpt', 'perplexity'];
  if (!validProviders.includes(provider)) {
    return res.status(400).json({ 
      error: 'Invalid provider',
      validProviders 
    });
  }

  // 사용량 제한 체크
  const usageStatus = await checkUsageLimit(user.id, user.plan_type);
  if (usageStatus.exceeded) {
    return res.status(429).json({
      error: 'Daily usage limit exceeded',
      usage: usageStatus
    });
  }

  // 시스템 프롬프트 구성
  const systemPrompt = `당신은 SSALWorks의 AI 튜터입니다.
사용자가 학습 콘텐츠에 대해 질문하면 친절하고 정확하게 답변해주세요.
${context ? `참고 콘텐츠:\n${context}` : ''}`;

  try {
    const result = await sendMessage(provider, question, {
      systemPrompt,
      maxTokens: 2048
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(200).json({
      answer: result.content,
      provider: result.provider,
      usage: result.usage
    });
  } catch (error) {
    res.status(500).json({ error: 'AI service error' });
  }
});
```

### 2. AI 사용량 조회 API
```javascript
// api/ai/usage.js
// 사용자의 AI 사용량 조회
```

### 3. FAQ 유사 질문 제안 API
```javascript
// api/ai/faq-suggest.js
// FAQ에서 유사한 질문 검색 (AI 사용 없이 키워드 매칭)
```

## Expected Output Files
- api/ai/qa.js
- api/ai/usage.js
- api/ai/faq-suggest.js
- api/ai/index.js

## Completion Criteria
- [ ] Q&A API 엔드포인트 구현
- [ ] 3개 AI 서비스 선택 지원 (gemini, chatgpt, perplexity)
- [ ] 시스템 프롬프트 구성
- [ ] 콘텐츠 컨텍스트 로딩 구현
- [ ] 사용량 제한 연동
- [ ] API 테스트 완료

## Tech Stack
- Vercel Serverless Functions
- Google Gemini API
- OpenAI ChatGPT API
- Perplexity API
- Supabase

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Execution Type
AI-Only

## Remarks
- 사용자가 프론트엔드에서 AI 서비스 선택 가능
- Free 사용자는 AI 기능 사용 불가
- Basic/Premium 사용자만 사용 가능
