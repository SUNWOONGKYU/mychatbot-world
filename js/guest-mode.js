// @task S2F6 — 게스트 세션/제한 관리
// CoCoBot — Guest Mode Session Manager

(function (global) {
  'use strict';

  // ===== 상수 =====
  const STORAGE_KEYS = {
    SESSION_ID:    'mcw_guest_session_id',
    MESSAGE_COUNT: 'mcw_guest_message_count',
    BOT_ID:        'mcw_guest_bot_id',
    CATEGORY:      'mcw_guest_category',
    BOT_NAME:      'mcw_guest_bot_name',
    EXPIRES_AT:    'mcw_guest_expires_at'
  };

  const MAX_MESSAGES = 10;
  const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

  // ===== 내부 유틸 =====

  /**
   * nanoid 없이 간단한 고유 ID 생성
   * @returns {string}
   */
  function generateId() {
    return 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  /**
   * localStorage에서 값 읽기 (실패 시 null 반환)
   * @param {string} key
   * @returns {string|null}
   */
  function lsGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('[GuestMode] localStorage 읽기 실패:', key, e);
      return null;
    }
  }

  /**
   * localStorage에 값 쓰기 (실패 시 조용히 무시)
   * @param {string} key
   * @param {string} value
   */
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[GuestMode] localStorage 쓰기 실패:', key, e);
    }
  }

  /**
   * localStorage에서 키 삭제
   * @param {string} key
   */
  function lsRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) { /* noop */ }
  }

  // ===== 공개 API =====

  /**
   * 게스트 세션 초기화
   * - 기존 세션이 유효하면 그대로 유지
   * - 만료됐거나 없으면 새 세션 생성
   */
  function initGuestSession() {
    const existingId  = lsGet(STORAGE_KEYS.SESSION_ID);
    const expiresAt   = lsGet(STORAGE_KEYS.EXPIRES_AT);
    const now         = Date.now();

    if (existingId && expiresAt && now < parseInt(expiresAt, 10)) {
      // 기존 유효 세션 유지
      console.log('[GuestMode] 기존 세션 복원:', existingId);
      return existingId;
    }

    // 만료 또는 신규 → 세션 생성
    const newId = generateId();
    const newExpiry = String(now + SESSION_TTL_MS);

    lsSet(STORAGE_KEYS.SESSION_ID,    newId);
    lsSet(STORAGE_KEYS.MESSAGE_COUNT, '0');
    lsSet(STORAGE_KEYS.EXPIRES_AT,    newExpiry);

    // 봇 ID / 카테고리는 유지 (pages/guest/index.html에서 이미 설정)
    console.log('[GuestMode] 새 세션 생성:', newId);
    return newId;
  }

  /**
   * 현재 메시지 카운트 조회
   * @returns {number}
   */
  function getMessageCount() {
    return parseInt(lsGet(STORAGE_KEYS.MESSAGE_COUNT) || '0', 10);
  }

  /**
   * 메시지 한도 도달 여부 확인
   * @returns {boolean} true = 한도 초과 (전송 불가)
   */
  function checkMessageLimit() {
    return getMessageCount() >= MAX_MESSAGES;
  }

  /**
   * 메시지 카운트 1 증가
   * @returns {number} 증가 후 카운트
   */
  function incrementMessageCount() {
    const current = getMessageCount();
    const next = current + 1;
    lsSet(STORAGE_KEYS.MESSAGE_COUNT, String(next));
    console.log('[GuestMode] 메시지 카운트:', next + '/' + MAX_MESSAGES);
    return next;
  }

  /**
   * 회원가입 유도 모달 표시
   * - 페이지에 #signupModalOverlay 요소가 있으면 표시
   * - 없으면 confirm → 회원가입 페이지로 이동
   */
  function showSignupModal() {
    const overlay = document.getElementById('signupModalOverlay');
    if (overlay) {
      overlay.classList.add('visible');
      // 포커스 트랩 — 모달 첫 버튼에 포커스
      const firstBtn = overlay.querySelector('a, button');
      if (firstBtn) setTimeout(() => firstBtn.focus(), 100);
      return;
    }

    // 폴백: 브라우저 confirm
    const proceed = window.confirm(
      '게스트 모드는 최대 10개 메시지까지 무료입니다.\n' +
      '회원가입하면 무제한으로 사용하실 수 있어요.\n\n' +
      '지금 회원가입 하시겠습니까?'
    );
    if (proceed) {
      window.location.href = '/pages/signup.html';
    }
  }

  /**
   * 현재 게스트 세션 ID 반환
   * @returns {string|null}
   */
  function getGuestSessionId() {
    return lsGet(STORAGE_KEYS.SESSION_ID);
  }

  /**
   * 현재 게스트 봇 ID 반환
   * @returns {string|null}
   */
  function getGuestBotId() {
    return lsGet(STORAGE_KEYS.BOT_ID);
  }

  /**
   * 게스트 세션 완전 초기화 (로그아웃 등에 사용)
   */
  function clearGuestSession() {
    Object.values(STORAGE_KEYS).forEach(lsRemove);
    console.log('[GuestMode] 세션 초기화 완료');
  }

  /**
   * 남은 메시지 수 반환
   * @returns {number}
   */
  function getRemainingMessages() {
    return Math.max(0, MAX_MESSAGES - getMessageCount());
  }

  // ===== 전역 등록 =====
  global.initGuestSession      = initGuestSession;
  global.checkMessageLimit     = checkMessageLimit;
  global.incrementMessageCount = incrementMessageCount;
  global.showSignupModal       = showSignupModal;
  global.getGuestSessionId     = getGuestSessionId;
  global.getGuestBotId         = getGuestBotId;
  global.clearGuestSession     = clearGuestSession;
  global.getMessageCount       = getMessageCount;
  global.getRemainingMessages  = getRemainingMessages;

})(typeof window !== 'undefined' ? window : globalThis);
