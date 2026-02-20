# Task Instruction - S3F2

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
S3F2

## Task Name
AI 튜터 UI 개발

## Task Goal
기존 iframe 기반 AI 튜터를 제거하고, 자체 채팅 UI로 교체 (스트리밍 렌더링 + 대화 히스토리)

## Prerequisites (Dependencies)
- S3BA3 (AI 튜터 API 개발) 완료

## Specific Instructions

### 1. 기존 iframe 제거

**수정 위치:** `index.html` 라인 929-954, 5096-5165

```html
<!-- 기존 (제거 대상) -->
<div id="ai-tutor-popup" class="ai-tutor-popup">
    <iframe src="https://aitalker.co.kr/..." ...></iframe>
</div>
```

### 2. 새 AI 튜터 모달 구현

```html
<!-- AI 튜터 모달 -->
<div id="ai-tutor-modal" class="ai-tutor-modal hidden">
    <div class="ai-tutor-container">
        <!-- 헤더 -->
        <div class="ai-tutor-header">
            <button id="ai-tutor-sidebar-toggle" class="sidebar-toggle-btn">
                <svg><!-- 메뉴 아이콘 --></svg>
            </button>
            <h3>AI 튜터</h3>
            <div class="ai-tutor-header-actions">
                <button id="ai-tutor-new-chat" class="new-chat-btn">새 대화</button>
                <span id="ai-tutor-credits" class="credits-display">0 크레딧</span>
                <button id="ai-tutor-close" class="close-btn">&times;</button>
            </div>
        </div>

        <!-- 사이드바 (대화 히스토리) -->
        <div id="ai-tutor-sidebar" class="ai-tutor-sidebar hidden">
            <div class="sidebar-header">
                <h4>대화 목록</h4>
            </div>
            <div id="ai-tutor-conversation-list" class="conversation-list">
                <!-- 동적 생성 -->
            </div>
        </div>

        <!-- 메시지 영역 -->
        <div id="ai-tutor-messages" class="ai-tutor-messages">
            <div class="welcome-message">
                <h4>SSAL Works AI 튜터</h4>
                <p>학습 콘텐츠에 대해 무엇이든 물어보세요!</p>
            </div>
        </div>

        <!-- 입력 영역 -->
        <div class="ai-tutor-input-area">
            <textarea
                id="ai-tutor-input"
                placeholder="질문을 입력하세요..."
                rows="1"
            ></textarea>
            <button id="ai-tutor-send" class="send-btn">
                <svg><!-- 전송 아이콘 --></svg>
            </button>
        </div>
    </div>
</div>
```

### 3. CSS 스타일

```css
/* AI 튜터 모달 스타일 */
.ai-tutor-modal {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    background: white;
    box-shadow: -2px 0 10px rgba(0,0,0,0.1);
    z-index: 1000;
    display: flex;
    flex-direction: column;
}

.ai-tutor-modal.hidden {
    display: none;
}

.ai-tutor-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    gap: 12px;
}

.ai-tutor-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.message {
    margin-bottom: 16px;
    max-width: 85%;
}

.message.user {
    margin-left: auto;
    background: #3b82f6;
    color: white;
    border-radius: 12px 12px 0 12px;
    padding: 12px;
}

.message.assistant {
    background: #f3f4f6;
    border-radius: 12px 12px 12px 0;
    padding: 12px;
}

.message.assistant .sources {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
    font-size: 12px;
    color: #6b7280;
}

.ai-tutor-input-area {
    display: flex;
    padding: 12px;
    border-top: 1px solid #e5e7eb;
    gap: 8px;
}

.ai-tutor-input-area textarea {
    flex: 1;
    resize: none;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 12px;
    max-height: 120px;
}

/* 반응형 (모바일) */
@media (max-width: 768px) {
    .ai-tutor-modal {
        width: 100%;
    }
}
```

### 4. JavaScript 로직

```javascript
// AI 튜터 관련 전역 변수
let currentConversationId = null;
let aiTutorAbortController = null;

// 모달 토글
function toggleAITutor() {
    const modal = document.getElementById('ai-tutor-modal');
    modal.classList.toggle('hidden');

    if (!modal.classList.contains('hidden')) {
        loadConversations();
        updateCreditsDisplay();
    }
}

// 대화 목록 로드
async function loadConversations() {
    const token = await supabaseClient.auth.getSession();
    const response = await fetch('/api/ai-tutor/conversations', {
        headers: { 'Authorization': `Bearer ${token.data.session.access_token}` }
    });

    const conversations = await response.json();
    renderConversationList(conversations);
}

// 메시지 전송 (SSE 스트리밍)
async function sendTutorMessage() {
    const input = document.getElementById('ai-tutor-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';

    // 사용자 메시지 표시
    appendMessage('user', message);

    // AI 응답 컨테이너 생성
    const assistantDiv = appendMessage('assistant', '');
    const contentDiv = assistantDiv.querySelector('.content');

    const token = await supabaseClient.auth.getSession();

    // SSE 연결
    const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.data.session.access_token}`
        },
        body: JSON.stringify({
            message,
            conversationId: currentConversationId
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                    case 'content':
                        contentDiv.textContent += data.text;
                        break;
                    case 'sources':
                        renderSources(assistantDiv, data.sources);
                        break;
                    case 'done':
                        currentConversationId = data.conversationId;
                        updateCreditsDisplay();
                        break;
                    case 'error':
                        contentDiv.textContent = `오류: ${data.message}`;
                        break;
                }
            }
        }
    }
}

// 메시지 렌더링
function appendMessage(role, content) {
    const messagesDiv = document.getElementById('ai-tutor-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `<div class="content">${content}</div>`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return messageDiv;
}

// 참조 문서 렌더링
function renderSources(messageDiv, sources) {
    if (!sources || sources.length === 0) return;

    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'sources';
    sourcesDiv.innerHTML = `
        <strong>참조 문서:</strong>
        ${sources.map(s => `<span class="source-tag">${s.title}</span>`).join('')}
    `;
    messageDiv.appendChild(sourcesDiv);
}

// 이벤트 리스너
document.getElementById('ai-tutor-send').addEventListener('click', sendTutorMessage);
document.getElementById('ai-tutor-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendTutorMessage();
    }
});
document.getElementById('ai-tutor-close').addEventListener('click', toggleAITutor);
document.getElementById('ai-tutor-new-chat').addEventListener('click', () => {
    currentConversationId = null;
    document.getElementById('ai-tutor-messages').innerHTML = `
        <div class="welcome-message">
            <h4>SSAL Works AI 튜터</h4>
            <p>새 대화를 시작합니다. 무엇이든 물어보세요!</p>
        </div>
    `;
});
```

## Expected Output Files
- `index.html` (수정)
- `S3_개발-2차/Frontend/pages/index-ai-tutor.html` (참조용 분리 가능)

## Completion Criteria
- [ ] 기존 iframe 제거
- [ ] 채팅 모달 UI 구현
- [ ] SSE 스트리밍 렌더링 구현
- [ ] 대화 히스토리 사이드바 구현
- [ ] 새 대화/대화 선택 기능 구현
- [ ] 참조 문서 표시 기능 구현
- [ ] 크레딧 잔액 표시 구현
- [ ] 모바일 반응형 적용

## Tech Stack
- HTML/CSS/JavaScript (Vanilla)
- SSE (Server-Sent Events)
- Supabase Auth

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Execution Type
AI-Only

## Remarks
- 기존 toggleAITutor() 함수 수정
- 빌더 계정 체크는 기존 로직 유지
- 모델 선택 없음 (Gemini 고정)
- 참조 문서 표시로 답변 신뢰도 향상
