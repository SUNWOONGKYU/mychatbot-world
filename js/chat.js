/**
 * @task S2F3
 * Chat Interface JavaScript
 */
let chatBotData = null;
let conversationHistory = [];
let isBotTyping = false;
let voiceOutputEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    loadBotData();
    autoResizeInput();
});

// Load bot data from URL
function loadBotData() {
    const path = window.location.pathname;
    const username = path.split('/bot/')[1] || path.split('/').pop();

    // Load from localStorage
    const bots = MCW.getBots();
    chatBotData = bots.find(b => b.username === username);

    if (!chatBotData) {
        // Demo bot
        chatBotData = {
            botName: '써니봇',
            username: username || 'demo',
            templateId: 'ceo',
            personality: '친절하고 전문적인 AI 비서',
            tone: '존댓말, 친절하고 전문적인 어조',
            greeting: '안녕하세요! 써니봇입니다. 무엇이든 도와드리겠습니다! 😊',
            faqs: [
                { q: '어떤 서비스를 제공하나요?', a: '다양한 AI 챗봇 서비스를 제공합니다.' },
                { q: '가격이 어떻게 되나요?', a: '무료 플랜부터 시작할 수 있습니다.' },
                { q: '문의는 어떻게 하나요?', a: '이 채팅을 통해 편하게 문의해주세요!' }
            ]
        };
    }

    // Update UI
    document.getElementById('chatBotName').textContent = chatBotData.botName;
    document.title = `${chatBotData.botName} - My Chatbot World`;
    document.getElementById('welcomeTitle').textContent = chatBotData.botName;
    document.getElementById('welcomeDesc').textContent = chatBotData.personality || '무엇이든 물어보세요.';

    // Render FAQ buttons
    renderFaqButtons();

    // Send greeting
    setTimeout(() => {
        addMessage('bot', chatBotData.greeting);
    }, 500);
}

function renderFaqButtons() {
    const container = document.getElementById('faqButtons');
    if (!container || !chatBotData?.faqs) return;
    container.innerHTML = chatBotData.faqs.map(f =>
        `<button class="faq-btn" onclick="askFaq('${f.q.replace(/'/g, "\\'")}', '${f.a.replace(/'/g, "\\'")}')">${f.q}</button>`
    ).join('');
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || isBotTyping) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage('user', text);

    // Hide welcome and FAQ on first message
    const welcome = document.getElementById('chatWelcome');
    const faq = document.getElementById('faqButtons');
    if (welcome) welcome.style.display = 'none';
    if (faq) faq.style.display = 'none';

    // Show typing
    showTyping();

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Generate response
    const response = await generateResponse(text);
    hideTyping();
    addMessage('bot', response);
    conversationHistory.push({ role: 'assistant', content: response });

    // TTS
    if (voiceOutputEnabled) speak(response);
}

// FAQ
function askFaq(question, answer) {
    addMessage('user', question);

    const welcome = document.getElementById('chatWelcome');
    const faq = document.getElementById('faqButtons');
    if (welcome) welcome.style.display = 'none';
    if (faq) faq.style.display = 'none';

    showTyping();
    setTimeout(() => {
        hideTyping();
        addMessage('bot', answer);
        if (voiceOutputEnabled) speak(answer);
    }, 800);
}

// Add message to UI
function addMessage(sender, text) {
    const container = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    const div = document.createElement('div');
    div.className = `message message-${sender}`;
    div.innerHTML = `
    <div class="message-avatar">${sender === 'bot' ? '🤖' : '👤'}</div>
    <div>
      <div class="message-bubble">${text}</div>
      <div class="message-time">${time}</div>
    </div>
  `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Typing indicator
function showTyping() {
    isBotTyping = true;
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'message message-bot';
    div.id = 'typingIndicator';
    div.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    isBotTyping = false;
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

// Generate AI response (MVP: pattern matching + context-aware)
async function generateResponse(userText) {
    // Check FAQ first
    if (chatBotData?.faqs) {
        for (const faq of chatBotData.faqs) {
            if (userText.includes(faq.q.substring(0, 5)) || faq.q.includes(userText.substring(0, 5))) {
                return faq.a;
            }
        }
    }

    // Simulate delay for more realistic feel
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));

    // Context-aware responses
    const lower = userText.toLowerCase();
    const botName = chatBotData?.botName || 'AI 챗봇';

    if (lower.includes('안녕') || lower.includes('하이') || lower.includes('hello')) {
        return `안녕하세요! ${botName}입니다. 무엇을 도와드릴까요? 😊`;
    }
    if (lower.includes('이름') || lower.includes('누구')) {
        return `저는 ${botName}입니다. ${chatBotData?.personality || 'AI 챗봇입니다.'}`;
    }
    if (lower.includes('감사') || lower.includes('고마')) {
        return '감사합니다! 더 도움이 필요하시면 언제든 말씀해주세요. 😊';
    }
    if (lower.includes('도움') || lower.includes('도와')) {
        const helpItems = chatBotData?.faqs?.map(f => `• ${f.q}`).join('\n') || '';
        return `물론이죠! 이런 것들을 도와드릴 수 있어요:\n${helpItems}\n\n어떤 것이 궁금하신가요?`;
    }

    // Generic thoughtful response
    const responses = [
        `좋은 질문입니다! "${userText}"에 대해 안내해 드리겠습니다. 자세한 내용은 관련 페이지에서 확인하실 수 있습니다.`,
        `네, 말씀하신 내용 잘 이해했습니다. 관련 정보를 안내해 드릴게요. 더 구체적인 질문이 있으시면 말씀해주세요!`,
        `해당 문의에 대해 답변 드리겠습니다. 추가 의견이 있으시면 편하게 말씀해주세요. 😊`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// TTS
function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
}

// Voice toggle
document.getElementById('voiceToggle')?.addEventListener('click', () => {
    voiceOutputEnabled = !voiceOutputEnabled;
    const btn = document.getElementById('voiceToggle');
    btn.textContent = voiceOutputEnabled ? '🔊' : '🔇';
    if (!voiceOutputEnabled) speechSynthesis.cancel();
});

// Voice input for chat
let chatRecognition = null;
function toggleChatVoice() {
    const btn = document.getElementById('chatVoiceBtn');
    if (chatRecognition) {
        chatRecognition.stop();
        chatRecognition = null;
        btn.classList.remove('recording');
        return;
    }
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
        return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    chatRecognition = new SR();
    chatRecognition.lang = 'ko-KR';
    chatRecognition.interimResults = false;
    chatRecognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        document.getElementById('chatInput').value = text;
        sendMessage();
    };
    chatRecognition.onend = () => {
        chatRecognition = null;
        btn.classList.remove('recording');
    };
    chatRecognition.start();
    btn.classList.add('recording');
}

// Auto-resize input
function autoResizeInput() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
}
