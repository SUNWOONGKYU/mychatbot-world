# Verification Instruction - S1SC1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S1SC1

## Task Name
Supabase Auth 강화 (소셜 로그인, 세션 관리)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `lib/auth.ts` 존재
- [ ] `app/auth/callback/route.ts` 존재
- [ ] `middleware.ts` 존재 (프로젝트 루트)
- [ ] `app/login/page.tsx` 존재

### 2. 코드 품질 검증
- [ ] `@task S1SC1` 주석이 각 파일에 포함
- [ ] `lib/auth.ts`에 `signInWithGoogle`, `signInWithKakao`, `signOut`, `getSession`, `getCurrentUser` 함수 존재
- [ ] `middleware.ts`에 공개 경로 목록 (`PUBLIC_PATHS`) 정의됨
- [ ] 미들웨어 `matcher` 설정: 정적 파일 제외
- [ ] TypeScript 타입 에러 없음

### 3. 보안 검증
- [ ] `.env.local`에 Google OAuth 키가 하드코딩되지 않음 (환경변수 사용)
- [ ] 클라이언트 코드에 `SUPABASE_SERVICE_ROLE_KEY` 노출 없음
- [ ] OAuth 리디렉트 URI가 `window.location.origin`을 동적으로 사용
- [ ] Supabase PKCE 플로우 사용 (CSRF 자동 보호)
- [ ] 세션 쿠키 기반 관리 (localStorage 직접 사용 금지)

### 4. 인증 플로우 검증 (PO 테스트 필요)
- [ ] `/login` 페이지 접속 시 Google/Kakao 버튼 표시
- [ ] Google 버튼 클릭 → Google OAuth 페이지로 이동
- [ ] Kakao 버튼 클릭 → Kakao OAuth 페이지로 이동
- [ ] OAuth 완료 후 `/auth/callback` 처리 → `/dashboard` 리디렉트
- [ ] 로그인 상태에서 `/login` 접근 → `/dashboard` 리디렉트

### 5. 미들웨어 라우트 보호 검증
- [ ] 비인증 상태에서 `/dashboard` 접근 → `/login` 리디렉트
- [ ] 비인증 상태에서 `/bots` 접근 → `/login` 리디렉트
- [ ] 비인증 상태에서 `/` 접근 → 정상 접근 (공개 경로)
- [ ] 비인증 상태에서 `/templates` 접근 → 정상 접근 (공개 경로)

### 6. 세션 관리 검증
- [ ] 로그인 후 페이지 새로고침 시 세션 유지
- [ ] `signOut()` 호출 후 세션 삭제 확인
- [ ] 세션 만료 시 자동 갱신 (미들웨어에서 처리)

### 7. 통합 검증
- [ ] S1DB1의 `auth.users`와 Supabase Auth 연결 정상
- [ ] 소셜 로그인 후 `auth.users` 테이블에 사용자 레코드 생성
- [ ] `@supabase/auth-helpers-nextjs` 패키지 설치됨

### 8. 저장 위치 검증
- [ ] `Process/S1_개발_준비/Security/`에 Auth 관련 문서 저장됨

## Test Commands
```bash
# 파일 존재 확인
ls lib/auth.ts app/auth/callback/route.ts middleware.ts app/login/page.tsx

# 타입 체크
npx tsc --noEmit

# 패키지 설치 확인
npm list @supabase/auth-helpers-nextjs

# 빌드 확인
npm run build

# 미들웨어 설정 확인
grep -n "PUBLIC_PATHS\|matcher" middleware.ts

# 보안: 환경변수 사용 확인 (하드코딩 없음)
grep -rn "supabase.co" lib/auth.ts || echo "PASS: no hardcoded URL"
```

## Expected Results
- 4개 파일 모두 존재
- `npm run build` 성공
- `npx tsc --noEmit` 에러 0개
- `lib/auth.ts`에 5개 함수 존재
- 하드코딩된 API 키/URL 없음

## Verification Agent
security-specialist-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 보안 검증 통과 (키 노출 없음)
- [ ] 빌드 에러 없음
- [ ] PO 테스트: 소셜 로그인 플로우 1회 이상 성공
- [ ] Blocker 없음

## ⚠️ Human-AI Task 검증 주의사항
이 Task는 **Human-AI** 유형입니다.
- Google/Kakao OAuth Provider 설정은 PO가 수행 (Supabase Dashboard + 각 플랫폼)
- 실제 소셜 로그인 플로우 테스트는 OAuth Provider 설정 완료 후에만 가능
- Provider 설정 전까지 인증 플로우 검증은 "PENDING" 처리
