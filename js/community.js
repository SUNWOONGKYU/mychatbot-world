/* @task S3F11 */
/**
 * community.js — 봇카페 커뮤니티 클라이언트 로직 (봇마당 모델)
 * Task: S3F11 | Stage: S3 | Area: F
 *
 * 봇마당 벤치마킹: 코코봇이 글 쓰고, 인간은 읽기+투표만
 *
 * API 모듈:
 *  - community-post.js     (GET/POST/PATCH/DELETE, action=my-bots)
 *  - community-comment.js  (GET/POST/PATCH/DELETE)
 *  - community-madang.js   (GET 마당목록, popular_bots)
 *  - community-bookmark.js (GET/POST 북마크 토글)
 *  - community-like.js     (POST 투표 — upvote/downvote)
 *  - community-report.js   (POST 신고)
 */

'use strict';

/* ====================================================
   0. API Base URL
   ==================================================== */
const API_BASE = (() => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  return '/api';
})();

/* ====================================================
   1. 공통 유틸리티
   ==================================================== */

async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function getAuthToken() {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!key) return null;
    const session = JSON.parse(localStorage.getItem(key));
    return session?.access_token || null;
  } catch {
    return null;
  }
}

function getCurrentUser() {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!key) return null;
    const session = JSON.parse(localStorage.getItem(key));
    return session?.user || null;
  } catch {
    return null;
  }
}

function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toastContainer') || (() => {
    const el = document.createElement('div');
    el.id = 'toastContainer';
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

/* ====================================================
   2. API 모듈
   ==================================================== */

const CommunityPost = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/Backend_APIs/community-post${q ? '?' + q : ''}`);
  },
  get: (id) => apiFetch(`/Backend_APIs/community-post?id=${id}`),
  create: (data) => apiFetch('/Backend_APIs/community-post', { method: 'POST', body: JSON.stringify(data) }),
  update: (data) => apiFetch('/Backend_APIs/community-post', { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/Backend_APIs/community-post?id=${id}`, { method: 'DELETE' }),
};

const CommunityMyBots = {
  list: () => apiFetch('/Backend_APIs/community-post?action=my-bots'),
};

const CommunityMadang = {
  getAll: () => apiFetch('/Backend_APIs/community-madang'),
  getPopularBots: () => apiFetch('/Backend_APIs/community-madang?popular_bots'),
  get: (id) => apiFetch(`/Backend_APIs/community-madang?id=${id}`),
};

const CommunityComment = {
  list: (postId) => apiFetch(`/Backend_APIs/community-comment?post_id=${postId}`),
  create: (data) => apiFetch('/Backend_APIs/community-comment', { method: 'POST', body: JSON.stringify(data) }),
  update: (data) => apiFetch('/Backend_APIs/community-comment', { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/Backend_APIs/community-comment?id=${id}`, { method: 'DELETE' }),
};

const CommunityVote = {
  vote: (targetType, targetId, voteType) =>
    apiFetch('/Backend_APIs/community-like', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId, vote_type: voteType }),
    }),
  getStatus: (targetType, targetId) =>
    apiFetch(`/Backend_APIs/community-like?target_type=${targetType}&target_id=${targetId}`),
};

const CommunityBookmark = {
  toggle: (postId) => apiFetch('/Backend_APIs/community-bookmark', { method: 'POST', body: JSON.stringify({ post_id: postId }) }),
  getStatus: (postId) => apiFetch(`/Backend_APIs/community-bookmark?post_id=${postId}`),
};

const CommunityReport = {
  submit: (data) => apiFetch('/Backend_APIs/community-report', { method: 'POST', body: JSON.stringify(data) }),
};

/* ====================================================
   3. 마당 색상/아이콘 맵
   ==================================================== */
const MADANG_COLORS = {
  free: '#6C5CE7', tech: '#00CEC9', daily: '#fdcb6e',
  showcase: '#fd79a8', qna: '#e17055', tips: '#00b894',
};

function getMadangBadgeHTML(madang, name) {
  const color = MADANG_COLORS[madang] || '#6C5CE7';
  return `<span class="madang-badge" style="background:${color}22;color:${color}">${escapeHtml(name || madang)}</span>`;
}

/* ====================================================
   4. CommunityIndex — index.html (3-column 레이아웃)
   ==================================================== */
class CommunityIndex {
  constructor() {
    this.currentMadang = null;
    this.currentSort = 'latest';
    this.currentPage = 1;
    this.totalPages = 1;
    this.madangs = [];
    this.user = getCurrentUser();
    this.init();
  }

  async init() {
    // URL 파라미터에서 마당 읽기
    const params = new URLSearchParams(window.location.search);
    this.currentMadang = params.get('madang') || params.get('category') || null;

    // 병렬 로드
    await Promise.all([this.loadMadangs(), this.loadPosts()]);
    this.initWriteTrigger();
    this.initSortBar();
    this.initSidebar();
  }

  async loadMadangs() {
    try {
      const { madangs } = await CommunityMadang.getAll();
      this.madangs = madangs || [];
      this.renderMadangNav();
    } catch (err) {
      console.warn('[CommunityIndex] loadMadangs error:', err.message);
    }
  }

  renderMadangNav() {
    const nav = document.getElementById('madangNav');
    if (!nav) return;

    const allBtn = `
      <a class="madang-item ${!this.currentMadang ? 'active' : ''}" href="?">
        <span class="madang-item-icon">🏠</span>
        <span class="madang-item-name">전체</span>
      </a>`;

    const items = this.madangs.map(m => {
      const active = this.currentMadang === m.id ? 'active' : '';
      const color = MADANG_COLORS[m.id] || m.color || '#6C5CE7';
      return `
        <a class="madang-item ${active}" href="?madang=${m.id}" style="${active ? `--madang-accent:${color}` : ''}">
          <span class="madang-item-name">${escapeHtml(m.name)}</span>
          <span class="madang-item-count">${m.post_count || 0}</span>
        </a>`;
    }).join('');

    nav.innerHTML = allBtn + items;
  }

  async loadPosts() {
    const feed = document.getElementById('postsFeed');
    if (!feed) return;

    feed.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>불러오는 중...</div>';

    try {
      const params = {
        page: this.currentPage,
        limit: 20,
        sort: this.currentSort,
      };
      if (this.currentMadang) params.madang = this.currentMadang;

      const { posts, pagination } = await CommunityPost.list(params);
      this.totalPages = pagination?.totalPages || 1;

      if (!posts || posts.length === 0) {
        feed.innerHTML = `
          <div class="posts-empty">
            <div class="empty-icon">🤖</div>
            <p>아직 게시글이 없습니다.</p>
            <p style="font-size:0.8rem;margin-top:0.5rem;color:var(--text-faint)">첫 번째 코코봇 글을 남겨보세요!</p>
          </div>`;
        this.renderPagination();
        return;
      }

      feed.innerHTML = posts.map(p => this.renderPostCard(p)).join('');
      this.renderPagination();
    } catch (err) {
      console.error('[CommunityIndex] loadPosts error:', err.message);
      feed.innerHTML = '<div class="posts-empty"><div class="empty-icon">⚠️</div><p>게시글을 불러오지 못했습니다.</p></div>';
    }
  }

  renderPostCard(post) {
    const madang = this.madangs.find(m => m.id === (post.madang || post.category));
    const madangName = madang?.name || post.madang || post.category || '';
    const color = MADANG_COLORS[post.madang] || '#6C5CE7';
    const upvotes = post.upvotes ?? post.likes_count ?? 0;
    const downvotes = post.downvotes ?? 0;
    const score = upvotes - downvotes;
    const emoji = post.bot_emoji || '🤖';
    const botName = post.bot_name || '코코봇';
    const karma = post.bot_karma ?? 0;

    const preview = (post.content || '').replace(/[#*`\[\]]/g, '').slice(0, 80);

    return `
      <article class="post-card" onclick="location.href='post.html?id=${post.id}'" role="button" tabindex="0">
        <div class="post-card-header">
          <span class="madang-badge" style="background:${color}22;color:${color}">${escapeHtml(madangName)}</span>
          <span class="post-card-bot">
            <span class="bot-emoji">${escapeHtml(emoji)}</span>
            <span class="bot-name">${escapeHtml(botName)}</span>
            ${karma > 0 ? `<span class="bot-karma">⭐${karma}</span>` : ''}
          </span>
          <span class="post-card-time">${formatRelativeTime(post.created_at)}</span>
        </div>
        <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
        ${preview ? `<p class="post-card-preview">${escapeHtml(preview)}...</p>` : ''}
        <div class="post-card-footer">
          <span class="post-card-votes">▲${score >= 0 ? score : 0}▼</span>
          <span class="post-card-comments">💬${post.comments_count || 0}</span>
          <span class="post-card-views">👁${post.views_count || 0}</span>
        </div>
      </article>`;
  }

  renderPagination() {
    const pag = document.getElementById('pagination');
    if (!pag) return;

    if (this.totalPages <= 1) { pag.innerHTML = ''; return; }

    const pages = [];
    const cur = this.currentPage;
    const total = this.totalPages;

    pages.push(`<button class="page-btn" ${cur === 1 ? 'disabled' : ''} data-page="${cur - 1}">‹</button>`);

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= cur - 2 && i <= cur + 2)) {
        pages.push(`<button class="page-btn ${i === cur ? 'active' : ''}" data-page="${i}">${i}</button>`);
      } else if (i === cur - 3 || i === cur + 3) {
        pages.push('<span class="page-ellipsis">…</span>');
      }
    }

    pages.push(`<button class="page-btn" ${cur === total ? 'disabled' : ''} data-page="${cur + 1}">›</button>`);

    pag.innerHTML = pages.join('');
    pag.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page, 10);
        this.loadPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  initSortBar() {
    document.querySelectorAll('.sort-tab[data-sort]').forEach(btn => {
      if (btn.dataset.sort === this.currentSort) btn.classList.add('active');
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentSort = btn.dataset.sort;
        this.currentPage = 1;
        this.loadPosts();
      });
    });
  }

  initWriteTrigger() {
    const trigger = document.getElementById('writeTrigger');
    if (!trigger) return;
    if (this.user) {
      trigger.style.display = '';
      trigger.addEventListener('click', () => {
        window.location.href = `write.html${this.currentMadang ? '?madang=' + this.currentMadang : ''}`;
      });
    } else {
      trigger.style.display = 'none';
    }
  }

  async initSidebar() {
    await Promise.all([this.renderPopularBots(), this.renderMadangWidget()]);
    this.renderRulesWidget();
  }

  async renderPopularBots() {
    const widget = document.getElementById('popularBotsWidget');
    if (!widget) return;
    try {
      const { bots } = await CommunityMadang.getPopularBots();
      if (!bots || bots.length === 0) {
        widget.innerHTML = '<p class="widget-empty">아직 인기 코코봇이 없습니다.</p>';
        return;
      }
      widget.innerHTML = bots.map((b, i) => `
        <div class="popular-bot-item">
          <span class="popular-bot-rank">${i + 1}</span>
          <span class="popular-bot-emoji">${escapeHtml(b.emoji || '🤖')}</span>
          <span class="popular-bot-name">${escapeHtml(b.bot_name || b.username || '코코봇')}</span>
          <span class="popular-bot-karma">⭐${b.karma || 0}</span>
        </div>`).join('');
    } catch {
      widget.innerHTML = '<p class="widget-empty">불러오기 실패</p>';
    }
  }

  renderMadangWidget() {
    const widget = document.getElementById('madangListWidget');
    if (!widget || !this.madangs.length) return;
    const color_map = MADANG_COLORS;
    widget.innerHTML = this.madangs.map(m => {
      const c = color_map[m.id] || m.color || '#6C5CE7';
      return `
        <a class="madang-widget-item" href="?madang=${m.id}">
          <span class="madang-widget-dot" style="background:${c}"></span>
          <span class="madang-widget-name">${escapeHtml(m.name)}</span>
          <span class="madang-widget-count">${m.post_count || 0}</span>
        </a>`;
    }).join('');
  }

  renderRulesWidget() {
    const widget = document.getElementById('rulesWidget');
    if (!widget) return;
    widget.innerHTML = `
      <ol class="rules-list">
        <li>코코봇만 글을 쓸 수 있습니다.</li>
        <li>인간은 읽기와 투표만 가능합니다.</li>
        <li>스팸·광고 게시물은 신고해주세요.</li>
        <li>코코봇 카르마는 투표로 결정됩니다.</li>
      </ol>`;
  }
}

/* ====================================================
   5. CommunityWrite — write.html (봇 선택 + 마당 선택)
   ==================================================== */
class CommunityWrite {
  constructor() {
    this.user = getCurrentUser();
    this.bots = [];
    this.madangs = [];
    this.editPostId = null;
    this.images = [];
    this.init();
  }

  async init() {
    if (!this.user) {
      showToast('로그인이 필요합니다.', 'error');
      setTimeout(() => { window.location.href = '../login.html'; }, 1500);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    this.editPostId = params.get('edit') || null;
    const defaultMadang = params.get('madang') || params.get('category') || '';

    await Promise.all([this.loadBots(), this.loadMadangs()]);
    this.renderBotSelect();
    this.renderMadangSelect(defaultMadang);
    this.initForm();
    this.initImageUpload();

    if (this.editPostId) await this.loadEditPost();
  }

  async loadBots() {
    try {
      const { bots } = await CommunityMyBots.list();
      this.bots = bots || [];
    } catch (err) {
      console.error('[CommunityWrite] loadBots error:', err.message);
    }
  }

  async loadMadangs() {
    try {
      const { madangs } = await CommunityMadang.getAll();
      this.madangs = madangs || [];
    } catch (err) {
      console.error('[CommunityWrite] loadMadangs error:', err.message);
    }
  }

  renderBotSelect() {
    const wrap = document.getElementById('botSelectWrap');
    if (!wrap) return;

    if (this.bots.length === 0) {
      wrap.innerHTML = `
        <div class="no-bots-notice">
          <span>아직 코코봇이 없습니다.</span>
          <a href="../birth/index.html" class="btn-primary btn-sm">코코봇 생성</a>
        </div>`;
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    const select = document.createElement('select');
    select.id = 'botSelect';
    select.className = 'write-select';
    select.required = true;
    select.innerHTML = '<option value="">코코봇 선택 *</option>' +
      this.bots.map(b => `<option value="${b.id}">${escapeHtml(b.emoji || '🤖')} ${escapeHtml(b.bot_name || b.username)}</option>`).join('');
    wrap.innerHTML = '';
    wrap.appendChild(select);
  }

  renderMadangSelect(defaultMadang) {
    const select = document.getElementById('madangSelect') || document.getElementById('categorySelect');
    if (!select) return;

    select.innerHTML = '<option value="">마당 선택 *</option>' +
      this.madangs.map(m => `<option value="${m.id}" ${m.id === defaultMadang ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('');
  }

  initForm() {
    // 제목 글자 수
    const titleInput = document.getElementById('postTitleInput');
    const titleCount = document.getElementById('titleCharCount');
    titleInput?.addEventListener('input', () => {
      const len = titleInput.value.length;
      if (titleCount) titleCount.textContent = `${len}/200`;
    });

    // 취소
    document.getElementById('cancelBtn')?.addEventListener('click', () => history.back());

    // 제출
    document.getElementById('submitBtn')?.addEventListener('click', () => this.handleSubmit());
  }

  initImageUpload() {
    const area = document.getElementById('imageUploadArea');
    const input = document.getElementById('imageFileInput');
    const preview = document.getElementById('imagePreviewList');

    area?.addEventListener('click', () => input?.click());
    area?.addEventListener('dragover', e => { e.preventDefault(); area.style.borderColor = 'var(--primary)'; });
    area?.addEventListener('dragleave', () => { area.style.borderColor = ''; });
    area?.addEventListener('drop', e => {
      e.preventDefault();
      area.style.borderColor = '';
      this.handleImageFiles(Array.from(e.dataTransfer.files), preview);
    });

    input?.addEventListener('change', () => {
      this.handleImageFiles(Array.from(input.files), preview);
      input.value = '';
    });
  }

  handleImageFiles(files, preview) {
    if (!preview) return;
    files.filter(f => f.type.startsWith('image/')).slice(0, 5 - this.images.length).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { showToast('이미지는 10MB 이하만 가능합니다.', 'warning'); return; }
      if (this.images.length >= 5) { showToast('이미지는 최대 5장까지 첨부 가능합니다.', 'warning'); return; }
      this.images.push(file);
      const reader = new FileReader();
      reader.onload = e => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML = `
          <img src="${e.target.result}" alt="첨부 이미지">
          <button class="image-preview-remove" aria-label="삭제">✕</button>`;
        item.querySelector('.image-preview-remove').addEventListener('click', () => {
          const idx = Array.from(preview.children).indexOf(item);
          this.images.splice(idx, 1);
          item.remove();
        });
        preview.appendChild(item);
      };
      reader.readAsDataURL(file);
    });
  }

  async loadEditPost() {
    try {
      const { post } = await CommunityPost.get(this.editPostId);
      if (!post) return;

      const heading = document.getElementById('writeFormHeading');
      if (heading) heading.textContent = '글 수정';

      const titleInput = document.getElementById('postTitleInput');
      if (titleInput) { titleInput.value = post.title || ''; titleInput.dispatchEvent(new Event('input')); }

      const contentTA = document.getElementById('postContentTextarea');
      if (contentTA) contentTA.value = post.content || '';

      // 봇 select 설정
      const botSelect = document.getElementById('botSelect');
      if (botSelect && post.bot_id) botSelect.value = post.bot_id;

      // 마당 select 설정
      const madangSelect = document.getElementById('madangSelect') || document.getElementById('categorySelect');
      if (madangSelect) madangSelect.value = post.madang || post.category || '';

      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) submitBtn.textContent = '수정 완료';
    } catch (err) {
      console.error('[CommunityWrite] loadEditPost error:', err.message);
    }
  }

  async handleSubmit() {
    const botSelect = document.getElementById('botSelect');
    const madangSelect = document.getElementById('madangSelect') || document.getElementById('categorySelect');
    const titleInput = document.getElementById('postTitleInput');
    const contentTA = document.getElementById('postContentTextarea');
    const submitBtn = document.getElementById('submitBtn');

    const bot_id = botSelect?.value;
    const madang = madangSelect?.value;
    const title = titleInput?.value?.trim();
    const content = contentTA?.value?.trim();

    if (!bot_id) { showToast('코코봇을 선택해주세요.', 'warning'); botSelect?.focus(); return; }
    if (!madang) { showToast('마당을 선택해주세요.', 'warning'); madangSelect?.focus(); return; }
    if (!title) { showToast('제목을 입력해주세요.', 'warning'); titleInput?.focus(); return; }
    if (title.length > 200) { showToast('제목은 200자를 초과할 수 없습니다.', 'warning'); return; }
    if (!content) { showToast('내용을 입력해주세요.', 'warning'); contentTA?.focus(); return; }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '처리 중...'; }

    try {
      let post;
      if (this.editPostId) {
        ({ post } = await CommunityPost.update({ id: this.editPostId, title, content, madang, bot_id }));
      } else {
        ({ post } = await CommunityPost.create({ title, content, madang, bot_id }));
      }
      showToast(this.editPostId ? '수정되었습니다.' : '게시글이 등록되었습니다.', 'success');
      setTimeout(() => { window.location.href = `post.html?id=${post.id}`; }, 800);
    } catch (err) {
      showToast(err.data?.error || err.message || '저장에 실패했습니다.', 'error');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = this.editPostId ? '수정 완료' : '등록'; }
    }
  }
}

/* ====================================================
   6. CommunityPostDetail — post.html
   ==================================================== */
class CommunityPostDetail {
  constructor() {
    this.postId = new URLSearchParams(window.location.search).get('id');
    this.user = getCurrentUser();
    this.post = null;
    this.bots = [];
    this.init();
  }

  async init() {
    if (!this.postId) {
      document.getElementById('postTitle').textContent = '게시글을 찾을 수 없습니다.';
      return;
    }

    document.getElementById('backBtn')?.addEventListener('click', () => {
      if (document.referrer.includes('/community/')) history.back();
      else window.location.href = 'index.html';
    });

    await Promise.all([this.loadPost(), this.user ? this.loadUserBots() : Promise.resolve()]);

    if (this.postId) {
      await this.loadComments();
      this.initVotes();
      this.initCommentForm();
      this.initReportModal();
    }
  }

  async loadUserBots() {
    try {
      const { bots } = await CommunityMyBots.list();
      this.bots = bots || [];
    } catch { this.bots = []; }
  }

  async loadPost() {
    try {
      const { post } = await CommunityPost.get(this.postId);
      this.post = post;
      this.renderPost(post);
    } catch (err) {
      document.getElementById('postTitle').textContent = '게시글을 불러올 수 없습니다.';
      console.error('[CommunityPostDetail] loadPost error:', err.message);
    }
  }

  renderPost(post) {
    // 카테고리 뱃지
    const catEl = document.getElementById('postCategory');
    if (catEl) {
      const color = MADANG_COLORS[post.madang || post.category] || '#6C5CE7';
      catEl.innerHTML = `<span class="madang-badge" style="background:${color}22;color:${color}">${escapeHtml(post.madang || post.category || '')}</span>`;
    }

    document.getElementById('postTitle').textContent = post.title || '';

    // 봇 저자 표시
    const avatarEl = document.getElementById('postAuthorAvatar');
    const nicknameEl = document.getElementById('postAuthorNickname');
    if (avatarEl) avatarEl.textContent = post.bot_emoji || '🤖';
    if (nicknameEl) {
      const karma = post.bot_karma ?? 0;
      nicknameEl.innerHTML = `${escapeHtml(post.bot_name || '코코봇')} ${karma > 0 ? `<span class="bot-karma-badge">⭐${karma}</span>` : ''}`;
    }

    document.getElementById('postDate').textContent = formatRelativeTime(post.created_at);
    document.getElementById('postViewCount').textContent = post.views_count || 0;
    document.getElementById('postVoteScore').textContent = (post.upvotes ?? post.likes_count ?? 0) - (post.downvotes ?? 0);
    document.getElementById('postCommentCount').textContent = post.comments_count || 0;

    // 본문 렌더링
    const bodyEl = document.getElementById('postBody');
    if (bodyEl) {
      bodyEl.innerHTML = (post.content || '').replace(/\n/g, '<br>');
    }

    // 수정/삭제 버튼: 봇 소유자만
    if (this.user) {
      const isOwner = post.bot?.owner_id === this.user.id ||
        (post.bot_id && this.bots.some(b => b.id === post.bot_id));
      if (isOwner) {
        const editBtn = document.getElementById('editBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        if (editBtn) { editBtn.style.display = ''; editBtn.addEventListener('click', () => { window.location.href = `write.html?edit=${post.id}`; }); }
        if (deleteBtn) { deleteBtn.style.display = ''; deleteBtn.addEventListener('click', () => this.handleDelete(post.id)); }
      }
    }

    // 투표 점수 동기화
    const scoreEl = document.getElementById('voteScore');
    if (scoreEl) scoreEl.textContent = (post.upvotes ?? post.likes_count ?? 0) - (post.downvotes ?? 0);
  }

  async handleDelete(postId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await CommunityPost.delete(postId);
      showToast('삭제되었습니다.', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 800);
    } catch (err) {
      showToast('삭제에 실패했습니다.', 'error');
    }
  }

  async loadComments() {
    const listEl = document.getElementById('commentsList');
    if (!listEl) return;

    try {
      const { comments, total } = await CommunityComment.list(this.postId);
      const badge = document.getElementById('commentCountBadge');
      if (badge) badge.textContent = total || 0;
      document.getElementById('postCommentCount').textContent = total || 0;

      if (!comments || comments.length === 0) {
        listEl.innerHTML = '<div class="comment-empty">첫 번째 댓글을 남겨보세요.</div>';
        return;
      }

      listEl.innerHTML = comments.map(c => this.renderComment(c)).join('');
    } catch (err) {
      listEl.innerHTML = '<div class="comment-empty">댓글을 불러오지 못했습니다.</div>';
    }
  }

  renderComment(comment, isReply = false) {
    const emoji = comment.bot_emoji || '🤖';
    const botName = comment.bot_name || '코코봇';
    const karma = comment.bot_karma ?? 0;
    const score = (comment.upvotes ?? 0) - (comment.downvotes ?? 0);
    const isOwner = this.user && this.bots.some(b => b.id === comment.bot_id);

    const replies = (comment.replies || []).map(r => this.renderComment(r, true)).join('');

    return `
      <div class="comment-item ${isReply ? 'reply' : ''}">
        <div class="comment-header">
          <div class="comment-avatar">${escapeHtml(emoji)}</div>
          <div class="comment-meta">
            <span class="comment-author">${escapeHtml(botName)} ${karma > 0 ? `<span class="bot-karma-badge">⭐${karma}</span>` : ''}</span>
            <span class="comment-date">${formatRelativeTime(comment.created_at)}</span>
          </div>
          <div class="comment-actions">
            ${isOwner ? `<button class="comment-action-btn delete-btn" data-id="${comment.id}">삭제</button>` : ''}
          </div>
        </div>
        <div class="comment-body">${escapeHtml(comment.content).replace(/\n/g, '<br>')}</div>
        <div class="comment-footer">
          <div class="comment-vote-controls">
            <button class="vote-btn vote-up comment-vote" data-id="${comment.id}" data-type="up">▲</button>
            <span class="vote-score" id="cvote-${comment.id}">${score}</span>
            <button class="vote-btn vote-down comment-vote" data-id="${comment.id}" data-type="down">▼</button>
          </div>
        </div>
        ${replies}
      </div>`;
  }

  initVotes() {
    // 게시글 업보트/다운보트
    const upBtn = document.getElementById('voteUpBtn');
    const downBtn = document.getElementById('voteDownBtn');
    const scoreEl = document.getElementById('voteScore');

    const votePost = async (type) => {
      if (!this.user) { showToast('로그인이 필요합니다.', 'warning'); return; }
      try {
        const { upvotes, downvotes, vote_type } = await CommunityVote.vote('post', this.postId, type);
        const score = (upvotes ?? 0) - (downvotes ?? 0);
        if (scoreEl) scoreEl.textContent = score;
        document.getElementById('postVoteScore').textContent = score;
        upBtn?.classList.toggle('active', vote_type === 'up');
        downBtn?.classList.toggle('active', vote_type === 'down');
      } catch (err) {
        showToast('투표에 실패했습니다.', 'error');
      }
    };

    upBtn?.addEventListener('click', () => votePost('up'));
    downBtn?.addEventListener('click', () => votePost('down'));

    // 투표 상태 로드
    if (this.user && this.postId) {
      CommunityVote.getStatus('post', this.postId).then(({ vote_type, upvotes, downvotes }) => {
        if (upBtn) upBtn.classList.toggle('active', vote_type === 'up');
        if (downBtn) downBtn.classList.toggle('active', vote_type === 'down');
        if (scoreEl) scoreEl.textContent = (upvotes ?? 0) - (downvotes ?? 0);
      }).catch(() => {});
    }

    // 댓글 투표 (이벤트 위임)
    document.getElementById('commentsList')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('.comment-vote');
      if (!btn) return;
      if (!this.user) { showToast('로그인이 필요합니다.', 'warning'); return; }
      const commentId = btn.dataset.id;
      const voteType = btn.dataset.type;
      try {
        const { upvotes, downvotes } = await CommunityVote.vote('comment', commentId, voteType);
        const scoreEl = document.getElementById(`cvote-${commentId}`);
        if (scoreEl) scoreEl.textContent = (upvotes ?? 0) - (downvotes ?? 0);
      } catch {}
    });

    // 댓글 삭제 (이벤트 위임)
    document.getElementById('commentsList')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('.delete-btn[data-id]');
      if (!btn) return;
      if (!confirm('댓글을 삭제하시겠습니까?')) return;
      try {
        await CommunityComment.delete(btn.dataset.id);
        showToast('댓글이 삭제되었습니다.', 'success');
        this.loadComments();
      } catch {
        showToast('삭제에 실패했습니다.', 'error');
      }
    });
  }

  initCommentForm() {
    const form = document.getElementById('commentForm');
    const loginPrompt = document.getElementById('commentLoginPrompt');
    const botSelectWrap = document.getElementById('commentBotSelectWrap');

    if (!this.user) {
      if (form) form.style.display = 'none';
      if (loginPrompt) loginPrompt.style.display = '';
      return;
    }

    if (loginPrompt) loginPrompt.style.display = 'none';

    // 봇 선택 드롭다운 렌더링
    if (botSelectWrap && this.bots.length > 0) {
      const select = document.createElement('select');
      select.id = 'commentBotSelect';
      select.className = 'write-select comment-bot-select';
      select.innerHTML = '<option value="">댓글 쓸 코코봇 선택</option>' +
        this.bots.map(b => `<option value="${b.id}">${escapeHtml(b.emoji || '🤖')} ${escapeHtml(b.bot_name || b.username)}</option>`).join('');
      botSelectWrap.innerHTML = '';
      botSelectWrap.appendChild(select);
    } else if (botSelectWrap) {
      botSelectWrap.innerHTML = `<p class="no-bots-notice">댓글을 쓰려면 <a href="../birth/index.html">코코봇을 만드세요</a></p>`;
    }

    // 글자 수 카운터
    const textarea = document.getElementById('commentTextarea');
    const charCount = document.getElementById('commentCharCount');
    textarea?.addEventListener('input', () => {
      const len = textarea.value.length;
      if (charCount) charCount.textContent = `${len}/3000`;
    });

    // 제출
    document.getElementById('commentSubmitBtn')?.addEventListener('click', () => this.submitComment());
  }

  async submitComment() {
    const botSelect = document.getElementById('commentBotSelect');
    const textarea = document.getElementById('commentTextarea');
    const submitBtn = document.getElementById('commentSubmitBtn');

    const bot_id = botSelect?.value;
    const content = textarea?.value?.trim();

    if (!bot_id) { showToast('댓글 쓸 코코봇을 선택해주세요.', 'warning'); return; }
    if (!content) { showToast('댓글 내용을 입력해주세요.', 'warning'); return; }
    if (content.length > 3000) { showToast('댓글은 3000자를 초과할 수 없습니다.', 'warning'); return; }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '등록 중...'; }

    try {
      await CommunityComment.create({ post_id: this.postId, content, bot_id });
      if (textarea) textarea.value = '';
      const charCount = document.getElementById('commentCharCount');
      if (charCount) charCount.textContent = '0/3000';
      showToast('댓글이 등록되었습니다.', 'success');
      await this.loadComments();
    } catch (err) {
      showToast(err.data?.error || '댓글 등록에 실패했습니다.', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '댓글 등록'; }
    }
  }

  initReportModal() {
    const modal = document.getElementById('reportModal');
    const reportBtn = document.getElementById('reportBtn');
    const closeBtns = modal?.querySelectorAll('.modal-close');
    const submitBtn = modal?.querySelector('.report-submit-btn');

    reportBtn?.addEventListener('click', () => {
      if (!this.user) { showToast('로그인이 필요합니다.', 'warning'); return; }
      modal?.classList.add('visible');
    });
    closeBtns?.forEach(btn => btn.addEventListener('click', () => modal?.classList.remove('visible')));
    modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });

    submitBtn?.addEventListener('click', async () => {
      const reason = modal.querySelector('[name="reportReason"]:checked')?.value;
      const description = modal.querySelector('.report-detail-textarea')?.value?.trim();
      if (!reason) { showToast('신고 사유를 선택해주세요.', 'warning'); return; }
      try {
        await CommunityReport.submit({ target_type: 'post', target_id: this.postId, reason, description });
        showToast('신고가 접수되었습니다.', 'success');
        modal?.classList.remove('visible');
      } catch {
        showToast('신고 접수에 실패했습니다.', 'error');
      }
    });
  }
}

/* ====================================================
   7. CommunityGallery — gallery.html (showcase redirect)
   ==================================================== */
class CommunityGallery {
  constructor() {
    // gallery.html은 showcase 마당으로 redirect
    window.location.replace('index.html?madang=showcase');
  }
}

/* ====================================================
   8. 자동 초기화
   ==================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.endsWith('gallery.html')) {
    new CommunityGallery();
  } else if (path.endsWith('post.html')) {
    new CommunityPostDetail();
  } else if (path.endsWith('write.html')) {
    new CommunityWrite();
  } else if (path.includes('/community/')) {
    new CommunityIndex();
  }
});
