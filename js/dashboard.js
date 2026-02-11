/**
 * @task S2F4
 * Dashboard JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
  initUser(); // Register/Login Master User
  renderSummary();
  renderBotList();
  renderSkillMarketplace();
  renderStats();
});

function initUser() {
  if (!MCW.user) return;
  let user = MCW.user.getCurrentUser();

  // Auth Guard
  if (!user) {
    // If no user, redirect to login
    // Check if local file
    const isLocal = window.location.protocol === 'file:';
    if (isLocal) {
      window.location.href = '../login.html'; // Relative path from pages/dashboard/
    } else {
      window.location.href = '/login';
    }
    return;
  }

  // Update Header with My Page Button
  const headerRight = document.querySelector('.header-right') || document.querySelector('.dashboard-header');
  if (headerRight && !document.getElementById('myPageBtn')) {
    const btn = document.createElement('button');
    btn.id = 'myPageBtn';
    btn.className = 'btn btn-secondary btn-sm';
    btn.innerHTML = '👤 내 정보';
    btn.onclick = openMyPage;
    // Append to header (need to find correct element)
    // If header-right exists, append there. Else append to header.
    if (document.querySelector('.header-right')) {
      document.querySelector('.header-right').prepend(btn);
    } else {
      headerRight.appendChild(btn);
    }
  }

  // Update Profile UI
  const profileName = document.querySelector('.profile-name');
  if (profileName) profileName.textContent = user.name;
  const profileRole = document.querySelector('.profile-role');
  if (profileRole) profileRole.textContent = user.role === 'admin' ? '운영자' : '일반회원';
}

function openMyPage() {
  const user = MCW.user.getCurrentUser();
  alert(`[내 정보]\n이름: ${user.name}\n아이디: ${user.id}\n권한: ${user.role}\n\n(로그아웃 하려면 확인을 누르세요)`);
  // Simple Logout for MVP
  if (confirm('로그아웃 하시겠습니까?')) {
    MCW.user.logout();
    location.reload();
  }
}

// Summary cards
function renderSummary() {
  const bots = MCW.storage.getBots();
  let totalChats = 0;
  let totalMessages = 0;

  bots.forEach(bot => {
    const stats = MCW.storage.getStats(bot.id);
    totalChats += (stats.totalConversations || 0);
    totalMessages += (stats.totalMessages || 0);
  });

  document.getElementById('totalBots').textContent = bots.length;
  document.getElementById('totalChats').textContent = totalChats.toLocaleString();
  document.getElementById('totalMessages').textContent = totalMessages.toLocaleString();
  document.getElementById('avgRating').textContent = '4.8'; // MVP: Hardcoded
}

// Bot list
function renderBotList() {
  let bots = MCW.storage.getBots();

  // Auto-create Sample Bot (First Time Only)
  if (!localStorage.getItem('mcw_sample_initialized')) {
    if (typeof createSunnyBot === 'function') {
      console.log("Initializing Sample SunnyBot...");
      createSunnyBot(true); // Silent creation
      localStorage.setItem('mcw_sample_initialized', 'true');
      bots = MCW.storage.getBots(); // Re-fetch
    }
  }

  const grid = document.getElementById('botGrid');
  const empty = document.getElementById('botEmpty');

  if (bots.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  const templateIcons = {
    smallbiz: '🏪', realtor: '🏠', lawyer: '⚖️', accountant: '📋', medical: '🏥',
    insurance: '🛡️', politician: '🏛️', instructor: '🎓', freelancer: '💻', consultant: '💼'
  };

  grid.innerHTML = bots.map(bot => {
    const stats = MCW.storage.getStats(bot.id);
    const installedSkills = MCW.storage.getInstalledSkills(bot.id);

    return `
    <div class="bot-card">
      <div class="bot-card-header">
        <div class="bot-card-avatar">${templateIcons[bot.templateId] || '🤖'}</div>
        <div>
          <div class="bot-card-name">${bot.botName}</div>
          <div class="bot-card-template">${MCW.templates[bot.templateId]?.name || bot.templateId}</div>
        </div>
      </div>
      <div class="bot-card-stats">
        <span class="bot-stat">💬 <strong>${(stats.totalMessages || 0).toLocaleString()}</strong> 메시지</span>
        <span class="bot-stat">📊 <strong>${(stats.totalConversations || 0).toLocaleString()}</strong> 대화</span>
      </div>
      
      ${installedSkills.length > 0 ? `
      <div class="bot-card-skills">
        ${installedSkills.map(s => `<span class="bot-skill-icon" title="${s.name}">${s.icon}</span>`).join('')}
      </div>` : ''}

        <div class="bot-card-actions">
          <button class="bot-action-btn" onclick="openChat('${bot.id}', '${bot.username}')">💬 대화</button>
          <button class="bot-action-btn" onclick="editBot('${bot.id}')">✏️ 수정</button>
          <button class="bot-action-btn" onclick="shareBot('${bot.username}')">📤 공유</button>
          <button class="bot-action-btn" onclick="deleteBot('${bot.id}')">🗑️</button>
        </div>
    </div>
  `}).join('');
}

// Edit Bot Functions
// Edit Bot Functions
let editingBotPersonas = [];

function switchEditTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(
      tab === 'info' ? '기본' : tab === 'persona' ? '페르소나' : 'FAQ'
    ));
  });
  document.querySelectorAll('.edit-tab-content').forEach(content => {
    content.classList.toggle('hidden', content.id !== `tab-${tab}`);
    content.classList.toggle('active', content.id === `tab-${tab}`);
  });
}

function editBot(id) {
  const bot = MCW.storage.getBot(id);
  if (!bot) return;

  document.getElementById('editBotId').value = bot.id;
  document.getElementById('editBotName').value = bot.botName;
  document.getElementById('editBotDesc').value = bot.botDesc;
  document.getElementById('editBotGreeting').value = bot.greeting;

  // Load Personas (Migrate if needed)
  editingBotPersonas = bot.personas || [{
    id: Date.now(),
    name: bot.botName,
    role: bot.botDesc,
    model: 'logic',
    iqEq: 50,
    isVisible: true
  }];
  renderEditPersonas();

  // Render FAQs
  const faqList = document.getElementById('editFaqList');
  faqList.innerHTML = '';
  if (bot.faqs && bot.faqs.length > 0) {
    bot.faqs.forEach(faq => addFaqItem(faq.q, faq.a));
  } else {
    addFaqItem(); // Add one empty item
  }

  switchEditTab('info');
  document.getElementById('editModal').classList.add('active');
}

function renderEditPersonas() {
  const list = document.getElementById('editPersonaList');
  list.innerHTML = '';
  editingBotPersonas.forEach((p, index) => {
    const id = p.id || Date.now() + index;
    p.id = id; // ensure id
    const div = document.createElement('div');
    div.className = 'persona-edit-card';
    div.id = `edit-persona-${id}`;
    div.innerHTML = `
            <div class="persona-edit-header">
                <div class="persona-edit-title">
                    <span style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-size:0.6rem; margin-right:5px;">#${index + 1}</span>
                    <input type="text" value="${p.name}" class="ep-name" style="background:transparent; border:none; color:white; font-weight:700; width:100px;" placeholder="이름">
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <label class="edit-toggle">
                        <input type="checkbox" class="ep-visible" ${p.isVisible ? 'checked' : ''}>
                        <div class="edit-toggle-slider"></div>
                        <span style="color:rgba(255,255,255,0.5)">공개</span>
                    </label>
                    <button class="faq-delete-btn" onclick="removeEditPersona('${id}')" style="width:20px;height:20px;">×</button>
                </div>
            </div>
            <div class="persona-input-row">
                <input type="text" class="ep-role" value="${p.role}" placeholder="역할 설명">
                <select class="ep-model">
                    <option value="logic" ${p.model === 'logic' ? 'selected' : ''}>🧠 논리 (GPT)</option>
                    <option value="emotion" ${p.model === 'emotion' ? 'selected' : ''}>💖 감성 (Claude)</option>
                    <option value="fast" ${p.model === 'fast' ? 'selected' : ''}>⚡ 속도 (Gemini)</option>
                    <option value="creative" ${p.model === 'creative' ? 'selected' : ''}>🎨 창작 (DALL-E)</option>
                </select>
            </div>
            <div class="persona-range-row">
                <span>Logic</span>
                <input type="range" class="persona-range ep-iqeq" min="0" max="100" value="${p.iqEq || 50}">
                <span>Emotion</span>
            </div>
        `;
    list.appendChild(div);
  });
}

function collectEditPersonas() {
  const temp = [];
  document.querySelectorAll('.persona-edit-card').forEach(card => {
    temp.push({
      id: card.id.replace('edit-persona-', ''),
      name: card.querySelector('.ep-name').value,
      role: card.querySelector('.ep-role').value,
      model: card.querySelector('.ep-model').value,
      iqEq: card.querySelector('.ep-iqeq').value,
      isVisible: card.querySelector('.ep-visible').checked
    });
  });
  editingBotPersonas = temp;
}

function addEditPersona() {
  collectEditPersonas();
  if (editingBotPersonas.length >= 5) {
    alert('최대 5개까지만 가능합니다.');
    return;
  }
  editingBotPersonas.push({
    id: Date.now(),
    name: '새 페르소나',
    role: '새 역할',
    model: 'logic',
    iqEq: 50,
    isVisible: true
  });
  renderEditPersonas();
}

function removeEditPersona(id) {
  collectEditPersonas();
  if (editingBotPersonas.length <= 1) {
    alert('최소 1개의 페르소나는 있어야 합니다.');
    return;
  }
  editingBotPersonas = editingBotPersonas.filter(p => String(p.id) !== String(id));
  renderEditPersonas();
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

function addFaqItem(q = '', a = '') {
  const div = document.createElement('div');
  div.className = 'faq-item';
  div.innerHTML = `
      <div class="faq-inputs">
          <input type="text" placeholder="질문 (예: 영업시간이 언제인가요?)" value="${q.replace(/"/g, '&quot;')}" class="faq-q">
          <textarea placeholder="답변" rows="2" class="faq-a">${a}</textarea>
      </div>
      <button class="faq-delete-btn" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('editFaqList').appendChild(div);
}

function saveBotChanges() {
  const id = document.getElementById('editBotId').value;
  const bot = MCW.storage.getBot(id);
  if (!bot) return;

  bot.botName = document.getElementById('editBotName').value;
  bot.botDesc = document.getElementById('editBotDesc').value;
  bot.greeting = document.getElementById('editBotGreeting').value;

  collectEditPersonas();
  bot.personas = editingBotPersonas;

  // Collect FAQs
  const faqs = [];
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q').value.trim();
    const a = item.querySelector('.faq-a').value.trim();
    if (q && a) {
      faqs.push({ q, a });
    }
  });
  bot.faqs = faqs;

  MCW.storage.saveBot(bot);
  closeEditModal();
  renderBotList();
  alert('저장되었습니다!');
}

// Helper to open chat
function openChat(botId, username) {
  const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  // If local, use relative path with ID
  // Dashboard is in /pages/dashboard/, Bot is in /pages/bot/
  const url = isLocal
    ? `../bot/index.html?id=${botId}`
    : `/bot/${username}`;
  window.open(url, '_blank');
}

function shareBot(username) {
  const bot = MCW.storage.getBotByUsername(username);
  const id = bot ? bot.id : null;

  const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  let url = window.location.origin + `/bot/${username}`;

  if (isLocal && id) {
    // Accessing from root/pages/dashboard, so we need full path? 
    // Share URL usually implies public access.
    // For local demo, we give the file path? No, that's ugly.
    // We give a relative path from root? 
    // Let's just give the standard local URL.
    // Assuming root is c:\mychatbot-world
    url = `${window.location.href.split('/pages/')[0]}/pages/bot/index.html?id=${id}`;
  }

  navigator.clipboard?.writeText(url).then(() => alert(`URL이 복사되었습니다!\n${url}`));
}
function deleteBot(id) {
  if (!confirm('이 챗봇을 삭제하시겠습니까?')) return;
  MCW.storage.deleteBot(id);
  renderBotList();
  renderSummary();
  renderStats();
}

// Skill marketplace
let currentSkillFilter = 'all';
function renderSkillMarketplace(filter) {
  filter = filter || currentSkillFilter;
  currentSkillFilter = filter;
  const grid = document.getElementById('skillMarketGrid');
  if (!grid) return;

  const skills = filter === 'all'
    ? MCW.skills
    : MCW.skills.filter(s => s.category === filter);

  grid.innerHTML = skills.map(s => `
    <div class="skill-market-card">
      <div class="skill-market-header">
        <span class="skill-market-icon">${s.icon}</span>
        <span class="skill-market-name">${s.name}</span>
        <span class="skill-market-price">${s.isFree ? '무료' : `₩${s.price.toLocaleString()}`}</span>
      </div>
      <p class="skill-market-desc">${s.description}</p>
      <div class="skill-market-footer">
        <div class="skill-market-meta">
          <span>⭐ ${s.rating}</span>
          <span>📥 ${s.installs.toLocaleString()}</span>
        </div>
        <button class="skill-install-btn" onclick="installSkill('${s.id}', this)">설치</button>
      </div>
    </div>
  `).join('');
}

function filterSkills(cat) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === (cat === 'all' ? '전체' : cat));
  });
  renderSkillMarketplace(cat);
}

function installSkill(id, btn) {
  // Open Bot Selection Modal
  const bots = MCW.storage.getBots();
  if (bots.length === 0) {
    alert('설치할 챗봇이 없습니다. 먼저 챗봇을 만들어주세요!');
    return;
  }

  document.getElementById('selectedSkillId').value = id;
  const grid = document.getElementById('botSelectGrid');

  const templateIcons = {
    smallbiz: '🏪', realtor: '🏠', lawyer: '⚖️', accountant: '📋', medical: '🏥',
    insurance: '🛡️', politician: '🏛️', instructor: '🎓', freelancer: '💻', consultant: '💼'
  };

  grid.innerHTML = bots.map(bot => {
    // Check if already installed
    const installed = MCW.storage.getInstalledSkills(bot.id).find(s => s.id === id);
    return `
    <div class="bot-select-item" onclick="confirmInstallSkill('${bot.id}', '${bot.botName}')">
      <div class="bot-select-avatar">${templateIcons[bot.templateId] || '🤖'}</div>
      <div class="bot-select-name">${bot.botName}</div>
      ${installed ? '<span style="margin-left:auto; font-size:0.8rem; color:#aaa;">설치됨</span>' : ''}
    </div>
  `}).join('');

  document.getElementById('botSelectModal').classList.add('active');
}

function closeBotSelectModal() {
  document.getElementById('botSelectModal').classList.remove('active');
}

function confirmInstallSkill(botId, botName) {
  const skillId = document.getElementById('selectedSkillId').value;
  const skill = MCW.storage.getSkill(skillId);

  // Check if already installed
  const installed = MCW.storage.getInstalledSkills(botId).find(s => s.id === skillId);
  if (installed) {
    alert('이미 설치된 스킬입니다.');
    return;
  }

  MCW.storage.installSkill(botId, skill);
  closeBotSelectModal();

  // Show Toast
  const toast = document.createElement('div');
  toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: #10b981; color: white; padding: 12px 24px; border-radius: 30px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2000; font-weight: 600;
        animation: slideUp 0.3s ease-out;
    `;
  toast.textContent = `✅ ${botName}에게 [${skill.name}] 스킬이 설치되었습니다!`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);

  // Refresh UI if needed (e.g., mark button as installed in global list? No, because it's per bot)
}

// Stats (Real Data)
function renderStats() {
  const chart = document.getElementById('barChart');
  if (!chart) return;

  const bots = MCW.storage.getBots();

  // Calculate last 7 days
  const dates = [];
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const labels = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
    labels.push(days[d.getDay()]);
  }

  // Aggregate daily stats
  const values = dates.map(date => {
    let sum = 0;
    bots.forEach(bot => {
      const stats = MCW.storage.getStats(bot.id);
      if (stats.daily && stats.daily[date]) {
        sum += stats.daily[date].conversations;
      }
    });
    return sum;
  });

  const max = Math.max(...values, 5); // Minimum scale 5

  chart.innerHTML = labels.map((day, i) => `
    <div class="bar-item">
      <div class="bar-value">${values[i]}</div>
      <div class="bar" style="height: ${Math.max((values[i] / max) * 120, 4)}px"></div>
      <div class="bar-label">${day}</div>
    </div>
  `).join('');

  // Aggregate Top Questions
  const allQuestions = {};
  bots.forEach(bot => {
    const stats = MCW.storage.getStats(bot.id);
    if (stats.topQuestions) {
      Object.entries(stats.topQuestions).forEach(([q, count]) => {
        allQuestions[q] = (allQuestions[q] || 0) + count;
      });
    }
  });

  const sortedQ = Object.entries(allQuestions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([q, count]) => ({ q, count }));

  const questions = document.getElementById('topQuestions');
  if (!questions) return;

  if (sortedQ.length === 0) {
    questions.innerHTML = '<div style="text-align:center; color:#666; padding:20px;">아직 질문 데이터가 없습니다.</div>';
    return;
  }

  questions.innerHTML = sortedQ.map((item, i) => `
    <div class="top-question-item">
      <div class="top-question-rank">${i + 1}</div>
      <div class="top-question-text">${item.q}</div>
      <div class="top-question-count">${item.count}회</div>
    </div>
  `).join('');
}
