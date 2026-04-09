# S5FE3: 랜딩 페이지 리디자인 — 검증 지침

## 검증 정보
- **Task ID**: S5FE3
- **Verification Agent**: code-reviewer-core
- **검증 유형**: 코드 구현 + UI 검증

## 검증 항목

### 1. 섹션 완전성
- [ ] Hero 섹션: 헤드라인 + 챗봇 데모 카드 + CTA 버튼이 렌더링되는가?
- [ ] Feature 섹션: 3컬럼 기능 카드가 렌더링되는가?
- [ ] Stats 섹션: 숫자 강조 요소가 있는가?
- [ ] Skill 미리보기: SkillCard가 렌더링되는가?
- [ ] Pricing CTA: 플랜 비교 + 시작하기 버튼이 있는가?
- [ ] Footer: 링크/SNS/이용약관이 있는가?

### 2. 디자인 시스템 적용
- [ ] 퍼플 그라데이션(--gradient-hero)이 Hero 배경에 적용되었는가?
- [ ] Primary CTA 버튼이 BtnPrimary 스타일인가?
- [ ] 다크 모드에서 배경이 #0F172A(bg-base)인가?

### 3. 마케팅 레이아웃
- [ ] MarketingTopNav가 포함되었는가?
- [ ] AppSidebar가 없는가? (마케팅 페이지는 GNB만)

### 4. 빌드/반응형
- [ ] 빌드가 통과하는가?
- [ ] 모바일(375px) 레이아웃이 깨지지 않는가?

## 완료 기준

6개 섹션이 모두 구현되고 S5DS4 와이어프레임과 일치하며 빌드가 통과하면 Verified.
