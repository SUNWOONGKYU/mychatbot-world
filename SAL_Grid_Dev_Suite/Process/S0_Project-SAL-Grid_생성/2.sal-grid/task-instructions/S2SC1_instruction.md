# Task Instruction - S2SC1

---

## Task ID
S2SC1

## Task Name
Google/Kakao OAuth Provider 설정

## Task Goal
S1SC1에서 작성한 Auth 코드가 실제로 동작하도록 Google/Kakao OAuth Provider를 설정한다.

## Prerequisites (Dependencies)
- S1SC1 (Auth 코드 완료 — lib/auth.ts, middleware.ts, callback, login page)

## Specific Instructions

### 1. Google OAuth 설정

1. **Google Cloud Console** (https://console.cloud.google.com)
   - 프로젝트 선택 또는 생성
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://[project-ref].supabase.co/auth/v1/callback`
   - Client ID와 Client Secret 복사

2. **Supabase Dashboard** → Authentication → Providers → Google
   - Enable 활성화
   - Client ID 입력
   - Client Secret 입력
   - Save

### 2. Kakao OAuth 설정

1. **Kakao Developers** (https://developers.kakao.com)
   - 애플리케이션 추가
   - 앱 키 → REST API 키 복사
   - 플랫폼 → Web → 사이트 도메인 등록
   - 카카오 로그인 → 활성화
   - Redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`

2. **Supabase Dashboard** → Authentication → Providers → Kakao
   - Enable 활성화
   - Client ID (REST API 키) 입력
   - Client Secret 입력
   - Save

### 3. 동작 확인
- `/login` 페이지에서 Google 버튼 클릭 → Google 로그인 페이지로 이동
- `/login` 페이지에서 Kakao 버튼 클릭 → Kakao 로그인 페이지로 이동
- 로그인 성공 → `/dashboard`로 리디렉트

## Expected Output Files
- 없음 (외부 서비스 설정만)

## Completion Criteria
- [ ] Google OAuth 버튼 클릭 시 Google 로그인 페이지 이동
- [ ] Kakao OAuth 버튼 클릭 시 Kakao 로그인 페이지 이동
- [ ] OAuth 콜백 후 /dashboard 리디렉트 성공

## Execution Type
Human-Only (PO가 외부 서비스에서 직접 설정)

## Remarks
- S1SC1에서 분리된 PO 작업
- 상세 가이드: Process/S1_개발_준비/Security/S1SC1_auth_setup.md
- S2FE 작업(로그인 필요 페이지) 시작 전 완료 필요
