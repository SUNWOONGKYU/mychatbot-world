/**
 * 클라이언트 사이드 인증 유틸리티
 * getToken / authHeaders 중복 제거 — 마이페이지 탭 전체에서 공유
 */

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('mcw_access_token') ||
    sessionStorage.getItem('mcw_access_token') ||
    ''
  );
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
