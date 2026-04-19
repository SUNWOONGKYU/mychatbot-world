/**
 * @task S2F5 (S2F3 기반)
 * Chat Interface JavaScript - v10.6 VAD VOICE INPUT
 * Includes "Audio Context Unlock" for mobile browsers.
 * VAD (Voice Activity Detection) via @ricky0123/vad-web replaces 4s silence timer.
 * Falls back to 4s silence timer if VAD fails to initialize.
 */
let chatBotData = null;
let conversationHistory = [];
let isBotTyping = false;
let voiceOutputEnabled = true;
// Mobile Audio: AudioContext 방식 (unlock 후 async에서도 재생 가능)
let _ttsPlayer = new Audio(); // fallback용 유지
let _ttsUnlocked = false;
let _ttsVoice = localStorage.getItem('mcw_tts_voice') || 'fable';
let _audioCtx = null;        // AudioContext (iOS 호환 TTS)
let _audioSource = null;     // 현재 재생 중인 BufferSource
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof CoCoBot !== 'undefined' && CoCoBot.ready) await CoCoBot.ready;
    // Sync skill catalog from server (non-blocking)
    if (typeof CoCoBot !== 'undefined' && CoCoBot.syncSkills) CoCoBot.syncSkills();
    // Security: purge any leaked API keys from localStorage
    localStorage.removeItem('mcw_openrouter_key');
    await loadBotData();
    renderPersonaSelector();
    autoResizeInput();
    // Voice Toggle
    const voiceBtn = document.getElementById('voiceToggle');
    if (voiceBtn) {
        voiceBtn.textContent = '🔊';
        voiceBtn.addEventListener('click', () => {
            voiceOutputEnabled = !voiceOutputEnabled;
            voiceBtn.textContent = voiceOutputEnabled ? '🔊' : '🔇';
            if (!voiceOutputEnabled) {
                // 재생 중인 AudioContext 소스 + Audio 모두 중지
                if (_audioSource) { try { _audioSource.stop(); } catch(e) {} _audioSource = null; }
                _ttsPlayer.pause();
            }
        });
    }
    // Voice Select
    const voiceSelect = document.getElementById('voiceSelect');
    if (voiceSelect) {
        voiceSelect.value = _ttsVoice;
        voiceSelect.addEventListener('change', () => {
            _ttsVoice = voiceSelect.value;
            localStorage.setItem('mcw_tts_voice', _ttsVoice);
        });
    }
    // Theme: restore saved preference
    initTheme();
});
// 사용자 제스처 시점에 AudioContext unlock (전송 버튼, 터치 등에서 호출)
function unlockTTS() {
    if (_ttsUnlocked) return;
    try {
        if (!_audioCtx) {
            _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (_audioCtx.state === 'suspended') {
            _audioCtx.resume();
        }
        _ttsUnlocked = true;
        console.log('[TTS] AudioContext unlocked, state:', _audioCtx.state);
    } catch (e) {
        console.warn('[TTS] AudioContext unlock failed:', e.message);
    }
}
// === Theme (Dark/Light) ===
function initTheme() {
    let saved = localStorage.getItem('mcw_theme') || 'dark';
    applyTheme(saved);
}
function applyTheme(theme) {
    let body = document.querySelector('.chat-body');
    if (!body) return;
    if (theme === 'light') {
        body.classList.add('light');
    } else {
        body.classList.remove('light');
    }
    localStorage.setItem('mcw_theme', theme);
    let btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
}
function toggleTheme() {
    let current = localStorage.getItem('mcw_theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

async function loadBotData() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    // /bot/:username 경로에서 username 추출
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const usernameFromPath = pathParts[0] === 'bot' ? pathParts[1] : null;

    const bots = CoCoBot.storage.getBots();
    if (idParam) {
        chatBotData = bots.find(b => b.id === idParam);
    }
    // id로 못 찾으면 username으로 로컬 검색
    if (!chatBotData && usernameFromPath) {
        chatBotData = CoCoBot.storage.getBotByUsername(usernameFromPath);
    }
    // 로컬에 없으면 클라우드에서 로드
    if (!chatBotData && typeof StorageManager !== 'undefined' && StorageManager.loadBotFromCloud) {
        try {
            const key = idParam || usernameFromPath;
            const cloudBot = key ? await StorageManager.loadBotFromCloud(key) : null;
            if (cloudBot) {
                CoCoBot.storage.saveBot(cloudBot);
                chatBotData = cloudBot;
                console.log('[Chat] Bot loaded from cloud:', key);
            }
        } catch (e) { console.warn('[Chat] cloud bot load failed:', e); }
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
                botName: 'Bot',
                username: 'bot',
                personality: 'AI 코코봇입니다.',
                greeting: '안녕하세요! 무엇이든 물어보세요.',
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
    document.title = `${chatBotData.botName} - CoCoBot`;

    // 봇에 저장된 음성이 있으면 기본값으로 사용
    if (chatBotData.voice) {
        _ttsVoice = chatBotData.voice;
        localStorage.setItem('mcw_tts_voice', _ttsVoice);
        const voiceSelect = document.getElementById('voiceSelect');
        if (voiceSelect) voiceSelect.value = _ttsVoice;
    }

    // 환영 문구: 페르소나가 1개면 바로 인사, 여러 개면 선택 안내
    const welcomeTitleEl = document.getElementById('welcomeTitle');
    const welcomeDescEl = document.getElementById('welcomeDesc');
    if (chatBotData.personas.length <= 1) {
        if (welcomeTitleEl) welcomeTitleEl.textContent = chatBotData.botName;
        if (welcomeDescEl) welcomeDescEl.textContent = currentPersona.greeting || currentPersona.role || chatBotData.greeting || '';
    } else {
        if (welcomeTitleEl) welcomeTitleEl.textContent = `${chatBotData.botName}`;
        if (welcomeDescEl) welcomeDescEl.textContent = chatBotData.greeting || '페르소나를 선택해주세요!';
    }

    renderFaqButtons();
    if (conversationHistory.length === 0) {
        setTimeout(() => addMessage('system', '대화할 준비가 되었습니다.'), 500);
        logPerPersonaStat('conversation_start');
    }
    // 페어링 코드 필요 시 프롬프트 표시
    if (chatBotData.dmPolicy === 'pairing' && !_userPairingCode) {
        setTimeout(showPairingPrompt, 600);
    }
    // 소유자이거나 도우미 페르소나 직접 진입 시 CPC 바 자동 표시
    if (cpcIsHelper(currentPersona)) {
        cpcShowBar();
    }
}
// HTML escape for untrusted content in system messages
function escapeHtml(str) {
    let div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
        if (typeof CoCoBot !== 'undefined' && CoCoBot.user && CoCoBot.user.getCurrentUser && chatBotData.ownerId) {
            const u = CoCoBot.user.getCurrentUser();
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
    // 대외용(avatar) / 대내용(helper) 구분 렌더링: 4개씩 2줄
    let avatars = visiblePersonas.filter(function(p) { return p.category === 'avatar'; });
    let helpers = visiblePersonas.filter(function(p) { return p.category !== 'avatar'; });
    function createChip(p, typeClass) {
        let chip = document.createElement('div');
        chip.className = 'persona-chip ' + typeClass + ((currentPersona && currentPersona.id === p.id) ? ' active' : '');
        chip.setAttribute('data-persona-id', p.id);
        chip.onclick = function() { switchPersona(p.id); };
        let nameSpan = document.createElement('span');
        nameSpan.className = 'persona-chip-name';
        nameSpan.textContent = p.name;
        chip.appendChild(nameSpan);
        return chip;
    }
    container.innerHTML = '';
    if (avatars.length) {
        let row1 = document.createElement('div');
        row1.className = 'persona-row persona-row-public';
        avatars.forEach(function(p) { row1.appendChild(createChip(p, 'chip-public')); });
        container.appendChild(row1);
    }
    if (helpers.length) {
        let row2 = document.createElement('div');
        row2.className = 'persona-row persona-row-private';
        helpers.forEach(function(p) { row2.appendChild(createChip(p, 'chip-private')); });
        container.appendChild(row2);
    }
    container.style.display = visiblePersonas.length ? 'flex' : 'none';
}
function switchPersona(id) {
    if (!chatBotData || !chatBotData.personas) return;
    const newPersona = chatBotData.personas.find(p => String(p.id) === String(id));
    if (!newPersona || (currentPersona && currentPersona.id === newPersona.id)) return;
    currentPersona = newPersona;
    // 페르소나 전환 시 대화 히스토리 초기화 (이전 페르소나 맥락 오염 방지)
    conversationHistory = [];
    document.querySelectorAll('.persona-chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-persona-id') === String(id));
    });
    addMessage(
        'system',
        '✅ <strong>' + escapeHtml(newPersona.name) + '</strong> 역할로 전환되었습니다.<br>' +
        '<span style="font-size:0.7em; opacity:0.7;">' +
        escapeHtml(newPersona.role || '') + ' | ' + escapeHtml((newPersona.model || 'MODEL').toUpperCase()) +
        '</span>'
    );
    const welcomeEl = document.getElementById('chatWelcome');
    if (welcomeEl) welcomeEl.style.display = 'none';
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
    // CPC 바: Claude 연락병 페르소나일 때만 표시
    if (cpcIsHelper(newPersona)) {
        cpcShowBar();
    } else {
        cpcHideBar();
    }
}
function renderFaqButtons() {
    const container = document.getElementById('faqButtons');
    if (!container) return;
    // 페르소나별 FAQ가 있으면 우선, 없으면 봇 전체 FAQ 폴백
    const faqs = (currentPersona && currentPersona.faqs && currentPersona.faqs.length > 0)
        ? currentPersona.faqs
        : chatBotData?.faqs;
    if (!faqs || faqs.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = '';
    faqs.forEach(function(f) {
        let btn = document.createElement('button');
        btn.className = 'faq-btn';
        btn.textContent = f.q;
        btn.onclick = function() { askFaq(f.q, f.a || ''); };
        container.appendChild(btn);
    });
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
    // Channel adapter: relay user input
    if (typeof CoCoBot !== 'undefined' && CoCoBot.channels) {
        const wc = CoCoBot.channels.get('webchat');
        if (wc && wc.relayUserMessage) wc.relayUserMessage(text);
    }
    showTyping();
    conversationHistory.push({ role: 'user', content: text });
    // 페르소나별 대화 저장
    savePerPersonaMessage('user', text);
    // === CPC 양방향 연동: 소대 선택 시 해당 소대로 명령 전달 (병렬 실행, 표시는 봇 응답 후) ===
    let _cpcCmdPromise = null;
    if (_cpcSelectedId) {
        _cpcCmdPromise = cpcAddCommand(_cpcSelectedId, text, 'chatbot')
            .catch(e => { console.warn('[CPC] 명령 전송 실패', e); return null; });
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

    // Silent Reply: CPC 릴레이 시 AI 응답 표시 생략 (exact match only)
    const isSilent = response && response.trim() === '__SILENT__';
    if (isSilent) {
        console.log('[Silent Reply] CPC relay — AI response suppressed');
    } else {
        // 스트리밍으로 이미 표시된 경우 중복 방지
        const streamedDiv = document.querySelector('.message-bot:last-child');
        if (!streamedDiv || !streamedDiv._streamComplete) {
            addMessage('bot', response);
        }
        conversationHistory.push({ role: 'assistant', content: response });
        savePerPersonaMessage('assistant', response);
        logPerPersonaStat('message', { role: 'user', content: text });
        logPerPersonaStat('message', { role: 'assistant', content: response });
        if (voiceOutputEnabled) speak(response);
    }
    // CPC 시스템 메시지: 봇 응답 표시 후에 나와야 함
    if (_cpcCmdPromise) {
        const cmd = await _cpcCmdPromise;
        if (cmd) {
            // 클로저 안전: 지금 값을 로컬 변수로 고정
            const cmdId = cmd.id;
            const platoonId = _cpcSelectedId;
            const cmdText = text;
            console.log('[CPC] 명령 전달 완료:', platoonId, cmdId);
            addMessage('system', '[CPC] 소대장에게 전달됨 → ' + escapeHtml(platoonId) + ' · 답변 대기 중...');
            // 연속 폴러에 등록 (페이지 새로고침 전까지 계속 추적)
            cpcTrackCommand(cmd);
            // 소대장(Claude Code) 처리 대기 폴링 → 타임아웃 시 Vercel AI 폴백
            cpcWaitForResult(cmdId, platoonId, cmdText);
        }
    }
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
function addMessage(sender, text, extraClass) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `message message-${sender}`;
    if (sender === 'system') {
        // System messages are internal — HTML allowed
        div.innerHTML = `<div class="message-bubble${extraClass ? ' ' + extraClass : ''}">${text}</div>`;
    } else {
        // User/bot messages: use textContent to prevent XSS
        let avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'bot' ? '🤖' : '👤';
        let bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        // claude.ai/code URL → 클릭 가능 링크 (XSS-safe: escapeHtml 후 URL만 <a>로 변환)
        if (sender === 'bot' && /https:\/\/claude\.ai\/code[?/]/.test(text) && typeof cpcSafeHtml === 'function') {
            bubble.innerHTML = cpcSafeHtml(text);
        } else {
            bubble.textContent = text;
        }
        div.appendChild(avatar);
        div.appendChild(bubble);
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
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
function getDefaultUserTitle(persona) {
    if (!persona) return '';
    if (persona.name === 'Claude 연락병') return '지휘관님';
    return persona.category === 'avatar' ? '고객님' : '님';
}
// ─── Pairing Code (DM policy) ───
let _userPairingCode = '';

function showPairingPrompt() {
    let container = document.getElementById('chatMessages');
    if (!container) return;
    let div = document.createElement('div');
    div.className = 'message message-system';
    div.id = 'pairingPrompt';
    let bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.style.textAlign = 'center';

    let label = document.createElement('span');
    label.textContent = '🔒 이 봇은 페어링 코드가 필요합니다.';
    bubble.appendChild(label);
    bubble.appendChild(document.createElement('br'));

    let input = document.createElement('input');
    input.type = 'text';
    input.id = 'pairingCodeInput';
    input.placeholder = '페어링 코드 입력';
    input.maxLength = 6;
    input.style.cssText = 'margin-top:8px;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:white;text-align:center;font-size:1.1rem;letter-spacing:2px;';
    bubble.appendChild(input);
    bubble.appendChild(document.createElement('br'));

    let btn = document.createElement('button');
    btn.textContent = '확인';
    btn.style.cssText = 'margin-top:8px;padding:6px 16px;border-radius:8px;border:none;background:#6366f1;color:white;cursor:pointer;';
    btn.onclick = submitPairingCode;
    bubble.appendChild(btn);

    div.appendChild(bubble);
    container.appendChild(div);

    // Enter key support
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') submitPairingCode();
    });
}

function submitPairingCode() {
    let input = document.getElementById('pairingCodeInput');
    if (!input) return;
    _userPairingCode = input.value.trim().toUpperCase();
    let prompt = document.getElementById('pairingPrompt');
    if (prompt) prompt.remove();
    if (_userPairingCode) {
        addMessage('system', '🔓 페어링 코드가 입력되었습니다.');
    }
}

// ─── Collect installed skills for botConfig ───
function getInstalledSkillsForPersona() {
    if (!chatBotData || !currentPersona) return [];
    let botId = chatBotData.id;
    let personaId = currentPersona.id;
    let installed;
    try { installed = JSON.parse(localStorage.getItem('mcw_skills_' + botId + '_' + personaId) || '[]'); }
    catch (e) { installed = []; }
    // Merge with full skill data (including systemPrompt) from CoCoBot.skills
    if (typeof CoCoBot !== 'undefined' && CoCoBot.skills) {
        return installed.map(function(s) {
            let full = CoCoBot.skills.find(function(sk) { return sk.id === s.id; });
            return full ? { id: full.id, name: full.name, systemPrompt: full.systemPrompt || '' } : s;
        });
    }
    return installed;
}

async function generateResponse(userText) {
    const start = Date.now();

    // Collect installed skills with systemPrompt
    const skills = getInstalledSkillsForPersona();

    // Resolve userId for DM policy (allowlist/pairing)
    let userId = 'anon';
    try {
        if (typeof CoCoBot !== 'undefined' && CoCoBot.user && CoCoBot.user.getCurrentUser) {
            const u = CoCoBot.user.getCurrentUser();
            if (u && u.email) userId = u.email;
        }
    } catch (e) {}

    const payload = {
        message: userText,
        userId: userId,
        botConfig: {
            botName: chatBotData && chatBotData.botName,
            personality: (currentPersona && currentPersona.role) || (chatBotData && chatBotData.personality),
            tone: (chatBotData && chatBotData.tone) || '',
            faqs: (currentPersona && currentPersona.faqs && currentPersona.faqs.length > 0)
                ? currentPersona.faqs
                : (chatBotData && chatBotData.faqs) || [],
            personaName: currentPersona && currentPersona.name,
            personaCategory: currentPersona && currentPersona.category,
            userTitle: (currentPersona && currentPersona.userTitle)
                || getDefaultUserTitle(currentPersona),
            skills: skills,
            cpcPlatoons: (typeof cpcIsHelper === 'function' && cpcIsHelper(currentPersona) && typeof _cpcPlatoons !== 'undefined') ? _cpcPlatoons : undefined,
            dmPolicy: chatBotData && chatBotData.dmPolicy,
            allowedUsers: chatBotData && chatBotData.allowedUsers,
            pairingCode: chatBotData && chatBotData.pairingCode,
            userPairingCode: _userPairingCode,
            personaId: currentPersona && currentPersona.id,
            ownerId: chatBotData && chatBotData.ownerId
        },
        history: conversationHistory.slice(-10)
    };

    // Run before_send hook
    if (typeof CoCoBot !== 'undefined' && CoCoBot.hooks) {
        try {
            const modified = await CoCoBot.hooks.run('before_send', payload);
            if (modified && modified.message) payload.message = modified.message;
        } catch (e) { console.warn('[Hook] before_send error:', e); }
    }

    // 1차: SSE 스트리밍 시도
    try {
        const streamRes = await fetch('/api/chat-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (streamRes.ok && streamRes.body) {
            const reader = streamRes.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            // 타이핑 인디케이터를 실시간 메시지로 교체
            hideTyping();
            const streamDiv = document.createElement('div');
            streamDiv.className = 'message message-bot';
            streamDiv.innerHTML = '<div class="message-avatar">🤖</div><div class="message-bubble"><span class="message-text"></span></div>';
            const container = document.getElementById('chatMessages');
            if (container) {
                container.appendChild(streamDiv);
                container.scrollTop = container.scrollHeight;
            }
            const textEl = streamDiv.querySelector('.message-text');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // SSE 파싱: data: {...}\n\n
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const raw = line.slice(6).trim();
                        if (raw === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(raw);
                            if (parsed.text) {
                                fullText += parsed.text;
                                if (textEl) textEl.textContent = fullText;
                                if (container) container.scrollTop = container.scrollHeight;
                            }
                        } catch (e) { /* skip malformed chunk */ }
                    }
                }
            }

            if (fullText) {
                // claude.ai/code URL을 클릭 가능한 링크로 변환
                if (textEl && /https:\/\/claude\.ai\/code[?/]/.test(fullText)) {
                    textEl.innerHTML = typeof cpcSafeHtml === 'function' ? cpcSafeHtml(fullText) : escapeHtml(fullText);
                }
                // 스트리밍으로 이미 DOM에 표시됨 — 플래그로 표시
                streamDiv._streamComplete = true;
                const latency = Date.now() - start;
                console.log('[AI STREAM] /api/chat-stream ' + latency + 'ms');

                // Run after_receive hook
                if (typeof CoCoBot !== 'undefined' && CoCoBot.hooks) {
                    try { await CoCoBot.hooks.run('after_receive', { text: fullText }); } catch (e) {}
                }

                return fullText;
            }
            // 빈 응답이면 폴백
            if (streamDiv.parentNode) streamDiv.remove();
        }
    } catch (e) {
        console.warn('[API] /api/chat-stream error:', e.message);
    }

    // 2차: 비스트리밍 폴백 (/api/chat)
    try {
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

                // Run after_receive hook
                if (typeof CoCoBot !== 'undefined' && CoCoBot.hooks) {
                    try { await CoCoBot.hooks.run('after_receive', { text: data.reply }); } catch (e) {}
                }

                return data.reply;
            }
        } else {
            console.warn('[API] /api/chat failed', res.status);
        }
    } catch (e) {
        console.warn('[API] /api/chat error', e);
    }
    return '죄송합니다. 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';
}
// TTS: 1차 /api/tts + AudioContext (모바일 async 재생) → 2차 SpeechSynthesis
function speak(text) {
    if (!voiceOutputEnabled) return;
    let clean = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!clean) return;
    if (clean.length > 4096) clean = clean.substring(0, 4096);

    // 이전 재생 중지
    if (_audioSource) { try { _audioSource.stop(); } catch(e) {} _audioSource = null; }

    // AudioContext 확보 (없으면 생성)
    if (!_audioCtx) {
        try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }

    // 1차: /api/tts → ArrayBuffer → AudioContext.decodeAudioData → play
    fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice: _ttsVoice })
    }).then(function(res) {
        if (!res.ok) throw new Error('TTS API ' + res.status);
        let ct = res.headers.get('content-type') || '';
        if (ct.indexOf('audio') === -1) throw new Error('TTS not audio');
        return res.arrayBuffer();
    }).then(function(arrayBuf) {
        if (!_audioCtx) throw new Error('No AudioContext');
        return _audioCtx.decodeAudioData(arrayBuf);
    }).then(function(audioBuffer) {
        if (!voiceOutputEnabled) return;
        if (_audioSource) { try { _audioSource.stop(); } catch(e) {} }
        _audioSource = _audioCtx.createBufferSource();
        _audioSource.buffer = audioBuffer;
        _audioSource.connect(_audioCtx.destination);
        _audioSource.start(0);
        console.log('[TTS] OpenAI TTS-1 via AudioContext');
    }).catch(function(e) {
        console.warn('[TTS] fallback:', e.message);
        speakFallback(clean);
    });
}
// 2차: SpeechSynthesis (모바일 최우선) → 3차: Google Translate TTS
function speakFallback(clean) {
    // TTS fallback에서도 STT 중지
    if (typeof _sttRecorder !== 'undefined' && _sttRecorder && _sttRecorder.state === 'recording') {
        try { _sttRecorder.stop(); } catch(e) {}
        document.getElementById('chatVoiceBtn')?.classList.remove('recording');
    }
    if (window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
            let u = new SpeechSynthesisUtterance(clean);
            u.lang = 'ko-KR';
            u.rate = 1.0;
            window.speechSynthesis.speak(u);
            console.log('[TTS] SpeechSynthesis fallback');
            return;
        } catch (e) {
            console.warn('[TTS] SpeechSynthesis failed:', e);
        }
    }
    let url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=' + encodeURIComponent(clean);
    _ttsPlayer.pause();
    _ttsPlayer.currentTime = 0;
    _ttsPlayer.src = url;
    _ttsPlayer.volume = 1.0;
    _ttsPlayer.play().then(function () {
        console.log('[TTS] Google Translate fallback');
    }).catch(function () {
        console.warn('[TTS] All TTS methods failed');
    });
}
// STT — Whisper API (OpenAI) via MediaRecorder
// 마이크 녹음 → /api/stt (Whisper) → 정확한 한국어 텍스트
// VAD: @ricky0123/vad-web — 발화 경계 정확 감지 (폴백: 4초 무음 타이머)
let _sttRecorder = null;
let _sttStream = null;
let _sttChunks = [];
let _sttSilenceCtx = null;
let _sttSilenceTimer = null;

// VAD 상태
let _vadInstance = null;
let _vadReady = false;       // VAD 초기화 완료 여부
let _vadFailed = false;      // VAD 초기화 실패 → 폴백 사용
let _vadActive = false;      // VAD 세션 활성 여부 (버튼 토글 중)
let _vadScriptLoaded = false;

// VAD CDN 스크립트 동적 로드
function _loadVadScript() {
    return new Promise(function(resolve, reject) {
        if (_vadScriptLoaded && typeof vad !== 'undefined') { resolve(); return; }
        let s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.19/dist/bundle.min.js';
        s.crossOrigin = 'anonymous';
        s.onload = function() { _vadScriptLoaded = true; resolve(); };
        s.onerror = function() { reject(new Error('VAD CDN load failed')); };
        document.head.appendChild(s);
    });
}

// VAD 초기화 (최초 1회)
async function _initVad() {
    if (_vadReady || _vadFailed) return;
    try {
        await _loadVadScript();
        // @ricky0123/vad-web exposes global `vad` namespace
        const vadLib = (typeof vad !== 'undefined') ? vad : window.vad;
        if (!vadLib || !vadLib.MicVAD) throw new Error('vad.MicVAD not found');

        const VAD_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.19/dist';
        _vadInstance = await vadLib.MicVAD.new({
            // ONNX 모델 + Worklet + WASM 경로 명시 (CDN 기반)
            modelURL: VAD_CDN_BASE + '/silero_vad.onnx',
            workletURL: VAD_CDN_BASE + '/vad.worklet.bundle.min.js',
            ortConfig: function(ort) {
                ort.env.wasm.wasmPaths = VAD_CDN_BASE + '/';
            },
            // 발화 시작 감지
            onSpeechStart: function() {
                console.log('[VAD] Speech start detected');
                const btn = document.getElementById('chatVoiceBtn');
                const input = document.getElementById('chatInput');
                if (btn) btn.classList.add('recording');
                if (input) input.placeholder = '말씀하세요...';
            },
            // 발화 종료 감지 → 음성 데이터 전송
            onSpeechEnd: function(audioData) {
                console.log('[VAD] Speech end detected, samples:', audioData.length);
                if (!_vadActive) return;
                _onVadSpeechEnd(audioData);
            },
            // VAD 오류 핸들링
            onVADMisfire: function() {
                console.log('[VAD] Misfire (too short), ignored');
                const btn = document.getElementById('chatVoiceBtn');
                const input = document.getElementById('chatInput');
                if (btn) btn.classList.remove('recording');
                if (input) input.placeholder = '음성 입력 중... (다시 말씀해주세요)';
            }
        });

        _vadReady = true;
        console.log('[VAD] Initialized successfully');
    } catch (e) {
        console.warn('[VAD] Init failed, falling back to 4s silence timer:', e.message);
        _vadFailed = true;
    }
}

// VAD onSpeechEnd 처리: Float32Array → WAV Blob → /api/stt
function _onVadSpeechEnd(audioData) {
    const btn = document.getElementById('chatVoiceBtn');
    const input = document.getElementById('chatInput');
    if (btn) btn.classList.remove('recording');
    if (input) input.placeholder = '음성 변환 중...';

    // Float32Array → WAV Blob (PCM 16kHz mono)
    const wavBlob = _float32ToWavBlob(audioData, 16000);
    if (!wavBlob || wavBlob.size < 3000) {
        console.log('[VAD] Audio too short, skipped');
        if (input) input.placeholder = '음성 입력 중... (다시 말씀해주세요)';
        return;
    }

    let reader = new FileReader();
    reader.onloadend = function() {
        let base64 = reader.result.split(',')[1];
        fetch('/api/stt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64, language: 'ko' })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (input) input.placeholder = '음성 입력 중...';
            if (data.text && data.text.trim()) {
                input.value = data.text.trim();
                input.focus();
                // 자동 전송 안 함 — 유저가 직접 확인 후 전송
            }
        })
        .catch(function(err) {
            console.error('[VAD→STT] Whisper error:', err);
            if (input) input.placeholder = '음성 입력 중...';
        });
    };
    reader.readAsDataURL(wavBlob);
}

// Float32Array → WAV Blob 변환 헬퍼 (PCM mono)
function _float32ToWavBlob(samples, sampleRate) {
    const numSamples = samples.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    function writeStr(off, str) {
        for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
    }
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);        // PCM
    view.setUint16(22, 1, true);        // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }
    return new Blob([buffer], { type: 'audio/wav' });
}

// 메인 음성 입력 토글 함수 (VAD 우선, 폴백: 4초 타이머)
async function toggleChatVoice() {
    unlockTTS();
    const btn = document.getElementById('chatVoiceBtn');
    const input = document.getElementById('chatInput');

    // ── VAD 모드 ──────────────────────────────────────────────
    // VAD가 아직 초기화 시도 전이면 비동기 초기화 (1회만)
    if (!_vadReady && !_vadFailed) {
        if (input) input.placeholder = 'VAD 초기화 중...';
        await _initVad();
    }

    if (_vadReady && _vadInstance) {
        // VAD 세션 토글
        if (_vadActive) {
            // 비활성화
            _vadActive = false;
            try { _vadInstance.pause(); } catch(e) {}
            if (btn) btn.classList.remove('recording');
            if (input) input.placeholder = '메시지를 입력하세요...';
            console.log('[VAD] Session paused by user');
        } else {
            // 활성화
            _vadActive = true;
            try {
                await _vadInstance.start();
                if (btn) btn.classList.add('recording');
                if (input) input.placeholder = '음성 입력 중... (말씀하세요)';
                console.log('[VAD] Session started');
            } catch (e) {
                console.error('[VAD] Start failed:', e.message);
                // 마이크 권한 없는 경우
                if (e.name === 'NotAllowedError' || e.message.includes('Permission')) {
                    addMessage('system', '마이크 접근 권한이 없습니다. 브라우저 설정에서 마이크를 허용해주세요.');
                } else {
                    addMessage('system', '음성 입력 시작에 실패했습니다. 잠시 후 다시 시도해주세요.');
                }
                _vadActive = false;
                if (btn) btn.classList.remove('recording');
                if (input) input.placeholder = '메시지를 입력하세요...';
            }
        }
        return;
    }

    // ── 폴백: 4초 무음 타이머 (VAD 실패 시) ─────────────────
    console.log('[STT] Using fallback 4s silence timer');

    // 녹음 중이면 → 중지 & 전송
    if (_sttRecorder && _sttRecorder.state === 'recording') {
        _sttRecorder.stop();
        return;
    }

    // 마이크 스트림 요청
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
        _sttStream = stream;
        _sttChunks = [];

        let mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus' : 'audio/webm';
        _sttRecorder = new MediaRecorder(stream, { mimeType: mimeType });

        _sttRecorder.ondataavailable = function(e) {
            if (e.data.size > 0) _sttChunks.push(e.data);
        };

        _sttRecorder.onstart = function() {
            btn?.classList.add('recording');
            if (input) input.placeholder = '말씀하세요... (버튼 누르면 전송)';
            _sttStartSilenceDetection(stream);
        };

        _sttRecorder.onstop = function() {
            btn?.classList.remove('recording');
            if (input) input.placeholder = '메시지를 입력하세요...';
            _sttStopSilenceDetection();

            // 스트림 해제
            stream.getTracks().forEach(function(t) { t.stop(); });
            _sttStream = null;

            if (_sttChunks.length === 0) return;

            let blob = new Blob(_sttChunks, { type: mimeType });
            _sttChunks = [];

            // 너무 짧은 녹음 무시 (0.5초 미만)
            if (blob.size < 5000) { console.log('[STT] too short, skipped'); return; }

            if (input) input.placeholder = '음성 변환 중...';

            // base64 변환 후 /api/stt 호출
            let reader = new FileReader();
            reader.onloadend = function() {
                let base64 = reader.result.split(',')[1];
                fetch('/api/stt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audio: base64, language: 'ko' })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (input) input.placeholder = '메시지를 입력하세요...';
                    if (data.text && data.text.trim()) {
                        input.value = data.text.trim();
                        input.focus();
                        // 자동 전송 안 함 — 유저가 직접 확인 후 전송 (TTS 모바일 autoplay 허용 위해)
                    }
                })
                .catch(function(err) {
                    console.error('[STT] Whisper error:', err);
                    if (input) input.placeholder = '메시지를 입력하세요...';
                });
            };
            reader.readAsDataURL(blob);
        };

        _sttRecorder.start();

    }).catch(function(err) {
        console.error('[STT] mic error:', err);
        if (err.name === 'NotAllowedError') {
            addMessage('system', '마이크 접근 권한이 없습니다. 브라우저 설정에서 마이크를 허용해주세요.');
        } else {
            alert('마이크 접근에 실패했습니다.');
        }
    });
}

// 폴백: 4초 무음 감지 (VAD 실패 시 사용)
function _sttStartSilenceDetection(stream) {
    try {
        _sttSilenceCtx = new (window.AudioContext || window.webkitAudioContext)();
        let source = _sttSilenceCtx.createMediaStreamSource(stream);
        let analyser = _sttSilenceCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        let data = new Uint8Array(analyser.frequencyBinCount);
        let silenceStart = null;
        let SILENCE_THRESHOLD = 10;
        let SILENCE_DURATION = 4000;
        let hasSpeech = false;

        function check() {
            if (!_sttRecorder || _sttRecorder.state !== 'recording') return;
            analyser.getByteFrequencyData(data);
            let avg = 0;
            for (let i = 0; i < data.length; i++) avg += data[i];
            avg /= data.length;

            if (avg > SILENCE_THRESHOLD) {
                hasSpeech = true;
                silenceStart = null;
            } else if (hasSpeech) {
                if (!silenceStart) silenceStart = Date.now();
                if (Date.now() - silenceStart > SILENCE_DURATION) {
                    _sttRecorder.stop();
                    return;
                }
            }
            _sttSilenceTimer = requestAnimationFrame(check);
        }
        check();
    } catch(e) { console.warn('[STT] silence detection unavailable:', e); }
}

function _sttStopSilenceDetection() {
    if (_sttSilenceTimer) { cancelAnimationFrame(_sttSilenceTimer); _sttSilenceTimer = null; }
    if (_sttSilenceCtx) { _sttSilenceCtx.close().catch(function(){}); _sttSilenceCtx = null; }
}
function autoResizeInput() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    });
}
// === Per-persona 대화/통계 저장 (localStorage + Supabase) ===
let _chatSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

function savePerPersonaMessage(role, content) {
    if (!chatBotData || !currentPersona) return;
    let botId = chatBotData.id;
    let personaId = currentPersona.id;
    let timestamp = new Date().toISOString();

    // localStorage (기존 호환)
    let key = 'mcw_conv_' + botId + '_' + personaId;
    let convs;
    try { convs = JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (e) { convs = []; }
    convs.push({ role: role, content: content, timestamp: timestamp });
    if (convs.length > 200) convs.splice(0, convs.length - 200);
    localStorage.setItem(key, JSON.stringify(convs));

    // Supabase mcw_chat_logs (비동기, 실패해도 무시)
    if (typeof StorageManager !== 'undefined' && StorageManager.getSupabase) {
        let sb = StorageManager.getSupabase();
        if (sb) {
            sb.from('mcw_chat_logs').insert({
                bot_id: botId,
                persona_id: personaId,
                role: role,
                content: content,
                session_id: _chatSessionId
            }).then(function(res) {
                if (res.error) console.warn('[Chat] cloud log error:', res.error.message);
            }).catch(function(e) { console.warn('[Chat] cloud log failed:', e); });
        }
    }
}

function logPerPersonaStat(type, data) {
    if (!chatBotData || !currentPersona) return;
    let botId = chatBotData.id;
    let personaId = currentPersona.id;
    let key = 'mcw_stats_' + botId + '_' + personaId;
    let stats;
    try { stats = JSON.parse(localStorage.getItem(key) || '{}'); }
    catch (e) { stats = {}; }
    stats.totalConversations = stats.totalConversations || 0;
    stats.totalMessages = stats.totalMessages || 0;
    if (type === 'conversation_start') {
        stats.totalConversations = (stats.totalConversations || 0) + 1;
    } else if (type === 'message') {
        stats.totalMessages = (stats.totalMessages || 0) + 1;
    }
    localStorage.setItem(key, JSON.stringify(stats));
}

// === Per-message TTS: 사용자가 직접 탭하여 재생 (모바일 제스처 보장) ===
function playMsgTTS(btn) {
    let bubble = btn.parentElement;
    if (!bubble) return;
    let clean = bubble.textContent.replace(/🔊/g, '').trim();
    if (!clean) return;
    if (clean.length > 4096) clean = clean.substring(0, 4096);
    if (btn.classList.contains('playing')) {
        _ttsPlayer.pause();
        _ttsPlayer.currentTime = 0;
        btn.classList.remove('playing');
        return;
    }
    document.querySelectorAll('.msg-tts-btn.playing').forEach(function(b) {
        b.classList.remove('playing');
    });
    btn.classList.add('playing');
    // 1차: /api/tts (OpenAI TTS-1) → 2차: SpeechSynthesis → 3차: Google Translate
    fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice: _ttsVoice })
    }).then(function(res) {
        if (!res.ok) throw new Error('TTS API ' + res.status);
        let ct = res.headers.get('content-type') || '';
        if (ct.indexOf('audio') === -1) throw new Error('Not audio');
        return res.blob();
    }).then(function(blob) {
        let blobUrl = URL.createObjectURL(blob);
        _ttsPlayer.pause();
        _ttsPlayer.currentTime = 0;
        _ttsPlayer.src = blobUrl;
        _ttsPlayer.volume = 1.0;
        _ttsPlayer.play();
        _ttsPlayer.onended = function() {
            btn.classList.remove('playing');
            URL.revokeObjectURL(blobUrl);
        };
    }).catch(function() {
        // 폴백: SpeechSynthesis 우선
        if (window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
                let u = new SpeechSynthesisUtterance(clean);
                u.lang = 'ko-KR';
                u.onend = function() { btn.classList.remove('playing'); };
                window.speechSynthesis.speak(u);
                return;
            } catch (e) { /* fall through */ }
        }
        // Google Translate TTS (최후 수단)
        let url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=' + encodeURIComponent(clean);
        _ttsPlayer.pause();
        _ttsPlayer.currentTime = 0;
        _ttsPlayer.src = url;
        _ttsPlayer.volume = 1.0;
        _ttsPlayer.play().catch(function() { btn.classList.remove('playing'); });
        _ttsPlayer.onended = function() { btn.classList.remove('playing'); };
    });
}
