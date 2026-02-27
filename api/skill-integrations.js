/**
 * Skill External API Integrations
 * POST /api/skill-integrations — 스킬별 외부 API 실행
 *
 * 지원 스킬 (7개 무료):
 * 1. reservation  — 예약 수집 (Supabase 저장)
 * 2. survey       — 설문 수집 (Supabase 저장)
 * 3. coupon       — 쿠폰 발급 (랜덤 코드 생성)
 * 4. lead-collect — 리드 수집 (Supabase 저장)
 * 5. google-cal   — 구글 캘린더 일정 추가
 * 6. email-send   — 이메일 전송 (Resend API)
 * 7. kakao-noti   — 카카오톡 알림 (카카오 비즈메시지)
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { skillId, action, payload, botId, personaId } = req.body;

  if (!skillId || !action) {
    return res.status(400).json({ error: 'skillId and action are required' });
  }

  try {
    switch (skillId) {
      case 'reservation':
        return await handleReservation(req, res, action, payload, botId, personaId);
      case 'survey':
        return await handleSurvey(req, res, action, payload, botId, personaId);
      case 'coupon':
        return await handleCoupon(req, res, action, payload, botId);
      case 'lead-collect':
        return await handleLeadCollect(req, res, action, payload, botId);
      case 'google-cal':
        return await handleGoogleCal(req, res, action, payload);
      case 'email-send':
        return await handleEmailSend(req, res, action, payload);
      case 'kakao-noti':
        return await handleKakaoNoti(req, res, action, payload);
      default:
        return res.status(404).json({ error: `Unknown skill: ${skillId}` });
    }
  } catch (e) {
    console.error(`[SkillAPI] ${skillId}/${action} error:`, e.message);
    return res.status(500).json({ error: 'Skill execution failed', message: e.message });
  }
}

// ─── 1. 예약 시스템 ───
async function handleReservation(req, res, action, payload, botId, personaId) {
  if (action === 'save') {
    // 예약 정보 저장
    const { name, datetime, contact, note } = payload;
    if (!name || !datetime || !contact) {
      return res.status(400).json({ error: 'name, datetime, contact are required' });
    }

    const resp = await sbInsert('skill_reservations', {
      bot_id: botId,
      persona_id: personaId,
      name,
      datetime,
      contact,
      note: note || '',
      status: 'pending'
    });

    if (!resp.ok) {
      // Supabase 테이블이 없으면 메모리 응답 (MVP 폴백)
      const code = 'RSV-' + Date.now().toString(36).toUpperCase();
      return res.status(200).json({ success: true, code, message: `예약이 완료되었습니다. 예약 번호: ${code}` });
    }

    const data = await resp.json();
    return res.status(200).json({
      success: true,
      reservationId: data[0]?.id,
      message: `예약이 완료되었습니다. ${name}님, ${datetime}에 뵙겠습니다.`
    });
  }

  if (action === 'list') {
    // 예약 목록 조회 (봇 관리자용)
    const resp = await sbSelect('skill_reservations', `bot_id=eq.${botId}&order=datetime.asc`);
    if (!resp.ok) return res.status(200).json([]);
    return res.status(200).json(await resp.json());
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ─── 2. 설문조사 ───
async function handleSurvey(req, res, action, payload, botId, personaId) {
  if (action === 'submit') {
    const { score, comment } = payload;
    if (score === undefined) return res.status(400).json({ error: 'score is required' });

    await sbInsert('skill_survey_responses', {
      bot_id: botId,
      persona_id: personaId,
      score: parseInt(score),
      comment: comment || ''
    }).catch(() => {}); // 테이블 없어도 실패 무시

    return res.status(200).json({
      success: true,
      message: `소중한 의견 감사합니다! ${score}점을 주셨군요.`
    });
  }

  if (action === 'stats') {
    const resp = await sbSelect('skill_survey_responses', `bot_id=eq.${botId}&select=score`);
    if (!resp.ok) return res.status(200).json({ avg: 0, count: 0 });
    const data = await resp.json();
    const avg = data.length > 0 ? data.reduce((s, r) => s + r.score, 0) / data.length : 0;
    return res.status(200).json({ avg: avg.toFixed(1), count: data.length });
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ─── 3. 쿠폰 발급 ───
async function handleCoupon(req, res, action, payload, botId) {
  if (action === 'issue') {
    const { recipientName, expiryDays } = payload;
    const expiry = expiryDays || 30;

    // 랜덤 쿠폰 코드 생성 (MCW-XXXXXX 형식)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'MCW-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiry);
    const expiryStr = expiryDate.toLocaleDateString('ko-KR');

    // 쿠폰 저장 (선택)
    await sbInsert('skill_coupons', {
      bot_id: botId,
      code,
      recipient_name: recipientName || '고객',
      expiry_date: expiryDate.toISOString(),
      is_used: false
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      code,
      expiryDate: expiryStr,
      message: `쿠폰이 발급되었습니다!\n쿠폰 코드: ${code}\n유효기간: ${expiryStr}까지`
    });
  }

  if (action === 'validate') {
    const { code } = payload;
    if (!code) return res.status(400).json({ error: 'code is required' });

    const resp = await sbSelect('skill_coupons', `bot_id=eq.${botId}&code=eq.${code}&is_used=eq.false`);
    if (!resp.ok) return res.status(200).json({ valid: false, message: '쿠폰 확인 중 오류가 발생했습니다.' });

    const data = await resp.json();
    if (data.length === 0) return res.status(200).json({ valid: false, message: '유효하지 않은 쿠폰입니다.' });

    const coupon = data[0];
    if (new Date(coupon.expiry_date) < new Date()) {
      return res.status(200).json({ valid: false, message: '만료된 쿠폰입니다.' });
    }

    return res.status(200).json({ valid: true, coupon, message: '유효한 쿠폰입니다.' });
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ─── 4. 리드 수집 ───
async function handleLeadCollect(req, res, action, payload, botId) {
  if (action === 'save') {
    const { name, contact, email, note } = payload;
    if (!contact && !email) {
      return res.status(400).json({ error: 'contact or email is required' });
    }

    await sbInsert('skill_leads', {
      bot_id: botId,
      name: name || '',
      contact: contact || '',
      email: email || '',
      note: note || ''
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: '연락처가 등록되었습니다. 빠른 시일 내에 연락드리겠습니다.'
    });
  }

  if (action === 'list') {
    const resp = await sbSelect('skill_leads', `bot_id=eq.${botId}&order=created_at.desc`);
    if (!resp.ok) return res.status(200).json([]);
    return res.status(200).json(await resp.json());
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ─── 5. 구글 캘린더 ───
async function handleGoogleCal(req, res, action, payload) {
  if (action === 'add') {
    const { title, datetime, duration, description, googleAccessToken } = payload;
    if (!title || !datetime) {
      return res.status(400).json({ error: 'title and datetime are required' });
    }

    if (!googleAccessToken) {
      // 구글 OAuth 토큰 없으면 안내 메시지 반환
      return res.status(200).json({
        success: false,
        requiresAuth: true,
        message: '구글 캘린더 연동을 위해 구글 계정 연결이 필요합니다.',
        authUrl: 'https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/calendar.events'
      });
    }

    // Google Calendar API 호출
    const startTime = new Date(datetime);
    const endTime = new Date(startTime.getTime() + (duration || 60) * 60000);

    const event = {
      summary: title,
      description: description || '',
      start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Seoul' },
      end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Seoul' }
    };

    const calResp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!calResp.ok) {
      const err = await calResp.json();
      return res.status(200).json({ success: false, message: '캘린더 추가에 실패했습니다: ' + (err.error?.message || '') });
    }

    const calEvent = await calResp.json();
    return res.status(200).json({
      success: true,
      eventId: calEvent.id,
      eventUrl: calEvent.htmlLink,
      message: `구글 캘린더에 "${title}" 일정이 추가되었습니다.`
    });
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ─── 6. 이메일 전송 (Resend API) ───
async function handleEmailSend(req, res, action, payload) {
  if (action === 'send') {
    const { to, subject, body, from } = payload;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, body are required' });
    }

    if (!RESEND_API_KEY) {
      // Resend API 키 없으면 로그만 (MVP 폴백)
      console.log('[Email] Would send to:', to, '| Subject:', subject);
      return res.status(200).json({
        success: true,
        message: `이메일이 ${to}로 발송 예약되었습니다.`,
        mode: 'simulation'
      });
    }

    const emailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: from || 'noreply@mychatbot.world',
        to: [to],
        subject,
        text: body
      })
    });

    if (!emailResp.ok) {
      const err = await emailResp.json();
      console.error('[Email] Resend error:', err);
      return res.status(200).json({ success: false, message: '이메일 발송에 실패했습니다.' });
    }

    const data = await emailResp.json();
    return res.status(200).json({
      success: true,
      emailId: data.id,
      message: `${to}으로 이메일이 발송되었습니다.`
    });
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ─── 7. 카카오톡 알림 (비즈메시지) ───
async function handleKakaoNoti(req, res, action, payload) {
  if (action === 'send') {
    const { phone, message, templateCode } = payload;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }

    const kakaoApiKey = process.env.KAKAO_BIZM_API_KEY;
    const senderKey = process.env.KAKAO_SENDER_KEY;

    if (!kakaoApiKey || !senderKey) {
      // 카카오 비즈메시지 미설정 시 시뮬레이션
      console.log('[Kakao] Would send to:', phone, '| Message:', message);
      return res.status(200).json({
        success: true,
        message: `${phone}으로 카카오톡 알림이 발송 예약되었습니다.`,
        mode: 'simulation'
      });
    }

    // 카카오 비즈메시지 API 호출
    const kakaoResp = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        apikey: kakaoApiKey,
        userid: process.env.KAKAO_BIZM_USERID || '',
        senderkey: senderKey,
        tpl_code: templateCode || '',
        sender: process.env.KAKAO_SENDER_PHONE || '',
        receiver_1: phone,
        message_1: message
      }).toString()
    });

    if (!kakaoResp.ok) {
      return res.status(200).json({ success: false, message: '카카오톡 발송에 실패했습니다.' });
    }

    const data = await kakaoResp.json();
    return res.status(200).json({
      success: data.code === '0',
      message: data.code === '0'
        ? `${phone}으로 카카오톡 알림이 발송되었습니다.`
        : `발송 실패: ${data.message}`
    });
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
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
