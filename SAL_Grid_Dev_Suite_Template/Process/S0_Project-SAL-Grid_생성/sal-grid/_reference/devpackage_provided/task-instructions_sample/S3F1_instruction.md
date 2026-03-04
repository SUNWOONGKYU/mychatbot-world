# Task Instruction - S3F1

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
S3F1

## Task Name
AI Q&A 인터페이스

## Task Goal
Gemini/ChatGPT/Perplexity AI 선택, 질문 입력, 답변 표시, 크레딧 차감을 위한 사용자 인터페이스 구현

## Prerequisites (Dependencies)
- S3BA1 (AI Q&A API) 완료

## Specific Instructions

### 1. AI Q&A 페이지 구현
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/ai/qa.html`

```html
<!-- pages/ai/qa.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Q&A - SSALWorks</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../ai-qa.css">
</head>
<body>
    <nav class="top-nav">
        <!-- 기존 네비게이션 -->
    </nav>

    <main class="qa-container">
        <!-- AI 선택 영역 -->
        <div class="ai-selector">
            <h2>AI 모델 선택</h2>
            <div class="ai-options">
                <button class="ai-option selected" data-ai="gemini">
                    <span class="ai-icon">🌟</span>
                    <span class="ai-name">Gemini</span>
                    <span class="ai-price" id="gemini-price">-</span>
                </button>
                <button class="ai-option" data-ai="chatgpt">
                    <span class="ai-icon">🤖</span>
                    <span class="ai-name">ChatGPT</span>
                    <span class="ai-price" id="chatgpt-price">-</span>
                </button>
                <button class="ai-option" data-ai="perplexity">
                    <span class="ai-icon">🔍</span>
                    <span class="ai-name">Perplexity</span>
                    <span class="ai-price" id="perplexity-price">-</span>
                </button>
            </div>
        </div>

        <!-- 크레딧 정보 -->
        <div class="credit-info">
            <span>보유 크레딧:</span>
            <span id="user-credit">0</span>
            <a href="/pages/subscription/credit-purchase.html" class="credit-link">충전하기</a>
        </div>

        <!-- 대화 영역 -->
        <div class="chat-area" id="chat-area">
            <!-- 대화 메시지들 -->
        </div>

        <!-- 입력 영역 -->
        <div class="input-area">
            <textarea
                id="question-input"
                placeholder="AI에게 질문하세요..."
                rows="3"
            ></textarea>
            <button id="send-button" class="btn-send">
                <span>전송</span>
                <span class="send-icon">➤</span>
            </button>
        </div>
    </main>

    <script type="module" src="../../ai-qa.js"></script>
</body>
</html>
```

### 2. AI Q&A JavaScript
- 위치: `P3_프로토타입_제작/Frontend/Prototype/ai-qa.js`

```javascript
// ai-qa.js
/**
 * @task S3F1
 * AI Q&A 인터페이스 로직
 */

let selectedAI = 'gemini';
let userCredit = 0;
const chatHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserCredit();
    await loadAIPricing();
    setupEventListeners();
});

async function loadUserCredit() {
    try {
        const response = await fetch('/api/user/credit', {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        userCredit = data.credit || 0;
        document.getElementById('user-credit').textContent = userCredit.toLocaleString();
    } catch (error) {
        console.error('크레딧 로드 실패:', error);
    }
}

async function loadAIPricing() {
    try {
        const response = await fetch('/api/ai/pricing');
        const data = await response.json();

        document.getElementById('gemini-price').textContent = `${data.gemini}원/질문`;
        document.getElementById('chatgpt-price').textContent = `${data.chatgpt}원/질문`;
        document.getElementById('perplexity-price').textContent = `${data.perplexity}원/질문`;
    } catch (error) {
        console.error('가격 정보 로드 실패:', error);
    }
}

function setupEventListeners() {
    // AI 선택 버튼
    document.querySelectorAll('.ai-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.ai-option.selected')?.classList.remove('selected');
            btn.classList.add('selected');
            selectedAI = btn.dataset.ai;
        });
    });

    // 전송 버튼
    document.getElementById('send-button').addEventListener('click', sendQuestion);

    // Enter 키 전송 (Shift+Enter는 줄바꿈)
    document.getElementById('question-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuestion();
        }
    });
}

async function sendQuestion() {
    const input = document.getElementById('question-input');
    const question = input.value.trim();

    if (!question) return;

    // 사용자 메시지 표시
    addMessage('user', question);
    input.value = '';

    // 로딩 표시
    const loadingId = addMessage('ai', '답변 생성 중...', true);

    try {
        const response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({
                question,
                aiModel: selectedAI
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'AI 응답 실패');
        }

        const data = await response.json();

        // 로딩 메시지 제거 후 실제 답변 표시
        removeMessage(loadingId);
        addMessage('ai', data.answer, false, selectedAI);

        // 크레딧 업데이트
        userCredit = data.remainingCredit;
        document.getElementById('user-credit').textContent = userCredit.toLocaleString();

    } catch (error) {
        removeMessage(loadingId);
        addMessage('error', error.message);
    }
}

function addMessage(type, content, isLoading = false, aiModel = null) {
    const chatArea = document.getElementById('chat-area');
    const messageId = `msg-${Date.now()}`;

    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `message ${type}`;

    if (isLoading) {
        messageDiv.classList.add('loading');
    }

    if (aiModel) {
        messageDiv.dataset.ai = aiModel;
    }

    messageDiv.innerHTML = `
        <div class="message-content">
            ${type === 'ai' ? `<span class="ai-badge">${getAIName(aiModel)}</span>` : ''}
            <div class="message-text">${formatMessage(content)}</div>
        </div>
    `;

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    return messageId;
}

function removeMessage(messageId) {
    document.getElementById(messageId)?.remove();
}

function formatMessage(content) {
    // 마크다운 간단 변환 (코드 블록, 볼드 등)
    return content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function getAIName(model) {
    const names = {
        gemini: '🌟 Gemini',
        chatgpt: '🤖 ChatGPT',
        perplexity: '🔍 Perplexity'
    };
    return names[model] || model;
}

function getAccessToken() {
    return localStorage.getItem('accessToken') || '';
}
```

### 3. AI Q&A CSS
- 위치: `P3_프로토타입_제작/Frontend/Prototype/ai-qa.css`

```css
/* ai-qa.css */
/**
 * @task S3F1
 */

.qa-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px);
}

/* AI 선택 영역 */
.ai-selector {
    margin-bottom: 1rem;
}

.ai-options {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.ai-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
}

.ai-option:hover {
    border-color: #3182ce;
}

.ai-option.selected {
    border-color: #3182ce;
    background: #ebf8ff;
}

.ai-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.ai-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.ai-price {
    font-size: 0.8rem;
    color: #718096;
}

/* 크레딧 정보 */
.credit-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #f7fafc;
    border-radius: 8px;
    margin-bottom: 1rem;
}

#user-credit {
    font-weight: 700;
    color: #3182ce;
}

.credit-link {
    margin-left: auto;
    color: #3182ce;
    text-decoration: none;
}

/* 대화 영역 */
.chat-area {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 12px;
    margin-bottom: 1rem;
}

.message {
    margin-bottom: 1rem;
    display: flex;
}

.message.user {
    justify-content: flex-end;
}

.message.user .message-content {
    background: #3182ce;
    color: white;
    border-radius: 18px 18px 4px 18px;
}

.message.ai .message-content {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px 18px 18px 4px;
}

.message.error .message-content {
    background: #fed7d7;
    color: #822727;
    border-radius: 8px;
}

.message-content {
    max-width: 70%;
    padding: 1rem;
}

.ai-badge {
    display: inline-block;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: #edf2f7;
    border-radius: 4px;
    margin-bottom: 0.5rem;
}

.message-text {
    line-height: 1.6;
}

.message-text pre {
    background: #1a202c;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
}

.message-text code {
    background: #edf2f7;
    padding: 0.125rem 0.25rem;
    border-radius: 4px;
    font-family: monospace;
}

.message.loading .message-text::after {
    content: '';
    animation: dots 1.5s infinite;
}

@keyframes dots {
    0%, 20% { content: '.'; }
    40% { content: '..'; }
    60%, 100% { content: '...'; }
}

/* 입력 영역 */
.input-area {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
}

#question-input {
    flex: 1;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    resize: none;
    font-size: 1rem;
}

#question-input:focus {
    outline: none;
    border-color: #3182ce;
}

.btn-send {
    padding: 1rem 1.5rem;
    background: #3182ce;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-send:hover {
    background: #2c5282;
}

.btn-send:disabled {
    background: #a0aec0;
    cursor: not-allowed;
}
```

## Expected Output Files
- `P3_프로토타입_제작/Frontend/Prototype/pages/ai/qa.html`
- `P3_프로토타입_제작/Frontend/Prototype/ai-qa.js`
- `P3_프로토타입_제작/Frontend/Prototype/ai-qa.css`

## Completion Criteria
- [ ] AI 모델 선택 UI (Gemini, ChatGPT, Perplexity)
- [ ] 크레딧 잔액 표시
- [ ] 질문 입력 및 전송
- [ ] AI 답변 표시 (마크다운 지원)
- [ ] 실시간 가격 정보 표시
- [ ] 로딩 상태 표시
- [ ] 에러 처리 및 표시
- [ ] 모바일 반응형 디자인

## Tech Stack
- HTML/CSS/JavaScript

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Tools
- S3BA1 (AI Q&A API) 연동

## Execution Type
AI-Only

## Remarks
- 크레딧 부족 시 충전 페이지로 안내
- 대화 기록은 로컬에서만 유지 (새로고침 시 초기화)
- 향후 대화 저장 기능 추가 가능

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
