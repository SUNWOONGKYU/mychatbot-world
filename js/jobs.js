/**
 * @task S3F9
 * @description 구봇구직 로직 — API 연동, 탭/카테고리/정렬/검색/페이지네이션, 카드 렌더링
 */

'use strict';

/* ============================================================
   상수 정의
   ============================================================ */
const JOBS_API = '/api/Backend_APIs/job-list'; // S3T2: .js 확장자 제거
const ITEMS_PER_PAGE = 12;
const PAGE_WINDOW = 5; // 표시할 페이지 번호 수

/** 카테고리 라벨 매핑 */
const CATEGORY_LABELS = {
  'all': '전체',
  'customer-service': '고객서비스',
  'education': '교육',
  'marketing': '마케팅',
  'development': '개발',
  'etc': '기타',
};

/** 카테고리 색상 CSS 변수 매핑 */
const CATEGORY_COLORS = {
  'customer-service': 'cat-customer',
  'education': 'cat-education',
  'marketing': 'cat-marketing',
  'development': 'cat-dev',
  'etc': 'cat-etc',
};

/* ============================================================
   상태 관리
   ============================================================ */
const state = {
  // 현재 페이지 ('index' | 'search')
  page: 'index',

  // 구봇 탭 상태
  bot: {
    items: [],
    filtered: [],
    category: 'all',
    sort: 'popular',
    currentPage: 1,
    totalPages: 1,
    loading: false,
  },

  // 일감 탭 상태
  job: {
    items: [],
    filtered: [],
    category: 'all',
    sort: 'latest',
    currentPage: 1,
    totalPages: 1,
    loading: false,
  },

  // 검색 페이지 상태
  search: {
    keyword: '',
    results: [],
    sort: 'relevance',
    currentPage: 1,
    totalPages: 1,
    loading: false,
    filters: {
      categories: [],
      priceMin: 0,
      priceMax: 500000,
      rating: 0,
      skills: [],
    },
  },

  // 활성 탭
  activeTab: 'bot',
};

/* ============================================================
   API 연동
   ============================================================ */

/**
 * 챗봇/일감 목록 API 호출
 * @param {Object} params - 필터/검색/페이지네이션 파라미터
 * @returns {Promise<Object>} - { items, total, page, totalPages }
 */
async function fetchJobList(params = {}) {
  const url = new URL(JOBS_API, window.location.origin);

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, String(val));
    }
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-cache',
  });

  if (!res.ok) {
    throw new Error(`API 오류: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * 구봇(챗봇) 목록 로드
 */
async function loadBots() {
  if (state.bot.loading) return;
  state.bot.loading = true;

  showSkeleton('botSkeleton');
  clearGrid('botGrid');

  try {
    const data = await fetchJobList({
      type: 'bot',
      category: state.bot.category !== 'all' ? state.bot.category : undefined,
      sort: state.bot.sort,
      page: state.bot.currentPage,
      limit: ITEMS_PER_PAGE,
    });

    state.bot.items = data.items || [];
    state.bot.filtered = state.bot.items;
    state.bot.totalPages = data.totalPages || 1;

    updateBadge('botCount', data.total || 0);
    updateResultCount('botResultCount', data.total || 0);
    renderBotCards(state.bot.items);
    renderPagination('bot', state.bot.currentPage, state.bot.totalPages);

  } catch (err) {
    console.error('[Jobs] loadBots 오류:', err);
    console.warn('[Jobs] API 연결 실패 — 구봇 목록을 데모 데이터로 표시합니다. (실제 서비스 데이터가 아닙니다)', err);
    showDemoNotice('bot');
    // API 실패 시 목업 데이터로 폴백
    const mockData = generateMockBots(state.bot.category, state.bot.sort);
    state.bot.items = mockData;
    state.bot.totalPages = Math.ceil(mockData.length / ITEMS_PER_PAGE);
    updateBadge('botCount', mockData.length);
    updateResultCount('botResultCount', mockData.length);
    renderBotCards(paginateItems(mockData, state.bot.currentPage));
    renderPagination('bot', state.bot.currentPage, state.bot.totalPages);

  } finally {
    state.bot.loading = false;
    hideSkeleton('botSkeleton');
  }
}

/**
 * 일감 목록 로드
 */
async function loadJobs() {
  if (state.job.loading) return;
  state.job.loading = true;

  showSkeleton('jobSkeleton');
  clearGrid('jobGrid');

  try {
    const data = await fetchJobList({
      type: 'job',
      category: state.job.category !== 'all' ? state.job.category : undefined,
      sort: state.job.sort,
      page: state.job.currentPage,
      limit: ITEMS_PER_PAGE,
    });

    state.job.items = data.items || [];
    state.job.totalPages = data.totalPages || 1;

    updateBadge('jobCount', data.total || 0);
    updateResultCount('jobResultCount', data.total || 0);
    renderJobCards(state.job.items);
    renderPagination('job', state.job.currentPage, state.job.totalPages);

  } catch (err) {
    console.error('[Jobs] loadJobs 오류:', err);
    console.warn('[Jobs] API 연결 실패 — 일감 목록을 데모 데이터로 표시합니다. (실제 서비스 데이터가 아닙니다)', err);
    showDemoNotice('job');
    const mockData = generateMockJobs(state.job.category);
    state.job.items = mockData;
    state.job.totalPages = Math.ceil(mockData.length / ITEMS_PER_PAGE);
    updateBadge('jobCount', mockData.length);
    updateResultCount('jobResultCount', mockData.length);
    renderJobCards(paginateItems(mockData, state.job.currentPage));
    renderPagination('job', state.job.currentPage, state.job.totalPages);

  } finally {
    state.job.loading = false;
    hideSkeleton('jobSkeleton');
  }
}

/**
 * 검색 API 호출
 * @param {string} keyword - 검색어
 * @param {Object} filters - 필터 파라미터
 */
async function loadSearchResults(keyword, filters = {}) {
  if (state.search.loading) return;
  state.search.loading = true;

  showSkeleton('searchSkeleton');
  clearGrid('searchResultGrid');
  hideEl('searchEmpty');
  hideEl('searchPagination');

  try {
    const params = {
      q: keyword,
      sort: state.search.sort,
      page: state.search.currentPage,
      limit: ITEMS_PER_PAGE,
    };

    if (filters.categories && filters.categories.length > 0) {
      params.categories = filters.categories.join(',');
    }
    if (filters.priceMin > 0) params.priceMin = filters.priceMin;
    if (filters.priceMax < 500000) params.priceMax = filters.priceMax;
    if (filters.rating > 0) params.minRating = filters.rating;
    if (filters.skills && filters.skills.length > 0) {
      params.skills = filters.skills.join(',');
    }

    const data = await fetchJobList(params);

    state.search.results = data.items || [];
    state.search.totalPages = data.totalPages || 1;

    updateSearchMeta(data.total || 0);
    renderSearchCards(state.search.results, keyword);
    renderPagination('search', state.search.currentPage, state.search.totalPages);

  } catch (err) {
    console.error('[Jobs] loadSearchResults 오류:', err);
    console.warn('[Jobs] API 연결 실패 — 검색 결과를 데모 데이터로 표시합니다. (실제 서비스 데이터가 아닙니다)', err);
    showDemoNotice('search');
    const mockData = generateMockSearchResults(keyword, filters);
    state.search.results = mockData;
    state.search.totalPages = Math.ceil(mockData.length / ITEMS_PER_PAGE);
    updateSearchMeta(mockData.length);
    renderSearchCards(paginateItems(mockData, state.search.currentPage), keyword);
    renderPagination('search', state.search.currentPage, state.search.totalPages);

  } finally {
    state.search.loading = false;
    hideSkeleton('searchSkeleton');
  }
}

/* ============================================================
   카드 렌더링 함수
   ============================================================ */

/**
 * 챗봇 카드 렌더링
 * @param {Array} bots - 챗봇 데이터 배열
 */
function renderBotCards(bots) {
  const grid = document.getElementById('botGrid');
  const emptyEl = document.getElementById('botEmpty');
  const pagination = document.getElementById('botPagination');

  if (!grid) return;

  // 스켈레톤 제거 후 카드 추가
  const skeletonEl = document.getElementById('botSkeleton');
  if (skeletonEl) skeletonEl.remove();

  if (!bots || bots.length === 0) {
    grid.innerHTML = '';
    showEl(emptyEl);
    hideEl(pagination);
    return;
  }

  hideEl(emptyEl);

  const fragment = document.createDocumentFragment();
  bots.forEach(bot => {
    const card = createBotCard(bot);
    fragment.appendChild(card);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);

  if (state.bot.totalPages > 1) {
    showEl(pagination);
  } else {
    hideEl(pagination);
  }
}

/**
 * 단일 챗봇 카드 DOM 요소 생성
 * @param {Object} bot - 챗봇 데이터
 * @returns {HTMLElement}
 */
function createBotCard(bot) {
  const card = document.createElement('article');
  card.className = 'jobs-card bot-card';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `${bot.name} 챗봇`);

  const catClass = CATEGORY_COLORS[bot.category] || 'cat-etc';
  const catLabel = CATEGORY_LABELS[bot.category] || bot.category;
  const stars = renderStars(bot.rating || 0);
  const price = formatPrice(bot.price);

  card.innerHTML = `
    <div class="bot-card-header">
      <div class="bot-card-avatar ${catClass}" aria-hidden="true">
        ${bot.avatarUrl
          ? `<img src="${escapeHtml(bot.avatarUrl)}" alt="${escapeHtml(bot.name)} 아바타" class="bot-avatar-img" loading="lazy">`
          : `<span class="bot-avatar-placeholder">${(bot.name || '?')[0]}</span>`
        }
      </div>
      <div class="bot-card-meta">
        <span class="bot-card-category ${catClass}" aria-label="카테고리: ${catLabel}">${catLabel}</span>
        ${bot.isNew ? '<span class="bot-card-badge badge-new">NEW</span>' : ''}
        ${bot.isFeatured ? '<span class="bot-card-badge badge-featured">추천</span>' : ''}
      </div>
    </div>

    <div class="bot-card-body">
      <h3 class="bot-card-name">${escapeHtml(bot.name || '이름 없음')}</h3>
      <p class="bot-card-desc">${escapeHtml(bot.description || '')}</p>

      <div class="bot-card-skills">
        ${(bot.skills || []).slice(0, 3).map(s =>
          `<span class="bot-skill-tag">${escapeHtml(s)}</span>`
        ).join('')}
      </div>
    </div>

    <div class="bot-card-footer">
      <div class="bot-card-rating" aria-label="평점 ${bot.rating}점">
        <span class="bot-stars" aria-hidden="true">${stars}</span>
        <span class="bot-rating-value">${(bot.rating || 0).toFixed(1)}</span>
        <span class="bot-review-count">(${formatNumber(bot.reviewCount || 0)})</span>
      </div>
      <div class="bot-card-price">
        <span class="bot-price-label">월</span>
        <span class="bot-price-value">${price}</span>
      </div>
    </div>
  `;

  // 카드 클릭 이벤트
  card.addEventListener('click', () => {
    window.location.href = `../../pages/bot/detail.html?id=${encodeURIComponent(bot.id || '')}`;
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });

  return card;
}

/**
 * 일감 카드 렌더링
 * @param {Array} jobs - 일감 데이터 배열
 */
function renderJobCards(jobs) {
  const grid = document.getElementById('jobGrid');
  const emptyEl = document.getElementById('jobEmpty');
  const pagination = document.getElementById('jobPagination');

  if (!grid) return;

  const skeletonEl = document.getElementById('jobSkeleton');
  if (skeletonEl) skeletonEl.remove();

  if (!jobs || jobs.length === 0) {
    grid.innerHTML = '';
    showEl(emptyEl);
    hideEl(pagination);
    return;
  }

  hideEl(emptyEl);

  const fragment = document.createDocumentFragment();
  jobs.forEach(job => {
    const card = createJobCard(job);
    fragment.appendChild(card);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);

  if (state.job.totalPages > 1) {
    showEl(pagination);
  } else {
    hideEl(pagination);
  }
}

/**
 * 단일 일감 카드 DOM 요소 생성
 * @param {Object} job - 일감 데이터
 * @returns {HTMLElement}
 */
function createJobCard(job) {
  const card = document.createElement('article');
  card.className = 'jobs-card job-card';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'article');

  const catClass = CATEGORY_COLORS[job.category] || 'cat-etc';
  const catLabel = CATEGORY_LABELS[job.category] || job.category;
  const daysLeft = calcDaysLeft(job.deadline);

  card.innerHTML = `
    <div class="job-card-header">
      <span class="bot-card-category ${catClass}">${catLabel}</span>
      ${daysLeft <= 3 ? '<span class="bot-card-badge badge-urgent">마감임박</span>' : ''}
    </div>
    <div class="job-card-body">
      <h3 class="bot-card-name">${escapeHtml(job.title || '제목 없음')}</h3>
      <p class="bot-card-desc">${escapeHtml(job.description || '')}</p>
      <div class="bot-card-skills">
        ${(job.requiredSkills || []).slice(0, 4).map(s =>
          `<span class="bot-skill-tag">${escapeHtml(s)}</span>`
        ).join('')}
      </div>
    </div>
    <div class="bot-card-footer">
      <div class="job-card-budget">
        예산: <strong>${formatPrice(job.budget)}</strong>
      </div>
      <div class="job-card-deadline ${daysLeft <= 3 ? 'deadline-urgent' : ''}">
        마감 D-${daysLeft >= 0 ? daysLeft : '종료'}
      </div>
    </div>
  `;

  card.addEventListener('click', () => {
    window.location.href = `../../pages/jobs/job-detail.html?id=${encodeURIComponent(job.id || '')}`;
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });

  return card;
}

/**
 * 검색 결과 카드 렌더링 (키워드 하이라이트 포함)
 * @param {Array} results - 검색 결과 배열
 * @param {string} keyword - 하이라이트할 검색어
 */
function renderSearchCards(results, keyword) {
  const grid = document.getElementById('searchResultGrid');
  const emptyEl = document.getElementById('searchEmpty');
  const pagination = document.getElementById('searchPagination');

  if (!grid) return;

  const skeletonEl = document.getElementById('searchSkeleton');
  if (skeletonEl) skeletonEl.remove();

  if (!results || results.length === 0) {
    grid.innerHTML = '';
    showEl(emptyEl);
    hideEl(pagination);

    const emptyKeywordEl = document.getElementById('emptyKeyword');
    if (emptyKeywordEl) emptyKeywordEl.textContent = keyword;
    return;
  }

  hideEl(emptyEl);

  const fragment = document.createDocumentFragment();
  results.forEach(item => {
    const card = createSearchCard(item, keyword);
    fragment.appendChild(card);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);

  if (state.search.totalPages > 1) {
    showEl(pagination);
  } else {
    hideEl(pagination);
  }
}

/**
 * 검색 결과 단일 카드 생성 (하이라이트 적용)
 * @param {Object} item - 결과 데이터
 * @param {string} keyword - 검색어
 * @returns {HTMLElement}
 */
function createSearchCard(item, keyword) {
  const card = document.createElement('article');
  card.className = 'jobs-card bot-card';
  card.setAttribute('tabindex', '0');

  const catClass = CATEGORY_COLORS[item.category] || 'cat-etc';
  const catLabel = CATEGORY_LABELS[item.category] || item.category;
  const stars = renderStars(item.rating || 0);
  const price = formatPrice(item.price);

  // 키워드 하이라이트 적용
  const highlightedName = highlightKeyword(escapeHtml(item.name || ''), keyword);
  const highlightedDesc = highlightKeyword(escapeHtml(item.description || ''), keyword);

  card.innerHTML = `
    <div class="bot-card-header">
      <div class="bot-card-avatar ${catClass}" aria-hidden="true">
        ${item.avatarUrl
          ? `<img src="${escapeHtml(item.avatarUrl)}" alt="${escapeHtml(item.name)} 아바타" class="bot-avatar-img" loading="lazy">`
          : `<span class="bot-avatar-placeholder">${(item.name || '?')[0]}</span>`
        }
      </div>
      <div class="bot-card-meta">
        <span class="bot-card-category ${catClass}">${catLabel}</span>
        ${item.isNew ? '<span class="bot-card-badge badge-new">NEW</span>' : ''}
      </div>
    </div>
    <div class="bot-card-body">
      <h3 class="bot-card-name">${highlightedName}</h3>
      <p class="bot-card-desc">${highlightedDesc}</p>
      <div class="bot-card-skills">
        ${(item.skills || []).slice(0, 3).map(s =>
          `<span class="bot-skill-tag">${highlightKeyword(escapeHtml(s), keyword)}</span>`
        ).join('')}
      </div>
    </div>
    <div class="bot-card-footer">
      <div class="bot-card-rating" aria-label="평점 ${item.rating}점">
        <span class="bot-stars" aria-hidden="true">${stars}</span>
        <span class="bot-rating-value">${(item.rating || 0).toFixed(1)}</span>
        <span class="bot-review-count">(${formatNumber(item.reviewCount || 0)})</span>
      </div>
      <div class="bot-card-price">
        <span class="bot-price-label">월</span>
        <span class="bot-price-value">${price}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => {
    window.location.href = `../../pages/bot/detail.html?id=${encodeURIComponent(item.id || '')}`;
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });

  return card;
}

/* ============================================================
   페이지네이션
   ============================================================ */

/**
 * 페이지네이션 렌더링
 * @param {string} ns - 네임스페이스 ('bot' | 'job' | 'search')
 * @param {number} current - 현재 페이지
 * @param {number} total - 총 페이지 수
 */
function renderPagination(ns, current, total) {
  const numbersEl = document.getElementById(`${ns}PageNumbers`);
  const prevBtn = document.getElementById(`${ns}PrevBtn`);
  const nextBtn = document.getElementById(`${ns}NextBtn`);
  const paginationEl = document.getElementById(`${ns}Pagination`);

  if (!numbersEl || !paginationEl) return;

  if (total <= 1) {
    hideEl(paginationEl);
    return;
  }

  showEl(paginationEl);

  // 이전/다음 버튼 상태
  prevBtn.disabled = current <= 1;
  nextBtn.disabled = current >= total;

  // 페이지 번호 계산
  const half = Math.floor(PAGE_WINDOW / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + PAGE_WINDOW - 1);
  if (end - start + 1 < PAGE_WINDOW) {
    start = Math.max(1, end - PAGE_WINDOW + 1);
  }

  const fragment = document.createDocumentFragment();

  // 첫 페이지 + 생략
  if (start > 1) {
    fragment.appendChild(createPageBtn(ns, 1, current));
    if (start > 2) {
      const dots = document.createElement('span');
      dots.className = 'jobs-page-dots';
      dots.textContent = '...';
      dots.setAttribute('aria-hidden', 'true');
      fragment.appendChild(dots);
    }
  }

  for (let i = start; i <= end; i++) {
    fragment.appendChild(createPageBtn(ns, i, current));
  }

  // 마지막 페이지 + 생략
  if (end < total) {
    if (end < total - 1) {
      const dots = document.createElement('span');
      dots.className = 'jobs-page-dots';
      dots.textContent = '...';
      dots.setAttribute('aria-hidden', 'true');
      fragment.appendChild(dots);
    }
    fragment.appendChild(createPageBtn(ns, total, current));
  }

  numbersEl.innerHTML = '';
  numbersEl.appendChild(fragment);
}

/**
 * 단일 페이지 버튼 생성
 */
function createPageBtn(ns, page, current) {
  const btn = document.createElement('button');
  btn.className = `jobs-page-num${page === current ? ' jobs-page-num--active' : ''}`;
  btn.textContent = String(page);
  btn.setAttribute('role', 'listitem');
  btn.setAttribute('aria-label', `${page}페이지${page === current ? ' (현재)' : ''}`);
  if (page === current) btn.setAttribute('aria-current', 'page');

  btn.addEventListener('click', () => goToPage(ns, page));
  return btn;
}

/**
 * 특정 페이지로 이동
 */
function goToPage(ns, page) {
  if (ns === 'bot') {
    state.bot.currentPage = page;
    loadBots();
  } else if (ns === 'job') {
    state.job.currentPage = page;
    loadJobs();
  } else if (ns === 'search') {
    state.search.currentPage = page;
    loadSearchResults(state.search.keyword, state.search.filters);
  }

  // 페이지 상단으로 스크롤
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   탭 전환
   ============================================================ */

/**
 * 탭 전환 처리
 * @param {string} tabName - 'bot' | 'job'
 */
function switchTab(tabName) {
  state.activeTab = tabName;

  document.querySelectorAll('.jobs-tab').forEach(tab => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('jobs-tab--active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  document.querySelectorAll('.jobs-panel').forEach(panel => {
    const isActive = panel.id === `panel-${tabName}`;
    panel.classList.toggle('jobs-panel--active', isActive);
    if (isActive) {
      panel.removeAttribute('hidden');
    } else {
      panel.setAttribute('hidden', '');
    }
  });

  // 데이터가 없으면 로드
  if (tabName === 'bot' && state.bot.items.length === 0) {
    loadBots();
  } else if (tabName === 'job' && state.job.items.length === 0) {
    loadJobs();
  }
}

/* ============================================================
   카테고리 필터
   ============================================================ */

/**
 * 카테고리 버튼 이벤트 바인딩
 */
function bindCategoryButtons() {
  document.querySelectorAll('.jobs-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;

      // 활성 버튼 변경
      document.querySelectorAll('.jobs-cat-btn').forEach(b => {
        b.classList.toggle('jobs-cat-btn--active', b === btn);
      });

      // 상태 업데이트 및 재로드
      if (state.activeTab === 'bot') {
        state.bot.category = category;
        state.bot.currentPage = 1;
        loadBots();
      } else {
        state.job.category = category;
        state.job.currentPage = 1;
        loadJobs();
      }
    });
  });
}

/* ============================================================
   정렬 변경
   ============================================================ */

/**
 * 정렬 select 이벤트 바인딩
 */
function bindSortSelects() {
  const botSort = document.getElementById('botSort');
  const jobSort = document.getElementById('jobSort');
  const searchSort = document.getElementById('searchSort');

  if (botSort) {
    botSort.addEventListener('change', () => {
      state.bot.sort = botSort.value;
      state.bot.currentPage = 1;
      loadBots();
    });
  }

  if (jobSort) {
    jobSort.addEventListener('change', () => {
      state.job.sort = jobSort.value;
      state.job.currentPage = 1;
      loadJobs();
    });
  }

  if (searchSort) {
    searchSort.addEventListener('change', () => {
      state.search.sort = searchSort.value;
      state.search.currentPage = 1;
      loadSearchResults(state.search.keyword, state.search.filters);
    });
  }
}

/* ============================================================
   검색 — 메인 페이지에서 search.html로 이동
   ============================================================ */

/**
 * 검색 폼 이벤트 바인딩 (index 페이지)
 */
function bindSearchForm() {
  const form = document.getElementById('mainSearchForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const keyword = (document.getElementById('mainSearchInput')?.value || '').trim();
    if (!keyword) return;

    const params = new URLSearchParams({ q: keyword });
    window.location.href = `search.html?${params.toString()}`;
  });
}

/**
 * 검색 결과 페이지 — URL 파라미터 파싱 및 초기 로드
 */
function initSearchPage() {
  const params = new URLSearchParams(window.location.search);
  const keyword = params.get('q') || '';
  state.search.keyword = keyword;

  // 검색어 표시
  const keywordEl = document.getElementById('searchKeyword');
  const searchInput = document.getElementById('searchPageInput');
  if (keywordEl) keywordEl.textContent = keyword;
  if (searchInput) searchInput.value = keyword;

  // 검색 폼 재검색 이벤트
  const searchForm = document.getElementById('searchPageForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newKeyword = (document.getElementById('searchPageInput')?.value || '').trim();
      if (!newKeyword) return;
      const newParams = new URLSearchParams({ q: newKeyword });
      window.location.href = `search.html?${newParams.toString()}`;
    });
  }

  // 필터 바인딩
  bindSearchFilters();

  // 초기 검색 실행
  if (keyword) {
    loadSearchResults(keyword, state.search.filters);
  }
}

/* ============================================================
   검색 페이지 — 필터 사이드바 로직
   ============================================================ */

/**
 * 검색 필터 이벤트 바인딩
 */
function bindSearchFilters() {
  // 모바일 필터 토글
  const filterToggle = document.getElementById('filterToggle');
  const filterPanel = document.getElementById('filterPanel');
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', () => {
      const expanded = filterToggle.getAttribute('aria-expanded') === 'true';
      filterToggle.setAttribute('aria-expanded', String(!expanded));
      filterPanel.classList.toggle('filter-panel--open', !expanded);
    });
  }

  // 가격 범위 슬라이더
  const priceMin = document.getElementById('priceMin');
  const priceMax = document.getElementById('priceMax');
  const priceMinInput = document.getElementById('priceMinInput');
  const priceMaxInput = document.getElementById('priceMaxInput');
  const priceDisplay = document.getElementById('priceDisplay');

  function updatePriceDisplay() {
    const min = parseInt(priceMin?.value || '0');
    const max = parseInt(priceMax?.value || '500000');
    if (priceDisplay) {
      priceDisplay.textContent = `${formatPrice(min)} — ${formatPrice(max)}`;
    }
    if (priceMinInput) priceMinInput.value = String(min);
    if (priceMaxInput) priceMaxInput.value = String(max);
    state.search.filters.priceMin = min;
    state.search.filters.priceMax = max;
  }

  if (priceMin) priceMin.addEventListener('input', updatePriceDisplay);
  if (priceMax) priceMax.addEventListener('input', updatePriceDisplay);
  if (priceMinInput) {
    priceMinInput.addEventListener('change', () => {
      if (priceMin) priceMin.value = priceMinInput.value;
      updatePriceDisplay();
    });
  }
  if (priceMaxInput) {
    priceMaxInput.addEventListener('change', () => {
      if (priceMax) priceMax.value = priceMaxInput.value;
      updatePriceDisplay();
    });
  }

  // 카테고리 체크박스
  document.querySelectorAll('input[name="category"]').forEach(cb => {
    cb.addEventListener('change', collectAndApplyFilters);
  });

  // 평점 라디오
  document.querySelectorAll('input[name="rating"]').forEach(rb => {
    rb.addEventListener('change', collectAndApplyFilters);
  });

  // 스킬 체크박스
  document.querySelectorAll('input[name="skill"]').forEach(cb => {
    cb.addEventListener('change', collectAndApplyFilters);
  });

  // 필터 초기화 버튼
  const resetBtn = document.getElementById('filterResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetFilters);

  // 필터 적용 버튼 (모바일)
  const applyBtn = document.getElementById('filterApplyBtn');
  if (applyBtn) applyBtn.addEventListener('click', collectAndApplyFilters);

  // 검색 빈 상태 초기화 버튼
  const searchResetBtn = document.getElementById('searchResetFiltersBtn');
  if (searchResetBtn) searchResetBtn.addEventListener('click', resetFilters);
}

/**
 * 필터 값 수집 후 검색 적용
 */
function collectAndApplyFilters() {
  const categories = Array.from(
    document.querySelectorAll('input[name="category"]:checked')
  )
    .map(cb => cb.value)
    .filter(v => v !== 'all');

  const ratingEl = document.querySelector('input[name="rating"]:checked');
  const rating = ratingEl ? parseFloat(ratingEl.value) : 0;

  const skills = Array.from(
    document.querySelectorAll('input[name="skill"]:checked')
  ).map(cb => cb.value);

  const priceMin = parseInt(document.getElementById('priceMin')?.value || '0');
  const priceMax = parseInt(document.getElementById('priceMax')?.value || '500000');

  state.search.filters = { categories, rating, skills, priceMin, priceMax };
  state.search.currentPage = 1;

  updateActiveFilterBadge();
  renderActiveFilterTags();
  loadSearchResults(state.search.keyword, state.search.filters);
}

/**
 * 필터 초기화
 */
function resetFilters() {
  document.querySelectorAll('input[name="category"]').forEach((cb, i) => {
    cb.checked = i === 0; // 첫 번째 (all) 선택
  });
  const firstRating = document.querySelector('input[name="rating"]');
  if (firstRating) firstRating.checked = true;
  document.querySelectorAll('input[name="skill"]').forEach(cb => { cb.checked = false; });

  const priceMin = document.getElementById('priceMin');
  const priceMax = document.getElementById('priceMax');
  if (priceMin) priceMin.value = '0';
  if (priceMax) priceMax.value = '500000';

  state.search.filters = { categories: [], rating: 0, skills: [], priceMin: 0, priceMax: 500000 };
  state.search.currentPage = 1;

  updateActiveFilterBadge();
  renderActiveFilterTags();
  loadSearchResults(state.search.keyword, state.search.filters);
}

/**
 * 활성 필터 배지 업데이트
 */
function updateActiveFilterBadge() {
  const badge = document.getElementById('filterActiveBadge');
  if (!badge) return;
  const f = state.search.filters;
  const count = (f.categories?.length || 0) + (f.skills?.length || 0) +
    (f.rating > 0 ? 1 : 0) +
    (f.priceMin > 0 || f.priceMax < 500000 ? 1 : 0);

  if (count > 0) {
    badge.textContent = String(count);
    showEl(badge);
  } else {
    hideEl(badge);
  }
}

/**
 * 활성 필터 태그 렌더링
 */
function renderActiveFilterTags() {
  const container = document.getElementById('activeFilters');
  if (!container) return;

  const tags = [];
  const f = state.search.filters;

  f.categories?.forEach(cat => {
    tags.push({ label: CATEGORY_LABELS[cat] || cat, key: 'category', value: cat });
  });
  if (f.rating > 0) {
    tags.push({ label: `평점 ${f.rating}+`, key: 'rating', value: f.rating });
  }
  if (f.priceMin > 0 || f.priceMax < 500000) {
    tags.push({ label: `${formatPrice(f.priceMin)}~${formatPrice(f.priceMax)}`, key: 'price', value: null });
  }
  f.skills?.forEach(skill => {
    tags.push({ label: skill, key: 'skill', value: skill });
  });

  container.innerHTML = tags.map(tag => `
    <span class="active-filter-tag">
      ${escapeHtml(tag.label)}
      <button class="active-filter-remove" data-key="${escapeHtml(tag.key)}" data-value="${escapeHtml(String(tag.value || ''))}" aria-label="${escapeHtml(tag.label)} 필터 제거">x</button>
    </span>
  `).join('');

  // 태그 제거 버튼 이벤트
  container.querySelectorAll('.active-filter-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const value = btn.dataset.value;
      removeFilter(key, value);
    });
  });
}

/**
 * 개별 필터 제거
 */
function removeFilter(key, value) {
  const f = state.search.filters;
  if (key === 'category') {
    f.categories = f.categories.filter(c => c !== value);
    const cb = document.querySelector(`input[name="category"][value="${value}"]`);
    if (cb) cb.checked = false;
  } else if (key === 'rating') {
    f.rating = 0;
    const rb = document.querySelector('input[name="rating"][value="0"]');
    if (rb) rb.checked = true;
  } else if (key === 'price') {
    f.priceMin = 0;
    f.priceMax = 500000;
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    if (priceMin) priceMin.value = '0';
    if (priceMax) priceMax.value = '500000';
  } else if (key === 'skill') {
    f.skills = f.skills.filter(s => s !== value);
    const cb = document.querySelector(`input[name="skill"][value="${value}"]`);
    if (cb) cb.checked = false;
  }

  state.search.currentPage = 1;
  updateActiveFilterBadge();
  renderActiveFilterTags();
  loadSearchResults(state.search.keyword, f);
}

/* ============================================================
   페이지네이션 버튼 이벤트 바인딩
   ============================================================ */

function bindPaginationButtons() {
  // Bot
  const botPrev = document.getElementById('botPrevBtn');
  const botNext = document.getElementById('botNextBtn');
  if (botPrev) botPrev.addEventListener('click', () => {
    if (state.bot.currentPage > 1) goToPage('bot', state.bot.currentPage - 1);
  });
  if (botNext) botNext.addEventListener('click', () => {
    if (state.bot.currentPage < state.bot.totalPages) goToPage('bot', state.bot.currentPage + 1);
  });

  // Job
  const jobPrev = document.getElementById('jobPrevBtn');
  const jobNext = document.getElementById('jobNextBtn');
  if (jobPrev) jobPrev.addEventListener('click', () => {
    if (state.job.currentPage > 1) goToPage('job', state.job.currentPage - 1);
  });
  if (jobNext) jobNext.addEventListener('click', () => {
    if (state.job.currentPage < state.job.totalPages) goToPage('job', state.job.currentPage + 1);
  });

  // Search
  const searchPrev = document.getElementById('searchPrevBtn');
  const searchNext = document.getElementById('searchNextBtn');
  if (searchPrev) searchPrev.addEventListener('click', () => {
    if (state.search.currentPage > 1) goToPage('search', state.search.currentPage - 1);
  });
  if (searchNext) searchNext.addEventListener('click', () => {
    if (state.search.currentPage < state.search.totalPages) goToPage('search', state.search.currentPage + 1);
  });

  // 빈 상태 초기화 버튼
  const botResetBtn = document.getElementById('botResetBtn');
  if (botResetBtn) botResetBtn.addEventListener('click', () => {
    state.bot.category = 'all';
    state.bot.currentPage = 1;
    document.querySelectorAll('.jobs-cat-btn').forEach((btn, i) => {
      btn.classList.toggle('jobs-cat-btn--active', i === 0);
    });
    loadBots();
  });

  const jobResetBtn = document.getElementById('jobResetBtn');
  if (jobResetBtn) jobResetBtn.addEventListener('click', () => {
    state.job.category = 'all';
    state.job.currentPage = 1;
    loadJobs();
  });
}

/* ============================================================
   탭 이벤트 바인딩
   ============================================================ */

function bindTabs() {
  document.querySelectorAll('.jobs-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });
}

/* ============================================================
   유틸리티 함수
   ============================================================ */

// escapeHtml is loaded from js/utils.js

/** 키워드 하이라이트 */
function highlightKeyword(text, keyword) {
  if (!keyword || !text) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/** 별점 렌더링 (채워진 별 / 빈 별) */
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(empty);
}

/** 가격 포맷 */
function formatPrice(price) {
  if (price === 0 || price === '0') return '무료';
  if (!price) return '협의';
  const num = typeof price === 'string' ? parseInt(price.replace(/,/g, '')) : price;
  if (isNaN(num)) return String(price);
  return `₩${num.toLocaleString('ko-KR')}`;
}

/** 숫자 포맷 */
function formatNumber(num) {
  if (!num) return '0';
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
}

/** 마감일까지 남은 일수 계산 */
function calcDaysLeft(deadline) {
  if (!deadline) return 99;
  const diff = new Date(deadline) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** 아이템 배열 페이지네이션 슬라이스 */
function paginateItems(items, page) {
  const start = (page - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
}

/** 결과 수 업데이트 */
function updateResultCount(elId, count) {
  const el = document.getElementById(elId);
  if (el) el.textContent = String(count);
}

/** 배지 업데이트 */
function updateBadge(elId, count) {
  const el = document.getElementById(elId);
  if (el) el.textContent = String(count);
}

/** 검색 메타 업데이트 */
function updateSearchMeta(total) {
  const totalEl = document.getElementById('searchResultTotal');
  if (totalEl) totalEl.textContent = String(total);
}

/** 스켈레톤 표시 */
function showSkeleton(id) {
  const el = document.getElementById(id);
  if (el) el.removeAttribute('hidden');
}

/** 스켈레톤 숨김 */
function hideSkeleton(id) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('hidden', '');
}

/** 그리드 초기화 */
function clearGrid(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '';
}

/**
 * API 실패 시 데모 데이터 사용 중임을 사용자에게 알리는 배너를 표시합니다.
 * @param {'bot'|'job'|'search'} context — 어느 탭/섹션에서 폴백이 발생했는지
 */
function showDemoNotice(context) {
  // 이미 배너가 있으면 중복 추가하지 않음
  const existingId = 'demoBanner-' + context;
  if (document.getElementById(existingId)) return;

  const contextLabels = { bot: '구봇 목록', job: '일감 목록', search: '검색 결과' };
  const label = contextLabels[context] || '데이터';

  const banner = document.createElement('div');
  banner.id = existingId;
  banner.setAttribute('role', 'status');
  banner.style.cssText = [
    'display:flex', 'align-items:center', 'gap:0.5rem',
    'padding:0.6rem 1rem', 'margin-bottom:1rem',
    'background:rgba(234,179,8,0.12)', 'border:1px solid rgba(234,179,8,0.35)',
    'border-radius:8px', 'font-size:0.825rem', 'color:#fbbf24',
  ].join(';');

  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '\u26A0\uFE0F'; // ⚠️ (literal unicode, no raw emoji)

  const msg = document.createElement('span');
  msg.textContent = label + ' — 서버에 연결할 수 없어 샘플 데이터를 표시 중입니다. (실제 데이터가 아닙니다)';

  banner.appendChild(icon);
  banner.appendChild(msg);

  // 탭별 그리드 컨테이너 앞에 삽입
  const gridIds = { bot: 'botGrid', job: 'jobGrid', search: 'searchGrid' };
  const grid = document.getElementById(gridIds[context]);
  if (grid && grid.parentNode) {
    grid.parentNode.insertBefore(banner, grid);
  }
}

/** 요소 표시 */
function showEl(el) {
  if (!el) return;
  if (typeof el === 'string') el = document.getElementById(el);
  if (el) el.removeAttribute('hidden');
}

/** 요소 숨김 */
function hideEl(el) {
  if (!el) return;
  if (typeof el === 'string') el = document.getElementById(el);
  if (el) el.setAttribute('hidden', '');
}

/** 토스트 메시지 표시 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('jobsToast');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  showEl(toast);
  setTimeout(() => hideEl(toast), duration);
}

/* ============================================================
   목업 데이터 생성 (API 실패 시 폴백)
   ============================================================ */

function generateMockBots(category = 'all', sort = 'popular') {
  const allBots = [
    { id: 'b1', name: '고객응대 도우미', category: 'customer-service', description: '24시간 고객 문의를 자동으로 처리하는 스마트 챗봇입니다.', rating: 4.8, reviewCount: 1234, price: 29000, skills: ['NLP', '다국어', 'API연동'], isNew: false, isFeatured: true },
    { id: 'b2', name: '영어 튜터봇', category: 'education', description: '개인 맞춤형 영어 학습 플랜을 제공하는 AI 튜터입니다.', rating: 4.6, reviewCount: 892, price: 19000, skills: ['교육', '언어학습', '퀴즈'], isNew: true, isFeatured: false },
    { id: 'b3', name: '마케팅 어시스턴트', category: 'marketing', description: 'SNS 콘텐츠와 광고 문구를 자동으로 생성해드립니다.', rating: 4.5, reviewCount: 567, price: 49000, skills: ['콘텐츠생성', 'SNS', '카피라이팅'], isNew: false, isFeatured: false },
    { id: 'b4', name: '코딩 도우미', category: 'development', description: '코드 리뷰, 디버깅, 문서화를 도와드립니다.', rating: 4.9, reviewCount: 2341, price: 39000, skills: ['코드리뷰', '디버깅', 'Git'], isNew: false, isFeatured: true },
    { id: 'b5', name: '예약 관리 봇', category: 'customer-service', description: '식당, 미용실, 병원 예약을 자동으로 관리합니다.', rating: 4.3, reviewCount: 456, price: 15000, skills: ['예약', '알림', '캘린더'], isNew: true, isFeatured: false },
    { id: 'b6', name: '수학 튜터봇', category: 'education', description: '초등부터 대학 수준까지 수학 문제를 단계별로 풀어드립니다.', rating: 4.7, reviewCount: 789, price: 25000, skills: ['수학', '단계별설명', '문제생성'], isNew: false, isFeatured: false },
    { id: 'b7', name: '이메일 작성 봇', category: 'marketing', description: '상황에 맞는 이메일 템플릿을 즉시 생성합니다.', rating: 4.2, reviewCount: 321, price: 9000, skills: ['이메일', '템플릿', '번역'], isNew: false, isFeatured: false },
    { id: 'b8', name: '회의록 작성봇', category: 'etc', description: '음성/텍스트 회의 내용을 정리하고 요약합니다.', rating: 4.4, reviewCount: 678, price: 35000, skills: ['요약', '음성인식', '일정관리'], isNew: true, isFeatured: false },
    { id: 'b9', name: 'HR 어시스턴트', category: 'etc', description: '채용 공고 작성부터 면접 질문 생성까지 HR 업무를 지원합니다.', rating: 4.1, reviewCount: 234, price: 0, skills: ['채용', '면접', '평가'], isNew: false, isFeatured: false },
  ];

  let filtered = category === 'all' ? allBots : allBots.filter(b => b.category === category);

  if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === 'latest') filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  else if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
  else filtered.sort((a, b) => b.reviewCount - a.reviewCount);

  return filtered;
}

function generateMockJobs(category = 'all') {
  const allJobs = [
    { id: 'j1', title: '쇼핑몰 고객응대 챗봇 개발', category: 'customer-service', description: '온라인 쇼핑몰의 FAQs, 반품/교환 처리를 자동화할 챗봇이 필요합니다.', budget: 500000, requiredSkills: ['NLP', 'Shopify연동', 'FAQ처리'], deadline: new Date(Date.now() + 7 * 86400000).toISOString() },
    { id: 'j2', title: '영어회화 학습 AI 개발', category: 'education', description: '초등학생 대상 영어 회화 연습 챗봇입니다. 발음 교정 기능 포함.', budget: 800000, requiredSkills: ['음성인식', '발음교정', '게이미피케이션'], deadline: new Date(Date.now() + 14 * 86400000).toISOString() },
    { id: 'j3', title: 'SNS 마케팅 봇 제작', category: 'marketing', description: '인스타그램/트위터에 자동으로 콘텐츠를 생성하고 포스팅하는 봇.', budget: 300000, requiredSkills: ['SNS API', '콘텐츠생성', '스케줄링'], deadline: new Date(Date.now() + 3 * 86400000).toISOString() },
  ];

  return category === 'all' ? allJobs : allJobs.filter(j => j.category === category);
}

function generateMockSearchResults(keyword, filters = {}) {
  const all = generateMockBots('all');
  if (!keyword) return all;

  return all.filter(item => {
    const kw = keyword.toLowerCase();
    const matchKeyword =
      item.name.toLowerCase().includes(kw) ||
      item.description.toLowerCase().includes(kw) ||
      (item.skills || []).some(s => s.toLowerCase().includes(kw));

    const matchCategory = !filters.categories?.length ||
      filters.categories.includes(item.category);
    const matchRating = !filters.rating || item.rating >= filters.rating;
    const matchPrice = item.price >= (filters.priceMin || 0) &&
      item.price <= (filters.priceMax || 500000);

    return matchKeyword && matchCategory && matchRating && matchPrice;
  });
}

/* ============================================================
   진입점 — JobsApp 공개 API
   ============================================================ */

/**
 * @public
 * JobsApp 초기화 — HTML 페이지에서 호출
 * @param {Object} config - { page: 'index' | 'search' }
 */
const JobsApp = {
  init({ page = 'index' } = {}) {
    state.page = page;

    if (page === 'index') {
      bindTabs();
      bindCategoryButtons();
      bindSortSelects();
      bindSearchForm();
      bindPaginationButtons();
      loadBots(); // 기본 탭(구봇) 데이터 로드
    } else if (page === 'search') {
      bindSortSelects();
      bindPaginationButtons();
      initSearchPage();
    }
  },
};

// 전역 노출 (HTML의 인라인 스크립트에서 접근)
window.JobsApp = JobsApp;

// S3T2: 정합성 수정 — JOBS_API .js 확장자 제거, hero 검색폼/카드 클릭 연결 확인 완료
