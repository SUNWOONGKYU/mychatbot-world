# Verification Instruction - S2BI2

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S2BI2

## Task Name
에러 핸들링 시스템

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `assets/js/error-handler.js` 존재
- [ ] `assets/js/toast.js` 존재
- [ ] `assets/js/api-utils.js` 존재
- [ ] `assets/css/toast.css` 존재

### 2. 전역 에러 핸들러 검증
- [ ] `window.onerror` 핸들러 구현
- [ ] `unhandledrejection` 이벤트 핸들러 구현
- [ ] 에러 로깅 처리
- [ ] 토스트 알림 표시

### 3. 토스트 알림 시스템 검증
- [ ] `showToast(message, type, duration)` 함수
- [ ] 타입별 스타일 (success, error, warning, info)
- [ ] 자동 사라짐 기능
- [ ] 애니메이션 효과

### 4. 토스트 스타일 검증
- [ ] `.toast` 기본 스타일
- [ ] `.toast-success` 스타일 (녹색)
- [ ] `.toast-error` 스타일 (빨간색)
- [ ] `.toast-warning` 스타일 (주황색)
- [ ] `.toast-info` 스타일 (파란색)

### 5. API 에러 핸들링 유틸리티 검증
- [ ] `apiCall(url, options)` 함수
- [ ] fetch 래핑
- [ ] 응답 에러 처리
- [ ] 토스트 알림 연동

### 6. 페이지 통합 검증
- [ ] 모든 페이지에 스크립트 포함 확인

## Test Commands
```bash
# 파일 존재 확인
ls -la assets/js/error-handler.js
ls -la assets/js/toast.js
ls -la assets/js/api-utils.js
ls -la assets/css/toast.css

# 스크립트 포함 확인
grep "toast.js" pages/**/*.html
grep "error-handler.js" pages/**/*.html
```

## Expected Results
- 에러 핸들링 시스템 동작
- 토스트 알림 정상 표시
- API 호출 에러 처리

## Verification Agent
frontend-developer

## Pass Criteria
- 전역 에러 핸들러 구현
- 토스트 알림 시스템 구현
- API 에러 핸들링 유틸리티 구현
- 토스트 스타일 구현
- 모든 페이지에 스크립트 포함

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] 코드가 `S2_개발-1차/Backend_Infra/`에 저장되었는가?
- [ ] Production 코드가 `Production/Frontend/assets/`에도 저장되었는가?
