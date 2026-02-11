/**
 * @task S2F4
 * Dashboard JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
  renderSummary();
  renderBotList();
  renderSkillMarketplace();
  renderStats();
});

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
  const bots = MCW.storage.getBots();
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
      <div class="bot-card-actions">
        <button class="bot-action-btn" onclick="window.open('/bot/${bot.username}','_blank')">💬 대화</button>
        <button class="bot-action-btn" onclick="editBot('${bot.id}')">✏️ 수정</button>
        <button class="bot-action-btn" onclick="shareBot('${bot.username}')">📤 공유</button>
        <button class="bot-action-btn" onclick="deleteBot('${bot.id}')">🗑️</button>
      </div>
    </div>
  `}).join('');
}

function editBot(id) { alert('수정 기능은 곧 구현됩니다!'); }
function shareBot(username) {
  const url = `${window.location.origin}/bot/${username}`;
  navigator.clipboard?.writeText(url).then(() => alert('URL이 복사되었습니다!'));
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
  btn.textContent = '✅ 설치됨';
  btn.classList.add('installed');
  btn.disabled = true;
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
