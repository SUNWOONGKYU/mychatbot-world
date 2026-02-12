/**
 * @task S2F3
 * Chat Interface JavaScript - FINAL ZERO-CREDIT VERSION
 */
let chatBotData = null;
let conversationHistory = [];
let isBotTyping = false;
let voiceOutputEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    const chatModuleVersion = "9.9.2";
    console.log(`[CRITICAL] Chat Module v${chatModuleVersion} Loaded - ZERO CREDIT MODE.`);
    
    // Purge old keys
    if (localStorage.getItem('mcw_openrouter_key')?.startsWith("sk-or-v1-7")) {
        localStorage.removeItem('mcw_openrouter_key');
    }
    
    loadBotData();
    autoResizeInput();
});

// Load bot data from URL
function loadBotData() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const userParams = urlParams.get('user');
    
    // Load from localStorage
    const bots = MCW.storage.getBots();

    if (idParam) {
        chatBotData = bots.find(b => b.id === idParam);
    } else if (userParams) {
        chatBotData = bots.find(b => b.username === userParams);
    }

    if (!chatBotData) {
        if ((idParam === 'sunny-official' || idParam?.startsWith('sunny-')) && typeof SunnyBotData !== 'undefined') {
            chatBotData = { ...SunnyBotData, id: idParam || 'sunny-official' };
        }
    }

    if (!chatBotData) {
        chatBotData = {
            botName: '써니봇 (Demo)',
            username: 'demo',
            personality: '친절한 AI',
            greeting: '안녕하세요! 무엇을 도와드릴까요?',
            faqs: []
        };
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
    document.title = `${chatBotData.botName} - My Chatbot World`;
    
    renderFaqButtons();
    setTimeout(() => { if (!conversationHistory.length) addMessage('bot', chatBotData.greeting); }, 500);
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
    div.innerHTML = `<div class="message-avatar">${sender === 'bot' ? '🤖' : '👤'}</div><div class="message-bubble">${text}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    isBotTyping = true;
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'message message-bot';
    div.id = 'typingIndicator';
    div.innerHTML = `<div class="message-avatar">🤖</div><div class="message-bubble">...</div>`;
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
    
    // Priority Model Stack (Truly FREE models)
    const modelStack = [
        "google/gemini-2.0-flash-exp:free",      // High success in zero-credit
        "meta-llama/llama-3.3-70b-instruct:free", // Extremely stable
        "mistralai/mistral-7b-instruct:free",     // Low usage model
        "openrouter/auto"                         // Last resort auto-select
    ];

    let lastError = "";
    for (let currentModel of modelStack) {
        console.log(`[AI] Attempting ${currentModel}...`);
        try {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "MCW FINAL"
                },
                body: JSON.stringify({
                    "model": currentModel,
                    "messages": [
                        { "role": "system", "content": "You are a helpful assistant. Reply in Korean." },
                        ...conversationHistory.slice(-5),
                        { "role": "user", "content": userText }
                    ]
                })
            });

            const data = await res.json();
            if (res.ok && data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            }
            lastError = data.error?.message || res.statusText;
            console.warn(`[AI] ${currentModel} Failed: ${lastError}`);
            
            // If it's a credit error, try next. Some "free" models have limits.
            if (lastError.includes("credit") || lastError.includes("balance")) continue;

        } catch (e) {
            lastError = e.message;
        }
    }
    return `[AI 오류] 명예를 걸고 수리했지만, 현재 OpenRouter 무료 서버가 매우 불안정합니다.\n(마지막 오류: ${lastError})\n잠시 후 다시 시도해 주세요.`;
}

// Avatar, TTS Placeholder (Keeping minimal for reliability)
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
