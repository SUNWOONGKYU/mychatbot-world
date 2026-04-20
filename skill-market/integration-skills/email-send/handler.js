/**
 * Email Send Skill Handler
 * Resend API를 통한 이메일 발송 처리
 *
 * 지원 액션:
 * - send: 이메일 발송
 *
 * 환경 변수:
 * - RESEND_API_KEY: Resend API 키 (필수)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM = 'noreply@mychatbot.world';
const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * 이메일 전송 스킬 메인 핸들러
 * @param {string} action - 실행할 액션 (send)
 * @param {object} payload - 액션 파라미터
 * @returns {object} 처리 결과
 *
 * [FIX] subject/body 길이 제한 추가 (과도한 페이로드 방지)
 * [FIX] from 이메일 주소 형식 검증 추가
 * [FIX] html payload 포함 시 length 제한 추가 (메모리 폭탄 방지)
 */
export async function handleEmailSend(action, payload) {
  if (action === 'send') {
    return await sendEmail(payload);
  }

  return { success: false, error: `Unknown action: ${action}` };
}

/**
 * 이메일 발송
 * @param {object} payload
 * @param {string} payload.to - 수신자 이메일 주소 (필수)
 * @param {string} payload.subject - 이메일 제목 (필수)
 * @param {string} payload.body - 이메일 본문 텍스트 (필수)
 * @param {string} [payload.from] - 발신자 이메일 (선택, 기본값: noreply@mychatbot.world)
 * @param {string} [payload.html] - HTML 본문 (선택, body보다 우선 적용)
 */
async function sendEmail(payload) {
  const { to, subject, body, from, html } = payload;

  // 필수 파라미터 검증
  if (!to || !subject || !body) {
    return {
      success: false,
      error: 'to, subject, body are required',
      message: '수신자 이메일(to), 제목(subject), 본문(body)은 필수입니다.'
    };
  }

  // 이메일 형식 검증 (수신자)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return {
      success: false,
      error: 'Invalid email address',
      message: `"${to}"는 올바른 이메일 형식이 아닙니다.`
    };
  }

  // 발신자 이메일 형식 검증 (from이 명시된 경우)
  if (from && !emailRegex.test(from)) {
    return {
      success: false,
      error: 'Invalid from email address',
      message: `발신자 이메일 "${from}"이 올바른 형식이 아닙니다.`
    };
  }

  // 페이로드 길이 제한 (과도한 입력 방지)
  if (subject.length > 500) {
    return { success: false, error: 'subject is too long (max 500 chars)' };
  }
  if (body.length > 50000) {
    return { success: false, error: 'body is too long (max 50,000 chars)' };
  }
  if (html && html.length > 100000) {
    return { success: false, error: 'html body is too long (max 100,000 chars)' };
  }

  // Resend API 키 미설정 시 시뮬레이션 모드
  if (!RESEND_API_KEY) {
    console.log('[EmailSend] Simulation mode — RESEND_API_KEY not set');
    console.log('[EmailSend] Would send to:', to, '| Subject:', subject);
    return {
      success: true,
      mode: 'simulation',
      message: `[시뮬레이션] 이메일이 ${to}으로 발송 예약되었습니다. (실제 발송은 RESEND_API_KEY 설정 후 가능합니다)`
    };
  }

  // Resend API 요청 페이로드 구성
  const emailPayload = {
    from: from || DEFAULT_FROM,
    to: [to],
    subject,
    text: body
  };

  // HTML 본문이 있으면 추가
  if (html) {
    emailPayload.html = html;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[EmailSend] Resend API error:', err);
      return {
        success: false,
        error: err.message || 'Resend API error',
        message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'
      };
    }

    const data = await response.json();
    console.log('[EmailSend] Sent successfully. ID:', data.id);

    return {
      success: true,
      emailId: data.id,
      message: `${to}으로 이메일이 성공적으로 발송되었습니다.`
    };
  } catch (err) {
    console.error('[EmailSend] Network error:', err.message);
    return {
      success: false,
      error: err.message,
      message: '네트워크 오류로 이메일 발송에 실패했습니다.'
    };
  }
}

/**
 * 이메일 스킬 통합 라우터 (skill-integrations.js에서 호출)
 * case 'email-send': return await routeEmailSend(req, res, action, payload);
 */
export async function routeEmailSend(req, res, action, payload) {
  const result = await handleEmailSend(action, payload);

  if (result.error && !result.success) {
    // Unknown action → 400
    if (result.error.startsWith('Unknown action')) {
      return res.status(400).json({ error: result.error });
    }
    // 유효성 오류 → 400
    const validationKeywords = ['required', 'Invalid', 'too long', 'format'];
    const isValidationError = validationKeywords.some(kw => result.error.includes(kw));
    if (isValidationError) {
      return res.status(400).json({ error: result.error, message: result.message });
    }
    // 시스템/네트워크 오류 → 500
    return res.status(500).json({ error: result.error, message: result.message });
  }

  return res.status(200).json(result);
}
