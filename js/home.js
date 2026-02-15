/* ============================================
   My Chatbot World - My Page Logic (home.js)
   Per-persona management structure
   ============================================ */

const HomePage = (() => {
  // State — keyed by 'botId_personaId'
  let openPanels = {};
  let kbState = {};
  let skillFilter = {};
  let botSettingsOpen = {};

  // ─── Per-persona Storage Helpers ───
  function getPersonaConversations(botId, personaId) {
    return JSON.parse(localStorage.getItem(`mcw_conv_${botId}_${personaId}`) || '[]');
  }
  function getPersonaStats(botId, personaId) {
    return JSON.parse(localStorage.getItem(`mcw_stats_${botId}_${personaId}`) || '{"totalConversations":0,"totalMessages":0}');
  }
  function getPersonaSkills(botId, personaId) {
    return JSON.parse(localStorage.getItem(`mcw_skills_${botId}_${personaId}`) || '[]');
  }
  function savePersonaSkills(botId, personaId, skills) {
    localStorage.setItem(`mcw_skills_${botId}_${personaId}`, JSON.stringify(skills));
  }
  function getPersonaCommunity(botId, personaId) {
    return JSON.parse(localStorage.getItem(`mcw_community_${botId}_${personaId}`) || '[]');
  }


  // ─── Init ───
  function init() {
    if (typeof MCW === 'undefined') return;

    const user = MCW.user.getCurrentUser();
    if (!user) {
      location.href = '../login.html';
      return;
    }

    const idEl = document.getElementById('userIdDisplay');
    const nameEl = document.getElementById('userNameInput');
    const dateEl = document.getElementById('userJoinedDisplay');
    if (idEl) idEl.textContent = user.id;
    if (nameEl) nameEl.value = user.name || '';
    if (dateEl) dateEl.textContent = user.created_at ? MCW.formatDate(user.created_at) : '-';

    renderBotList();
  }


  // ═══════════════════════════════════════════════
  // BOT LIST
  // ═══════════════════════════════════════════════
  function renderBotList() {
    const container = document.getElementById('botListContainer');
    if (!container) return;

    const user = MCW.user.getCurrentUser();
    const allBots = MCW.storage.getBots();
    // 내 봇만 필터 (_system 데모봇 제외)
    const bots = user
      ? allBots.filter(b => b.ownerId !== '_system' && (b.ownerId === user.id || !b.ownerId || b.ownerId === 'anonymous' || b.ownerId === 'admin'))
      : allBots.filter(b => b.ownerId !== '_system');

    if (bots.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🤖</div>
          <h3>아직 생성된 챗봇이 없습니다</h3>
          <p>나만의 AI 챗봇을 생성하고 관리해 보세요.</p>
          <button class="btn btn-primary" onclick="location.href='../create/index.html'">+ 새 챗봇 생성</button>
        </div>`;
      return;
    }

    container.innerHTML = bots.map(bot => renderBotCard(bot)).join('');
  }

  function renderBotCard(bot) {
    const name = bot.botName || '이름없는 봇';
    const desc = bot.botDesc || '';
    const date = bot.created_at ? MCW.formatDate(bot.created_at) : '';
    const id = bot.id;
    const personas = bot.personas || [];
    const botUrl = `../bot/index.html?id=${id}`;

    const personaUrls = personas.map(p =>
      `<div class="url-row">
        <span class="url-label">${escHtml(p.name)}</span>
        <input class="url-input" readonly value="../bot/index.html?id=${id}&persona=${p.id}" onclick="this.select()">
        <button class="url-copy-btn" onclick="HomePage.copyUrl(this.previousElementSibling)">복사</button>
      </div>`
    ).join('');

    const personaCardsHtml = personas.map((p, i) => renderPersonaCard(bot, p, i)).join('');

    return `
      <div class="bot-card" id="bot-${id}">
        <!-- Bot Header -->
        <div class="bot-card-header">
          <div class="bot-info">
            <div class="bot-meta">
              <h3>${escHtml(name)}</h3>
              ${desc ? `<p>${escHtml(desc)}</p>` : ''}
              ${date ? `<div class="bot-date">${date} 생성</div>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="btn-sm-dark" onclick="document.getElementById('urls-${id}').classList.toggle('open')">🔗 URL</button>
            <button class="btn-sm-dark" onclick="HomePage.toggleBotSettings('${id}')">⚙️ 봇 수정</button>
          </div>
        </div>

        <!-- URL Panel -->
        <div class="url-panel" id="urls-${id}">
          <div class="url-row">
            <span class="url-label">전체 (봇)</span>
            <input class="url-input" readonly value="${botUrl}" onclick="this.select()">
            <button class="url-copy-btn" onclick="HomePage.copyUrl(this.previousElementSibling)">복사</button>
          </div>
          ${personaUrls}
          <div class="url-qr-section">
            <button class="btn-sm-dark" onclick="HomePage.toggleQR('${id}', '${escAttr(botUrl)}')">📱 QR 코드 보기</button>
            <div class="url-qr-code" id="qr-${id}"></div>
          </div>
        </div>

        <!-- Bot Settings Panel (bot level: edit name/desc, delete) -->
        <div class="bot-settings-panel" id="bot-settings-${id}"></div>

        <!-- Persona Cards -->
        <div class="persona-list">
          ${personaCardsHtml || '<div style="color:rgba(255,255,255,0.3);font-size:0.85rem;padding:1rem 2rem;">등록된 페르소나가 없습니다.</div>'}
          <div class="persona-list-footer">
            <button class="btn-add-persona" onclick="HomePage.addPersona('${id}')">+ 페르소나 추가</button>
          </div>
        </div>
      </div>`;
  }

  function renderPersonaCard(bot, persona, idx) {
    const botId = bot.id;
    const pId = persona.id;
    const key = `${botId}_${pId}`;
    const categoryLabel = persona.category === 'helper' ? 'AI 도우미' : '분신 아바타';
    const personaUrl = `../bot/index.html?id=${botId}&persona=${pId}`;

    return `
      <div class="persona-manage-card" id="persona-${key}">
        <div class="persona-manage-header">
          <div class="persona-manage-info">
            <span class="persona-manage-name">${escHtml(persona.name || `페르소나 ${idx + 1}`)}</span>
            <span class="persona-manage-badge">${categoryLabel}</span>
            ${persona.role ? `<span class="persona-manage-role">${escHtml(persona.role)}</span>` : ''}
          </div>
          <button class="btn btn-outline btn-sm" onclick="location.href='${personaUrl}'">대화하기</button>
        </div>

        <div class="tool-bar">
          <button class="tool-btn" data-tool="logs" onclick="HomePage.openTool('${botId}','${pId}','logs')">
            <span class="tool-icon">📑</span> 대화 로그
          </button>
          <button class="tool-btn" data-tool="data" onclick="HomePage.openTool('${botId}','${pId}','data')">
            <span class="tool-icon">💾</span> 지식베이스
          </button>
          <button class="tool-btn" data-tool="skills" onclick="HomePage.openTool('${botId}','${pId}','skills')">
            <span class="tool-icon">🧩</span> 스킬 관리
          </button>
          <button class="tool-btn" data-tool="school" onclick="HomePage.openTool('${botId}','${pId}','school')">
            <span class="tool-icon">🎓</span> 챗봇 스쿨
          </button>
          <button class="tool-btn" data-tool="community" onclick="HomePage.openTool('${botId}','${pId}','community')">
            <span class="tool-icon">💬</span> 커뮤니티
          </button>
          <button class="tool-btn" data-tool="psettings" onclick="HomePage.openTool('${botId}','${pId}','psettings')">
            <span class="tool-icon">🔧</span> 설정
          </button>
        </div>

        <div class="tool-panel" id="panel-${key}"></div>
      </div>`;
  }


  // ═══════════════════════════════════════════════
  // BOT SETTINGS (bot level — name/desc + delete)
  // ═══════════════════════════════════════════════
  function toggleBotSettings(botId) {
    const panel = document.getElementById(`bot-settings-${botId}`);
    if (!panel) return;

    if (botSettingsOpen[botId]) {
      panel.classList.remove('open');
      panel.innerHTML = '';
      botSettingsOpen[botId] = false;
      return;
    }

    botSettingsOpen[botId] = true;
    const bot = MCW.storage.getBot(botId);
    if (!bot) return;

    panel.innerHTML = `
      <div class="settings-section">
        <h4>봇 기본 정보 수정</h4>
        <div class="form-row">
          <label class="form-label-dark">봇 이름</label>
          <input class="form-control-dark" id="settings-name-${botId}" value="${escAttr(bot.botName || '')}">
        </div>
        <div class="form-row">
          <label class="form-label-dark">봇 설명</label>
          <textarea class="form-control-dark" id="settings-desc-${botId}" rows="2">${escHtml(bot.botDesc || '')}</textarea>
        </div>
        <button class="btn-sm-primary" onclick="HomePage.saveBotInfo('${botId}')">정보 저장</button>
      </div>

      <div class="delete-bot-zone">
        <h4>봇 삭제</h4>
        <p>이 작업은 되돌릴 수 없습니다. 봇과 관련된 모든 데이터가 삭제됩니다.</p>
        <button class="btn-danger" onclick="HomePage.deleteBot('${botId}', '${escAttr(bot.botName || '')}')">이 챗봇 삭제하기</button>
      </div>
    `;
    panel.classList.add('open');
  }


  // ═══════════════════════════════════════════════
  // TOOL PANEL TOGGLE (per persona)
  // ═══════════════════════════════════════════════
  function openTool(botId, personaId, tool) {
    const key = `${botId}_${personaId}`;
    const panel = document.getElementById(`panel-${key}`);
    const card = document.getElementById(`persona-${key}`);
    if (!panel || !card) return;

    // Toggle
    if (openPanels[key] === tool) {
      panel.classList.remove('open');
      panel.innerHTML = '';
      openPanels[key] = null;
      card.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      return;
    }

    openPanels[key] = tool;
    card.querySelectorAll('.tool-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === tool);
    });

    const bot = MCW.storage.getBot(botId);
    if (!bot) return;
    const persona = (bot.personas || []).find(p => p.id === personaId);
    if (!persona) return;

    switch (tool) {
      case 'logs':      renderLogPanel(panel, bot, persona); break;
      case 'data':      renderKBPanel(panel, bot, persona); break;
      case 'skills':    renderSkillPanel(panel, bot, persona); break;
      case 'school':    renderSchoolPanel(panel, bot, persona); break;
      case 'community': renderCommunityPanel(panel, bot, persona); break;
      case 'psettings': renderPersonaSettingsPanel(panel, bot, persona); break;
    }

    panel.classList.add('open');
  }


  // ═══════════════════════════════════════════════
  // 1. LOG PANEL (per persona)
  // ═══════════════════════════════════════════════
  function renderLogPanel(panel, bot, persona) {
    const conversations = getPersonaConversations(bot.id, persona.id);
    const stats = getPersonaStats(bot.id, persona.id);
    const msgCount = stats.totalMessages || 0;
    const convCount = stats.totalConversations || 0;

    let messagesHtml = '';
    if (conversations.length === 0) {
      messagesHtml = '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:2rem;">아직 대화 기록이 없습니다.</div>';
    } else {
      const recent = conversations.slice(-50);
      messagesHtml = recent.map(msg => `
        <div class="log-msg ${msg.role}">
          <div>${escHtml(msg.content)}</div>
          <div class="log-msg-time">${msg.timestamp ? MCW.timeAgo(msg.timestamp) : ''}</div>
        </div>
      `).join('');
    }

    panel.innerHTML = `
      <div class="tool-panel-title">📑 ${escHtml(persona.name)}의 대화 로그</div>
      <div class="log-stats">
        <div class="log-stat-card">
          <div class="log-stat-value">${convCount}</div>
          <div class="log-stat-label">총 대화 수</div>
        </div>
        <div class="log-stat-card">
          <div class="log-stat-value">${msgCount}</div>
          <div class="log-stat-label">총 메시지 수</div>
        </div>
      </div>
      <div class="log-messages">${messagesHtml}</div>
    `;

    const logContainer = panel.querySelector('.log-messages');
    if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
  }


  // ═══════════════════════════════════════════════
  // 2. KNOWLEDGE BASE PANEL (per persona)
  // ═══════════════════════════════════════════════
  function renderKBPanel(panel, bot, persona) {
    const key = `${bot.id}_${persona.id}`;

    panel.innerHTML = `
      <div class="tool-panel-title">💾 ${escHtml(persona.name)}의 지식베이스
        <span class="save-indicator" id="kb-save-${key}">✓ 저장됨</span>
      </div>
      <div id="kb-content-${key}">
        <div style="text-align:center;color:rgba(255,255,255,0.3);padding:2rem;">로딩 중...</div>
      </div>
    `;

    loadAndRenderKB(bot.id, persona.id);
  }

  async function loadAndRenderKB(botId, personaId) {
    const key = `${botId}_${personaId}`;
    const contentEl = document.getElementById(`kb-content-${key}`);
    if (!contentEl) return;

    let kb = { qaPairs: [], freeText: '', files: [] };

    try {
      kb = await StorageManager.loadKnowledgeBase(personaId) || kb;
    } catch (e) {
      console.warn('[KB] load failed, using empty:', e);
    }

    kbState[key] = { currentKB: kb, personaId };

    const qaHtml = (kb.qaPairs || []).map((qa, i) => `
      <div class="qa-item" data-idx="${i}">
        <input type="text" placeholder="질문" value="${escAttr(qa.q || '')}"
          onchange="HomePage.updateQA('${botId}', '${personaId}', ${i}, 'q', this.value)">
        <input type="text" placeholder="답변" value="${escAttr(qa.a || '')}"
          onchange="HomePage.updateQA('${botId}', '${personaId}', ${i}, 'a', this.value)">
        <button class="qa-remove-btn" onclick="HomePage.removeQA('${botId}', '${personaId}', ${i})">✕</button>
      </div>
    `).join('');

    const filesHtml = (kb.files || []).map((f, i) => `
      <div class="file-item">
        <span>📄 ${escHtml(f.name)}</span>
        <button class="qa-remove-btn" onclick="HomePage.removeFile('${botId}', '${personaId}', ${i})">✕</button>
      </div>
    `).join('');

    contentEl.innerHTML = `
      <div class="kb-section">
        <div class="kb-section-title">
          <span>Q&A 관리</span>
          <button class="btn-sm-dark" onclick="HomePage.addQA('${botId}', '${personaId}')">+ 추가</button>
        </div>
        <div class="qa-list" id="qa-list-${key}">${qaHtml || '<div style="color:rgba(255,255,255,0.3);font-size:0.8rem;padding:8px 0;">등록된 Q&A가 없습니다.</div>'}</div>
      </div>

      <div class="kb-section">
        <div class="kb-section-title"><span>텍스트 지식</span></div>
        <textarea class="form-control-dark" rows="4"
          placeholder="챗봇이 알아야 할 정보를 자유롭게 입력하세요..."
          oninput="HomePage.updateFreeText('${botId}', '${personaId}', this.value)">${escHtml(kb.freeText || '')}</textarea>
      </div>

      <div class="kb-section">
        <div class="kb-section-title"><span>파일 업로드</span></div>
        <div class="file-upload-zone" onclick="document.getElementById('file-input-${key}').click()">
          📂 PDF, TXT, CSV 파일을 클릭하여 업로드
          <input type="file" id="file-input-${key}" accept=".pdf,.txt,.csv" multiple
            onchange="HomePage.handleFileUpload('${botId}', '${personaId}', this.files)" style="display:none">
        </div>
        <div class="file-list" id="file-list-${key}">${filesHtml}</div>
      </div>

      <div style="margin-top:1.5rem;text-align:right;">
        <button class="btn-sm-primary" onclick="HomePage.saveKB('${botId}', '${personaId}')">지식베이스 저장</button>
      </div>
    `;
  }

  // ─── KB Helpers ───
  function addQA(botId, personaId) {
    const key = `${botId}_${personaId}`;
    const state = kbState[key];
    if (!state || !state.currentKB) return;
    state.currentKB.qaPairs.push({ q: '', a: '' });
    refreshQAList(botId, personaId);
  }

  function removeQA(botId, personaId, idx) {
    const key = `${botId}_${personaId}`;
    const state = kbState[key];
    if (!state || !state.currentKB) return;
    state.currentKB.qaPairs.splice(idx, 1);
    refreshQAList(botId, personaId);
  }

  function updateQA(botId, personaId, idx, field, value) {
    const key = `${botId}_${personaId}`;
    const state = kbState[key];
    if (!state || !state.currentKB) return;
    if (state.currentKB.qaPairs[idx]) {
      state.currentKB.qaPairs[idx][field] = value;
    }
  }

  function updateFreeText(botId, personaId, value) {
    const key = `${botId}_${personaId}`;
    const state = kbState[key];
    if (!state || !state.currentKB) return;
    state.currentKB.freeText = value;
  }

  function refreshQAList(botId, personaId) {
    const key = `${botId}_${personaId}`;
    const listEl = document.getElementById(`qa-list-${key}`);
    if (!listEl) return;
    const state = kbState[key];
    const pairs = state?.currentKB?.qaPairs || [];

    if (pairs.length === 0) {
      listEl.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:0.8rem;padding:8px 0;">등록된 Q&A가 없습니다.</div>';
      return;
    }

    listEl.innerHTML = pairs.map((qa, i) => `
      <div class="qa-item" data-idx="${i}">
        <input type="text" placeholder="질문" value="${escAttr(qa.q || '')}"
          onchange="HomePage.updateQA('${botId}', '${personaId}', ${i}, 'q', this.value)">
        <input type="text" placeholder="답변" value="${escAttr(qa.a || '')}"
          onchange="HomePage.updateQA('${botId}', '${personaId}', ${i}, 'a', this.value)">
        <button class="qa-remove-btn" onclick="HomePage.removeQA('${botId}', '${personaId}', ${i})">✕</button>
      </div>
    `).join('');
  }

  async function handleFileUpload(botId, personaId, files) {
    const key = `${botId}_${personaId}`;
    const state = kbState[key];
    if (!state || !state.currentKB) return;

    for (const file of files) {
      const text = await readFileAsText(file);
      state.currentKB.files.push({ name: file.name, content: text });
    }

    const listEl = document.getElementById(`file-list-${key}`);
    if (listEl) {
      listEl.innerHTML = state.currentKB.files.map((f, i) => `
        <div class="file-item">
          <span>📄 ${escHtml(f.name)}</span>
          <button class="qa-remove-btn" onclick="HomePage.removeFile('${botId}', '${personaId}', ${i})">✕</button>
        </div>
      `).join('');
    }
  }

  function removeFile(botId, personaId, idx) {
    const key = `${botId}_${personaId}`;
    const state = kbState[key];
    if (!state || !state.currentKB) return;
    state.currentKB.files.splice(idx, 1);

    const listEl = document.getElementById(`file-list-${key}`);
    if (listEl) {
      listEl.innerHTML = state.currentKB.files.map((f, i) => `
        <div class="file-item">
          <span>📄 ${escHtml(f.name)}</span>
          <button class="qa-remove-btn" onclick="HomePage.removeFile('${botId}', '${personaId}', ${i})">✕</button>
        </div>
      `).join('');
    }
  }

  async function saveKB(botId, personaId) {
    const key = `${botId}_${personaId}`;
    const state = kbState[key];
    if (!state || !state.currentKB) return;

    try {
      await StorageManager.saveKnowledgeBase(personaId, state.currentKB);
      const el = document.getElementById(`kb-save-${key}`);
      if (el) {
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 2000);
      }
      MCW.showToast('지식베이스가 저장되었습니다.');
    } catch (e) {
      console.error('[KB] save failed:', e);
      MCW.showToast('저장에 실패했습니다.');
    }
  }


  // ═══════════════════════════════════════════════
  // 3. SKILL PANEL (per persona)
  // ═══════════════════════════════════════════════
  function renderSkillPanel(panel, bot, persona) {
    const key = `${bot.id}_${persona.id}`;
    const filter = skillFilter[key] || 'all';

    const installed = getPersonaSkills(bot.id, persona.id);
    const allSkills = MCW.skills || [];
    const installedIds = new Set(installed.map(s => s.id));

    const categories = ['all', ...new Set(allSkills.map(s => s.category))];

    const marketSkills = allSkills.filter(s => {
      if (installedIds.has(s.id)) return false;
      if (filter !== 'all' && s.category !== filter) return false;
      return true;
    });

    const installedHtml = installed.length === 0
      ? '<div style="color:rgba(255,255,255,0.3);font-size:0.8rem;padding:1rem 0;">설치된 스킬이 없습니다.</div>'
      : installed.map(s => {
          const full = MCW.storage.getSkill(s.id) || s;
          return `
            <div class="skill-card">
              <div class="skill-card-icon">${full.icon || '🧩'}</div>
              <div class="skill-card-info">
                <div class="skill-name">${escHtml(full.name)}</div>
                <div class="skill-desc">${escHtml(full.description || '')}</div>
              </div>
              <button class="skill-action-btn skill-remove-btn"
                onclick="HomePage.uninstallSkill('${bot.id}', '${persona.id}', '${s.id}')">제거</button>
            </div>`;
        }).join('');

    const marketHtml = marketSkills.length === 0
      ? '<div style="color:rgba(255,255,255,0.3);font-size:0.8rem;padding:1rem 0;">모든 스킬이 설치되었습니다!</div>'
      : marketSkills.map(s => `
          <div class="skill-card">
            <div class="skill-card-icon">${s.icon}</div>
            <div class="skill-card-info">
              <div class="skill-name">${escHtml(s.name)}</div>
              <div class="skill-desc">${escHtml(s.description)}</div>
              <div class="skill-meta">${s.isFree ? '무료' : `₩${(s.price || 0).toLocaleString()}`} · ${(s.installs || 0).toLocaleString()} 설치 · ⭐ ${s.rating || '-'}</div>
            </div>
            <button class="skill-action-btn skill-install-btn"
              onclick="HomePage.installSkill('${bot.id}', '${persona.id}', '${s.id}')">설치</button>
          </div>
        `).join('');

    const categoryChips = categories.map(c => `
      <button class="category-chip ${c === filter ? 'active' : ''}"
        onclick="HomePage.filterSkills('${bot.id}', '${persona.id}', '${c}')">${c === 'all' ? '전체' : c}</button>
    `).join('');

    panel.innerHTML = `
      <div class="tool-panel-title">🧩 ${escHtml(persona.name)}의 스킬 관리</div>
      <div class="skill-layout">
        <div class="skill-column">
          <h4>✅ 설치된 스킬 (${installed.length})</h4>
          <div class="skill-grid">${installedHtml}</div>
        </div>
        <div class="skill-column">
          <h4>🛒 스킬 마켓</h4>
          <div class="skill-category-filter">${categoryChips}</div>
          <div class="skill-grid">${marketHtml}</div>
        </div>
      </div>
    `;
  }

  function installSkill(botId, personaId, skillId) {
    const skill = MCW.skills.find(s => s.id === skillId);
    if (!skill) return;

    const skills = getPersonaSkills(botId, personaId);
    if (!skills.find(s => s.id === skill.id)) {
      skills.push({ ...skill, installed_at: new Date().toISOString() });
      savePersonaSkills(botId, personaId, skills);
    }

    MCW.showToast(`"${skill.name}" 스킬이 설치되었습니다.`);
    reopenTool(botId, personaId, 'skills');
  }

  function uninstallSkill(botId, personaId, skillId) {
    const skills = getPersonaSkills(botId, personaId).filter(s => s.id !== skillId);
    savePersonaSkills(botId, personaId, skills);
    MCW.showToast('스킬이 제거되었습니다.');
    reopenTool(botId, personaId, 'skills');
  }

  function filterSkills(botId, personaId, category) {
    const key = `${botId}_${personaId}`;
    skillFilter[key] = category;
    reopenTool(botId, personaId, 'skills');
  }

  // Helper: re-render an open tool panel without toggling
  function reopenTool(botId, personaId, tool) {
    const key = `${botId}_${personaId}`;
    const panel = document.getElementById(`panel-${key}`);
    const bot = MCW.storage.getBot(botId);
    if (!panel || !bot) return;
    const persona = (bot.personas || []).find(p => p.id === personaId);
    if (!persona) return;

    switch (tool) {
      case 'logs':      renderLogPanel(panel, bot, persona); break;
      case 'data':      renderKBPanel(panel, bot, persona); break;
      case 'skills':    renderSkillPanel(panel, bot, persona); break;
      case 'school':    renderSchoolPanel(panel, bot, persona); break;
      case 'community': renderCommunityPanel(panel, bot, persona); break;
      case 'psettings': renderPersonaSettingsPanel(panel, bot, persona); break;
    }
  }


  // ═══════════════════════════════════════════════
  // 4. SCHOOL PANEL (per persona)
  // ═══════════════════════════════════════════════
  function renderSchoolPanel(panel, bot, persona) {
    const key = `${bot.id}_${persona.id}`;
    const stats = getPersonaStats(bot.id, persona.id);
    const installedSkills = getPersonaSkills(bot.id, persona.id);
    const conversations = getPersonaConversations(bot.id, persona.id);
    const kb = kbState[key]?.currentKB;

    const hasKB = kb ? (kb.qaPairs?.length > 0 || kb.freeText || kb.files?.length > 0) : false;
    const hasSkills = installedSkills.length > 0;
    const hasConversations = conversations.length > 0;
    const hasRole = !!(persona.role);

    let completedSteps = 0;
    if (hasRole) completedSteps++;
    if (hasKB) completedSteps++;
    if (hasSkills) completedSteps++;
    if (hasConversations) completedSteps++;
    const progressPercent = Math.round((completedSteps / 4) * 100);

    panel.innerHTML = `
      <div class="tool-panel-title">🎓 ${escHtml(persona.name)}의 학습 현황</div>

      <div class="log-stats" style="margin-bottom:1.5rem;">
        <div class="log-stat-card">
          <div class="log-stat-value">${progressPercent}%</div>
          <div class="log-stat-label">학습 진도</div>
        </div>
        <div class="log-stat-card">
          <div class="log-stat-value">${installedSkills.length}</div>
          <div class="log-stat-label">습득한 스킬</div>
        </div>
        <div class="log-stat-card">
          <div class="log-stat-value">${stats.totalMessages || 0}</div>
          <div class="log-stat-label">대화 경험</div>
        </div>
      </div>

      <h4 style="font-size:0.9rem;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:0.75rem;">학습 단계별 현황</h4>
      <ul class="school-feature-list">
        <li>${hasRole ? '✅' : '⬜'} 역할 설정 — ${hasRole ? escHtml(persona.role) : '아직 역할이 지정되지 않았습니다'}</li>
        <li>${hasKB ? '✅' : '⬜'} 지식베이스 학습 — ${hasKB ? '지식 데이터 입력 완료' : '아직 지식이 입력되지 않았습니다'}</li>
        <li>${hasSkills ? '✅' : '⬜'} 스킬 습득 — ${hasSkills ? `${installedSkills.length}개 스킬 장착 완료` : '아직 스킬이 설치되지 않았습니다'}</li>
        <li>${hasConversations ? '✅' : '⬜'} 실전 대화 — ${hasConversations ? `${conversations.length}개 메시지 경험` : '아직 대화 경험이 없습니다'}</li>
      </ul>
    `;
  }


  // ═══════════════════════════════════════════════
  // 5. COMMUNITY PANEL (per persona)
  // ═══════════════════════════════════════════════
  function renderCommunityPanel(panel, bot, persona) {
    const activities = getPersonaCommunity(bot.id, persona.id);

    let activityHtml = '';
    if (activities.length === 0) {
      activityHtml = `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:2rem;">아직 커뮤니티 활동 내역이 없습니다.</div>`;
    } else {
      activityHtml = activities.slice(-30).reverse().map(a => `
        <div class="community-activity-item">
          <div class="activity-icon">${a.icon || '💬'}</div>
          <div class="activity-content">
            <div class="activity-text">${escHtml(a.text || '')}</div>
            <div class="activity-time">${a.timestamp ? MCW.timeAgo(a.timestamp) : ''}</div>
          </div>
        </div>
      `).join('');
    }

    panel.innerHTML = `
      <div class="tool-panel-title">💬 ${escHtml(persona.name)}의 커뮤니티 활동</div>

      <div class="log-stats" style="margin-bottom:1.5rem;">
        <div class="log-stat-card">
          <div class="log-stat-value">${activities.filter(a => a.type === 'post').length}</div>
          <div class="log-stat-label">작성한 글</div>
        </div>
        <div class="log-stat-card">
          <div class="log-stat-value">${activities.filter(a => a.type === 'reply').length}</div>
          <div class="log-stat-label">답변 수</div>
        </div>
        <div class="log-stat-card">
          <div class="log-stat-value">${activities.filter(a => a.type === 'like').length}</div>
          <div class="log-stat-label">받은 좋아요</div>
        </div>
      </div>

      <h4 style="font-size:0.9rem;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:0.75rem;">최근 활동 내역</h4>
      <div class="community-activity-list">${activityHtml}</div>

      <div style="margin-top:1.5rem;text-align:center;">
        <button class="btn-sm-dark" onclick="location.href='../community/index.html'">커뮤니티 바로가기</button>
      </div>
    `;
  }


  // ═══════════════════════════════════════════════
  // 6. PERSONA SETTINGS PANEL (per persona)
  // ═══════════════════════════════════════════════
  function renderPersonaSettingsPanel(panel, bot, persona) {
    const key = `${bot.id}_${persona.id}`;

    panel.innerHTML = `
      <div class="tool-panel-title">🔧 ${escHtml(persona.name)} 설정</div>
      <div class="settings-section">
        <div class="form-row">
          <label class="form-label-dark">이름</label>
          <input class="form-control-dark" id="pname-${key}" value="${escAttr(persona.name || '')}">
        </div>
        <div class="form-row">
          <label class="form-label-dark">역할</label>
          <input class="form-control-dark" id="prole-${key}" value="${escAttr(persona.role || '')}"
            placeholder="예: 친근한 상담사, 전문 코딩 도우미">
        </div>
        <div class="form-row">
          <label class="form-label-dark">카테고리</label>
          <select class="form-control-dark" id="pcategory-${key}">
            <option value="avatar" ${persona.category === 'avatar' ? 'selected' : ''}>분신 아바타</option>
            <option value="helper" ${persona.category === 'helper' ? 'selected' : ''}>AI 도우미</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label-dark" id="piq-label-${key}">IQ ↔ EQ 밸런스: ${persona.iqEq ?? 50}</label>
          <input type="range" class="iq-eq-slider" min="0" max="100" value="${persona.iqEq ?? 50}"
            oninput="document.getElementById('piq-label-${key}').textContent='IQ ↔ EQ 밸런스: '+this.value">
          <div class="iq-eq-labels"><span>IQ (논리적)</span><span>EQ (감성적)</span></div>
        </div>
        <div class="form-row">
          <label class="form-label-dark">인사말</label>
          <input class="form-control-dark" id="pgreeting-${key}" value="${escAttr(persona.greeting || '')}">
        </div>
        <div style="display:flex;gap:8px;margin-top:1rem;">
          <button class="btn-sm-primary" onclick="HomePage.savePersonaSettings('${bot.id}', '${persona.id}')">설정 저장</button>
          <button class="btn-danger btn-sm" onclick="HomePage.removePersona('${bot.id}', '${persona.id}')">이 페르소나 삭제</button>
        </div>
      </div>
    `;
  }

  function savePersonaSettings(botId, personaId) {
    const bot = MCW.storage.getBot(botId);
    if (!bot) return;
    const persona = (bot.personas || []).find(p => p.id === personaId);
    if (!persona) return;

    const key = `${botId}_${personaId}`;
    const nameEl = document.getElementById(`pname-${key}`);
    const roleEl = document.getElementById(`prole-${key}`);
    const categoryEl = document.getElementById(`pcategory-${key}`);
    const iqSlider = document.querySelector(`#piq-label-${key}`)?.closest('.form-row')?.querySelector('input[type="range"]');
    const greetingEl = document.getElementById(`pgreeting-${key}`);

    if (nameEl) persona.name = nameEl.value.trim();
    if (roleEl) persona.role = roleEl.value.trim();
    if (categoryEl) persona.category = categoryEl.value;
    if (iqSlider) persona.iqEq = parseInt(iqSlider.value);
    if (greetingEl) persona.greeting = greetingEl.value.trim();

    MCW.storage.saveBot(bot);
    MCW.showToast('페르소나 설정이 저장되었습니다.');
    renderBotList();
    // Re-open persona settings after list refresh
    setTimeout(() => openTool(botId, personaId, 'psettings'), 50);
  }


  // ═══════════════════════════════════════════════
  // PERSONA CRUD
  // ═══════════════════════════════════════════════
  function addPersona(botId) {
    const bot = MCW.storage.getBot(botId);
    if (!bot) return;
    if (!bot.personas) bot.personas = [];
    if (bot.personas.length >= 10) {
      MCW.showToast('페르소나는 최대 10개까지 설정 가능합니다.');
      return;
    }

    // 미니 생성 폼을 모달로 표시
    const overlay = document.createElement('div');
    overlay.className = 'persona-form-overlay';
    overlay.innerHTML = `
      <div class="persona-form-modal">
        <h3>페르소나 추가</h3>
        <div class="form-row">
          <label class="form-label-dark">이름 *</label>
          <input class="form-control-dark" id="newp-name" placeholder="예: 고객 상담, 업무 비서">
        </div>
        <div class="form-row">
          <label class="form-label-dark">카테고리</label>
          <select class="form-control-dark" id="newp-category">
            <option value="avatar">분신 아바타 (공개)</option>
            <option value="helper">AI 도우미 (비공개)</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label-dark">역할</label>
          <input class="form-control-dark" id="newp-role" placeholder="이 페르소나의 역할을 설명해주세요">
        </div>
        <div class="form-row">
          <label class="form-label-dark" id="newp-iq-label">IQ ↔ EQ 밸런스: 50</label>
          <input type="range" class="iq-eq-slider" id="newp-iqeq" min="0" max="100" value="50"
            oninput="document.getElementById('newp-iq-label').textContent='IQ ↔ EQ 밸런스: '+this.value">
          <div class="iq-eq-labels"><span>IQ (논리적)</span><span>EQ (감성적)</span></div>
        </div>
        <div class="form-row">
          <label class="form-label-dark">AI 모델</label>
          <select class="form-control-dark" id="newp-model">
            <option value="logic">논리파</option>
            <option value="emotion">감성파</option>
            <option value="fast">속도파</option>
            <option value="creative">창작파</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;margin-top:1rem;">
          <button class="btn-sm-primary" id="newp-submit">추가</button>
          <button class="btn-sm-dark" id="newp-cancel">취소</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#newp-cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#newp-submit').onclick = () => {
      const name = document.getElementById('newp-name').value.trim();
      if (!name) { alert('이름을 입력해주세요.'); return; }

      const category = document.getElementById('newp-category').value;
      const role = document.getElementById('newp-role').value.trim();
      const iqEq = parseInt(document.getElementById('newp-iqeq').value);
      const model = document.getElementById('newp-model').value;
      const botName = bot.botName || '';

      const persona = {
        id: category + '_' + name.replace(/\s/g, '_').toLowerCase() + '_' + Date.now().toString(36),
        name: name,
        role: role,
        category: category,
        model: model,
        iqEq: iqEq,
        isVisible: true,
        isPublic: category === 'avatar',
        greeting: '',
        faqs: []
      };

      // 자동 greeting/FAQ 생성
      persona.greeting = generatePersonaGreeting(botName, persona);
      persona.faqs = generatePersonaDefaultFaqs(persona);

      bot.personas.push(persona);
      MCW.storage.saveBot(bot);
      overlay.remove();
      MCW.showToast('페르소나가 추가되었습니다.');
      renderBotList();
    };
  }

  // Greeting/FAQ 생성 (create.js 로직 재사용)
  function generatePersonaGreeting(botName, persona) {
    const iq = persona.iqEq;
    if (iq >= 75) return '안녕하세요. ' + botName + '의 ' + persona.name + '입니다. 정확하고 전문적인 답변으로 도와드리겠습니다.';
    if (iq >= 50) return '안녕하세요! ' + botName + '의 ' + persona.name + '입니다. 무엇이든 편하게 물어보세요.';
    if (iq >= 25) return '안녕하세요! ' + botName + '의 ' + persona.name + '이에요. 함께 이야기해볼까요?';
    return '반가워요! ' + botName + '의 ' + persona.name + '이에요. 편하게 말씀해 주세요.';
  }

  function generatePersonaDefaultFaqs(persona) {
    if (persona.category === 'helper') {
      return [
        { q: '도움이 필요해요', a: '' },
        { q: '추천해줘', a: '' },
        { q: '일정 알려줘', a: '' }
      ];
    }
    return [
      { q: '소개해주세요', a: '' },
      { q: '서비스 안내', a: '' },
      { q: '연락처', a: '' }
    ];
  }

  function removePersona(botId, personaId) {
    const bot = MCW.storage.getBot(botId);
    if (!bot || !bot.personas) return;

    const idx = bot.personas.findIndex(p => p.id === personaId);
    if (idx === -1) return;

    const name = bot.personas[idx].name || `페르소나 ${idx + 1}`;
    if (!confirm(`"${name}" 페르소나를 삭제하시겠습니까?`)) return;

    bot.personas.splice(idx, 1);
    MCW.storage.saveBot(bot);
    MCW.showToast('페르소나가 삭제되었습니다.');
    renderBotList();
  }


  // ═══════════════════════════════════════════════
  // BOT CRUD
  // ═══════════════════════════════════════════════
  function saveBotInfo(botId) {
    const bot = MCW.storage.getBot(botId);
    if (!bot) return;

    const nameEl = document.getElementById(`settings-name-${botId}`);
    const descEl = document.getElementById(`settings-desc-${botId}`);

    if (nameEl) bot.botName = nameEl.value.trim();
    if (descEl) bot.botDesc = descEl.value.trim();

    MCW.storage.saveBot(bot);
    MCW.showToast('봇 정보가 저장되었습니다.');
    renderBotList();
  }

  function deleteBot(botId, botName) {
    if (!confirm(`정말 "${botName}" 챗봇을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    MCW.storage.deleteBot(botId);
    MCW.showToast('챗봇이 삭제되었습니다.');
    renderBotList();
  }


  // ─── Helpers ───
  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function readFileAsText(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }


  // ─── Tab Switching (sidebar) ───
  function switchTab(tabId) {
    document.querySelectorAll('.manage-tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.manage-nav-item').forEach(i => i.classList.remove('active'));

    const tabEl = document.getElementById(tabId + '-tab');
    if (tabEl) tabEl.classList.add('active');

    const navItems = document.querySelectorAll('.manage-nav-item');
    navItems.forEach(item => {
      if (item.dataset.tab === tabId) item.classList.add('active');
    });
  }

  function updateProfile() {
    const user = MCW.user.getCurrentUser();
    if (!user) return;
    const nameEl = document.getElementById('userNameInput');
    if (nameEl) user.name = nameEl.value;
    MCW.user.saveUser(user);
    MCW.showToast('프로필이 저장되었습니다.');
  }

  function changePassword() {
    const current = document.getElementById('currentPw')?.value;
    const next = document.getElementById('newPw')?.value;
    const confirmVal = document.getElementById('newPwConfirm')?.value;

    if (!current || !next) return alert('비밀번호를 입력해주세요.');
    if (next !== confirmVal) return alert('새 비밀번호가 일치하지 않습니다.');

    MCW.showToast('비밀번호가 변경되었습니다.');
    if (document.getElementById('currentPw')) document.getElementById('currentPw').value = '';
    if (document.getElementById('newPw')) document.getElementById('newPw').value = '';
    if (document.getElementById('newPwConfirm')) document.getElementById('newPwConfirm').value = '';
  }

  function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      MCW.user.logout();
      window.location.href = '../login.html';
    }
  }


  // ─── QR Code ───
  function toggleQR(botId, botUrl) {
    const el = document.getElementById(`qr-${botId}`);
    if (!el) return;
    if (el.innerHTML) {
      el.innerHTML = '';
      return;
    }
    const fullUrl = window.location.origin + '/' + botUrl.replace(/^\.\.\//, '');
    const qrSrc = MCW.getQRCodeURL(fullUrl, 200);
    el.innerHTML = `<img src="${qrSrc}" alt="QR Code" style="width:200px;height:200px;border-radius:12px;">`;
  }

  // ─── Copy URL ───
  function copyUrl(inputEl) {
    if (!inputEl) return;
    inputEl.select();
    try {
      navigator.clipboard.writeText(inputEl.value);
      MCW.showToast('URL이 복사되었습니다.');
    } catch {
      document.execCommand('copy');
      MCW.showToast('URL이 복사되었습니다.');
    }
  }


  // ─── Public API ───
  return {
    init,
    renderBotList,
    openTool,
    toggleBotSettings,
    switchTab,
    updateProfile,
    changePassword,
    logout,
    copyUrl,
    toggleQR,

    // KB
    addQA,
    removeQA,
    updateQA,
    updateFreeText,
    handleFileUpload,
    removeFile,
    saveKB,

    // Skills
    installSkill,
    uninstallSkill,
    filterSkills,

    // Persona
    addPersona,
    removePersona,
    savePersonaSettings,

    // Bot
    saveBotInfo,
    deleteBot
  };
})();

window.HomePage = HomePage;
