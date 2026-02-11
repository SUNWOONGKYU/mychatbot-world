/**
 * @task S2F2
 * Create Page JavaScript - 5-step chatbot creation wizard
 */
let currentStep = 1;
let selectedTemplate = null;
let isRecording = false;
let recordingTimer = null;
let remainingTime = 300;
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
        smallbiz: '손님을 환대하는 따뜻한 가게 주인',
        realtor: '신뢰감 있는 전문 부동산 중개인',
        lawyer: '정중하고 전문적인 법률 어시스턴트',
        accountant: '친절하고 정확한 세무/회계 전문가',
        medical: '따뜻하고 전문적인 의료 안내 도우미',
        insurance: '친근하고 신뢰감 있는 보험 설계사',
        politician: '국민과 소통하는 따뜻하고 신뢰감 있는 정치인',
        instructor: '학생들을 이끄는 열정적인 강사/코치',
        freelancer: '전문적이면서 친근한 프리랜서',
        consultant: '품격 있고 전문적인 컨설턴트'
    };
    const tones = {
        smallbiz: '친근한 존댑말, 따뜻하고 환대하는 어조',
        realtor: '전문적 존댑말, 신뢰감 있는 어조',
        lawyer: '존댑말, 정중하고 전문적인 어조',
        accountant: '존댑말, 친절하고 정확한 어조',
        medical: '존댑말, 따뜻하고 전문적인 어조',
        insurance: '친근한 존댑말, 신뢰감 있는 어조',
        politician: '존댑말, 정중하고 진정성 있는 어조',
        instructor: '존댑말, 격려하고 동기부여하는 어조',
        freelancer: '전문적 존댑말, 친근한 어조',
        consultant: '비즈니스 존댑말, 품격 있는 어조'
    };
    const greetings = {
        smallbiz: `어서오세요~ ${name}에 오신 것을 환영합니다! 메뉴나 예약에 대해 물어보세요 😊`,
        realtor: `안녕하세요! ${name} 공인중개사 사무소입니다. 매물이나 시세에 대해 물어보세요.`,
        lawyer: `안녕하세요, ${name} 변호사의 AI 법률 어시스턴트입니다. 어떤 법률 문의가 있으신가요?`,
        accountant: `안녕하세요, ${name} 세무사사무소 AI 어시스턴트입니다. 세금이나 회계에 대해 물어보세요.`,
        medical: `안녕하세요! ${name}의 AI 안내 도우미입니다. 진료 예약이나 궁금한 점을 물어보세요.`,
        insurance: `안녕하세요! ${name} 설계사의 AI 어시스턴트입니다. 보험 상품이나 보장에 대해 물어보세요.`,
        politician: `안녕하세요! ${name}입니다. 여러분의 목소리에 귀 기울이겠습니다. 무엇이든 물어봐주세요!`,
        instructor: `안녕하세요! ${name}입니다. 강의나 코칭에 대해 궁금한 점이 있으신가요?`,
        freelancer: `안녕하세요! ${name}의 AI 어시스턴트입니다. 포트폴리오나 작업 문의에 대해 알려드릴게요.`,
        consultant: `안녕하세요, ${name} 컨설팅의 AI 어시스턴트입니다. 컨설팅 서비스에 대해 물어보세요.`
    };
    const faqTemplates = {
        smallbiz: [
            { q: '영업시간이 어떻게 되나요?', a: '매일 영업합니다. 자세한 시간은 확인해주세요.' },
            { q: '예약은 어떻게 하나요?', a: '전화나 이 챗봇을 통해 예약하실 수 있습니다.' },
            { q: '배달도 되나요?', a: '배달 서비스를 제공합니다. 주소를 알려주세요.' }
        ],
        realtor: [
            { q: '현재 매물이 있나요?', a: '다양한 매물이 있습니다. 원하는 조건을 말씀해주세요.' },
            { q: '수수료는 얼마인가요?', a: '법정 수수료 기준으로 안내드립니다.' },
            { q: '매물 투어 예약이 가능한가요?', a: '네, 원하시는 시간에 투어를 예약해드립니다.' }
        ],
        lawyer: [
            { q: '상담 예약은 어떻게 하나요?', a: '온라인으로 편하게 예약하실 수 있습니다.' },
            { q: '전문 분야가 무엇인가요?', a: '다양한 법률 분야를 전문으로 합니다.' },
            { q: '상담 비용은 얼마인가요?', a: '상담 비용은 사건 유형에 따라 달라집니다.' }
        ],
        accountant: [
            { q: '종합소득세 신고는 언제인가요?', a: '매년 5월에 신고합니다. 상세한 일정은 문의해주세요.' },
            { q: '기장 대행 비용은?', a: '사업 규모에 따라 달라집니다. 상담을 예약해주세요.' },
            { q: '절세 방법이 있나요?', a: '절세 전략에 대해 상담해드립니다.' }
        ],
        medical: [
            { q: '진료 예약은 어떻게 하나요?', a: '전화나 온라인으로 예약하실 수 있습니다.' },
            { q: '보험 적용이 되나요?', a: '대부분의 진료에 보험이 적용됩니다.' },
            { q: '진료 시간이 어떻게 되나요?', a: '진료 시간을 확인해드립니다.' }
        ],
        insurance: [
            { q: '어떤 보험이 좋을까요?', a: '상황에 맞는 보험을 추천해드립니다.' },
            { q: '보장 분석이 가능한가요?', a: '네, 무료 보장 분석을 제공합니다.' },
            { q: '청구는 어떻게 하나요?', a: '청구 절차를 안내해드립니다.' }
        ],
        politician: [
            { q: '대표 공약이 무엇인가요?', a: '주요 공약은 지역 발전, 교육 개선, 일자리 창출입니다.' },
            { q: '민원은 어떻게 접수하나요?', a: '이 챗봇을 통해 민원을 접수하시거나 사무실로 연락 주세요.' },
            { q: '사무실은 어디에 있나요?', a: '사무실 주소와 방문 시간은 홈페이지를 확인해주세요.' }
        ],
        instructor: [
            { q: '어떤 강의를 하시나요?', a: '제 전문 분야의 다양한 강의를 제공합니다.' },
            { q: '수강 신청은 어떻게 하나요?', a: '홈페이지에서 수강 신청하실 수 있습니다.' },
            { q: '1:1 코칭도 가능한가요?', a: '네, 개인 코칭도 가능합니다. 문의해주세요.' }
        ],
        freelancer: [
            { q: '포트폴리오를 볼 수 있나요?', a: '네, 포트폴리오를 보여드리겠습니다.' },
            { q: '견적은 어떻게 내나요?', a: '프로젝트 내용을 말씀해주시면 견적을 드리겠습니다.' },
            { q: '작업 기간은 얼마나 걸리나요?', a: '프로젝트 규모에 따라 달라집니다.' }
        ],
        consultant: [
            { q: '어떤 컨설팅을 제공하나요?', a: '다양한 컨설팅 서비스를 제공합니다.' },
            { q: '비용은 얼마인가요?', a: '프로젝트 규모에 따라 달라집니다. 상담을 예약해주세요.' },
            { q: '진행 절차가 어떻게 되나요?', a: '진행 절차를 안내해드리겠습니다.' }
        ]
    };

    const tid = template?.id || 'smallbiz';
    return {
        botName: name,
        botDesc: desc,
        templateId: tid,
        personality: personalities[tid] || personalities.smallbiz,
        tone: tones[tid] || tones.smallbiz,
        greeting: greetings[tid] || greetings.smallbiz,
        faqs: faqTemplates[tid] || faqTemplates.smallbiz,
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

    goToStep(5);

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
