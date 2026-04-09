# S5DS3: 핵심 컴포넌트 디자인 스펙 — 검증 지침

## 검증 정보
- **Task ID**: S5DS3
- **Verification Agent**: qa-specialist
- **검증 유형**: 설계 문서 완전성 검증

## 검증 항목

### 1. 컴포넌트 스펙 완전성
- [ ] Button 컴포넌트 스펙이 정의되었는가? (BtnPrimary/BtnSecondary/BtnGhost/BtnDanger, 크기 sm/md/lg)
- [ ] Card 컴포넌트 스펙이 정의되었는가? (BotCard/SkillCard/JobCard/PostCard)
- [ ] Input/Form 컴포넌트 스펙이 정의되었는가? (Input/Textarea/Select/Checkbox/Toggle)
- [ ] Badge 컴포넌트 스펙이 정의되었는가?

### 2. 상태 스펙
- [ ] 각 컴포넌트의 hover/active/disabled/focus 상태가 정의되었는가?
- [ ] 다크 모드 컴포넌트 색상이 명시되었는가?

### 3. 타이포그래피
- [ ] Pretendard 폰트 적용 방식이 명시되었는가?
- [ ] 타이포그래피 스케일(text-xs ~ text-7xl)이 정의되었는가?

### 4. 디자인 토큰
- [ ] CSS 변수 전역 정의가 포함되었는가?
- [ ] globals.css 구조(`:root` + `.dark`)가 정의되었는가?

## 완료 기준

모든 항목이 산출물(`2026_04_07__P3_컴포넌트_디자인_스펙.md`)에 포함되어 있으면 Verified.
