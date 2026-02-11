/**
 * @task S2F2
 * Create Page JavaScript - 6-step chatbot creation wizard
 */
let currentStep = 1;
let selectedTemplate = null;
let isRecording = false;
let recordingTimer = null;
let remainingTime = 300;
let recognition = null;
let transcriptText = '';
let personaCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    renderTemplateSelect();
    setupSpeechRecognition();
    setupTextCounter();
    // Add default persona
    addPersona();
});

// Step navigation
function goToStep(step) {
    // Validate current step
    if (step === 2 && !selectedTemplate) {
        alert('분야를 선택해주세요');
        return;
    }
    if (step === 3) {
        const name = document.getElementById('botName').value.trim();
        if (!name) { alert('챗봇 이름을 입력해주세요'); return; }
    }
    if (step === 4) {
        // Validate Persona Step
        const personas = collectPersonas();
        if (personas.length === 0) { alert('최소 1개의 페르소나를 설정해주세요'); return; }
        const invalid = personas.find(p => !p.name.trim());
        if (invalid) { alert('모든 페르소나의 이름을 입력해주세요'); return; }
    }

    // Hide all steps, show target
    for (let i = 1; i <= 6; i++) {
        const el = document.getElementById('step' + i);
        if (el) {
            el.classList.toggle('hidden', i !== step);
            // Re-trigger animation
            if (i === step) {
                el.style.animation = 'none';
                el.offsetHeight; /* trigger reflow */
                el.style.animation = 'fadeIn 0.5s ease';
            }
        }
    }

    // Update progress (Map 6 steps to 5 dots)
    // Step 1,2,3 -> 1,2,3
    // Step 4 (Interview) -> 4
    // Step 5 (Analysis) -> 5
    // Step 6 (Complete) -> 5 (Completed)
    currentStep = step;
    const progressStep = Math.min(step, 5);

    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = (progressStep * 20) + '%';

    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        el.classList.toggle('active', idx + 1 === progressStep);
        el.classList.toggle('completed', idx + 1 < progressStep);
    });

    // Update voice guide for template
    if (step === 4) updateVoiceGuide();
}

// === Multi-Persona Logic ===
function addPersona() {
    if (personaCount >= 5) {
        alert('페르소나는 최대 5개까지 설정 가능합니다.');
        return;
    }
    personaCount++;
    const id = Date.now();
    const div = document.createElement('div');
    div.className = 'persona-card';
    div.id = `persona-${id}`;
    div.innerHTML = `
        <div class="persona-card-header">
            <div class="persona-card-title">
                <span class="persona-counter">Persona ${personaCount}</span>
                자아 설정
            </div>
            ${personaCount > 1 ? `<button class="persona-delete-btn" onclick="removePersona('${id}')">🗑️</button>` : ''}
        </div>
        
        <div class="persona-input-group">
            <label class="persona-input-label">자아 이름 (예: AI 마스터)</label>
            <input type="text" class="persona-input p-name" placeholder="이름 입력">
        </div>
        
        <div class="persona-input-group">
            <label class="persona-input-label">역할/전문성 (예: 기술적 조언)</label>
            <input type="text" class="persona-input p-role" placeholder="역할 설명">
        </div>
        
        <div class="persona-input-group">
            <label class="persona-input-label">AI 두뇌 모델</label>
            <div class="model-select">
                <div class="model-option">
                    <input type="radio" name="model-${id}" id="m-logic-${id}" value="logic" checked>
                    <label for="m-logic-${id}">🧠 논리파<br>(GPT-4)</label>
                </div>
                <div class="model-option">
                    <input type="radio" name="model-${id}" id="m-emotion-${id}" value="emotion">
                    <label for="m-emotion-${id}">💖 감성파<br>(Claude)</label>
                </div>
                <div class="model-option">
                    <input type="radio" name="model-${id}" id="m-fast-${id}" value="fast">
                    <label for="m-fast-${id}">⚡ 속도파<br>(Gemini)</label>
                </div>
                <div class="model-option">
                    <input type="radio" name="model-${id}" id="m-creative-${id}" value="creative">
                    <label for="m-creative-${id}">🎨 창작파<br>(DALL-E)</label>
                </div>
            </div>
        </div>
        
        <div class="persona-input-group">
            <div class="toggle-switch-container">
                <div class="slider-container" style="flex:1; margin-right:1rem;">
                    <span>지성(IQ)</span>
                    <input type="range" class="iq-eq-slider p-slider" min="0" max="100" value="50">
                    <span>감성(EQ)</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" class="toggle-input p-visible" checked>
                    <div class="toggle-slider"></div>
                    <span class="toggle-switch-label">공개</span>
                </label>
            </div>
        </div>
    `;
    document.getElementById('personaList').appendChild(div);
    updateAddButton();
}

function removePersona(id) {
    if (personaCount <= 1) return;
    document.getElementById(`persona-${id}`).remove();
    personaCount--;
    updateAddButton();
    // Re-index titles optionally, but simpler to leave as is or re-render labels
}

function updateAddButton() {
    const btn = document.getElementById('addPersonaBtn');
    if (personaCount >= 5) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.textContent = '최대 5개까지 추가 가능';
    } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.textContent = '+ 페르소나 추가';
    }
}

function collectPersonas() {
    const list = [];
    document.querySelectorAll('.persona-card').forEach(card => {
        list.push({
            name: card.querySelector('.p-name').value,
            role: card.querySelector('.p-role').value,
            model: card.querySelector('input[type=radio]:checked').value,
            iqEq: card.querySelector('.p-slider').value,
            isVisible: card.querySelector('.p-visible').checked
        });
    });
    return list;
}

// Template selection
function renderTemplateSelect() {
    const grid = document.getElementById('templateSelectGrid');
    if (!grid) return;
    const templates = MCW.templates;
    grid.innerHTML = Object.values(templates).map(t => `
    <div class="template-select-card" id="tpl-${t.id}" onclick="selectTemplate('${t.id}')">
      <div class="template-icon">${t.icon}</div>
      <h4>${t.name}</h4>
      <p>${t.description}</p>
    </div>
  `).join('');
}

function selectTemplate(id) {
    selectedTemplate = MCW.templates[id];
    document.querySelectorAll('.template-select-card').forEach(el => {
        el.classList.toggle('selected', el.id === 'tpl-' + id);
    });
    setTimeout(() => goToStep(2), 300);
}

// Voice guide based on template
function updateVoiceGuide() {
    const list = document.getElementById('voiceGuideList');
    if (!list || !selectedTemplate) return;
    const guides = {
        smallbiz: ['가게 소개와 분위기', '대표 메뉴/상품 3~5가지', '영업시간과 위치', '예약/배달 방법'],
        realtor: ['사무소 소개', '전문 지역/매물 유형', '자주 받는 문의', '수수료/상담 절차'],
        lawyer: ['전문 분야 소개', '대표 성공 사례', '상담 예약 방법', '비용 안내'],
        accountant: ['사무소 소개', '전문 서비스 (기장/세무/회계)', '자주 받는 세금 질문', '상담 예약 방법'],
        medical: ['병원/클리닉 소개', '진료 과목', '진료 시간과 예약 방법', '보험 적용 여부'],
        insurance: ['전문 보험 상품 소개', '보장 분석 서비스', '자주 받는 문의', '상담 예약 방법'],
        politician: ['자기소개와 정치 철학', '대표 공약 3~5가지', '유권자가 자주 묻는 질문', '연락처와 사무실 위치'],
        instructor: ['전문 분야 소개', '대표 강의/코칭 소개', '수강생이 자주 묻는 질문', '수강 신청 방법'],
        freelancer: ['전문 분야와 경력', '포트폴리오 소개', '작업 프로세스', '견적/결제 방법'],
        consultant: ['컨설팅 분야 소개', '대표 성공 사례', '진행 절차', '비용/견적 안내']
    };
    const items = guides[selectedTemplate.id] || guides.smallbiz;
    list.innerHTML = items.map(g => `<li>${g}</li>`).join('');
}

// Input mode toggle
function switchInputMode(mode) {
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (mode === 'voice' && i === 0) || (mode === 'text' && i === 1));
    });
    document.getElementById('voiceInput').classList.toggle('hidden', mode !== 'voice');
    document.getElementById('textInput').classList.toggle('hidden', mode !== 'text');
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
                area.classList.remove('hidden');
                txt.textContent = transcriptText + interim;
            }
        };
        recognition.onerror = (e) => { console.error('Speech error:', e.error); stopRecording(); };
        recognition.onend = () => { if (isRecording) recognition.start(); };
    }
}

function toggleRecording() {
    if (isRecording) stopRecording();
    else startRecording();
}

function startRecording() {
    if (!recognition) { alert('이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트 입력을 이용해주세요.'); return; }
    isRecording = true;
    remainingTime = 180;
    transcriptText = '';
    document.getElementById('voiceCircle').classList.add('recording');
    document.getElementById('voiceIcon').textContent = '⏹';
    document.getElementById('voiceHint').textContent = '녹음 중... 탭하여 정지';
    recognition.start();
    recordingTimer = setInterval(() => {
        remainingTime--;
        const min = Math.floor(remainingTime / 60);
        const sec = String(remainingTime % 60).padStart(2, '0');
        document.getElementById('voiceTimer').textContent = `${min}:${sec}`;
        if (remainingTime <= 0) stopRecording();
    }, 1000);
}

function stopRecording() {
    isRecording = false;
    if (recognition) recognition.stop();
    clearInterval(recordingTimer);
    document.getElementById('voiceCircle').classList.remove('recording');
    document.getElementById('voiceIcon').textContent = '🎤';
    document.getElementById('voiceHint').textContent = '녹음 완료! 아래에서 AI 분석을 시작하세요.';
}

// Text counter
function setupTextCounter() {
    const ta = document.getElementById('textContent');
    const ct = document.getElementById('charCount');
    if (ta && ct) {
        ta.addEventListener('input', () => ct.textContent = ta.value.length);
    }
}

// AI Analysis
async function analyzeInput() {
    const voiceText = transcriptText.trim();
    const manualText = document.getElementById('textContent')?.value.trim() || '';
    const inputText = voiceText || manualText;

    if (!inputText || inputText.length < 20) {
        alert('음성 또는 텍스트로 최소 20자 이상 입력해주세요.');
        return;
    }

    goToStep(5); // Show Analysis Screen (Step 5 now)

    // Simulate AI analysis steps
    const steps = document.querySelectorAll('#analysisSteps .analysis-step');
    for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, 800));
        steps[i].classList.add('active');
        if (i > 0) steps[i - 1].classList.remove('active');
        steps[i].classList.add('done');
    }

    await new Promise(r => setTimeout(r, 500));

    // Generate result (MVP: local AI analysis simulation)
    const botName = document.getElementById('botName').value.trim();
    const botDesc = document.getElementById('botDesc').value.trim();
    const template = selectedTemplate;
    const personas = collectPersonas();

    const result = generateBotResult(botName, botDesc, template, inputText, personas);

    // Show result
    document.getElementById('analysisAnimation').classList.add('hidden');
    const resultDiv = document.getElementById('analysisResult');
    resultDiv.classList.remove('hidden');

    // Preview with Persona info
    document.getElementById('resultPreview').innerHTML = `
    <div class="result-item"><div class="result-label">생성된 페르소나</div><div class="result-value">${personas.length}개 자아 (${personas.map(p => p.name).join(', ')})</div></div>
    <div class="result-item"><div class="result-label">대표 인사말</div><div class="result-value">"${result.greeting}"</div></div>
    <div class="result-item">
      <div class="result-label">자동 생성 FAQ (${result.faqs.length}개)</div>
      <ul class="result-faq-list">${result.faqs.map(f => `<li><strong>Q:</strong> ${f.q}<br><strong>A:</strong> ${f.a}</li>`).join('')}</ul>
    </div>
  `;

    // Save bot data
    window._createdBot = result;
}

function generateBotResult(name, desc, template, text, personas) {
    const faqTemplates = MCW.templates[template.id].faqs || MCW.templates.smallbiz.faqs;
    const greeting = MCW.templates[template.id].greeting.replace('{name}', name);

    return {
        botName: name,
        botDesc: desc,
        templateId: template.id,
        personas: personas, // Save Multi-Persona Data
        greeting: greeting,
        faqs: faqTemplates,
        inputText: text,
        createdAt: new Date().toISOString()
    };
}

// Complete creation
function completeCreation() {
    const bot = window._createdBot;
    if (!bot) return;

    const username = document.getElementById('botUsername').value.trim() ||
        bot.botName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // Save to localStorage
    const botData = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
        username: username,
        ...bot
    };
    MCW.storage.saveBot(botData);

    goToStep(6); // Complete Screen (Step 6 now)

    // Show URL & QR
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/bot/${username}`;
    document.getElementById('botUrl').value = url;
    document.getElementById('chatLink').href = `/bot/${username}`;
    document.getElementById('qrCode').innerHTML = `<img src="${MCW.getQRCodeURL(url, 200)}" alt="QR Code" style="width:200px;height:200px;border-radius:12px;">`;
}

function copyUrl() {
    const input = document.getElementById('botUrl');
    input.select();
    document.execCommand('copy');
    alert('URL이 복사되었습니다!');
}
