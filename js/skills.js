// @task S3F12
// @description Skills(스킬장터) 마켓플레이스 — 카드 그리드, 필터, 검색, 정렬, 프리셋 설치

(function () {
  'use strict';

  /* ── 전역 상태 ── */
  const state = {
    allSkills: [],
    filtered: [],
    activeCategory: 'all',
    searchQuery: '',
    sortBy: 'popular',
    showFreeOnly: false,
  };

  /* ── 카테고리 목록 (MCW.skills의 category 값 기반) ── */
  const CATEGORIES = ['전체', '분석', '보안', '관리', '지식', 'UI', '비즈니스', '연동'];

  /* ── 현재 봇 ID 조회 ── */
  function getCurrentBotId() {
    const current = localStorage.getItem('mcw_current_bot');
    if (current) return current;
    const bots = JSON.parse(localStorage.getItem('mcw_bots') || '[]');
    return bots.length > 0 ? bots[0].id : 'default';
  }

  /* ── 현재 봇의 첫 번째 페르소나 ID ── */
  function getCurrentPersonaId() {
    const botId = getCurrentBotId();
    const bots = JSON.parse(localStorage.getItem('mcw_bots') || '[]');
    const bot = bots.find(b => b.id === botId);
    if (bot && bot.personas && bot.personas.length > 0) return bot.personas[0].id;
    return 'default';
  }

  /* ── 설치된 스킬 목록 ── */
  function getInstalledSkills() {
    const botId = getCurrentBotId();
    const personaId = getCurrentPersonaId();
    return JSON.parse(localStorage.getItem(`mcw_skills_${botId}_${personaId}`) || '[]');
  }

  /* ── 스킬 설치 / 제거 ── */
  function installSkill(skillId) {
    const botId = getCurrentBotId();
    const personaId = getCurrentPersonaId();
    const key = `mcw_skills_${botId}_${personaId}`;
    const installed = JSON.parse(localStorage.getItem(key) || '[]');
    if (!installed.includes(skillId)) {
      installed.push(skillId);
      localStorage.setItem(key, JSON.stringify(installed));
    }
  }

  function removeSkill(skillId) {
    const botId = getCurrentBotId();
    const personaId = getCurrentPersonaId();
    const key = `mcw_skills_${botId}_${personaId}`;
    const installed = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = installed.filter(id => id !== skillId);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  function isInstalled(skillId) {
    return getInstalledSkills().includes(skillId);
  }

  /* ── 필터 + 정렬 ── */
  function applyFilters() {
    let list = [...state.allSkills];

    // 카테고리
    if (state.activeCategory !== 'all' && state.activeCategory !== '전체') {
      list = list.filter(s => s.category === state.activeCategory);
    }

    // 검색
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }

    // 무료/유료
    if (state.showFreeOnly) {
      list = list.filter(s => s.isFree);
    }

    // 정렬
    if (state.sortBy === 'popular') {
      list.sort((a, b) => (b.installs || 0) - (a.installs || 0));
    } else if (state.sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (state.sortBy === 'price-asc') {
      list.sort((a, b) => {
        const pa = a.isFree ? 0 : (a.price || 0);
        const pb = b.isFree ? 0 : (b.price || 0);
        return pa - pb;
      });
    } else if (state.sortBy === 'price-desc') {
      list.sort((a, b) => {
        const pa = a.isFree ? 0 : (a.price || 0);
        const pb = b.isFree ? 0 : (b.price || 0);
        return pb - pa;
      });
    }

    state.filtered = list;
    renderGrid();
  }

  /* ── 스킬 카드 HTML ── */
  function buildSkillCard(skill) {
    const installed = isInstalled(skill.id);
    const priceLabel = skill.isFree ? '<span class="sk-price free">무료</span>' :
      `<span class="sk-price paid">₩${(skill.price || 0).toLocaleString()}</span>`;
    const stars = buildStars(skill.rating || 0);
    const btnClass = installed ? 'sk-btn sk-btn--remove' : 'sk-btn sk-btn--install';
    const btnLabel = installed ? '제거' : '설치';

    return `
      <div class="sk-card" data-skill-id="${skill.id}">
        <a class="sk-card-link" href="detail.html?id=${skill.id}" aria-label="${skill.name} 상세 보기">
          <div class="sk-card-top">
            <span class="sk-icon">${skill.icon}</span>
            <span class="sk-cat">${skill.category}</span>
          </div>
          <h3 class="sk-name">${skill.name}</h3>
          <p class="sk-desc">${skill.description}</p>
          <div class="sk-meta">
            <span class="sk-stars" aria-label="평점 ${skill.rating}">${stars} <span class="sk-rating">${(skill.rating || 0).toFixed(1)}</span></span>
            <span class="sk-installs">${(skill.installs || 0).toLocaleString()}회 설치</span>
          </div>
        </a>
        <div class="sk-card-footer">
          ${priceLabel}
          <button class="${btnClass}" data-skill-id="${skill.id}"
            aria-label="${skill.name} ${btnLabel}">${btnLabel}</button>
        </div>
      </div>`;
  }

  function buildStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  }

  /* ── 그리드 렌더링 ── */
  function renderGrid() {
    const grid = document.getElementById('skillsGrid');
    const empty = document.getElementById('skillsEmpty');
    const countEl = document.getElementById('skillsCount');
    if (!grid) return;

    if (state.filtered.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      if (countEl) countEl.textContent = '0';
      return;
    }

    if (empty) empty.hidden = true;
    if (countEl) countEl.textContent = state.filtered.length;
    grid.innerHTML = state.filtered.map(buildSkillCard).join('');

    // 설치/제거 버튼 이벤트
    grid.querySelectorAll('.sk-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.skillId;
        const skill = state.allSkills.find(s => s.id === id);
        if (!skill) return;

        if (isInstalled(id)) {
          removeSkill(id);
          showToast(`"${skill.name}" 스킬을 제거했습니다.`);
        } else {
          if (!skill.isFree) {
            // 유료: 구매 모달
            openPurchaseModal(skill);
            return;
          }
          installSkill(id);
          showToast(`"${skill.name}" 스킬을 설치했습니다!`);
        }
        // 버튼 상태 토글 (재렌더링 없이)
        refreshCard(id);
      });
    });
  }

  /* ── 카드 버튼 상태만 갱신 ── */
  function refreshCard(skillId) {
    const card = document.querySelector(`.sk-card[data-skill-id="${skillId}"]`);
    if (!card) return;
    const btn = card.querySelector('.sk-btn');
    if (!btn) return;
    const installed = isInstalled(skillId);
    btn.className = installed ? 'sk-btn sk-btn--remove' : 'sk-btn sk-btn--install';
    btn.textContent = installed ? '제거' : '설치';
  }

  /* ── 구매 모달 ── */
  function openPurchaseModal(skill) {
    const modal = document.getElementById('purchaseModal');
    if (!modal) return;
    document.getElementById('modalSkillName').textContent = skill.name;
    document.getElementById('modalSkillPrice').textContent = `₩${(skill.price || 0).toLocaleString()}`;
    document.getElementById('modalSkillIcon').textContent = skill.icon;
    modal.hidden = false;
    modal.dataset.skillId = skill.id;
    document.getElementById('modalConfirmBtn').focus();
  }

  function closePurchaseModal() {
    const modal = document.getElementById('purchaseModal');
    if (modal) modal.hidden = true;
  }

  /* ── 프리셋 설치 ── */
  function installPreset(presetKey) {
    const preset = (window.MCW && MCW.skillPresets) ? MCW.skillPresets[presetKey] : null;
    if (!preset) return;
    let count = 0;
    preset.skills.forEach(id => {
      if (!isInstalled(id)) {
        installSkill(id);
        count++;
      }
    });
    renderGrid();
    showToast(count > 0
      ? `"${preset.label}" 프리셋 ${count}개 스킬을 설치했습니다!`
      : `"${preset.label}" 스킬이 이미 모두 설치되어 있습니다.`
    );
  }

  /* ── 카테고리 필터 칩 ── */
  function renderCategoryChips() {
    const bar = document.getElementById('categoryBar');
    if (!bar) return;
    bar.innerHTML = CATEGORIES.map(cat => {
      const val = cat === '전체' ? 'all' : cat;
      const active = state.activeCategory === val ? ' sk-chip--active' : '';
      return `<button class="sk-chip${active}" data-cat="${val}">${cat}</button>`;
    }).join('');

    bar.querySelectorAll('.sk-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.cat;
        bar.querySelectorAll('.sk-chip').forEach(b => b.classList.remove('sk-chip--active'));
        btn.classList.add('sk-chip--active');
        applyFilters();
      });
    });
  }

  /* ── Toast ── */
  function showToast(msg) {
    if (window.MCW && MCW.showToast) {
      MCW.showToast(msg);
      return;
    }
    const el = document.getElementById('skillsToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.hidden = true; }, 3000);
  }

  /* ── 초기화 ── */
  function init() {
    // MCW.skills 로드 대기
    const skills = (window.MCW && MCW.skills) ? MCW.skills : [];
    state.allSkills = skills;

    renderCategoryChips();
    applyFilters();

    // 검색
    const searchInput = document.getElementById('skillsSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.searchQuery = searchInput.value.trim();
        applyFilters();
      });
    }

    // 정렬
    const sortSelect = document.getElementById('skillsSort');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        state.sortBy = sortSelect.value;
        applyFilters();
      });
    }

    // 무료 토글
    const freeToggle = document.getElementById('freeOnlyToggle');
    if (freeToggle) {
      freeToggle.addEventListener('change', () => {
        state.showFreeOnly = freeToggle.checked;
        applyFilters();
      });
    }

    // 프리셋 버튼
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        installPreset(btn.dataset.preset);
      });
    });

    // 구매 모달 확인
    const confirmBtn = document.getElementById('modalConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const modal = document.getElementById('purchaseModal');
        const id = modal && modal.dataset.skillId;
        const skill = id && state.allSkills.find(s => s.id === id);
        if (skill) {
          installSkill(id);
          showToast(`"${skill.name}" 구매 완료! 스킬이 설치되었습니다.`);
          closePurchaseModal();
          refreshCard(id);
        }
      });
    }

    // 구매 모달 취소
    const cancelBtn = document.getElementById('modalCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closePurchaseModal);

    // 모달 배경 클릭
    const modal = document.getElementById('purchaseModal');
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) closePurchaseModal();
      });
    }

    // ESC 키
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePurchaseModal();
    });

    // 마이스킬 링크
    const mySkillsLink = document.getElementById('mySkillsLink');
    if (mySkillsLink) {
      const count = getInstalledSkills().length;
      const badge = mySkillsLink.querySelector('.my-skills-badge');
      if (badge) badge.textContent = count;
    }
  }

  // DOM 준비 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 외부 접근용
  window.SkillsApp = { installSkill, removeSkill, isInstalled, installPreset, getInstalledSkills };
})();
