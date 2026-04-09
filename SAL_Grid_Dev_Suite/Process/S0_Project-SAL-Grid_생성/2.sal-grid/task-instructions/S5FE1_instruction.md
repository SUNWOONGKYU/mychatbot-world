# S5FE1: 디자인 시스템 구현 (globals.css + tailwind.config — 다크/라이트 동시 지원)

## Task 정보
- **Task ID**: S5FE1
- **Task Name**: 디자인 시스템 구현 (globals.css + tailwind.config — 다크/라이트 동시 지원)
- **Stage**: S5 (디자인 혁신)
- **Area**: FE (Frontend)
- **Dependencies**: S5DS2, S5DS3

## Task 목표

S5DS2(컬러 시스템)와 S5DS3(컴포넌트 스펙)의 설계를 실제 코드로 구현한다. globals.css에 CSS 변수 전체를 정의하고, tailwind.config.ts에서 커스텀 토큰을 매핑하며, Pretendard 폰트 로딩을 설정한다. 이 파일이 S5FE2~S5FE7의 모든 리디자인 Task의 기반이 된다.

## 구현 항목

1. **globals.css**: :root (라이트 모드) + .dark (다크 모드) CSS 변수 전체
   - Primary 퍼플 팔레트 (--primary-50 ~ --primary-950)
   - Accent 앰버 팔레트 (--amber-50 ~ --amber-900)
   - Neutral 슬레이트 팔레트 (--neutral-0 ~ --neutral-950)
   - Semantic 컬러 (success/warning/error/info)
   - 시맨틱 토큰 (--color-bg, --color-surface, --color-text-primary 등)
   - Gradient 변수 (--gradient-hero, --gradient-accent 등)

2. **tailwind.config.ts**: extend.colors에 CSS 변수 연결
   - RGB 포맷으로 Tailwind alpha 채널 연동
   - 커스텀 폰트 패밀리 (Pretendard, JetBrains Mono)
   - 커스텀 박스섀도우, 애니메이션

3. **폰트 설정**: next/font 또는 public/fonts 방식으로 Pretendard 로딩

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/globals.css` | 디자인 시스템 CSS 변수 전체 재작성 |
| `tailwind.config.ts` | 커스텀 토큰 매핑 추가 |
| `app/layout.tsx` | Pretendard 폰트 적용 |
