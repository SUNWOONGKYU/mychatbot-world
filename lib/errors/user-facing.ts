/**
 * @task S9FE5
 * @description 사용자 노출 에러 메시지 통일 — 한국어 + 복구 CTA
 *
 * 정책:
 *   - 기술 용어 노출 금지 (ECONNREFUSED, 500, timeout 등)
 *   - 항상 "왜 실패했는지 + 다음에 무엇을 할지" 포함
 *   - 치명 에러(5xx, network)는 재시도/문의 링크 제공
 *   - 클라이언트 에러(4xx)는 구체 안내 (입력 수정 / 권한 / 한도 초과)
 */

export type ErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'SERVER_5XX'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'VALIDATION'
  | 'INSUFFICIENT_CREDIT'
  | 'PAYMENT_FAILED'
  | 'AI_BUSY'
  | 'AI_REFUSED'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

interface UserMessage {
  title: string;
  body: string;
  cta?: { label: string; action: 'retry' | 'contact' | 'login' | 'charge' | 'refresh' };
}

const MESSAGES: Record<ErrorCode, UserMessage> = {
  NETWORK: {
    title: '연결이 불안정해요',
    body: '인터넷 상태를 확인한 뒤 다시 시도해주세요.',
    cta: { label: '다시 시도', action: 'retry' },
  },
  TIMEOUT: {
    title: '응답이 너무 늦어지고 있어요',
    body: '잠시 후 다시 시도해주세요. 같은 문제가 반복되면 지원팀에 문의해주세요.',
    cta: { label: '다시 시도', action: 'retry' },
  },
  SERVER_5XX: {
    title: '서비스에 일시적인 문제가 발생했어요',
    body: '조금 뒤 다시 시도해주세요. 계속되면 지원팀으로 알려주세요.',
    cta: { label: '문의하기', action: 'contact' },
  },
  UNAUTHORIZED: {
    title: '로그인이 필요해요',
    body: '세션이 만료되었거나 로그인되지 않았습니다.',
    cta: { label: '로그인', action: 'login' },
  },
  FORBIDDEN: {
    title: '접근 권한이 없어요',
    body: '이 기능은 권한 있는 사용자만 이용할 수 있습니다.',
  },
  NOT_FOUND: {
    title: '찾을 수 없어요',
    body: '요청하신 페이지나 데이터가 존재하지 않습니다.',
  },
  RATE_LIMITED: {
    title: '너무 빠르게 요청했어요',
    body: '잠시 기다렸다가 다시 시도해주세요.',
    cta: { label: '다시 시도', action: 'retry' },
  },
  VALIDATION: {
    title: '입력값을 확인해주세요',
    body: '일부 항목이 올바르지 않거나 누락되었습니다.',
  },
  INSUFFICIENT_CREDIT: {
    title: '크레딧이 부족해요',
    body: '크레딧을 충전하면 계속 대화할 수 있습니다.',
    cta: { label: '충전하기', action: 'charge' },
  },
  PAYMENT_FAILED: {
    title: '결제가 완료되지 않았어요',
    body: '다른 수단으로 시도하거나, 이미 입금한 경우 지원팀에 알려주세요.',
    cta: { label: '문의하기', action: 'contact' },
  },
  AI_BUSY: {
    title: 'AI가 잠시 혼잡해요',
    body: '바로 다시 시도하거나, 몇 초 기다렸다가 시도해주세요.',
    cta: { label: '다시 시도', action: 'retry' },
  },
  AI_REFUSED: {
    title: 'AI가 이 요청을 처리하기 어려워요',
    body: '질문을 조금 바꿔보시거나, 더 구체적으로 적어주세요.',
  },
  SESSION_EXPIRED: {
    title: '로그인 세션이 만료되었어요',
    body: '다시 로그인해주세요.',
    cta: { label: '로그인', action: 'login' },
  },
  UNKNOWN: {
    title: '알 수 없는 오류가 발생했어요',
    body: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.',
    cta: { label: '새로고침', action: 'refresh' },
  },
};

export function getUserMessage(code: ErrorCode): UserMessage {
  return MESSAGES[code] ?? MESSAGES.UNKNOWN;
}

/** HTTP status + 예외 객체에서 적절한 ErrorCode 도출 */
export function classifyError(err: unknown, status?: number): ErrorCode {
  if (status != null) {
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 422 || status === 400) return 'VALIDATION';
    if (status === 429) return 'RATE_LIMITED';
    if (status === 402) return 'INSUFFICIENT_CREDIT';
    if (status >= 500) return 'SERVER_5XX';
  }
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes('timeout') || err.name === 'AbortError') return 'TIMEOUT';
    if (m.includes('fetch failed') || m.includes('network')) return 'NETWORK';
    if (m.includes('session') && m.includes('expired')) return 'SESSION_EXPIRED';
    if (m.includes('credit') || m.includes('insufficient')) return 'INSUFFICIENT_CREDIT';
  }
  return 'UNKNOWN';
}

/** 한 줄 축약 문자열 (Toast 등 짧은 UI용) */
export function shortMessage(code: ErrorCode): string {
  const m = getUserMessage(code);
  return `${m.title} — ${m.body}`;
}
