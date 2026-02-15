/* ============================================
   My Chatbot World - Common Utilities
   ============================================ */

const MCW = {
  // ─── Storage (localStorage wrapper for MVP) ───
  storage: {
    getBots() {
      return JSON.parse(localStorage.getItem('mcw_bots') || '[]');
    },
    saveBot(bot) {
      const bots = this.getBots();
      bot.id = bot.id || crypto.randomUUID();
      bot.created_at = bot.created_at || new Date().toISOString();
      const idx = bots.findIndex(b => b.id === bot.id);
      if (idx >= 0) bots[idx] = bot;
      else bots.push(bot);
      localStorage.setItem('mcw_bots', JSON.stringify(bots));
      return bot;
    },
    getBot(id) {
      return this.getBots().find(b => b.id === id) || null;
    },
    getBotByUsername(username) {
      return this.getBots().find(b => b.username === username) || null;
    },
    deleteBot(id) {
      const bots = this.getBots().filter(b => b.id !== id);
      localStorage.setItem('mcw_bots', JSON.stringify(bots));
    },
    getConversations(botId) {
      return JSON.parse(localStorage.getItem(`mcw_conv_${botId}`) || '[]');
    },
    saveMessage(botId, role, content) {
      const convs = this.getConversations(botId);
      convs.push({ role, content, timestamp: new Date().toISOString() });
      // 최대 200개 메시지만 유지
      if (convs.length > 200) convs.splice(0, convs.length - 200);
      localStorage.setItem(`mcw_conv_${botId}`, JSON.stringify(convs));
    },
    getStats(botId) {
      return JSON.parse(localStorage.getItem(`mcw_stats_${botId}`) || '{"totalConversations":0,"totalMessages":0,"daily":{},"topQuestions":{}}');
    },
    saveStats(botId, stats) {
      localStorage.setItem(`mcw_stats_${botId}`, JSON.stringify(stats));
    },
    logEvent(botId, type, data = {}) {
      const stats = this.getStats(botId);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Initialize daily stats if needed
      stats.daily = stats.daily || {};
      stats.daily[today] = stats.daily[today] || { conversations: 0, messages: 0 };

      if (type === 'conversation_start') {
        stats.totalConversations = (stats.totalConversations || 0) + 1;
        stats.daily[today].conversations++;
      } else if (type === 'message') {
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        stats.daily[today].messages++;

        // Track top questions (user messages only)
        if (data.role === 'user' && data.content) {
          stats.topQuestions = stats.topQuestions || {};
          const q = data.content.trim();
          if (q.length < 50) { // Only track short questions
            stats.topQuestions[q] = (stats.topQuestions[q] || 0) + 1;
          }
        }
      }

      this.saveStats(botId, stats);
    },
    getInstalledSkills(botId) {
      return JSON.parse(localStorage.getItem(`mcw_skills_${botId}`) || '[]');
    },
    installSkill(botId, skill) {
      const skills = this.getInstalledSkills(botId);
      if (!skills.find(s => s.id === skill.id)) {
        skills.push({ ...skill, installed_at: new Date().toISOString() });
        localStorage.setItem(`mcw_skills_${botId}`, JSON.stringify(skills));
      }
    },
    uninstallSkill(botId, skillId) {
      const skills = this.getInstalledSkills(botId).filter(s => s.id !== skillId);
      localStorage.setItem(`mcw_skills_${botId}`, JSON.stringify(skills));
    },
    getSkill(skillId) {
      return MCW.skills.find(s => s.id === skillId);
    }
  },

  // ─── User Management (Phase 3) ───
  user: {
    getUsers() {
      return JSON.parse(localStorage.getItem('mcw_users') || '[]');
    },
    saveUser(user) {
      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) users[idx] = user;
      else users.push(user);
      localStorage.setItem('mcw_users', JSON.stringify(users));
      return user;
    },
    getUser(id) {
      const users = this.getUsers();
      const user = users.find(u => u.id === id || u.email === id);
      return user || null;
    },
    claimAnonymousBots(id) {
      const bots = JSON.parse(localStorage.getItem('mcw_bots') || '[]');
      let changed = false;
      bots.forEach(b => {
        if (!b.ownerId || b.ownerId === 'anonymous' || b.ownerId === 'admin') {
          b.ownerId = id;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('mcw_bots', JSON.stringify(bots));
        console.log("[MCW] Bots claimed for user:", id);
      }
    },
    verifyPassword(id, password) {
      const user = this.getUser(id);
      if (user && user.password === password) return true;
      return false;
    },
    getCurrentUser() {
      const id = localStorage.getItem('mcw_current_user_id');
      if (id) return this.getUser(id);
      return null;
    },
    login(id) {
      localStorage.setItem('mcw_current_user_id', id);
    },
    logout() {
      localStorage.removeItem('mcw_current_user_id');
      window.location.href = '../login.html'; // Direct redirect
    }
  },

  // ─── Utilities ───
  getQRCodeURL(url, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  },

  // ─── Skills Marketplace Data ───
  skills: [
    { id: 'stats-analysis', name: '통계 분석 센터', icon: '📊', category: '분석', description: '일일/주간/월간 대화 통계, 인기 질문 TOP 10', isFree: true, installs: 1234, rating: 4.8 },
    { id: 'sentiment', name: '감정 분석', icon: '😊', category: '분석', description: '사용자 만족도 자동 측정, 긍정/부정 비율', isFree: true, installs: 892, rating: 4.5 },
    { id: 'profanity-filter', name: '욕설 필터', icon: '🛡️', category: '보안', description: '부적절한 질문 차단 및 자동 경고', isFree: true, installs: 2103, rating: 4.9 },
    { id: 'spam-block', name: '스팸 방지', icon: '🚫', category: '보안', description: '반복 질문 차단, IP 차단', isFree: true, installs: 1567, rating: 4.6 },
    { id: 'backup', name: '백업 & 복구', icon: '💾', category: '관리', description: '자동 백업 (주 1회), 수동 백업/복구', isFree: true, installs: 1890, rating: 4.7 },
    { id: 'pdf-upload', name: 'PDF 업로드', icon: '📄', category: '지식', description: '문서 자동 학습, 최대 10MB', isFree: true, installs: 3210, rating: 4.8 },
    { id: 'web-crawl', name: '웹 크롤링', icon: '🌐', category: '지식', description: 'URL 입력하면 자동 수집', isFree: true, installs: 1456, rating: 4.3 },
    { id: 'faq-auto', name: 'FAQ 자동 생성', icon: '❓', category: '지식', description: '대화 패턴 분석으로 FAQ 후보 추천', isFree: true, installs: 987, rating: 4.4 },
    { id: 'multilang', name: '다국어 번역', icon: '🌍', category: 'UI', description: '20개 언어 자동 번역', isFree: true, installs: 2345, rating: 4.6 },
    { id: 'tts-basic', name: '음성 답변 TTS', icon: '🔊', category: 'UI', description: '기본 음성 제공 (한국어/영어)', isFree: true, installs: 1678, rating: 4.2 },
    { id: 'emoji-react', name: '이모지 반응', icon: '😀', category: 'UI', description: '감정에 따라 이모지 자동 추가', isFree: true, installs: 2567, rating: 4.7 },
    { id: 'reservation', name: '예약 시스템', icon: '📅', category: '비즈니스', description: '상담 예약 받기, 캘린더 연동', isFree: true, installs: 3456, rating: 4.9 },
    { id: 'survey', name: '설문조사', icon: '📋', category: '비즈니스', description: '자동 설문 수집 및 결과 분석', isFree: true, installs: 1234, rating: 4.5 },
    { id: 'coupon', name: '쿠폰 발급', icon: '🎫', category: '비즈니스', description: '자동 쿠폰 생성, 유효기간 설정', isFree: true, installs: 876, rating: 4.3 },
    { id: 'lead-collect', name: '리드 수집', icon: '📧', category: '비즈니스', description: '연락처 수집, CRM 연동', isFree: true, installs: 1543, rating: 4.6 },
    { id: 'google-cal', name: '구글 캘린더', icon: '📆', category: '연동', description: '일정 자동 응답', isFree: true, installs: 2345, rating: 4.5 },
    { id: 'email-send', name: '이메일 전송', icon: '✉️', category: '연동', description: '문의사항 자동 메일 발송', isFree: true, installs: 1789, rating: 4.4 },
    { id: 'kakao-noti', name: '카카오톡 알림', icon: '💬', category: '연동', description: '중요 메시지 카톡 전달', isFree: true, installs: 4567, rating: 4.8 },
    { id: 'voice-clone', name: '내 목소리 복제', icon: '🎤', category: 'UI', description: '음성 샘플 3분으로 AI 음성 생성', isFree: false, price: 50000, installs: 2341, rating: 4.9 },
    { id: '3d-avatar', name: '3D 아바타', icon: '👤', category: 'UI', description: '내 얼굴로 3D 아바타 생성', isFree: false, price: 30000, installs: 1678, rating: 4.7 },
    { id: 'custom-theme', name: '커스텀 테마', icon: '🎨', category: 'UI', description: '브랜드 색상, 로고 추가', isFree: false, price: 20000, installs: 1234, rating: 4.5 },
  ],

  // ─── AI Models (원소스 멀티유즈 통합 모델 스택) ───
  models: {
    // 채팅 모델 — 가성비 순서 (최고 모델 바로 밑 단계)
    chat: [
      'google/gemini-2.5-flash',
      'openai/gpt-4o',
      'anthropic/claude-sonnet-4.5',
      'deepseek/deepseek-chat',
    ],
    search: 'perplexity/sonar',
    free: 'openrouter/free',
    // 음성 (원소스 — 플랫폼/텔레그램 동일)
    stt: 'whisper-1',
    tts: 'tts-1',
    ttsVoice: 'alloy',
    names: {
      'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
      'openai/gpt-4o': 'GPT-4o',
      'anthropic/claude-sonnet-4.5': 'Claude Sonnet 4.5',
      'deepseek/deepseek-chat': 'DeepSeek V3',
      'perplexity/sonar': 'Perplexity Sonar',
      'openrouter/free': 'Free Model',
    }
  },

  // ─── Helpers ───
  formatDate(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
  },

  timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return '방금 전';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    return `${d}일 전`;
  },

  slugify(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '');
  },

  showToast(message, duration = 3000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  // ─── API calls ───
  async callAPI(endpoint, body) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API call failed:', err);
      throw err;
    }
  },

  // ─── QR Code Generation (using QR Server API) ───
  getQRCodeURL(text, size = 300) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  }
};

// Make globally available
window.MCW = MCW;

// ─── App Init: 로그인 유저 봇 자동 연결 ───
(function autoClaimBots() {
  const user = MCW.user.getCurrentUser();
  if (user) MCW.user.claimAnonymousBots(user.id);
})();
