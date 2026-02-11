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
      return this.getUsers().find(u => u.id === id);
    },
    // Mock Verify
    verifyPassword(id, password) {
      const user = this.getUser(id);
      if (user && user.password === password) return true;
      // Backdoor for development
      if (id === 'admin' && password === '1234') return true;
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
    }
  },

  // ─── Templates (10대 타겟 직업) ───
  templates: {
    smallbiz: {
      id: 'smallbiz',
      icon: '🏪',
      name: '소상공인',
      description: '카페, 식당, 미용실, 쇼핑몰 등',
      greeting: '안녕하세요! {name}입니다 😊 메뉴, 예약, 위치 등 무엇이든 물어보세요!',
      tone: '친근하고 밝음',
      faqs: [
        { q: '메뉴/상품 안내', a: '' },
        { q: '영업 시간', a: '' },
        { q: '위치/주차', a: '' },
        { q: '예약 방법', a: '' },
        { q: '배달 가능?', a: '' },
        { q: '이벤트/할인', a: '' },
        { q: '단체 예약', a: '' },
        { q: '연락처', a: '' }
      ],
      categories: ['메뉴/상품', '예약', '위치/시간', '배달/포장'],
      recommendedSkills: ['메뉴판 표시', '예약 시스템', '배달 주문 연동']
    },
    realtor: {
      id: 'realtor',
      icon: '🏠',
      name: '부동산 중개인',
      description: '공인중개사, 분양사무소',
      greeting: '안녕하세요! {name} 공인중개사 사무소입니다. 매물이나 시세에 대해 궁금한 점을 물어보세요.',
      tone: '전문적이고 신뢰감',
      faqs: [
        { q: '현재 매물은?', a: '' },
        { q: '이 지역 시세는?', a: '' },
        { q: '매물 투어 예약', a: '' },
        { q: '대출 상담', a: '' },
        { q: '계약 절차', a: '' },
        { q: '사무소 위치', a: '' },
        { q: '수수료 안내', a: '' },
        { q: '전입신고 방법', a: '' }
      ],
      categories: ['매물 안내', '시세/분석', '계약/절차', '상담 예약'],
      recommendedSkills: ['매물 검색', '시세 분석', '예약 시스템']
    },
    lawyer: {
      id: 'lawyer',
      icon: '⚖️',
      name: '변호사',
      description: '법률사무소, 법무법인',
      greeting: '안녕하세요, {name} 변호사의 AI 법률 어시스턴트입니다. 어떤 법률 문의가 있으신가요?',
      tone: '정중하고 전문적',
      faqs: [
        { q: '상담 예약 방법', a: '' },
        { q: '전문 분야는?', a: '' },
        { q: '상담 비용은?', a: '' },
        { q: '승소 사례', a: '' },
        { q: '위치/오시는 길', a: '' },
        { q: '사건 진행 절차', a: '' },
        { q: '무료 상담 가능?', a: '' },
        { q: '연락처', a: '' }
      ],
      categories: ['상담 예약', '전문 분야', '비용/절차', '사건 문의'],
      recommendedSkills: ['상담 예약', '사건 분류', '리드 수집']
    },
    accountant: {
      id: 'accountant',
      icon: '📋',
      name: '공인회계사/세무사',
      description: '회계법인, 세무사무소',
      greeting: '안녕하세요, {name} 세무사사무소 AI 어시스턴트입니다. 세금이나 회계에 대해 궁금한 점이 있으신가요?',
      tone: '전문적이고 친절함',
      faqs: [
        { q: '종합소득세 신고', a: '' },
        { q: '부가세 신고 일정', a: '' },
        { q: '절세 방법은?', a: '' },
        { q: '기장 대행 비용', a: '' },
        { q: '법인 설립 절차', a: '' },
        { q: '상담 예약', a: '' },
        { q: '필요 서류', a: '' },
        { q: '연락처', a: '' }
      ],
      categories: ['세금 문의', '기장/신고', '상담 예약', '절세 안내'],
      recommendedSkills: ['신고 일정 알림', '상담 예약', '서류 안내']
    },
    medical: {
      id: 'medical',
      icon: '🏥',
      name: '의료인',
      description: '병원, 클리닉, 한의원, 치과',
      greeting: '안녕하세요! {name}의 AI 안내 도우미입니다. 진료 예약이나 궁금한 점을 물어보세요.',
      tone: '따뜻하고 전문적',
      faqs: [
        { q: '진료 예약', a: '' },
        { q: '진료 시간', a: '' },
        { q: '진료 과목', a: '' },
        { q: '위치/오시는 길', a: '' },
        { q: '보험 적용', a: '' },
        { q: '비용 안내', a: '' },
        { q: '검진 프로그램', a: '' },
        { q: '주차 안내', a: '' }
      ],
      categories: ['예약', '진료 안내', '보험/비용', '위치/시간'],
      recommendedSkills: ['진료 예약', '증상 사전 문진', '보험 확인']
    },
    insurance: {
      id: 'insurance',
      icon: '🛡️',
      name: '보험 설계사',
      description: '보험설계사, 금융설계사',
      greeting: '안녕하세요! {name} 설계사의 AI 어시스턴트입니다. 보험 상품이나 보장 분석이 필요하시면 물어보세요.',
      tone: '친근하고 신뢰감',
      faqs: [
        { q: '보험 추천', a: '' },
        { q: '보장 분석', a: '' },
        { q: '보험료 비교', a: '' },
        { q: '청구 방법', a: '' },
        { q: '상담 예약', a: '' },
        { q: '가입 절차', a: '' },
        { q: '해지 안내', a: '' },
        { q: '연락처', a: '' }
      ],
      categories: ['상품 안내', '보장/분석', '청구/가입', '상담 예약'],
      recommendedSkills: ['보장 분석', '상담 예약', '리드 수집']
    },
    politician: {
      id: 'politician',
      icon: '🏛️',
      name: '정치인',
      description: '국회의원, 지방의원, 시의원',
      greeting: '안녕하세요! 저는 {name} 의원의 AI 비서입니다. 무엇을 도와드릴까요?',
      tone: '정중하고 친근함',
      faqs: [
        { q: '주요 공약은?', a: '' },
        { q: '의정활동 보고서', a: '' },
        { q: '민원 제기 방법', a: '' },
        { q: '지역구 안내', a: '' },
        { q: '일정/행사', a: '' },
        { q: '연락처', a: '' },
        { q: '후원 방법', a: '' },
        { q: '공식 SNS', a: '' }
      ],
      categories: ['공약', '의정활동', '민원 안내', '일정'],
      recommendedSkills: ['공약 관리', '민원 자동 분류', '일정 안내']
    },
    instructor: {
      id: 'instructor',
      icon: '🎓',
      name: '강사/코치',
      description: '학원강사, 코치, 교육자',
      greeting: '안녕하세요! {name}의 AI 어시스턴트입니다. 강의나 코칭에 대해 궁금한 점이 있으신가요?',
      tone: '전문적이고 따뜻함',
      faqs: [
        { q: '강의/코칭 주제', a: '' },
        { q: '수강료', a: '' },
        { q: '일정/시간표', a: '' },
        { q: '수강 신청 방법', a: '' },
        { q: '1:1 코칭 가능?', a: '' },
        { q: '커리큘럼', a: '' },
        { q: '환불 규정', a: '' },
        { q: '연락처', a: '' }
      ],
      categories: ['강의/코칭', '수강 신청', '일정', '상담'],
      recommendedSkills: ['예약 시스템', '수강생 관리', '결제 연동']
    },
    freelancer: {
      id: 'freelancer',
      icon: '💻',
      name: '프리랜서',
      description: '디자이너, 개발자, 사진작가 등',
      greeting: '안녕하세요! {name}의 AI 어시스턴트입니다. 포트폴리오나 작업 문의에 대해 알려드릴게요.',
      tone: '전문적이고 친근함',
      faqs: [
        { q: '포트폴리오 보기', a: '' },
        { q: '견적 문의', a: '' },
        { q: '작업 가능 일정', a: '' },
        { q: '작업 프로세스', a: '' },
        { q: '결제 방법', a: '' },
        { q: '수정 횟수', a: '' },
        { q: '작업 기간', a: '' },
        { q: '연락처', a: '' }
      ],
      categories: ['포트폴리오', '견적', '작업 문의', '일정'],
      recommendedSkills: ['포트폴리오 갤러리', '견적 자동 산출', '일정 연동']
    },
    consultant: {
      id: 'consultant',
      icon: '💼',
      name: '컨설턴트',
      description: '경영컨설턴트, 전략자문, 전문자문',
      greeting: '안녕하세요, {name} 컨설팅의 AI 어시스턴트입니다. 컨설팅 서비스에 대해 궁금한 점을 물어보세요.',
      tone: '전문적이고 품격있음',
      faqs: [
        { q: '서비스 소개', a: '' },
        { q: '컨설팅 분야', a: '' },
        { q: '비용/견적', a: '' },
        { q: '진행 절차', a: '' },
        { q: '성공 사례', a: '' },
        { q: '상담 예약', a: '' },
        { q: '소요 기간', a: '' },
        { q: '연락처', a: '' }
      ],
      categories: ['서비스 안내', '견적', '사례', '상담 예약'],
      recommendedSkills: ['상담 예약', '리드 수집', '이메일 자동 전송']
    }
  },


  // ─── Utilities ───
  getQRCodeURL(url, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  },

  // ─── Skills Marketplace Data ───
  skills: [
    { id: 'stats-dashboard', name: '통계 대시보드', icon: '📊', category: '분석', description: '일일/주간/월간 대화 통계, 인기 질문 TOP 10', isFree: true, installs: 1234, rating: 4.8 },
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
