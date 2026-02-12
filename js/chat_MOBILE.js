/**
 * SunnyBot 전용 모바일 채팅 (깨끗하게 새로 작성)
 * - 분신 아바타 3개 + AI 도우미 2개
 * - localStorage에 예전 써니봇이 있어도 무조건 SunnyBotData만 사용
 */

let chatBotData = null;
let conversationHistory = [];
let isBotTyping = false;
let voiceOutputEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
  console.log('[SunnyBot Mobile] v1.0 LOADED');
  loadBotData();
  autoResizeInput();
});

function loadBotData() {
  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get('id');
  const personaParam = urlParams.get('persona');

  const isSunny =
    (idParam === 'sunny-official' || (idParam || '').startsWith('sunny-')) &&
    typeof SunnyBotData !== 'undefined';

  if (isSunny) {
    // ★ 써니봇은 localStorage 무시하고 항상 SunnyBotData 사용
    chatBotData = { ...SunnyBotData, id: idParam || 'sunny-official' };
  } else {
    // 다른 봇 (있으면) – 간단한 데모용
    const bots =
      typeof MCW !== 'undefined' && MCW.storage && MCW.storage.getBots
        ? MCW.storage.getBots()
        : [];

    if (idParam) {
      chatBotData = bots.find((b) => b.id === idParam);
    }

    if (!chatBotData) {
      chatBotData = {
        botName: 'Demo Bot',
        username: 'demo',
        personality: '간단한 테스트용 데모 챗봇입니다.',
        greeting: '안녕하세요! 데모 챗봇입니다.',
        personas: [
          {
            id: 'demo_default',
            name: 'Demo Persona',
            role: '테스트용 기본 페르소나입니다.',
            model: 'logic',
            iqEq: 50,
            isVisible: true,
          },
        ],
        faqs: [],
      };
    }
  }

  // Persona 기본 설정
  if (!chatBotData.personas || chatBotData.personas.length === 0) {
    chatBotData.personas = [
      {
        id: 'default',
        name: chatBotData.botName,
        role: chatBotData.personality || 'AI Assistant',
        model: 'logic',
        iqEq: 50,
        isVisible: true,
      },
    ];
  }

  const initialPersona = personaParam
    ? chatBotData.personas.find((p) => p.id === personaParam)
    : chatBotData.personas[0];

  window.currentPersona = initialPersona || chatBotData.personas[0];

  // UI 업데이트
  const nameEl = document.getElementById('chatBotName');
  if (nameEl) nameEl.textContent = chatBotData.botName;

  document.title = ${chatBotData.botName} - Mobile;

  const welcomeTitleEl = document.getElementById('welcomeTitle');
  const welcomeDescEl = document.getElementById('welcomeDesc');
  if (welcomeTitleEl) welcomeTitleEl.textContent = chatBotData.botName;
  if (welcomeDescEl && window.currentPersona) {
    welcomeDescEl.textContent = window.currentPersona.role || '';
  }

  renderPersonaSelector();
  renderFaqButtons();

  if (conversationHistory.length === 0) {
    setTimeout(() => addMessage('bot', chatBotData.greeting), 400);
  }
}

function renderPersonaSelector() {
  const container = document.getElementById('personaContainer');
  if (!container) return;

  if (!chatBotData.personas || chatBotData.personas.length <= 1) {
    container.style.display = 'none';
    return;
  }

  const personaIcons = {
    sunny_avatar_ai: '🧠',
    sunny_avatar_startup: '🚀',
    sunny_avatar_cpa: '📊',
    sunny_helper_work: '📂',
    sunny_helper_life: '🌱',
  };

  container.style.display = 'flex';
  container.innerHTML = chatBotData.personas
    .filter((p) => p.isVisible !== false)
    .map(
      (p) => 
      <button class="persona-pill " data-persona-id="">
        <span class="persona-icon"></span>
        <span class="persona-name"></span>
      </button>
    ,
    )
    .join('');

  container.querySelectorAll('.persona-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-persona-id');
      const persona = chatBotData.personas.find((p) => p.id === id);
      if (!persona) return;

      window.currentPersona = persona;

      const welcomeDescEl = document.getElementById('welcomeDesc');
      if (welcomeDescEl) welcomeDescEl.textContent = persona.role || '';

      renderPersonaSelector();
    });
  });
}

function renderFaqButtons() {
  const container = document.getElementById('faqButtons');
  if (!container || !chatBotData?.faqs) return;

  container.innerHTML = chatBotData.faqs
    .map(
      (f) =>
        <button class="faq-btn" onclick="askFaq('', '')"></button>,
    )
    .join('');
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text || isBotTyping) return;

  input.value = '';
  input.style.height = 'auto';

  addMessage('user', text);
  showTyping();

  conversationHistory.push({ role: 'user', content: text });

  const response = await generateResponse(text);

  hideTyping();
  addMessage('bot', response);
  conversationHistory.push({ role: 'assistant', content: response });

  if (voiceOutputEnabled) speak(response);
}

function addMessage(sender, text) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = message message-;
  div.innerHTML = 
    <div class="message-avatar"></div>
    <div class="message-bubble"></div>
  ;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  isBotTyping = true;
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'message message-bot';
  div.id = 'typingIndicator';
  div.innerHTML = 
    <div class="message-avatar">🤖</div>
    <div class="message-bubble"><span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span></div>
  ;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  isBotTyping = false;
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function askFaq(q, a) {
  addMessage('user', q);
  showTyping();
  setTimeout(() => {
    hideTyping();
    addMessage('bot', a);
    if (voiceOutputEnabled) speak(a);
  }, 400);
}

async function generateResponse(userText) {
  const persona = window.currentPersona;
  let systemPrompt = 'You are a helpful Korean AI assistant.';

  if (persona) {
    const isHelper = persona.category === 'helper';
    if (isHelper && persona.helperType === 'work') {
      systemPrompt =
        '당신은 써니의 업무 AI 도우미입니다. 업무 정리, 일정, 프로젝트, 문서 작성을 한국어로 도와주세요.';
    } else if (isHelper && persona.helperType === 'life') {
      systemPrompt =
        '당신은 써니의 생활 AI 도우미입니다. 생활 루틴, 건강, 감정, 가계부를 한국어로 편하게 상담해 주세요.';
    } else {
      systemPrompt = 당신은 써니의 분신 아바타 ""입니다. 역할:  한국어로만 대답하세요.;
    }
  }

  const BAD_KEY_HASH = 'sk-or-v1-6a0bbf03';
  let storedKey = localStorage.getItem('mcw_openrouter_key');

  if (storedKey && storedKey.includes(BAD_KEY_HASH)) {
    localStorage.removeItem('mcw_openrouter_key');
    storedKey = null;
  }

  let API_KEY = storedKey || null;

  if (typeof CONFIG !== 'undefined' && CONFIG.OPENROUTER_API_KEY) {
    API_KEY = CONFIG.OPENROUTER_API_KEY;
    localStorage.setItem('mcw_openrouter_key', API_KEY);
  } else if (
    typeof MCW_SECRETS !== 'undefined' &&
    MCW_SECRETS.OPENROUTER_API_KEY
  ) {
    API_KEY = MCW_SECRETS.OPENROUTER_API_KEY;
    localStorage.setItem('mcw_openrouter_key', API_KEY);
  }

  if (!API_KEY || API_KEY.length < 50 || API_KEY.includes(BAD_KEY_HASH)) {
    return '[시스템 오류] 유효한 OpenRouter API 키를 찾지 못했습니다.';
  }

  const modelStack = [
    'google/gemini-2.0-flash-001',
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct',
    'openrouter/free',
  ];

  let lastError = '';

  for (const currentModel of modelStack) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: Bearer ,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SunnyBot_Mobile_v1',
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-5),
            { role: 'user', content: userText },
          ],
        }),
      });

      const data = await res.json();
      if (res.ok && data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }
      lastError = data.error?.message || res.statusText;
    } catch (e) {
      lastError = e.message;
    }
  }

  return [AI 오류] 응답 생성에 실패했습니다. ();
}

function speak(text) {
  if (!voiceOutputEnabled || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 1.0;
  u.pitch = 1.0;
  window.speechSynthesis.speak(u);
}

// STT (음성 입력)
let chatRecognition = null;
function toggleChatVoice() {
  const btn = document.getElementById('chatVoiceBtn');
  if (chatRecognition) {
    chatRecognition.stop();
    chatRecognition = null;
    if (btn) btn.classList.remove('recording');
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
    if (btn) btn.classList.add('recording');
  };

  chatRecognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = text;
      sendMessage();
    }
  };

  chatRecognition.onerror = () => {
    chatRecognition = null;
    if (btn) btn.classList.remove('recording');
  };

  chatRecognition.onend = () => {
    chatRecognition = null;
    if (btn) btn.classList.remove('recording');
  };

  chatRecognition.start();
}

function autoResizeInput() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = ${input.scrollHeight}px;
  });
}
