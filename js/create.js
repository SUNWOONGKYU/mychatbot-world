/**
 * @task S2F2
 * Create Page JavaScript - 5-step chatbot creation wizard
 */
let currentStep = 1;
let selectedTemplate = null;
let isRecording = false;
let recordingTimer = null;
let remainingTime = 180;
let recognition = null;
let transcriptText = '';

document.addEventListener('DOMContentLoaded', () => {
    renderTemplateSelect();
    setupSpeechRecognition();
    setupTextCounter();
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

    // Hide all steps, show target
    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById('step' + i);
        if (el) el.classList.toggle('hidden', i !== step);
    }

    // Update progress
    currentStep = step;
    const fill = document.getElementById('progressFill');
    fill.style.width = (step * 20) + '%';
    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        el.classList.toggle('active', idx + 1 === step);
        el.classList.toggle('completed', idx + 1 < step);
    });

    // Update voice guide for template
    if (step === 3) updateVoiceGuide();
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
        politician: ['자기소개와 정치 철학', '대표 공약 3~5가지', '유권자가 자주 묻는 질문', '연락처와 사무실 위치'],
        youtuber: ['채널 소개와 콘텐츠 장르', '대표 콘텐츠 소개', '팬들이 자주 묻는 질문', 'SNS 링크와 활동 일정'],
        ceo: ['회사/서비스 소개', '핵심 제품/서비스', '고객이 자주 묻는 질문', '상담 예약 방법'],
        instructor: ['전문 분야 소개', '대표 강의/코칭 소개', '수강생이 자주 묻는 질문', '수강 신청 방법'],
        restaurant: ['가게 이름과 분위기', '대표 메뉴 3~5가지', '영업시간과 위치', '예약/배달 방법']
    };
    const items = guides[selectedTemplate.id] || guides.ceo;
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

    goToStep(4);

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

    const result = generateBotResult(botName, botDesc, template, inputText);

    // Show result
    document.getElementById('analysisAnimation').classList.add('hidden');
    const resultDiv = document.getElementById('analysisResult');
    resultDiv.classList.remove('hidden');
    document.getElementById('resultPreview').innerHTML = `
    <div class="result-item"><div class="result-label">성격</div><div class="result-value">${result.personality}</div></div>
    <div class="result-item"><div class="result-label">어조</div><div class="result-value">${result.tone}</div></div>
    <div class="result-item"><div class="result-label">인사말</div><div class="result-value">"${result.greeting}"</div></div>
    <div class="result-item">
      <div class="result-label">자동 생성 FAQ (${result.faqs.length}개)</div>
      <ul class="result-faq-list">${result.faqs.map(f => `<li><strong>Q:</strong> ${f.q}<br><strong>A:</strong> ${f.a}</li>`).join('')}</ul>
    </div>
  `;

    // Save bot data
    window._createdBot = result;
}

function generateBotResult(name, desc, template, text) {
    const personalities = {
        politician: '국민과 소통하는 따뜻하고 신뢰감 있는 정치인',
        youtuber: '팬들과 친근하게 소통하는 에너지 넘치는 크리에이터',
        ceo: '전문적이면서도 친근한 기업 대표',
        instructor: '학생들을 이끄는 열정적인 전문가',
        restaurant: '손님을 환대하는 따뜻한 가게 주인'
    };
    const tones = {
        politician: '존댓말, 정중하고 진정성 있는 어조',
        youtuber: '친근한 반말~존댓말, 유머러스한 어조',
        ceo: '비즈니스 존댓말, 전문적이면서 친절한 어조',
        instructor: '존댓말, 격려하고 동기부여하는 어조',
        restaurant: '친근한 존댓말, 따뜻하고 환대하는 어조'
    };
    const greetings = {
        politician: `안녕하세요! ${name}입니다. 여러분의 목소리에 귀 기울이겠습니다. 무엇이든 물어봐주세요!`,
        youtuber: `안녕하세요~ ${name}입니다! 채널에 대해 궁금한 게 있으면 편하게 물어보세요 😊`,
        ceo: `환영합니다! ${name}에 관심 가져주셔서 감사합니다. 어떤 도움이 필요하신가요?`,
        instructor: `안녕하세요! ${name}입니다. 학습에 대해 궁금한 점이 있으시면 말씀해주세요!`,
        restaurant: `어서오세요~ ${name}에 오신 것을 환영합니다! 메뉴나 예약에 대해 물어보세요 🍽️`
    };
    const faqTemplates = {
        politician: [
            { q: '대표 공약이 무엇인가요?', a: '주요 공약은 지역 발전, 교육 개선, 일자리 창출입니다.' },
            { q: '사무실은 어디에 있나요?', a: '사무실 주소와 방문 시간은 홈페이지를 확인해주세요.' },
            { q: '민원은 어떻게 접수하나요?', a: '이 챗봇을 통해 민원을 접수하시거나 사무실로 연락 주세요.' }
        ],
        youtuber: [
            { q: '어떤 콘텐츠를 만드나요?', a: '다양한 콘텐츠를 제작하고 있습니다. 채널을 방문해주세요!' },
            { q: '협업 문의는 어떻게 하나요?', a: '비즈니스 문의는 이메일로 연락주세요.' },
            { q: '업로드 일정이 어떻게 되나요?', a: '매주 정해진 일정에 영상을 올립니다.' }
        ],
        ceo: [
            { q: '어떤 서비스를 제공하나요?', a: '저희 서비스에 대한 상세 안내를 드리겠습니다.' },
            { q: '가격이 어떻게 되나요?', a: '가격 정보는 요금 페이지에서 확인하실 수 있습니다.' },
            { q: '상담 예약은 어떻게 하나요?', a: '온라인으로 편하게 예약하실 수 있습니다.' }
        ],
        instructor: [
            { q: '어떤 강의를 하시나요?', a: '제 전문 분야의 다양한 강의를 제공합니다.' },
            { q: '수강 신청은 어떻게 하나요?', a: '홈페이지에서 수강 신청하실 수 있습니다.' },
            { q: '1:1 코칭도 가능한가요?', a: '네, 개인 코칭도 가능합니다. 문의해주세요.' }
        ],
        restaurant: [
            { q: '영업시간이 어떻게 되나요?', a: '매일 영업합니다. 자세한 시간은 확인해주세요.' },
            { q: '예약은 어떻게 하나요?', a: '전화나 이 챗봇을 통해 예약하실 수 있습니다.' },
            { q: '배달도 되나요?', a: '배달 서비스를 제공합니다. 주소를 알려주세요.' }
        ]
    };

    const tid = template?.id || 'ceo';
    return {
        botName: name,
        botDesc: desc,
        templateId: tid,
        personality: personalities[tid],
        tone: tones[tid],
        greeting: greetings[tid],
        faqs: faqTemplates[tid],
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
        id: MCW.generateId(),
        username: username,
        ...bot
    };
    MCW.createBot(botData);

    goToStep(5);

    // Show URL
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/bot/${username}`;
    document.getElementById('botUrl').value = url;
    document.getElementById('chatLink').href = `/bot/${username}`;
    document.getElementById('qrCode').innerHTML = '📱';
}

function copyUrl() {
    const input = document.getElementById('botUrl');
    input.select();
    document.execCommand('copy');
    alert('URL이 복사되었습니다!');
}
