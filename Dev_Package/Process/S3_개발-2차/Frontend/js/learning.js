// @task S3F8
// @task S3F14
/**
 * learning.js — Learning 페이지 전용 로직
 * My Chatbot World | S3F8, S3F14
 *
 * 담당:
 *  - Supabase Auth 사용자 로그인 상태 확인
 *  - 커리큘럼 데이터 로드 및 DOM 렌더링
 *  - 학습 진행 상태 관리 (LocalStorage + Supabase bot_growth)
 *  - school-session.js API 연동 (시나리오 기반 학습)
 *  - 수료증 발급 조건 체크
 *  - [S3F14] startModule() → 시나리오 AI 대화 연결
 *  - [S3F14] 커리큘럼 → 시나리오 매핑
 *  - [S3F14] learning-progress API Supabase 동기화
 */

/* ═══════════════════════════════════════════════
   1. 커리큘럼 데이터 (정적 정의)
   ═══════════════════════════════════════════════ */
const CURRICULUM_DATA = [
  {
    id: 'basic',
    level: 1,
    title: '기초 과정',
    titleEn: 'Basic Course',
    icon: '📘',
    desc: '인사, 자기소개, 기본 FAQ 응답 능력을 키웁니다. 챗봇의 첫 걸음을 시작하세요.',
    modules: [
      { id: 'b-01', title: '챗봇 기본 인사', desc: '자연스러운 인사말과 환영 메시지를 학습합니다.', duration: '15분', topics: ['인사', '환영', '소개'] },
      { id: 'b-02', title: '자기소개 학습', desc: '챗봇의 역할과 능력을 명확하게 소개하는 법을 배웁니다.', duration: '20분', topics: ['자기소개', '역할', '서비스'] },
      { id: 'b-03', title: '기본 FAQ 응답', desc: '자주 묻는 질문에 일관되고 정확하게 답하는 방법을 훈련합니다.', duration: '30분', topics: ['FAQ', '정확성', '일관성'] },
      { id: 'b-04', title: '대화 흐름 제어', desc: '대화가 엉키지 않도록 흐름을 유지하는 기술을 익힙니다.', duration: '25분', topics: ['흐름제어', '대화관리'] },
    ],
    requiredProgress: 0,
    xpReward: 50,
    scenarioId: 'basic-greeting',
  },
  {
    id: 'intermediate',
    level: 2,
    title: '심화 과정',
    titleEn: 'Intermediate Course',
    icon: '📗',
    desc: '까다로운 고객, 긴급 상황 등 다양한 시나리오를 게임처럼 훈련합니다.',
    modules: [
      { id: 'i-01', title: '불만 고객 응대', desc: '화가 난 고객을 침착하게 응대하는 방법을 훈련합니다.', duration: '35분', topics: ['불만처리', '감정관리'] },
      { id: 'i-02', title: '긴급 상황 대응', desc: '예약 취소, 오류 발생 등 긴급 상황 처리를 연습합니다.', duration: '30분', topics: ['긴급상황', '빠른응대'] },
      { id: 'i-03', title: '업셀링 & 크로스셀링', desc: '자연스럽게 추가 서비스를 안내하는 대화 기술을 익힙니다.', duration: '40분', topics: ['추천', '세일즈'] },
      { id: 'i-04', title: '다국어 기초 대응', desc: '영어로 기본 문의를 처리하는 방법을 학습합니다.', duration: '30분', topics: ['영어', '다국어'] },
    ],
    requiredProgress: 60,
    xpReward: 100,
    scenarioId: 'complaint-handling',
  },
  {
    id: 'advanced',
    level: 3,
    title: '실전 과정',
    titleEn: 'Advanced Course',
    icon: '📕',
    desc: '문서 업로드, 웹 크롤링으로 도메인 전문 지식을 체계적으로 축적합니다.',
    modules: [
      { id: 'a-01', title: '전문 지식 학습', desc: '업로드된 문서에서 정보를 추출하고 학습합니다.', duration: '45분', topics: ['문서학습', '지식추출'] },
      { id: 'a-02', title: '복잡한 질의 처리', desc: '여러 단계에 걸친 복합 질문에 체계적으로 답합니다.', duration: '40분', topics: ['복합질의', '구조화응답'] },
      { id: 'a-03', title: '맥락 기억 & 연속 대화', desc: '이전 대화를 기억하고 자연스럽게 이어나가는 능력을 키웁니다.', duration: '35분', topics: ['맥락', '연속대화'] },
      { id: 'a-04', title: '개인화 응대', desc: '사용자 정보를 활용한 맞춤형 응대를 학습합니다.', duration: '30분', topics: ['개인화', '사용자맞춤'] },
    ],
    requiredProgress: 80,
    xpReward: 150,
    scenarioId: 'advanced-qa',
  },
  {
    id: 'master',
    level: 4,
    title: '마스터 과정',
    titleEn: 'Master Course',
    icon: '📙',
    desc: '경험 많은 AI 전문가가 초보 챗봇을 1:1 코칭해 대화 품질을 최정상으로 끌어올립니다.',
    modules: [
      { id: 'm-01', title: 'AI 멘토링 세션 1', desc: '대화 품질 종합 점검 및 맞춤 피드백을 받습니다.', duration: '60분', topics: ['멘토링', '종합점검'] },
      { id: 'm-02', title: '엣지케이스 마스터', desc: '예외 상황과 극단적 케이스를 완벽히 처리합니다.', duration: '50분', topics: ['엣지케이스', '예외처리'] },
      { id: 'm-03', title: '브랜드 보이스 구현', desc: '일관된 브랜드 톤과 보이스를 대화에 구현합니다.', duration: '45분', topics: ['브랜드', '보이스'] },
      { id: 'm-04', title: '마스터 시험', desc: '모든 학습 내용을 종합한 최종 평가를 진행합니다.', duration: '60분', topics: ['종합평가', '최종시험'] },
    ],
    requiredProgress: 100,
    xpReward: 300,
    scenarioId: 'master-eval',
  },
];

// escapeHtml is loaded from js/utils.js

/* ═══════════════════════════════════════════════
   2. 상태 관리
   ═══════════════════════════════════════════════ */
const LearningState = {
  _key: 'mcw_learning_progress',

  /** 전체 진행 데이터를 LocalStorage에서 읽어옴 */
  get() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '{}');
    } catch {
      return {};
    }
  },

  /** 전체 진행 데이터를 LocalStorage에 씀 */
  save(data) {
    localStorage.setItem(this._key, JSON.stringify(data));
  },

  /** 특정 커리큘럼 진행률 반환 (0~100) */
  getProgress(curriculumId) {
    return this.get()[curriculumId]?.progress ?? 0;
  },

  /** 특정 커리큘럼 진행률 업데이트 */
  setProgress(curriculumId, progress) {
    const data = this.get();
    data[curriculumId] = { ...(data[curriculumId] || {}), progress, updatedAt: new Date().toISOString() };
    this.save(data);
  },

  /** 학습 히스토리 기록 */
  addHistory(entry) {
    const data = this.get();
    if (!data.history) data.history = [];
    data.history.unshift({ ...entry, timestamp: new Date().toISOString() });
    data.history = data.history.slice(0, 20); // 최근 20건만 유지
    this.save(data);
  },

  /** 학습 히스토리 반환 */
  getHistory() {
    return this.get().history ?? [];
  },

  /** 수료 가능 여부 체크 (모든 커리큘럼 100%) */
  isCertifiable() {
    const data = this.get();
    return CURRICULUM_DATA.every(c => (data[c.id]?.progress ?? 0) >= 100);
  },

  /** 전체 평균 진행률 */
  overallProgress() {
    const data = this.get();
    const total = CURRICULUM_DATA.reduce((sum, c) => sum + (data[c.id]?.progress ?? 0), 0);
    return Math.round(total / CURRICULUM_DATA.length);
  },

  /** 완료된 커리큘럼 수 */
  completedCount() {
    const data = this.get();
    return CURRICULUM_DATA.filter(c => (data[c.id]?.progress ?? 0) >= 100).length;
  },
};

/* ═══════════════════════════════════════════════
   3. Auth 유틸
   ═══════════════════════════════════════════════ */
const Auth = {
  /** Supabase 세션에서 현재 사용자 정보 반환 */
  async getCurrentUser() {
    try {
      if (typeof MCW !== 'undefined' && MCW.user) {
        const user = MCW.user.getCurrentUser();
        if (user) return user;
      }
      // Supabase 직접 조회 폴백
      if (typeof window.supabaseClient !== 'undefined') {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        return session?.user ?? null;
      }
    } catch (e) {
      console.warn('[learning] Auth.getCurrentUser error:', e.message);
    }
    return null;
  },

  /** 인증 토큰 반환 */
  async getToken() {
    try {
      if (typeof window.supabaseClient !== 'undefined') {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        return session?.access_token ?? null;
      }
    } catch {
      return null;
    }
    return null;
  },
};

/* ═══════════════════════════════════════════════
   4. school-session API 연동
   ═══════════════════════════════════════════════ */
const SchoolAPI = {
  BASE: '/api/Backend_APIs/school-session',

  /**
   * 시나리오 기반 학습 세션 메시지 전송
   * @param {Object} params - { botId, scenarioId, userMessage, currentStep }
   * @returns {Promise<Object>} API 응답 { response, sessionProgress, nextHint, model, scenarioName }
   */
  async sendMessage({ botId, scenarioId, userMessage, currentStep = 0 }) {
    const token = await Auth.getToken();
    if (!token) throw new Error('로그인이 필요합니다.');

    const res = await fetch(this.BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ botId, scenarioId, userMessage, currentStep }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `API 오류 (${res.status})`);
    }

    return res.json();
  },
};

/* ═══════════════════════════════════════════════
   4-A. 커리큘럼 → 시나리오 매핑 [S3F14]
   ═══════════════════════════════════════════════ */
const CURRICULUM_SCENARIO_MAP = {
  'basic':        ['basic-greeting'],
  'intermediate': ['complaint-handling'],
  'advanced':     ['product-inquiry', 'advanced-qa'],
  'master':       ['advanced-qa', 'master-eval'],
};

/* ═══════════════════════════════════════════════
   4-B. Learning Progress Supabase API [S3F14]
   ═══════════════════════════════════════════════ */
const ProgressAPI = {
  BASE: '/api/Backend_APIs/learning-progress',

  /**
   * 서버에서 진행률 로드
   * @param {string} botId
   * @returns {Promise<Object|null>} { progress, history, stats } or null
   */
  async load(botId) {
    if (!botId) return null;
    const token = await Auth.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${this.BASE}?botId=${encodeURIComponent(botId)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('[learning] ProgressAPI.load error:', e.message);
      return null;
    }
  },

  /**
   * 시나리오 완료 후 서버에 진행률 저장
   * @param {string} botId
   * @param {string} curriculumId
   * @param {Object} progress  e.g. { basic: 75 }
   * @param {Object} historyEntry
   * @returns {Promise<Object|null>}
   */
  async save(botId, curriculumId, progress, historyEntry) {
    if (!botId) return null;
    const token = await Auth.getToken();
    if (!token) return null;
    try {
      const res = await fetch(this.BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ botId, curriculumId, progress, historyEntry }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('[learning] ProgressAPI.save error:', e.message);
      return null;
    }
  },
};

/* ═══════════════════════════════════════════════
   4-C. 시나리오 세션 상태 [S3F14]
   ═══════════════════════════════════════════════ */
const ScenarioSession = {
  _curr: null,  // { curriculumId, moduleId, stepIndex, botId, scenarioIds, scenarioIdx, currentStep, totalSteps }

  open(curriculumId, moduleId, stepIndex, botId) {
    const scenarioIds = CURRICULUM_SCENARIO_MAP[curriculumId] || ['basic-greeting'];
    this._curr = {
      curriculumId,
      moduleId,
      stepIndex,
      botId,
      scenarioIds,
      scenarioIdx: 0,
      currentStep: 0,
      totalSteps: null,
      messages: [],
    };
  },

  get() { return this._curr; },

  close() { this._curr = null; },

  /** 현재 scenarioId 반환 */
  scenarioId() {
    const c = this._curr;
    if (!c) return null;
    return c.scenarioIds[c.scenarioIdx] || c.scenarioIds[0];
  },
};

/* ═══════════════════════════════════════════════
   5. 커리큘럼 잠금 여부 결정
   ═══════════════════════════════════════════════ */
/**
 * 해당 커리큘럼이 접근 가능한지 반환
 * — 기초는 항상 허용
 * — 이후 단계는 이전 단계 진행률이 requiredProgress 이상이어야 함
 */
function isCurriculumUnlocked(curriculum, index) {
  if (index === 0) return true;
  const prev = CURRICULUM_DATA[index - 1];
  return LearningState.getProgress(prev.id) >= curriculum.requiredProgress;
}

/* ═══════════════════════════════════════════════
   6. 렌더링 헬퍼
   ═══════════════════════════════════════════════ */

/** 프로그레스 바 HTML 조각 생성 */
function renderProgressBar(progress, label = '') {
  const complete = progress >= 100;
  return `
    <div class="progress-bar-wrap">
      <div class="progress-bar-row">
        <span class="progress-label">${label || '진행률'}</span>
        <span class="progress-pct">${progress}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill${complete ? ' complete' : ''}" style="width:${progress}%"></div>
      </div>
    </div>`;
}

/** 커리큘럼 카드 배지 HTML */
function renderCardBadge(progress, unlocked) {
  if (!unlocked) return `<span class="card-badge badge-locked">잠금</span>`;
  if (progress >= 100) return `<span class="card-badge badge-completed">완료</span>`;
  if (progress > 0) return `<span class="card-badge badge-active">학습 중</span>`;
  return `<span class="card-badge badge-upcoming">시작 전</span>`;
}

/** 히스토리 아이템 상대 시간 */
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  return `${Math.floor(hrs / 24)}일 전`;
}

/* ═══════════════════════════════════════════════
   7. index.html 초기화
   ═══════════════════════════════════════════════ */
async function initIndexPage() {
  const user = await Auth.getCurrentUser();

  // 사용자 배너
  renderUserBanner(user);

  // 요약 통계
  renderSummaryCards();

  // 커리큘럼 그리드
  renderCurriculumGrid();

  // 최근 학습 이력
  renderRecentHistory();

  // [S3F14] 서버 진행률 동기화 (비동기, UI 블로킹 없음)
  _loadProgressFromServer().catch(() => {});
}

function renderUserBanner(user) {
  const el = document.getElementById('userBanner');
  if (!el) return;
  if (!user) {
    el.style.display = 'none';
    return;
  }
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '학습자';
  const overall = LearningState.overallProgress();
  el.innerHTML = `
    <div class="user-banner-info">
      <div class="user-avatar">${escapeHtml(name[0].toUpperCase())}</div>
      <div>
        <div class="user-name">${escapeHtml(name)}</div>
        <div class="user-level">학습 Lv.${Math.floor(overall / 25) + 1}</div>
      </div>
    </div>
    <div>
      <span class="user-xp">전체 진행률 ${overall}%</span>
    </div>`;
}

function renderSummaryCards() {
  const total = CURRICULUM_DATA.length;
  const completed = LearningState.completedCount();
  const overall = LearningState.overallProgress();
  const history = LearningState.getHistory();

  const setCard = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  setCard('statCompleted', `${completed}/${total}`);
  setCard('statOverall', `${overall}%`);
  setCard('statSessions', history.length);
}

function renderCurriculumGrid() {
  const container = document.getElementById('curriculumGrid');
  if (!container) return;

  container.innerHTML = CURRICULUM_DATA.map((c, idx) => {
    const unlocked = isCurriculumUnlocked(c, idx);
    const progress = LearningState.getProgress(c.id);

    return `
      <div class="curriculum-card${progress >= 100 ? ' completed' : ''}${!unlocked ? ' locked' : ''}"
           data-id="${escapeHtml(c.id)}"
           onclick="${unlocked ? `navigateToCurriculum('${escapeHtml(c.id)}')` : 'showLockedMsg()'}">
        <div class="card-header">
          <div class="card-icon">${c.icon}</div>
          ${renderCardBadge(progress, unlocked)}
        </div>
        <div>
          <div class="card-title">${c.title}</div>
          <div class="card-subtitle">${c.titleEn}</div>
        </div>
        <p class="card-desc">${c.desc}</p>
        ${renderProgressBar(progress, '학습 진행률')}
        <div class="card-modules">
          <span>${c.modules.length}개 모듈</span>
          <span class="dot"></span>
          <span>${c.modules.reduce((s, m) => s + parseInt(m.duration) , 0)}분</span>
          <span class="dot"></span>
          <span>+${c.xpReward} XP</span>
        </div>
      </div>`;
  }).join('');
}

function renderRecentHistory() {
  const container = document.getElementById('historyList');
  if (!container) return;
  const history = LearningState.getHistory();

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📖</div>
        <div class="empty-title">아직 학습 이력이 없습니다</div>
        <div class="empty-desc">위 커리큘럼 카드를 클릭해 첫 번째 학습을 시작해보세요</div>
      </div>`;
    return;
  }

  container.innerHTML = history.slice(0, 8).map(h => `
    <div class="history-item">
      <div class="history-icon">${h.icon || '📚'}</div>
      <div class="history-content">
        <div class="history-title">${h.title || '학습 세션'}</div>
        <div class="history-meta">${h.curriculum || ''} · ${h.progress || 0}% 완료</div>
      </div>
      <div class="history-time">${relativeTime(h.timestamp)}</div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════
   8. curriculum.html 초기화
   ═══════════════════════════════════════════════ */
async function initCurriculumPage() {
  const params = new URLSearchParams(window.location.search);
  const curriculumId = params.get('id') || 'basic';
  const curriculum = CURRICULUM_DATA.find(c => c.id === curriculumId) || CURRICULUM_DATA[0];

  // 메타 렌더링
  renderCurriculumMeta(curriculum);

  // 아코디언 모듈 렌더링
  renderModuleAccordion(curriculum);

  // 전체 진행바
  renderOverallBar(curriculum);
}

function renderCurriculumMeta(curriculum) {
  const progress = LearningState.getProgress(curriculum.id);
  const el = document.getElementById('curriculumMeta');
  if (!el) return;
  el.innerHTML = `
    <div class="meta-item">
      <span class="meta-label">과정</span>
      <span class="meta-value">${curriculum.title}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">모듈 수</span>
      <span class="meta-value">${curriculum.modules.length}개</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">총 시간</span>
      <span class="meta-value">${curriculum.modules.reduce((s, m) => s + parseInt(m.duration), 0)}분</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">진행률</span>
      <span class="meta-value green">${progress}%</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">보상 XP</span>
      <span class="meta-value">+${curriculum.xpReward}</span>
    </div>`;
}

function renderModuleAccordion(curriculum) {
  const container = document.getElementById('moduleList');
  if (!container) return;

  const progress = LearningState.getProgress(curriculum.id);
  // 진행률을 기반으로 어느 모듈까지 완료됐는지 추정
  const completedModules = Math.floor((progress / 100) * curriculum.modules.length);

  container.innerHTML = curriculum.modules.map((mod, idx) => {
    const isDone = idx < completedModules;
    const isActive = idx === completedModules;
    const isLocked = idx > completedModules;

    const numClass = isDone ? 'done' : isLocked ? 'locked-num' : '';
    const dotClass = isDone ? 'dot-done' : isActive ? 'dot-active' : 'dot-locked';

    return `
      <div class="accordion-item${isDone ? ' completed-item' : ''}" id="module-${escapeHtml(mod.id)}">
        <div class="accordion-header" onclick="toggleAccordion('module-${escapeHtml(mod.id)}')">
          <div class="accordion-num ${numClass}">${isDone ? '✓' : String(idx + 1).padStart(2, '0')}</div>
          <div class="accordion-info">
            <div class="accordion-title">${mod.title}</div>
            <div class="accordion-subtitle">${isDone ? '완료' : isActive ? '학습 중' : '잠금'}</div>
          </div>
          <div class="accordion-right">
            <span class="module-time">${mod.duration}</span>
            <span class="status-dot ${dotClass}"></span>
            <span class="accordion-chevron">▼</span>
          </div>
        </div>
        <div class="accordion-body">
          <p class="accordion-desc">${mod.desc}</p>
          <div class="module-topics">
            ${mod.topics.map(t => `<span class="topic-tag">${t}</span>`).join('')}
          </div>
          <div style="display:flex; gap:.75rem;">
            ${isLocked
              ? `<button class="btn btn-secondary btn-sm" disabled>잠김 — 이전 모듈 완료 필요</button>`
              : isDone
                ? `<button class="btn btn-outline-green btn-sm" onclick="startModule('${escapeHtml(curriculum.id)}','${escapeHtml(mod.id)}',${idx})">복습하기</button>`
                : `<button class="btn btn-primary btn-sm" onclick="startModule('${escapeHtml(curriculum.id)}','${escapeHtml(mod.id)}',${idx})">학습 시작</button>`
            }
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderOverallBar(curriculum) {
  const el = document.getElementById('overallProgress');
  if (!el) return;
  const progress = LearningState.getProgress(curriculum.id);
  el.innerHTML = renderProgressBar(progress, `${curriculum.title} 전체 진행률`);
}

/* ═══════════════════════════════════════════════
   9. certificate.html 초기화
   ═══════════════════════════════════════════════ */
async function initCertPage() {
  const user = await Auth.getCurrentUser();
  const certifiable = LearningState.isCertifiable();
  const completed = LearningState.completedCount();
  const total = CURRICULUM_DATA.length;

  renderRequirements();

  if (certifiable && user) {
    renderCertificateCard(user);
  } else {
    renderCertPending(completed, total, !!user);
  }
}

function renderRequirements() {
  const container = document.getElementById('reqList');
  if (!container) return;
  container.innerHTML = CURRICULUM_DATA.map(c => {
    const progress = LearningState.getProgress(c.id);
    const done = progress >= 100;
    return `
      <div class="req-item">
        <div class="req-check ${done ? 'done' : 'pending'}">${done ? '✓' : '○'}</div>
        <span class="req-text ${done ? 'completed' : ''}">${c.title} 100% 완료 <small style="opacity:.5">(현재 ${progress}%)</small></span>
      </div>`;
  }).join('');
}

function renderCertificateCard(user) {
  const container = document.getElementById('certContent');
  if (!container) return;

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '학습자';
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  container.innerHTML = `
    <div class="cert-card">
      <div class="cert-watermark">★</div>
      <div class="cert-header">
        <div class="cert-logo">MY CHATBOT WORLD</div>
        <div class="cert-title">챗봇스쿨 수료증</div>
        <div class="cert-subtitle">Certificate of Completion — Chatbot School</div>
      </div>
      <div class="cert-body">
        <p class="cert-intro">이 증서는 다음 학습자가</p>
        <div class="cert-name">${escapeHtml(name)}</div>
        <div class="cert-course">챗봇스쿨 전 과정 (기초 · 심화 · 실전 · 마스터)</div>
        <div class="cert-detail">을 성공적으로 이수하였음을 인증합니다.</div>
      </div>
      <div class="cert-footer">
        <div class="cert-meta-item">
          <span class="cert-meta-label">발급일</span>
          <span class="cert-meta-value">${today}</span>
        </div>
        <div class="cert-meta-item">
          <span class="cert-meta-label">발급기관</span>
          <span class="cert-meta-value">My Chatbot World</span>
        </div>
        <div class="cert-meta-item">
          <span class="cert-meta-label">등급</span>
          <span class="cert-grade">Master</span>
        </div>
      </div>
    </div>
    <div class="cert-actions">
      <button class="btn btn-primary" onclick="downloadCert()">수료증 다운로드</button>
      <button class="btn btn-secondary" onclick="shareCert()">공유하기</button>
    </div>`;
}

function renderCertPending(completed, total, isLoggedIn) {
  const container = document.getElementById('certContent');
  if (!container) return;

  const reason = !isLoggedIn
    ? '수료증을 받으려면 먼저 로그인해주세요.'
    : `아직 ${total - completed}개 과정이 남았습니다. 모든 과정을 완료하면 수료증이 발급됩니다.`;

  container.innerHTML = `
    <div class="cert-pending">
      <div class="cert-pending-icon">🎓</div>
      <div class="cert-pending-title">아직 수료하지 않았습니다</div>
      <p class="cert-pending-desc">${reason}</p>
    </div>`;
}

/* ═══════════════════════════════════════════════
   10. UI 이벤트 핸들러 (전역)
   ═══════════════════════════════════════════════ */

/** 커리큘럼 페이지로 이동 */
function navigateToCurriculum(id) {
  window.location.href = `curriculum.html?id=${id}`;
}

/** 잠금 메시지 토스트 */
function showLockedMsg() {
  showToast('이전 과정을 먼저 완료해야 합니다.');
}

/** 아코디언 토글 */
function toggleAccordion(id) {
  const item = document.getElementById(id);
  if (!item) return;
  item.classList.toggle('open');
}

/** 모듈 학습 시작 — 시나리오 AI 대화 연결 [S3F14] */
async function startModule(curriculumId, moduleId, stepIndex) {
  const curriculum = CURRICULUM_DATA.find(c => c.id === curriculumId);
  if (!curriculum) return;

  const module = curriculum.modules[stepIndex];

  // 봇 ID 가져오기 (로컬스토리지 or URL 파라미터)
  const botId = _getActiveBotId();

  // 시나리오 세션 초기화
  ScenarioSession.open(curriculumId, moduleId, stepIndex, botId);

  // 모달 열기
  _openSessionModal(curriculum, module);

  // 첫 번째 시나리오 시작 메시지 (step 0 = 시나리오 소개)
  const scenarioId = ScenarioSession.scenarioId();
  _appendModalMessage('system', `시나리오: <strong>${_scenarioLabel(scenarioId)}</strong> 학습을 시작합니다. 고객이 먼저 말을 겁니다.`);

  // 시나리오 첫 step의 고객 발화를 서버에서 받아와 표시
  await _fetchAndShowAIOpening(botId, scenarioId);
}

/**
 * 첫 step: currentStep=0, userMessage='__INIT__' 로 API 호출해
 * 고객의 첫 발화(userPrompt)를 표시만 하고 사용자 응답 대기
 * [S3F14]
 */
async function _fetchAndShowAIOpening(botId, scenarioId) {
  // school-session API 호출: step 0 초기화
  // 첫 발화는 시나리오 JSON의 steps[0].userPrompt 를 직접 보여준다 (API 없이)
  // API는 userMessage(챗봇 응답)을 평가하는 구조이므로,
  // 첫 고객 발화는 시나리오 JSON 정보가 없어도 힌트에서 알려주므로
  // 더미 userMessage로 API 호출 후 nextHint로 첫 발화를 유도한다.
  const sess = ScenarioSession.get();
  if (!sess) return;

  _setModalLoading(true);
  try {
    const result = await SchoolAPI.sendMessage({
      botId: botId || 'anonymous',
      scenarioId,
      userMessage: '안녕하세요, 학습을 시작합니다.',
      currentStep: 0,
    });

    const s = ScenarioSession.get();
    if (!s) return; // 모달이 닫혔을 수 있음

    // totalSteps 기록
    s.totalSteps = result.sessionProgress?.totalSteps ?? 1;
    s.currentStep = 1; // 다음 응답부터 step 1

    // 고객 첫 발화 (AI 응답)
    _appendModalMessage('customer', result.response);

    // 힌트 표시
    if (result.nextHint) {
      _setModalHint(result.nextHint);
    }

    // 진행률 헤더 갱신
    _updateModalProgress(result.sessionProgress);

  } catch (err) {
    console.warn('[learning] _fetchAndShowAIOpening error:', err.message);
    // 폴백: 고객 첫 발화 없이 사용자 입력만 활성화
    _appendModalMessage('system', '시나리오에 연결하지 못했습니다. 자유롭게 연습해보세요.');
    const s = ScenarioSession.get();
    if (s) { s.totalSteps = 3; s.currentStep = 0; }
  } finally {
    _setModalLoading(false);
  }
}

/**
 * 사용자가 챗봇 응답을 제출했을 때 처리 [S3F14]
 */
async function submitSessionMessage() {
  const sess = ScenarioSession.get();
  if (!sess) return;

  const textarea = document.getElementById('sessionInput');
  if (!textarea) return;
  const userMessage = textarea.value.trim();
  if (!userMessage) return;

  // 입력 비우기 + 로딩
  textarea.value = '';
  _appendModalMessage('chatbot', userMessage);
  _setModalLoading(true);

  const scenarioId = ScenarioSession.scenarioId();

  try {
    const result = await SchoolAPI.sendMessage({
      botId: sess.botId || 'anonymous',
      scenarioId,
      userMessage,
      currentStep: sess.currentStep,
    });

    const s = ScenarioSession.get();
    if (!s) return;

    // totalSteps 보정
    if (result.sessionProgress?.totalSteps) {
      s.totalSteps = result.sessionProgress.totalSteps;
    }

    // AI(고객) 반응 표시
    _appendModalMessage('customer', result.response);

    // 진행률 갱신
    _updateModalProgress(result.sessionProgress);

    // step 진행
    s.currentStep = result.sessionProgress?.currentStep ?? s.currentStep + 1;

    // 힌트
    if (result.nextHint) {
      _setModalHint(result.nextHint);
    }

    // 시나리오 완료 처리
    if (result.sessionProgress?.isCompleted) {
      await _handleScenarioComplete(result);
    }

  } catch (err) {
    console.warn('[learning] submitSessionMessage error:', err.message);
    _appendModalMessage('system', `오류가 발생했습니다: ${err.message}`);
  } finally {
    _setModalLoading(false);
  }
}

/**
 * 시나리오 완료 처리 [S3F14]
 */
async function _handleScenarioComplete(result) {
  const sess = ScenarioSession.get();
  if (!sess) return;

  const curriculum = CURRICULUM_DATA.find(c => c.id === sess.curriculumId);
  if (!curriculum) return;

  // 진행률 계산
  const currentProgress = LearningState.getProgress(sess.curriculumId);
  const progressPerModule = Math.round(100 / curriculum.modules.length);
  const newProgress = Math.min(100, currentProgress + progressPerModule);

  // LocalStorage 업데이트
  LearningState.setProgress(sess.curriculumId, newProgress);

  // 히스토리 기록
  const historyEntry = {
    icon: curriculum.icon,
    title: curriculum.modules[sess.stepIndex]?.title || '모듈 학습',
    curriculum: curriculum.title,
    progress: newProgress,
    scenarioId: ScenarioSession.scenarioId(),
  };
  LearningState.addHistory(historyEntry);

  // Supabase 동기화 (비동기, 실패해도 계속)
  _syncProgressToServer(sess.botId, sess.curriculumId, newProgress, historyEntry);

  // 완료 메시지
  _appendModalMessage('system',
    `시나리오 완료! +${result.sessionProgress?.percentage ?? 0}점 달성. ` +
    `진행률: ${newProgress}%`
  );

  // XP 토스트
  showToast(`${curriculum.modules[sess.stepIndex]?.title} 완료! 진행률 ${newProgress}%`, 4000);

  // 버튼: 다음 시나리오 또는 닫기
  _showModalCompletionButtons(sess, newProgress);

  // 통계 카드 실시간 갱신
  renderSummaryCards();

  // 최근 이력 갱신
  renderRecentHistory();

  // 아코디언 갱신 (curriculum 페이지일 경우)
  setTimeout(() => renderModuleAccordion(curriculum), 500);
}

/**
 * Supabase에 진행률 동기화 [S3F14]
 */
async function _syncProgressToServer(botId, curriculumId, newProgressValue, historyEntry) {
  try {
    const progressPayload = { [curriculumId]: newProgressValue };
    const result = await ProgressAPI.save(botId, curriculumId, progressPayload, historyEntry);
    if (result) {
      console.info('[learning] progress synced to server:', result.progress);
    }
  } catch (e) {
    console.warn('[learning] _syncProgressToServer failed:', e.message);
  }
}

/**
 * 페이지 로드 시 서버 진행률을 가져와 LocalStorage와 병합 [S3F14]
 */
async function _loadProgressFromServer() {
  const botId = _getActiveBotId();
  if (!botId) return;

  const data = await ProgressAPI.load(botId);
  if (!data?.progress) return;

  // max 전략으로 병합
  const serverProgress = data.progress;
  const local = LearningState.get();

  let changed = false;
  for (const [key, val] of Object.entries(serverProgress)) {
    const localVal = local[key]?.progress ?? 0;
    if (val > localVal) {
      LearningState.setProgress(key, val);
      changed = true;
    }
  }

  if (changed) {
    console.info('[learning] progress updated from server');
    renderSummaryCards();
    renderCurriculumGrid();
    renderRecentHistory();
  }
}

/* ═══════════════════════════════════════════════
   모달 UI 헬퍼 함수 [S3F14]
   ═══════════════════════════════════════════════ */

function _getActiveBotId() {
  // URL 파라미터 > localStorage mcw_active_bot > null
  const params = new URLSearchParams(window.location.search);
  return params.get('botId') || localStorage.getItem('mcw_active_bot') || null;
}

function _scenarioLabel(scenarioId) {
  const labels = {
    'basic-greeting':     '기본 인사 학습',
    'complaint-handling': '불만 고객 응대',
    'product-inquiry':    '상품 문의 응대',
    'advanced-qa':        '심화 Q&A 응대',
    'master-eval':        '마스터 종합 평가',
  };
  return labels[scenarioId] || scenarioId;
}

function _openSessionModal(curriculum, module) {
  const modal = document.getElementById('learningSessionModal');
  if (!modal) return;

  // 헤더 초기화
  const titleEl = modal.querySelector('#modalCurriculumTitle');
  if (titleEl) titleEl.textContent = `${curriculum.title} — ${module?.title || '학습'}`;

  const progEl = modal.querySelector('#modalStepProgress');
  if (progEl) progEl.textContent = 'Step 1 / ?';

  // 메시지 영역 초기화
  const msgList = modal.querySelector('#sessionMessages');
  if (msgList) msgList.innerHTML = '';

  // 힌트 초기화
  const hintEl = modal.querySelector('#sessionHint');
  if (hintEl) hintEl.textContent = '';

  // 입력 활성화
  const inp = document.getElementById('sessionInput');
  if (inp) { inp.value = ''; inp.disabled = false; }

  const sendBtn = document.getElementById('sessionSendBtn');
  if (sendBtn) sendBtn.disabled = false;

  // 완료 버튼 숨기기
  const completionRow = modal.querySelector('#sessionCompletionRow');
  if (completionRow) completionRow.style.display = 'none';

  // 모달 표시
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeSessionModal() {
  const modal = document.getElementById('learningSessionModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  document.body.style.overflow = '';
  ScenarioSession.close();
}

function _appendModalMessage(role, text) {
  const msgList = document.getElementById('sessionMessages');
  if (!msgList) return;

  const div = document.createElement('div');
  div.className = `session-msg session-msg--${role}`;

  if (role === 'customer') {
    div.innerHTML = `<span class="msg-label">고객</span><div class="msg-bubble">${_safeHtml(text)}</div>`;
  } else if (role === 'chatbot') {
    div.innerHTML = `<div class="msg-bubble">${_safeHtml(text)}</div><span class="msg-label">챗봇(나)</span>`;
  } else {
    // system
    div.innerHTML = `<div class="msg-system">${text}</div>`;
  }

  msgList.appendChild(div);
  msgList.scrollTop = msgList.scrollHeight;
}

function _safeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _setModalLoading(isLoading) {
  const sendBtn = document.getElementById('sessionSendBtn');
  const inp = document.getElementById('sessionInput');
  if (sendBtn) sendBtn.disabled = isLoading;
  if (inp) inp.disabled = isLoading;

  const loadingEl = document.getElementById('sessionLoadingIndicator');
  if (loadingEl) loadingEl.style.display = isLoading ? 'flex' : 'none';
}

function _setModalHint(hintText) {
  const hintEl = document.getElementById('sessionHint');
  if (hintEl) hintEl.textContent = hintText;
}

function _updateModalProgress(sessionProgress) {
  if (!sessionProgress) return;
  const progEl = document.getElementById('modalStepProgress');
  if (progEl) {
    progEl.textContent = `Step ${sessionProgress.currentStep} / ${sessionProgress.totalSteps}`;
  }
  const barEl = document.getElementById('modalProgressBar');
  if (barEl) {
    barEl.style.width = `${sessionProgress.percentage ?? 0}%`;
  }
}

function _showModalCompletionButtons(sess, newProgress) {
  const completionRow = document.getElementById('sessionCompletionRow');
  if (!completionRow) return;

  // 다음 시나리오 여부 확인
  const hasNextScenario = sess.scenarioIdx + 1 < sess.scenarioIds.length;

  completionRow.innerHTML = hasNextScenario
    ? `<button class="btn btn-primary btn-sm" onclick="continueNextScenario()">다음 시나리오 계속</button>
       <button class="btn btn-secondary btn-sm" onclick="closeSessionModal()">닫기</button>`
    : `<button class="btn btn-primary btn-sm" onclick="closeSessionModal()">완료 — 닫기</button>`;

  completionRow.style.display = 'flex';

  // 입력창 비활성화
  const inp = document.getElementById('sessionInput');
  const btn = document.getElementById('sessionSendBtn');
  if (inp) inp.disabled = true;
  if (btn) btn.disabled = true;
}

/** 다음 시나리오로 이동 [S3F14] */
async function continueNextScenario() {
  const sess = ScenarioSession.get();
  if (!sess) return;

  sess.scenarioIdx += 1;
  sess.currentStep = 0;
  sess.totalSteps = null;
  sess.messages = [];

  // 완료 버튼 숨기기
  const completionRow = document.getElementById('sessionCompletionRow');
  if (completionRow) completionRow.style.display = 'none';

  // 입력창 활성화
  const inp = document.getElementById('sessionInput');
  const btn = document.getElementById('sessionSendBtn');
  if (inp) inp.disabled = false;
  if (btn) btn.disabled = false;

  const scenarioId = ScenarioSession.scenarioId();
  _appendModalMessage('system', `--- 다음 시나리오: <strong>${_scenarioLabel(scenarioId)}</strong> ---`);

  await _fetchAndShowAIOpening(sess.botId, scenarioId);
}

/** 수료증 다운로드 (간단 인쇄 구현) */
function downloadCert() {
  window.print();
}

/** 수료증 공유 */
async function shareCert() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: '챗봇스쿨 수료증',
        text: 'My Chatbot World 챗봇스쿨 전 과정을 수료했습니다!',
        url: window.location.href,
      });
    } catch {}
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast('링크가 클립보드에 복사됐습니다.');
  }
}

/** 토스트 알림 */
function showToast(message, duration = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast hidden';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), duration);
}

/* ═══════════════════════════════════════════════
   11. 전역 노출 (HTML inline onclick 대응)
   ═══════════════════════════════════════════════ */
window.LearningState = LearningState;
window.SchoolAPI = SchoolAPI;
window.ProgressAPI = ProgressAPI;
window.ScenarioSession = ScenarioSession;
window.navigateToCurriculum = navigateToCurriculum;
window.showLockedMsg = showLockedMsg;
window.toggleAccordion = toggleAccordion;
window.startModule = startModule;
window.submitSessionMessage = submitSessionMessage;
window.closeSessionModal = closeSessionModal;
window.continueNextScenario = continueNextScenario;
window.downloadCert = downloadCert;
window.shareCert = shareCert;
window.showToast = showToast;
window.initIndexPage = initIndexPage;
window.initCurriculumPage = initCurriculumPage;
window.initCertPage = initCertPage;
