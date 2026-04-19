// @task S3F13
/**
 * Create Page JavaScript - 5-step chatbot creation wizard v15.0
 * Steps: 기본정보 → 대표 페르소나 → 인터뷰 → AI분석 → 완성
 * 간소화: 대표 페르소나 1개만 생성, 나머지는 마이페이지에서 추가
 */

// === State ===
let currentStep = 1;
const PART1_STEPS = 8;  // 8단계 생성 프로세스
let savedBotId = null;   // Set after completeCreation, used by Part 2 KB
let selectedAvatarEmoji = 'robot';
let selectedThemeMode = 'dark';
let selectedThemeColor = 'purple';
let avatarPersonaCount = 0;
let helperPersonaCount = 0;

// HTML 이스케이프 (XSS 방지)
function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// Voice (STT)
let isRecording = false;
let recordingTimer = null;
let remainingTime = 180;
let recognition = null;
let transcriptText = '';

// === 폼 필드 음성 입력 (SpeechRecognition) ===
let _fieldRecognition = null;

// Step 1: id로 필드 지정
function voiceToField(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    // URL 필드는 한글→영문 변환 후처리 적용
    const isUrlField = fieldId === 'botUsername';
    _startFieldSTT(input, isUrlField);
}

// Step 2: 버튼 옆 input/textarea 자동 감지
function voiceToInput(btn) {
    const wrap = btn.parentElement;
    const input = wrap.querySelector('input, textarea');
    if (input) _startFieldSTT(input);
}

function _startFieldSTT(input, convertToUrl = false) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('이 브라우저는 음성 입력을 지원하지 않습니다. Chrome을 사용해주세요.');
        return;
    }

    // 이미 녹음 중이면 중지
    if (_fieldRecognition) {
        _fieldRecognition.stop();
        _fieldRecognition = null;
        return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'ko-KR';
    rec.continuous = true;      // 버튼 누를 때까지 계속 인식
    rec.interimResults = false; // 확정 결과만

    // 버튼 시각 피드백
    const btn = input.parentElement.querySelector('.mic-btn');
    if (btn) { btn.textContent = '🔴'; btn.classList.add('recording'); }

    rec.onresult = (e) => {
        // e.resultIndex 이후의 새 결과만 처리 (누적 중복 방지)
        let newText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) newText += e.results[i][0].transcript;
        }
        if (!newText) return;
        const existing = input.value.trim();
        const maxLen = input.maxLength > 0 ? input.maxLength : 9999;
        let result = existing ? existing + ' ' + newText : newText;
        result = result.slice(0, maxLen);
        if (convertToUrl) {
            result = _koreanToUrl(result);
        }
        input.value = result;
        input.dispatchEvent(new Event('input'));
    };

    rec.onend = () => {
        if (btn) { btn.textContent = '🎤'; btn.classList.remove('recording'); }
        _fieldRecognition = null;
    };

    rec.onerror = () => {
        if (btn) { btn.textContent = '🎤'; btn.classList.remove('recording'); }
        _fieldRecognition = null;
    };

    _fieldRecognition = rec;
    rec.start();
}

// 한글 → URL-safe 영문 변환 (유니코드 자모 분해 방식)
function _koreanToUrl(text) {
    // 한글 자모 로마자 매핑
    const CHO = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
    const JUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
    const JONG = ['','g','kk','gs','n','nj','nh','d','l','lg','lm','lb','ls','lt','lp','lh','m','b','bs','s','ss','ng','j','ch','k','t','p','h'];

    let result = '';
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const offset = code - 0xAC00;
            const cho = Math.floor(offset / (21 * 28));
            const jung = Math.floor((offset % (21 * 28)) / 28);
            const jong = offset % 28;
            result += CHO[cho] + JUNG[jung] + JONG[jong];
        } else {
            result += text[i];
        }
    }
    // 영숫자·하이픈만 남기고, 공백→하이픈, 소문자, 중복하이픈·앞뒤하이픈 제거
    return result
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// (KB는 마이페이지에서 관리)

// (이모지는 봇 레벨이 아닌 페르소나별로 관리)

// Emotion slider preview texts (key: iqEq value range)
const SLIDER_PREVIEWS = [
    { max: 10, text: '힘드셨죠... 제가 도와드릴게요.' },
    { max: 30, text: '걱정되시죠? 함께 해결해볼게요.' },
    { max: 60, text: '객관적으로 보면서도, 마음은 이해합니다.' },
    { max: 80, text: '분석 결과를 바탕으로 설명해드릴게요.' },
    { max: 100, text: '정확한 데이터 기반으로 답변드리겠습니다.' }
];

// Helper types
const HELPER_TYPES = [
    { id: 'work', label: '💼 업무', desc: '업무 비서' },
    { id: 'life', label: '🏠 생활', desc: '생활 매니저' },
    { id: 'study', label: '📚 학습', desc: '학습 코치' },
    { id: 'creative', label: '🎨 창작', desc: '창작 도우미' },
    { id: 'etc', label: '⚙️ 기타', desc: '기타 도우미' }
];

// === Init ===
// === 단계별 저장/복원 (sessionStorage) ===
const DRAFT_KEY = 'mcw_create_draft';

function saveDraft() {
    const draft = {
        step: currentStep,
        botName: document.getElementById('botName')?.value || '',
        botDesc: document.getElementById('botDesc')?.value || '',
        botUsername: document.getElementById('botUsername')?.value || '',
        usernameManual: _usernameManuallyEdited,
        persona: _collectPersonaFromDOM(),
        transcriptText: transcriptText,
        textContent: document.getElementById('textContent')?.value || '',
        savedAt: Date.now()
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function _collectPersonaFromDOM() {
    const card = document.querySelector('#avatarPersonaList .persona-card');
    if (!card) return null;
    return {
        name: card.querySelector('.p-name')?.value || '',
        role: card.querySelector('.p-role')?.value || '',
        iqEq: parseInt(card.querySelector('.p-iqeq')?.value || '50', 10),
        model: card.querySelector('input[type=radio][name^="model"]:checked')?.value || 'logic'
    };
}

function loadDraft() {
    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const draft = JSON.parse(raw);
        // 24시간 이상 된 초안은 무시
        if (Date.now() - draft.savedAt > 24 * 60 * 60 * 1000) {
            sessionStorage.removeItem(DRAFT_KEY);
            return null;
        }
        return draft;
    } catch { return null; }
}

function restoreDraft(draft) {
    // Step 1 필드 복원
    if (draft.botName) document.getElementById('botName').value = draft.botName;
    if (draft.botDesc) document.getElementById('botDesc').value = draft.botDesc;
    if (draft.botUsername) document.getElementById('botUsername').value = draft.botUsername;
    if (draft.usernameManual) _usernameManuallyEdited = true;

    // 페르소나 카드 복원
    if (draft.persona) {
        setTimeout(() => {
            const card = document.querySelector('#avatarPersonaList .persona-card');
            if (!card) return;
            const nameEl = card.querySelector('.p-name');
            const roleEl = card.querySelector('.p-role');
            const iqEl = card.querySelector('.p-iqeq');
            if (nameEl) nameEl.value = draft.persona.name;
            if (roleEl) roleEl.value = draft.persona.role;
            if (iqEl) { iqEl.value = draft.persona.iqEq; updateSliderPreview(iqEl); }
            if (draft.persona.model) {
                const radio = card.querySelector(`input[type=radio][value="${draft.persona.model}"]`);
                if (radio) radio.checked = true;
            }
        }, 100);
    }

    // Step 3 텍스트 복원
    if (draft.transcriptText) transcriptText = draft.transcriptText;
    if (draft.textContent) {
        const ta = document.getElementById('textContent');
        if (ta) ta.value = draft.textContent;
    }

    // 저장된 단계로 이동
    if (draft.step > 1) {
        setTimeout(() => goToStep(draft.step), 200);
    }
}

function clearDraft() {
    sessionStorage.removeItem(DRAFT_KEY);
}

document.addEventListener('DOMContentLoaded', async () => {
    // 로그인 확인
    if (typeof CoCoBot !== 'undefined' && CoCoBot.ready) {
        await CoCoBot.ready;
        const user = CoCoBot.user.getCurrentUser();
        if (!user) {
            alert('코코봇을 생성하려면 먼저 로그인해주세요.');
            location.href = '../login.html';
            return;
        }
    }
    setupSpeechRecognition();
    setupTextCounter();
    setupAutoUsername();
    addPersonaCard('avatar');
    initVoicePicker();

    // === S3F13: URL 파라미터 ?step=N 처리 ===
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam) {
        const targetStep = parseInt(stepParam, 10);
        if (!isNaN(targetStep) && targetStep >= 1 && targetStep <= PART1_STEPS) {
            // 드래프트 복원 없이 바로 해당 단계로 이동 (유효성 검사 우회)
            setTimeout(() => _jumpToStep(targetStep), 100);
            return; // 드래프트 복원 건너뜀
        }
    }

    // 저장된 초안이 있으면 복원
    const draft = loadDraft();
    if (draft && draft.step > 1) {
        if (confirm('이전에 작성 중이던 코코봇이 있습니다. 이어서 작성하시겠습니까?')) {
            restoreDraft(draft);
        } else {
            clearDraft();
        }
    } else if (draft) {
        restoreDraft(draft);
    }
});

// === S3F13: 유효성 검사 없이 특정 Step으로 직접 점프 ===
function _jumpToStep(step) {
    for (let i = 1; i <= PART1_STEPS; i++) {
        const el = document.getElementById('step' + i);
        if (el) {
            el.classList.toggle('hidden', i !== step);
            if (i === step) {
                el.style.animation = 'none';
                el.offsetHeight;
                el.style.animation = 'fadeIn 0.5s ease';
            }
        }
    }
    currentStep = step;

    if (step === 8) _setupDeployStep();

    const pct = Math.round((step / PART1_STEPS) * 100);
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = pct + '%';

    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        el.classList.toggle('active', idx + 1 === step);
        el.classList.toggle('completed', idx + 1 < step);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === 코코봇 이름 → 사용자명 자동 생성 ===
let _usernameManuallyEdited = false;

function setupAutoUsername() {
    const nameInput = document.getElementById('botName');
    const urlInput = document.getElementById('botUsername');
    if (!nameInput || !urlInput) return;

    // 이름 변경 시 자동 URL 생성
    nameInput.addEventListener('input', () => {
        if (_usernameManuallyEdited) return; // 수동 편집했으면 자동 생성 중지
        urlInput.value = _koreanToUrl(nameInput.value);
    });

    // 사용자가 직접 URL 수정하면 자동 생성 중지
    urlInput.addEventListener('input', () => {
        _usernameManuallyEdited = true;
    });
    urlInput.addEventListener('focus', () => {
        _usernameManuallyEdited = true;
    });
}

// === Step Navigation ===
function goToStep(step) {
    // Validation
    if (step === 2) {
        const name = document.getElementById('botName').value.trim();
        if (!name) { alert('코코봇 이름을 입력해주세요'); return; }
        const username = document.getElementById('botUsername').value.trim();
        if (!username) {
            document.getElementById('botUsername').value = _koreanToUrl(name);
        }
        const finalUsername = document.getElementById('botUsername').value.trim();
        // 중복 체크
        const existing = CoCoBot.storage?.getBotByUsername?.(finalUsername);
        if (existing) {
            alert(`"${finalUsername}"은(는) 이미 사용 중인 주소입니다.\n다른 사용자명을 입력해주세요.`);
            document.getElementById('botUsername').focus();
            _usernameManuallyEdited = true;
            return;
        }
        if (!confirm(`사용자명(URL)을 "${finalUsername}"(으)로 하시겠습니까?\n\n코코봇 주소: mychatbot.world/bot/${finalUsername}\n\n수정하려면 "취소"를 누르세요.`)) {
            document.getElementById('botUsername').focus();
            _usernameManuallyEdited = true;
            return;
        }
    }
    if (step === 3) {
        const avatars = collectPersonas('avatar');
        if (avatars.length === 0) { alert('대표 페르소나를 설정해주세요'); return; }
        const invalidAvatar = avatars.find(p => !p.name.trim());
        if (invalidAvatar) { alert('대표 페르소나의 이름을 입력해주세요'); return; }
        updateVoiceGuide();
    }

    // Toggle steps (1-8)
    for (let i = 1; i <= 8; i++) {
        const el = document.getElementById('step' + i);
        if (el) {
            el.classList.toggle('hidden', i !== step);
            if (i === step) {
                el.style.animation = 'none';
                el.offsetHeight;
                el.style.animation = 'fadeIn 0.5s ease';
            }
        }
    }

    currentStep = step;

    // 단계 이동 시 자동 저장
    saveDraft();

    // Step 8 진입 시 배포 정보 세팅
    if (step === 8) _setupDeployStep();

    const pct = Math.round((step / PART1_STEPS) * 100);
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = pct + '%';

    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        el.classList.toggle('active', idx + 1 === step);
        el.classList.toggle('completed', idx + 1 < step);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === Step 2 & 3: Persona Cards ===
function addPersonaCard(type) {
    const isAvatar = type === 'avatar';
    const list = document.getElementById(isAvatar ? 'avatarPersonaList' : 'helperPersonaList');
    const count = isAvatar ? avatarPersonaCount : helperPersonaCount;
    const maxCount = 10;

    if (count >= maxCount) {
        alert('페르소나는 최대 ' + maxCount + '개까지 설정 가능합니다.');
        return;
    }

    if (isAvatar) avatarPersonaCount++;
    else helperPersonaCount++;

    const num = isAvatar ? avatarPersonaCount : helperPersonaCount;
    const id = type + '_' + Date.now();

    const div = document.createElement('div');
    div.className = 'persona-card persona-card-' + type;
    div.id = 'pc-' + id;
    div.dataset.personaType = type;

    const tagClass = isAvatar ? 'tag-avatar' : 'tag-helper';
    const tagLabel = isAvatar ? 'A형' : 'B형';
    const titleLabel = isAvatar ? '대면용 페르소나 ' + num : '도우미 페르소나 ' + num;
    const safeId = escHtml(id);
    const safeType = escHtml(type);
    const deleteBtn = num > 1 ? `<button class="persona-delete-btn" onclick="removePersonaCard('${safeId}','${safeType}')">✕</button>` : '';

    let typeSpecificHTML = '';

    if (!isAvatar) {
        // Helper type selector for B-type
        const helperHTML = HELPER_TYPES.map(h =>
            `<div class="helper-type-option">
                <input type="radio" name="htype-${id}" id="ht-${h.id}-${id}" value="${h.id}"${h.id === 'work' ? ' checked' : ''}>
                <label for="ht-${h.id}-${id}">${h.label}</label>
            </div>`
        ).join('');
        typeSpecificHTML = `
            <div class="persona-input-group">
                <label class="persona-input-label">도우미 유형</label>
                <div class="helper-type-grid">${helperHTML}</div>
            </div>`;
    }

    div.innerHTML = `
        <div class="persona-card-header">
            <div class="persona-card-title">
                <span class="persona-type-tag ${tagClass}">${tagLabel}</span>
                ${titleLabel}
            </div>
            ${deleteBtn}
        </div>

        <div class="persona-input-group">
            <label class="persona-input-label">페르소나 이름 *</label>
            <div class="input-with-mic">
                <input type="text" class="persona-input p-name" placeholder="${isAvatar ? '예: 고객 상담, 전문 컨설팅' : '예: 업무 비서, 학습 코치'}">
                <button type="button" class="mic-btn" onclick="voiceToInput(this)" title="음성 입력">🎤</button>
            </div>
        </div>

        <div class="persona-input-group">
            <label class="persona-input-label">사용자 호칭 *</label>
            <div class="input-with-mic">
                <input type="text" class="persona-input p-usertitle" value="${isAvatar ? '고객님' : '님'}" placeholder="${isAvatar ? '예: 고객님, 대표님, 선생님' : '예: 대표님, 사장님'}">
                <button type="button" class="mic-btn" onclick="voiceToInput(this)" title="음성 입력">🎤</button>
            </div>
        </div>

        ${typeSpecificHTML}

        <div class="persona-input-group">
            <label class="persona-input-label">역할/전문성 설명</label>
            <div class="input-with-mic">
                <textarea class="persona-textarea p-role" rows="2" placeholder="이 페르소나의 역할을 설명해주세요"></textarea>
                <button type="button" class="mic-btn" onclick="voiceToInput(this)" title="음성 입력">🎤</button>
            </div>
        </div>

        <div class="persona-input-group">
            <label class="persona-input-label">감정 슬라이더 (IQ ↔ EQ)</label>
            <div class="emotion-slider-wrap">
                <span class="emotion-label">💖 감성</span>
                <input type="range" class="emotion-slider p-iqeq" min="0" max="100" value="50"
                    oninput="updateSliderPreview(this)">
                <span class="emotion-label">🧠 논리</span>
            </div>
            <div class="slider-value-display">50 — 균형</div>
            <div class="slider-preview">"객관적으로 보면서도, 마음은 이해합니다."</div>
        </div>

        <div class="persona-input-group">
            <label class="persona-input-label">AI 두뇌 모델</label>
            <div class="model-select">
                <div class="model-option">
                    <input type="radio" name="model-${id}" id="ml-${id}" value="logic" checked>
                    <label for="ml-${id}">🧠 논리파</label>
                </div>
                <div class="model-option">
                    <input type="radio" name="model-${id}" id="me-${id}" value="emotion">
                    <label for="me-${id}">💖 감성파</label>
                </div>
                <div class="model-option">
                    <input type="radio" name="model-${id}" id="mf-${id}" value="fast">
                    <label for="mf-${id}">⚡ 속도파</label>
                </div>
                <div class="model-option">
                    <input type="radio" name="model-${id}" id="mc-${id}" value="creative">
                    <label for="mc-${id}">🎨 창작파</label>
                </div>
            </div>
        </div>
    `;

    list.appendChild(div);
}

function removePersonaCard(id, type) {
    const el = document.getElementById('pc-' + id);
    if (!el) return;
    el.remove();
    if (type === 'avatar') avatarPersonaCount--;
    else helperPersonaCount--;
}

// === Emotion Slider ===
function updateSliderPreview(slider) {
    const val = parseInt(slider.value, 10);
    const card = slider.closest('.persona-card');
    if (!card) return;

    // Update value display
    const valueDisplay = card.querySelector('.slider-value-display');
    if (valueDisplay) {
        let label = '';
        if (val <= 20) label = '감성 중심';
        else if (val <= 40) label = '감성 우세';
        else if (val <= 60) label = '균형';
        else if (val <= 80) label = '논리 우세';
        else label = '논리 중심';
        valueDisplay.textContent = val + ' — ' + label;
    }

    // Update preview text
    const preview = card.querySelector('.slider-preview');
    if (preview) {
        const match = SLIDER_PREVIEWS.find(p => val <= p.max);
        preview.textContent = '"' + (match ? match.text : SLIDER_PREVIEWS[4].text) + '"';
    }
}

// === Collect Personas ===
function collectPersonas(type) {
    const listId = type === 'avatar' ? 'avatarPersonaList' : 'helperPersonaList';
    const list = document.getElementById(listId);
    if (!list) return [];

    const personas = [];
    list.querySelectorAll('.persona-card').forEach(card => {
        const name = card.querySelector('.p-name')?.value || '';
        const role = card.querySelector('.p-role')?.value || '';
        const model = card.querySelector('input[type=radio][name^="model"]:checked')?.value || 'logic';
        const iqEq = parseInt(card.querySelector('.p-iqeq')?.value || '50', 10);

        let helperType = null;
        if (type !== 'avatar') {
            helperType = card.querySelector('input[type=radio][name^="htype"]:checked')?.value || 'work';
        }

        const userTitle = card.querySelector('.p-usertitle')?.value?.trim() || (type === 'avatar' ? '고객님' : '님');

        personas.push({
            id: type + '_' + name.replace(/\s/g, '_').toLowerCase() + '_' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36)),
            name: name,
            role: role,
            category: type,
            helperType: helperType,
            model: model,
            iqEq: iqEq,
            userTitle: userTitle,
            isVisible: true,
            isPublic: type === 'avatar',
            greeting: '',
            faqs: []
        });
    });
    return personas;
}

// === Step 4: Knowledge Base ===
// === Step 4: Interview ===

// Voice guide (generic — AI가 인터뷰 내용을 분석하여 인사말/FAQ 생성)
function updateVoiceGuide() {
    const list = document.getElementById('voiceGuideList');
    if (!list) return;

    const items = ['자기소개와 업무 소개', '고객이 자주 묻는 질문과 답변', '전문 분야와 강점', '원하는 대화 스타일'];
    list.innerHTML = items.map(g => '<li>' + g + '</li>').join('');
}

// Input mode toggle
function switchInputMode(mode) {
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (mode === 'voice' && i === 0) || (mode === 'text' && i === 1));
    });
    document.getElementById('voiceInput')?.classList.toggle('hidden', mode !== 'voice');
    document.getElementById('textInput')?.classList.toggle('hidden', mode !== 'text');
}

// Speech Recognition
function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ko-KR';
        recognition.onresult = (e) => {
            let final = '', interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) final += e.results[i][0].transcript;
                else interim += e.results[i][0].transcript;
            }
            if (final) transcriptText += final + ' ';
            const area = document.getElementById('transcriptArea');
            const txt = document.getElementById('transcriptText');
            if (transcriptText) {
                area?.classList.remove('hidden');
                if (txt) txt.textContent = transcriptText + interim;
            }
        };
        recognition.onerror = () => stopRecording();
        recognition.onend = () => { if (isRecording) recognition.start(); };
    }
}

function toggleRecording() {
    if (isRecording) stopRecording();
    else startRecording();
}

function startRecording() {
    if (!recognition) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트 입력을 이용해주세요.');
        return;
    }
    isRecording = true;
    remainingTime = 180;
    // transcriptText 초기화하지 않음 — 이어녹음 지원 (처음 시작 시에만 초기화)
    if (!transcriptText) transcriptText = '';
    document.getElementById('voiceCircle')?.classList.add('recording');
    document.getElementById('voiceIcon').textContent = '⏹';
    document.getElementById('voiceHint').textContent = '녹음 중... 탭하여 정지';
    recognition.start();
    recordingTimer = setInterval(() => {
        remainingTime--;
        const min = Math.floor(remainingTime / 60);
        const sec = String(remainingTime % 60).padStart(2, '0');
        document.getElementById('voiceTimer').textContent = min + ':' + sec;
        if (remainingTime <= 0) stopRecording();
    }, 1000);
}

function stopRecording() {
    isRecording = false;
    if (recognition) recognition.stop();
    clearInterval(recordingTimer);
    document.getElementById('voiceCircle')?.classList.remove('recording');
    document.getElementById('voiceIcon').textContent = '🎤';
    document.getElementById('voiceHint').textContent = '녹음 완료! 아래에서 AI 분석을 시작하세요.';
}

function setupTextCounter() {
    const ta = document.getElementById('textContent');
    const ct = document.getElementById('charCount');
    if (ta && ct) {
        ta.addEventListener('input', () => ct.textContent = ta.value.length);
    }
}

// === Step 4: AI Analysis ===
async function analyzeInput() {
    const voiceText = transcriptText.trim();
    const manualText = document.getElementById('textContent')?.value.trim() || '';
    const inputText = voiceText || manualText;

    if (!inputText || inputText.length < 10) {
        alert('음성 또는 텍스트로 최소 10자 이상 입력해주세요.');
        return;
    }

    goToStep(4);

    // Build result — 대표 페르소나 1개만
    const botName = document.getElementById('botName').value.trim();
    const botDesc = document.getElementById('botDesc').value.trim();
    const avatarPersonas = collectPersonas('avatar');
    const primaryPersona = avatarPersonas[0];

    // AI 분석 단계 애니메이션 + 실제 API 호출 병렬
    const aiPromise = primaryPersona
        ? callAIAnalysis(botName, botDesc, inputText, primaryPersona)
        : Promise.resolve(null);

    const steps = document.querySelectorAll('#analysisSteps .analysis-step');
    for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, 800));
        steps[i].classList.add('active');
        if (i > 0) steps[i - 1].classList.remove('active');
        steps[i].classList.add('done');
    }

    // AI 결과 대기
    const aiResult = await aiPromise;

    if (primaryPersona) {
        if (aiResult) {
            primaryPersona.greeting = aiResult.greeting;
            primaryPersona.faqs = aiResult.faqs;
            console.log('[AI] greeting/FAQ generated via', aiResult.source);
        } else {
            primaryPersona.greeting = generateGreeting(botName, primaryPersona);
            primaryPersona.faqs = generateDefaultFaqs(primaryPersona);
            console.log('[AI] fallback to rule-based generation');
        }
    }

    await new Promise(r => setTimeout(r, 300));

    const result = {
        botName: botName,
        botDesc: botDesc,
        greeting: primaryPersona?.greeting || '',
        faqs: primaryPersona?.faqs || [],
        personas: avatarPersonas,
        inputText: inputText,
        createdAt: new Date().toISOString()
    };

    // Show result
    document.getElementById('analysisAnimation')?.classList.add('hidden');
    const resultDiv = document.getElementById('analysisResult');
    resultDiv?.classList.remove('hidden');

    const personaName = primaryPersona?.name || '';
    const greeting = primaryPersona?.greeting || '';
    const faqs = primaryPersona?.faqs || [];

    document.getElementById('resultPreview').innerHTML = `
        <div class="result-item">
            <div class="result-label">대표 페르소나</div>
            <div class="result-value">${escHtml(personaName)}</div>
        </div>
        <div class="result-item">
            <div class="result-label">인사말</div>
            <div class="result-value">"${escHtml(greeting)}"</div>
        </div>
        ${faqs.length > 0 ? `
        <div class="result-item">
            <div class="result-label">예상 Q&A</div>
            <ul class="result-faq-list">${faqs.slice(0, 5).map(f =>
                '<li><strong>Q:</strong> ' + escHtml(f.q) + (f.a ? '<br><strong>A:</strong> ' + escHtml(f.a) : '') + '</li>'
            ).join('')}</ul>
        </div>` : ''}
    `;

    window._createdBot = result;
}

// AI API 호출 (서버 → 클라이언트 직접 → null)
async function callAIAnalysis(botName, botDesc, inputText, persona) {
    // 1차: 서버 API (/api/create-bot)
    try {
        const res = await fetch('/api/create-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                botName, botDesc, inputText,
                persona: { name: persona.name, role: persona.role, iqEq: persona.iqEq }
            })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.greeting && data.faqs) {
                return { greeting: data.greeting, faqs: data.faqs, source: '/api/create-bot' };
            }
        }
    } catch (e) {
        console.warn('[AI] server API failed:', e.message);
    }

    // All AI calls go through server-side /api/create-bot only (API key is in Vercel env vars)
    return null;
}

function generateGreeting(botName, persona) {
    const iq = persona.iqEq;
    if (iq >= 75) return '안녕하세요. ' + botName + '의 ' + persona.name + '입니다. 정확하고 전문적인 답변으로 도와드리겠습니다.';
    if (iq >= 50) return '안녕하세요! ' + botName + '의 ' + persona.name + '입니다. 무엇이든 편하게 물어보세요.';
    if (iq >= 25) return '안녕하세요! ' + botName + '의 ' + persona.name + '이에요. 함께 이야기해볼까요?';
    return '반가워요! ' + botName + '의 ' + persona.name + '이에요. 편하게 말씀해 주세요.';
}

function generateDefaultFaqs(persona) {
    if (persona.category === 'helper') {
        const map = {
            work: [{ q: '오늘 일정 알려줘', a: '' }, { q: '이메일 초안 작성해줘', a: '' }, { q: '회의 요약해줘', a: '' }],
            life: [{ q: '오늘 날씨 어때?', a: '' }, { q: '근처 맛집 추천해줘', a: '' }, { q: '건강 팁 알려줘', a: '' }],
            study: [{ q: '이 개념 설명해줘', a: '' }, { q: '공부 계획 짜줘', a: '' }, { q: '퀴즈 내줘', a: '' }],
            creative: [{ q: '글 아이디어 추천해줘', a: '' }, { q: '문장 다듬어줘', a: '' }, { q: '제목 만들어줘', a: '' }],
            etc: [{ q: '도움이 필요해요', a: '' }, { q: '추천해줘', a: '' }]
        };
        return map[persona.helperType] || map.etc;
    }
    return [
        { q: '소개해주세요', a: '' },
        { q: '서비스 안내', a: '' },
        { q: '연락처', a: '' }
    ];
}

// === Step 7: Complete ===
async function completeCreation() {
    const bot = window._createdBot;
    if (!bot) return;
    window._createdBot = null; // 중복 실행 방지

    const username = document.getElementById('botUsername').value.trim() ||
        _koreanToUrl(bot.botName);

    const currentUser = CoCoBot.user.getCurrentUser();
    const botData = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
        username: username,
        ownerId: currentUser ? currentUser.id : 'anonymous',
        ...bot,
        voice: getSelectedVoice()
    };

    // === S3F13: Steps 6-8 데이터 영속화 ===
    // 아바타: 업로드 이미지가 있으면 이미지 우선, 없으면 이모지 키
    if (window._avatarImageData) {
        botData.avatarImage = window._avatarImageData;
    }
    botData.avatar = selectedAvatarEmoji;

    // 테마 (다크/라이트 모드 + 색상)
    botData.theme = {
        mode: selectedThemeMode,
        color: selectedThemeColor
    };

    // 음성 (이미 botData.voice에 설정됨, 명시적 재확인)
    botData.voice = getSelectedVoice();

    // 1) localStorage 저장 (기존 방식, 즉시 사용 가능)
    CoCoBot.storage.saveBot(botData);
    savedBotId = botData.id;

    // 2) 인터뷰 텍스트 → IndexedDB 저장
    const primaryPersonaId = (botData.personas && botData.personas[0]) ? botData.personas[0].id : 'default';
    if (botData.inputText) {
        try {
            await StorageManager.save('interview-text', `interview_${botData.id}_${primaryPersonaId}`, botData.inputText, { botId: botData.id });
        } catch (err) { console.warn('[Create] interview save:', err); }
    }

    // 3) Supabase 클라우드 동기화 (공개 데이터: 봇 프로필 + 페르소나)
    try {
        await StorageManager.syncBotToCloud(botData);
        console.log('[Create] Bot synced to Supabase');
    } catch (err) {
        console.warn('[Create] Cloud sync skipped:', err.message);
    }

    // 생성 완료 → 초안 삭제
    clearDraft();

    // 코코봇 생성 완료 → Step 6 (아바타 설정)으로 이동
    goToStep(6);
    clearDraft();

    // Step 8에 URL/QR 미리 세팅 (배포 단계에서 표시)
    const baseUrl = window.location.origin;
    const finalUrl = baseUrl + '/bot/' + username;
    window._deployUrl = finalUrl;
    window._deployUsername = username;
    window._savedBotId = botData.id;
}

function _setupDeployStep() {
    const url = window._deployUrl;
    if (!url) return;
    const botUrlEl = document.getElementById('botUrl');
    const chatLinkEl = document.getElementById('chatLink');
    const qrEl = document.getElementById('qrCode');
    if (botUrlEl) botUrlEl.value = url;
    if (chatLinkEl) chatLinkEl.href = '/bot/' + encodeURIComponent(window._deployUsername || '');
    if (qrEl) qrEl.innerHTML =
        '<img src="' + CoCoBot.getQRCodeURL(url, 200) + '" alt="QR Code" style="width:200px;height:200px;border-radius:12px;">';

    // === S3F13: Step 8 완료 후 온보딩 카드 표시 ===
    _showOnboardingCards();
}

// === S3F13: 온보딩 카드 3개 표시 ===
function _showOnboardingCards() {
    const botId = window._savedBotId || savedBotId || '';
    const username = window._deployUsername || '';

    // 이미 온보딩 카드가 있으면 중복 생성 방지
    if (document.getElementById('onboardingCards')) return;

    const onboardingHtml = `
        <div id="onboardingCards" style="
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255,255,255,0.1);
        ">
            <h3 style="
                font-size: 1.1rem;
                font-weight: 600;
                color: rgba(255,255,255,0.9);
                margin-bottom: 1rem;
                text-align: center;
            ">다음 단계로 이동하세요</h3>
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 1rem;
            ">
                <a href="/pages/bot/index.html?id=${encodeURIComponent(botId)}"
                   style="
                    display: block;
                    padding: 1.25rem 1rem;
                    background: rgba(124, 58, 237, 0.15);
                    border: 1px solid rgba(124, 58, 237, 0.4);
                    border-radius: 12px;
                    text-align: center;
                    text-decoration: none;
                    transition: background 0.2s, border-color 0.2s;
                   "
                   onmouseover="this.style.background='rgba(124,58,237,0.3)';this.style.borderColor='rgba(124,58,237,0.7)'"
                   onmouseout="this.style.background='rgba(124,58,237,0.15)';this.style.borderColor='rgba(124,58,237,0.4)'"
                >
                    <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">💬</div>
                    <div style="font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 0.25rem;">지금 대화해보기</div>
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">코코봇과 첫 대화</div>
                </a>
                <a href="/pages/home/index.html"
                   style="
                    display: block;
                    padding: 1.25rem 1rem;
                    background: rgba(37, 99, 235, 0.15);
                    border: 1px solid rgba(37, 99, 235, 0.4);
                    border-radius: 12px;
                    text-align: center;
                    text-decoration: none;
                    transition: background 0.2s, border-color 0.2s;
                   "
                   onmouseover="this.style.background='rgba(37,99,235,0.3)';this.style.borderColor='rgba(37,99,235,0.7)'"
                   onmouseout="this.style.background='rgba(37,99,235,0.15)';this.style.borderColor='rgba(37,99,235,0.4)'"
                >
                    <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">❓</div>
                    <div style="font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 0.25rem;">FAQ 추가하기</div>
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">자주 묻는 질문 관리</div>
                </a>
                <a href="/pages/skills/index.html"
                   style="
                    display: block;
                    padding: 1.25rem 1rem;
                    background: rgba(22, 163, 74, 0.15);
                    border: 1px solid rgba(22, 163, 74, 0.4);
                    border-radius: 12px;
                    text-align: center;
                    text-decoration: none;
                    transition: background 0.2s, border-color 0.2s;
                   "
                   onmouseover="this.style.background='rgba(22,163,74,0.3)';this.style.borderColor='rgba(22,163,74,0.7)'"
                   onmouseout="this.style.background='rgba(22,163,74,0.15)';this.style.borderColor='rgba(22,163,74,0.4)'"
                >
                    <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">⚡</div>
                    <div style="font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 0.25rem;">스킬 장착하기</div>
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">코코봇 능력 강화</div>
                </a>
            </div>
        </div>
    `;

    // Step 8 컨테이너 내부에 온보딩 카드 삽입
    const step8 = document.getElementById('step8');
    if (step8) {
        step8.insertAdjacentHTML('beforeend', onboardingHtml);
    }
}

async function downloadQR() {
    const img = document.querySelector('#qrCode img');
    if (!img) return;
    try {
        const res = await fetch(img.src);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'chatbot-qr.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
        window.open(img.src, '_blank');
    }
}

function copyUrl() {
    const input = document.getElementById('botUrl');
    input.select();
    navigator.clipboard?.writeText(input.value).then(() => {
        CoCoBot.showToast?.('URL이 복사되었습니다!');
    }).catch(() => {
        document.execCommand('copy');
        alert('URL이 복사되었습니다!');
    });
}

// === Voice Picker ===
function initVoicePicker() {
    const grid = document.getElementById('voicePickGrid');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
        const card = e.target.closest('.voice-pick-card');
        if (!card) return;
        grid.querySelectorAll('.voice-pick-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        card.querySelector('input').checked = true;
    });
}

function getSelectedVoice() {
    const checked = document.querySelector('input[name="botVoice"]:checked');
    return checked ? checked.value : 'fable';
}

var _voicePreviewPlayer = new Audio();
function previewVoice() {
    var voice = getSelectedVoice();
    var btn = document.getElementById('voicePreviewBtn');
    if (btn) btn.textContent = '재생 중...';
    fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '안녕하세요, 반갑습니다! 무엇이든 물어보세요.', voice: voice })
    }).then(function(res) {
        if (!res.ok) throw new Error('TTS ' + res.status);
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('audio') === -1) throw new Error('Not audio');
        return res.blob();
    }).then(function(blob) {
        var url = URL.createObjectURL(blob);
        _voicePreviewPlayer.pause();
        _voicePreviewPlayer.src = url;
        _voicePreviewPlayer.play();
        _voicePreviewPlayer.onended = function() { URL.revokeObjectURL(url); if (btn) btn.textContent = '미리듣기'; };
    }).catch(function() {
        if (window.speechSynthesis) {
            var u = new SpeechSynthesisUtterance('안녕하세요, 반갑습니다!');
            u.lang = 'ko-KR';
            window.speechSynthesis.speak(u);
        }
        if (btn) btn.textContent = '미리듣기';
    });
}

// === @task S2F7: 인사말 TTS 미리듣기 ===
var _greetingPreviewPlayer = new Audio();

function previewGreeting() {
    // window._createdBot.greeting 또는 resultPreview 텍스트에서 추출
    var greetingText = '';
    if (window._createdBot && window._createdBot.greeting) {
        greetingText = window._createdBot.greeting;
    } else {
        // resultPreview DOM에서 인사말 텍스트 파싱 (fallback)
        var items = document.querySelectorAll('#resultPreview .result-item');
        for (var i = 0; i < items.length; i++) {
            var label = items[i].querySelector('.result-label');
            var value = items[i].querySelector('.result-value');
            if (label && label.textContent.trim() === '인사말' && value) {
                greetingText = value.textContent.replace(/^"|"$/g, '').trim();
                break;
            }
        }
    }

    if (!greetingText) {
        alert('미리 들을 인사말이 없습니다. AI 분석을 먼저 완료해주세요.');
        return;
    }

    var btn = document.getElementById('previewGreetingBtn');
    var status = document.getElementById('previewGreetingStatus');
    var voice = getSelectedVoice();

    if (btn) { btn.disabled = true; btn.textContent = '로딩 중...'; }
    if (status) status.textContent = '';

    fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: greetingText, voice: voice })
    }).then(function(res) {
        if (!res.ok) throw new Error('TTS ' + res.status);
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('audio') === -1) throw new Error('Not audio');
        return res.blob();
    }).then(function(blob) {
        var url = URL.createObjectURL(blob);
        _greetingPreviewPlayer.pause();
        _greetingPreviewPlayer.src = url;
        if (btn) btn.textContent = '재생 중...';
        if (status) status.textContent = '목소리: ' + voice;
        _greetingPreviewPlayer.play();
        _greetingPreviewPlayer.onended = function() {
            URL.revokeObjectURL(url);
            if (btn) { btn.textContent = '\u25B6 인사말 듣기'; btn.disabled = false; }
            if (status) status.textContent = '';
        };
        _greetingPreviewPlayer.onerror = function() {
            URL.revokeObjectURL(url);
            if (btn) { btn.textContent = '\u25B6 인사말 듣기'; btn.disabled = false; }
            if (status) status.textContent = '';
        };
    }).catch(function(err) {
        // /api/tts 실패 시 브라우저 Web Speech API fallback
        if (window.speechSynthesis) {
            var u = new SpeechSynthesisUtterance(greetingText);
            u.lang = 'ko-KR';
            u.onend = function() {
                if (btn) { btn.textContent = '\u25B6 인사말 듣기'; btn.disabled = false; }
                if (status) status.textContent = '';
            };
            window.speechSynthesis.speak(u);
            if (btn) btn.textContent = '재생 중...';
            if (status) status.textContent = '(브라우저 TTS)';
        } else {
            alert('인사말 미리듣기에 실패했습니다: ' + err.message);
            if (btn) { btn.textContent = '\u25B6 인사말 듣기'; btn.disabled = false; }
            if (status) status.textContent = '';
        }
    });
}

// === Step 6: 아바타 설정 ===
const AVATAR_EMOJIS = {
    robot: '🤖', man: '👨', woman: '👩', person: '🧑', business: '👔', academic: '🎓'
};

function selectAvatarEmoji(el, key) {
    selectedAvatarEmoji = key;
    document.querySelectorAll('.avatar-emoji-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
}

function handleAvatarUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        alert('이미지 파일은 2MB 이하만 업로드 가능합니다.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('avatarUploadPreview');
        if (preview) {
            preview.innerHTML = '<img src="' + e.target.result + '" alt="avatar" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">';
        }
        window._avatarImageData = e.target.result;
    };
    reader.readAsDataURL(file);
}

// === Step 7: 테마 선택 ===
const THEME_COLORS = {
    purple: '#7c3aed', blue: '#2563eb', green: '#16a34a', red: '#dc2626', orange: '#ea580c'
};

function selectThemeMode(mode) {
    selectedThemeMode = mode;
    document.getElementById('themeDark')?.classList.toggle('active', mode === 'dark');
    document.getElementById('themeLight')?.classList.toggle('active', mode === 'light');
    _updateThemePreview();
}

function selectThemeColor(el, color) {
    selectedThemeColor = color;
    document.querySelectorAll('.theme-color-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    el.innerHTML = '<span class="theme-color-check">✓</span>';
    _updateThemePreview();
}

function _updateThemePreview() {
    const box = document.getElementById('themePreviewBox');
    const header = document.getElementById('themePreviewHeader');
    const body = document.getElementById('themePreviewBody');
    const nameEl = document.getElementById('themePreviewName');
    if (!box) return;

    const color = THEME_COLORS[selectedThemeColor] || '#7c3aed';
    const isDark = selectedThemeMode === 'dark';
    const botName = document.getElementById('botName')?.value || '코코봇';

    box.style.background = isDark ? '#1a1a2e' : '#f8f9fa';
    box.style.border = '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
    if (header) header.style.background = color;
    if (nameEl) nameEl.textContent = botName;

    // Update bubble colors
    const userBubbles = body?.querySelectorAll('.theme-preview-bubble.user');
    userBubbles?.forEach(b => { b.style.background = color; b.style.color = 'white'; });
    const botBubbles = body?.querySelectorAll('.theme-preview-bubble.bot');
    botBubbles?.forEach(b => {
        b.style.background = isDark ? '#2a2a3e' : '#ffffff';
        b.style.color = isDark ? 'rgba(255,255,255,0.9)' : '#333';
    });
}

// === Step 8: 배포 채널 ===
function getSelectedChannels() {
    return Array.from(document.querySelectorAll('input[name="deployChannel"]:checked')).map(cb => cb.value);
}

// (지식베이스, 스킬, 코코봇스쿨은 마이페이지에서 관리)
