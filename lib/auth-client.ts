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
 */
export async function authHeadersAsync(json = true): Promise<HeadersInit> {
  const base: HeadersInit = json ? { 'Content-Type': 'application/json' } : {};
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || getToken();
    return token ? { ...base, Authorization: `Bearer ${token}` } : base;
  } catch {
    const token = getToken();
    return token ? { ...base, Authorization: `Bearer ${token}` } : base;
  }
}
