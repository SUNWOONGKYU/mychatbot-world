// @task S3F7
/**
 * usage-dashboard.js
 * My Chatbot World — 사용량 대시보드 클라이언트 스크립트
 *
 * - /api/usage 엔드포인트에서 사용량 데이터 fetch
 * - 월별 진행바, 통계 카드, 봇별 CSS 막대 차트 렌더링
 * - 로딩 스켈레톤 / 에러 상태 처리
 * - Supabase Auth로 사용자 인증 확인
 */

(function () {
  'use strict';

  // ===== 상수 =====

  /** @type {string} 사용량 API 엔드포인트 (상대 경로) */
  const USAGE_API = '/api/usage';

  /**
   * 무료 티어 경고/위험 임계값 (%)
   * 80% 이상: 진행 바가 경고(주황) 색상
   * 95% 이상: 진행 바가 위험(빨강) 색상 + 업그레이드 배너 표시
   */
  const WARN_THRESHOLD  = 80;
  const DANGER_THRESHOLD = 95;

  /**
   * 봇별 차트 막대 팔레트 색상 클래스 수
   * CSS에 .bot-color-0 ~ .bot-color-5 정의됨
   */
  const BOT_COLOR_COUNT = 6;

  // ===== Supabase 클라이언트 초기화 =====

  /**
   * window.__supabaseClient에 캐시된 클라이언트를 반환합니다.
   * Supabase CDN 스크립트가 로드된 경우에만 작동합니다.
   * 환경 변수(window.__SUPABASE_URL / window.__SUPABASE_ANON_KEY)가 없는 경우
   * 클라이언트 생성을 건너뜁니다.
   *
   * @returns {import('@supabase/supabase-js').SupabaseClient|null}
   */
  function getSupabaseClient() {
    if (window.__supabaseClient) return window.__supabaseClient;

    const url  = window.__SUPABASE_URL  || '';
    const key  = window.__SUPABASE_ANON_KEY || '';

    if (!url || !key) {
      console.warn('[UsageDashboard] Supabase URL/Key 미설정 — 인증 우회');
      return null;
    }

    try {
      // @supabase/supabase-js CDN → window.supabase.createClient
      const create = window.supabase?.createClient;
      if (typeof create !== 'function') {
        console.warn('[UsageDashboard] supabase.createClient 함수 없음');
        return null;
      }
      window.__supabaseClient = create(url, key);
      return window.__supabaseClient;
    } catch (e) {
      console.error('[UsageDashboard] Supabase 초기화 오류:', e);
      return null;
    }
  }

  /**
   * 현재 로그인된 사용자의 access_token을 반환합니다.
   * 비로그인 상태이면 null을 반환합니다.
   *
   * @returns {Promise<string|null>}
   */
  async function getAccessToken() {
    try {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data, error } = await client.auth.getSession();
      if (error || !data?.session) return null;

      return data.session.access_token || null;
    } catch (e) {
      console.warn('[UsageDashboard] getAccessToken 오류:', e);
      return null;
    }
  }

  // ===== UI 상태 전환 =====

  /**
   * body에 state-* 클래스를 교체하여 로딩/완료/에러 뷰를 전환합니다.
   * @param {'loading'|'loaded'|'error'} state
   */
  function setState(state) {
    document.body.classList.remove('state-loaded', 'state-error', 'state-loading');
    if (state === 'loaded') document.body.classList.add('state-loaded');
    if (state === 'error')  document.body.classList.add('state-error');
    // 'loading'은 기본값 (클래스 없음 → loading-view가 display:block)
  }

  // ===== 데이터 렌더링 =====

  /**
   * 숫자에 천 단위 쉼표를 적용합니다.
   * @param {number} n
   * @returns {string}
   */
  function formatNumber(n) {
    return Number(n).toLocaleString('ko-KR');
  }

  /**
   * 현재 월 레이블(YYYY-MM)을 "YYYY년 M월" 형식으로 변환합니다.
   * @param {string} ym  예: "2026-03"
   * @returns {string}   예: "2026년 3월"
   */
  function formatMonthLabel(ym) {
    if (!ym) return '';
    const [year, month] = ym.split('-');
    return `${year}년 ${parseInt(month, 10)}월`;
  }

  /**
   * 진행 바에 적용할 CSS 클래스를 결정합니다.
   * @param {number} pct  0~100
   * @returns {string}
   */
  function getProgressClass(pct) {
    if (pct >= DANGER_THRESHOLD) return 'danger';
    if (pct >= WARN_THRESHOLD)   return 'warning';
    return '';
  }

  /**
   * /api/usage 응답 데이터를 DOM에 반영합니다.
   *
   * @param {{
   *   currentMonth: string,
   *   limit: number,
   *   used: number,
   *   percentage: number,
   *   conversations?: number,
   *   totalMessages?: number,
   *   botBreakdown?: Array<{botName:string, count:number}>
   * }} data
   */
  function renderUsageData(data) {
    const {
      currentMonth,
      limit       = 1000,
      used        = 0,
      percentage  = 0,
      conversations,
      totalMessages,
      botBreakdown,
    } = data;

    // ---- 현재 월 배지 ----
    const monthBadge = document.getElementById('currentMonthBadge');
    if (monthBadge) {
      monthBadge.textContent = '\uD83D\uDCC5 ' + (formatMonthLabel(currentMonth) || currentMonth);
    }

    // ---- 진행 바 ----
    const pct  = Math.min(100, Math.max(0, Math.round(percentage)));
    const fill = document.getElementById('progressFill');
    if (fill) {
      fill.style.width = pct + '%';
      fill.setAttribute('aria-valuenow', String(pct));
      // 색상 클래스 교체
      fill.classList.remove('warning', 'danger');
      const cls = getProgressClass(pct);
      if (cls) fill.classList.add(cls);
    }

    const el = (id) => document.getElementById(id);
    if (el('usedCount'))    el('usedCount').textContent    = formatNumber(used);
    if (el('limitCount'))   el('limitCount').textContent   = formatNumber(limit);
    if (el('limitLabel'))   el('limitLabel').textContent   = formatNumber(limit);
    if (el('usagePct'))     el('usagePct').textContent     = pct + '%';

    const remaining = Math.max(0, limit - used);
    const remainEl  = el('usageRemainingText');
    if (remainEl) {
      // Build the text safely without innerHTML to prevent XSS.
      remainEl.textContent = '';
      const prefix = document.createTextNode('무료 잔여: ');
      const strong = document.createElement('strong');
      strong.textContent = formatNumber(remaining) + '회';
      const suffix = document.createTextNode(' 남았습니다.');
      remainEl.appendChild(prefix);
      remainEl.appendChild(strong);
      remainEl.appendChild(suffix);
    }

    // ---- 통계 카드 ----
    if (el('statConversations')) {
      el('statConversations').textContent =
        conversations != null ? formatNumber(conversations) : formatNumber(used);
    }
    if (el('statMessages')) {
      el('statMessages').textContent =
        totalMessages != null ? formatNumber(totalMessages) : '—';
    }
    if (el('statRemaining')) {
      el('statRemaining').textContent = formatNumber(remaining);
    }

    // ---- 업그레이드 배너 (95% 이상 시 표시) ----
    const banner = el('upgradeBanner');
    if (banner) {
      if (pct >= DANGER_THRESHOLD) {
        banner.classList.add('visible');
      } else {
        banner.classList.remove('visible');
      }
    }

    // ---- 봇별 사용량 차트 ----
    renderBotChart(botBreakdown || []);
  }

  /**
   * 봇별 CSS 막대 차트를 렌더링합니다.
   * 외부 라이브러리 없이 순수 CSS width 기반으로 구현됩니다.
   *
   * @param {Array<{botName:string, count:number}>} breakdown
   */
  function renderBotChart(breakdown) {
    const container = document.getElementById('botChartList');
    if (!container) return;

    // 데이터가 없는 경우
    if (!breakdown || breakdown.length === 0) {
      container.innerHTML = '<p class="chart-empty">이번 달 봇별 사용 기록이 없습니다.</p>';
      return;
    }

    // 최대값 기준으로 상대 비율 계산
    const maxCount = Math.max(...breakdown.map((b) => b.count), 1);

    container.innerHTML = '';

    breakdown.forEach(function (bot, idx) {
      const relPct  = Math.round((bot.count / maxCount) * 100);
      const colorCls = 'bot-color-' + (idx % BOT_COLOR_COUNT);

      const row = document.createElement('div');
      row.className = 'bot-chart-row';
      row.setAttribute('aria-label', bot.botName + ': ' + bot.count + '회');

      const nameEl = document.createElement('span');
      nameEl.className = 'bot-chart-name';
      nameEl.title = bot.botName;
      nameEl.textContent = bot.botName;

      const track = document.createElement('div');
      track.className = 'bot-chart-bar-track';

      const fill = document.createElement('div');
      fill.className = 'bot-chart-bar-fill ' + colorCls;
      fill.style.width = '0%';  // 초기 0 → CSS transition으로 부드럽게 채움
      track.appendChild(fill);

      const count = document.createElement('span');
      count.className = 'bot-chart-count';
      count.textContent = formatNumber(bot.count);

      row.appendChild(nameEl);
      row.appendChild(track);
      row.appendChild(count);
      container.appendChild(row);

      // 다음 프레임에 width 적용 → CSS transition 발동
      requestAnimationFrame(function () {
        fill.style.width = relPct + '%';
      });
    });
  }

  // ===== API 호출 =====

  /**
   * /api/usage 엔드포인트를 호출하여 사용량 데이터를 가져옵니다.
   *
   * @returns {Promise<void>}
   */
  async function fetchUsage() {
    setState('loading');

    try {
      // 인증 토큰 획득 (없으면 빈 문자열 — 서버가 401 반환)
      const token = await getAccessToken();

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const response = await fetch(USAGE_API, { headers });

      // 401: 로그인 페이지로 이동
      if (response.status === 401) {
        window.location.href = '/pages/auth/login.html?redirect=' +
          encodeURIComponent(window.location.pathname);
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'API 오류 (' + response.status + ')');
      }

      const data = await response.json();

      renderUsageData(data);
      setState('loaded');

    } catch (err) {
      console.error('[UsageDashboard] fetchUsage 오류:', err);

      const msgEl = document.getElementById('errorMessage');
      if (msgEl) {
        msgEl.textContent = err.message || '알 수 없는 오류가 발생했습니다.';
      }

      setState('error');
    }
  }

  // ===== 이벤트 바인딩 =====

  /**
   * "다시 시도" 버튼 클릭 핸들러를 등록합니다.
   */
  function bindRetryButton() {
    const btn = document.getElementById('retryBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        fetchUsage();
      });
    }
  }

  // ===== 초기화 =====

  /**
   * DOM 준비 완료 시 대시보드를 초기화합니다.
   */
  function init() {
    bindRetryButton();
    fetchUsage();
  }

  // DOMContentLoaded 또는 즉시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
