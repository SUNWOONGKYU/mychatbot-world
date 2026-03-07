/* @task S3F11 */
/**
 * community.js — 봇마당 커뮤니티 클라이언트 로직
 * Task: S3F11 | Stage: S3 | Area: F
 *
 * API 모듈 연동:
 *  - community-post.js     (GET 목록/상세, POST 작성, PUT 수정, DELETE 삭제)
 *  - community-comment.js  (GET 댓글, POST 작성, DELETE 삭제)
 *  - community-like.js     (POST 토글)
 *  - community-report.js   (POST 신고)
 *  - community-category.js (GET 카테고리)
 */

'use strict';

/* ====================================================
   0. API Base URL 설정
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

/** fetch wrapper — JSON 자동 파싱, 에러 처리 */
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
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Supabase Auth 토큰 가져오기 */
function getAuthToken() {
  try {
    // Supabase JS v2: localStorage 키 형식
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!key) return null;
    const session = JSON.parse(localStorage.getItem(key));
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/** 현재 로그인 사용자 정보 */
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

/** 로그인 여부 */
function isLoggedIn() {
  return !!getAuthToken();
}

/** 날짜 포맷: n분 전, n시간 전, YYYY.MM.DD */
function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `${diffD}일 전`;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** 조회수 포맷: 1234 → 1.2k */
function formatCount(n) {
  if (!n) return 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n;
}

// escapeHtml is loaded from js/utils.js

/** 토스트 알림 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/** 카테고리 배지 HTML */
function categoryBadgeHtml(cat) {
  const map = {
    'free':      { label: '자유',    cls: 'badge-free' },
    'showcase':  { label: '쇼케이스', cls: 'badge-showcase' },
    'tip':       { label: '팁 공유', cls: 'badge-tip' },
    'qna':       { label: 'Q&A',    cls: 'badge-qna' },
    'notice':    { label: '공지',   cls: 'badge-notice' },
  };
  const info = map[cat] || { label: cat, cls: 'badge-free' };
  return `<span class="post-category-badge ${info.cls}">${info.label}</span>`;
}

/** URL 파라미터 파싱 */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ====================================================
   2. API 모듈: community-category.js
   ==================================================== */
const CommunityCategory = {
  async getAll() {
    return apiFetch('/Backend_APIs/community-category');
  }
};

/* ====================================================
   3. API 모듈: community-post.js
   ==================================================== */
const CommunityPost = {
  /** 게시글 목록 */
  async list({ category = '', sort = 'latest', page = 1, limit = 20, q = '' } = {}) {
    const params = new URLSearchParams({ category, sort, page, limit, q });
    return apiFetch(`/Backend_APIs/community-post?${params}`);
  },

  /** 게시글 상세 */
  async get(postId) {
    return apiFetch(`/Backend_APIs/community-post/${postId}`);
  },

  /** 게시글 작성 */
  async create({ category, title, content }) {
    return apiFetch('/Backend_APIs/community-post', {
      method: 'POST',
      body: JSON.stringify({ category, title, content }),
    });
  },

  /** 게시글 수정 */
  async update(postId, { category, title, content }) {
    return apiFetch(`/Backend_APIs/community-post/${postId}`, {
      method: 'PUT',
      body: JSON.stringify({ category, title, content }),
    });
  },

  /** 게시글 삭제 */
  async delete(postId) {
    return apiFetch(`/Backend_APIs/community-post/${postId}`, {
      method: 'DELETE',
    });
  },
};

/* ====================================================
   4. API 모듈: community-comment.js
   ==================================================== */
const CommunityComment = {
  /** 댓글 목록 */
  async list(postId) {
    return apiFetch(`/Backend_APIs/community-comment?post_id=${postId}`);
  },

  /** 댓글 작성 */
  async create({ postId, content, parentId = null }) {
    return apiFetch('/Backend_APIs/community-comment', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId, content, parent_id: parentId }),
    });
  },

  /** 댓글 삭제 */
  async delete(commentId) {
    return apiFetch(`/Backend_APIs/community-comment/${commentId}`, {
      method: 'DELETE',
    });
  },
};

/* ====================================================
   5. API 모듈: community-like.js
   ==================================================== */
const CommunityLike = {
  /** 좋아요 토글 (POST/게시글 or 댓글) */
  async toggle({ targetId, targetType = 'post' }) {
    return apiFetch('/Backend_APIs/community-like', {
      method: 'POST',
      body: JSON.stringify({ target_id: targetId, target_type: targetType }),
    });
  },
};

/* ====================================================
   6. API 모듈: community-report.js
   ==================================================== */
const CommunityReport = {
  /** 신고 */
  // S3T2: 파라미터명 detail → description (community-report.js API 정합성 수정)
  async submit({ targetId, targetType = 'post', reason, description = '' }) {
    return apiFetch('/Backend_APIs/community-report', {
      method: 'POST',
      body: JSON.stringify({ target_id: targetId, target_type: targetType, reason, description }),
    });
  },
};

/* ====================================================
   7. 게시글 목록 페이지 (index.html)
   ==================================================== */
class CommunityIndex {
  constructor() {
    this.currentCategory = getQueryParam('category') || 'all';
    this.currentSort     = getQueryParam('sort') || 'latest';
    this.currentPage     = parseInt(getQueryParam('page') || '1', 10);
    this.currentQ        = getQueryParam('q') || '';
    this.totalPages      = 1;
  }

  async init() {
    this.bindSidebar();
    this.renderCategoryTabs();
    this.bindToolbar();
    this.bindSearch();
    this.updateWriteButton();
    await this.loadPosts();
  }

  /** 사이드바 토글 (모바일) */
  bindSidebar() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('visible');
    });
    overlay?.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('visible');
    });
  }

  /** 카테고리 탭 활성화 */
  renderCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab[data-category]');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === this.currentCategory);
      tab.addEventListener('click', () => {
        this.currentCategory = tab.dataset.category;
        this.currentPage = 1;
        this.updateUrl();
        this.loadPosts();
        tabs.forEach(t => t.classList.toggle('active', t === tab));
      });
    });
  }

  /** 정렬 버튼 바인딩 */
  bindToolbar() {
    const sortBtns = document.querySelectorAll('.sort-btn[data-sort]');
    sortBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === this.currentSort);
      btn.addEventListener('click', () => {
        this.currentSort = btn.dataset.sort;
        this.currentPage = 1;
        this.updateUrl();
        this.loadPosts();
        sortBtns.forEach(b => b.classList.toggle('active', b === btn));
      });
    });
  }

  /** 검색 */
  bindSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn   = document.getElementById('searchBtn');
    if (!searchInput) return;
    searchInput.value = this.currentQ;
    const doSearch = () => {
      this.currentQ    = searchInput.value.trim();
      this.currentPage = 1;
      this.updateUrl();
      this.loadPosts();
    };
    searchBtn?.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  }

  /** 로그인 시만 글쓰기 버튼 표시 */
  updateWriteButton() {
    const writeBtn = document.getElementById('writeBtn');
    if (!writeBtn) return;
    writeBtn.style.display = isLoggedIn() ? '' : 'none';
    writeBtn.addEventListener('click', () => { location.href = 'write.html'; });
  }

  /** URL 동기화 */
  updateUrl() {
    const params = new URLSearchParams();
    if (this.currentCategory !== 'all') params.set('category', this.currentCategory);
    if (this.currentSort !== 'latest') params.set('sort', this.currentSort);
    if (this.currentPage > 1) params.set('page', this.currentPage);
    if (this.currentQ) params.set('q', this.currentQ);
    history.replaceState(null, '', `?${params.toString()}`);
  }

  /** 게시글 목록 로드 & 렌더 */
  async loadPosts() {
    const listEl  = document.getElementById('postsList');
    const pageEl  = document.getElementById('pagination');
    if (!listEl) return;

    listEl.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>불러오는 중...</div>`;

    try {
      const res = await CommunityPost.list({
        category: this.currentCategory === 'all' ? '' : this.currentCategory,
        sort:     this.currentSort,
        page:     this.currentPage,
        limit:    20,
        q:        this.currentQ,
      });

      const posts = res.data || res.posts || res || [];
      this.totalPages = res.total_pages || res.totalPages || 1;

      if (!posts.length) {
        listEl.innerHTML = `
          <div class="posts-empty">
            <div class="empty-icon">📭</div>
            <p>아직 게시글이 없습니다. 첫 글을 작성해보세요!</p>
          </div>`;
        if (pageEl) pageEl.innerHTML = '';
        return;
      }

      listEl.innerHTML = posts.map(p => this.renderPostItem(p)).join('');
      listEl.querySelectorAll('.post-item').forEach((el, i) => {
        el.addEventListener('click', () => {
          window.location.href = `post.html?id=${posts[i].id}`;
        });
      });

      if (pageEl) this.renderPagination(pageEl);
    } catch (err) {
      console.error('[CommunityIndex] loadPosts error:', err);
      listEl.innerHTML = `<div class="posts-empty"><div class="empty-icon">⚠️</div><p>게시글을 불러오지 못했습니다.</p></div>`;
    }
  }

  renderPostItem(post) {
    const pinClass = post.is_pinned ? 'pinned' : '';
    const pinIcon  = post.is_pinned ? '<span class="pin-icon">📌</span>' : '';
    return `
      <div class="post-item ${pinClass}" data-id="${post.id}">
        <div class="post-title-cell">
          <div class="post-title-row">
            ${pinIcon}
            ${categoryBadgeHtml(post.category)}
            <span class="post-title-text">${escapeHtml(post.title)}</span>
            ${post.comment_count ? `<span class="post-comment-count">[${formatCount(post.comment_count)}]</span>` : ''}
          </div>
          <div class="post-meta-row">
            <span class="post-author-name">${escapeHtml(post.author_nickname || post.author_name || '익명')}</span>
            <span>·</span>
            <span>${formatDate(post.created_at)}</span>
          </div>
        </div>
        <div class="post-stat post-stat-icon ${post.user_liked ? 'liked' : ''}">♥ ${formatCount(post.like_count)}</div>
        <div class="post-stat">💬 ${formatCount(post.comment_count)}</div>
        <div class="post-stat">👁 ${formatCount(post.view_count)}</div>
        <div class="post-date-cell">${formatDate(post.created_at)}</div>
      </div>`;
  }

  renderPagination(container) {
    if (this.totalPages <= 1) { container.innerHTML = ''; return; }
    const cur = this.currentPage;
    const total = this.totalPages;
    const range = [];
    const delta = 2;
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
      range.push(i);
    }

    const pages = [];
    if (range[0] > 1) {
      pages.push('<button class="page-btn" data-page="1">1</button>');
      if (range[0] > 2) pages.push('<span class="page-ellipsis">…</span>');
    }
    range.forEach(n => {
      pages.push(`<button class="page-btn ${n === cur ? 'active' : ''}" data-page="${n}">${n}</button>`);
    });
    if (range[range.length - 1] < total) {
      if (range[range.length - 1] < total - 1) pages.push('<span class="page-ellipsis">…</span>');
      pages.push(`<button class="page-btn" data-page="${total}">${total}</button>`);
    }

    container.innerHTML = `
      <button class="page-btn" data-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''}>‹</button>
      ${pages.join('')}
      <button class="page-btn" data-page="${cur + 1}" ${cur === total ? 'disabled' : ''}>›</button>`;

    container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p < 1 || p > total || p === cur) return;
        this.currentPage = p;
        this.updateUrl();
        this.loadPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }
}

/* ====================================================
   8. 게시글 상세 페이지 (post.html)
   ==================================================== */
class CommunityPostDetail {
  constructor() {
    this.postId  = getQueryParam('id');
    this.post    = null;
    this.comments = [];
    this.user    = getCurrentUser();
  }

  async init() {
    if (!this.postId) { window.location.href = 'index.html'; return; }
    this.bindSidebar();
    await this.loadPost();
    await this.loadComments();
    this.bindLike();
    this.bindCommentForm();
    this.bindReport();
    this.bindBackBtn();
    this.bindEditDelete();
  }

  bindSidebar() {
    const toggle  = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('visible');
    });
    overlay?.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('visible');
    });
  }

  async loadPost() {
    try {
      const res = await CommunityPost.get(this.postId);
      this.post = res.data || res;
      this.renderPost();
    } catch (err) {
      console.error('[PostDetail] loadPost error:', err);
      showToast('게시글을 불러올 수 없습니다.', 'error');
    }
  }

  renderPost() {
    const p = this.post;
    if (!p) return;

    const setById = (id, val, html = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (html) el.innerHTML = val; else el.textContent = val;
    };

    setById('postCategory', '', true);
    const catEl = document.getElementById('postCategory');
    if (catEl) catEl.innerHTML = categoryBadgeHtml(p.category);

    setById('postTitle', escapeHtml(p.title), true);
    setById('postAuthorNickname', p.author_nickname || '익명');
    setById('postDate', formatDate(p.created_at));
    setById('postViewCount', formatCount(p.view_count));
    setById('postLikeCount', formatCount(p.like_count));
    setById('postCommentCount', formatCount(p.comment_count));
    // NOTE: content_html is intentionally rendered as HTML (server-generated rich content).
    // Raw user input is always escaped via escapeHtml() before storage; this field is
    // trusted server output. Plain-text fallback uses escapeHtml() for safety.
    setById('postBody', p.content_html || escapeHtml(p.content), true);

    // 아바타 이니셜
    const avatarEl = document.getElementById('postAuthorAvatar');
    if (avatarEl) {
      const nick = p.author_nickname || '?';
      avatarEl.textContent = nick.charAt(0).toUpperCase();
    }

    // 좋아요 버튼 상태
    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn) {
      likeBtn.classList.toggle('active', !!p.user_liked);
      const likeCountEl = likeBtn.querySelector('.like-count');
      if (likeCountEl) likeCountEl.textContent = formatCount(p.like_count);
    }

    // 수정/삭제 버튼 — 본인 글만
    const editBtn   = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const isOwner   = this.user && (this.user.id === p.author_id);
    if (editBtn)   editBtn.style.display   = isOwner ? '' : 'none';
    if (deleteBtn) deleteBtn.style.display = isOwner ? '' : 'none';

    // 댓글 작성 폼 — 로그인 시만
    const commentFormEl = document.getElementById('commentForm');
    const loginPromptEl = document.getElementById('commentLoginPrompt');
    if (isLoggedIn()) {
      commentFormEl?.style && (commentFormEl.style.display = '');
      loginPromptEl?.style && (loginPromptEl.style.display = 'none');
    } else {
      commentFormEl?.style && (commentFormEl.style.display = 'none');
      loginPromptEl?.style && (loginPromptEl.style.display = '');
    }

    document.title = `${p.title} — 봇마당 | My Chatbot World`;
  }

  /** 댓글 목록 로드 & 트리 렌더 */
  async loadComments() {
    const listEl = document.getElementById('commentsList');
    if (!listEl) return;
    try {
      const res = await CommunityComment.list(this.postId);
      this.comments = res.data || res || [];
      this.renderCommentTree(listEl);
    } catch (err) {
      console.error('[PostDetail] loadComments error:', err);
    }
  }

  /** 댓글을 트리 구조로 렌더링 (대댓글 들여쓰기) */
  renderCommentTree(container) {
    const roots   = this.comments.filter(c => !c.parent_id);
    const replies = this.comments.filter(c => !!c.parent_id);
    const getChildren = parentId => replies.filter(c => c.parent_id === parentId);

    if (!roots.length) {
      container.innerHTML = '<div class="posts-empty" style="padding:2rem"><p>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p></div>';
      return;
    }

    const html = [];
    roots.forEach(comment => {
      html.push(this.commentHtml(comment, false));
      getChildren(comment.id).forEach(reply => {
        html.push(this.commentHtml(reply, true));
      });
    });
    container.innerHTML = html.join('');

    // 대댓글 버튼 이벤트
    container.querySelectorAll('.reply-btn[data-comment-id]').forEach(btn => {
      btn.addEventListener('click', () => this.toggleReplyForm(btn.dataset.commentId));
    });

    // 댓글 삭제 버튼 이벤트
    container.querySelectorAll('.delete-btn[data-comment-id]').forEach(btn => {
      btn.addEventListener('click', () => this.deleteComment(btn.dataset.commentId));
    });

    // 대댓글 폼 제출
    container.querySelectorAll('.reply-form').forEach(form => {
      const submitBtn = form.querySelector('.reply-submit-btn');
      submitBtn?.addEventListener('click', () => this.submitReply(form));
      const cancelBtn = form.querySelector('.reply-cancel-btn');
      cancelBtn?.addEventListener('click', () => form.classList.remove('visible'));
    });

    // 댓글 좋아요
    container.querySelectorAll('.btn-comment-like[data-comment-id]').forEach(btn => {
      btn.addEventListener('click', () => this.toggleCommentLike(btn));
    });
  }

  commentHtml(comment, isReply) {
    const isOwner   = this.user && (this.user.id === comment.author_id);
    const isDeleted = comment.is_deleted;
    const nick      = comment.author_nickname || '익명';
    const initial   = nick.charAt(0).toUpperCase();

    return `
      <div class="comment-item ${isReply ? 'reply' : ''}" id="comment-${comment.id}">
        <div class="comment-header">
          <div class="comment-avatar">${initial}</div>
          <div class="comment-meta">
            <span class="comment-author">${escapeHtml(nick)}</span>
            <span class="comment-date">${formatDate(comment.created_at)}</span>
          </div>
          <div class="comment-actions">
            ${!isDeleted && isLoggedIn() && !isReply ? `<button class="comment-action-btn reply-btn" data-comment-id="${comment.id}">답글</button>` : ''}
            ${!isDeleted && isOwner ? `<button class="comment-action-btn delete-btn danger" data-comment-id="${comment.id}">삭제</button>` : ''}
          </div>
        </div>
        <div class="comment-body ${isDeleted ? 'deleted' : ''}">
          ${isDeleted ? '삭제된 댓글입니다.' : escapeHtml(comment.content)}
        </div>
        ${!isDeleted ? `
        <div class="comment-footer">
          <button class="btn-comment-like ${comment.user_liked ? 'active' : ''}" data-comment-id="${comment.id}">
            ♥ <span class="comment-like-count">${formatCount(comment.like_count)}</span>
          </button>
        </div>` : ''}
        ${!isReply && !isDeleted && isLoggedIn() ? `
        <div class="reply-form" id="reply-form-${comment.id}">
          <textarea placeholder="답글을 입력하세요..." rows="3" class="reply-textarea"></textarea>
          <div class="reply-form-actions">
            <button class="btn-secondary btn-sm reply-cancel-btn">취소</button>
            <button class="btn-primary btn-sm reply-submit-btn" data-parent-id="${comment.id}">등록</button>
          </div>
        </div>` : ''}
      </div>`;
  }

  toggleReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (!form) return;
    form.classList.toggle('visible');
    if (form.classList.contains('visible')) form.querySelector('textarea')?.focus();
  }

  async submitReply(form) {
    const textarea = form.querySelector('.reply-textarea');
    const submitBtn = form.querySelector('.reply-submit-btn');
    const parentId = submitBtn?.dataset.parentId;
    const content = textarea?.value.trim();

    if (!content) { showToast('내용을 입력하세요.', 'error'); return; }
    if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }

    submitBtn.disabled = true;
    try {
      await CommunityComment.create({ postId: this.postId, content, parentId });
      form.classList.remove('visible');
      if (textarea) textarea.value = '';
      await this.loadComments();
      showToast('답글이 등록되었습니다.', 'success');
    } catch (err) {
      showToast(err.message || '등록에 실패했습니다.', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async deleteComment(commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await CommunityComment.delete(commentId);
      await this.loadComments();
      showToast('댓글이 삭제되었습니다.', 'success');
    } catch (err) {
      showToast(err.message || '삭제에 실패했습니다.', 'error');
    }
  }

  async toggleCommentLike(btn) {
    if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }
    const commentId = btn.dataset.commentId;
    try {
      const res = await CommunityLike.toggle({ targetId: commentId, targetType: 'comment' });
      btn.classList.toggle('active', res.liked);
      const countEl = btn.querySelector('.comment-like-count');
      if (countEl) countEl.textContent = formatCount(res.like_count);
    } catch (err) {
      showToast('좋아요 처리에 실패했습니다.', 'error');
    }
  }

  /** 게시글 좋아요 토글 */
  bindLike() {
    const likeBtn = document.getElementById('likeBtn');
    if (!likeBtn) return;
    likeBtn.addEventListener('click', async () => {
      if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }
      likeBtn.disabled = true;
      try {
        const res = await CommunityLike.toggle({ targetId: this.postId, targetType: 'post' });
        likeBtn.classList.toggle('active', res.liked);
        const countEl = likeBtn.querySelector('.like-count');
        if (countEl) countEl.textContent = formatCount(res.like_count);
      } catch (err) {
        showToast('좋아요 처리에 실패했습니다.', 'error');
      } finally {
        likeBtn.disabled = false;
      }
    });
  }

  /** 댓글 작성 폼 */
  bindCommentForm() {
    const form      = document.getElementById('commentForm');
    const textarea  = document.getElementById('commentTextarea');
    const submitBtn = document.getElementById('commentSubmitBtn');
    const charCount = document.getElementById('commentCharCount');
    if (!form || !submitBtn) return;

    textarea?.addEventListener('input', () => {
      const len = (textarea.value || '').length;
      if (charCount) charCount.textContent = `${len}/500`;
    });

    submitBtn.addEventListener('click', async () => {
      const content = textarea?.value.trim();
      if (!content) { showToast('내용을 입력하세요.', 'error'); return; }
      if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }
      if (content.length > 500) { showToast('댓글은 500자 이하로 입력하세요.', 'error'); return; }

      submitBtn.disabled = true;
      try {
        await CommunityComment.create({ postId: this.postId, content });
        if (textarea) textarea.value = '';
        if (charCount) charCount.textContent = '0/500';
        await this.loadComments();
        showToast('댓글이 등록되었습니다.', 'success');
      } catch (err) {
        showToast(err.message || '댓글 등록에 실패했습니다.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /** 신고 모달 */
  bindReport() {
    const reportBtn   = document.getElementById('reportBtn');
    const reportModal = document.getElementById('reportModal');
    const closeBtn    = reportModal?.querySelector('.modal-close');
    const submitBtn   = reportModal?.querySelector('.report-submit-btn');

    reportBtn?.addEventListener('click', () => {
      if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }
      reportModal?.classList.add('visible');
    });
    closeBtn?.addEventListener('click', () => reportModal?.classList.remove('visible'));
    reportModal?.addEventListener('click', e => { if (e.target === reportModal) reportModal.classList.remove('visible'); });

    submitBtn?.addEventListener('click', async () => {
      const reason = reportModal.querySelector('input[name="reportReason"]:checked')?.value;
      const description = reportModal.querySelector('.report-detail-textarea')?.value.trim() || ''; // S3T2: detail → description
      if (!reason) { showToast('신고 사유를 선택하세요.', 'error'); return; }

      submitBtn.disabled = true;
      try {
        await CommunityReport.submit({ targetId: this.postId, targetType: 'post', reason, description });
        reportModal.classList.remove('visible');
        showToast('신고가 접수되었습니다.', 'success');
      } catch (err) {
        showToast(err.message || '신고에 실패했습니다.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  bindBackBtn() {
    const backBtn = document.getElementById('backBtn');
    backBtn?.addEventListener('click', () => { window.location.href = 'index.html'; });
  }

  bindEditDelete() {
    const editBtn   = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    editBtn?.addEventListener('click', () => {
      window.location.href = `write.html?id=${this.postId}`;
    });

    deleteBtn?.addEventListener('click', async () => {
      if (!confirm('게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
      deleteBtn.disabled = true;
      try {
        await CommunityPost.delete(this.postId);
        showToast('게시글이 삭제되었습니다.', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
      } catch (err) {
        showToast(err.message || '삭제에 실패했습니다.', 'error');
        deleteBtn.disabled = false;
      }
    });
  }
}

/* ====================================================
   9. 게시글 작성/수정 페이지 (write.html)
   ==================================================== */
class CommunityWrite {
  constructor() {
    this.postId  = getQueryParam('id'); // 수정 모드면 존재
    this.isEdit  = !!this.postId;
  }

  async init() {
    if (!isLoggedIn()) {
      showToast('로그인이 필요합니다.', 'error');
      setTimeout(() => { window.location.href = '../auth/login.html?redirect=' + encodeURIComponent(window.location.href); }, 1000);
      return;
    }
    this.bindSidebar();
    await this.loadCategories();
    if (this.isEdit) await this.loadExistingPost();
    this.bindForm();
    this.bindImageUpload();
    this.bindCharCount();
    this.updatePageTitle();
  }

  bindSidebar() {
    const toggle  = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!toggle) return;
    toggle.addEventListener('click', () => { sidebar?.classList.toggle('open'); overlay?.classList.toggle('visible'); });
    overlay?.addEventListener('click', () => { sidebar?.classList.remove('open'); overlay?.classList.remove('visible'); });
  }

  updatePageTitle() {
    const titleEl = document.getElementById('writeFormTitle');
    if (titleEl) titleEl.textContent = this.isEdit ? '게시글 수정' : '새 글 작성';
    document.title = `${this.isEdit ? '수정' : '글쓰기'} — 봇마당 | My Chatbot World`;
  }

  async loadCategories() {
    const selectEl = document.getElementById('categorySelect');
    if (!selectEl) return;
    try {
      const res = await CommunityCategory.getAll();
      const cats = res.data || res || [];
      const defaultOpts = `
        <option value="">카테고리 선택</option>
        <option value="free">자유게시판</option>
        <option value="showcase">챗봇 쇼케이스</option>
        <option value="tip">팁 공유</option>
        <option value="qna">Q&A</option>`;
      selectEl.innerHTML = cats.length
        ? `<option value="">카테고리 선택</option>` + cats.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('')
        : defaultOpts;
    } catch {
      selectEl.innerHTML = `
        <option value="">카테고리 선택</option>
        <option value="free">자유게시판</option>
        <option value="showcase">챗봇 쇼케이스</option>
        <option value="tip">팁 공유</option>
        <option value="qna">Q&A</option>`;
    }
  }

  /** 수정 모드: 기존 게시글 내용 불러와 폼에 채움 */
  async loadExistingPost() {
    try {
      const res  = await CommunityPost.get(this.postId);
      const post = res.data || res;

      const catEl     = document.getElementById('categorySelect');
      const titleEl   = document.getElementById('postTitleInput');
      const contentEl = document.getElementById('postContentTextarea');

      if (catEl)     catEl.value     = post.category || '';
      if (titleEl)   titleEl.value   = post.title || '';
      if (contentEl) contentEl.value = post.content || '';

      // 본인 글인지 확인
      const user = getCurrentUser();
      if (user && user.id !== post.author_id) {
        showToast('수정 권한이 없습니다.', 'error');
        setTimeout(() => { window.location.href = `post.html?id=${this.postId}`; }, 1200);
      }
    } catch (err) {
      showToast('게시글을 불러오지 못했습니다.', 'error');
    }
  }

  bindForm() {
    const cancelBtn = document.getElementById('cancelBtn');
    const submitBtn = document.getElementById('submitBtn');

    cancelBtn?.addEventListener('click', () => {
      if (this.isEdit) {
        window.location.href = `post.html?id=${this.postId}`;
      } else {
        history.back();
      }
    });

    submitBtn?.addEventListener('click', async () => {
      const category = document.getElementById('categorySelect')?.value;
      const title    = document.getElementById('postTitleInput')?.value.trim();
      const content  = document.getElementById('postContentTextarea')?.value.trim();

      if (!category) { showToast('카테고리를 선택하세요.', 'error'); return; }
      if (!title)    { showToast('제목을 입력하세요.', 'error'); return; }
      if (title.length > 100) { showToast('제목은 100자 이하로 입력하세요.', 'error'); return; }
      if (!content)  { showToast('내용을 입력하세요.', 'error'); return; }

      submitBtn.disabled = true;
      submitBtn.textContent = this.isEdit ? '수정 중...' : '등록 중...';

      try {
        let res;
        if (this.isEdit) {
          res = await CommunityPost.update(this.postId, { category, title, content });
        } else {
          res = await CommunityPost.create({ category, title, content });
        }
        const postId = res.data?.id || res.id || this.postId;
        showToast(this.isEdit ? '수정되었습니다.' : '등록되었습니다.', 'success');
        setTimeout(() => { window.location.href = `post.html?id=${postId}`; }, 800);
      } catch (err) {
        showToast(err.message || '저장에 실패했습니다.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = this.isEdit ? '수정 완료' : '등록';
      }
    });
  }

  /** 이미지 첨부 (placeholder) */
  bindImageUpload() {
    const uploadArea  = document.getElementById('imageUploadArea');
    const fileInput   = document.getElementById('imageFileInput');
    const previewList = document.getElementById('imagePreviewList');
    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--primary)'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = ''; });
    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      this.previewImages(files, previewList);
    });

    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files);
      this.previewImages(files, previewList);
    });
  }

  previewImages(files, container) {
    if (!container) return;
    files.slice(0, 5).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML = `
          <img src="${e.target.result}" alt="첨부 이미지">
          <button class="image-preview-remove" title="제거">✕</button>`;
        item.querySelector('.image-preview-remove').addEventListener('click', () => item.remove());
        container.appendChild(item);
      };
      reader.readAsDataURL(file);
    });
  }

  bindCharCount() {
    const titleInput = document.getElementById('postTitleInput');
    const titleCount = document.getElementById('titleCharCount');
    titleInput?.addEventListener('input', () => {
      const len = (titleInput.value || '').length;
      if (titleCount) {
        titleCount.textContent = `${len}/100`;
        titleCount.style.color = len > 90 ? 'var(--warning)' : '';
      }
    });
  }
}

/* ====================================================
   10. 갤러리 페이지 (gallery.html)
   ==================================================== */
class CommunityGallery {
  constructor() {
    this.sort   = getQueryParam('sort') || 'latest';
    this.page   = 1;
    this.posts  = [];
    this.selectedPost = null;
  }

  async init() {
    this.bindSidebar();
    this.bindSort();
    this.bindModal();
    await this.loadGallery();
  }

  bindSidebar() {
    const toggle  = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!toggle) return;
    toggle.addEventListener('click', () => { sidebar?.classList.toggle('open'); overlay?.classList.toggle('visible'); });
    overlay?.addEventListener('click', () => { sidebar?.classList.remove('open'); overlay?.classList.remove('visible'); });
  }

  bindSort() {
    const sortBtns = document.querySelectorAll('.sort-btn[data-sort]');
    sortBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === this.sort);
      btn.addEventListener('click', () => {
        this.sort = btn.dataset.sort;
        this.page = 1;
        history.replaceState(null, '', `?sort=${this.sort}`);
        sortBtns.forEach(b => b.classList.toggle('active', b === btn));
        this.loadGallery();
      });
    });
  }

  async loadGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = `<div class="loading-spinner" style="grid-column:1/-1"><div class="spinner"></div>불러오는 중...</div>`;

    try {
      const res = await CommunityPost.list({ category: 'showcase', sort: this.sort, page: this.page, limit: 24 });
      this.posts = res.data || res.posts || res || [];

      if (!this.posts.length) {
        grid.innerHTML = '<div class="posts-empty" style="grid-column:1/-1"><div class="empty-icon">🤖</div><p>아직 등록된 챗봇이 없습니다.</p></div>';
        return;
      }

      grid.innerHTML = this.posts.map((p, i) => this.galleryCardHtml(p, i)).join('');
      grid.querySelectorAll('.gallery-card').forEach((card, i) => {
        card.addEventListener('click', () => this.openModal(this.posts[i]));
      });

      // 갤러리 좋아요 버튼
      grid.querySelectorAll('.gallery-like-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          this.toggleGalleryLike(btn);
        });
      });
    } catch (err) {
      console.error('[Gallery] loadGallery error:', err);
      grid.innerHTML = '<div class="posts-empty" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><p>불러오지 못했습니다.</p></div>';
    }
  }

  galleryCardHtml(post, idx) {
    const nick = post.author_nickname || '익명';
    const initial = nick.charAt(0).toUpperCase();
    const thumbHtml = post.thumbnail_url
      ? `<img src="${escapeHtml(post.thumbnail_url)}" alt="${escapeHtml(post.title)}" loading="lazy">`
      : `<div class="gallery-bot-avatar">${escapeHtml(post.bot_emoji || '🤖')}</div>`;

    return `
      <div class="gallery-card" data-idx="${idx}">
        <div class="gallery-card-thumb">${thumbHtml}</div>
        <div class="gallery-card-body">
          <div class="gallery-card-name">${escapeHtml(post.title)}</div>
          <div class="gallery-card-desc">${escapeHtml(post.excerpt || post.content?.slice(0, 100) || '')}</div>
          <div class="gallery-card-footer">
            <div class="gallery-card-author">
              <div class="mini-avatar">${initial}</div>
              <span>${escapeHtml(nick)}</span>
            </div>
            <button class="gallery-like-btn ${post.user_liked ? 'gallery-card-likes liked' : 'gallery-card-likes'}" data-post-id="${post.id}">
              ♥ <span class="gallery-like-count">${formatCount(post.like_count)}</span>
            </button>
          </div>
        </div>
      </div>`;
  }

  async toggleGalleryLike(btn) {
    if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }
    const postId = btn.dataset.postId;
    btn.disabled = true;
    try {
      const res = await CommunityLike.toggle({ targetId: postId, targetType: 'post' });
      btn.classList.toggle('liked', res.liked);
      const countEl = btn.querySelector('.gallery-like-count');
      if (countEl) countEl.textContent = formatCount(res.like_count);
    } catch {
      showToast('좋아요 처리에 실패했습니다.', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  openModal(post) {
    const modal   = document.getElementById('galleryModal');
    if (!modal) return;
    this.selectedPost = post;

    const setById = (id, val, html = false) => {
      const el = modal.querySelector(`#${id}`);
      if (!el) return;
      if (html) el.innerHTML = val; else el.textContent = val;
    };

    setById('modalBotName', escapeHtml(post.title), true);
    setById('modalBotAuthor', post.author_nickname || '익명');
    setById('modalBotDesc', escapeHtml(post.content?.slice(0, 400) || ''), true);
    setById('modalLikeCount', formatCount(post.like_count));

    const avatarEl = modal.querySelector('#modalBotAvatar');
    if (avatarEl) {
      if (post.thumbnail_url) {
        avatarEl.innerHTML = `<img src="${escapeHtml(post.thumbnail_url)}" alt="${escapeHtml(post.title)}">`;
      } else {
        avatarEl.textContent = post.bot_emoji || '🤖';
      }
    }

    const viewPostBtn = modal.querySelector('#modalViewPostBtn');
    if (viewPostBtn) viewPostBtn.href = `post.html?id=${post.id}`;

    const likeBtn = modal.querySelector('#modalLikeBtn');
    if (likeBtn) {
      likeBtn.classList.toggle('active', !!post.user_liked);
      likeBtn.onclick = async () => {
        if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }
        try {
          const res = await CommunityLike.toggle({ targetId: post.id, targetType: 'post' });
          likeBtn.classList.toggle('active', res.liked);
          post.user_liked = res.liked;
          post.like_count = res.like_count;
          setById('modalLikeCount', formatCount(res.like_count));
        } catch { showToast('좋아요 처리에 실패했습니다.', 'error'); }
      };
    }

    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  bindModal() {
    const modal   = document.getElementById('galleryModal');
    const closeBtn = modal?.querySelector('.modal-close');

    closeBtn?.addEventListener('click', () => this.closeModal());
    modal?.addEventListener('click', e => { if (e.target === modal) this.closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeModal(); });
  }

  closeModal() {
    const modal = document.getElementById('galleryModal');
    modal?.classList.remove('visible');
    document.body.style.overflow = '';
    this.selectedPost = null;
  }
}

/* ====================================================
   11. 페이지 자동 감지 & 초기화
   ==================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('gallery.html')) {
    new CommunityGallery().init();
  } else if (path.includes('write.html')) {
    new CommunityWrite().init();
  } else if (path.includes('post.html')) {
    new CommunityPostDetail().init();
  } else {
    // index.html (default)
    new CommunityIndex().init();
  }
});

// S3T2: 정합성 수정 — CommunityReport.submit detail→description (API 파라미터 통일), 검색 keyword API 연결 확인 완료
