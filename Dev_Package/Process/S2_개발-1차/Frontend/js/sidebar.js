/**
 * @task S2F8
 * @description 사이드바 메뉴 구성 — 5대 메뉴 카테고리
 * CoCoBot — Sidebar Navigation
 *
 * 5대 메뉴:
 *   1. Birth    (탄생)    — 코코봇 생성, 성격/외형 설정, 아바타
 *   2. Learning (학습)    — FAQ 관리, 학습 커리큘럼, 코코봇스쿨
 *   3. Skills   (스킬장터) — 스킬 목록, 구매/판매, 마이 스킬
 *   4. Jobs     (구봇구직) — 채용 목록, 지원/등록, 매칭
 *   5. Community(봇카페)  — 게시판, 커뮤니티 활동
 */

// escapeHtml is loaded from js/utils.js

const SidebarNav = (() => {

  /* ============================================================
     메뉴 데이터 정의
     링크 경로: pages/{menu-name}/index.html (루트 기준)
  ============================================================ */
  const MENU_DATA = [
    {
      id: 'birth',
      label: 'Birth',
      labelKo: '탄생',
      icon: '🐣',
      href: 'pages/birth/index.html',
      description: '코코봇 탄생',
      children: [
        { label: '코코봇 생성', labelEn: 'Create Bot',      href: 'pages/birth/index.html#create'    },
        { label: '성격 설정', labelEn: 'Persona Setup',   href: 'pages/birth/index.html#persona'   },
        { label: '외형 설정', labelEn: 'Appearance',      href: 'pages/birth/index.html#appearance' },
        { label: '아바타',    labelEn: 'Avatar',           href: 'pages/birth/index.html#avatar'    },
      ],
    },
    {
      id: 'learning',
      label: 'Learning',
      labelKo: '학습',
      icon: '📚',
      href: 'pages/learning/index.html',
      description: '코코봇 교육',
      children: [
        { label: 'FAQ 관리',     labelEn: 'FAQ Manager',      href: 'pages/learning/index.html#faq'        },
        { label: '학습 커리큘럼', labelEn: 'Curriculum',       href: 'pages/learning/index.html#curriculum' },
        { label: '코코봇스쿨',     labelEn: 'Chatbot School',   href: 'pages/learning/index.html#school'     },
        { label: '학습 이력',    labelEn: 'Learning History', href: 'pages/learning/index.html#history'    },
      ],
    },
    {
      id: 'skills',
      label: 'Skills',
      labelKo: '스킬장터',
      icon: '🔧',
      href: 'pages/skills/index.html',
      description: '스킬 거래',
      children: [
        { label: '스킬 목록',  labelEn: 'Skill List',  href: 'pages/skills/index.html#list'   },
        { label: '스킬 구매',  labelEn: 'Buy Skills',  href: 'pages/skills/index.html#buy'    },
        { label: '스킬 판매',  labelEn: 'Sell Skills', href: 'pages/skills/index.html#sell'   },
        { label: '마이 스킬', labelEn: 'My Skills',    href: 'pages/skills/index.html#my'     },
      ],
    },
    {
      id: 'jobs',
      label: 'Jobs',
      labelKo: '구봇구직',
      icon: '💼',
      href: 'pages/jobs/index.html',
      description: '봇 채용',
      children: [
        { label: '채용 목록', labelEn: 'Job Board',     href: 'pages/jobs/index.html#board'   },
        { label: '지원하기', labelEn: 'Apply',          href: 'pages/jobs/index.html#apply'   },
        { label: '등록하기', labelEn: 'Post a Job',     href: 'pages/jobs/index.html#post'    },
        { label: '매칭',     labelEn: 'Bot Matching',   href: 'pages/jobs/index.html#match'   },
      ],
    },
    {
      id: 'community',
      label: 'Community',
      labelKo: '봇카페',
      icon: '🤝',
      href: 'pages/community/index.html',
      description: '커뮤니티',
      children: [
        { label: '게시판',       labelEn: 'Board',       href: 'pages/community/index.html#board'    },
        { label: '노하우 공유',  labelEn: 'Know-how',    href: 'pages/community/index.html#knowhow'  },
        { label: '코코봇 간 협업', labelEn: 'Collaborate', href: 'pages/community/index.html#collab'   },
        { label: '성장 기록',    labelEn: 'Growth Log',  href: 'pages/community/index.html#growth'   },
      ],
    },
  ];

  /* ============================================================
     현재 활성 메뉴 감지
  ============================================================ */
  function getActiveMenuId() {
    const path = window.location.pathname;
    for (const menu of MENU_DATA) {
      if (path.includes(`/pages/${menu.id}/`)) return menu.id;
    }
    return null;
  }

  /* ============================================================
     사이드바 HTML 생성
     @param {string} containerId — 삽입할 요소 ID
     @param {object} options
       - activeMenuId {string}  — 강제 활성 메뉴 ID
       - rootPath    {string}  — 루트 경로 접두사 (예: '../../')
  ============================================================ */
  function render(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[SidebarNav] 컨테이너를 찾을 수 없습니다: #${containerId}`);
      return;
    }

    const activeId = options.activeMenuId || getActiveMenuId();
    const root = options.rootPath || '';

    const navItems = MENU_DATA.map(menu => {
      const isActive = menu.id === activeId;
      const childrenHtml = menu.children.map(child => `
        <li>
          <a href="${escapeHtml(root + child.href)}" class="sidebar-child-link">
            <span class="sidebar-child-label">${escapeHtml(child.label)}</span>
            <span class="sidebar-child-label-en">${escapeHtml(child.labelEn)}</span>
          </a>
        </li>
      `).join('');

      return `
        <li class="sidebar-menu-item ${isActive ? 'active' : ''}">
          <a href="${escapeHtml(root + menu.href)}" class="sidebar-menu-link ${isActive ? 'active' : ''}">
            <span class="sidebar-menu-icon">${escapeHtml(menu.icon)}</span>
            <span class="sidebar-menu-label">
              <span class="sidebar-label-en">${escapeHtml(menu.label)}</span>
              <span class="sidebar-label-ko">${escapeHtml(menu.labelKo)}</span>
            </span>
          </a>
          ${isActive ? `<ul class="sidebar-children">${childrenHtml}</ul>` : ''}
        </li>
      `;
    }).join('');

    container.innerHTML = `
      <nav class="sidebar-nav" aria-label="주 메뉴">
        <ul class="sidebar-menu">
          ${navItems}
        </ul>
      </nav>
    `;
  }

  /* ============================================================
     상단 네비게이션 바 업데이트 (기존 navbar-links 교체)
     @param {string} navLinksId — <ul> 요소 ID (기본: 'navbarLinks')
     @param {object} options
       - rootPath {string} — 루트 경로 접두사
  ============================================================ */
  function renderNavbar(navLinksId, options = {}) {
    const ul = document.getElementById(navLinksId);
    if (!ul) {
      console.warn(`[SidebarNav] 네비바 요소를 찾을 수 없습니다: #${navLinksId}`);
      return;
    }

    const root = options.rootPath || '';
    const activeId = options.activeMenuId || getActiveMenuId();

    ul.innerHTML = MENU_DATA.map(menu => `
      <li>
        <a href="${escapeHtml(root + menu.href)}"
           class="navbar-link ${menu.id === activeId ? 'active' : ''}"
           title="${escapeHtml(menu.label)} — ${escapeHtml(menu.labelKo)}">
          ${escapeHtml(menu.label)}
          <span class="navbar-link-ko">(${escapeHtml(menu.labelKo)})</span>
        </a>
      </li>
    `).join('');
  }

  /* ============================================================
     Public API
  ============================================================ */
  return {
    menus: MENU_DATA,
    render,
    renderNavbar,
    getActiveMenuId,
  };

})();

// 자동 초기화 — data-sidebar-container 속성이 있으면 자동 렌더
document.addEventListener('DOMContentLoaded', () => {
  const autoContainers = document.querySelectorAll('[data-sidebar-container]');
  autoContainers.forEach(el => {
    const rootPath = el.dataset.rootPath || '';
    const activeMenuId = el.dataset.activeMenu || undefined;
    SidebarNav.render(el.id, { rootPath, activeMenuId });
  });

  const autoNavbars = document.querySelectorAll('[data-sidebar-navbar]');
  autoNavbars.forEach(el => {
    const rootPath = el.dataset.rootPath || '';
    SidebarNav.renderNavbar(el.id, { rootPath });
  });
});
