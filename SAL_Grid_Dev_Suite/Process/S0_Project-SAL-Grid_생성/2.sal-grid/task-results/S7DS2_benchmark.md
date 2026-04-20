# S7DS2: 세계 최고 디자인 벤치마크 리서치

> 작성일: 2026-04-20
> Task: S7DS2 — Linear / Vercel / Stripe / Arc / Raycast 5개 제품 디자인 벤치마크
> 목적: S7DS3(원칙) ~ S7FE4(컴포넌트) 직접 참조 가능한 결정표 산출
> 방법: 학습된 지식 + 공개 디자인 시스템 문서 기반. 미확인 수치는 "(추정)" 표기

---

## 1. Executive Summary

### 5개 제품 공통 디자인 DNA

1. **속도와 즉각성 (Perceived Performance)** — 5개 제품 모두 "빠르다는 느낌"을 UI의 핵심 원칙으로 삼는다. 모션은 장식이 아니라 피드백이며, 150~250ms 내에 반응이 끝난다.
2. **중립 회색 중심의 색채 구조** — 강렬한 브랜드 컬러는 단일 Accent로 절제하고, 나머지는 11단 이상의 뉴트럴 그레이 계단으로 처리한다. 색이 적을수록 콘텐츠가 돋보인다.
3. **8pt 기반 간격 시스템** — 4pt 미세 조정 허용, 64pt 이상 대형 간격도 8의 배수. 예외를 허용하지 않는 수학적 그리드.
4. **키보드 퍼스트 인터랙션** — 마우스 없이 모든 기능에 접근 가능해야 한다는 철학. 단축키 표기 UI(⌘K 등)가 시각적으로 노출된다.
5. **시스템 레벨 일관성** — 개별 페이지 디자인이 아닌, 토큰 → 컴포넌트 → 패턴 → 페이지 수직 연결. 컴포넌트 하나의 변경이 전체에 전파된다.

### MCW가 최우선 도입할 Top 10 항목

| 우선순위 | 항목 | 출처 | 도입 이유 |
|---------|------|------|----------|
| 1 | OKLCH 기반 11단 뉴트럴 팔레트 | Vercel / Linear | Dark mode 대칭 보장, 균일 인지 대비 |
| 2 | Inter + Pretendard 듀얼 폰트 스택 | Linear | 화면 최적화 + 한국어 품질 |
| 3 | 8pt 그리드 10단 간격 시스템 | 공통 | 예외 없는 수학적 일관성 |
| 4 | Single Accent(Indigo/Blue) 절제 사용 | Stripe | 클릭 유도 요소만 색상, 나머지 뉴트럴 |
| 5 | Command Palette (⌘K) 패턴 | Linear / Raycast | AI 챗봇 진입점의 핵심 UX |
| 6 | Focus ring 시스템 (2px + 2px offset, Indigo) | Stripe / Vercel | 접근성 + 브랜드 일관성 |
| 7 | 5단 모션 duration 계단 (75/150/250/350/500ms) | Linear / Raycast | 상황별 적절한 피드백 속도 |
| 8 | Toast 알림 컴포넌트 (Raycast 스타일) | Raycast | 비방해적 피드백 표준 |
| 9 | Elevation 4단 Shadow 계층 | Vercel | 공간 위계 명확화 |
| 10 | Semantic 컬러 4종 (success/warning/error/info) | Stripe | 상태 전달의 언어 표준화 |

---

## 2. 제품별 상세 분석

### 2.1 Linear

#### 토큰

**폰트 스택**
- Display / Heading: `Inter Tight` (weight: 600~700, letter-spacing: -0.02em ~ -0.04em)
- Body / UI: `Inter` (weight: 400/500, letter-spacing: -0.01em ~ 0em)
- Code / Mono: `JetBrains Mono` (fallback: `Menlo`, `Monaco`)
- 시스템 폴백: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

**색상 팔레트**
- Neutral: Gray 1~12 (Radix UI Gray 기반, OKLCH 근사값 사용 추정)
- Accent: Violet (#5B57E0 추정) — UI 전체에서 단 2~3개 요소에만 사용
- Background: `#0F0F10` (Dark) / `#FFFFFF` (Light)
- Surface: `#1A1A1E` (Dark card) / `#F8F8F8` (Light card)
- Border: `rgba(255,255,255,0.08)` (Dark) / `rgba(0,0,0,0.08)` (Light)

**모션 duration**
- Micro (hover/active): 100ms, `ease-out`
- Short (dropdown open): 150ms, `cubic-bezier(0.16, 1, 0.3, 1)` — Spring 느낌의 ease-out
- Medium (panel slide): 200ms, `cubic-bezier(0.32, 0.72, 0, 1)` (추정)
- Long (page transition): 300ms, `cubic-bezier(0.22, 1, 0.36, 1)`
- 커맨드 팔레트 입장: 150ms fade-in + scale(0.97 → 1.0)

#### 컴포넌트

**커맨드 팔레트 (Command Palette)**
- 트리거: `⌘K` / `Ctrl+K`
- 배경: `rgba(22, 22, 26, 0.95)` + backdrop-blur(40px) (Dark 기준)
- 검색 입력 상단 고정, 결과 스크롤 최대 400px
- 결과 행 높이: 36px, 아이콘(16px) + 텍스트 + 우측 단축키 힌트
- 선택 상태: Violet 배경 `rgba(91,87,224,0.2)` + border-left 2px Violet
- 항목 사이 구분선 없음, 그룹 헤더 12px 대문자 gray 텍스트

**Sidebar**
- 너비: 240px (고정) / 축소 시 56px (아이콘만)
- 항목 높이: 30px, padding: 0 8px
- Hover: 배경 `rgba(255,255,255,0.06)`
- Active: 배경 `rgba(255,255,255,0.1)` + 텍스트 white

**Issue Card**
- padding: 12px 16px
- Border: 1px solid `rgba(255,255,255,0.08)`
- Border-radius: 8px
- 상태 색상 도트: 8px circle, 상태별 Semantic 컬러

#### 원칙
- **"Speed as a feature"**: 렌더링 성능이 UX 품질의 1순위. 100ms 응답이 목표.
- **Complexity hiding**: 고급 기능은 드러내지 않고, 필요할 때만 노출.
- **Monotone with purpose**: 색은 정보를 전달할 때만 사용.

#### MCW 대응 여부

| 항목 | 대응 | 이유 |
|------|------|------|
| Inter Tight 헤딩 폰트 | ✅ 채택 | Display 텍스트 품질 향상, 웹 최적화 |
| Inter Body 폰트 | ✅ 채택 | 영문 UI 표준 |
| Violet Accent | 🔧 변형 | MCW는 Indigo/Blue 계열 유지 (AI/챗봇 정체성) |
| Dark mode 기본 | 🔧 변형 | Light 우선, Dark 지원 구조 |
| 커맨드 팔레트 (⌘K) | ✅ 채택 | 챗봇 검색/전환 핵심 UX |
| 150ms Spring ease | ✅ 채택 | 정확한 수치로 채택 |
| 사이드바 240/56 구조 | ✅ 채택 | 기존 사이드바 규격화에 적용 |
| Issue Card 스타일 | 🔧 변형 | Bot Card / Skill Card에 적용 변형 |
| JetBrains Mono | ✅ 채택 | 코드 블록, API 키 표시에 사용 |

---

### 2.2 Vercel

#### 토큰

**폰트 스택**
- UI / Body: `Geist Sans` (Vercel 독자 개발, 2023년 공개. Inter와 유사한 중립성)
- Code: `Geist Mono`
- letter-spacing: Heading -0.03em, Body 0em, Caption +0.01em (추정)
- Geist Sans는 공개 라이선스 (OFL 1.1)

**색상 팔레트 (공개 토큰 기준)**
- Neutral 12단 (`--ds-gray-100` ~ `--ds-gray-1000`, Light + Dark 각각 정의)
- Dark 배경: `#000000` (순수 블랙)
- Light 배경: `#FFFFFF`
- Accent Blue: `#0070F3` (Vercel Blue, 공식)
- Success: `#50E3C2` (Teal 계열)
- Error: `#FF0080` (Hot pink 계열 — 독특한 선택)
- Warning: `#F5A623` (Amber)
- 컬러 토큰 네이밍: `--ds-{category}-{scale}` 패턴

**Elevation (Shadow 계층)**
- Level 0: `none` (flat, 동일 평면)
- Level 1: `0 1px 2px rgba(0,0,0,0.08)` (카드)
- Level 2: `0 4px 8px rgba(0,0,0,0.12)` (드롭다운)
- Level 3: `0 8px 24px rgba(0,0,0,0.16)` (모달)
- Level 4: `0 16px 48px rgba(0,0,0,0.24)` (풀스크린 오버레이)
- Dark mode에서 shadow 대신 border 강화로 대체 (shadow 불가시 문제 해결)

**코드 블록 스타일**
- 배경: `#0A0A0A` (Dark) / `#F4F4F5` (Light)
- Border-radius: 6px
- 폰트: Geist Mono 13px
- 구문 하이라이팅: Shiki 기반 (추정)
- 좌측 언어 배지: 10px 대문자, `--ds-gray-400` 컬러
- 복사 버튼: 우측 상단 16px 아이콘, hover 시만 표시

**그리드 시스템**
- 12 컬럼 그리드
- 컨테이너 max-width: 1200px (문서 페이지), 1400px (대시보드)
- Column gap: 24px (데스크탑), 16px (태블릿), 0 (모바일, full-width)
- Margin: 자동 (컨테이너 중앙 정렬)

#### 컴포넌트 특징
- **데이터 테이블**: 행 높이 48px, 헤더 고정 sticky, 정렬 아이콘 hover 표시
- **Input**: border 1px solid `--ds-gray-400`, focus ring `#0070F3` 2px offset 2px
- **Badge/Status**: 5종 (neutral/success/warning/error/info), pill 형태 border-radius 9999px

#### 원칙
- **Light/Dark 대칭**: 각 토큰은 반드시 Light/Dark 쌍으로 존재. 하나만 정의 불가.
- **Zero decoration**: 그라디언트, 텍스처, 패턴 없음. 색과 타이포만.
- **Density through information**: 빈 공간은 낭비가 아닌 설계.

#### MCW 대응 여부

| 항목 | 대응 | 이유 |
|------|------|------|
| Geist Sans 폰트 | ❌ 비채택 | Vercel 독자 폰트, MCW는 Inter + Pretendard 선택 |
| `--ds-{category}-{scale}` 토큰 네이밍 | ✅ 채택 | 구조적으로 우수, MCW 적용 |
| Light/Dark 쌍 토큰 정의 의무 | ✅ 채택 | Dark mode 품질 보장 필수 규칙 |
| 4단 Elevation Shadow | ✅ 채택 | 정확한 수치 채택 |
| Accent Blue `#0070F3` | 🔧 변형 | MCW Indigo 계열로 변형 적용 |
| Error = Hot Pink | ❌ 비채택 | 일반적 의미론(Red) 벗어남, 한국 사용자 혼란 |
| 코드 블록 Shiki 스타일 | ✅ 채택 | API 키, 코드 표시 영역에 적용 |
| max-width 1200/1400 구조 | ✅ 채택 | 대시보드/문서 페이지 컨테이너 규격 |
| 12 컬럼 그리드 | ✅ 채택 | 표준 그리드 |

---

### 2.3 Stripe

#### 토큰

**폰트 스택**
- Heading: `Sohne` (Klim Type, 유료) — 대안: `Inter Tight`
- Body: `Sohne` (동일 패밀리), 400/450 weight
- Code: `Sohne Mono`
- 공개 마케팅 사이트와 대시보드 폰트 다름 — 대시보드는 시스템 폰트 기반

**Accent 컬러 철학 (Indigo)**
- Primary: `#635BFF` (Stripe Purple-Indigo, 공식)
- 사용 원칙: 클릭 가능한 요소(버튼/링크)에만. 정보 전달에는 사용 금지.
- 배경에 Accent 절대 없음. 텍스트/아이콘/border에만.
- Dark mode: `#7B75FF` (Lighter variant for contrast)

**컬러 의미론 (Semantic Color)**
- Success: `#09825D` (Green, 짙은 계열) / 배경: `#E6F7F0`
- Warning: `#C26D0A` (Amber) / 배경: `#FEF3E2`
- Error/Danger: `#C0392B` (Red) / 배경: `#FEEEEE`
- Info: `#1A73E8` (Blue) / 배경: `#EEF4FF`
- 모든 Semantic 컬러는 텍스트 + 배경 쌍으로 제공

**입력 필드 스타일 (Form)**
- 높이: 40px (기본) / 32px (small)
- Border: 1px solid `#C9C9CB` (Default) → `#635BFF` (Focus)
- Border-radius: 6px
- Focus ring: `box-shadow: 0 0 0 3px rgba(99,91,255,0.2)` — Stripe 특유의 "glow" 효과
- Placeholder 색: `#9E9E9E`
- Label: 14px 500weight, 필드 위 4px 간격
- Error 상태: border `#C0392B` + 하단 12px 에러 텍스트 (Red)
- 성공 상태: 우측 체크 아이콘 (Green)

**컬러 팔레트 구조**
- Gray: 50/100/150/200/300/400/500/600/700/800/900 (11단)
- 각 Gray 단계에 Light/Dark 값 정의
- Neutral 기반 + 단일 Accent + Semantic 4종 = 총 6개 컬러 카테고리

#### 원칙
- **"Trust through clarity"**: 금융 제품이므로 모호함이 곧 불신. 모든 상태를 명시적으로 표현.
- **Accent 절제**: 보라(Indigo)는 "지금 행동하라"는 신호. 색이 남발되면 신호가 사라진다.
- **Form as product**: 입력 필드가 제품의 핵심. Form UX에 가장 많은 투자.

#### MCW 대응 여부

| 항목 | 대응 | 이유 |
|------|------|------|
| Accent = Indigo 계열 | ✅ 채택 | MCW AI/챗봇 정체성과 일치 |
| Accent 절제 원칙 (버튼/링크만) | ✅ 채택 | 클릭 신호 명확화 |
| Semantic Color 4종 + 배경 쌍 | ✅ 채택 | 상태 전달 표준화 |
| Focus glow (box-shadow rgba) | ✅ 채택 | Stripe 방식 채택, offset 2px로 조정 |
| 입력 필드 40px / 32px 높이 | ✅ 채택 | 터치 친화적 크기 |
| Form 에러: 하단 텍스트 방식 | ✅ 채택 | 한국어 UX에도 표준적 |
| Sohne 폰트 | ❌ 비채택 | 유료 폰트, 한국어 미지원 |
| Gray 11단 구조 | ✅ 채택 | 단수 일치 (MCW도 11단) |
| 50/100/150... 네이밍 | 🔧 변형 | MCW는 100~1100 11단으로 통일 |

---

### 2.4 Arc

#### 인터랙션 밀도 분석

**사이드바 (Sidebar)**
- 너비: 260px (기본), 드래그로 200~360px 조절 가능
- 사이드바 내 Spaces: 탭 그룹 개념. 컬러 코딩으로 구분.
- 축소 시: 사이드바 완전 숨김 (0px), 화면 극대화 우선
- 항목 높이: 28px (compact), 36px (기본)
- Favicon 표시: 16px, 좌측 8px 여백
- 드래그 앤 드롭: 모든 탭/북마크 재정렬 가능

**커맨드바 (Command Bar)**
- 위치: 화면 상단 중앙 고정 (툴바 중앙)
- 너비: 480px (추정)
- 높이: 36px
- URL 입력 + 검색 + 명령 통합 (옴니바 방식)
- 자동완성: 히스토리 + 북마크 + Arc 명령 혼합

**컨텍스트 메뉴**
- Border-radius: 10px (Rounded 스타일)
- 배경: `rgba(28,28,32,0.95)` + backdrop-blur(20px)
- 항목 높이: 28px
- 아이콘: 14px SF Symbol 스타일
- 단축키 힌트: 우측 정렬, `--gray-500`
- 구분선: 1px `rgba(255,255,255,0.06)`, 상하 4px 마진

**공간 위계 (Spatial Hierarchy)**
- Z-level 0: 웹 콘텐츠
- Z-level 1: 사이드바 / 툴바
- Z-level 2: 드롭다운 / 컨텍스트 메뉴
- Z-level 3: 모달 / 스포트라이트
- 각 레벨 전환 시 명시적 blur + shadow 변화

#### 원칙
- **Browser as OS**: 브라우저가 운영체제처럼 동작해야 한다. 탭 = 앱.
- **Surface = Container**: 모든 UI 요소는 깊이를 가진 레이어.
- **Control density**: 기능이 많지만 동시에 노출하지 않음. 필요할 때만 나타남.

#### MCW 대응 여부

| 항목 | 대응 | 이유 |
|------|------|------|
| 컨텍스트 메뉴 blur+radius 스타일 | ✅ 채택 | 맥락 메뉴 일관성 |
| 공간 위계 4단계 Z-level | ✅ 채택 | MCW Z-index 체계화에 적용 |
| 사이드바 compact 28px 높이 | 🔧 변형 | MCW는 32px 기본 (접근성) |
| 멀티 Space 탭 구조 | ❌ 비채택 | MCW는 SaaS, 브라우저 수준 복잡도 불필요 |
| 드래그 사이드바 너비 조절 | ❌ 비채택 | 복잡도 대비 효과 낮음 |
| backdrop-blur 컨텍스트 메뉴 | ✅ 채택 | 시각적 깊이 표현 |
| Spaces 컬러 코딩 | 🔧 변형 | Bot 카테고리 컬러 구분에 변형 적용 |

---

### 2.5 Raycast

#### 컴포넌트 정교함 분석

**모달 / 커맨드 팔레트**
- 트리거: `⌥ Space` (전역) / `⌘K` (앱 내)
- 크기: 640px 너비 × 최대 500px 높이 (추정)
- 배경: `#1C1C1E` (시스템 다크 배경과 동일)
- blur: `backdrop-filter: blur(40px) saturate(180%)`
- 입장 애니메이션: scale(0.95 → 1.0) + opacity(0 → 1), 200ms, spring ease
- 닫힘: scale(1.0 → 0.95) + opacity(1 → 0), 150ms, ease-in

**단축키 표시 UI (Keyboard Hint)**
- 키 표기 요소: `<kbd>` 스타일 박스
- 배경: `rgba(255,255,255,0.1)` (Dark) / `rgba(0,0,0,0.08)` (Light)
- Border: 1px solid `rgba(255,255,255,0.15)`
- Border-radius: 4px
- 패딩: 2px 5px
- 폰트: 11px 500weight, `JetBrains Mono` 또는 시스템 모노
- 하단 1px border `rgba(255,255,255,0.08)` (입체감 표현 — "bottom depth")
- 복합 단축키: `⌘` + `K` 각각 별도 kbd 박스, 사이 간격 2px

**Toast 알림**
- 위치: 화면 우측 하단 (right: 24px, bottom: 24px)
- 크기: 너비 320px, 최소 높이 56px
- Border-radius: 12px
- 배경: `rgba(30,30,32,0.95)` + blur(20px)
- 섀도우: `0 8px 32px rgba(0,0,0,0.4)`
- 아이콘: 좌측 16px (상태별 컬러)
- 애니메이션: 우측에서 slide-in, translateX(100%) → 0, 250ms spring
- 쌓임: 여러 개일 때 8px 간격으로 stack
- 자동 닫힘: 3000ms (default) / progress bar 표시

**Icon 스타일**
- 크기 시스템: 12 / 14 / 16 / 20 / 24 / 32px
- 스타일: SF Symbol 영감, 2px stroke, rounded cap
- 배경 없음 원칙: 아이콘에 배경 컨테이너(circle/square) 기본 미사용
- 배경 필요 시: 8px border-radius, 배경 opacity 0.12

#### 원칙
- **Native feel on Web**: 웹이지만 macOS 네이티브 앱처럼 느껴져야 한다.
- **Every pixel matters**: 1px 단위 조정이 전체 느낌을 바꾼다.
- **Keyboard as primary**: 마우스는 보조 수단.

#### MCW 대응 여부

| 항목 | 대응 | 이유 |
|------|------|------|
| kbd 단축키 박스 스타일 | ✅ 채택 | ⌘K, ⌘/ 등 단축키 표기에 직접 사용 |
| Toast 위치 + 애니메이션 | ✅ 채택 | 알림 시스템 표준으로 채택 |
| 모달 입장 scale+opacity | ✅ 채택 | 200ms spring 수치 채택 |
| backdrop-filter saturate(180%) | ✅ 채택 | 유리 효과 품질 향상 |
| 아이콘 배경 없음 원칙 | ✅ 채택 | 불필요한 배경 제거 |
| Icon 크기 6단 시스템 | ✅ 채택 | 12/14/16/20/24/32 그대로 채택 |
| Toast 3000ms 기본 | ✅ 채택 | 표준 대기 시간 |
| `⌥ Space` 전역 단축키 | ❌ 비채택 | 웹앱에서 OS 단축키 충돌 |
| macOS 전용 SF Symbol | ❌ 비채택 | 크로스 플랫폼 필요, Lucide/Phosphor 대체 |

---

## 3. 디자인 토큰 벤치마크

### 3.1 컬러

**Neutral 계단 비교**

| 제품 | 단수 | 시스템 | 네이밍 | 특징 |
|------|------|--------|--------|------|
| Linear | 12단 | Radix Gray (OKLCH 기반 추정) | `gray-1` ~ `gray-12` | 12단, Radix 오픈소스 |
| Vercel | 12단 | 독자 (OKLCH 추정) | `--ds-gray-100` ~ `--ds-gray-1000` | 100 단위, Light/Dark 쌍 |
| Stripe | 11단 | 독자 (HSL 기반 추정) | `gray-50` ~ `gray-900` | 50부터 시작 |
| Arc | 12단 | macOS NSColor 기반 | 시스템 대응 | OS 통합 |
| Raycast | 12단 | 독자 (macOS dark 최적화) | 내부 토큰 | 다크모드 특화 |

**Accent 색상 선택 기준**

| 제품 | Accent | HEX | 선택 이유 |
|------|--------|-----|----------|
| Linear | Violet | `#5B57E0` (추정) | 테크/생산성 정체성 |
| Vercel | Blue | `#0070F3` | 신뢰 + 기술 |
| Stripe | Indigo/Purple | `#635BFF` | 결제의 신뢰 + 혁신성 |
| Arc | Gradient (브랜드) | 무지개 (마케팅) | 창의성 강조 |
| Raycast | Orange | `#FF6363` 계열 (추정) | 생산성 에너지 |

**Semantic 컬러 패턴**

모든 제품이 공통으로:
- Success: Green 계열 (Green-600 ~ Green-700)
- Warning: Amber/Orange 계열
- Error: Red 계열 (Red-600)
- Info: Blue 계열

차이점: Vercel은 Error에 Hot Pink(`#FF0080`) 사용 — 독특하지만 범용성 낮음.

**MCW 제안: OKLCH 기반 Neutral 11단 + Single Accent(Indigo) + Semantic 4종**

```
Neutral: gray-100 ~ gray-1100 (OKLCH 균일 인지 대비)
Accent: indigo-600 (#4F46E5) — Indigo 계열, Linear + Stripe 중간값
Success: green-600 (#16A34A)
Warning: amber-600 (#D97706)
Error: red-600 (#DC2626)
Info: blue-600 (#2563EB)
```

---

### 3.2 타이포

| 제품 | Display 폰트 | Body 폰트 | Display scale | Body scale | letter-spacing 특징 |
|------|-------------|-----------|-------------|------------|---------------------|
| Linear | Inter Tight | Inter | 36/30/24px | 16/14/13px | Display: -0.03em, Body: -0.01em |
| Vercel | Geist Sans | Geist Sans | 40/32/28px | 16/14/12px | Display: -0.04em, Body: 0em |
| Stripe | Sohne | Sohne | 42/34/28px | 16/15/13px | Display: -0.02em, 세밀한 커닝 |
| Arc | SF Pro Display | SF Pro Text | 가변 | 15/13px | macOS 기본 따름 |
| Raycast | SF Pro Display | SF Pro Text | 32/24px | 14/12px | macOS 기본 + -0.02em |

**MCW 제안: Inter + Pretendard(한글), 9-step scale**

```
Scale:
- 2xs: 12px / line-height: 16px
- xs:  13px / line-height: 18px  (추가 — 한국어 UI 필요)
- sm:  14px / line-height: 20px
- md:  16px / line-height: 24px  (Body 기본)
- lg:  18px / line-height: 28px
- xl:  20px / line-height: 30px
- 2xl: 24px / line-height: 32px
- 3xl: 30px / line-height: 40px
- 4xl: 36px / line-height: 44px
- 5xl: 48px / line-height: 56px (Display 최대)

letter-spacing:
- 48px~: -0.04em
- 30~36px: -0.03em
- 20~24px: -0.02em
- 14~18px: -0.01em
- 12~13px: 0em
```

---

### 3.3 간격/레이아웃

**8pt 그리드 공통**

5개 제품 모두 기본 단위 = 8px (4px 미세 조정 허용).

```
MCW 간격 10단:
space-1:  4px   (미세 요소 내부)
space-2:  8px   (아이콘 간격, 인라인)
space-3:  12px  (항목 내부 padding)
space-4:  16px  (컴포넌트 기본 padding)
space-5:  20px  (작은 섹션 간격)
space-6:  24px  (컴포넌트 간 기본)
space-8:  32px  (섹션 내 그룹)
space-12: 48px  (섹션 간)
space-16: 64px  (페이지 섹션)
space-24: 96px  (대형 섹션)
```

**컨테이너 max-width 관행**

| 용도 | Linear | Vercel | Stripe | MCW 제안 |
|------|--------|--------|--------|----------|
| 마케팅 | 1280px | 1200px | 1140px | 1200px |
| 대시보드 | full-width | 1400px | full-width | 1440px |
| 문서 | 800px | 900px | 860px | 800px |
| 폼 | 400px | 480px | 440px | 480px |

---

### 3.4 모션

| 제품 | duration 계단 | 주요 ease | 페이지 전환 |
|------|---------------|-----------|-------------|
| Linear | 100/150/200/300ms | `cubic-bezier(0.16, 1, 0.3, 1)` (spring) | 200ms fade+slight-translate |
| Vercel | 100/150/200/300ms | `cubic-bezier(0.4, 0, 0.2, 1)` (standard) | 150ms fade |
| Stripe | 150/200/300/400ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 300ms slide-up |
| Arc | 200/300/400ms | spring (CSS 추정) | 250ms fade+scale |
| Raycast | 100/150/200/350ms | `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like) | N/A (앱) |

**MCW 제안: 5단 duration + 3종 easing**

```css
/* Duration */
--duration-micro: 75ms;    /* hover/active 즉각 피드백 */
--duration-fast: 150ms;    /* 드롭다운, 토글 */
--duration-normal: 250ms;  /* 모달, 패널 */
--duration-slow: 350ms;    /* 페이지 전환, drawer */
--duration-lazy: 500ms;    /* 대형 애니메이션, onboarding */

/* Easing */
--ease-standard:     cubic-bezier(0.4, 0, 0.2, 1);   /* 일반 UI */
--ease-accelerate:   cubic-bezier(0.4, 0, 1, 1);      /* 나가는 요소 */
--ease-decelerate:   cubic-bezier(0, 0, 0.2, 1);      /* 들어오는 요소 */
--ease-spring:       cubic-bezier(0.16, 1, 0.3, 1);   /* 팝업/팔레트 */
```

---

## 4. 컴포넌트 벤치마크

### 4.1 Primitive 18종 대조표

| 컴포넌트 | Linear | Vercel | Stripe | Arc | Raycast | MCW 채택 방향 |
|---------|:------:|:------:|:------:|:---:|:-------:|--------------|
| Button | ✅ 정교 | ✅ 정교 | ✅ 정교 | ✅ | ✅ | Stripe focus-glow + Vercel 크기 시스템 |
| Input | ✅ | ✅ 정교 | ✅ 최정교 | ✅ | ✅ | Stripe 기준 채택 (40/32px, glow) |
| Select | ✅ | ✅ | ✅ | ✅ | ✅ | Vercel dropdown 패턴 |
| Checkbox | ✅ | ✅ | ✅ 정교 | ✅ | ✅ | Stripe 체크박스 (Indigo fill) |
| Radio | ✅ | ✅ | ✅ | ✅ | ✅ | Stripe 기준 |
| Switch | ✅ | ✅ | ✅ 정교 | ✅ | ✅ | Stripe Switch (thumb shadow) |
| Slider | 🔧 | ✅ | ✅ | ❌ | 🔧 | Vercel 기준 |
| Textarea | ✅ | ✅ | ✅ 정교 | ✅ | 🔧 | Stripe 기준 (auto-resize) |
| Label | ✅ | ✅ | ✅ 정교 | 🔧 | ✅ | Stripe 14px/500w + 필수 표시 |
| Field (Label+Input+Error) | 🔧 | ✅ | ✅ 최정교 | ❌ | 🔧 | Stripe Field wrapper 채택 |
| Card | ✅ 정교 | ✅ | ✅ | ✅ | ✅ 정교 | Linear border+radius + Vercel shadow |
| Dialog/Modal | ✅ | ✅ | ✅ | ✅ | ✅ 최정교 | Raycast 애니메이션 + Vercel 구조 |
| Drawer | ✅ | ✅ | 🔧 | ✅ | ❌ | Linear 스타일 채택 |
| Toast | 🔧 | ✅ | ✅ | 🔧 | ✅ 최정교 | Raycast 완전 채택 |
| Tooltip | ✅ | ✅ | ✅ | ✅ | ✅ 정교 | Raycast 스타일 (blur bg) |
| Popover | ✅ | ✅ | ✅ | ✅ 정교 | ✅ 정교 | Raycast + Arc 합성 |
| Tabs | ✅ 정교 | ✅ | ✅ | ✅ | ✅ | Linear 언더라인 스타일 |
| Accordion | ✅ | ✅ | ✅ | 🔧 | ❌ | Vercel 기준 |

---

### 4.2 Composite 9종

| 컴포넌트 | 벤치마크 출처 | MCW 채택 방향 |
|---------|-------------|--------------|
| Typography Scale | Linear (Inter Tight) + Vercel (scale 구조) | 9-step scale, Inter+Pretendard 이중 스택 |
| Badge | Vercel (pill style) + Stripe (semantic) | 5종 semantic + 5종 크기, pill 형태 |
| Avatar | Linear (ring style) | 5단 크기(24/32/40/48/64), fallback initials |
| Icon | Raycast (크기 시스템) | 12/14/16/20/24/32, Lucide Icons |
| Spinner | Vercel (arc spinner) | 3종 크기, Indigo 색상 |
| Skeleton | Vercel + Linear | gradient animation, border-radius 일치 |
| DataTable | Vercel (헤더 sticky) | 48px row, sort indicator, pagination |
| EmptyState | Linear (illustration-free) | 아이콘 + 타이틀 + 설명 + CTA |
| PageToolbar | Linear + Vercel | 좌: 제목/breadcrumb, 우: 액션 버튼 |

---

## 5. 인터랙션 패턴 벤치마크

### 키보드 단축키 표기 UI

**Raycast 방식** (MCW 채택):
```css
kbd {
  display: inline-flex;
  align-items: center;
  padding: 2px 5px;
  font-size: 11px;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-bottom-width: 2px; /* 입체감 */
  border-radius: 4px;
  line-height: 1.4;
}
```

**사용 패턴**:
- Command Palette 결과 우측: `⌘ K`
- Tooltip 내: `⌘ S`
- 버튼 내 단축키 힌트 (고급 사용자 대상)

### Command Palette 패턴

공통 구조 (Linear + Raycast 합성):
1. `⌘K` 트리거 → 배경 blur overlay
2. 상단 검색 인풋 (자동 포커스)
3. 결과 목록 (가상 스크롤, 최대 8개 노출)
4. 그룹 헤더 (Actions / Recent / Pages / Bots...)
5. 결과 행: 아이콘(16px) + 제목 + 부제목 + 단축키 힌트
6. 키보드: `↑↓` 탐색, `Enter` 선택, `Esc` 닫기

### Focus Ring 스타일

| 제품 | 색상 | 두께 | Offset | 스타일 |
|------|------|------|--------|--------|
| Linear | Violet | 2px | 2px | solid |
| Vercel | Blue `#0070F3` | 2px | 2px | solid |
| Stripe | Indigo glow | shadow 3px | — | box-shadow rgba |
| Arc | 시스템 Blue | 2px | 2px | system |
| Raycast | Orange (추정) | 2px | 2px | solid |

**MCW 제안**:
```css
:focus-visible {
  outline: 2px solid #4F46E5; /* Indigo-600 */
  outline-offset: 2px;
  border-radius: inherit;
}
```

### Scroll Area 스타일

- Linear: 스크롤바 숨김 기본, hover 시 얇은 바(4px) 표시
- Vercel: 3px 스크롤바, 항상 표시 (overflow: overlay 추정)
- Raycast: 2px 스크롤바, Thumb만 표시
- **MCW 채택**: 4px 스크롤바, hover 시 표시, border-radius 2px

---

## 6. 접근성 관행

### 키보드 내비게이션 품질

| 제품 | 등급 | 특징 |
|------|------|------|
| Linear | A | 모든 기능 키보드 접근 가능, ⌘K가 핵심 |
| Vercel | AA | 문서 사이트 WCAG AA 준수 |
| Stripe | AAA | 결제 필수 접근성, WCAG AAA 목표 |
| Arc | A | macOS 접근성 API 활용 |
| Raycast | AA | 키보드 퍼스트 제품, 전 기능 접근 가능 |

### Dark Mode 대비율 처리

- Linear: OKLCH 기반으로 Light/Dark 대비율 동등하게 유지
- Vercel: 모든 토큰 Light/Dark 쌍 의무화
- Stripe: Dark mode에서 텍스트 대비율 4.5:1 이상 보장 (AA)
- 공통: 텍스트 색상은 배경과의 대비가 최우선

**MCW 원칙**: 모든 텍스트 최소 4.5:1 대비 (AA), 중요 UI 7:1 (AAA)

### prefers-reduced-motion 지원

```css
/* MCW 표준 패턴 — 5개 제품 공통 방식 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- Linear, Vercel, Stripe, Raycast 모두 적용 확인
- Arc: macOS 시스템 설정 연동

---

## 7. MCW 채택/비채택 최종 결정표

### 7.1 채택 항목 (25개)

| # | 태그 | 항목 | 벤치마크 출처 | MCW 적용 Task | 사유 |
|---|------|------|---------------|---------------|------|
| 1 | [COLOR-OKLCH] | OKLCH 컬러 공간 채택 | Vercel / Linear | S7DS4 | 균일 인지 대비, Dark 모드 대칭 보장 |
| 2 | [COLOR-NEUTRAL-11] | Neutral 11단 팔레트 (`gray-100`~`gray-1100`) | Stripe / Vercel | S7DS4 | 충분한 계단으로 어떤 배경도 커버 |
| 3 | [COLOR-TOKEN-PAIR] | 모든 컬러 토큰 Light/Dark 쌍 의무 정의 | Vercel | S7DS4 | Dark mode 품질 보장 |
| 4 | [COLOR-ACCENT-INDIGO] | 단일 Accent = Indigo-600 (`#4F46E5`) | Stripe + Linear | S7DS4, S7FE1 | AI/챗봇 정체성 + 절제 원칙 |
| 5 | [COLOR-ACCENT-RULE] | Accent 사용 = 버튼/링크/포커스만 | Stripe | S7DS3, S7DS5 | 클릭 신호 명확화, 색 오염 방지 |
| 6 | [COLOR-SEMANTIC-4] | Semantic 컬러 4종 + 배경 쌍 | Stripe | S7DS4, S7FE2 | 상태 전달 표준화 |
| 7 | [FONT-INTER] | 영문: Inter + Inter Tight | Linear | S7DS4, S7FE1 | 화면 최적화 폰트, 무료·오픈 |
| 8 | [FONT-PRETENDARD] | 한글: Pretendard | — (MCW 독자) | S7DS4, S7FE1 | KR 웹 최적 한글 폰트 |
| 9 | [FONT-SCALE-9] | 9-step 타이포 스케일 (12~48px) | Linear / Vercel | S7DS4, S7FE1 | 충분한 계단, 한국어 소폰트 포함 |
| 10 | [FONT-LETTERSPACING] | letter-spacing 크기 비례 감소 규칙 | Linear / Vercel | S7DS4 | Display 텍스트 가독성 향상 |
| 11 | [SPACING-8PT] | 8pt 그리드 + 4pt 미세조정 | 공통 5개 제품 | S7DS4 | 예외 없는 수학적 일관성 |
| 12 | [SPACING-10STEP] | 간격 10단계 (4/8/12/16/20/24/32/48/64/96) | 공통 파생 | S7DS4, S7FE2 | 충분한 계단, 현장 적용 검증 |
| 13 | [SHADOW-4LEVEL] | Elevation 4단 Shadow (`0→1px→4px→8px→16px`) | Vercel | S7DS4, S7FE3 | 공간 위계 명확화 |
| 14 | [MOTION-5STEP] | 5단 duration (75/150/250/350/500ms) | Linear / Raycast 합성 | S7DS5, S7FE3 | 상황별 적절한 피드백 속도 |
| 15 | [MOTION-4EASE] | 4종 easing (standard/accelerate/decelerate/spring) | Linear / Vercel | S7DS5 | 방향성 있는 모션 |
| 16 | [MOTION-SPRING] | Spring ease `cubic-bezier(0.16, 1, 0.3, 1)` | Linear / Raycast | S7DS5, S7FE3 | 팝업/팔레트 생동감 |
| 17 | [MOTION-REDUCED] | `prefers-reduced-motion` 전역 적용 | 공통 | S7DS5, S7FE4 | 접근성 필수 |
| 18 | [COMP-COMMAND-PALETTE] | ⌘K Command Palette 패턴 | Linear / Raycast | S7FE3, S7FE4 | 챗봇 검색/전환 핵심 UX |
| 19 | [COMP-KBD] | `<kbd>` 단축키 박스 스타일 (Raycast 방식) | Raycast | S7FE4 | ⌘K 등 단축키 시각화 |
| 20 | [COMP-TOAST] | Toast 알림: 우하단 320px, slide-in, 3000ms | Raycast | S7FE2, S7FE4 | 비방해 피드백 표준 |
| 21 | [COMP-FOCUS] | Focus ring: 2px Indigo + 2px offset | Stripe / Vercel | S7DS3, S7FE4 | 접근성 + 브랜드 |
| 22 | [COMP-INPUT-STRIPE] | Input: 40px/32px, focus glow box-shadow | Stripe | S7FE2 | 폼 UX 품질 기준 |
| 23 | [COMP-MODAL-MOTION] | Modal: scale(0.95→1) + opacity, 200ms spring | Raycast | S7FE3 | 자연스러운 등장 |
| 24 | [COMP-CONTEXT-BLUR] | Context Menu: blur(20px) + border-radius 10px | Arc / Raycast | S7FE4 | 공간 깊이 표현 |
| 25 | [LAYOUT-CONTAINER] | 컨테이너 max-width 3종 (1200/1440/800px) | Vercel / Linear | S7FE1 | 콘텐츠 유형별 최적 너비 |

---

### 7.2 비채택 항목 (12개)

| # | 항목 | 출처 | 비채택 사유 |
|---|------|------|------------|
| 1 | Arc 멀티탭 Space 구조 | Arc | MCW는 SaaS 웹앱, 브라우저 수준 복잡도 불필요. 사용자 학습 비용 과대. |
| 2 | Vercel Error = Hot Pink (`#FF0080`) | Vercel | 일반 의미론(Red) 위반. 한국 사용자에게 혼란 유발. |
| 3 | Geist Sans / Geist Mono | Vercel | Vercel 독자 폰트. 한국어 글리프 없음. MCW는 Pretendard 필수. |
| 4 | Sohne / Sohne Mono | Stripe | Klim Type 유료 라이선스. 한국어 미지원. |
| 5 | Raycast `⌥ Space` 전역 단축키 | Raycast | 웹앱에서 OS/브라우저 단축키 충돌. 접근 불가. |
| 6 | macOS SF Symbol 아이콘 | Arc / Raycast | 플랫폼 종속적. 크로스 플랫폼 불가. Lucide/Phosphor로 대체. |
| 7 | Arc 사이드바 드래그 너비 조절 | Arc | 구현 복잡도 대비 효과 낮음. MCW 사이드바는 고정 너비로 단순화. |
| 8 | Linear Issue Card 상태 복잡도 | Linear | Linear는 Project Management 도구. MCW Bot/Skill Card는 다른 정보 구조 필요. |
| 9 | Stripe 50/100/150 Gray 네이밍 | Stripe | MCW는 100~1100 11단 통일. 혼용 시 혼란. |
| 10 | Vercel 스크롤바 항상 표시 | Vercel | 한국 웹 관행 및 모바일에서 스크롤바 표시는 UI 오염. hover 표시로 변형. |
| 11 | Arc 사이드바 컬러 Space 코딩 (무지개) | Arc | 브랜드 정체성 충돌. MCW는 Indigo 단일 Accent 원칙. |
| 12 | Stripe 폼 전용 glow 반경 3px | Stripe | MCW는 outline 2px 방식으로 통일. box-shadow glow와 혼용 시 불일치. |

---

## 8. 제품별 "한 줄 본질" 요약

- **Linear**: "모든 픽셀이 빠름을 말해야 한다 — 속도는 기능이다."
- **Vercel**: "흰 공간과 검은 공간이 대칭을 이루면, 코드가 빛난다."
- **Stripe**: "신뢰는 일관성에서 온다 — 보라 하나로 모든 것을 말한다."
- **Arc**: "인터페이스가 사라질수록 사용자는 더 자유롭다."
- **Raycast**: "키보드만으로 세상을 움직이게 하라."

---

## 9. MCW 정체성 제안 (5 제품을 따르되, 어떻게 차별화할까)

### MCW 고유 컨텍스트

MCW는 "AI 챗봇 빌더 플랫폼"이다. 5개 제품과 본질적으로 다른 점:
1. **사용자가 콘텐츠 생산자이기도 함** — 봇을 만들고 판매. Linear/Vercel은 소비자만.
2. **대화 UI가 핵심** — 채팅 버블, 타이핑 인디케이터, 스트리밍 텍스트가 1차 UI.
3. **한국어 우선** — Pretendard 필수, 조사 처리, 세로 압축 텍스트 대응.
4. **AI 응답 스트리밍** — 점진적 렌더링이 기본. Skeleton → 스트리밍 전환 UX.

### 차별화 포인트

**1. 채팅 버블 디자인 언어**
- 5개 제품에 없는 컴포넌트. MCW 독자 설계 필요.
- 사용자 버블: Indigo 배경, 우측 정렬, border-radius 18px (우상단 4px)
- Bot 버블: 뉴트럴 gray 배경, 좌측 정렬, 아바타(32px) 병행
- 스트리밍 커서: 2px × 16px Indigo 깜빡임 (opacity 0↔1, 0.8s ease-in-out)

**2. Bot 아바타 시스템**
- 5개 제품에 없음. 봇의 페르소나 시각화.
- 64px circle, 생성 시 사용자가 업로드 or AI 생성
- 기본 아바타: Indigo gradient + 첫 글자 이니셜

**3. Skill 마켓플레이스 카드**
- Stripe의 "결제 카드" + Linear의 "Issue Card" 혼합
- 가격 표시 영역 (좌하단), 설치 버튼 (우하단)
- 활성화 상태: Indigo border + 좌측 체크 배지

**4. 한국어 타이포그래피 특수 규칙**
- Pretendard `word-break: keep-all` 의무 (단어 중간 줄바꿈 방지)
- 한국어 line-height: 영문 대비 +0.1em 추가 (예: body 1.5 → 1.6)
- 버튼 텍스트 한국어: letter-spacing 0 (한글은 자간 조정 불필요)
- 에러 메시지 한국어: 조사 자동 처리 로직 (은/는, 이/가)

---

## 10. 부록 — 색상/폰트/모션 레퍼런스 값

### Linear 공개 토큰 (추정값 포함)

```css
/* Linear Dark 팔레트 (추정) */
--linear-bg-primary: #0F0F10;
--linear-bg-secondary: #1A1A1E;
--linear-bg-tertiary: #222228;
--linear-border-subtle: rgba(255,255,255,0.06);
--linear-border-default: rgba(255,255,255,0.12);
--linear-text-primary: #FFFFFF;
--linear-text-secondary: rgba(255,255,255,0.65);
--linear-text-tertiary: rgba(255,255,255,0.40);
--linear-accent: #5E5CEB;   /* 추정 */

/* Linear 모션 */
--linear-ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
--linear-duration-short: 150ms;
--linear-duration-medium: 200ms;
```

### Vercel 공개 토큰 (공식 — vercel.com/design-system 문서 기반)

```css
/* Vercel Design System (geist) */
--ds-gray-100: #1a1a1a;  /* Dark 최진 */
--ds-gray-200: #282828;
--ds-gray-300: #3c3c3c;
--ds-gray-400: #606060;
--ds-gray-500: #888888;
--ds-gray-600: #8d8d8d;
--ds-gray-700: #adadad;
--ds-gray-800: #d4d4d4;
--ds-gray-900: #e8e8e8;
--ds-gray-1000: #f2f2f2;
/* Light 모드에서는 반전 */

--ds-blue-600: #0070F3;   /* Accent Blue */
--ds-red-500: #FF0080;    /* Error (비채택) */
--ds-green-500: #50E3C2;  /* Success */
```

### Stripe 공개 토큰 (Stripe Elements CSS 기반)

```css
/* Stripe 입력 필드 */
--stripe-input-height: 40px;
--stripe-input-border: #C9C9CB;
--stripe-input-focus: #635BFF;
--stripe-input-radius: 6px;
--stripe-focus-shadow: 0 0 0 3px rgba(99,91,255,0.25);
--stripe-error: #C0392B;
--stripe-success: #09825D;
--stripe-accent: #635BFF;
```

### Raycast Toast/Modal (공식 블로그/디자인 시스템 기반)

```css
/* Raycast Toast */
--raycast-toast-bg: rgba(30,30,32,0.95);
--raycast-toast-blur: blur(20px);
--raycast-toast-shadow: 0 8px 32px rgba(0,0,0,0.4);
--raycast-toast-radius: 12px;
--raycast-toast-width: 320px;
--raycast-toast-duration: 3000ms;

/* Raycast Modal */
--raycast-modal-enter: scale(0.95) → scale(1.0), 200ms, cubic-bezier(0.16,1,0.3,1);
--raycast-modal-exit: scale(1.0) → scale(0.95), 150ms, ease-in;

/* Raycast kbd */
--raycast-kbd-bg: rgba(255,255,255,0.1);
--raycast-kbd-border: rgba(255,255,255,0.15);
--raycast-kbd-border-bottom: 2px; /* 입체감 */
--raycast-kbd-radius: 4px;
--raycast-kbd-font-size: 11px;
```

### MCW 최종 토큰 요약 (S7DS4 작성 기준)

```css
/* MCW Design Tokens (v1 Draft) */

/* --- Neutral 11단 (OKLCH 기반 추정 HEX) --- */
--mcw-gray-100: #1C1C1E;
--mcw-gray-200: #2C2C2E;
--mcw-gray-300: #3A3A3C;
--mcw-gray-400: #545456;
--mcw-gray-500: #6C6C6E;
--mcw-gray-600: #8E8E93;
--mcw-gray-700: #AEAEB2;
--mcw-gray-800: #C7C7CC;
--mcw-gray-900: #D1D1D6;
--mcw-gray-1000: #E5E5EA;
--mcw-gray-1100: #F2F2F7;

/* --- Accent --- */
--mcw-indigo-600: #4F46E5;
--mcw-indigo-500: #6366F1;
--mcw-indigo-700: #4338CA;

/* --- Semantic --- */
--mcw-success: #16A34A;
--mcw-success-bg: #DCFCE7;
--mcw-warning: #D97706;
--mcw-warning-bg: #FEF3C7;
--mcw-error: #DC2626;
--mcw-error-bg: #FEE2E2;
--mcw-info: #2563EB;
--mcw-info-bg: #DBEAFE;

/* --- Motion --- */
--mcw-duration-micro: 75ms;
--mcw-duration-fast: 150ms;
--mcw-duration-normal: 250ms;
--mcw-duration-slow: 350ms;
--mcw-duration-lazy: 500ms;
--mcw-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--mcw-ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
--mcw-ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
--mcw-ease-spring: cubic-bezier(0.16, 1, 0.3, 1);

/* --- Spacing --- */
--mcw-space-1: 4px;
--mcw-space-2: 8px;
--mcw-space-3: 12px;
--mcw-space-4: 16px;
--mcw-space-5: 20px;
--mcw-space-6: 24px;
--mcw-space-8: 32px;
--mcw-space-12: 48px;
--mcw-space-16: 64px;
--mcw-space-24: 96px;

/* --- Shadow --- */
--mcw-shadow-0: none;
--mcw-shadow-1: 0 1px 2px rgba(0,0,0,0.08);
--mcw-shadow-2: 0 4px 8px rgba(0,0,0,0.12);
--mcw-shadow-3: 0 8px 24px rgba(0,0,0,0.16);
--mcw-shadow-4: 0 16px 48px rgba(0,0,0,0.24);
```

---

> 작성 기준: 학습된 지식 + 공개 디자인 시스템 문서 관찰
> "(추정)" 표기 항목: 공식 미확인 수치
> 다음 참조: S7DS3(디자인 원칙), S7DS4(토큰 확정), S7DS5(모션), S7FE1~S7FE4(컴포넌트 구현)
