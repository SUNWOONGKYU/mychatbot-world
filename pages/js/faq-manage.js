// @task S3F2
// @description FAQ 관리 스크립트 — 봇 소유자용 FAQ CRUD (Supabase bots.faq JSONB 컬럼)

(function () {
  'use strict';

  /* ============================================================
     상수 & 환경 변수
     ============================================================ */

  // Supabase 설정 — 환경 변수에서 읽음 (하드코딩 금지)
  // Vercel 배포 시 VERCEL_ENV, 로컬 개발 시 window.__ENV__ 주입 필요
  const SUPABASE_URL = (typeof window.__ENV__ !== 'undefined' && window.__ENV__.SUPABASE_URL)
    || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL)
    || '';

  const SUPABASE_ANON_KEY = (typeof window.__ENV__ !== 'undefined' && window.__ENV__.SUPABASE_ANON_KEY)
    || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY)
    || '';

  // FAQ 유효성 제한
  const MAX_QUESTION_LEN = 200;
  const MAX_ANSWER_LEN = 1000;
  const MAX_FAQ_COUNT = 50;

  /* ============================================================
     상태
     ============================================================ */
  let supabaseClient = null;
  let currentUser = null;
  let botId = null;
  let botData = null;          // bots 테이블 row
  let faqItems = [];           // 현재 편집 중인 FAQ 배열 (복사본)
  let pendingDeleteIndex = null; // 삭제 확인 대기 중인 인덱스

  /* ============================================================
     초기화
     ============================================================ */

  /**
   * DOMContentLoaded 진입점
   */
  async function init() {
    // 1. URL 파라미터에서 botId 추출
    botId = getBotIdFromUrl();
    if (!botId) {
      showFatalError('URL에 botId 파라미터가 없습니다. 올바른 링크로 접근해 주세요.');
      return;
    }

    // 2. Supabase 초기화
    if (!initSupabase()) {
      showFatalError('Supabase 설정이 누락되었습니다. 환경 변수를 확인해 주세요.');
      return;
    }

    // 3. 인증 상태 확인
    const authenticated = await checkAuth();
    if (!authenticated) return;

    // 4. 봇 데이터 로드 + 소유자 확인
    await loadBotAndFaq();
  }

  /**
   * URL query string에서 botId 추출
   * @returns {string|null}
   */
  function getBotIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('botId') || params.get('id') || '';
    return id.trim() || null;
  }

  /**
   * Supabase 클라이언트 초기화
   * @returns {boolean} 성공 여부
   */
  function initSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[FaqManage] SUPABASE_URL 또는 SUPABASE_ANON_KEY 미설정');
      return false;
    }
    try {
      // @supabase/supabase-js CDN 전역 변수 사용
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return true;
    } catch (err) {
      console.error('[FaqManage] Supabase 클라이언트 초기화 실패:', err);
      return false;
    }
  }

  /* ============================================================
     인증 확인
     ============================================================ */

  /**
   * 현재 로그인 상태를 확인하고, 미로그인 시 인증 에러 화면을 표시한다.
   * @returns {Promise<boolean>}
   */
  async function checkAuth() {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error || !session) {
        showAuthError();
        return false;
      }
      currentUser = session.user;
      return true;
    } catch (err) {
      console.error('[FaqManage] 인증 확인 실패:', err);
      showAuthError();
      return false;
    }
  }

  /* ============================================================
     봇 데이터 로드 (bots 테이블)
     ============================================================ */

  /**
   * bots 테이블에서 봇 데이터를 가져오고,
   * 소유자 여부를 확인한 후 FAQ를 화면에 렌더링한다.
   */
  async function loadBotAndFaq() {
    showSkeleton(true);
    hideStatus();

    try {
      const { data, error } = await supabaseClient
        .from('bots')
        .select('id, name, owner_id, faq')
        .eq('id', botId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('봇을 찾을 수 없습니다. botId를 확인해 주세요.');
        }
        throw new Error(error.message || 'DB 조회 실패');
      }

      // 소유자 확인
      if (data.owner_id !== currentUser.id) {
        showAuthError('이 봇의 소유자가 아닙니다.');
        return;
      }

      botData = data;
      faqItems = Array.isArray(data.faq) ? JSON.parse(JSON.stringify(data.faq)) : [];

      // 헤더 봇 이름 업데이트
      updateHeaderBotName(botData.name || botId);

      showSkeleton(false);
      renderFaqList();
      enableAddButton(true);

    } catch (err) {
      console.error('[FaqManage] 봇 데이터 로드 실패:', err);
      showSkeleton(false);
      showStatus('error', 'FAQ를 불러오지 못했습니다: ' + err.message);
    }
  }

  /* ============================================================
     FAQ CRUD
     ============================================================ */

  /**
   * FAQ 항목 추가
   * @param {string} question
   * @param {string} answer
   * @returns {Promise<boolean>}
   */
  async function addFaq(question, answer) {
    if (faqItems.length >= MAX_FAQ_COUNT) {
      showStatus('error', `FAQ는 최대 ${MAX_FAQ_COUNT}개까지 등록할 수 있습니다.`);
      return false;
    }

    const newItem = {
      id: generateId(),
      question: question.trim(),
      answer: answer.trim(),
      created_at: new Date().toISOString()
    };

    const updated = [...faqItems, newItem];
    const ok = await persistFaq(updated);
    if (ok) {
      faqItems = updated;
      renderFaqList();
      showStatus('success', 'FAQ가 추가되었습니다.');
    }
    return ok;
  }

  /**
   * FAQ 항목 수정
   * @param {number} index  faqItems 배열 인덱스
   * @param {string} question
   * @param {string} answer
   * @returns {Promise<boolean>}
   */
  async function updateFaq(index, question, answer) {
    if (index < 0 || index >= faqItems.length) {
      showStatus('error', '잘못된 항목입니다.');
      return false;
    }

    const updated = faqItems.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        question: question.trim(),
        answer: answer.trim(),
        updated_at: new Date().toISOString()
      };
    });

    const ok = await persistFaq(updated);
    if (ok) {
      faqItems = updated;
      renderFaqList();
      showStatus('success', 'FAQ가 수정되었습니다.');
    }
    return ok;
  }

  /**
   * FAQ 항목 삭제
   * @param {number} index  faqItems 배열 인덱스
   * @returns {Promise<boolean>}
   */
  async function deleteFaq(index) {
    if (index < 0 || index >= faqItems.length) {
      showStatus('error', '잘못된 항목입니다.');
      return false;
    }

    const updated = faqItems.filter((_, i) => i !== index);
    const ok = await persistFaq(updated);
    if (ok) {
      faqItems = updated;
      renderFaqList();
      showStatus('success', 'FAQ가 삭제되었습니다.');
    }
    return ok;
  }

  /**
   * bots 테이블의 faq 컬럼을 업데이트한다 (Supabase RLS 준수).
   * @param {Array} faqArray  저장할 FAQ 배열
   * @returns {Promise<boolean>}
   */
  async function persistFaq(faqArray) {
    try {
      const { error } = await supabaseClient
        .from('bots')
        .update({ faq: faqArray, updated_at: new Date().toISOString() })
        .eq('id', botId)
        .eq('owner_id', currentUser.id); // Row-Level Security 이중 보호

      if (error) throw new Error(error.message || 'FAQ 저장 실패');
      return true;
    } catch (err) {
      console.error('[FaqManage] FAQ 저장 실패:', err);
      showStatus('error', 'FAQ 저장에 실패했습니다: ' + err.message);
      return false;
    }
  }

  /* ============================================================
     유효성 검사
     ============================================================ */

  /**
   * 질문/답변 입력값을 검사한다.
   * @param {string} question
   * @param {string} answer
   * @returns {{ valid: boolean, message?: string }}
   */
  function validateFaqInput(question, answer) {
    const q = question.trim();
    const a = answer.trim();

    if (!q) return { valid: false, message: '질문을 입력해 주세요.' };
    if (!a) return { valid: false, message: '답변을 입력해 주세요.' };
    if (q.length > MAX_QUESTION_LEN) {
      return { valid: false, message: `질문은 ${MAX_QUESTION_LEN}자 이하로 입력해 주세요.` };
    }
    if (a.length > MAX_ANSWER_LEN) {
      return { valid: false, message: `답변은 ${MAX_ANSWER_LEN}자 이하로 입력해 주세요.` };
    }
    return { valid: true };
  }

  /* ============================================================
     UI 렌더링
     ============================================================ */

  /**
   * FAQ 카드 목록을 DOM에 렌더링한다.
   */
  function renderFaqList() {
    const listEl = document.getElementById('faqList');
    const emptyEl = document.getElementById('faqEmpty');
    if (!listEl || !emptyEl) return;

    if (faqItems.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.add('show');
      return;
    }

    emptyEl.classList.remove('show');
    listEl.innerHTML = faqItems.map((item, idx) => renderFaqCard(item, idx)).join('');
  }

  /**
   * 개별 FAQ 카드 HTML을 반환한다.
   * @param {{ question: string, answer: string }} item
   * @param {number} idx
   * @returns {string}
   */
  function renderFaqCard(item, idx) {
    const safeQ = escapeHtml(item.question || '');
    const safeA = escapeHtml(item.answer || '');
    const orderNum = idx + 1;
    return `
      <div class="faq-card" role="listitem" aria-label="FAQ ${orderNum}번">
        <span class="faq-card-order">#${orderNum}</span>
        <div class="faq-card-q">
          <span class="faq-label-q">Q</span>
          <p class="faq-question-text">${safeQ}</p>
        </div>
        <div class="faq-card-a">
          <span class="faq-label-a">A</span>
          <p class="faq-answer-text">${safeA}</p>
        </div>
        <div class="faq-card-actions">
          <button class="btn-faq-edit" onclick="openEditModal(${idx})" aria-label="FAQ ${orderNum}번 수정">
            수정
          </button>
          <button class="btn-faq-delete" onclick="openDeleteConfirm(${idx})" aria-label="FAQ ${orderNum}번 삭제">
            삭제
          </button>
        </div>
      </div>
    `;
  }

  /* ============================================================
     모달 — 추가/수정 폼
     ============================================================ */

  /**
   * FAQ 추가 모달을 연다.
   */
  function openAddModal() {
    const modal = document.getElementById('faqFormModal');
    const title = document.getElementById('modalTitle');
    const editingIdx = document.getElementById('editingIndex');
    const inputQ = document.getElementById('inputQuestion');
    const inputA = document.getElementById('inputAnswer');

    if (!modal) return;

    title.textContent = 'FAQ 추가';
    editingIdx.value = '';
    inputQ.value = '';
    inputA.value = '';
    clearFieldErrors();
    updateCharCount('inputQuestion', 'questionCharCount', MAX_QUESTION_LEN);
    updateCharCount('inputAnswer', 'answerCharCount', MAX_ANSWER_LEN);

    modal.classList.add('show');
    setTimeout(() => inputQ.focus(), 120);
  }

  /**
   * FAQ 수정 모달을 연다.
   * @param {number} index
   */
  function openEditModal(index) {
    const item = faqItems[index];
    if (!item) return;

    const modal = document.getElementById('faqFormModal');
    const title = document.getElementById('modalTitle');
    const editingIdx = document.getElementById('editingIndex');
    const inputQ = document.getElementById('inputQuestion');
    const inputA = document.getElementById('inputAnswer');

    if (!modal) return;

    title.textContent = 'FAQ 수정';
    editingIdx.value = String(index);
    inputQ.value = item.question || '';
    inputA.value = item.answer || '';
    clearFieldErrors();
    updateCharCount('inputQuestion', 'questionCharCount', MAX_QUESTION_LEN);
    updateCharCount('inputAnswer', 'answerCharCount', MAX_ANSWER_LEN);

    modal.classList.add('show');
    setTimeout(() => inputQ.focus(), 120);
  }

  /**
   * FAQ 폼 모달을 닫는다.
   */
  function closeFormModal() {
    const modal = document.getElementById('faqFormModal');
    if (modal) modal.classList.remove('show');
    clearFieldErrors();
  }

  /**
   * 폼 저장 버튼 핸들러 (추가 또는 수정 분기)
   */
  async function saveFaq() {
    const editingIdx = document.getElementById('editingIndex');
    const inputQ = document.getElementById('inputQuestion');
    const inputA = document.getElementById('inputAnswer');
    const btnSave = document.getElementById('btnSave');

    const question = (inputQ ? inputQ.value : '').trim();
    const answer = (inputA ? inputA.value : '').trim();

    // 유효성 검사
    const validation = validateFaqInput(question, answer);
    if (!validation.valid) {
      // 빈 필드 강조
      if (!question) inputQ && inputQ.classList.add('invalid');
      if (!answer) inputA && inputA.classList.add('invalid');
      showStatus('error', validation.message);
      return;
    }

    clearFieldErrors();
    setSaveButtonLoading(true);

    let ok = false;
    const idxStr = editingIdx ? editingIdx.value : '';

    if (idxStr !== '') {
      // 수정
      ok = await updateFaq(parseInt(idxStr, 10), question, answer);
    } else {
      // 추가
      ok = await addFaq(question, answer);
    }

    setSaveButtonLoading(false);

    if (ok) {
      closeFormModal();
    }
  }

  /* ============================================================
     모달 — 삭제 확인
     ============================================================ */

  /**
   * 삭제 확인 모달을 연다.
   * @param {number} index
   */
  function openDeleteConfirm(index) {
    const item = faqItems[index];
    if (!item) return;

    pendingDeleteIndex = index;

    const modal = document.getElementById('faqConfirmModal');
    const preview = document.getElementById('confirmQuestionPreview');

    if (preview) preview.textContent = item.question || '';
    if (modal) modal.classList.add('show');
  }

  /**
   * 삭제 확인 모달을 닫는다.
   */
  function closeConfirmModal() {
    pendingDeleteIndex = null;
    const modal = document.getElementById('faqConfirmModal');
    if (modal) modal.classList.remove('show');
  }

  /**
   * 삭제 확정 핸들러
   */
  async function confirmDelete() {
    if (pendingDeleteIndex === null) return;

    const btnDel = document.getElementById('btnConfirmDelete');
    if (btnDel) {
      btnDel.disabled = true;
      btnDel.textContent = '삭제 중...';
    }

    const ok = await deleteFaq(pendingDeleteIndex);

    if (btnDel) {
      btnDel.disabled = false;
      btnDel.textContent = '삭제';
    }

    if (ok) {
      closeConfirmModal();
    }
  }

  /* ============================================================
     UI 헬퍼
     ============================================================ */

  function showSkeleton(show) {
    const el = document.getElementById('loadingSkeleton');
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  function showAuthError(message) {
    showSkeleton(false);
    const el = document.getElementById('authError');
    if (!el) return;
    el.classList.add('show');
    if (message) {
      const desc = el.querySelector('.faq-auth-desc');
      if (desc) desc.textContent = message;
    }
    enableAddButton(false);
  }

  function showStatus(type, message) {
    const bar = document.getElementById('statusBar');
    if (!bar) return;
    bar.className = 'faq-status-bar show ' + type;
    bar.textContent = message;

    // 성공 메시지는 3초 후 자동 소거
    if (type === 'success') {
      setTimeout(() => {
        bar.classList.remove('show');
      }, 3000);
    }
  }

  function hideStatus() {
    const bar = document.getElementById('statusBar');
    if (bar) bar.classList.remove('show');
  }

  function showFatalError(message) {
    showSkeleton(false);
    showStatus('error', message);
    enableAddButton(false);
  }

  function enableAddButton(enabled) {
    const btn = document.getElementById('openAddModalBtn');
    if (btn) btn.disabled = !enabled;
  }

  function updateHeaderBotName(name) {
    const el = document.getElementById('headerBotName');
    if (el) el.textContent = name;
    document.title = `FAQ 관리 — ${name}`;
  }

  function setSaveButtonLoading(loading) {
    const btn = document.getElementById('btnSave');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? '저장 중...' : '저장';
  }

  function clearFieldErrors() {
    const inputQ = document.getElementById('inputQuestion');
    const inputA = document.getElementById('inputAnswer');
    if (inputQ) inputQ.classList.remove('invalid');
    if (inputA) inputA.classList.remove('invalid');
  }

  /**
   * 글자 수 카운터를 업데이트한다.
   * @param {string} inputId
   * @param {string} counterId
   * @param {number} max
   */
  function updateCharCount(inputId, counterId, max) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;
    const len = input.value.length;
    counter.textContent = `${len} / ${max}`;
    counter.classList.toggle('over', len > max);
  }

  /**
   * 뒤로 가기 — 봇 상세 페이지 또는 이전 히스토리
   */
  function goBack() {
    if (botId) {
      window.location.href = `/pages/bot/index.html?id=${encodeURIComponent(botId)}`;
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }

  /* ============================================================
     유틸
     ============================================================ */

  /**
   * 간단한 고유 ID 생성
   * @returns {string}
   */
  function generateId() {
    return 'faq_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  /**
   * HTML 특수 문자 이스케이프 (XSS 방지)
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ============================================================
     글로벌 함수 노출 (HTML onclick 속성에서 호출)
     ============================================================ */
  window.openAddModal = openAddModal;
  window.openEditModal = openEditModal;
  window.closeFormModal = closeFormModal;
  window.saveFaq = saveFaq;
  window.openDeleteConfirm = openDeleteConfirm;
  window.closeConfirmModal = closeConfirmModal;
  window.confirmDelete = confirmDelete;
  window.goBack = goBack;

  /* ============================================================
     글자 수 카운터 이벤트 바인딩 (DOMContentLoaded 이후)
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    const inputQ = document.getElementById('inputQuestion');
    const inputA = document.getElementById('inputAnswer');

    if (inputQ) {
      inputQ.addEventListener('input', () => {
        updateCharCount('inputQuestion', 'questionCharCount', MAX_QUESTION_LEN);
        if (inputQ.value.trim()) inputQ.classList.remove('invalid');
      });
    }

    if (inputA) {
      inputA.addEventListener('input', () => {
        updateCharCount('inputAnswer', 'answerCharCount', MAX_ANSWER_LEN);
        if (inputA.value.trim()) inputA.classList.remove('invalid');
      });
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const formModal = document.getElementById('faqFormModal');
        const confirmModal = document.getElementById('faqConfirmModal');
        if (confirmModal && confirmModal.classList.contains('show')) {
          closeConfirmModal();
        } else if (formModal && formModal.classList.contains('show')) {
          closeFormModal();
        }
      }
    });

    // 모달 오버레이 클릭 시 닫기
    document.getElementById('faqFormModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeFormModal();
    });
    document.getElementById('faqConfirmModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeConfirmModal();
    });

    // 초기화 실행
    init();
  });

})();
