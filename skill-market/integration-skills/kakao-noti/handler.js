/**
 * kakao-noti skill handler
 * 카카오 비즈메시지(알림톡) API 연동 — Aligo 카카오 비즈메시지 서비스 사용
 *
 * 환경 변수:
 *   KAKAO_BIZM_API_KEY   — Aligo API 키
 *   KAKAO_BIZM_USERID    — Aligo 서비스 ID
 *   KAKAO_SENDER_KEY     — 카카오 비즈니스 채널 발신 프로필 키 (40자)
 *   KAKAO_SENDER_PHONE   — 발신자 전화번호 (카카오 비즈니스 채널에 등록된 번호)
 *
 * 지원 액션:
 *   send  — 알림톡 단건 발송
 *
 * [FIX] skill-integrations.js 시그니처 불일치: handleKakaoNoti(req, res, action, payload) vs (action, payload)
 *        → routeKakaoNoti 래퍼 export 추가
 * [FIX] templateCode 미제공 시 Aligo API가 빈 문자열을 거부할 수 있음 — undefined 방어
 * [FIX] senderPhone 미설정 시 빈 문자열 전달 → Aligo API 오류 유발 가능 → 경고 로그 추가
 * [FIX] Aligo 응답 code가 숫자 0 (number)일 수 있음 — 타입 안전 비교로 수정
 */

const ALIGO_KAKAO_API_URL = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

/**
 * 카카오톡 알림톡 발송 핸들러 (순수 객체 반환 — 내부 직접 호출용)
 * @param {string} action - 'send'
 * @param {object} payload - { phone, message, templateCode }
 * @returns {Promise<{success: boolean, message: string, msgId?: string, mode?: string}>}
 */
export async function handleKakaoNoti(action, payload) {
  if (action !== 'send') {
    return { success: false, error: `Unknown action: ${action}` };
  }

  const { phone, message, templateCode } = payload;

  // 필수 파라미터 검증
  if (!phone || !message) {
    return { success: false, error: 'phone and message are required' };
  }

  // 전화번호 형식 정규화 (하이픈 제거)
  const normalizedPhone = phone.replace(/-/g, '');
  if (!/^01[016789]\d{7,8}$/.test(normalizedPhone)) {
    return { success: false, error: '유효하지 않은 전화번호 형식입니다. (01X-XXXX-XXXX)' };
  }

  // 메시지 길이 제한 (알림톡 최대 1000자)
  if (message.length > 1000) {
    return { success: false, error: `메시지가 너무 깁니다. (${message.length}자 / 최대 1000자)` };
  }

  const apiKey    = process.env.KAKAO_BIZM_API_KEY;
  const userId    = process.env.KAKAO_BIZM_USERID;
  const senderKey = process.env.KAKAO_SENDER_KEY;
  const senderPhone = process.env.KAKAO_SENDER_PHONE;

  // 환경변수 미설정 → 시뮬레이션 모드
  if (!apiKey || !userId || !senderKey) {
    console.log('[kakao-noti] simulation mode — to:', normalizedPhone, '| tpl:', templateCode || '(none)');
    console.log('[kakao-noti] message:', message);
    return {
      success: true,
      message: `${maskPhone(normalizedPhone)}으로 카카오톡 알림이 발송 예약되었습니다.`,
      mode: 'simulation'
    };
  }

  // 발신자 전화번호 미설정 경고
  if (!senderPhone) {
    console.warn('[kakao-noti] KAKAO_SENDER_PHONE is not set — Aligo may reject the request');
  }

  // Aligo 카카오 비즈메시지 API 호출
  const formParams = {
    apikey:     apiKey,
    userid:     userId,
    senderkey:  senderKey,
    receiver_1: normalizedPhone,
    message_1:  message,
    // 발송 실패 시 SMS 대체 발송 여부 (Y/N)
    failover:   'N'
  };
  // templateCode가 있을 때만 포함 (빈 값 전달 시 Aligo 오류 유발 가능)
  if (templateCode) formParams.tpl_code = templateCode;
  if (senderPhone)  formParams.sender   = senderPhone;

  const formData = new URLSearchParams(formParams);

  let resp;
  try {
    resp = await fetch(ALIGO_KAKAO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
  } catch (networkErr) {
    console.error('[kakao-noti] network error:', networkErr.message);
    return { success: false, error: '카카오 API 서버에 연결할 수 없습니다.' };
  }

  if (!resp.ok) {
    console.error('[kakao-noti] HTTP error:', resp.status);
    return { success: false, error: `카카오 API 오류 (HTTP ${resp.status})` };
  }

  let data;
  try {
    data = await resp.json();
  } catch {
    return { success: false, error: '카카오 API 응답 파싱 실패' };
  }

  // Aligo API 응답 코드: "0" 또는 0 = 성공 (타입 안전 비교)
  // eslint-disable-next-line eqeqeq
  if (data.code != '0') {
    console.error('[kakao-noti] API error:', data.code, data.message);
    return {
      success: false,
      error: `알림톡 발송 실패: ${data.message || '알 수 없는 오류'} (code: ${data.code})`
    };
  }

  // 발송 성공
  const msgId = data.info?.mid || data.mid || null;
  return {
    success: true,
    msgId,
    message: `${maskPhone(normalizedPhone)}으로 카카오톡 알림이 발송되었습니다.`
  };
}

/**
 * skill-integrations.js 라우터 호환 래퍼 (req, res 시그니처)
 * skill-integrations.js: case 'kakao-noti': return await routeKakaoNoti(req, res, action, payload);
 * @param {object} req - Next.js IncomingMessage 객체
 * @param {object} res - Next.js ServerResponse 객체
 * @param {string} action - 실행할 액션 ('send')
 * @param {object} payload - 액션 파라미터 ({ phone, message, templateCode? })
 * @returns {Promise<void>} res.json()으로 직접 응답 전송
 */
export async function routeKakaoNoti(req, res, action, payload) {
  const result = await handleKakaoNoti(action, payload);
  if (result.error && !result.success) {
    // Unknown action → 400
    if (result.error.startsWith('Unknown action')) {
      return res.status(400).json(result);
    }
    // 유효성 오류 → 400
    const isValidationError = result.error.includes('required') || result.error.includes('유효하지 않은') || result.error.includes('너무 깁니다');
    if (isValidationError) {
      return res.status(400).json(result);
    }
    // 시스템/API 오류 → 500
    return res.status(500).json(result);
  }
  return res.status(200).json(result);
}

/**
 * 전화번호 마스킹 (개인정보 보호)
 * 010-1234-5678 → 010-****-5678
 * @param {string} phone - 하이픈 제거된 11자리 전화번호 (예: '01012345678')
 * @returns {string} 마스킹된 전화번호 (예: '010-****-5678')
 */
function maskPhone(phone) {
  const digits = phone.replace(/-/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(7)}`;
  }
  return '***-****-' + digits.slice(-4);
}
