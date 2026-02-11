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
      const stats = JSON.parse(localStorage.getItem(`mcw_stats_${botId}`) || '{}');
      return {
        totalConversations: stats.totalConversations || 0,
        totalMessages: stats.totalMessages || 0,
        todayConversations: stats.todayConversations || 0,
        satisfaction: stats.satisfaction || 0,
        ...stats
      };
    },
    incrementStat(botId, key) {
      const stats = this.getStats(botId);
      stats[key] = (stats[key] || 0) + 1;
      localStorage.setItem(`mcw_stats_${botId}`, JSON.stringify(stats));
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
    }
  },

  // ─── Templates ───
  templates: {
    politician: {
      id: 'politician',
      icon: '🏛️',
      name: '정치인',
      description: '국회의원, 지방의원, 당대표',
      greeting: '안녕하세요! 저는 {name} 의원의 AI 비서입니다. 무엇을 도와드릴까요?',
      tone: '정중하고 친근함',
      faqs: [
        { q: '주요 공약은 무엇인가요?', a: '' },
        { q: '의정활동 보고서는 어디서 볼 수 있나요?', a: '' },
        { q: '어떻게 연락하나요?', a: '' },
        { q: '민원 제기 방법은?', a: '' },
        { q: '지역구는 어디인가요?', a: '' },
        { q: '주요 업적은?', a: '' },
        { q: '공식 SNS는?', a: '' },
        { q: '후원 방법은?', a: '' }
      ],
      categories: ['공약', '의정활동', '지역 현안', '민원 안내'],
      recommendedSkills: ['공약 관리', '의정활동 타임라인', '민원 자동 분류']
    },
    youtuber: {
      id: 'youtuber',
      icon: '🎬',
      name: '유튜버 / 크리에이터',
      description: '유튜버, 인플루언서, 크리에이터',
      greeting: '안녕! 나는 {name}의 AI 분신이야! 무엇이 궁금해? 😄',
      tone: '친근한 반말',
      faqs: [
        { q: '영상은 언제 올라와?', a: '' },
        { q: '어떤 장비 써?', a: '' },
        { q: '콜라보 가능해?', a: '' },
        { q: '비하인드 스토리는?', a: '' },
        { q: '구독 혜택은?', a: '' },
        { q: '팬미팅 계획은?', a: '' },
        { q: '영상 추천해줘', a: '' },
        { q: '어떻게 시작했어?', a: '' }
      ],
      categories: ['영상 소개', '장비/기술', '팬 소통', '콜라보'],
      recommendedSkills: ['영상 추천 엔진', '팬 랭킹 시스템', '콜라보 신청 폼']
    },
    business: {
      id: 'business',
      icon: '💼',
      name: '기업가 / CEO',
      description: 'CEO, 창업자, 프리랜서',
      greeting: '안녕하세요, {name}의 AI 어시스턴트입니다. 무엇을 도와드릴까요?',
      tone: '전문적이고 친절함',
      faqs: [
        { q: '회사 소개를 해주세요', a: '' },
        { q: '주요 서비스는?', a: '' },
        { q: '견적 문의', a: '' },
        { q: '포트폴리오는?', a: '' },
        { q: '상담 예약 방법', a: '' },
        { q: '운영 시간은?', a: '' },
        { q: '결제 방법은?', a: '' },
        { q: '연락처는?', a: '' }
      ],
      categories: ['회사 소개', '서비스', '상담/문의', '결제/환불'],
      recommendedSkills: ['예약 시스템', '결제 연동', '이메일 자동 전송']
    },
    instructor: {
      id: 'instructor',
      icon: '🎓',
      name: '강사 / 전문가',
      description: '강사, 컨설턴트, 변호사',
      greeting: '안녕하세요! {name}의 AI 어시스턴트입니다. 강의나 상담에 대해 궁금한 점이 있으신가요?',
      tone: '전문적이고 따뜻함',
      faqs: [
        { q: '강의 주제는?', a: '' },
        { q: '수강료는?', a: '' },
        { q: '강의 일정은?', a: '' },
        { q: '자격증 정보', a: '' },
        { q: '수강 신청 방법', a: '' },
        { q: '1:1 코칭 가능?', a: '' },
        { q: '환불 규정', a: '' },
        { q: '강의 자료 제공', a: '' }
      ],
      categories: ['강의 안내', '수강 신청', '코칭/상담', '자료'],
      recommendedSkills: ['예약 시스템', '결제 연동', '수강생 관리']
    },
    restaurant: {
      id: 'restaurant',
      icon: '🏪',
      name: '식당 / 카페',
      description: '식당, 카페, 쇼핑몰',
      greeting: '안녕하세요! {name}입니다 😊 메뉴, 예약, 위치 등 무엇이든 물어보세요!',
      tone: '친근하고 밝음',
      faqs: [
        { q: '메뉴판 보기', a: '' },
        { q: '영업 시간', a: '' },
        { q: '위치/주차', a: '' },
        { q: '예약 방법', a: '' },
        { q: '배달 가능?', a: '' },
        { q: '단체 예약', a: '' },
        { q: '이벤트 안내', a: '' },
        { q: '알레르기 정보', a: '' }
      ],
      categories: ['메뉴', '예약', '위치/시간', '배달/포장'],
      recommendedSkills: ['메뉴판 표시', '예약 시스템', '배달 주문 연동', '리뷰 수집']
    }
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
    return `${d.getFullYear()}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getDate().toString().padStart(2,'0')}`;
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
