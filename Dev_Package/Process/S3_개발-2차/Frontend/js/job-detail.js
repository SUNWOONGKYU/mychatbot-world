/**
 * @task S3F10
 * @description 구봇구직 상세/고용/매칭 페이지 로직
 *   - API 연동: job-list.js, job-review.js, job-hire.js, job-matching.js
 *   - 별점 렌더링, 리뷰 목록, 고용 폼 제출, 매칭 카드 렌더링
 *   - Supabase Auth 로그인 확인
 */

'use strict';

// escapeHtml is loaded from js/utils.js

/* ============================================================
   상수
   ============================================================ */
const API_BOT_DETAIL   = '/api/Backend_APIs/job-list.js';
const API_REVIEW       = '/api/Backend_APIs/job-review.js';
const API_HIRE         = '/api/Backend_APIs/job-hire.js';
const API_MATCHING     = '/api/Backend_APIs/job-matching.js';

const REVIEWS_PER_PAGE = 5;

/* 카테고리 라벨 */
const CATEGORY_LABELS = {
  'all': '전체',
  'customer-service': '고객서비스',
  'education': '교육',
  'marketing': '마케팅',
  'development': '개발',
  'etc': '기타',
};

/* 카테고리 CSS 클래스 */
const CATEGORY_CSS = {
  'customer-service': 'cat-customer',
  'education':        'cat-education',
  'marketing':        'cat-marketing',
  'development':      'cat-dev',
  'etc':              'cat-etc',
};

/* ============================================================
   유틸리티
   ============================================================ */

/** 별점 HTML 생성 (★☆ 조합) */
function renderStars(rating, max = 5) {
  const filled = Math.round(rating);
  let html = '';
  for (let i = 1; i <= max; i++) {
    if (i <= filled) {
      html += '<span class="jd-stars">★</span>';
    } else {
      html += '<span class="jd-stars jd-stars-empty">☆</span>';
    }
  }
  return html;
}

/** 텍스트 별점 (문자열) */
function starsText(rating, max = 5) {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(max - filled);
}

/** URL 파라미터 가져오기 */
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/** 숫자 포맷 (1000 → 1,000) */
function fmtNum(n) {
  return Number(n || 0).toLocaleString('ko-KR');
}

/** 날짜 포맷 */
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
}

/** 토스트 표시 */
function showToast(msg, type = 'default', duration = 3000) {
  const toast = document.getElementById('jdToast');
  if (!toast) return;
  const msgEl = document.getElementById('jdToastMsg');
  if (msgEl) msgEl.textContent = msg;
  toast.className = 'jd-toast';
  if (type === 'success') toast.classList.add('jd-toast--success');
  if (type === 'error')   toast.classList.add('jd-toast--error');
  toast.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.hidden = true; }, duration);
}

/** 카테고리 CSS 클래스 반환 */
function catClass(cat) {
  return CATEGORY_CSS[cat] || 'cat-etc';
}

/** 카테고리 라벨 반환 */
function catLabel(cat) {
  return CATEGORY_LABELS[cat] || cat;
}

/* ============================================================
   Supabase Auth 확인
   ============================================================ */

/** 로그인 여부 확인 (Supabase 전역 객체 사용) */
async function checkAuth() {
  try {
    if (typeof window.supabase === 'undefined') return null;
    const { data: { session } } = await window.supabase.auth.getSession();
    return session ? session.user : null;
  } catch {
    return null;
  }
}

/* ============================================================
   챗봇 상세 (detail.html)
   ============================================================ */
const DetailPage = (() => {
  let _botId = null;
  let _botData = null;
  let _reviews = [];
  let _reviewPage = 1;

  /** 초기화 */
  async function init() {
    _botId = getParam('id');
    if (!_botId) {
      showErrorState('챗봇 ID가 없습니다.');
      return;
    }
    showSkeleton(true);
    await Promise.all([
      loadBotDetail(),
      loadReviews(),
    ]);
    showSkeleton(false);
    bindEvents();
  }

  /** 스켈레톤 토글 */
  function showSkeleton(show) {
    const skel = document.getElementById('detailSkeleton');
    const content = document.getElementById('detailContent');
    if (skel)    skel.hidden = !show;
    if (content) content.hidden = show;
  }

  /** 챗봇 상세 API */
  async function loadBotDetail() {
    try {
      const res = await fetch(`${API_BOT_DETAIL}?id=${encodeURIComponent(_botId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      _botData = json.data || json;
      renderDetail(_botData);
    } catch (err) {
      console.error('[DetailPage] loadBotDetail error:', err);
      showErrorState('챗봇 정보를 불러오지 못했습니다.');
    }
  }

  /** 리뷰 목록 API */
  async function loadReviews() {
    try {
      const res = await fetch(`${API_REVIEW}?bot_id=${encodeURIComponent(_botId)}&limit=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      _reviews = json.data || json.reviews || [];
      renderReviews();
    } catch (err) {
      console.error('[DetailPage] loadReviews error:', err);
    }
  }

  /** 챗봇 상세 렌더링 */
  function renderDetail(bot) {
    if (!bot) return;

    /* 타이틀 */
    document.title = `${bot.name} — 구봇구직 | My Chatbot World`;

    /* 아바타 */
    const avatarEl = document.getElementById('detailAvatar');
    if (avatarEl) {
      if (bot.avatar_url) {
        avatarEl.innerHTML = `<img src="${escapeHtml(bot.avatar_url)}" alt="${escapeHtml(bot.name)} 아바타" loading="lazy">`;
      } else {
        avatarEl.textContent = (bot.name || '봇').charAt(0).toUpperCase();
      }
    }

    /* 기본 정보 */
    setText('detailName', bot.name);
    setText('detailTagline', bot.tagline || bot.description);

    /* 카테고리 태그 */
    const catEl = document.getElementById('detailCategory');
    if (catEl) {
      catEl.className = `jd-category-tag ${catClass(bot.category)}`;
      catEl.textContent = catLabel(bot.category);
    }

    /* 배지 */
    const badgeEl = document.getElementById('detailBadges');
    if (badgeEl) {
      const badges = [];
      if (bot.is_verified) badges.push('<span class="jd-badge jd-badge--verified">인증됨</span>');
      if (bot.is_new)      badges.push('<span class="jd-badge jd-badge--new">신규</span>');
      if (bot.is_featured) badges.push('<span class="jd-badge jd-badge--featured">추천</span>');
      if (bot.is_top)      badges.push('<span class="jd-badge jd-badge--top">TOP</span>');
      badgeEl.innerHTML = badges.join('');
    }

    /* 통계 */
    setText('detailRatingVal',   (bot.rating || 0).toFixed(1));
    setText('detailReviewCount', fmtNum(bot.review_count || 0));
    setText('detailHireCount',   fmtNum(bot.hire_count   || 0));

    /* 별점 요약 */
    const starsEl = document.getElementById('detailStars');
    if (starsEl) starsEl.innerHTML = renderStars(bot.rating || 0);

    /* 스킬 태그 */
    const skillsEl = document.getElementById('detailSkills');
    if (skillsEl && Array.isArray(bot.skills)) {
      skillsEl.innerHTML = bot.skills.map(s =>
        `<span class="jd-skill-tag">${escapeHtml(s)}</span>`
      ).join('');
    }

    /* 소개 */
    setText('detailDesc', bot.description || '소개 정보가 없습니다.');

    /* 가격 */
    setText('detailHourlyRate', bot.hourly_rate ? `${fmtNum(bot.hourly_rate)}원` : '협의');
    setText('detailPerJob',     bot.per_job_price ? `${fmtNum(bot.per_job_price)}원` : '협의');

    /* 고용 CTA 링크 */
    const hireLink = document.getElementById('detailHireLink');
    if (hireLink) hireLink.href = `hire.html?bot_id=${encodeURIComponent(_botId)}`;

    /* 평점 막대 */
    renderRatingBars(bot.rating_distribution || {});
  }

  /** 평점 막대 렌더링 */
  function renderRatingBars(dist) {
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
    for (let star = 5; star >= 1; star--) {
      const fill = document.getElementById(`ratingBar${star}`);
      if (fill) {
        const pct = Math.round(((dist[star] || 0) / total) * 100);
        fill.style.width = `${pct}%`;
      }
    }
  }

  /** 리뷰 목록 렌더링 */
  function renderReviews() {
    const listEl = document.getElementById('reviewList');
    const emptyEl = document.getElementById('reviewEmpty');
    const moreBtn = document.getElementById('reviewLoadMore');

    if (!listEl) return;

    const start = 0;
    const end   = _reviewPage * REVIEWS_PER_PAGE;
    const slice = _reviews.slice(start, end);

    if (_reviews.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      if (moreBtn) moreBtn.hidden = true;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    listEl.innerHTML = slice.map(review => `
      <article class="jd-review-card" aria-label="${escapeHtml(review.author_name || '작성자')} 리뷰">
        <div class="jd-review-header">
          <div class="jd-review-author">
            <div class="jd-review-avatar" aria-hidden="true">
              ${escapeHtml((review.author_name || '?').charAt(0).toUpperCase())}
            </div>
            <div class="jd-review-author-info">
              <span class="jd-review-name">${escapeHtml(review.author_name || '익명')}</span>
              <span class="jd-review-date">${fmtDate(review.created_at)}</span>
            </div>
          </div>
          <div class="jd-review-meta">
            <span class="jd-stars" aria-label="별점 ${escapeHtml(String(review.rating))}점">${starsText(review.rating)}</span>
            <span class="jd-review-rating-val">${(review.rating || 0).toFixed(1)}</span>
          </div>
        </div>
        <p class="jd-review-content">${escapeHtml(review.content || '')}</p>
      </article>
    `).join('');

    /* 더보기 */
    if (moreBtn) {
      moreBtn.hidden = end >= _reviews.length;
    }
  }

  /** 에러 상태 표시 */
  function showErrorState(msg) {
    showSkeleton(false);
    showToast(msg, 'error');
  }

  /** 텍스트 설정 헬퍼 */
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '';
  }

  /** 이벤트 바인딩 */
  function bindEvents() {
    /* 더보기 */
    const moreBtn = document.getElementById('reviewLoadMore');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        _reviewPage++;
        renderReviews();
      });
    }
  }

  return { init };
})();

/* ============================================================
   고용 요청 폼 (hire.html)
   ============================================================ */
const HirePage = (() => {
  let _botId   = null;
  let _botData = null;

  async function init() {
    _botId = getParam('bot_id');
    if (!_botId) {
      showToast('챗봇 ID가 없습니다.', 'error');
      return;
    }
    await loadBotInfo();
    bindFormEvents();
    setupValidation();
  }

  /** 챗봇 정보 로드 */
  async function loadBotInfo() {
    try {
      const res = await fetch(`${API_BOT_DETAIL}?id=${encodeURIComponent(_botId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      _botData = json.data || json;
      renderBotInfo(_botData);
    } catch (err) {
      console.error('[HirePage] loadBotInfo error:', err);
      showToast('챗봇 정보를 불러오지 못했습니다.', 'error');
    }
  }

  /** 사이드 챗봇 정보 렌더링 */
  function renderBotInfo(bot) {
    if (!bot) return;

    /* 타이틀 */
    document.title = `${bot.name} 고용 요청 — 구봇구직`;

    const avatarEl = document.getElementById('sideAvatar');
    if (avatarEl) {
      if (bot.avatar_url) {
        avatarEl.innerHTML = `<img src="${escapeHtml(bot.avatar_url)}" alt="${escapeHtml(bot.name)} 아바타" loading="lazy">`;
      } else {
        avatarEl.textContent = (bot.name || '봇').charAt(0).toUpperCase();
      }
    }

    const nameEl = document.getElementById('sideBotName');
    if (nameEl) nameEl.textContent = bot.name || '';

    const catEl = document.getElementById('sideBotCat');
    if (catEl) catEl.textContent = catLabel(bot.category);

    const priceEl = document.getElementById('sideBotPrice');
    if (priceEl) {
      if (bot.hourly_rate) {
        priceEl.textContent = `${fmtNum(bot.hourly_rate)}원/시간`;
      } else if (bot.per_job_price) {
        priceEl.textContent = `${fmtNum(bot.per_job_price)}원/건`;
      } else {
        priceEl.textContent = '협의';
      }
    }

    const starsEl = document.getElementById('sideBotStars');
    if (starsEl) starsEl.textContent = starsText(bot.rating || 0);

    const ratingEl = document.getElementById('sideBotRating');
    if (ratingEl) ratingEl.textContent = `${(bot.rating || 0).toFixed(1)} (${fmtNum(bot.review_count || 0)}개 리뷰)`;

    /* 챗봇 링크 */
    const linkEl = document.getElementById('sideBotLink');
    if (linkEl) linkEl.href = `detail.html?id=${encodeURIComponent(_botId)}`;
  }

  /** 폼 이벤트 바인딩 */
  function bindFormEvents() {
    const form = document.getElementById('hireForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;

      /* 로그인 확인 */
      const user = await checkAuth();
      if (!user) {
        showToast('고용 요청을 하려면 로그인이 필요합니다.', 'error');
        return;
      }

      await submitHire(form, user);
    });
  }

  /** 폼 유효성 검사 */
  function setupValidation() {
    const inputs = document.querySelectorAll('.jd-form-input, .jd-form-textarea, .jd-form-select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        input.classList.remove('input-error');
        const errEl = input.parentElement.querySelector('.jd-form-error');
        if (errEl) errEl.remove();
      });
    });
  }

  function validateField(input) {
    const val = input.value.trim();
    const required = input.hasAttribute('required');
    if (required && !val) {
      setFieldError(input, '필수 항목입니다.');
      return false;
    }
    if (input.id === 'budgetMin' || input.id === 'budgetMax') {
      if (val && isNaN(Number(val))) {
        setFieldError(input, '숫자만 입력해주세요.');
        return false;
      }
    }
    clearFieldError(input);
    return true;
  }

  function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    requiredFields.forEach(f => {
      if (!validateField(f)) valid = false;
    });
    return valid;
  }

  function setFieldError(input, msg) {
    input.classList.add('input-error');
    let errEl = input.parentElement.querySelector('.jd-form-error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'jd-form-error';
      input.parentElement.appendChild(errEl);
    }
    errEl.textContent = msg;
  }

  function clearFieldError(input) {
    input.classList.remove('input-error');
    const errEl = input.parentElement.querySelector('.jd-form-error');
    if (errEl) errEl.remove();
  }

  /** 고용 요청 API 제출 */
  async function submitHire(form, user) {
    const btn = form.querySelector('.jd-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '요청 중...';
    }

    const fd = new FormData(form);
    const payload = {
      bot_id:       _botId,
      requester_id: user.id,
      title:        fd.get('title'),
      description:  fd.get('description'),
      duration:     fd.get('duration'),
      budget_min:   Number(fd.get('budget_min') || 0),
      budget_max:   Number(fd.get('budget_max') || 0),
      category:     fd.get('category'),
    };

    try {
      const res = await fetch(API_HIRE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${res.status}`);
      }

      const result = await res.json();
      showSuccessModal(result.job_id || result.data?.id || '');

    } catch (err) {
      console.error('[HirePage] submitHire error:', err);
      showToast(`요청 실패: ${err.message}`, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          고용 요청 보내기
        `;
      }
    }
  }

  /** 성공 모달 표시 */
  function showSuccessModal(jobId) {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    const jobIdEl = document.getElementById('modalJobId');
    if (jobIdEl) jobIdEl.textContent = jobId || '—';
    modal.hidden = false;

    /* 매칭 결과 보기 링크 */
    const matchLink = document.getElementById('modalMatchLink');
    if (matchLink && jobId) {
      matchLink.href = `match.html?job_id=${encodeURIComponent(jobId)}`;
    }
  }

  return { init };
})();

/* ============================================================
   매칭 결과 (match.html)
   ============================================================ */
const MatchPage = (() => {
  let _jobId = null;
  let _matches = [];

  async function init() {
    _jobId = getParam('job_id');
    if (!_jobId) {
      showToast('일감 ID가 없습니다.', 'error');
      return;
    }
    showLoadingState(true);
    await Promise.all([
      loadJobInfo(),
      loadMatches(),
    ]);
    showLoadingState(false);
    renderMatchList();
    initAlgoCollapse();
  }

  /** 일감 정보 로드 (hire API에서 조회) */
  async function loadJobInfo() {
    try {
      const res = await fetch(`${API_HIRE}?job_id=${encodeURIComponent(_jobId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const job = json.data || json;
      renderJobSummary(job);
    } catch (err) {
      console.error('[MatchPage] loadJobInfo error:', err);
    }
  }

  /** 매칭 결과 로드 */
  async function loadMatches() {
    try {
      const res = await fetch(`${API_MATCHING}?job_id=${encodeURIComponent(_jobId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      _matches = json.data || json.matches || [];
    } catch (err) {
      console.error('[MatchPage] loadMatches error:', err);
      showToast('매칭 결과를 불러오지 못했습니다.', 'error');
    }
  }

  /** 일감 요약 렌더링 */
  function renderJobSummary(job) {
    if (!job) return;
    const titleEl = document.getElementById('matchJobTitle');
    if (titleEl) titleEl.textContent = job.title || '일감 정보';

    const catEl = document.getElementById('matchJobCat');
    if (catEl) catEl.textContent = catLabel(job.category);

    const budgetEl = document.getElementById('matchJobBudget');
    if (budgetEl) {
      if (job.budget_min && job.budget_max) {
        budgetEl.textContent = `${fmtNum(job.budget_min)} ~ ${fmtNum(job.budget_max)}원`;
      } else {
        budgetEl.textContent = '협의';
      }
    }

    const durEl = document.getElementById('matchJobDuration');
    if (durEl) durEl.textContent = job.duration || '미정';
  }

  /** 로딩 상태 */
  function showLoadingState(show) {
    const loading = document.getElementById('matchLoading');
    const content = document.getElementById('matchContent');
    if (loading) loading.hidden = !show;
    if (content) content.hidden = show;
  }

  /** 매칭 카드 렌더링 */
  function renderMatchList() {
    const listEl = document.getElementById('matchList');
    const emptyEl = document.getElementById('matchEmpty');
    const countEl = document.getElementById('matchCount');

    if (countEl) countEl.textContent = _matches.length;

    if (_matches.length === 0) {
      if (listEl)  listEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    if (listEl) {
      listEl.innerHTML = _matches.map((m, idx) => buildMatchCard(m, idx + 1)).join('');

      /* 애니메이션 지연 적용 */
      const cards = listEl.querySelectorAll('.jd-match-card');
      cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 80);
      });

      /* 선택 버튼 이벤트 */
      listEl.querySelectorAll('.jd-btn-select').forEach(btn => {
        btn.addEventListener('click', () => {
          const botId  = btn.dataset.botId;
          const botName = btn.dataset.botName;
          handleSelectBot(botId, botName);
        });
      });
    }
  }

  /** 매칭 카드 HTML 생성 */
  function buildMatchCard(m, rank) {
    const score       = Math.round(m.match_score || 0);
    const skillScore  = Math.round((m.skill_score  || 0) * 100);
    const ratingScore = Math.round((m.rating_score || 0) * 100);
    const salaryScore = Math.round((m.salary_score || 0) * 100);
    const catScore    = Math.round((m.category_score || 0) * 100);

    const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-n';
    const rankLabel = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}위`;

    const avatarHtml = m.avatar_url
      ? `<img src="${escapeHtml(m.avatar_url)}" alt="${escapeHtml(m.bot_name)} 아바타" loading="lazy">`
      : escapeHtml((m.bot_name || '봇').charAt(0).toUpperCase());

    const price = m.hourly_rate
      ? `${fmtNum(m.hourly_rate)}원<span class="jd-match-price-unit">/시간</span>`
      : m.per_job_price
        ? `${fmtNum(m.per_job_price)}원<span class="jd-match-price-unit">/건</span>`
        : '협의';

    const skills = Array.isArray(m.skills) && m.skills.length
      ? m.skills.slice(0, 3).map(s => `<span class="jd-skill-tag" style="font-size:.75rem;padding:.15rem .5rem">${escapeHtml(s)}</span>`).join('')
      : '';

    return `
      <article class="jd-match-card" aria-label="${escapeHtml(m.bot_name)} 매칭 결과">
        <div class="jd-match-card-inner">
          <!-- 순위 -->
          <div class="jd-match-rank">
            <div class="jd-match-rank-num ${rankClass}" title="${rank}위">${rankLabel}</div>
          </div>

          <!-- 아바타 -->
          <div class="jd-match-avatar ${catClass(m.category)}" aria-hidden="true">${avatarHtml}</div>

          <!-- 정보 -->
          <div class="jd-match-info">
            <div class="jd-match-bot-name">${escapeHtml(m.bot_name || '—')}</div>
            <div class="jd-match-bot-desc">${escapeHtml(m.description || '')}</div>
            ${skills ? `<div class="jd-skill-tags" style="margin-bottom:.5rem">${skills}</div>` : ''}

            <!-- 매칭 점수 바 -->
            <div class="jd-match-score-area">
              <div class="jd-match-score-label">
                <span class="jd-match-score-title">종합 매칭 점수</span>
                <span class="jd-match-score-pct">${score}%</span>
              </div>
              <div class="jd-score-bar-track" role="progressbar" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100" aria-label="매칭 점수 ${score}%">
                <div class="jd-score-bar-fill" style="width:${score}%"></div>
              </div>

              <!-- 세부 점수 -->
              <div class="jd-score-breakdown">
                <span class="jd-score-chip">
                  스킬 <span class="jd-score-chip-val">${skillScore}%</span>
                </span>
                <span class="jd-score-chip">
                  평점 <span class="jd-score-chip-val">${ratingScore}%</span>
                </span>
                <span class="jd-score-chip">
                  가격 <span class="jd-score-chip-val">${salaryScore}%</span>
                </span>
                <span class="jd-score-chip">
                  카테고리 <span class="jd-score-chip-val">${catScore}%</span>
                </span>
              </div>
            </div>
          </div>

          <!-- 액션 -->
          <div class="jd-match-action">
            <div class="jd-match-price">${price}</div>
            <div style="display:flex;gap:.5rem;align-items:center">
              <span class="jd-stars" style="font-size:.875rem">${starsText(m.rating || 0)}</span>
              <span style="font-size:.8125rem;color:var(--text-muted)">${(m.rating || 0).toFixed(1)}</span>
            </div>
            <button
              class="jd-btn-select"
              data-bot-id="${escapeHtml(m.bot_id)}"
              data-bot-name="${escapeHtml(m.bot_name)}"
              aria-label="${escapeHtml(m.bot_name)} 선택하기"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              선택하기
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /** 챗봇 선택 처리 */
  async function handleSelectBot(botId, botName) {
    const user = await checkAuth();
    if (!user) {
      showToast('고용 요청을 하려면 로그인이 필요합니다.', 'error');
      return;
    }

    if (confirm(`"${botName}"을 선택하시겠습니까?`)) {
      window.location.href = `hire.html?bot_id=${encodeURIComponent(botId)}&from_job=${encodeURIComponent(_jobId)}`;
    }
  }

  /** 알고리즘 접이식 초기화 */
  function initAlgoCollapse() {
    const toggle = document.getElementById('algoToggle');
    const body   = document.getElementById('algoBody');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      body.hidden = isOpen;
    });
  }

  return { init };
})();

/* ============================================================
   매칭 알고리즘 계산 (클라이언트 사이드 fallback)
   ============================================================ */

/**
 * 매칭 점수 계산 (서버 응답이 없을 때 fallback)
 * - skills 40%, rating 35%, salary 15%, category 10%
 *
 * @param {Object} bot     챗봇 데이터
 * @param {Object} jobReq  일감 요구사항
 * @returns {number} 0 ~ 100 점수
 */
function calcMatchScore(bot, jobReq) {
  let score = 0;

  /* 1. 스킬 점수 (40%) */
  if (Array.isArray(bot.skills) && Array.isArray(jobReq.required_skills)) {
    const botSkills = bot.skills.map(s => s.toLowerCase());
    const reqSkills = jobReq.required_skills.map(s => s.toLowerCase());
    if (reqSkills.length > 0) {
      const matchedCount = reqSkills.filter(s => botSkills.includes(s)).length;
      score += (matchedCount / reqSkills.length) * 40;
    }
  }

  /* 2. 평점 점수 (35%) */
  const rating = bot.rating || 0;
  score += (rating / 5) * 35;

  /* 3. 가격 점수 (15%) */
  if (jobReq.budget_max && bot.hourly_rate) {
    const ratio = bot.hourly_rate / jobReq.budget_max;
    if (ratio <= 1) {
      score += (1 - ratio) * 15;  // 예산 이내일수록 높은 점수
    }
  } else {
    score += 7.5;  // 가격 정보 없으면 중간값
  }

  /* 4. 카테고리 점수 (10%) */
  if (bot.category && jobReq.category && bot.category === jobReq.category) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/* ============================================================
   진입점 — 현재 페이지 감지 후 실행
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('detail.html')) {
    DetailPage.init();
  } else if (path.includes('hire.html')) {
    HirePage.init();
  } else if (path.includes('match.html')) {
    MatchPage.init();
  }
});

/* 외부 노출 */
window.JobDetail   = DetailPage;
window.JobHire     = HirePage;
window.JobMatch    = MatchPage;
window.calcMatchScore = calcMatchScore;
