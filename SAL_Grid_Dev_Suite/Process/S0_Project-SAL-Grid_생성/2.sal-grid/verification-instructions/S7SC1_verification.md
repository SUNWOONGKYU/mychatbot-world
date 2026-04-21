# S7SC1 Verification

## 검증 항목

### 1. 정적 코드 검증
- [ ] `app/reset-password/page-client.tsx`의 `resetPasswordForEmail` 호출에서 `redirectTo`가 `${origin}/auth/callback`으로 되어 있는가?
- [ ] 동일 파일의 useEffect에서 `supabase.auth.setSession` 호출이 제거되었거나 once-ref로 한 번만 실행되도록 가드되었는가?
- [ ] useEffect 의존성 배열 변경에 따라 setSession이 재호출되지 않는가?

### 2. 실측 (프로덕션)
- [ ] 로그인 페이지 > "비밀번호 찾기" → 이메일 입력 → 링크 수신.
- [ ] 이메일 링크 클릭 → `/auth/callback` 경유 → `/reset-password`(hash 없음) 도착.
- [ ] "새 비밀번호" 입력 중 오류 팝업 0회.
- [ ] 새 비밀번호 제출 → "비밀번호가 변경되었습니다" → `/login` 이동.
- [ ] 새 비밀번호로 로그인 성공.

### 3. Blockers 확인
- 이메일 스캐너(Daum/Hanmail) 프리페치: `/auth/callback`이 `router.replace`로 hash를 제거하므로 동일 링크 재방문 시 에러 상태로 넘어감이 정상(이미 소진). 이 경우 사용자에게 "새 링크 요청" 안내가 노출되어야 함.

## 최종 판정 기준
- 정적 ✅ + 실측 ✅ → Verified
- 한 항목이라도 FAIL → Needs Fix
