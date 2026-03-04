# Task Instruction - S2F2

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
S2F2

## Task Name
비밀번호 재설정 UI

## Task Goal
이메일 인증 기반 비밀번호 재설정 폼 및 이메일 전송 연동 구현

## Prerequisites (Dependencies)
- S2BA2 (이메일 발송 API) 완료

## Specific Instructions

### 1. 비밀번호 재설정 요청 페이지
- 위치: `pages/auth/forgot-password.html`

```html
<div class="forgot-password-container">
  <h2>비밀번호 재설정</h2>
  <p>가입하신 이메일 주소를 입력해주세요.</p>

  <form id="forgotPasswordForm">
    <input type="email" id="email" placeholder="이메일 주소" required />
    <button type="submit">재설정 링크 발송</button>
  </form>

  <div id="successMessage" style="display:none;">
    <p>이메일이 발송되었습니다. 받은편지함을 확인해주세요.</p>
  </div>
</div>
```

### 2. 이메일 발송 연동
```javascript
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;

  const response = await fetch('/api/email/password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (response.ok) {
    document.getElementById('successMessage').style.display = 'block';
    document.getElementById('forgotPasswordForm').style.display = 'none';
  }
});
```

### 3. 비밀번호 재설정 페이지
- 위치: `pages/auth/reset-password.html`
- URL 파라미터로 토큰 수신
- 새 비밀번호 입력 폼

```html
<form id="resetPasswordForm">
  <input type="password" id="newPassword" placeholder="새 비밀번호" required />
  <input type="password" id="confirmPassword" placeholder="비밀번호 확인" required />
  <button type="submit">비밀번호 변경</button>
</form>
```

### 4. 비밀번호 유효성 검사
- 최소 8자
- 영문/숫자 조합
- 특수문자 권장

### 5. 로그인 페이지에 링크 추가
- `pages/auth/login.html`에 "비밀번호를 잊으셨나요?" 링크 추가

## Expected Output Files
- `pages/auth/forgot-password.html` (신규)
- `pages/auth/reset-password.html` (신규 또는 수정)
- `pages/auth/login.html` (수정 - 링크 추가)

## Completion Criteria
- [ ] 비밀번호 재설정 요청 페이지 구현
- [ ] 이메일 발송 API 연동
- [ ] 비밀번호 재설정 페이지 구현
- [ ] 비밀번호 유효성 검사
- [ ] 로그인 페이지에 링크 추가
- [ ] 성공/에러 메시지 표시

## Tech Stack
- HTML/CSS/JavaScript
- Supabase Auth

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Tools
- Read, Write, Edit

## Execution Type
AI-Only

## Remarks
- Supabase의 내장 비밀번호 재설정 기능 활용 가능
- 이메일 발송은 Resend API 사용

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

