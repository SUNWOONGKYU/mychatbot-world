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
    const bots = MCW.getBots();
    const stats = MCW.getStats();
    document.getElementById('totalBots').textContent = bots.length;
    document.getElementById('totalChats').textContent = stats.totalConversations || 0;
    document.getElementById('totalMessages').textContent = stats.totalMessages || 0;
    document.getElementById('avgRating').textContent = stats.avgRating || '-';
}

// Bot list
function renderBotList() {
    const bots = MCW.getBots();
    const grid = document.getElementById('botGrid');
    const empty = document.getElementById('botEmpty');

    if (bots.length === 0) {
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    const templateIcons = { politician: '🏛️', youtuber: '🎬', ceo: '💼', instructor: '🎓', restaurant: '🍽️' };

    grid.innerHTML = bots.map(bot => `
    <div class="bot-card">
      <div class="bot-card-header">
        <div class="bot-card-avatar">${templateIcons[bot.templateId] || '🤖'}</div>
        <div>
          <div class="bot-card-name">${bot.botName}</div>
          <div class="bot-card-template">${MCW.templates[bot.templateId]?.name || bot.templateId}</div>
        </div>
      </div>
      <div class="bot-card-stats">
        <span class="bot-stat">💬 <strong>${bot.totalMessages || 0}</strong> 메시지</span>
        <span class="bot-stat">📊 <strong>${bot.conversations || 0}</strong> 대화</span>
      </div>
      <div class="bot-card-actions">
        <button class="bot-action-btn" onclick="window.open('/bot/${bot.username}','_blank')">💬 대화</button>
        <button class="bot-action-btn" onclick="editBot('${bot.id}')">✏️ 수정</button>
        <button class="bot-action-btn" onclick="shareBot('${bot.username}')">📤 공유</button>
        <button class="bot-action-btn" onclick="deleteBot('${bot.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function editBot(id) { alert('수정 기능은 준비 중입니다.'); }
function shareBot(username) {
    const url = `${window.location.origin}/bot/${username}`;
    navigator.clipboard?.writeText(url).then(() => alert('URL이 복사되었습니다!'));
}
function deleteBot(id) {
    if (!confirm('이 챗봇을 삭제하시겠습니까?')) return;
    MCW.deleteBot(id);
    renderBotList();
    renderSummary();
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

// Stats (mock data for MVP)
function renderStats() {
    const chart = document.getElementById('barChart');
    if (!chart) return;

    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const values = [12, 19, 8, 25, 15, 30, 22];
    const max = Math.max(...values);

    chart.innerHTML = days.map((day, i) => `
    <div class="bar-item">
      <div class="bar-value">${values[i]}</div>
      <div class="bar" style="height: ${(values[i] / max) * 120}px"></div>
      <div class="bar-label">${day}</div>
    </div>
  `).join('');

    // Top questions
    const questions = document.getElementById('topQuestions');
    if (!questions) return;
    const topQ = [
        { q: '영업시간이 어떻게 되나요?', count: 45 },
        { q: '가격이 어떻게 되나요?', count: 38 },
        { q: '예약은 어떻게 하나요?', count: 31 },
        { q: '위치가 어디인가요?', count: 24 },
        { q: '배달도 되나요?', count: 18 }
    ];
    questions.innerHTML = topQ.map((q, i) => `
    <div class="top-question-item">
      <div class="top-question-rank">${i + 1}</div>
      <div class="top-question-text">${q.q}</div>
      <div class="top-question-count">${q.count}회</div>
    </div>
  `).join('');
}
