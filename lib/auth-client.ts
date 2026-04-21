/**
 * 클라이언트 사이드 인증 유틸리티 — Supabase 세션 기반
 *
 * Supabase Auth는 세션을 localStorage 의 `sb-{project-ref}-auth-token` 키에
 * JSON 으로 저장한다. getToken() 은 이 값을 동기로 읽어 access_token 을 반환.
 *
 * 레거시 'mcw_access_token' 키도 호환성을 위해 우선 확인 (있으면 사용).
 *
 * 마이페이지 8탭 + create-bot 위저드 등 Bearer 토큰이 필요한 모든 fetch 가 공유.
 */

export function getToken(): string {
  if (typeof window === 'undefined') return '';

  // 1) 레거시 자체 토큰 (호환성 유지)
  const legacy =
    localStorage.getItem('mcw_access_token') ||
    sessionStorage.getItem('mcw_access_token');
  if (legacy) return legacy;

  // 2) Supabase 세션에서 access_token 추출
  //    키: sb-{project-ref}-auth-token  값: JSON (객체 또는 배열)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.access_token === 'string') return parsed.access_token;
          // 일부 supabase-js 버전은 [access_token, refresh_token, ...] 배열로 저장
          if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
        }
      } catch {
        // JSON 파싱 실패 — 다음 키로
      }
    }
  } catch {
    // localStorage 접근 자체가 실패한 경우 (사파리 사적 모드 등)
  }

  return '';
}

export function authHeaders(json = true): HeadersInit {
  const token = getToken();
  const base: HeadersInit = json ? { 'Content-Type': 'application/json' } : {};
  return token ? { ...base, Authorization: `Bearer ${token}` } : base;
}

/** multipart/form-data 업로드용 (Content-Type 미포함) */
export function authHeadersFormData(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 비동기 인증 헤더 — Supabase 공식 API(getSession)로 access_token 획득
 *
 * getToken() 의 localStorage 스캔 방식은 키 패턴/파싱 실패/타이밍에 취약.
 * 이 함수는 supabase-js 인스턴스에게 세션을 물어 안정적으로 토큰을 얻는다.
 * Bearer 필수 엔드포인트(/api/chat, /api/chat/stream 등)에 사용 권장.
 *
 * 부수효과: 세션이 있으면 sb-access-token 쿠키에도 동기화 → 서버 쿠키 폴백 보장.
 */
export async function authHeadersAsync(json = true): Promise<HeadersInit> {
  const base: HeadersInit = json ? { 'Content-Type': 'application/json' } : {};
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || getToken();
    if (token) syncSessionCookie(token, data.session?.expires_at);
    return token ? { ...base, Authorization: `Bearer ${token}` } : base;
  } catch {
    const token = getToken();
    if (token) syncSessionCookie(token);
    return token ? { ...base, Authorization: `Bearer ${token}` } : base;
  }
}

/**
 * Supabase 세션 access_token 을 브라우저 쿠키(sb-access-token)로 동기화.
 *
 * Supabase-js v2 는 기본적으로 localStorage 에만 세션을 저장한다.
 * Next.js 서버 라우트(/api/chat/stream 등)는 localStorage 를 읽을 수 없으므로,
 * 클라이언트가 쿠키로 토큰을 실어 서버 폴백 인증 경로가 동작하도록 한다.
 *
 * 보안: SameSite=Lax + Secure(프로덕션) + Path=/; HttpOnly 는 불가(클라에서 써야 하므로).
 * Bearer 토큰과 동일한 JWT 이므로 추가 노출 위험 없음 (XSS 면에선 localStorage 와 동급).
 */
export function syncSessionCookie(accessToken: string, expiresAt?: number): void {
  if (typeof document === 'undefined') return;
  if (!accessToken) return;
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secure = isHttps ? '; Secure' : '';
  // 기본 만료: 1시간. expires_at (초 단위 unix) 있으면 그 시각까지.
  let expires = '';
  if (expiresAt && expiresAt * 1000 > Date.now()) {
    expires = `; Expires=${new Date(expiresAt * 1000).toUTCString()}`;
  } else {
    expires = `; Max-Age=3600`;
  }
  document.cookie = `sb-access-token=${accessToken}; Path=/; SameSite=Lax${secure}${expires}`;
}

/**
 * 로그아웃 시 호출 — sb-access-token 쿠키 제거.
 */
export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'sb-access-token=; Path=/; Max-Age=0; SameSite=Lax';
}
