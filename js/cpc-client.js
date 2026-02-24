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

// --- 소대장 응답 대기: 폴링 → 타임아웃 시 Vercel AI 폴백 ---
function cpcWaitForResult(cmdId, platoonId, cmdText) {
    const POLL_MS = 2000;    // 2초 간격 폴링
    const TIMEOUT_MS = 300000; // 5분 타임아웃 (Claude Code 처리 시간 고려)
    const start = Date.now();
    let shown = false;

    function showResult(rawResult) {
        if (shown) return;
        shown = true;
        // cpcPollTrackedCommands 중복 표시 방지: 추적 목록에서 제거
        _cpcTrackedCmds = _cpcTrackedCmds.filter(c => c.id !== cmdId);
        const cleaned = rawResult.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').replace(/[-*]\s/g, '').trim();
        const short = cleaned.length > 80 ? cleaned.substring(0, 80) + '...' : cleaned;
        addMessage('system', '📡 [CPC] 소대 응답: ' + escapeHtml(short), 'cpc-result');
        if (voiceOutputEnabled && cleaned) {
            const speakText = cleaned.length > 100 ? cleaned.substring(0, 100) : cleaned;
            if (_audioSource) {
                _audioSource.onended = () => { _audioSource = null; speak(speakText); };
            } else {
                speak(speakText);
            }
        }
    }

    function poll() {
        if (shown) return;
        if (Date.now() - start > TIMEOUT_MS) {
            // 30초 타임아웃 → Vercel AI 폴백
            console.log('[CPC] 타임아웃 → Vercel AI 폴백:', cmdId);
            fetch('/api/cpc-process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commandId: cmdId, platoonId, text: cmdText })
            }).then(r => r.json()).then(data => {
                showResult((data && (data.result || data.detail)) || '명령 처리됨');
            }).catch(() => showResult('명령 전달됨'));
            return;
        }
        // CPC API에서 해당 명령 DONE 여부 확인
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

    // 3초 후 첫 폴링 시작 (주입 후 소대장 처리 시간 여유)
    setTimeout(poll, 3000);
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
                const rawResult = (fresh.result || '').replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').replace(/[-*]\s/g, '').trim();
                const shortResult = rawResult.length > 80 ? rawResult.substring(0, 80) + '...' : rawResult;
                const resultMsg = shortResult
                    ? '[CPC] 명령 완료: ' + escapeHtml(shortResult)
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
            // 소대 풀 이름 표시: "My Chatbot World 1소대 [RUNNING]"
            const label = p.name || p.id;
            opt.textContent = label + ' [' + p.status + ']';
            optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
    });

    // localStorage에서 이전 선택 소대 복원 (없으면 mychatbot-1 기본값)
    if (!_cpcSelectedId) {
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
    // 오직 'Claude 연락병' 페르소나일 때만 CPC 바 표시
    return persona.name === 'Claude 연락병' || persona.id === 'sunny_helper_work';
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
        _autonomousTimer = setInterval(autonomousTick, AUTONOMOUS_INTERVAL);
    }
}
