# Verification Instruction - S2F1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S2F1

## Task Name
Google 소셜 로그인 UI

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `pages/auth/login.html` (수정)
- [ ] `pages/auth/callback.html` (신규)
- [ ] `assets/icons/google-logo.svg` (신규)

### 2. Google 로그인 버튼 검증
- [ ] 버튼 존재 확인
- [ ] Google 로고 아이콘 표시
- [ ] "Google로 시작하기" 또는 유사 텍스트
- [ ] 버튼 스타일 (Google 브랜드 가이드라인)

### 3. 버튼 스타일 검증
- [ ] 흰색 배경 + 회색 테두리
- [ ] 호버 효과
- [ ] 로고와 텍스트 정렬

### 4. 클릭 이벤트 검증
- [ ] 클릭 시 OAuth 플로우 시작
- [ ] `/api/auth/google` 또는 Supabase OAuth 호출

### 5. 콜백 페이지 검증
- [ ] OAuth 성공 시 토큰 처리
- [ ] 로딩 스피너 표시
- [ ] 에러 처리 구현
- [ ] 대시보드로 리다이렉트

### 6. 반응형 검증
- [ ] 모바일에서 버튼 사용 가능
- [ ] 터치 영역 적절

## Test Commands
```bash
# 파일 존재 확인
ls -la pages/auth/login.html
ls -la pages/auth/callback.html
ls -la assets/icons/google-logo.svg

# Google 버튼 확인
grep -E "(google|Google)" pages/auth/login.html
```

## Expected Results
- Google 로그인 버튼 표시
- OAuth 플로우 정상 동작
- 콜백 페이지 처리 완료

## Verification Agent
frontend-developer

## Pass Criteria
- Google 로그인 버튼 추가
- 버튼 스타일 적용
- 클릭 시 OAuth 플로우 시작
- 콜백 페이지 구현
- 로그인 성공 시 대시보드 이동

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] 코드가 `S2_개발-1차/Frontend/`에 저장되었는가?
- [ ] Production 코드가 `Production/Frontend/`에도 저장되었는가?
