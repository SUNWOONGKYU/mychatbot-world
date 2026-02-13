/**
 * @task S2F3
 * Chat Interface JavaScript - v10.5 MOBILE VOICE FIXED
 * Includes "Audio Context Unlock" for mobile browsers.
 */
let chatBotData = null;
let conversationHistory = [];
let isBotTyping = false;
let voiceOutputEnabled = true;

// Mobile Audio Unlocker
let audioUnlocked = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log("%c[AI SHIELD] v10.9 SECURITY PATCH LOADED (Cache Bypassed)", "color: #ff00ff; font-weight: bold; font-size: 16px;");

    // Safety: Purge legacy keys
    const storedKey = localStorage.getItem('mcw_openrouter_key');
    if (storedKey && storedKey.startsWith("sk-or-v1-7")) {
        localStorage.removeItem('mcw_openrouter_key');
    }

    loadBotData();
    renderPersonaSelector();
    autoResizeInput();

    // Voice Toggle
    const voiceBtn = document.getElementById('voiceToggle');
    if (voiceBtn) {
        voiceBtn.textContent = '🔊'; // Default ON
        voiceBtn.addEventListener('click', () => {
            voiceOutputEnabled = !voiceOutputEnabled;
            voiceBtn.textContent = voiceOutputEnabled ? '🔊' : '🔇';
            if (!voiceOutputEnabled) window.speechSynthesis?.cancel();

            // Unlock on toggle attempt too
            if (voiceOutputEnabled) unlockAudio();
        });
    }

    // Unlock audio on any interaction
    document.body.addEventListener('click', unlockAudio, { once: true });
    document.body.addEventListener('touchstart', unlockAudio, { once: true });
});

function unlockAudio() {
    if (audioUnlocked || !window.speechSynthesis) return;

    // Play a silent utterance to unlock mobile audio
    const dummy = new SpeechSynthesisUtterance('');
    dummy.volume = 0;
    window.speechSynthesis.speak(dummy);
    audioUnlocked = true;
    console.log("[Mobile] Audio Engine Unlocked");
}

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
                botName: '써니봇 (v10.5)',
                username: 'sunny',
                personality: '당신의 비즈니스 성장을 돕는 AI 파트너입니다.',
                greeting: '안녕하세요! 모바일에서도 생생한 목소리로 대화하는 v10.5 써니봇입니다.',
                faqs: []
            };
        }
    }

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

    const nameEl = document.getElementById('chatBotName');
    if (nameEl) nameEl.textContent = chatBotData.botName;
    document.title = `${chatBotData.botName} - v10.5`;

    renderFaqButtons();
    if (conversationHistory.length === 0) {
        setTimeout(() => addMessage('bot', chatBotData.greeting), 500);
    }
}

let currentPersona = null;

function renderPersonaSelector() {
    const container = document.getElementById('personaContainer');
    if (!container) return;

    if (!chatBotData || !chatBotData.personas || chatBotData.personas.length <= 1) {
        container.style.display = 'none';
        return;
    }

    const personaIcons = {
        // 분신 아바타 3개
        sunny_avatar_ai: '🧠',
        sunny_avatar_startup: '🚀',
        sunny_avatar_cpa: '📊',
        // AI 도우미 2개
        sunny_helper_work: '💼',
        sunny_helper_life: '🏡'
    };

    // 소유자 뷰인지 (로그인 유저 == 봇 ownerId)
    let isOwnerView = false;
    try {
        if (typeof MCW !== 'undefined' && MCW.user && MCW.user.getCurrentUser && chatBotData.ownerId) {
            const u = MCW.user.getCurrentUser();
            if (u && u.id === chatBotData.ownerId) {
                isOwnerView = true;
            }
        }
    } catch (e) {
        console.warn('[Persona] owner check failed:', e);
    }

    // 타인에게는 isPublic !== false 인 페르소나만 노출 (helper 는 isPublic:false)
    const visiblePersonas = chatBotData.personas
        .filter(p => p.isVisible !== false)
        .filter(p => isOwnerView || p.isPublic !== false);

    container.innerHTML = visiblePersonas
        .map(p => {
            const activeClass = (currentPersona && currentPersona.id === p.id) ? 'active' : '';
            const isHelper = p.category === 'helper';
            const typeTag = isHelper ? 'AI 도우미' : '분신 아바타';
            return (
                '<div class="persona-chip ' + activeClass + '" onclick="switchPersona(\'' + p.id + '\')">' +
                    '<span class="persona-chip-icon">' + (personaIcons[p.id] || '👤') + '</span>' +
                    '<span class="persona-chip-name">' + p.name + '</span>' +
                    '<span class="persona-chip-type">' + typeTag + '</span>' +
                '</div>'
            );
        })
        .join('');

    container.style.display = visiblePersonas.length ? 'flex' : 'none';
}

function switchPersona(id) {
    if (!chatBotData || !chatBotData.personas) return;
    const newPersona = chatBotData.personas.find(p => String(p.id) === String(id));
    if (!newPersona || (currentPersona && currentPersona.id === newPersona.id)) return;

    currentPersona = newPersona;

    document.querySelectorAll('.persona-chip').forEach(chip => {
        const onClick = chip.getAttribute('onclick') || "";
        const isTarget = onClick.indexOf("'" + id + "'") !== -1;
        chip.classList.toggle('active', isTarget);
    });

    addMessage(
        'system',
        '✅ <strong>' + newPersona.name + '</strong> 페르소나로 전환되었습니다.<br>' +
        '<span style="font-size:0.7em; opacity:0.7;">' +
        (newPersona.role || '') + ' | ' + (newPersona.model || 'MODEL').toUpperCase() +
        '</span>'
    );

    const welcomeDescEl = document.getElementById('welcomeDesc');
    if (welcomeDescEl) welcomeDescEl.textContent = newPersona.role || '';

    if (typeof updateAvatar === 'function') {
        updateAvatar(newPersona);
    }
    if (typeof setAvatarEmotion === 'function') {
        setAvatarEmotion('happy');
        setTimeout(() => setAvatarEmotion('neutral'), 1500);
    }

    if (voiceOutputEnabled && typeof speak === 'function') {
        speak('지금부터 ' + newPersona.name + ' 페르소나로 도와드릴게요.');
    }
}

function renderFaqButtons() {
    const container = document.getElementById('faqButtons');
    if (!container || !chatBotData?.faqs) return;
    container.innerHTML = chatBotData.faqs.map(f =>
        `<button class="faq-btn" onclick="askFaq('${f.q.replace(/'/g, "\\'")}', '${f.a.replace(/'/g, "\\'")}')">${f.q}</button>`
    ).join('');
}

async function sendMessage() {
    unlockAudio(); // Critical for mobile

    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || isBotTyping) return;

    input.value = '';
    // Reset height
    input.style.height = 'auto';

    addMessage('user', text);
    showTyping();

    conversationHistory.push({ role: 'user', content: text });

    // Safety timeout - if AI doesn't respond in 15s, release lock
    const safetyTimer = setTimeout(() => {
        if (isBotTyping) {
            hideTyping();
            addMessage('bot', "[네트워크 지연] 응답이 늦어지고 있습니다. 잠시 후 다시 시도해주세요.");
        }
    }, 15000);

    const response = await generateResponse(text);
    clearTimeout(safetyTimer);

    hideTyping();
    addMessage('bot', response);
    conversationHistory.push({ role: 'assistant', content: response });

    if (voiceOutputEnabled) speak(response);
}

function askFaq(q, a) {
    unlockAudio();
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
        <div class="message-bubble">
            <span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span>
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

async function generateResponse(userText) {
    const start = Date.now();

    // 1차: 서버리스 API (/api/chat) 사용 - 키는 서버에서만 사용됩니다.
    try {
        const payload = {
            message: userText,
            botConfig: {
                botName: chatBotData && chatBotData.botName,
                personality: (currentPersona && currentPersona.role) || (chatBotData && chatBotData.personality),
                tone: (chatBotData && chatBotData.tone) || '',
                templateId: (chatBotData && chatBotData.templateId) || '',
                faqs: (chatBotData && chatBotData.faqs) || []
            },
            history: conversationHistory.slice(-10)
        };

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            if (data.reply) {
                const latency = Date.now() - start;
                console.log('[AI SUCCESS] /api/chat ' + latency + 'ms');
                return data.reply;
            }
        } else {
            console.warn('[API] /api/chat failed', res.status);
        }
    } catch (e) {
        console.warn('[API] /api/chat error', e);
    }

    // 2차: 개발 환경용 직접 OpenRouter 호출 (로컬 secrets/config 있을 때만)
    const BAD_KEY_HASH = 'sk-or-v1-6a0bbf03';
    let storedKey = localStorage.getItem('mcw_openrouter_key');

    if (storedKey && storedKey.includes(BAD_KEY_HASH)) {
        console.warn('[AI SECURITY] Compomised key detected in storage. PURGING.');
        localStorage.removeItem('mcw_openrouter_key');
        storedKey = null;
    }

    let API_KEY = null;
    if (typeof MCW_SECRETS !== 'undefined' && MCW_SECRETS.OPENROUTER_API_KEY) {
        API_KEY = MCW_SECRETS.OPENROUTER_API_KEY;
        localStorage.setItem('mcw_openrouter_key', API_KEY);
    } else if (typeof CONFIG !== 'undefined' && CONFIG.OPENROUTER_API_KEY) {
        API_KEY = CONFIG.OPENROUTER_API_KEY;
        localStorage.setItem('mcw_openrouter_key', API_KEY);
    } else {
        API_KEY = storedKey;
    }

    if (!API_KEY || API_KEY.length < 50 || API_KEY.includes(BAD_KEY_HASH)) {
        return '[시스템 오류] API 키가 유효하지 않습니다. (원인: User not found / Key Invalid). 캐시를 삭제하고 다시 접속해주세요.';
    }

    const modelStack = [
        'google/gemini-2.0-flash-001',
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.3-70b-instruct',
        'openrouter/free'
    ];

    let lastError = '';
    for (let currentModel of modelStack) {
        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + API_KEY,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'MCW_MOBILE_V10.5'
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [
                        { role: 'system', content: 'You are a professional assistant. Reply in Korean.' },
                        ...conversationHistory.slice(-5),
                        { role: 'user', content: userText }
                    ]
                })
            });

            const data = await res.json();
            if (res.ok && data.choices && data.choices[0]) {
                const latency = Date.now() - start;
                console.log('[AI SUCCESS] ' + currentModel + ' (' + latency + 'ms)');
                return data.choices[0].message.content;
            }
            lastError = (data.error && data.error.message) || res.statusText;
        } catch (e) {
            lastError = e.message;
        }
    }
    return '[AI 오류] 접속 실패 (' + lastError + ')';
}

function speak(text) {
    if (!voiceOutputEnabled || !window.speechSynthesis) return;

    // Cancel previous
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.0;
    u.pitch = 1.0;

    // Mobile Chrome weirdness fix
    u.onend = function () { console.log('Speech ended'); };
    u.onerror = function (e) { console.error('Speech error:', e); };

    window.speechSynthesis.speak(u);
}

// STT
let chatRecognition = null;
function toggleChatVoice() {
    unlockAudio(); // Unlock audio context when using STT too

    const btn = document.getElementById('chatVoiceBtn');
    if (chatRecognition) {
        chatRecognition.stop();
        chatRecognition = null;
        btn?.classList.remove('recording');
        return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
        return;
    }

    chatRecognition = new SR();
    chatRecognition.lang = 'ko-KR';
    chatRecognition.interimResults = false;
    chatRecognition.maxAlternatives = 1;

    chatRecognition.onstart = () => {
        btn?.classList.add('recording');
    }

    chatRecognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = text;
            sendMessage(); // Auto-send
        }
    };

    chatRecognition.onerror = (e) => {
        console.error("STT Error", e);
        chatRecognition = null;
        btn?.classList.remove('recording');
    };

    chatRecognition.onend = () => {
        chatRecognition = null;
        btn?.classList.remove('recording');
    };

    chatRecognition.start();
}

function autoResizeInput() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    });
}
