/**
 * @task S2F3
 * Chat Interface JavaScript - v10.1 CREDIT-OPTIMIZED VERSION
 * This version prioritizes high-performance models now that credits are purchased.
 */
let chatBotData = null;
let conversationHistory = [];
let isBotTyping = false;
let voiceOutputEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    console.log("%c[AI SHIELD] v10.1 CREDIT-READY LOADED", "color: #00e5ff; font-weight: bold; font-size: 16px;");

    // Safety: Purge legacy compromised keys
    const storedKey = localStorage.getItem('mcw_openrouter_key');
    if (storedKey && storedKey.startsWith("sk-or-v1-7")) {
        localStorage.removeItem('mcw_openrouter_key');
    }

    loadBotData();
    autoResizeInput();
});

function loadBotData() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const bots = MCW.storage.getBots();

    if (idParam) {
        chatBotData = bots.find(b => b.id === idParam);
    }

    if (!chatBotData) {
        if ((idParam === 'sunny-official' || idParam?.startsWith('sunny-')) && typeof SunnyBotData !== 'undefined') {
            chatBotData = { ...SunnyBotData, id: idParam || 'sunny-official' };
        }
        if (!chatBotData) {
            chatBotData = {
                botName: '써니봇 (v10.1)',
                username: 'sunny',
                personality: '당신의 비즈니스 성장을 돕는 AI 파트너입니다.',
                greeting: '안녕하세요! 크레딧 충전 덕분에 더욱 빠르고 똑똑해진 v10.1 써니봇입니다. 무엇을 도와드릴까요?',
                faqs: []
            };
        }
    }

    // Persona Setup
    if (!chatBotData.personas || chatBotData.personas.length === 0) {
        chatBotData.personas = [{
            id: 'default',
            name: chatBotData.botName,
            role: chatBotData.personality || 'AI Assistant',
            model: 'logic',
            isVisible: true
        }];
    }

    currentPersona = chatBotData.personas[0];

    // UI Update
    const nameEl = document.getElementById('chatBotName');
    if (nameEl) nameEl.textContent = chatBotData.botName;
    document.title = `${chatBotData.botName} - v10.1`;

    renderFaqButtons();
    if (conversationHistory.length === 0) {
        setTimeout(() => addMessage('bot', chatBotData.greeting), 500);
    }
}

let currentPersona = null;

function renderFaqButtons() {
    const container = document.getElementById('faqButtons');
    if (!container || !chatBotData?.faqs) return;
    container.innerHTML = chatBotData.faqs.map(f =>
        `<button class="faq-btn" onclick="askFaq('${f.q.replace(/'/g, "\\'")}', '${f.a.replace(/'/g, "\\'")}')">${f.q}</button>`
    ).join('');
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || isBotTyping) return;

    input.value = '';
    addMessage('user', text);
    showTyping();

    conversationHistory.push({ role: 'user', content: text });
    const response = await generateResponse(text);
    hideTyping();
    addMessage('bot', response);
    conversationHistory.push({ role: 'assistant', content: response });

    if (voiceOutputEnabled) speak(response);
}

function askFaq(q, a) {
    addMessage('user', q);
    showTyping();
    setTimeout(() => {
        hideTyping();
        addMessage('bot', a);
        if (voiceOutputEnabled) speak(a);
    }, 500);
}

function addMessage(sender, text) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `message message-${sender}`;
    div.innerHTML = `
        <div class="message-avatar">${sender === 'bot' ? '🤖' : '👤'}</div>
        <div class="message-bubble">${text}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    isBotTyping = true;
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'message message-bot';
    div.id = 'typingIndicator';
    div.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-bubble">대답을 고민하고 있습니다...</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    isBotTyping = false;
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

async function generateResponse(userText) {
    // 🔑 THE VERIFIED KEY (sk-or-v1-6a0bbf03...)
    const API_KEY = "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";

    // Optimized Stack: High Performance (Paid) -> Stable Free Fallbacks
    const modelStack = [
        "google/gemini-2.0-flash-001",           // 1. Paid Top Priority (Fast & Smart)
        "meta-llama/llama-3.3-70b-instruct",     // 2. Paid Powerful Alternative
        "openrouter/free",                       // 3. Stable Auto-Free Fallback
        "google/gemini-2.0-flash-exp:free",      // 4. Free Gemini Backup
        "meta-llama/llama-3.3-70b-instruct:free" // 5. Free Llama Backup
    ];

    let lastError = "";
    for (let currentModel of modelStack) {
        console.log(`[AI ACCESS] Using ${currentModel}...`);
        try {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "MCW_V10_PRO"
                },
                body: JSON.stringify({
                    "model": currentModel,
                    "messages": [
                        { "role": "system", "content": "You are a professional AI assistant in My Chatbot World. Reply in Korean." },
                        ...conversationHistory.slice(-5),
                        { "role": "user", "content": userText }
                    ]
                })
            });

            const data = await res.json();
            if (res.ok && data.choices && data.choices[0]) {
                console.log(`[AI SUCCESS] ${currentModel} responded.`);
                return data.choices[0].message.content;
            }

            lastError = data.error?.message || res.statusText;
            console.warn(`[AI WARN] ${currentModel} error: ${lastError}`);

            // Auto-retry with next model for almost all errors to ensure user gets a response
            continue;

        } catch (e) {
            lastError = e.message;
        }
    }
    return `[AI 오류] 모든 모델 접속에 실패했습니다. (사유: ${lastError})\n잠시 후 다시 시도해 주세요.`;
}

function speak(text) {
    if (!voiceOutputEnabled || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    speechSynthesis.speak(u);
}

function autoResizeInput() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    });
}
