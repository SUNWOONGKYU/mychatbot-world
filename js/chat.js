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
var _ttsVoice = localStorage.getItem('mcw_tts_voice') || 'fable';
// 대기 중인 TTS 텍스트 (API 응답 후 재생할 내용)
var _ttsPending = null;
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof MCW !== 'undefined' && MCW.ready) await MCW.ready;
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
            if (!voiceOutputEnabled) { _ttsPlayer.pause(); }
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

async function loadBotData() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const bots = MCW.storage.getBots();
    if (idParam) {
        chatBotData = bots.find(b => b.id === idParam);
    }
    // 로컬에 없으면 클라우드에서 로드
    if (!chatBotData && idParam && typeof StorageManager !== 'undefined' && StorageManager.loadBotFromCloud) {
        try {
            const cloudBot = await StorageManager.loadBotFromCloud(idParam);
            if (cloudBot) {
                MCW.storage.saveBot(cloudBot);
                chatBotData = cloudBot;
                console.log('[Chat] Bot loaded from cloud:', idParam);
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
                personality: 'AI 챗봇입니다.',
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
    document.title = `${chatBotData.botName} - My Chatbot World`;

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
    // 소유자이거나 도우미 페르소나 직접 진입 시 CPC 바 자동 표시
    if (cpcIsOwner() || cpcIsHelper(currentPersona)) {
        cpcShowBar();
    }
}
// === CPC (Claude Platoons Control) 양방향 연동 ===
const CPC_API_BASE = 'https://claude-platoons-control.vercel.app';
let _cpcPlatoons = [];           // 캐시된 소대 목록
let _cpcSelectedId = '';         // 현재 선택된 소대 ID
let _cpcTrackedCmds = [];       // 추적 중인 명령 [{id, status, text}]
let _cpcPollTimer = null;        // 폴링 타이머
const CPC_POLL_INTERVAL = 3000;  // 3초 폴링

// --- CPC API 호출 ---
async function cpcFetch(path, options = {}) {
    try {
        const res = await fetch(`${CPC_API_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!res.ok) throw new Error(`CPC ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn('[CPC]', path, e.message);
        return null;
    }
}

async function cpcGetPlatoons() {
    return (await cpcFetch('/api/platoons')) || [];
}

async function cpcAddCommand(platoonId, text, source = 'chatbot') {
    return await cpcFetch(
        `/api/platoons/${encodeURIComponent(platoonId)}/commands`,
        { method: 'POST', body: JSON.stringify({ text, source }) }
    );
}

async function cpcGetCommands(platoonId, status) {
    const qs = status ? `?status=${status}` : '';
    return (await cpcFetch(`/api/platoons/${encodeURIComponent(platoonId)}/commands${qs}`)) || [];
}

async function cpcUpdatePlatoonStatus(platoonId, status) {
    return await cpcFetch(
        `/api/platoons/${encodeURIComponent(platoonId)}/status`,
        { method: 'PATCH', body: JSON.stringify({ status }) }
    );
}

// --- 양방향: 명령 추적 + 폴링 ---
function cpcTrackCommand(cmd) {
    if (!cmd || !cmd.id) return;
    _cpcTrackedCmds.push({ id: cmd.id, status: cmd.status, text: cmd.text });
    cpcStartPolling();
}

function cpcStartPolling() {
    if (_cpcPollTimer) return;
    _cpcPollTimer = setInterval(cpcPollTrackedCommands, CPC_POLL_INTERVAL);
}

function cpcStopPolling() {
    if (_cpcPollTimer) { clearInterval(_cpcPollTimer); _cpcPollTimer = null; }
}

async function cpcPollTrackedCommands() {
    if (_cpcTrackedCmds.length === 0 || !_cpcSelectedId) { cpcStopPolling(); return; }

    const allCmds = await cpcGetCommands(_cpcSelectedId);
    if (!allCmds) return;

    const remaining = [];
    for (const tracked of _cpcTrackedCmds) {
        const fresh = allCmds.find(c => c.id === tracked.id);
        if (!fresh) { remaining.push(tracked); continue; }

        if (fresh.status !== tracked.status) {
            if (fresh.status === 'ACKED' && tracked.status === 'PENDING') {
                addMessage('system', `[CPC] 소대장이 명령을 수신했습니다: "${tracked.text}"`);
            }
            if (fresh.status === 'DONE') {
                const resultMsg = fresh.result
                    ? `[CPC] 명령 완료: "${tracked.text}"\n결과: ${fresh.result}`
                    : `[CPC] 명령 완료: "${tracked.text}"`;
                addMessage('system', resultMsg);
                continue; // DONE이면 추적 종료
            }
            tracked.status = fresh.status;
        }
        remaining.push(tracked);
    }
    _cpcTrackedCmds = remaining;
    if (_cpcTrackedCmds.length === 0) cpcStopPolling();

    // 소대 상태 실시간 업데이트
    cpcRefreshPlatoonStatus();
}

async function cpcRefreshPlatoonStatus() {
    const fresh = await cpcGetPlatoons();
    if (!fresh || fresh.length === 0) return;
    _cpcPlatoons = fresh;
    // 드롭다운의 상태 텍스트 업데이트
    const select = document.getElementById('cpcPlatoonSelect');
    if (!select) return;
    for (const p of fresh) {
        const opt = select.querySelector(`option[value="${p.id}"]`);
        if (opt) opt.textContent = (p.name || p.id) + ' [' + p.status + ']';
    }
    // CPC 바 상태 표시
    const statusEl = document.getElementById('cpcStatus');
    if (statusEl && _cpcSelectedId) {
        const sel = fresh.find(p => p.id === _cpcSelectedId);
        statusEl.textContent = sel ? sel.status : '';
        statusEl.className = 'cpc-status' + (sel && sel.status === 'RUNNING' ? ' cpc-running' : '');
    }
}

// --- CPC 소대 선택 바 ---
async function cpcShowBar() {
    const bar = document.getElementById('cpcBar');
    const select = document.getElementById('cpcPlatoonSelect');
    if (!bar || !select) return;
    bar.style.display = '';

    if (_cpcPlatoons.length === 0) {
        _cpcPlatoons = await cpcGetPlatoons();
    }

    // 프로젝트별 그룹핑
    const groups = {};
    _cpcPlatoons.forEach(p => {
        const parts = p.id.match(/^(.+)-(\d+)$/);
        const project = parts ? parts[1] : p.id;
        if (!groups[project]) groups[project] = [];
        groups[project].push(p);
    });

    select.innerHTML = '<option value="">소대 선택...</option>';
    Object.keys(groups).sort().forEach(project => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = groups[project][0].name
            ? groups[project][0].name.replace(/\s*\d소대$/, '')
            : project;
        groups[project].forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = (p.name || p.id) + ' [' + p.status + ']';
            optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
    });

    if (_cpcSelectedId) select.value = _cpcSelectedId;

    select.onchange = function () {
        _cpcSelectedId = this.value;
        cpcRefreshPlatoonStatus();
        if (_cpcSelectedId) cpcStartPolling();
    };
    cpcRefreshPlatoonStatus();
    // 기존 추적 중인 명령이 있으면 폴링 시작
    if (_cpcTrackedCmds.length > 0) cpcStartPolling();
}

function cpcHideBar() {
    const bar = document.getElementById('cpcBar');
    if (bar) bar.style.display = 'none';
    cpcStopPolling();
}

function cpcIsHelper(persona) {
    if (!persona) return false;
    return persona.category === 'helper' || (persona.id && persona.id.includes('helper'));
}

// 봇 소유자인지 확인
function cpcIsOwner() {
    try {
        if (typeof MCW !== 'undefined' && MCW.user && MCW.user.getCurrentUser && chatBotData && chatBotData.ownerId) {
            const u = MCW.user.getCurrentUser();
            return u && u.id === chatBotData.ownerId;
        }
    } catch (e) {}
    return false;
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
    // CPC 바: 소유자이거나 도우미 페르소나면 표시
    if (cpcIsOwner() || cpcIsHelper(newPersona)) {
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
    // === CPC 양방향 연동: 소대 선택 시 해당 소대로 명령 전달 + 추적 ===
    try {
        if (_cpcSelectedId) {
            cpcAddCommand(_cpcSelectedId, text, 'chatbot')
                .then(cmd => {
                    if (cmd) {
                        console.log('[CPC] 명령 전송 →', _cpcSelectedId, cmd.id);
                        cpcTrackCommand(cmd);
                        addMessage('system', '[CPC] 명령 전송됨 → ' + _cpcSelectedId);
                    }
                })
                .catch(e => console.warn('[CPC] 명령 전송 실패', e));
        }
    } catch (e) {
        console.warn('[CPC] 연동 중 예외', e);
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
    // All AI calls go through server-side /api/chat only (API key is in Vercel env vars)
    return '죄송합니다. 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';
}
// TTS: 1차 /api/tts (OpenAI TTS-1) → 2차 SpeechSynthesis → 3차 Google Translate
function speak(text) {
    if (!voiceOutputEnabled) return;
    var clean = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!clean) return;
    if (clean.length > 4096) clean = clean.substring(0, 4096);

    // 1차: /api/tts (OpenAI TTS-1)
    fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice: _ttsVoice })
    }).then(function (res) {
        if (!res.ok) throw new Error('TTS API ' + res.status);
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('audio') === -1) throw new Error('TTS response not audio');
        return res.blob();
    }).then(function (blob) {
        var blobUrl = URL.createObjectURL(blob);
        _ttsPlayer.pause();
        _ttsPlayer.currentTime = 0;
        _ttsPlayer.src = blobUrl;
        _ttsPlayer.volume = 1.0;
        _ttsPlayer.play().then(function () {
            console.log('[TTS] OpenAI TTS-1');
        }).catch(function () { speakFallback(clean); });
        _ttsPlayer.onended = function () { URL.revokeObjectURL(blobUrl); };
    }).catch(function (e) {
        console.warn('[TTS] API fallback:', e.message);
        speakFallback(clean);
    });
}
// 2차: SpeechSynthesis (모바일 최우선) → 3차: Google Translate TTS
function speakFallback(clean) {
    if (window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
            var u = new SpeechSynthesisUtterance(clean);
            u.lang = 'ko-KR';
            u.rate = 1.0;
            window.speechSynthesis.speak(u);
            console.log('[TTS] SpeechSynthesis fallback');
            return;
        } catch (e) {
            console.warn('[TTS] SpeechSynthesis failed:', e);
        }
    }
    var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=' + encodeURIComponent(clean);
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
// === Per-persona 대화/통계 저장 (localStorage + Supabase) ===
var _chatSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

function savePerPersonaMessage(role, content) {
    if (!chatBotData || !currentPersona) return;
    var botId = chatBotData.id;
    var personaId = currentPersona.id;
    var timestamp = new Date().toISOString();

    // localStorage (기존 호환)
    var key = 'mcw_conv_' + botId + '_' + personaId;
    var convs = JSON.parse(localStorage.getItem(key) || '[]');
    convs.push({ role: role, content: content, timestamp: timestamp });
    if (convs.length > 200) convs.splice(0, convs.length - 200);
    localStorage.setItem(key, JSON.stringify(convs));

    // Supabase mcw_chat_logs (비동기, 실패해도 무시)
    if (typeof StorageManager !== 'undefined' && StorageManager.getSupabase) {
        var sb = StorageManager.getSupabase();
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
    var bubble = btn.parentElement;
    if (!bubble) return;
    var clean = bubble.textContent.replace(/🔊/g, '').trim();
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
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('audio') === -1) throw new Error('Not audio');
        return res.blob();
    }).then(function(blob) {
        var blobUrl = URL.createObjectURL(blob);
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
                var u = new SpeechSynthesisUtterance(clean);
                u.lang = 'ko-KR';
                u.onend = function() { btn.classList.remove('playing'); };
                window.speechSynthesis.speak(u);
                return;
            } catch (e) { /* fall through */ }
        }
        // Google Translate TTS (최후 수단)
        var url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=' + encodeURIComponent(clean);
        _ttsPlayer.pause();
        _ttsPlayer.currentTime = 0;
        _ttsPlayer.src = url;
        _ttsPlayer.volume = 1.0;
        _ttsPlayer.play().catch(function() { btn.classList.remove('playing'); });
        _ttsPlayer.onended = function() { btn.classList.remove('playing'); };
    });
}
