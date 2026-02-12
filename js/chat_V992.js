/**
 * @task S2F3
 * Chat Interface JavaScript - v9.9.2 ULTIMATE REPAIR
 * This version is designed to BEAT browser cache and force a working connection.
 */
let chatBotData = null;
let conversationHistory = [];
let isBotTyping = false;
let voiceOutputEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    const chatModuleVersion = "9.9.2";
    console.log(`[FATAL REPAIR] Chat Module v${chatModuleVersion} Loaded.`);
    
    // Clear potentially corrupted storage
    const oldKey = localStorage.getItem('mcw_openrouter_key');
    if (oldKey && oldKey.startsWith("sk-or-v1-7")) {
        console.warn("Purging compromised old key...");
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
                botName: '써니봇 (Official)',
                username: 'sunny',
                personality: '당신의 비즈니스 성장을 돕는 AI 파트너입니다.',
                greeting: '안녕하세요! 저는 써니봇입니다. 무엇을 도와드릴까요?',
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
    
    // Update Header
    const nameEl = document.getElementById('chatBotName');
    if (nameEl) nameEl.textContent = chatBotData.botName;
    document.title = `${chatBotData.botName} - My Chatbot World`;
    
    renderFaqButtons();
    
    // Send Greeting
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
    input.style.height = 'auto';
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
        <div class="message-bubble">...입력 중...</div>
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
    // 🔑 THE VERIFIED KEY (Hardcoded Fallback)
    const API_KEY = "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";
    
    // Model stack priority for zero-credit accounts
    const modelStack = [
        "google/gemini-2.0-flash-exp:free",      
        "meta-llama/llama-3.3-70b-instruct:free", 
        "mistralai/mistral-7b-instruct:free",
        "deepseek/deepseek-chat:free",
        "qwen/qwen-2.5-72b-instruct:free"
    ];

    let lastError = "";
    for (let currentModel of modelStack) {
        console.log(`[AI Attempt] ${currentModel}...`);
        try {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "MCW REPAIR v9.9.2"
                },
                body: JSON.stringify({
                    "model": currentModel,
                    "messages": [
                        { "role": "system", "content": "You are a helpful assistant. Keep answers concise and in Korean." },
                        ...conversationHistory.slice(-5),
                        { "role": "user", "content": userText }
                    ]
                })
            });

            const data = await res.json();
            if (res.ok && data.choices && data.choices[0]) {
                console.log(`[AI Success] ${currentModel}`);
                return data.choices[0].message.content;
            }
            
            lastError = data.error?.message || res.statusText;
            console.warn(`[AI Fail] ${currentModel}: ${lastError}`);
            
            // Continue to next model if this one fails due to balance or endpoints
            if (lastError.includes("credit") || lastError.includes("balance") || lastError.includes("No endpoints") || lastError.includes("429")) {
                continue;
            } else {
                // If it's a critical error but not balance, still try one more
                continue;
            }
        } catch (e) {
            lastError = e.message;
        }
    }
    return `[AI 오류] 모든 무료 모델 접속에 실패했습니다. (마지막 오류: ${lastError})\n잠시 후 다시 시도해 주세요.`;
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
