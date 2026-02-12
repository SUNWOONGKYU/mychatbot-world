/**
 * @task S2F3
 * Chat Interface JavaScript
 */
let chatBotData = null;
let conversationHistory = [];
let isBotTyping = false;
let voiceOutputEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    const chatModuleVersion = "9.9.2 - SECURITY FIX";
    console.log(`[CRITICAL] Chat Module v${chatModuleVersion} Loaded.`);

    // ?îë Force Purge Bad Key
    const BAD_KEY_HASH = "sk-or-v1-6a0bbf03";
    if (localStorage.getItem('mcw_openrouter_key')?.includes(BAD_KEY_HASH)) {
        console.error("COMPROMISED KEY PURGED.");
        localStorage.removeItem('mcw_openrouter_key');
    }
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
                botName: '?®ÎãàÎ¥?(Demo)',
                username: username || 'demo',
                templateId: 'ceo',
                personality: 'ÏπúÏ†à?òÍ≥† ?ÑÎ¨∏?ÅÏù∏ AI ÎπÑÏÑú',
                greeting: '?àÎÖï?òÏÑ∏?? ?®ÎãàÎ¥áÏûÖ?àÎã§. Î¨¥Ïóá?¥Îì† ?ÑÏ??úÎ¶¨Í≤†Ïäµ?àÎã§! ?òä',
                faqs: [
                    { q: '?¥Îñ§ ?úÎπÑ?§Î? ?úÍ≥µ?òÎÇò??', a: '?§Ïñë??AI Ï±óÎ¥á ?úÎπÑ?§Î? ?úÍ≥µ?©Îãà??' },
                    { q: 'Í∞ÄÍ≤©Ïù¥ ?¥ÎñªÍ≤??òÎÇò??', a: 'Î¨¥Î£å ?åÎûúÎ∂Ä???úÏûë?????àÏäµ?àÎã§.' },
                    { q: 'Î¨∏Ïùò???¥ÎñªÍ≤??òÎÇò??', a: '??Ï±ÑÌåÖ???µÌï¥ ?∏ÌïòÍ≤?Î¨∏Ïùò?¥Ï£º?∏Ïöî!' }
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
    // Sync API Key from Config or Secrets
    if (typeof CONFIG !== 'undefined' && CONFIG.OPENROUTER_API_KEY) {
        localStorage.setItem('mcw_openrouter_key', CONFIG.OPENROUTER_API_KEY);
        console.log("API Key synced from config.js");
    } else if (typeof MCW_SECRETS !== 'undefined' && MCW_SECRETS.OPENROUTER_API_KEY) {
        localStorage.setItem('mcw_openrouter_key', MCW_SECRETS.OPENROUTER_API_KEY);
        console.log("API Key synced from secrets.js");
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
        'p_ai': '?ß†', 'p_startup': '??', 'p_cpa': '?ßÆ', 'p_star': '?î≠', 'p_life': '?åø'
    };

    container.innerHTML = chatBotData.personas
        .filter(p => p.isVisible !== false)
        .map(p => `
            <div class="persona-chip ${currentPersona && currentPersona.id === p.id ? 'active' : ''}" 
                 onclick="switchPersona('${p.id}')">
                <span class="persona-chip-icon">${personaIcons[p.id] || '?ë§'}</span>
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
    addMessage('system', `?îÑ <strong>${newPersona.name}</strong>(??Î°??ÑÌôò?òÏóà?µÎãà??<br><span style="font-size:0.7em; opacity:0.7;">${newPersona.role} | ${newPersona.model.toUpperCase()} Model</span>`);

    // Update UI
    document.getElementById('welcomeDesc').textContent = newPersona.role;

    // Announce
    if (voiceOutputEnabled) speak(`?Ä???¥Ï†ú ${newPersona.name}?ÖÎãà??`);

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
        <div class="message-avatar">${sender === 'bot' ? (currentPersona?.model === 'emotion' ? '?íñ' : '?§ñ') : '?ë§'}</div>
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
    <div class="message-avatar">?§ñ</div>
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

// Generate AI response with Fallback Loop (Handling invalid Model IDs)
async function generateResponse(userText) {
    // 3. Validation
    if (!apiKey) {
        return "[?úÏä§???§Î•ò] API ?§Í? ?ÜÏäµ?àÎã§. js/secrets.jsÎ•??ïÏù∏?òÏÑ∏??";
    }

    apiKey = apiKey.trim();
    console.log(`[AI Debug] v9.9.1 Running. Using Key: ${apiKey.substring(0, 11)}...`);

    // Model fallback list (Prioritizing FREE models for zero-credit accounts)
    const modelStack = [
        "google/gemini-2.0-flash-exp:free",      // Top Free Priority
        "meta-llama/llama-3.3-70b-instruct:free", // Extremely stable
        "deepseek/deepseek-chat:free",            // High-end Free
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "mistralai/mistral-7b-instruct:free",     // Lightweight Free
        "openrouter/auto",                        // Auto selector
        "google/gemini-2.0-flash-001"            // Paid/Verified Tier Fallback
    ];

    let lastError = "";
    setAvatarEmotion('thinking');

    for (let i = 0; i < modelStack.length; i++) {
        const currentModel = modelStack[i];
        console.log(`[AI Loop] Attempt ${i + 1}/${modelStack.length} using model: ${currentModel}`);

        try {
            const p = currentPersona || chatBotData.personas[0];
            const systemPrompt = `?πÏã†?Ä ${p.name}?ÖÎãà?? ${p.role}. ?úÍ?(Korean)Î°úÎßå ?µÎ??òÏÑ∏??`;

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin, // Simplified referer
                    "X-Title": "My Chatbot World"
                },
                body: JSON.stringify({
                    "model": currentModel,
                    "messages": [
                        { "role": "system", "content": systemPrompt },
                        ...conversationHistory.slice(-10),
                        { "role": "user", "content": userText }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                })
            });

            const data = await response.json();

            if (response.ok && data.choices && data.choices[0]) {
                console.log(`[AI Loop] Success with model: ${currentModel}`);
                setAvatarEmotion('happy');
                setTimeout(() => setAvatarEmotion('neutral'), 3000);
                return data.choices[0].message.content;
            }

            // Handle specific OpenRouter errors
            lastError = data.error?.message || response.statusText;
            console.warn(`[AI Loop] Error with ${currentModel}: ${lastError}`);

            // If credit is empty or model busy, continue to next
            if (lastError.includes("balance") || lastError.includes("No endpoints") || lastError.includes("429") || lastError.includes("overloaded")) {
                console.log(`[AI Loop] Retrying next model due to: ${lastError.substring(0, 30)}...`);
                continue;
            }

        } catch (error) {
            lastError = error.message;
            console.error(`[AI Loop] Network error for ${currentModel}:`, error);
            // Wait briefly before next attempt on network issue
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    setAvatarEmotion('sad');
    if (lastError.includes("User not found") || lastError.includes("401")) {
        return `[Í≥ÑÏ†ï ?§Î•ò] ?¨Ïö©?êÎ? Ï∞æÏùÑ ???ÜÍ±∞??API ?§Í? ?†Ìö®?òÏ? ?äÏäµ?àÎã§. (?êÎü¨: ${lastError})\n?àÎ°ú???§Î? ?±Î°ù??Ï£ºÏÑ∏??`;
    }
    return `[AI ?§Î•ò] Î™ÖÏòàÎ•?Í±∏Í≥† 8Í∞?Î™®Îç∏???úÎèÑ?àÏúº??Î™®Îëê ?§Ìå®?àÏäµ?àÎã§. (ÎßàÏ?Îß??§Î•ò: ${lastError})\n?òÏù¥ÏßÄÎ•??àÎ°úÍ≥†Ïπ®(F5) ?òÍ±∞???†Ïãú ???§Ïãú ?úÎèÑ??Ï£ºÏÑ∏??`;
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
            neutral: '?âÏò®',
            happy: '?âÎ≥µ ?òä',
            sad: '?¨Ìîî ?ò¢',
            thinking: '?ùÍ∞ÅÏ§??§î',
            surprised: '?Ä???òÆ'
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
    btn.textContent = voiceOutputEnabled ? '?îä' : '?îá';
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
        alert('??Î∏åÎùº?∞Ï????åÏÑ± ?∏Ïãù??ÏßÄ?êÌïòÏßÄ ?äÏäµ?àÎã§.');
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

