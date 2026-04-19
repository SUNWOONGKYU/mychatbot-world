# S7FE5: P0 리디자인 — Landing + Home + Login/Signup

## Task 정보
- **Task ID**: S7FE5
- **Stage**: S7 / **Area**: FE
- **Dependencies**: S7FE4
- **Task Agent**: `frontend-developer-core`

## Task 목표

사용자 첫인상을 결정하는 P0 페이지를 전면 리디자인한다. 새 토큰/컴포넌트 시스템으로 구현.

## 대상 페이지

| 페이지 | 경로 | 핵심 변경 |
|--------|------|----------|
| Landing | `app/page.tsx` + `components/landing/*` | Hero 재구성, CTA 위계 강화, 스크롤 섹션 리듬, 반응형 완성 |
| Home | `app/home/page.tsx` + `components/home/*` | 대시보드 레이아웃, 카드 밀도, 탭 전환 모션 |
| Login | `app/login/page.tsx` | Form Field 사용, 에러 상태 시각화, 소셜 로그인 버튼 위계 |
| Signup | `app/signup/page.tsx` | 3단계 위저드 또는 단일 스크롤, 검증 피드백 |

## 구현 원칙

- Semantic 토큰만 사용 (하드코드 금지)
- Composite 컴포넌트 최대 활용
- Above-the-fold 400ms 내 LCP 목표
- 360px ~ 1920px 반응형 완성

## 성공 기준

- Before/After 스크린샷 4쌍 (각 페이지 Light+Dark)
- Lighthouse Performance 85+, A11y 95+
- 모바일에서 탭 이동 부드러움
