# Verification Instruction - S4F1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S4F1

## Task Name
관리자 대시보드 강화

## Verification Checklist

### 1. 파일 존재 검증
- [ ] pages/subscription/payment.html 존재
- [ ] payment.js 존재
- [ ] payment.css 존재

### 2. 결제 페이지 UI 검증
- [ ] 주문 정보 섹션
- [ ] 토스 결제 위젯 영역
- [ ] 약관 동의 영역
- [ ] 결제 버튼

### 3. 토스 SDK 연동 검증
- [ ] PaymentWidget 초기화
- [ ] 결제 위젯 렌더링
- [ ] 약관 위젯 렌더링

### 4. URL 파라미터 처리 검증
- [ ] plan 파라미터 처리
- [ ] amount 파라미터 처리
- [ ] UI에 정보 반영

### 5. 결제 요청 검증
- [ ] requestPayment 함수 호출
- [ ] successUrl 설정
- [ ] failUrl 설정

## Test Commands
```bash
# 파일 존재 확인
ls -la P3_프로토타입_제작/Frontend/Prototype/pages/subscription/payment.html

# 토스 SDK 로드 확인
grep "tosspayments" P3_프로토타입_제작/Frontend/Prototype/pages/subscription/payment.html
```

## Expected Results
- 결제 페이지 존재
- 토스 위젯 로드
- 결제 요청 가능

## Verification Agent
frontend-developer

## Pass Criteria
- 결제 UI 표시 정상
- 토스 위젯 렌더링
- 결제 버튼 동작

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Task ID의 Stage에 맞는 폴더에 저장되었는가? (S1→S1_개발_준비/, S2→S2_개발-1차/, ...)
- [ ] Task ID의 Area에 맞는 폴더에 저장되었는가? (S→Security/, F→Frontend/, ...)
- [ ] Production 관련 코드(F, BA, D)는 Production 폴더에도 저장되었는가?

