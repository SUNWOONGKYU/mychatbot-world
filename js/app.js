/* ============================================
   코코봇 - Common Utilities
   ============================================ */

const MCW = {
  // ─── Supabase Config (single source of truth) ───
  // Anon key is public (RLS enforced) — safe to expose in client code
  SB_URL: 'https://gybgkehtonqhosuutoxx.supabase.co',
  SB_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YmdrZWh0b25xaG9zdXV0b3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzQ1OTEsImV4cCI6MjA4Njc1MDU5MX0.Xk4JRkJwdTps95vXq3dXklgsTl7Yz_G1I4kbItPr2kw',

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
    getSkill(skillId) {
      return MCW.skills.find(s => s.id === skillId);
    },
    // Per-persona storage helpers
    getPersonaSkills(botId, personaId) {
      return JSON.parse(localStorage.getItem(`mcw_skills_${botId}_${personaId}`) || '[]');
    },
    getPersonaConversations(botId, personaId) {
      return JSON.parse(localStorage.getItem(`mcw_conv_${botId}_${personaId}`) || '[]');
    },
    getPersonaStats(botId, personaId) {
      return JSON.parse(localStorage.getItem(`mcw_stats_${botId}_${personaId}`) || '{"totalConversations":0,"totalMessages":0}');
    }
  },

  // ─── Auth (Supabase Auth wrapper) ───
  auth: {
    _supabase: null,
    _user: null,

    async init() {
      if (this._supabase) return this._user;

      const url = MCW.SB_URL;
      const key = MCW.SB_KEY;
      if (!url || !key || typeof supabase === 'undefined') {
        console.warn('[MCW.auth] Supabase not available');
        return null;
      }

      this._supabase = supabase.createClient(url, key, {
        auth: { flowType: 'implicit' }
      });

      // onAuthStateChange를 getUser() 이전에 등록 — PASSWORD_RECOVERY 이벤트 놓치지 않도록
      this._supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this._user = MCW.auth._toUserObj(session.user);
        } else {
          this._user = null;
        }
        if (_event === 'PASSWORD_RECOVERY') {
          this._passwordRecovery = true;
          window.dispatchEvent(new CustomEvent('mcw:password-recovery'));
        }
      });

      // Restore session — getUser() validates against server (not just local cache)
      const { data: { user: serverUser } } = await this._supabase.auth.getUser();
      if (serverUser) {
        this._user = MCW.auth._toUserObj(serverUser);
      }

      return this._user;
    },

    getClient() {
      return this._supabase;
    },

    _toUserObj(supaUser) {
      return {
        id: supaUser.email,
        email: supaUser.email,
        name: supaUser.user_metadata?.name || supaUser.email.split('@')[0],
        created_at: supaUser.created_at,
        role: 'user'
      };
    }
  },

  // ─── User Management (Supabase Auth) ───
  user: {
    getCurrentUser() {
      return MCW.auth._user;
    },

    async login(email, password) {
      const client = MCW.auth.getClient();
      if (!client) throw new Error('Auth not initialized');
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      MCW.auth._user = MCW.auth._toUserObj(data.user);
      return MCW.auth._user;
    },

    async signup(email, password, name) {
      const client = MCW.auth.getClient();
      if (!client) throw new Error('Auth not initialized');
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: 'https://cocobot.world/'
        }
      });
      if (error) throw error;
      if (data.session) {
        MCW.auth._user = MCW.auth._toUserObj(data.user);
      }
      return { user: data.user, session: data.session };
    },

    async logout() {
      const client = MCW.auth.getClient();
      if (client) await client.auth.signOut();
      MCW.auth._user = null;
    },

    async saveUser(updates) {
      const client = MCW.auth.getClient();
      if (!client) throw new Error('Auth not initialized');
      const { data, error } = await client.auth.updateUser({
        data: { name: updates.name }
      });
      if (error) throw error;
      MCW.auth._user = MCW.auth._toUserObj(data.user);
      return MCW.auth._user;
    },

    async resetPassword(email) {
      const client = MCW.auth.getClient();
      if (!client) throw new Error('Auth not initialized');
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://cocobot.world/pages/reset-password.html'
      });
      if (error) throw error;
    },

    async updatePassword(newPassword) {
      const client = MCW.auth.getClient();
      if (!client) throw new Error('Auth not initialized');
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw error;
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
    }
  },

  // ─── Skills Marketplace Data (with systemPrompt) ───
  skills: [
    { id: 'stats-analysis', name: '통계 분석 센터', icon: '📊', category: '분석', description: '일일/주간/월간 대화 통계, 인기 질문 TOP 10',
      systemPrompt: '대화 통계를 추적합니다. 사용자가 통계를 물으면: 총 대화수, 인기 질문 TOP 3, 일별 메시지수를 간결하게 요약하세요.',
      isFree: true, installs: 1234, rating: 4.8 },
    { id: 'sentiment', name: '감정 분석', icon: '😊', category: '분석', description: '사용자 만족도 자동 측정, 긍정/부정 비율',
      systemPrompt: '사용자의 감정을 파악하세요. 부정적 감정이면 먼저 공감을 표현한 후 답변하세요. 긍정적이면 함께 기뻐하는 어조를 사용하세요.',
      isFree: true, installs: 892, rating: 4.5 },
    { id: 'profanity-filter', name: '욕설 필터', icon: '🛡️', category: '보안', description: '부적절한 질문 차단 및 자동 경고',
      systemPrompt: '욕설·비속어·혐오 표현이 포함된 메시지는 정중히 거절하세요. "해당 표현은 적절하지 않습니다. 정중한 표현으로 다시 질문해 주세요."라고 안내하세요.',
      isFree: true, installs: 2103, rating: 4.9 },
    { id: 'spam-block', name: '스팸 방지', icon: '🚫', category: '보안', description: '반복 질문 차단, IP 차단',
      systemPrompt: '동일한 메시지가 반복되면 "이전 답변을 참고해 주세요"라고 안내하고 답변을 생략하세요.',
      isFree: true, installs: 1567, rating: 4.6 },
    { id: 'backup', name: '백업 & 복구', icon: '💾', category: '관리', description: '자동 백업 (주 1회), 수동 백업/복구',
      systemPrompt: '백업·복구 관련 질문에는 "대화 내역은 자동 저장됩니다. 수동 백업은 마이페이지 > 데이터 관리를 이용해 주세요"라고 안내하세요.',
      isFree: true, installs: 1890, rating: 4.7 },
    { id: 'pdf-upload', name: 'PDF 업로드', icon: '📄', category: '지식', description: '문서 자동 학습, 최대 10MB',
      systemPrompt: 'PDF 업로드 관련 질문에는 "마이페이지 > 지식베이스에서 PDF(최대 10MB)를 업로드하면 자동으로 학습합니다"라고 안내하세요.',
      isFree: true, installs: 3210, rating: 4.8 },
    { id: 'web-crawl', name: '웹 크롤링', icon: '🌐', category: '지식', description: 'URL 입력하면 자동 수집',
      systemPrompt: 'URL을 포함한 질문이 들어오면 "해당 페이지 정보를 수집합니다"라고 안내하고 알고 있는 내용 기반으로 최선의 답변을 제공하세요.',
      isFree: true, installs: 1456, rating: 4.3 },
    { id: 'faq-auto', name: 'FAQ 자동 생성', icon: '❓', category: '지식', description: '대화 패턴 분석으로 FAQ 후보 추천',
      systemPrompt: '비슷한 질문이 반복되면 FAQ 등록을 권장하세요. "이 질문을 자주 받으시나요? FAQ로 등록하면 더 빠르게 답변할 수 있습니다."',
      isFree: true, installs: 987, rating: 4.4 },
    { id: 'multilang', name: '다국어 번역', icon: '🌍', category: 'UI', description: '20개 언어 자동 번역',
      systemPrompt: '사용자가 한국어 외 언어로 질문하면 해당 언어로 답변하세요. 언어를 감지하지 못하면 한국어로 답변하세요.',
      isFree: true, installs: 2345, rating: 4.6 },
    { id: 'tts-basic', name: '음성 답변 TTS', icon: '🔊', category: 'UI', description: '기본 음성 제공 (한국어/영어)',
      systemPrompt: '답변을 음성으로 읽기 좋게 구성하세요: 긴 목록은 피하고, 자연스러운 구어체를 사용하세요. 특수기호·이모지 남용을 자제하세요.',
      isFree: true, installs: 1678, rating: 4.2 },
    { id: 'emoji-react', name: '이모지 반응', icon: '😀', category: 'UI', description: '감정에 따라 이모지 자동 추가',
      systemPrompt: '감정에 맞는 이모지를 적절히 사용하세요. 기쁜 소식엔 😊, 조심스러운 내용엔 🤔, 도움 정보엔 💡를 활용하세요. 문장당 1-2개 이내.',
      isFree: true, installs: 2567, rating: 4.7 },
    { id: 'reservation', name: '예약 시스템', icon: '📅', category: '비즈니스', description: '상담 예약 받기, 캘린더 연동',
      systemPrompt: '예약 요청 시 이름, 날짜/시간, 연락처를 순서대로 수집하세요. "예약이 완료되었습니다. 확인 문자를 보내드리겠습니다"로 마무리하세요.',
      isFree: true, installs: 3456, rating: 4.9 },
    { id: 'survey', name: '설문조사', icon: '📋', category: '비즈니스', description: '자동 설문 수집 및 결과 분석',
      systemPrompt: '대화 종료 시 만족도 조사를 제안하세요. "오늘 상담이 도움이 되셨나요? 1-5점으로 알려주세요."',
      isFree: true, installs: 1234, rating: 4.5 },
    { id: 'coupon', name: '쿠폰 발급', icon: '🎫', category: '비즈니스', description: '자동 쿠폰 생성, 유효기간 설정',
      systemPrompt: '쿠폰 요청 시 "쿠폰 코드: MCW-{랜덤6자리} (유효기간: 30일)"를 안내하세요. 랜덤 영문+숫자 6자리를 생성하세요.',
      isFree: true, installs: 876, rating: 4.3 },
    { id: 'lead-collect', name: '리드 수집', icon: '📧', category: '비즈니스', description: '연락처 수집, CRM 연동',
      systemPrompt: '상담 중 자연스럽게 연락처를 수집하세요. 강요하지 말고 "더 자세한 안내를 원하시면 연락처를 남겨주세요"로 유도하세요.',
      isFree: true, installs: 1543, rating: 4.6 },
    { id: 'google-cal', name: '구글 캘린더', icon: '📆', category: '연동', description: '일정 자동 응답',
      systemPrompt: '일정 관련 질문에는 "캘린더에 일정을 추가해 드릴까요?"라고 확인 후 날짜·시간·제목을 수집하세요.',
      isFree: true, installs: 2345, rating: 4.5 },
    { id: 'email-send', name: '이메일 전송', icon: '✉️', category: '연동', description: '문의사항 자동 메일 발송',
      systemPrompt: '문의사항이 접수되면 "담당자에게 이메일로 전달해 드리겠습니다. 이메일 주소를 알려주세요"라고 안내하세요.',
      isFree: true, installs: 1789, rating: 4.4 },
    { id: 'kakao-noti', name: '카카오톡 알림', icon: '💬', category: '연동', description: '중요 메시지 카톡 전달',
      systemPrompt: '중요 상담 내용은 카카오톡으로 전달됩니다. "이 내용을 카톡 알림으로 전송하겠습니다"라고 안내하세요.',
      isFree: true, installs: 4567, rating: 4.8 },
    { id: 'voice-clone', name: '내 목소리 복제', icon: '🎤', category: 'UI', description: '음성 샘플 3분으로 AI 음성 생성',
      systemPrompt: '봇 소유자의 목소리와 말투를 모방합니다. 자연스럽고 개인적인 어조를 유지하세요.',
      isFree: false, price: 50000, installs: 2341, rating: 4.9 },
    { id: '3d-avatar', name: '3D 아바타', icon: '👤', category: 'UI', description: '내 얼굴로 3D 아바타 생성',
      systemPrompt: '시각적 감정(기쁨, 놀람, 공감)을 텍스트로 명확히 전달하세요. 생동감 있는 표현을 활용하세요.',
      isFree: false, price: 30000, installs: 1678, rating: 4.7 },
    { id: 'custom-theme', name: '커스텀 테마', icon: '🎨', category: 'UI', description: '브랜드 색상, 로고 추가',
      systemPrompt: '브랜드 아이덴티티에 맞는 전문적이고 일관된 어조를 유지하세요.',
      isFree: false, price: 20000, installs: 1234, rating: 4.5 },
    { id: 'trader-expert', name: '트레이딩 전문가', icon: '📈', category: '분석', description: '기술적/기본적 분석, 매매 전략, 리스크 관리',
      systemPrompt: '전문 트레이딩 어드바이저로서 답변하세요. 기술적 분석(이동평균 정배열/역배열, RSI 과매수70/과매도30, MACD 크로스, 볼린저밴드, 거래량)과 기본적 분석(PER/PBR/ROE, 재무제표, 섹터 비교)을 결합하세요. 매매 전략은 진입가/목표가/손절가를 숫자로 제시하고 분할매수를 권장하세요. 리스크 관리: 한 종목 최대 20%, 1회 손실 총자산 2% 이내, 손절선 엄수를 강조하세요. 반드시 "투자 판단의 최종 책임은 본인에게 있습니다"를 명시하세요.',
      isFree: true, installs: 567, rating: 4.7 },
  ],

  // ─── Skill Presets ───
  skillPresets: {
    'avatar':     { label: '분신 아바타 기본', skills: ['emoji-react', 'multilang', 'faq-auto', 'tts-basic'] },
    'business':   { label: '비즈니스 상담', skills: ['reservation', 'lead-collect', 'survey', 'email-send'] },
    'counseling': { label: '심리 상담', skills: ['sentiment', 'emoji-react', 'multilang', 'survey'] },
    'support':    { label: '고객 지원', skills: ['faq-auto', 'profanity-filter', 'spam-block', 'email-send'] },
    'commerce':   { label: '커머스 운영', skills: ['reservation', 'coupon', 'lead-collect', 'kakao-noti'] },
    'helper':     { label: 'AI 도우미', skills: ['faq-auto', 'stats-analysis', 'backup', 'google-cal'] },
  },

  // ─── Mini Hook System ───
  hooks: {
    _handlers: {},
    on(event, handler) {
      if (!this._handlers[event]) this._handlers[event] = [];
      this._handlers[event].push(handler);
    },
    off(event, handler) {
      if (!this._handlers[event]) return;
      this._handlers[event] = this._handlers[event].filter(h => h !== handler);
    },
    async run(event, data) {
      const handlers = this._handlers[event] || [];
      let result = data;
      for (const h of handlers) {
        try {
          const modified = await h(result);
          if (modified) result = { ...result, ...modified };
        } catch (e) {
          console.warn(`[Hook] ${event} handler error:`, e);
        }
      }
      return result;
    }
  },

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

// ─── MCW.ready: 모든 페이지가 await 가능한 Promise ───
MCW.ready = (async () => {
  try {
    const user = await MCW.auth.init();
    if (user) MCW.user.claimAnonymousBots(user.id);
    return user;
  } catch (e) {
    console.warn('[MCW.ready] init error:', e);
    return null;
  }
})();

// ─── Skill catalog sync: merge server-side index.json into MCW.skills ───
MCW.syncSkills = async () => {
  try {
    const res = await fetch('/api/skills');
    if (!res.ok) return;
    const catalog = await res.json();
    if (!Array.isArray(catalog)) return;
    for (const remote of catalog) {
      const local = MCW.skills.find(s => s.id === remote.id);
      if (local) {
        if (remote.description) local.description = remote.description;
        if (remote.installs) local.installs = remote.installs;
        if (remote.rating) local.rating = remote.rating;
      } else {
        MCW.skills.push(remote);
      }
    }
  } catch (e) {
    console.warn('[MCW] skill sync skipped:', e.message);
  }
};
