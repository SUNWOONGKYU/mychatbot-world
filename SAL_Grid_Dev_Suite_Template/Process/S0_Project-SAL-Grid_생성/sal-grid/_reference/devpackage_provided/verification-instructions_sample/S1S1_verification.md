# Verification Instruction - S1S1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S1S1

## Task Name
Supabase Auth Provider 설정

## Verification Checklist

### 1. Google Cloud Console 설정 검증
- [ ] Google Cloud 프로젝트에 OAuth 2.0 클라이언트 존재
- [ ] Application type이 "Web application"인지 확인
- [ ] Authorized redirect URIs에 Supabase callback URL 등록됨
  - `https://[project-ref].supabase.co/auth/v1/callback`

### 2. Supabase Dashboard 설정 검증
- [ ] Authentication > Providers > Google이 활성화됨
- [ ] Client ID가 올바르게 입력됨
- [ ] Client Secret이 올바르게 입력됨

### 3. OAuth Consent Screen 검증
- [ ] 앱 이름이 올바르게 설정됨
- [ ] 필요한 Scopes (email, profile, openid) 설정됨

### 4. ⭐ 실제 작동 테스트 (필수!)
- [ ] 로컬 서버 실행 (localhost)
- [ ] Google 로그인 버튼 클릭
- [ ] Google OAuth 화면으로 리다이렉트됨
- [ ] Google 계정 선택 후 로그인 성공
- [ ] 원래 페이지로 돌아옴
- [ ] 사용자 정보가 Supabase에 저장됨

## Test Commands
```bash
# 로컬 서버 실행
cd Production/Frontend
npx serve . -l 8888

# 브라우저에서 테스트
# http://localhost:8888/pages/auth/google-login.html
```

## Expected Results
- Google OAuth 화면이 올바르게 표시됨
- 로그인 후 원래 페이지로 리다이렉트됨
- Supabase auth.users 테이블에 사용자 생성됨

## Verification Agent
devops-troubleshooter

## Pass Criteria
- Google Cloud Console 설정 완료
- Supabase Google Provider 활성화
- **⭐ 실제 로그인 테스트 성공 (필수)**

## ⚠️ Human-AI Task 검증 주의사항

이 Task는 **Human-AI** 유형입니다.
- 가이드 문서 작성만으로는 완료가 아닙니다
- **PO가 실제로 외부 서비스 설정을 완료해야 합니다**
- **실제 작동 테스트가 필수입니다**

### 검증 절차
1. AI: 설정 가이드 제공
2. PO: Google Cloud Console 설정 (Human)
3. PO: Supabase Dashboard 설정 (Human)
4. AI + PO: 실제 로그인 테스트
5. 테스트 성공 시에만 "완료" 처리

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] `GOOGLE_OAUTH_SETUP.md` 문서가 `S1_개발_준비/Security/`에 저장되었는가?
- [ ] 외부 서비스(Google Cloud, Supabase) 설정이 완료되었는가?
- [ ] 실제 작동 테스트가 성공했는가?
