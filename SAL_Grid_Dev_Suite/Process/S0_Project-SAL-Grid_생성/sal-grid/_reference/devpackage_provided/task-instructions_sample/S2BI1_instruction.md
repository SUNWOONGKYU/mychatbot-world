# Task Instruction - S2BI1

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
S2BI1

## Task Name
Resend 이메일 서비스 설정

## Task Goal
Resend API 키 설정, 도메인 인증, 발신자 설정

## Prerequisites (Dependencies)
- S1BI1 (환경변수 설정) 완료

## Specific Instructions

### 1. Resend 계정 설정
- Resend (https://resend.com) 가입
- API Key 생성
- 환경변수에 추가: `RESEND_API_KEY`

### 2. 도메인 인증 (선택사항)
- Resend Dashboard > Domains
- ssalworks.com 추가
- DNS 레코드 설정:
  - SPF 레코드
  - DKIM 레코드
  - 검증 대기

### 3. 발신자 설정
- 도메인 인증 전: `onboarding@resend.dev` 사용
- 도메인 인증 후: `noreply@ssalworks.com` 사용

### 4. 이메일 템플릿 구조 생성
```
api/
├── lib/
│   └── email/
│       ├── resend.js          # Resend 클라이언트
│       └── templates/
│           ├── welcome.js      # 환영 이메일
│           └── password-reset.js # 비밀번호 재설정
```

### 5. Resend 클라이언트 설정
```javascript
// api/lib/email/resend.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = { resend };
```

### 6. 테스트 이메일 발송
```javascript
const { resend } = require('./resend');

await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'test@example.com',
  subject: 'SSALWorks 테스트',
  html: '<p>테스트 이메일입니다.</p>'
});
```

## Expected Output Files
- `S2_개발-1차/Backend_Infra/email/resend.js` - Resend 클라이언트
- `S2_개발-1차/Backend_Infra/email/templates/welcome.js` - 환영 이메일
- `S2_개발-1차/Backend_Infra/email/templates/password-reset.js` - 비밀번호 재설정
- `S2_개발-1차/Backend_Infra/RESEND_SETUP.md` - 설정 가이드
- `Production/Backend_APIs/lib/email/` - Production 복사본

## ⚠️ Human-AI Task 주의사항

이 Task는 **Human-AI** 유형입니다.
- **가이드 문서 작성만으로는 완료가 아닙니다!**
- **PO가 실제로 Resend 계정 및 API 설정을 완료해야 합니다!**
- **실제 이메일 발송 테스트가 필수입니다!**

### 작업 절차
1. AI: 설정 가이드 및 코드 템플릿 제공
2. **PO: Resend 계정 가입 (Human 필수)**
3. **PO: API Key 발급 및 환경변수 설정 (Human 필수)**
4. AI + PO: 테스트 이메일 발송
5. **테스트 성공 시에만 "완료" 처리**

## Completion Criteria
- [ ] Resend 계정 생성 **(PO 실행)**
- [ ] API Key 발급 및 환경변수 설정 **(PO 실행)**
- [ ] Resend 클라이언트 파일 생성 (AI)
- [ ] 이메일 템플릿 구조 생성 (AI)
- [ ] 설정 가이드 문서 작성 (AI)
- [ ] **⭐ 실제 테스트 이메일 발송 성공 (필수!)**
- [ ] **⭐ 수신자에게 이메일 도착 확인 (필수!)**

## Tech Stack
- Resend
- Node.js

## Task Agent
`devops-troubleshooter`

## Verification Agent
`qa-specialist`

## Tools
- Write, Read
- Bash (npm install resend)
- WebFetch (Resend Dashboard)

## Execution Type
Human-AI (Resend Dashboard 접속 필요)

## Remarks
- 무료 티어: 월 3,000 이메일
- 도메인 인증은 DNS 전파 시간 필요
- 개발 중에는 @resend.dev 도메인 사용 가능

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

