# S5FE3: 랜딩 페이지 리디자인

## Task 정보
- **Task ID**: S5FE3
- **Task Name**: 랜딩 페이지 리디자인
- **Stage**: S5 (디자인 혁신)
- **Area**: FE (Frontend)
- **Dependencies**: S5DS4, S5FE1, S5FE2

## Task 목표

S5DS4 와이어프레임과 S5FE1 디자인 시스템을 적용하여 랜딩 페이지(/)를 전면 리디자인한다. 비로그인 마케팅 페이지로서 가입 전환을 극대화하는 Hero 섹션, 기능 소개, CTA를 구현한다.

## 구현 항목

1. **Hero 섹션**: 퍼플 그라데이션 배경, 챗봇 데모 미리보기 카드, "나만의 AI 챗봇으로 수익을 만드세요" 헤드라인
2. **Feature 섹션**: 3컬럼 기능 카드 (탄생/스킬장착/수익창출)
3. **Stats 섹션**: 누적 사용자/봇/수익 숫자 강조
4. **Skill 미리보기**: 인기 스킬 카드 그리드 (SkillCard 컴포넌트 적용)
5. **Social Proof**: 사용자 후기/별점
6. **Pricing CTA**: 플랜 간단 소개 + 시작하기 버튼
7. **Footer**: 링크, SNS, 이용약관

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/page.tsx` | 랜딩 페이지 전면 리디자인 |
| `components/landing/HeroSection.tsx` | Hero 컴포넌트 |
| `components/landing/FeatureSection.tsx` | 기능 소개 컴포넌트 |
| `components/landing/PricingCTA.tsx` | 가격 CTA 컴포넌트 |
| `components/common/Footer.tsx` | Footer 리디자인 |
