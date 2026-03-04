# Task Instruction - S1S1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S1S1

## Task Name
Supabase Auth Provider 설정

## Task Goal
Supabase에서 Google OAuth Provider 설정 및 Redirect URL 등록

## Prerequisites (Dependencies)
- S1BI1 (환경변수 설정) 완료
- Google Cloud Console 프로젝트 존재

## Specific Instructions

### 1. Google Cloud Console 설정
- Google Cloud Console (https://console.cloud.google.com) 접속
- 프로젝트 선택 또는 생성
- APIs & Services > Credentials 이동

### 2. OAuth 2.0 클라이언트 생성
- "Create Credentials" > "OAuth client ID"
- Application type: "Web application"
- Name: "SSALWorks"
- Authorized JavaScript origins:
  - `http://localhost:3000` (개발)
  - `https://ssalworks.vercel.app` (프로덕션)
  - `https://ssalworks.com` (커스텀 도메인, 추후)
- Authorized redirect URIs:
  - `https://[supabase-project-id].supabase.co/auth/v1/callback`

### 3. Client ID/Secret 저장
- Client ID 복사 → Vercel 환경변수 `GOOGLE_CLIENT_ID`
- Client Secret 복사 → Vercel 환경변수 `GOOGLE_CLIENT_SECRET`

### 4. Supabase Dashboard 설정
- Supabase Dashboard > Authentication > Providers
- Google 활성화
- Client ID 입력
- Client Secret 입력
- Redirect URL 확인

### 5. OAuth Consent Screen 설정
- User Type: External
- App name: SSALWorks
- User support email 설정
- Developer contact email 설정
- Scopes: email, profile, openid

## Expected Output Files
- `S1_개발_준비/Security/GOOGLE_OAUTH_SETUP.md` (Google OAuth 설정 가이드)

## ⚠️ Human-AI Task 주의사항

이 Task는 **Human-AI** 유형입니다.
- **가이드 문서 작성만으로는 완료가 아닙니다!**
- **PO가 실제로 외부 서비스 설정을 완료해야 합니다!**
- **실제 작동 테스트가 필수입니다!**

### 작업 절차
1. AI: 설정 가이드 제공
2. **PO: Google Cloud Console 설정 (Human 필수)**
3. **PO: Supabase Dashboard 설정 (Human 필수)**
4. AI + PO: 실제 로그인 테스트
5. **테스트 성공 시에만 "완료" 처리**

## Completion Criteria
- [ ] Google Cloud OAuth 클라이언트 생성 **(PO 실행)**
- [ ] Supabase Google Provider 활성화 **(PO 실행)**
- [ ] Redirect URL 등록 완료 **(PO 실행)**
- [ ] OAuth Consent Screen 설정 완료 **(PO 실행)**
- [ ] 설정 가이드 문서 작성 (AI)
- [ ] **⭐ 실제 로그인 테스트 성공 (필수!)**

## Tech Stack
- Google Cloud Console
- Supabase Authentication
- OAuth 2.0

## Task Agent
`security-specialist`

## Verification Agent
`security-auditor`

## Tools
- WebFetch (Dashboard 접속)
- Write (문서 작성)

## Execution Type
Human-AI (Dashboard 접속 필요)

## Remarks
- OAuth Consent Screen 승인에 시간 소요 가능
- 개발 중에는 Test users 추가하여 사용
- 프로덕션 배포 시 OAuth 앱 승인 신청 필요

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content

