# Verification Instruction - S5U2

---

## 📌 필수 참조 규칙 파일 (2025-12-21)

> **검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S5U2

## Task Name
반응형 디자인 최적화

## Verification Checklist

### 1. 모바일 가독성 검증 (375px)
- [ ] 가로 스크롤 없음 (overflow-x 확인)
- [ ] 텍스트 크기 최소 14px
- [ ] 줄 간격 적절함
- [ ] 모든 텍스트 콘텐츠 읽기 가능

### 2. 레이아웃 검증 (모바일)
- [ ] 사이드바 숨김 또는 토글 메뉴 작동
- [ ] 메인 콘텐츠 100% 너비 사용
- [ ] 그리드가 1컬럼으로 변환
- [ ] 카드 컴포넌트 적절한 크기

### 3. 태블릿 검증 (768px)
- [ ] 레이아웃 깨짐 없음
- [ ] 사이드바 적절한 너비
- [ ] 콘텐츠 가독성 확보

### 4. PC 전용 기능 안내
- [ ] 모바일에서 "데스크톱 이용 권장" 안내 표시
- [ ] PC 전용 기능 명확히 안내

### 5. CSS 미디어 쿼리 검증
- [ ] @media (max-width: 768px) 적용됨
- [ ] @media (max-width: 1024px) 적용됨
- [ ] 중복/충돌 스타일 없음

## Test Commands
```bash
# Playwright로 반응형 스크린샷 촬영
npx playwright screenshot --viewport-size=375,667 https://www.ssalworks.ai.kr/

# Chrome DevTools 반응형 모드로 확인
# 또는 browser-mcp 사용
```

## 검증 대상 페이지
- [ ] index.html
- [ ] viewer.html
- [ ] pages/auth/login.html
- [ ] pages/auth/signup.html
- [ ] pages/mypage/profile.html
- [ ] admin-dashboard.html

## Expected Results

### 모바일 (375px)
- 1컬럼 레이아웃
- 사이드바 숨김
- 텍스트 가독성 확보
- PC 전용 안내 배너 표시

### 태블릿 (768px)
- 축소된 사이드바
- 2컬럼 레이아웃 가능
- 터치 타겟 44px 이상

### 데스크톱 (1024px+)
- 기존 레이아웃 유지
- 모바일 전용 배너 숨김

## Verification Agent
`code-reviewer`

## Pass/Fail Criteria
- **Pass**: 모든 체크리스트 통과
- **Fail**: 가로 스크롤 발생, 텍스트 읽기 불가, 레이아웃 깨짐

## Notes
- SSALWorks는 PC 중심 플랫폼
- 모바일은 "읽기/확인" 용도
- 복잡한 인터랙션은 PC에서 권장
