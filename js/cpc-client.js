/**
 * CPC (Claude Platoons Control) Client Module
 * Extracted from chat.js for separation of concerns.
 * Browser global script — all variables/functions exposed globally.
 */
// === CPC (Claude Platoons Control) 양방향 연동 ===
// CPC_API_BASE → 서버사이드 프록시 경유 (Vercel Security Checkpoint 우회)
const CPC_PROXY_BASE = '/api/cpc-proxy?path=';
let _cpcPlatoons = [];           // 캐시된 소대 목록
let _cpcSelectedId = localStorage.getItem('cpc_selected_platoon') || 'mychatbot-1';  // 현재 선택된 소대 ID
let _cpcTrackedCmds = [];       // 추적 중인 명령 [{id, status, text}]
let _cpcPollTimer = null;        // 폴링 타이머
const CPC_POLL_INTERVAL = 3000;  // 3초 폴링
let _cpcLeaderPollTimer = null;  // CC→챗봇 메시지 폴링 타이머
let _cpcLastLeaderCmdId = '';    // 마지막으로 표시한 CC 메시지 ID

// --- 마크다운 제거 유틸 ---
function cpcStripMarkdown(text) {
    return (text || '').replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').replace(/[-*]\s/g, '').trim();
}

// --- URL 안전 렌더링: claude.ai/code URL은 클릭 가능한 링크로 변환 ---
function cpcSafeHtml(text) {
    // escapeHtml 전에 URL을 추출하여 &amp; 인코딩 충돌 방지
    const urlRe = /https:\/\/claude\.ai\/code[?/][A-Za-z0-9_?=&./-]+/g;
    const urls = [];
    const placeholder = '\x00CPC_URL_';
    const withPlaceholders = text.replace(urlRe, match => {
        urls.push(match);
        return placeholder + (urls.length - 1) + '\x00';
    });
    let escaped = escapeHtml(withPlaceholders);
    // placeholder를 클릭 가능한 링크로 복원
    urls.forEach((url, i) => {
        escaped = escaped.replace(
            placeholder + i + '\x00',
            `<a href="${url}" target="_blank" rel="noopener" class="cpc-remote-link">\u{1F517} ${url}</a>`
        );
    });
    return escaped;
}

// === Channel Relay (C+ 방안: CPC → 터널 → claude -p) ===
const CHANNEL_RELAY_URL = '/api/cpc-proxy?path=' + encodeURIComponent('/api/channel/relay');
const CHANNEL_REPLY_BASE = '/api/cpc-proxy?path=' + encodeURIComponent('/api/channel/reply');

async function channelRelay(projectName, userMessage, conversationId, userId) {
    try {
        const res = await fetch(CHANNEL_RELAY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_name: projectName,
                user_message: userMessage,
                conversation_id: conversationId || 'conv_' + Date.now(),
                user_id: userId || 'sunny',
            }),
        });
        if (!res.ok) throw new Error(`relay ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn('[Channel] relay 실패:', e.message);
        return null;
    }
}

function channelWaitForResult(cmdId, conversationId) {
    const POLL_MS = 3000;
    const TIMEOUT_MS = 300000; // 5분 (claude -p 작업 시간)
    const start = Date.now();
    let shown = false;

    function showResult(text) {
        if (shown) return;
        shown = true;
        const cleaned = cpcStripMarkdown(text);
        addMessage('system', '📡 [Claude Code] ' + cpcSafeHtml(cleaned), 'cpc-result');
        if (voiceOutputEnabled && cleaned) {
            const speakText = cleaned.length > 100 ? cleaned.substring(0, 100) : cleaned;
            if (typeof speak === 'function') speak(speakText);
        }
    }

    function poll() {
        if (shown) return;
        if (Date.now() - start > TIMEOUT_MS) {
            showResult('응답 타임아웃 (5분). Claude Code 세션 상태를 확인하세요.');
            return;
        }
        fetch(CHANNEL_REPLY_BASE + '&cmd_id=' + encodeURIComponent(cmdId), {
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(data => {
                if (data && data.result) {
                    showResult(data.result);
                } else {
                    setTimeout(poll, POLL_MS);
                }
            })
            .catch(() => setTimeout(poll, POLL_MS));
    }

    addMessage('system', '⏳ [Claude Code] 작업 실행 중... (최대 5분)');
    setTimeout(poll, 3000);
}

// 채널 모드: 프로젝트명 → 소대 키 접두사 매핑
function channelProjectName(platoonId) {
    if (!platoonId) return '';
    const prefix = platoonId.replace(/-\d+$/, '');
    const map = {
        'mychatbot': 'mychatbot-world',
        'ssalworks': 'ssal-works',
        'studycircle': 'ai-study-circle',
        'politician': 'politician-finder',
        'valuelink': 'valuelink',
    };
    return map[prefix] || prefix;
}

// --- CPC API 호출 (프록시 경유) ---
async function cpcFetch(path, options = {}) {
    try {
        const proxyUrl = CPC_PROXY_BASE + encodeURIComponent(path);
        const res = await fetch(proxyUrl, {
            cache: 'no-store',
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

// --- 소대장 응답: 일반 명령은 Vercel 즉시, 리모트 명령은 Agent Server 전용 ---
const _CPC_REMOTE_RE = /리모트|remote|원격|rc\b|리모컨|remote.?control/i;

function cpcWaitForResult(cmdId, platoonId, cmdText) {
    const POLL_MS = 3000;
    const start = Date.now();
    let shown = false;
    const isRemote = _CPC_REMOTE_RE.test(cmdText);
    const TIMEOUT_MS = isRemote ? 120000 : 90000; // 리모트: 2분, 일반: 90초

    function showResult(rawResult) {
        if (shown) return;
        shown = true;
        _cpcTrackedCmds = _cpcTrackedCmds.filter(c => c.id !== cmdId);
        const cleaned = cpcStripMarkdown(rawResult);
        addMessage('system', '📡 [CPC] ' + cpcSafeHtml(cleaned), 'cpc-result');
        if (voiceOutputEnabled && cleaned) {
            const speakText = cleaned.length > 100 ? cleaned.substring(0, 100) : cleaned;
            if (_audioSource) {
                _audioSource.onended = () => { _audioSource = null; speak(speakText); };
            } else {
                speak(speakText);
            }
        }
    }

    // Agent Server 폴링 (DONE 될 때까지 대기)
    function poll() {
        if (shown) return;
        if (Date.now() - start > TIMEOUT_MS) {
            // 타임아웃 → 소대장 처리 대기 안내 (DONE 처리 금지 — CC 단독 처리 원칙)
            if (isRemote) {
                showResult('리모트 컨트롤은 소대장 세션(Claude Code)이 가동 중이어야 합니다. /cpc-engage 실행 후 다시 시도해주세요.');
            } else {
                console.log('[CPC] 타임아웃 — 소대장 처리 대기 (폴백 없음):', cmdId);
                showResult('소대장이 처리 중입니다. 잠시 후 다시 확인해주세요.');
            }
            return;
        }
        cpcFetch(`/api/platoons/${encodeURIComponent(platoonId)}/commands`)
            .then(cmds => {
                if (!cmds) { setTimeout(poll, POLL_MS); return; }
                const c = cmds.find(x => x.id === cmdId);
                if (c && c.status === 'DONE' && c.result) {
                    console.log('[CPC] 소대장 응답 수신:', c.result.substring(0, 60));
                    showResult(c.result);
                } else {
                    setTimeout(poll, POLL_MS);
                }
            }).catch(() => setTimeout(poll, POLL_MS));
    }

    if (isRemote) {
        // 리모트 명령: 항상 새로 실행 — Agent Server가 claude remote-control 신규 실행
        // 캐시된 session_url 절대 사용 금지 (낡은 URL은 접속 불가)
        addMessage('system', '⏳ [CPC] 리모트 컨트롤 실행 중... (최대 30초)');
        setTimeout(poll, 1000);
    } else {
        // 일반 명령: MCP/Agent Server 폴링 우선 → 타임아웃 시에만 Vercel AI 폴백
        addMessage('system', '⏳ [CPC] 소대장에게 전달 완료 — 응답 대기 중...');
        setTimeout(poll, 2000);
    }
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
                addMessage('system', '[CPC] 연락병이 명령을 수신했습니다: "' + escapeHtml(tracked.text) + '"');
            }
            if (fresh.status === 'DONE') {
                const rawResult = cpcStripMarkdown(fresh.result);
                const resultMsg = rawResult
                    ? '[CPC] 명령 완료: ' + cpcSafeHtml(rawResult)
                    : '[CPC] 명령 완료: "' + escapeHtml(tracked.text) + '"';
                addMessage('system', resultMsg);
                // CPC 결과 음성 읽기
                if (voiceOutputEnabled && rawResult) {
                    const speakText = rawResult.length > 100 ? rawResult.substring(0, 100) : rawResult;
                    speak(speakText);
                }
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
        const opt = select.querySelector(`option[value="${p.name}"]`);
        if (opt) opt.textContent = p.name + ' [' + p.status + ']';
    }
    // CPC 바 상태 표시
    const statusEl = document.getElementById('cpcStatus');
    if (statusEl && _cpcSelectedId) {
        const sel = fresh.find(p => p.name === _cpcSelectedId);
        statusEl.textContent = sel ? sel.status : '';
        statusEl.className = 'cpc-status' + (sel && sel.status === 'RUNNING' ? ' cpc-running' : '');
    }
}

// --- CC→챗봇 메시지 수신 폴링 (source=platoon_leader) ---
function cpcStartLeaderPolling() {
    if (_cpcLeaderPollTimer) return;
    _cpcLeaderPollTimer = setInterval(cpcPollLeaderMessages, 5000); // 5초마다
}

function cpcStopLeaderPolling() {
    if (_cpcLeaderPollTimer) { clearInterval(_cpcLeaderPollTimer); _cpcLeaderPollTimer = null; }
}

async function cpcPollLeaderMessages() {
    if (!_cpcSelectedId) return;
    try {
        const allCmds = await cpcGetCommands(_cpcSelectedId);
        if (!allCmds || allCmds.length === 0) return;

        // source=platoon_leader인 PENDING 명령 찾기 (CC가 보낸 메시지)
        const leaderMsgs = allCmds.filter(c =>
            c.source === 'platoon_leader' && c.status === 'PENDING'
        );

        for (const msg of leaderMsgs) {
            if (msg.id === _cpcLastLeaderCmdId) continue;
            _cpcLastLeaderCmdId = msg.id;

            // 채팅창에 CC 메시지 표시
            const cleaned = cpcStripMarkdown(msg.text);
            addMessage('system', '🎖️ [소대장] ' + cpcSafeHtml(cleaned), 'cpc-leader-msg');

            // 음성 출력
            if (voiceOutputEnabled && cleaned) {
                const speakText = cleaned.length > 150 ? cleaned.substring(0, 150) : cleaned;
                speak(speakText);
            }

            // ACKED로 변경 (표시 완료)
            try {
                await cpcFetch(`/api/commands/${msg.id}/ack`, { method: 'PATCH' });
            } catch(e) { console.warn('[CPC] leader msg ack failed', e); }
        }
    } catch(e) {
        console.warn('[CPC] leader poll error', e);
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
        const parts = p.name.match(/^(.+)-(\d+)$/);
        const project = parts ? parts[1] : p.name;
        if (!groups[project]) groups[project] = [];
        groups[project].push(p);
    });

    select.innerHTML = '<option value="">소대 선택...</option>';
    Object.keys(groups).sort().forEach(project => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = project;
        groups[project].forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.textContent = p.name + ' [' + p.status + ']';
            optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
    });

    // 페르소나별 자동 소대 선택 (Trader → mychatbot-trader)
    const autoId = (typeof currentPersona !== 'undefined') ? cpcDefaultPlatoon(currentPersona) : '';
    if (autoId && _cpcPlatoons.some(p => p.name === autoId)) {
        _cpcSelectedId = autoId;
        localStorage.setItem('cpc_selected_platoon', autoId);
    } else if (!_cpcSelectedId) {
        _cpcSelectedId = localStorage.getItem('cpc_selected_platoon') || 'mychatbot-1';
    }
    select.value = _cpcSelectedId;

    select.onchange = function () {
        _cpcSelectedId = this.value;
        localStorage.setItem('cpc_selected_platoon', _cpcSelectedId);
        cpcRefreshPlatoonStatus();
        if (_cpcSelectedId) cpcStartPolling();
    };
    cpcRefreshPlatoonStatus();
    // 기존 추적 중인 명령이 있으면 폴링 시작
    if (_cpcTrackedCmds.length > 0) cpcStartPolling();
    // CC→챗봇 메시지 폴링 시작
    cpcStartLeaderPolling();
    autonomousInit();
}

function cpcHideBar() {
    const bar = document.getElementById('cpcBar');
    if (bar) bar.style.display = 'none';
    cpcStopPolling();
    cpcStopLeaderPolling();
}

function cpcIsHelper(persona) {
    if (!persona) return false;
    // CPC 바 표시 대상: 연락병 페르소나들
    return persona.name === 'Claude 연락병'
        || persona.name === 'Trade 연락병'
        || persona.id === 'sunny_helper_work'
        || persona.id === 'sunny_helper_trader';
}

// 페르소나별 기본 소대 매핑
function cpcDefaultPlatoon(persona) {
    if (!persona) return '';
    if (persona.name === 'Trade 연락병' || persona.id === 'sunny_helper_trader')
        return 'trader-bot';
    if (persona.name === 'Claude 연락병' || persona.id === 'sunny_helper_work')
        return 'mychatbot-1';
    return '';  // 기타 연락병은 사용자가 선택
}

// === 자율모드 (Autonomous Agent Mode) ===
let _autonomousMode = localStorage.getItem('mcw_autonomous_mode') === 'true';
let _autonomousTimer = null;
const AUTONOMOUS_INTERVAL = 30 * 60 * 1000; // 30분

function autonomousToggle() {
    _autonomousMode = !_autonomousMode;
    localStorage.setItem('mcw_autonomous_mode', String(_autonomousMode));
    _autonomousUpdateBtn();
    if (_autonomousMode) {
        autonomousStart();
    } else {
        autonomousStop();
    }
}

function _autonomousUpdateBtn() {
    const btn = document.getElementById('autonomousToggle');
    if (!btn) return;
    btn.classList.toggle('autonomous-on', _autonomousMode);
    btn.textContent = _autonomousMode ? '♥' : '♡';
    btn.title = _autonomousMode ? '자율모드 ON — 30분마다 자동 점검' : '자율모드 OFF';
}

function autonomousStart() {
    if (_autonomousTimer) return;
    _autonomousTimer = setInterval(autonomousTick, AUTONOMOUS_INTERVAL);
    addMessage('system', '🤖 [자율모드] ON — 30분마다 소대 상태를 자동 점검합니다.');
}

function autonomousStop() {
    if (_autonomousTimer) { clearInterval(_autonomousTimer); _autonomousTimer = null; }
    addMessage('system', '🤖 [자율모드] OFF — 자동 점검이 중지되었습니다.');
}

async function autonomousTick() {
    const ts = new Date().toLocaleTimeString('ko-KR');
    addMessage('system', `🤖 [자율점검 ${ts}] 소대 상태 확인 중...`);
    try {
        const res = await fetch('/api/agent-tick', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platoonId: _cpcSelectedId })
        });
        const data = await res.json();
        if (data.report) {
            addMessage('system', '🤖 [자율점검] ' + escapeHtml(data.report));
            if (voiceOutputEnabled && typeof speak === 'function') {
                const short = data.report.length > 80 ? data.report.substring(0, 80) : data.report;
                speak(short);
            }
        }
    } catch(e) {
        console.warn('[Autonomous] tick 실패:', e.message);
    }
}

function autonomousInit() {
    _autonomousUpdateBtn();
    if (_autonomousMode) {
        autonomousTick();
        autonomousStart();
    }
}
