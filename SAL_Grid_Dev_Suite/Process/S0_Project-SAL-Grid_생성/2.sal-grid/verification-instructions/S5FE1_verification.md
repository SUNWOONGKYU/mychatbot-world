# S5FE1: 디자인 시스템 구현 (globals.css + tailwind.config) — 검증 지침

## 검증 정보
- **Task ID**: S5FE1
- **Verification Agent**: code-reviewer-core
- **검증 유형**: 코드 구현 검증

## 검증 항목

### 1. globals.css
- [ ] :root에 Primary 퍼플 CSS 변수 전체(--primary-50 ~ --primary-950)가 정의되었는가?
- [ ] :root에 Accent 앰버 CSS 변수 전체(--amber-50 ~ --amber-900)가 정의되었는가?
- [ ] :root에 Neutral 슬레이트 CSS 변수 전체가 정의되었는가?
- [ ] .dark 클래스에 다크 모드 오버라이드가 정의되었는가?
- [ ] 시맨틱 토큰(--color-bg, --color-surface, --color-text-primary 등)이 정의되었는가?
- [ ] 그라데이션 변수(--gradient-hero 등)가 정의되었는가?

### 2. tailwind.config.ts
- [ ] extend.colors에 CSS 변수 연결이 완료되었는가?
- [ ] RGB 포맷으로 alpha 채널 연동이 구현되었는가?
- [ ] 커스텀 폰트 패밀리(Pretendard, JetBrains Mono)가 등록되었는가?

### 3. 빌드 검증
- [ ] `next build` 또는 타입 체크가 통과하는가?
- [ ] CSS 변수명 오타가 없는가?
- [ ] 다크/라이트 모드 전환이 작동하는가?

## 완료 기준

globals.css와 tailwind.config.ts가 S5DS2 스펙과 일치하고 빌드가 통과하면 Verified.
