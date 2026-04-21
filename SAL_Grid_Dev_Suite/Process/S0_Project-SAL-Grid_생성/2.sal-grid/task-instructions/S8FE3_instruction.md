# S8FE3: 관리자 페이지 비밀번호 폼 제거 + Bearer 자동 인증

## Task 정보
- **Task ID**: S8FE3
- **Stage**: S8
- **Area**: FE
- **Dependencies**: S7FE9

## Task 목표

관리자 계정으로 로그인한 사용자가 `/admin`에서 별도 비밀번호 입력 없이 자동 인증되도록 한다. 권한은 `profiles.is_admin` 서버 체크로만 판정한다.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/admin/page.tsx` | AdminLoginForm + loginStyles 삭제, useEffect에서 `getToken()` → `Authorization: Bearer {token}` → `/api/admin/stats` 호출, 상태별 UI 분기 |

## 요구사항

- 토큰 없음 → `/login?next=/admin` 리다이렉트
- 200 → `setAuthed(true)`, `adminKey = token`
- 403 → "관리자 권한이 없습니다." 메시지 + 마이페이지 링크
- 기타 → "인증 확인에 실패했습니다."
- `loadBadges`도 `Authorization: Bearer` 사용
- `onLogout` → `window.location.href = '/login'`
