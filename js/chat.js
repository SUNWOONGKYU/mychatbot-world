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
// Load bot data from URL
function loadBotData() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const userParam = urlParams.get('user');
    const personaParam = urlParams.get('persona');

    // Load from localStorage
    const bots = MCW.storage.getBots();

    if (idParam) {
        chatBotData = bots.find(b => b.id === idParam);
    } else if (userParam) {
        chatBotData = bots.find(b => b.username === userParam);
    } else {
        const path = window.location.pathname;
        const username = path.split('/bot/')[1];
        if (username) chatBotData = bots.find(b => b.username === username);
    }

    if (!chatBotData) {
        // Check if ID is SunnyBot Official and data is available
        if ((idParam === 'sunny-official' || idParam?.startsWith('sunny-')) && typeof SunnyBotData !== 'undefined') {
            chatBotData = { ...SunnyBotData, id: idParam || 'sunny-official' };
        }

        if (!chatBotData) {
            // Demo bot fallback
            chatBotData = {
                botName: '써니봇 (Demo)',
                username: username || 'demo',
                templateId: 'ceo',
                personality: '친절하고 전문적인 AI 비서',
                greeting: '안녕하세요! 써니봇입니다. 무엇이든 도와드리겠습니다! 😊',
                faqs: [
                    { q: '어떤 서비스를 제공하나요?', a: '다양한 AI 챗봇 서비스를 제공합니다.' },
                    { q: '가격이 어떻게 되나요?', a: '무료 플랜부터 시작할 수 있습니다.' },
                    { q: '문의는 어떻게 하나요?', a: '이 채팅을 통해 편하게 문의해주세요!' }
                ]
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
            iqEq: 50,
            isVisible: true
        }];
    }
    const initialPersona = personaParam
        ? chatBotData.personas.find(p => p.id === personaParam)
        : chatBotData.personas[0];

    currentPersona = initialPersona || chatBotData.personas[0];
    renderPersonaSelector();

    // Avatar Setup
    const avatarStage = document.getElementById('avatarStage');
    if (chatBotData.personas && chatBotData.personas.length > 0) {
        if (avatarStage) avatarStage.style.display = 'flex';
        updateAvatar(currentPersona);
    }

    // Update UI
    document.getElementById('chatBotName').textContent = chatBotData.botName;
    document.title = `${chatBotData.botName} - My Chatbot World`;
    document.getElementById('welcomeTitle').textContent = chatBotData.botName;
    document.getElementById('welcomeDesc').textContent = currentPersona.role;

    // Render FAQ buttons
    renderFaqButtons();

    // Send greeting
    setTimeout(() => {
        addMessage('bot', chatBotData.greeting);
    }, 500);
    // Log conversation start
    if (chatBotData.id) {
        MCW.storage.logEvent(chatBotData.id, 'conversation_start');
    }
}

let currentPersona = null;

function renderPersonaSelector() {
    const container = document.getElementById('personaContainer');
    if (!container) return;

    if (!chatBotData.personas || chatBotData.personas.length <= 1) {
        container.style.display = 'none';
        return;
    }

    const personaIcons = {
        'p_ai': '🧠', 'p_startup': '🚀', 'p_cpa': '🧮', 'p_star': '🔭', 'p_life': '🌿'
    };

    container.innerHTML = chatBotData.personas
        .filter(p => p.isVisible !== false)
        .map(p => `
            <div class="persona-chip ${currentPersona && currentPersona.id === p.id ? 'active' : ''}" 
                 onclick="switchPersona('${p.id}')">
                <span class="persona-chip-icon">${personaIcons[p.id] || '👤'}</span>
                <span class="persona-chip-name">${p.name}</span>
            </div>
        `)
        .join('');

    container.style.display = 'flex';
}

function switchPersona(id) {
    const newPersona = chatBotData.personas.find(p => String(p.id) === String(id));
    if (!newPersona || (currentPersona && currentPersona.id === newPersona.id)) return;

    currentPersona = newPersona;

    // Update UI active state
    document.querySelectorAll('.persona-chip').forEach(chip => {
        const isTarget = chip.getAttribute('onclick').includes(`'${id}'`);
        chip.classList.toggle('active', isTarget);
    });

    // System message
    addMessage('system', `🔄 <strong>${newPersona.name}</strong>(으)로 전환되었습니다.<br><span style="font-size:0.7em; opacity:0.7;">${newPersona.role} | ${newPersona.model.toUpperCase()} Model</span>`);

    // Update UI
    document.getElementById('welcomeDesc').textContent = newPersona.role;

    // Announce
    if (voiceOutputEnabled) speak(`저는 이제 ${newPersona.name}입니다.`);

    // Update Avatar
    updateAvatar(newPersona);
    setAvatarEmotion('happy');
    setTimeout(() => setAvatarEmotion('neutral'), 1500);
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
    if (chatBotData?.id) {
        MCW.storage.logEvent(chatBotData.id, 'message', { role: 'user', content: text });
    }

    // Generate response
    const response = await generateResponse(text);
    hideTyping();
    addMessage('bot', response);
    conversationHistory.push({ role: 'assistant', content: response });
    if (chatBotData?.id) {
        MCW.storage.logEvent(chatBotData.id, 'message', { role: 'assistant', content: response });
    }

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
    if (sender === 'system') {
        div.className = 'message message-system';
        div.innerHTML = `<div style="width:100%; text-align:center; margin:10px 0; font-size:0.8rem; color:rgba(255,255,255,0.5); background:rgba(255,255,255,0.05); padding:5px; border-radius:10px;">${text}</div>`;
    } else {
        div.className = `message message-${sender}`;
        div.innerHTML = `
        <div class="message-avatar">${sender === 'bot' ? (currentPersona?.model === 'emotion' ? '💖' : '🤖') : '👤'}</div>
        <div>
          <div class="message-bubble">${text}</div>
          <div class="message-time">${time}</div>
        </div>
      `;
    }
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

// Generate AI response (MVP: pattern matching + context-aware + Multi-Persona)
async function generateResponse(userText) {
    // Check for API Key
    let apiKey = localStorage.getItem('mcw_openrouter_key');

    // Fallback to the key found in .env.production
    if (!apiKey) {
        apiKey = "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";
        localStorage.setItem('mcw_openrouter_key', apiKey);
    }
    if (!apiKey) {
        // Prompt for key if missing
        const userKey = prompt("OpenRouter API Key가 필요합니다.\n키를 입력해주세요 (브라우저에 저장됩니다):", "");
        if (userKey) {
            localStorage.setItem('mcw_openrouter_key', userKey);
            return generateResponse(userText); // Retry with key
        } else {
            return "API 키가 없으면 대화할 수 없습니다. 😢";
        }
    }

    // Set Loading State
    setAvatarEmotion('thinking'); // Avatar thinking

    try {
        const p = currentPersona || chatBotData.personas[0];
        const systemPrompt = p.role
            ? `당신은 ${p.name}입니다. ${p.role}. 항상 한국어로 답변하세요.`
            : "당신은 도움이 되는 AI 어시스턴트입니다.";

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href, // Optional
                "X-Title": "My Chatbot World" // Optional
            },
            body: JSON.stringify({
                "model": "google/gemini-1.5-flash", // Using stable 1.5 Flash to ensure reliable responses
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    ...conversationHistory.slice(-10), // Context window
                    { "role": "user", "content": userText }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("API Error:", err);
            return `오류가 발생했습니다: ${err.error?.message || response.statusText}`;
        }

        const data = await response.json();
        const botResponse = data.choices[0].message.content;

        setAvatarEmotion('happy'); // Avatar happy
        setTimeout(() => setAvatarEmotion('neutral'), 3000);
        return botResponse;

    } catch (error) {
        console.error("Fetch Error:", error);
        return "네트워크 오류가 발생했습니다. 다시 시도해주세요.";
    }
}

// === Avatar Control ===
function updateAvatar(persona) {
    const face = document.getElementById('avatarFace');
    if (!face || !persona) return;

    // Reset classes
    face.className = 'avatar-face';

    // Map ID to Style
    const styleMap = {
        'p_ai': 'persona-ai',
        'p_startup': 'persona-startup',
        'p_cpa': 'persona-cpa',
        'p_star': 'persona-star',
        'p_life': 'persona-life'
    };

    let styleClass = styleMap[persona.id];
    if (!styleClass) {
        // Fallback for custom personas: deterministic random based on Name length
        const styles = Object.values(styleMap);
        styleClass = styles[persona.name.length % styles.length];
    }

    face.classList.add(styleClass);
}

function setAvatarEmotion(emotion) {
    const face = document.getElementById('avatarFace');
    const label = document.getElementById('emotionLabel');
    if (!face) return;

    // Remove existing emotions
    face.classList.remove('happy', 'sad', 'thinking', 'surprised');

    if (emotion !== 'neutral') {
        face.classList.add(emotion);
    }

    if (label) {
        const labels = {
            neutral: '평온',
            happy: '행복 😊',
            sad: '슬픔 😢',
            thinking: '생각중 🤔',
            surprised: '놀람 😮'
        };
        label.textContent = labels[emotion] || '';
    }
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
