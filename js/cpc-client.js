/**
 * CPC (Claude Platoons Control) Client Module
 * Extracted from chat.js for separation of concerns.
 * Browser global script — all variables/functions exposed globally.
 */
// === CPC (Claude Platoons Control) 양방향 연동 ===
const CPC_API_BASE = 'https://claude-platoons-control.vercel.app';
let _cpcPlatoons = [];           // 캐시된 소대 목록
let _cpcSelectedId = '';         // 현재 선택된 소대 ID
let _cpcTrackedCmds = [];       // 추적 중인 명령 [{id, status, text}]
let _cpcPollTimer = null;        // 폴링 타이머
const CPC_POLL_INTERVAL = 3000;  // 3초 폴링

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

// --- CPC API 호출 ---
async function cpcFetch(path, options = {}) {
    try {
        const res = await fetch(`${CPC_API_BASE}${path}`, {
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

// --- 소대장 응답: 즉시 Vercel AI 처리 + Agent Server 백그라운드 폴링 ---
function cpcWaitForResult(cmdId, platoonId, cmdText) {
    const POLL_MS = 3000;    // 3초 간격 Agent Server 폴링
    const POLL_MAX_MS = 90000; // 90초까지 Agent Server 응답 대기
    const start = Date.now();
    let shown = false;
    let agentShown = false;

    function showResult(rawResult, source) {
        // source: 'vercel' = 즉시 AI, 'agent' = Agent Server (로컬 소대장)
        if (source === 'vercel' && shown) return;
        if (source === 'agent' && agentShown) return;

        const cleaned = cpcStripMarkdown(rawResult);
        const short = cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned;
        const label = source === 'agent' ? '📡 [소대장]' : '📡 [CPC]';

        if (source === 'vercel') {
            shown = true;
            addMessage('system', label + ' ' + cpcSafeHtml(short), 'cpc-result');
        } else {
            // Agent Server 응답이 나중에 도착하면 업그레이드
            agentShown = true;
            _cpcTrackedCmds = _cpcTrackedCmds.filter(c => c.id !== cmdId);
            addMessage('system', label + ' ' + cpcSafeHtml(short), 'cpc-result');
        }

        if (voiceOutputEnabled && cleaned) {
            const speakText = cleaned.length > 100 ? cleaned.substring(0, 100) : cleaned;
            if (_audioSource) {
                _audioSource.onended = () => { _audioSource = null; speak(speakText); };
            } else {
                speak(speakText);
            }
        }
    }

    // 1) 즉시 Vercel AI 처리 (서버 불필요, 항상 동작)
    fetch('/api/cpc-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandId: cmdId, platoonId, text: cmdText })
    }).then(r => r.json()).then(data => {
        const result = (data && (data.result || data.detail)) || '명령 처리됨';
        console.log('[CPC] Vercel AI 즉시 응답:', result.substring(0, 60));
        showResult(result, 'vercel');
    }).catch(() => {
        if (!shown) showResult('명령 전달됨', 'vercel');
    });

    // 2) Agent Server 백그라운드 폴링 (로컬 서버가 살아있으면 더 정확한 응답)
    function poll() {
        if (agentShown) return;
        if (Date.now() - start > POLL_MAX_MS) return; // 90초 초과 시 포기
        cpcFetch(`/api/platoons/${encodeURIComponent(platoonId)}/commands`)
            .then(cmds => {
                if (!cmds) { setTimeout(poll, POLL_MS); return; }
                const c = cmds.find(x => x.id === cmdId);
                if (c && c.status === 'DONE' && c.result) {
                    console.log('[CPC] Agent Server 응답:', c.result.substring(0, 60));
                    showResult(c.result, 'agent');
                } else {
                    setTimeout(poll, POLL_MS);
                }
            }).catch(() => setTimeout(poll, POLL_MS));
    }

    // Agent Server 폴링은 5초 후 시작 (Vercel 응답이 먼저 도착하도록)
    setTimeout(poll, 5000);
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
                const shortResult = rawResult.length > 80 ? rawResult.substring(0, 80) + '...' : rawResult;
                const resultMsg = shortResult
                    ? '[CPC] 명령 완료: ' + cpcSafeHtml(shortResult)
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
    autonomousInit();
}

function cpcHideBar() {
    const bar = document.getElementById('cpcBar');
    if (bar) bar.style.display = 'none';
    cpcStopPolling();
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
