# ⚠️ SAMPLE — Task Instruction - S2FE1 (구 S2F1)
> **이 파일은 샘플입니다.** 실제 프로젝트에서는 이 형식을 참고하여 새 Instruction을 생성하세요.
> V3 Area 코드: F(Frontend) → FE(Frontend)

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
S2F1

## Task Name
Google 소셜 로그인 UI

## Task Goal
Google 로그인 버튼 및 OAuth 콜백 페이지 구현

## Prerequisites (Dependencies)
- S2BA1 (Google OAuth Serverless API) 완료

## Specific Instructions

### 1. Google 로그인 버튼 추가
- 위치: `pages/auth/login.html`
- 기존 이메일 로그인 폼 아래에 추가

### 2. 버튼 디자인
```html
<div class="social-login">
  <div class="divider">
    <span>또는</span>
  </div>
  <button id="googleLoginBtn" class="google-btn">
    <img src="/assets/icons/google-logo.svg" alt="Google" />
    <span>Google로 계속하기</span>
  </button>
</div>
```

### 3. 버튼 스타일
```css
.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 24px;
  background: white;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #3c4043;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
}

.google-btn:hover {
  background: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

### 4. 클릭 이벤트
```javascript
document.getElementById('googleLoginBtn').addEventListener('click', () => {
  window.location.href = '/api/auth/google';
});
```

### 5. 콜백 페이지
- 위치: `pages/auth/callback.html`
- OAuth 성공 시 토큰 처리
- 로딩 스피너 표시
- 에러 처리

### 6. Google 로고 아이콘
- 위치: `assets/icons/google-logo.svg`
- Google 공식 브랜드 가이드라인 준수

## Expected Output Files
- `pages/auth/login.html` (수정)
- `pages/auth/callback.html` (신규)
- `assets/icons/google-logo.svg` (신규)

## Completion Criteria
- [ ] Google 로그인 버튼 추가
- [ ] 버튼 스타일 적용
- [ ] 클릭 시 OAuth 플로우 시작
- [ ] 콜백 페이지 구현
- [ ] 로그인 성공 시 대시보드 이동
- [ ] 에러 처리 구현

## Tech Stack
- HTML/CSS/JavaScript
- OAuth 2.0

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Tools
- Read, Write, Edit

## Execution Type
AI-Only

## Remarks
- Google 브랜드 가이드라인 준수 필요
- 기존 이메일 로그인과 공존

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

**Area 폴더 매핑:** FE→Frontend, BA→Backend_APIs, DB→Database, SC→Security, BI→Backend_Infra, EX→External, TS→Testing, DV→DevOps, DS→Design, DC→Documentation, CS→Content_System

