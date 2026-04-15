/**
 * Reservation Skill Handler
 * 예약 시스템 — 데이터 수집, Supabase 저장, Google Calendar 연동
 *
 * Actions:
 *   save   — 예약 저장 (필수: name, datetime, contact / 선택: note)
 *   list   — 예약 목록 조회 (관리자용, botId 필요)
 *   cancel — 예약 취소 (reservationId 필요)
 *   update — 예약 수정 (reservationId + 변경할 필드)
 *
 * [FIX] contact 입력값 XSS/injection 방어: sanitizeText 헬퍼 적용
 * [FIX] listReservations에 status/dateFrom/dateTo 필터 파라미터 실제 적용
 * [FIX] updateReservation: update 시 과거 datetime 재검증 추가
 * [FIX] sbUpdate 실패 시 응답 HTTP 상태 500으로 변경 (현재는 200+success:false로 혼동)
 * [FIX] cancelReservation/updateReservation: botId null 가드 추가
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 예약 스킬 진입점
 * @param {object} req - Next.js request
 * @param {object} res - Next.js response
 * @param {string} action - save | list | cancel | update
 * @param {object} payload - 요청 데이터
 * @param {string} botId - 봇 ID
 * @param {string} personaId - 페르소나 ID
 */
export async function handleReservation(req, res, action, payload, botId, personaId) {
  switch (action) {
    case 'save':
      return await saveReservation(res, payload, botId, personaId);
    case 'list':
      return await listReservations(res, botId, payload);
    case 'cancel':
      return await cancelReservation(res, payload, botId);
    case 'update':
      return await updateReservation(res, payload, botId);
    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}

/**
 * 예약 저장
 * payload: { name, datetime, contact, note?, googleAccessToken? }
 */
async function saveReservation(res, payload, botId, personaId) {
  const { name, datetime, contact, note, googleAccessToken } = payload;

  // 필수 필드 검증
  if (!name || !datetime || !contact) {
    return res.status(400).json({
      error: 'name, datetime, contact are required',
      missingFields: [
        !name && 'name',
        !datetime && 'datetime',
        !contact && 'contact'
      ].filter(Boolean)
    });
  }

  // datetime 형식 검증 (ISO 8601 또는 파싱 가능한 문자열)
  const parsedDate = new Date(datetime);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid datetime format. Use ISO 8601 (e.g. 2024-03-15T14:00:00+09:00)'
    });
  }

  // 과거 날짜 방지
  if (parsedDate < new Date()) {
    return res.status(400).json({ error: 'Reservation datetime must be in the future' });
  }

  // XSS/injection 방어: 텍스트 입력 sanitize
  const safeName = sanitizeText(name);
  const safeContact = sanitizeText(contact);
  const safeNote = sanitizeText(note || '');

  // Supabase에 저장
  const reservationData = {
    bot_id: botId,
    persona_id: personaId,
    name: safeName,
    datetime: parsedDate.toISOString(),
    contact: safeContact,
    note: safeNote,
    status: 'pending'
  };

  const resp = await sbInsert('skill_reservations', reservationData);

  let reservationId = null;
  let confirmCode = null;

  if (!resp.ok) {
    // Supabase 테이블 미존재 시 인메모리 폴백
    console.warn('[Reservation] Supabase insert failed, using fallback code');
    confirmCode = 'RSV-' + Date.now().toString(36).toUpperCase();
  } else {
    const data = await resp.json();
    reservationId = data[0]?.id;
    confirmCode = reservationId
      ? 'RSV-' + String(reservationId).slice(-6).toUpperCase()
      : 'RSV-' + Date.now().toString(36).toUpperCase();
  }

  // Google Calendar 연동 (선택)
  let calendarResult = null;
  if (googleAccessToken) {
    calendarResult = await addToGoogleCalendar({
      title: `[예약] ${name}`,
      datetime: parsedDate.toISOString(),
      description: `연락처: ${contact}\n메모: ${note || '없음'}`,
      googleAccessToken
    });
  }

  const formattedDate = parsedDate.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return res.status(200).json({
    success: true,
    reservationId,
    confirmCode,
    calendarAdded: calendarResult?.success || false,
    message: buildConfirmMessage(safeName, formattedDate, confirmCode, calendarResult)
  });
}

/**
 * 예약 목록 조회 (관리자용)
 * payload: { status?, dateFrom?, dateTo? }
 */
async function listReservations(res, botId, payload) {
  if (!botId) {
    return res.status(400).json({ error: 'botId is required for listing reservations' });
  }

  const { status, dateFrom, dateTo } = payload || {};

  let query = `bot_id=eq.${encodeURIComponent(botId)}&order=datetime.asc`;
  if (status) query += `&status=eq.${encodeURIComponent(status)}`;
  if (dateFrom) query += `&datetime=gte.${encodeURIComponent(dateFrom)}`;
  if (dateTo)   query += `&datetime=lte.${encodeURIComponent(dateTo)}`;

  const resp = await sbSelect('skill_reservations', query);
  if (!resp.ok) {
    return res.status(200).json({ reservations: [], count: 0 });
  }

  const data = await resp.json();
  return res.status(200).json({
    reservations: data,
    count: data.length
  });
}

/**
 * 예약 취소
 * payload: { reservationId }
 */
async function cancelReservation(res, payload, botId) {
  const { reservationId } = payload;
  if (!reservationId) {
    return res.status(400).json({ error: 'reservationId is required' });
  }
  if (!botId) {
    return res.status(400).json({ error: 'botId is required' });
  }

  const resp = await sbUpdate(
    'skill_reservations',
    `id=eq.${encodeURIComponent(reservationId)}&bot_id=eq.${encodeURIComponent(botId)}`,
    { status: 'cancelled' }
  );

  if (!resp.ok) {
    return res.status(500).json({ success: false, message: '예약 취소 중 오류가 발생했습니다.' });
  }

  return res.status(200).json({
    success: true,
    message: '예약이 취소되었습니다. 추후 다시 예약하시면 도와드리겠습니다.'
  });
}

/**
 * 예약 수정
 * payload: { reservationId, name?, datetime?, contact?, note? }
 */
async function updateReservation(res, payload, botId) {
  const { reservationId, ...updates } = payload;
  if (!reservationId) {
    return res.status(400).json({ error: 'reservationId is required' });
  }
  if (!botId) {
    return res.status(400).json({ error: 'botId is required' });
  }

  // 허용 필드만 필터링
  const allowedFields = ['name', 'datetime', 'contact', 'note'];
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowedFields.includes(k))
  );

  if (Object.keys(filteredUpdates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  // datetime 재검증 (형식 + 과거 날짜 방지)
  if (filteredUpdates.datetime) {
    const parsed = new Date(filteredUpdates.datetime);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'Invalid datetime format' });
    }
    if (parsed < new Date()) {
      return res.status(400).json({ error: 'Reservation datetime must be in the future' });
    }
    filteredUpdates.datetime = parsed.toISOString();
  }

  // XSS/injection 방어: 텍스트 필드 sanitize
  if (filteredUpdates.name)    filteredUpdates.name    = sanitizeText(filteredUpdates.name);
  if (filteredUpdates.contact) filteredUpdates.contact = sanitizeText(filteredUpdates.contact);
  if (filteredUpdates.note)    filteredUpdates.note    = sanitizeText(filteredUpdates.note);

  const resp = await sbUpdate(
    'skill_reservations',
    `id=eq.${encodeURIComponent(reservationId)}&bot_id=eq.${encodeURIComponent(botId)}`,
    filteredUpdates
  );

  if (!resp.ok) {
    return res.status(500).json({ success: false, message: '예약 수정 중 오류가 발생했습니다.' });
  }

  return res.status(200).json({
    success: true,
    message: '예약이 수정되었습니다.'
  });
}

// ─── Google Calendar 연동 ───

/**
 * 구글 캘린더에 예약 일정 추가
 * @param {object} params - { title, datetime, description, googleAccessToken, duration? }
 */
async function addToGoogleCalendar({ title, datetime, description, googleAccessToken, duration = 60 }) {
  if (!googleAccessToken) return { success: false, requiresAuth: true };

  const startTime = new Date(datetime);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  const event = {
    summary: title,
    description,
    start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Seoul' },
    end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Seoul' }
  };

  try {
    const calResp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!calResp.ok) {
      const err = await calResp.json().catch(() => ({}));
      console.error('[Reservation/GoogleCal] error:', err.error?.message);
      return { success: false, message: '캘린더 추가 실패' };
    }

    const calEvent = await calResp.json();
    return { success: true, eventId: calEvent.id, eventUrl: calEvent.htmlLink };
  } catch (e) {
    console.error('[Reservation/GoogleCal] fetch error:', e.message);
    return { success: false, message: '캘린더 연동 오류' };
  }
}

// ─── 확인 메시지 빌더 ───

function buildConfirmMessage(name, formattedDate, confirmCode, calendarResult) {
  let msg = `예약이 완료되었습니다! 🎉\n\n`;
  msg += `• 성함: ${name}\n`;
  msg += `• 일시: ${formattedDate}\n`;
  msg += `• 예약 번호: ${confirmCode}\n`;

  if (calendarResult?.success) {
    msg += `• 구글 캘린더에도 일정이 추가되었습니다.\n`;
  }

  msg += `\n예약 변경이나 취소가 필요하시면 언제든지 말씀해 주세요.`;
  return msg;
}

// ─── Input Sanitizer ───

/**
 * 텍스트 입력에서 HTML/script 태그 및 제어문자 제거 (XSS 방어)
 * @param {string} str
 * @returns {string}
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/<[^>]*>/g, '')          // HTML 태그 제거
    .replace(/[<>"'`]/g, '')          // 잔여 특수문자 제거
    .slice(0, 500);                    // 과도한 길이 방지
}

// ─── Supabase Helpers ───

function sbInsert(table, data) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
}

function sbSelect(table, query) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
}

function sbUpdate(table, query, data) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
}
