# Task Instruction - S5O1

---

## 📌 필수 참조 규칙 파일 (2025-12-22)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S5O1

## Task Name
배포상황 최종 검증

## Task Goal
이미 배포된 프로덕션 환경(ssalworks.ai.kr)의 최종 검증 및 문서화

## Prerequisites (Dependencies)
- S4T2 (API 통합 테스트) 완료

## Specific Instructions

### 1. 배포 상태 확인

> **참고**: Vercel 배포 및 도메인 연결은 S1F1, S1O1에서 이미 완료됨

- 배포 URL: https://ssalworks.ai.kr
- Vercel 프로젝트: ssalworks
- 도메인 연결: 완료 (S1O1)

### 2. 환경변수 최종 확인

**필수 환경변수:**
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY (이메일)

**결제 관련 (토스페이먼츠 연동 시):**
- TOSS_CLIENT_KEY
- TOSS_SECRET_KEY

### 3. 프로덕션 검증 체크리스트

**기본 동작:**
- 메인 페이지 로드 (https://ssalworks.ai.kr)
- HTTP → HTTPS 리다이렉트 확인

**SSL 인증서 확인 (S5O3 통합):**
- SSL 인증서 유효성 확인 (HTTPS 자물쇠)
- 인증서 만료일 확인 (30일 이상 여유)
- HSTS 헤더 적용 확인 (Strict-Transport-Security)
- SSL Labs 등급 확인 (목표: A 이상) - https://ssllabs.com/ssltest/

**보안 헤더 확인:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

**페이지 접근성:**
- 로그인/회원가입 페이지
- My Page
- 관리자 대시보드

**인증 기능:**
- 이메일/비밀번호 로그인
- Google OAuth 로그인
- 비밀번호 재설정

**핵심 기능:**
- 공지사항, 학습용 콘텐츠, FAQ 표시
- 프로젝트 관리

### 4. 검증 결과 문서화

- 위치: `S5_개발_마무리/DevOps/S5O1_deployment_verification.md`

## Expected Output Files
- `S5_개발_마무리/DevOps/S5O1_deployment_verification.md`

## Completion Criteria
- [ ] 배포 상태 확인 완료
- [ ] 환경변수 확인 완료
- [ ] SSL 인증서 및 HTTPS 확인 완료
- [ ] 보안 헤더 확인 완료
- [ ] 기능 검증 완료
- [ ] 검증 결과 문서화 완료

## Tech Stack
- Vercel
- 웹 브라우저

## Task Agent
`devops-troubleshooter`

## Verification Agent
`qa-specialist`

## Tools
- 웹 브라우저
- curl (헤더 확인)

## Execution Type
AI-Only

## Remarks
- 이미 배포된 환경의 검증이므로 배포 작업은 불필요
- 문제 발견 시 해당 영역 담당 Task로 이관

---

## ⚠️ 작업 결과물 저장 규칙

- S5O1 → `S5_개발_마무리/DevOps/`
