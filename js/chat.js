/**
 * @task S2F3
 * Chat Interface JavaScript - v10.5 MOBILE VOICE FIXED
 * Includes "Audio Context Unlock" for mobile browsers.
 */
let chatBotData = null;
let conversationHistory = [];
let isBotTyping = false;
let voiceOutputEnabled = true;
// Mobile Audio: 전역 Audio 요소 (사용자 제스처로 unlock 후 재사용)
var _ttsPlayer = new Audio();
var _ttsUnlocked = false;
// 대기 중인 TTS 텍스트 (API 응답 후 재생할 내용)
var _ttsPending = null;
document.addEventListener('DOMContentLoaded', () => {
    console.log("%c[AI SHIELD] v10.9 SECURITY PATCH LOADED (Cache Bypassed)", "color: #ff00ff; font-weight: bold; font-size: 16px;");
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
        voiceBtn.textContent = '🔊';
        voiceBtn.addEventListener('click', () => {
            voiceOutputEnabled = !voiceOutputEnabled;
            voiceBtn.textContent = voiceOutputEnabled ? '🔊' : '🔇';
            if (!voiceOutputEnabled) { _ttsPlayer.pause(); }
        });
    }
    // Theme: restore saved preference
    initTheme();
});
// 사용자 제스처 시점에 Audio 요소를 unlock (전송 버튼, 터치 등에서 호출)
function unlockTTS() {
    if (_ttsUnlocked) return;
    // 짧은 무음 MP3 data URI로 Audio 요소 unlock
    _ttsPlayer.src = 'data:audio/mpeg;base64,/+NIxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    _ttsPlayer.volume = 0.01;
    _ttsPlayer.play().then(function () {
        _ttsUnlocked = true;
        console.log('[TTS] Audio player unlocked');
    }).catch(function (e) {
        console.warn('[TTS] Unlock failed:', e.message);
    });
}
// === Theme (Dark/Light) ===
function initTheme() {
    var saved = localStorage.getItem('mcw_theme') || 'dark';
    applyTheme(saved);
}
function applyTheme(theme) {
    var body = document.querySelector('.chat-body');
    if (!body) return;
    if (theme === 'light') {
        body.classList.add('light');
    } else {
        body.classList.remove('light');
    }
    localStorage.setItem('mcw_theme', theme);
    var btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
}
function toggleTheme() {
    var current = localStorage.getItem('mcw_theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

function loadBotData() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const bots = MCW.storage.getBots();
    if (idParam) {
        chatBotData = bots.find(b => b.id === idParam);
    }
    if (!chatBotData) {
        // 데모 봇
        if (idParam === 'sunny-demo' && typeof SunnyDemoBotData !== 'undefined') {
            chatBotData = { ...SunnyDemoBotData, id: 'sunny-demo' };
        }
        // 실제 Sunny Bot
        else if ((idParam === 'sunny-official' || idParam?.startsWith('sunny-')) && typeof SunnyBotData !== 'undefined') {
            chatBotData = { ...SunnyBotData, id: idParam || 'sunny-official' };
        }
        if (!chatBotData) {
            chatBotData = {
                botName: 'Sunny Bot (v10.5)',
                username: 'sunny',
                personality: '당신의 비즈니스 성장을 돕는 AI 파트너입니다.',
                greeting: '안녕하세요! 모바일에서도 생생한 목소리로 대화하는 v10.5 Sunny Bot입니다.',
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
    // ?persona= 파라미터로 특정 페르소나 바로 선택
    const personaParam = urlParams.get('persona');
    if (personaParam) {
        const matched = chatBotData.personas.find(p => p.id === personaParam);
        if (matched) currentPersona = matched;
        else currentPersona = chatBotData.personas[0];
    } else {
        currentPersona = chatBotData.personas[0];
    }
    const nameEl = document.getElementById('chatBotName');
    if (nameEl) nameEl.textContent = chatBotData.botName;
    document.title = `${chatBotData.botName} - v10.5`;
    renderFaqButtons();
    if (conversationHistory.length === 0) {
        setTimeout(() => addMessage('system', '대화할 준비가 되었습니다.'), 500);
        // 대화 세션 시작 기록
        logPerPersonaStat('conversation_start');
    }
}
// === Claude Squad Control API 연동 (소대 컨트롤러) ===
const CLAUDE_SQUAD_API_BASE =
    (typeof window !== 'undefined' && window.CLAUDE_SQUAD_API_BASE) ||
    (typeof MCW !== 'undefined' && MCW.env && MCW.env.CLAUDE_SQUAD_API_BASE) ||
    'http://localhost:4100';
async function cscGetSquads() {
    try {
        const res = await fetch(`${CLAUDE_SQUAD_API_BASE}/api/squads`);
        if (!res.ok) throw new Error('소대 목록 조회 실패');
        return await res.json();
    } catch (e) {
        console.warn('[CSC] getSquads 실패', e);
        return [];
    }
}
async function cscAddSquadCommand(squadId, text, source = 'chatbot') {
    try {
        const res = await fetch(
            `${CLAUDE_SQUAD_API_BASE}/api/squads/${encodeURIComponent(squadId)}/commands`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, source })
            }
        );
        if (!res.ok) throw new Error('소대 명령 추가 실패');
        return await res.json();
    } catch (e) {
        console.warn('[CSC] addSquadCommand 실패', e);
        return null;
    }
}
async function cscGetPendingCommands(squadId) {
    try {
        const res = await fetch(
            `${CLAUDE_SQUAD_API_BASE}/api/squads/${encodeURIComponent(squadId)}/commands?status=PENDING`
        );
        if (!res.ok) throw new Error('소대 명령 조회 실패');
        return await res.json();
    } catch (e) {
        console.warn('[CSC] getPendingCommands 실패', e);
        return [];
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
    // 아이콘 제거됨 - 이름만 표시
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
    const isDemo = chatBotData && (
        chatBotData.id === 'sunny-demo' ||
        (chatBotData.botName && chatBotData.botName.includes('DEMO'))
    );
    const visiblePersonas = chatBotData.personas
        .filter(p => p.isVisible !== false)
        .filter(p => isDemo || isOwnerView || p.isPublic !== false);
    // 플랫 렌더링: PC는 6개 한 줄, 모바일은 3개씩 2줄 (CSS가 처리)
    container.innerHTML = visiblePersonas.map(p => {
        const activeClass = (currentPersona && currentPersona.id === p.id) ? 'active' : '';
        return '<div class="persona-chip ' + activeClass + '" onclick="switchPersona(\'' + p.id + '\')">' +
            '<span class="persona-chip-name">' + p.name + '</span>' +
        '</div>';
    }).join('');
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
        '✅ <strong>' + newPersona.name + '</strong> 역할로 전환되었습니다.<br>' +
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
        speak('지금부터 ' + newPersona.name + ' 역할로 도와드릴게요.');
    }
    // 페르소나 전환 시 FAQ 버튼도 갱신
    renderFaqButtons();
}
function renderFaqButtons() {
    const container = document.getElementById('faqButtons');
    if (!container) return;
    // 페르소나별 FAQ가 있으면 우선, 없으면 봇 전체 FAQ 폴백
    const faqs = (currentPersona && currentPersona.faqs && currentPersona.faqs.length > 0)
        ? currentPersona.faqs
        : chatBotData?.faqs;
    if (!faqs || faqs.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = faqs.map(f =>
        `<button class="faq-btn" onclick="askFaq('${f.q.replace(/'/g, "\\'")}', '${(f.a || '').replace(/'/g, "\\'")}')">${f.q}</button>`
    ).join('');
}
async function sendMessage() {
    // 사용자 제스처 시점에 Audio unlock (이 시점이어야 모바일에서 작동)
    unlockTTS();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || isBotTyping) return;
    input.value = '';
    // Reset height
    input.style.height = 'auto';
    addMessage('user', text);
    showTyping();
    conversationHistory.push({ role: 'user', content: text });
    // 페르소나별 대화 저장
    savePerPersonaMessage('user', text);
    // === Claude Squad Control 연동: 업무 도우미 페르소나일 때 소대 명령으로도 전달 ===
    try {
        if (currentPersona && currentPersona.id === 'sunny_helper_work') {
            cscAddSquadCommand('claude-squad-1', text, 'chatbot-mobile')
                .catch(e => console.warn('[CSC] 명령 전송 실패', e));
        }
    } catch (e) {
        console.warn('[CSC] 연동 중 예외', e);
    }
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
    // 페르소나별 대화 + 통계 저장
    savePerPersonaMessage('assistant', response);
    logPerPersonaStat('message', { role: 'user', content: text });
    logPerPersonaStat('message', { role: 'assistant', content: response });
    if (voiceOutputEnabled) speak(response);
}
function askFaq(q, a) {
    unlockTTS();
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
    if (sender === 'system') {
        div.innerHTML = `<div class="message-bubble">${text}</div>`;
    } else if (sender === 'bot') {
        div.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-bubble">${text}</div>
        `;
    } else {
        div.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-bubble">${text}</div>
        `;
    }
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
// TTS: unlock된 _ttsPlayer에 Google Translate TTS src를 넣어서 재생
function speak(text) {
    if (!voiceOutputEnabled) return;
    var clean = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!clean) return;
    if (clean.length > 200) clean = clean.substring(0, 200);
    var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=' + encodeURIComponent(clean);
    // unlock된 동일 Audio 요소에 src만 교체하여 재생
    _ttsPlayer.pause();
    _ttsPlayer.currentTime = 0;
    _ttsPlayer.src = url;
    _ttsPlayer.volume = 1.0;
    _ttsPlayer.play().then(function () {
        console.log('[TTS] Playing');
    }).catch(function (e) {
        console.warn('[TTS] Play failed:', e.message);
        // 폴백: SpeechSynthesis
        if (window.speechSynthesis) {
            var u = new SpeechSynthesisUtterance(clean);
            u.lang = 'ko-KR';
            window.speechSynthesis.speak(u);
        }
    });
}
// STT
let chatRecognition = null;
function toggleChatVoice() {
    unlockTTS(); // Unlock audio context when using STT too
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
// === Per-persona 대화/통계 저장 (home.js와 키 일치) ===
function savePerPersonaMessage(role, content) {
    if (!chatBotData || !currentPersona) return;
    var botId = chatBotData.id;
    var personaId = currentPersona.id;
    var key = 'mcw_conv_' + botId + '_' + personaId;
    var convs = JSON.parse(localStorage.getItem(key) || '[]');
    convs.push({ role: role, content: content, timestamp: new Date().toISOString() });
    if (convs.length > 200) convs.splice(0, convs.length - 200);
    localStorage.setItem(key, JSON.stringify(convs));
}

function logPerPersonaStat(type, data) {
    if (!chatBotData || !currentPersona) return;
    var botId = chatBotData.id;
    var personaId = currentPersona.id;
    var key = 'mcw_stats_' + botId + '_' + personaId;
    var stats = JSON.parse(localStorage.getItem(key) || '{"totalConversations":0,"totalMessages":0}');
    if (type === 'conversation_start') {
        stats.totalConversations = (stats.totalConversations || 0) + 1;
    } else if (type === 'message') {
        stats.totalMessages = (stats.totalMessages || 0) + 1;
    }
    localStorage.setItem(key, JSON.stringify(stats));
}

// === Per-message TTS: 사용자가 직접 탭하여 재생 (모바일 제스처 보장) ===
function playMsgTTS(btn) {
    // Extract text from the parent bubble element
    var bubble = btn.parentElement;
    if (!bubble) return;
    var clean = bubble.textContent.replace(/🔊/g, '').trim();
    if (!clean) return;
    if (clean.length > 200) clean = clean.substring(0, 200);
    // 재생 중이면 중지
    if (btn.classList.contains('playing')) {
        _ttsPlayer.pause();
        _ttsPlayer.currentTime = 0;
        btn.classList.remove('playing');
        return;
    }
    // 다른 버튼의 playing 상태 초기화
    document.querySelectorAll('.msg-tts-btn.playing').forEach(function(b) {
        b.classList.remove('playing');
    });
    var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=' + encodeURIComponent(clean);
    _ttsPlayer.pause();
    _ttsPlayer.currentTime = 0;
    _ttsPlayer.src = url;
    _ttsPlayer.volume = 1.0;
    btn.classList.add('playing');
    _ttsPlayer.play().then(function() {
        console.log('[TTS] Playing via button tap');
    }).catch(function(e) {
        console.warn('[TTS] Play failed:', e.message);
        btn.classList.remove('playing');
        // 폴백: SpeechSynthesis
        if (window.speechSynthesis) {
            var u = new SpeechSynthesisUtterance(clean);
            u.lang = 'ko-KR';
            window.speechSynthesis.speak(u);
        }
    });
    _ttsPlayer.onended = function() {
        btn.classList.remove('playing');
    };
}
