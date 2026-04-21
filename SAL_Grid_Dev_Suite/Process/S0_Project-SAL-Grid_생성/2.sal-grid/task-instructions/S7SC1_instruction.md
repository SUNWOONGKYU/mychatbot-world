# S7SC1: 비밀번호 재설정 플로우 복구

## Task 정보
- **Task ID**: S7SC1
- **Task Name**: 비밀번호 재설정 플로우 복구
- **Stage**: S7
- **Area**: SC (Security)
- **Dependencies**: —

## 배경 / 증상
- 사용자가 `/reset-password`에서 이메일 입력 → 링크 클릭 → 새 비밀번호 입력 중 "재설정 링크가 만료되었거나 이미 사용되었습니다" 오류 팝업.
- `updateUser()` 호출 전 세션이 이미 무효화되어 변경 실패.

## Root Cause
1. `app/reset-password/page-client.tsx`의 useEffect가 `searchParams` 의존성으로 리마운트/리렌더 때 재실행.
2. 재실행 시 `supabase.auth.setSession({ access_token, refresh_token })`를 single-use `refresh_token`으로 다시 호출 → 두 번째 호출에서 토큰 고갈로 실패 → 세션 무효 상태.
3. `resetPasswordForEmail`의 `redirectTo`가 `/reset-password`(hash 직행)이므로 `app/auth/callback/page.tsx`의 안전 처리 경로(once 보장 + router.replace로 hash 제거)를 우회.

## 목표
비밀번호 재설정이 재현 가능하게 성공.

## 수행 작업
1. `app/reset-password/page-client.tsx`
   - `resetPasswordForEmail({ redirectTo })`의 `redirectTo`를 `${origin}/auth/callback`으로 전환.
   - 해당 useEffect 내 hash 기반 `setSession` 블록 제거(또는 once-ref로 한 번만 실행하도록 가드). `/auth/callback`이 세션 수립 후 hash 없는 상태로 `/reset-password`로 replace 하므로 이 페이지에서는 hash 파싱 불필요.
   - `onAuthStateChange(PASSWORD_RECOVERY)` 리스너는 유지.
   - useEffect 의존성에 의한 재실행 영향 제거(unmount 전까지 setSession 재호출 없음).

2. (확인) `app/auth/callback/page.tsx`에서 `type=recovery` 분기가 setSession 후 `/reset-password`로 replace 하는지 — 이미 존재하면 그대로 사용.

## 생성/수정 파일
| 파일 | 변경 |
|------|------|
| `app/reset-password/page-client.tsx` | redirectTo 변경 + setSession once-guard 또는 블록 제거 |

## 검증 기준
- 정적: `setSession` 호출 지점이 `/reset-password`에서 제거되거나 once-ref로 보호.
- 정적: `redirectTo`가 `/auth/callback`.
- 실측: 프로덕션에서 이메일 재설정 요청 → 링크 클릭 → 새 비밀번호 입력/전송 중간 에러 0회 → `/login` 도달.

## 작업 Agent
`security-specialist-core`

## 검증 Agent
`security-specialist-core`
