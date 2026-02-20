# Task Instruction - S2F3

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
S2F3

## Task Name
회원가입 UI

## Task Goal
이메일/비밀번호 회원가입 폼 구현 (Google OAuth 외 별도 가입 경로)

## Prerequisites (Dependencies)
- S2BA4 (회원가입 API) 완료

## Specific Instructions

### 1. 회원가입 페이지
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/auth/signup.html`

```html
<!-- pages/auth/signup.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>회원가입 - SSALWorks</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../auth.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <a href="/" class="logo">SSALWorks</a>
                <h1>회원가입</h1>
                <p>새 계정을 만들어 시작하세요</p>
            </div>

            <form id="signup-form" class="auth-form">
                <div class="form-group">
                    <label for="name">이름</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="홍길동"
                        autocomplete="name"
                    >
                </div>

                <div class="form-group">
                    <label for="email">이메일 <span class="required">*</span></label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="example@email.com"
                        required
                        autocomplete="email"
                    >
                    <span class="error-message" id="email-error"></span>
                </div>

                <div class="form-group">
                    <label for="password">비밀번호 <span class="required">*</span></label>
                    <div class="password-input">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="8자 이상, 영문/숫자/특수문자 포함"
                            required
                            autocomplete="new-password"
                        >
                        <button type="button" class="toggle-password" onclick="togglePassword('password')">
                            👁️
                        </button>
                    </div>
                    <div class="password-strength" id="password-strength"></div>
                    <span class="error-message" id="password-error"></span>
                </div>

                <div class="form-group">
                    <label for="password-confirm">비밀번호 확인 <span class="required">*</span></label>
                    <div class="password-input">
                        <input
                            type="password"
                            id="password-confirm"
                            name="passwordConfirm"
                            placeholder="비밀번호를 다시 입력하세요"
                            required
                            autocomplete="new-password"
                        >
                        <button type="button" class="toggle-password" onclick="togglePassword('password-confirm')">
                            👁️
                        </button>
                    </div>
                    <span class="error-message" id="password-confirm-error"></span>
                </div>

                <div class="form-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="terms" name="terms" required>
                        <span><a href="/pages/legal/terms.html" target="_blank">이용약관</a> 및 <a href="/pages/legal/privacy.html" target="_blank">개인정보처리방침</a>에 동의합니다</span>
                    </label>
                </div>

                <div class="form-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="marketing" name="marketing">
                        <span>마케팅 정보 수신에 동의합니다 (선택)</span>
                    </label>
                </div>

                <button type="submit" class="btn-submit" id="submit-btn">
                    <span>회원가입</span>
                </button>
            </form>

            <div class="auth-divider">
                <span>또는</span>
            </div>

            <button class="btn-google" onclick="signupWithGoogle()">
                <img src="../../assets/google-icon.svg" alt="Google">
                Google로 회원가입
            </button>

            <div class="auth-footer">
                <p>이미 계정이 있으신가요? <a href="/pages/auth/login.html">로그인</a></p>
            </div>
        </div>
    </div>

    <script src="../../signup.js"></script>
</body>
</html>
```

### 2. 회원가입 JavaScript
- 위치: `P3_프로토타입_제작/Frontend/Prototype/signup.js`

```javascript
// signup.js
/**
 * @task S2F3
 * 회원가입 폼 처리 로직
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password-confirm');
    const emailInput = document.getElementById('email');

    // 비밀번호 강도 체크
    passwordInput.addEventListener('input', () => {
        updatePasswordStrength(passwordInput.value);
        validatePasswordMatch();
    });

    // 비밀번호 확인 체크
    passwordConfirmInput.addEventListener('input', validatePasswordMatch);

    // 이메일 형식 체크
    emailInput.addEventListener('blur', () => {
        validateEmail(emailInput.value);
    });

    // 폼 제출
    form.addEventListener('submit', handleSubmit);
});

async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const name = document.getElementById('name').value.trim();
    const terms = document.getElementById('terms').checked;
    const marketing = document.getElementById('marketing').checked;

    // 유효성 검사
    if (!validateEmail(email)) return;
    if (!validatePassword(password)) return;
    if (password !== passwordConfirm) {
        showError('password-confirm-error', '비밀번호가 일치하지 않습니다');
        return;
    }
    if (!terms) {
        alert('이용약관에 동의해주세요');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> 처리 중...';

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                name,
                marketing_consent: marketing
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '회원가입에 실패했습니다');
        }

        // 성공 - 이메일 확인 페이지로 이동
        window.location.href = `/pages/auth/verify-email.html?email=${encodeURIComponent(email)}`;

    } catch (error) {
        alert(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>회원가입</span>';
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    if (!isValid && email.length > 0) {
        showError('email-error', '유효한 이메일 형식이 아닙니다');
    } else {
        clearError('email-error');
    }

    return isValid;
}

function validatePassword(password) {
    const errors = [];

    if (password.length < 8) errors.push('8자 이상');
    if (!/[a-zA-Z]/.test(password)) errors.push('영문');
    if (!/\d/.test(password)) errors.push('숫자');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('특수문자');

    if (errors.length > 0) {
        showError('password-error', `다음이 필요합니다: ${errors.join(', ')}`);
        return false;
    }

    clearError('password-error');
    return true;
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('password-confirm').value;

    if (confirm.length > 0 && password !== confirm) {
        showError('password-confirm-error', '비밀번호가 일치하지 않습니다');
        return false;
    }

    clearError('password-confirm-error');
    return true;
}

function updatePasswordStrength(password) {
    const strengthDiv = document.getElementById('password-strength');
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    let label, className;
    if (strength <= 2) {
        label = '약함';
        className = 'weak';
    } else if (strength <= 3) {
        label = '보통';
        className = 'medium';
    } else {
        label = '강함';
        className = 'strong';
    }

    strengthDiv.innerHTML = `
        <div class="strength-bar ${className}">
            <div class="strength-fill" style="width: ${strength * 20}%"></div>
        </div>
        <span class="strength-label">${label}</span>
    `;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function signupWithGoogle() {
    window.location.href = '/api/auth/google';
}
```

### 3. 이메일 확인 안내 페이지
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/auth/verify-email.html`

```html
<!-- pages/auth/verify-email.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>이메일 확인 - SSALWorks</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../auth.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card verify-email">
            <div class="verify-icon">📧</div>
            <h1>이메일을 확인해주세요</h1>
            <p><strong id="user-email">이메일</strong>로 확인 메일을 발송했습니다.</p>
            <p>메일함을 확인하고 링크를 클릭하여 가입을 완료해주세요.</p>

            <div class="verify-tips">
                <h3>메일이 안 오나요?</h3>
                <ul>
                    <li>스팸 메일함을 확인해주세요</li>
                    <li>이메일 주소가 정확한지 확인해주세요</li>
                    <li>몇 분 후에 다시 시도해주세요</li>
                </ul>
            </div>

            <button class="btn-secondary" onclick="resendEmail()">확인 메일 재발송</button>
            <a href="/pages/auth/login.html" class="btn-text">로그인 페이지로</a>
        </div>
    </div>

    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        if (email) {
            document.getElementById('user-email').textContent = email;
        }

        async function resendEmail() {
            if (!email) {
                alert('이메일 정보가 없습니다');
                return;
            }

            try {
                const response = await fetch('/api/auth/resend-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (response.ok) {
                    alert('확인 메일을 다시 발송했습니다');
                } else {
                    const data = await response.json();
                    alert(data.error || '발송에 실패했습니다');
                }
            } catch (error) {
                alert('오류가 발생했습니다');
            }
        }
    </script>
</body>
</html>
```

## Expected Output Files
- `P3_프로토타입_제작/Frontend/Prototype/pages/auth/signup.html`
- `P3_프로토타입_제작/Frontend/Prototype/signup.js`
- `P3_프로토타입_제작/Frontend/Prototype/pages/auth/verify-email.html`

## Completion Criteria
- [ ] 이메일/비밀번호 입력 폼
- [ ] 이름 입력 (선택)
- [ ] 비밀번호 강도 표시
- [ ] 비밀번호 일치 확인
- [ ] 이용약관 동의 체크박스
- [ ] 마케팅 동의 체크박스 (선택)
- [ ] Google 회원가입 버튼
- [ ] 이메일 확인 안내 페이지
- [ ] 반응형 디자인

## Tech Stack
- HTML/CSS/JavaScript

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Tools
- S2BA4 (회원가입 API) 연동

## Execution Type
AI-Only

## Remarks
- 비밀번호 요구사항: 8자 이상, 영문/숫자/특수문자 포함
- 회원가입 후 이메일 확인 필수
- Google OAuth와 이메일 가입 모두 지원

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
