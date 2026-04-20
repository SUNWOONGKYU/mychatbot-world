# S7DS3: MCW 디자인 원칙 (Design Principles)

> 작성일: 2026-04-20
> Task: S7DS3 — MCW 북극성 원칙 확정 (5~7개)
> 선행 근거: S7DS1 AS-IS 진단 (35건, 5축), S7DS2 벤치마크 (Linear/Vercel/Stripe/Arc/Raycast, 25채택)
> 목적: 모든 토큰/컴포넌트/페이지 결정의 일관된 판단 기준 수립

---

## 0. Executive Summary

### 확정 원칙: **7개**

| # | 원칙명 (한글) | 원칙명 (영문) | 핵심 키워드 | 해결하는 주요 축 |
|---|--------------|--------------|------------|----------------|
| 1 | 명료함이 우선이다 | Clarity First | 단일 신호, 혼란 제거 | 하드코딩 색상 일관성, 페이지 일관성 |
| 2 | 토큰이 사실이다 | Tokens Are Truth | CSS 변수, 시스템 전파 | 토큰/파운데이션, 하드코딩 |
| 3 | 다크와 라이트는 대칭이다 | Dark–Light Symmetry | 쌍 정의, 모드 이탈 금지 | 하드코딩 색상(Light 파손), 접근성 |
| 4 | 모션은 방향을 말한다 | Motion Tells Direction | 피드백, 안내, 지속시간 | 컴포넌트 커버리지 |
| 5 | 접근성은 기본값이다 | Accessible by Default | WCAG AA, 포커스 링 | 접근성 (AA 미달) |
| 6 | 한국어가 일등 시민이다 | Korean First Citizen | Pretendard, word-break | 타이포/간격 일관성 |
| 7 | 밀도와 호흡의 균형 | Dense but Breathable | 8pt 그리드, 정보 위계 | 컴포넌트 커버리지, 페이지 일관성 |

### 원칙-진단-벤치마크 매핑 개요

| 원칙 | S7DS1 해결 이슈 (High/Med) | S7DS2 채택 항목 |
|------|--------------------------|---------------|
| 1. Clarity First | #2, #5, #13, #14, #32 | [COLOR-ACCENT-RULE], [COLOR-SEMANTIC-4] |
| 2. Tokens Are Truth | #1, #3, #4, #6, #7, #8, #15, #16 | [COLOR-OKLCH], [COLOR-NEUTRAL-11], [COLOR-TOKEN-PAIR] |
| 3. Dark–Light Symmetry | #9, #10, #21, #33 | [COLOR-TOKEN-PAIR], [COMP-FOCUS] |
| 4. Motion Tells Direction | #20, #26, #28 | [MOTION-5STEP], [MOTION-4EASE], [MOTION-SPRING], [MOTION-REDUCED] |
| 5. Accessible by Default | #3, #9, #10, #12, #27, #30 | [COMP-FOCUS], [MOTION-REDUCED] |
| 6. Korean First Citizen | #17, #18, #19, #34 | [FONT-INTER], [FONT-PRETENDARD], [FONT-SCALE-9], [FONT-LETTERSPACING] |
| 7. Dense but Breathable | #11, #24, #25, #29, #31 | [SPACING-8PT], [SPACING-10STEP], [SHADOW-4LEVEL], [LAYOUT-CONTAINER] |

---

## 1. 원칙 #1: 명료함이 우선이다 (Clarity First)

### 1.1 선언문 (Statement)

> "인터페이스의 모든 요소는 단 하나의 의미를 전달해야 한다."

### 1.2 이유 (Why)

**S7DS1 진단 연결:**
- `#2` Create 위저드 Primary 버튼 색상 `#6366f1`(Indigo) — 실제 브랜드 퍼플(`#5E4BFF`)과 달라 "지금 행동하라"는 신호가 다른 색으로 둘러싸여 희석됨
- `#5` `css/pages.css`의 `body.page-dark` — 구버전 다크 시스템이 신규 토큰 시스템과 동시에 로드되어 같은 페이지에 두 개의 배경 언어가 존재
- `#13` `components/landing/` 전체 `style={}` prop — 마케팅 섹션과 앱 섹션이 서로 다른 색상 언어를 사용
- `#14` `app/page.tsx` 그린 섹션 배경 하드코딩 — 브랜드와 무관한 색이 CTA와 경쟁
- `#32` `css/styles.css`의 구버전 그라데이션 — 3개 배경 시스템이 동시에 살아있음

**S7DS2 벤치마크 연결:**
- `[COLOR-ACCENT-RULE]` Stripe 원칙: Accent(Indigo)는 버튼·링크·포커스에만 사용. 색이 남발되면 신호가 사라진다.
- `[COLOR-SEMANTIC-4]` Stripe: 상태 전달을 위한 Semantic 컬러 4종 — 신호가 명확해야 신뢰가 생긴다.

### 1.3 Do / Don't (최소 3쌍)

| ✅ Do | ❌ Don't |
|------|---------|
| CTA 버튼에 `rgb(var(--color-primary))` 단일 Indigo 사용 | 버튼마다 다른 퍼플 계열(`#6366f1`, `#5E4BFF`, `#8b5cf6`) 혼용 |
| 성공 상태는 항상 `--color-success`(Green), 오류는 `--color-error`(Red) | 페이지마다 Green 색상이 달라 "성공인지 강조인지" 구분 불가 |
| 배경 그라데이션은 `var(--gradient-ai)` 등 토큰화된 이름으로 참조 | `linear-gradient(135deg, rgb(16 185 129), rgb(5 150 105))` 인라인 직접 기입 |
| 하나의 색은 하나의 역할만 (Indigo = 행동, Green = 성공, Red = 오류) | 같은 Green이 "성공"과 "환경 섹션 배경"에 혼용 |
| 구버전 CSS 시스템(`body.page-dark`)은 삭제, 단일 토큰 시스템으로 통일 | 신구 시스템이 동시에 존재하여 어떤 규칙이 우선인지 불명확 |

### 1.4 판단 기준 (Decision Rule)

> "이 색상/스타일을 처음 보는 사람이 즉시 그 의미(행동/상태/장식)를 알 수 있는가?"
> → 알 수 없다면 Clarity First 위반.

### 1.5 MCW 적용 예시

**AS-IS:** `btnPrimary: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }` (create/ui.tsx)
**TO-BE:** `className="bg-gradient-to-br from-primary-600 to-primary-700 text-text-on-primary"`

**AS-IS:** `app/page.tsx` 그린 배경 `linear-gradient(135deg, rgb(16 185 129), rgb(5 150 105))` — 브랜드와 관계 없는 색이 랜딩 섹션을 점유
**TO-BE:** `--gradient-success` 토큰 신설 또는 해당 섹션이 "성공/신뢰"를 상징하는 의도를 명확히 하고 `--color-success` 기반으로 재설계

---

## 2. 원칙 #2: 토큰이 사실이다 (Tokens Are Truth)

### 2.1 선언문 (Statement)

> "색상, 크기, 간격의 모든 결정은 토큰에서 시작하고 토큰에서 끝난다."

### 2.2 이유 (Why)

**S7DS1 진단 연결:**
- `#1` Create 위저드 `ui.tsx` 전체 인라인 스타일 + rgba 하드코딩 — CSS 변수 사용률 0%, 토큰 시스템의 혜택을 전혀 받지 못함
- `#4` `css/create.css` 160건 하드코딩 — 이 파일에서 CSS 변수(`var(--`) 사용 건수 0
- `#6` `app/jobs/search/page-client.tsx:330` `bg-[#0f0c29]` — 한 글자 수정이면 될 것을 하드코딩으로 고착
- `#7` `app/jobs/hire/page.tsx` 49건 인라인 스타일, `#f8fafc`·`#fff` 등 라이트 고정값
- `#8` `components/ui/`에 Button/Input/Card 프리미티브 없음 — 컴포넌트가 없으니 공통 규칙이 없음
- `#15` `css/home.css` 100건 하드코딩 — 변수 54건과 혼재
- `#16` `css/chat.css` 137건 하드코딩 — 채팅 버블 토큰이 있음에도 미활용

**S7DS2 벤치마크 연결:**
- `[COLOR-OKLCH]` Vercel/Linear: OKLCH 컬러 공간 채택 — 균일 인지 대비, Dark 모드 대칭 보장
- `[COLOR-NEUTRAL-11]` Stripe/Vercel: Neutral 11단 팔레트 — 충분한 계단으로 어떤 배경도 커버
- `[COLOR-TOKEN-PAIR]` Vercel: 모든 토큰 Light/Dark 쌍 의무 정의
- `[SPACING-8PT]` 공통: 8pt 그리드 — 예외 없는 수학적 일관성
- `[SPACING-10STEP]` 공통: 간격 10단계 (4/8/12/16/20/24/32/48/64/96)

### 2.3 Do / Don't (최소 3쌍)

| ✅ Do | ❌ Don't |
|------|---------|
| `rgb(var(--text-primary))` 또는 Tailwind `text-text-primary` | `color: white`, `color: rgba(255,255,255,0.5)` |
| `rgb(var(--bg-surface))` | `background: rgba(255,255,255,0.04)` |
| `rgb(var(--border))` | `border: 1px solid rgba(255,255,255,0.08)` |
| Tailwind spacing 클래스(`p-4`, `gap-6`) 또는 `--space-*` 변수 | `padding: '1.2rem'`, `margin: '18px'` 인라인 직접 수치 |
| `var(--radius-lg)` 또는 Tailwind `rounded-lg` | `borderRadius: '10px'` 하드코딩 |
| 토큰이 없으면 먼저 토큰을 추가하고 코드 작성 | 토큰 없이 임시 하드코딩 후 "나중에 토큰화" |

### 2.4 판단 기준 (Decision Rule)

> "이 코드에서 색상·크기·간격 값을 찾았을 때, 토큰 이름이 아닌 원시 값(HEX, rgba, px 직접값)이 있는가?"
> → 있다면 Tokens Are Truth 위반.

### 2.5 MCW 적용 예시

**AS-IS (create/ui.tsx):**
```js
formCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
```
**TO-BE:**
```tsx
className="bg-bg-surface border border-border rounded-xl"
```

**AS-IS (css/create.css):** CSS 변수 사용 0건, `#fff`, `rgba(0,0,0,0.3)` 160건
**TO-BE:** `var(--bg-surface)`, `var(--border)`, `var(--text-primary)` 전면 전환 또는 컴포넌트 내부 Tailwind로 마이그레이션

---

## 3. 원칙 #3: 다크와 라이트는 대칭이다 (Dark–Light Symmetry)

### 3.1 선언문 (Statement)

> "모든 색상 결정은 다크와 라이트 모두에서 동등한 품질로 작동해야 한다."

### 3.2 이유 (Why)

**S7DS1 진단 연결:**
- `#9` `--text-muted` 색상 대비율 3.8:1 — WCAG AA(4.5:1) 미달. 다크 모드에서만 진단했는데 라이트 모드는 미분석
- `#10` Create 위저드 `rgba(255,255,255,0.5)` 텍스트 — 라이트 모드에서는 흰 배경 위에 반투명 흰 텍스트 = 완전 불가시
- `#21` `:focus-visible` 아웃라인에서 `rgb(var(--color-primary))` 참조 — `--color-primary` 실제 미정의, 포커스 링이 양쪽 모드에서 모두 깨짐
- `#33` 카카오 버튼 `focus:ring-[#FEE500]` — 다크 배경 대비율 미검증

**추가 근거 (S7DS1 섹션 3.2):**
- CSS 파일군 대부분이 다크 전용 값(`rgba(255,255,255,0.x)`)만 정의, 라이트 대응 없음
- Light/Dark 대칭 깨짐 추정 700건 이상

**S7DS2 벤치마크 연결:**
- `[COLOR-TOKEN-PAIR]` Vercel: "각 토큰은 반드시 Light/Dark 쌍으로 존재. 하나만 정의 불가."
- `[COMP-FOCUS]` Stripe/Vercel: Focus ring 2px Indigo + 2px offset — 양쪽 모드에서 동일 검증

### 3.3 Do / Don't (최소 3쌍)

| ✅ Do | ❌ Don't |
|------|---------|
| 새 시맨틱 토큰 추가 시 `.dark`와 `.light` 블록 양쪽에 동시 정의 | `.dark`에만 정의하고 라이트 모드는 "나중에" |
| `rgba(255,255,255,0.5)` 대신 `rgb(var(--text-secondary))` — `.light`에서 자동으로 어두운 값으로 전환 | `white`, `rgba(255,255,255,0.x)` 직접 사용 — 라이트 모드에서 보이지 않음 |
| 새 컴포넌트 구현 후 라이트 모드 전환하여 시각 확인 필수 | 다크 모드에서만 개발·검증하고 라이트 모드 테스트 생략 |
| `--color-primary` 참조 대신 실존하는 `rgb(var(--primary-500))` 직접 참조 | 정의되지 않은 CSS 변수 참조 (포커스 링 깨짐) |
| PR 체크리스트에 "라이트 모드 스크린샷" 포함 | 다크 모드 스크린샷만 첨부 |

### 3.4 판단 기준 (Decision Rule)

> "브라우저 테마를 라이트로 전환했을 때 이 컴포넌트가 정상적으로 보이는가?"
> → 텍스트가 사라지거나 배경과 구분이 안 된다면 Dark–Light Symmetry 위반.

### 3.5 MCW 적용 예시

**AS-IS (globals.css — Light 섹션):**
```css
/* .light 블록에 --color-primary, --color-accent 미정의 */
```
**TO-BE:**
```css
.light {
  --color-primary: var(--primary-500);
  --color-accent: var(--primary-400);
  /* 모든 시맨틱 토큰 쌍 필수 */
}
```

**AS-IS:** `app/jobs/hire/page.tsx` 전체가 `#f8fafc`, `#fff`, `#1e293b` — 라이트 모드 고정, 다크 모드에서 완전 파손
**TO-BE:** `bg-bg-base`, `bg-bg-surface`, `text-text-primary` — 모드에 따라 자동 전환

---

## 4. 원칙 #4: 모션은 방향을 말한다 (Motion Tells Direction)

### 4.1 선언문 (Statement)

> "움직임은 사용자에게 '무엇이 어디서 왔고 어디로 가는지'를 알려주는 안내자다."

### 4.2 이유 (Why)

**S7DS1 진단 연결:**
- `#20` Modal/Toast 없음 — 브라우저 기본 `alert()` 사용 추정. 모션 없는 팝업은 사용자가 맥락을 잃게 함
- `#26` 모달 → 바텀시트 전환 기획만 있고 미구현 — 모바일에서 방향성 없는 전환 UX
- `#28` 전반적 empty state 디자인 없음 — 상태 전환 시 사용자가 변화를 인식하지 못함

**S7DS2 벤치마크 연결:**
- `[MOTION-5STEP]` 5단 duration (75/150/250/350/500ms) — 상황별 적절한 피드백 속도
- `[MOTION-4EASE]` 4종 easing — 방향성 있는 모션 (들어오는 요소 vs 나가는 요소 다른 곡선)
- `[MOTION-SPRING]` Spring ease `cubic-bezier(0.16, 1, 0.3, 1)` — 팝업/팔레트의 생동감
- `[MOTION-REDUCED]` `prefers-reduced-motion` 전역 적용 — 접근성 필수

### 4.3 Do / Don't (최소 3쌍)

| ✅ Do | ❌ Don't |
|------|---------|
| 드롭다운 등장: `translateY(-4px) → 0` + `opacity 0 → 1`, 150ms decelerate | 갑자기 나타나는 드롭다운 — 어디서 왔는지 모름 |
| 모달 등장: `scale(0.95) → 1` + `opacity 0 → 1`, 250ms spring | 즉각 표시 또는 단순 fade만 — 공간감 없음 |
| Toast: 우측에서 `translateX(100%) → 0`, 250ms spring — "새 알림이 들어왔다"는 방향 명확 | 화면 중앙에서 fade in — 어디서 왔는지 모름 |
| `prefers-reduced-motion: reduce` 전역 처리 — 모든 transition 0.01ms로 단축 | 접근성 설정 무시 — 전정기관 장애 사용자에게 불편 |
| hover 피드백: 75ms micro duration — 즉각적인 반응감 | hover에 300ms slow duration — 인터랙션이 느리게 느껴짐 |

### 4.4 판단 기준 (Decision Rule)

> "이 애니메이션을 보지 못한 사람에게 '이 요소가 어디서 왔고 어디로 갔는지' 설명할 수 있는가?"
> → 설명할 수 없다면 장식적 모션. Motion Tells Direction 위반.

### 4.5 MCW 적용 예시

**AS-IS:** `alert('저장되었습니다')` — 브라우저 기본 경고창, 방향성 없음
**TO-BE:** Raycast 스타일 Toast, 우하단 slide-in 250ms spring — "작업 완료 확인"이 오른쪽에서 들어와 자연스럽게 3초 후 퇴장

**AS-IS:** 어드민 섹션 전환 — 즉각 교체, 전환 없음
**TO-BE:** `opacity 0 → 1` + 미세 `translateY(4px) → 0`, 150ms standard — 새 섹션이 "올라오는" 방향감

---

## 5. 원칙 #5: 접근성은 기본값이다 (Accessible by Default)

### 5.1 선언문 (Statement)

> "모든 사용자가 키보드만으로, 시각 보조 기기만으로 MCW를 완전히 사용할 수 있어야 한다."

### 5.2 이유 (Why)

**S7DS1 진단 연결:**
- `#3` Create 위저드 `outline: 'none'` — 키보드 포커스 완전 차단. Create가 MCW의 핵심 기능임에도 키보드 사용 불가
- `#9` `--text-muted` 대비율 3.8:1 — WCAG AA 미달(4.5:1 기준). 약시 사용자 읽기 불가
- `#10` `rgba(255,255,255,0.5)` 텍스트 — 대비율 3.0:1, 더 심각한 미달
- `#12` 어드민 섹션 전환 탭에 ARIA role/aria-current 없음 — 스크린리더 사용자 현재 위치 파악 불가
- `#27` 모바일 탭바 4개 탭 중 1개만 `focus-visible` — 키보드로 탭바 일부만 접근 가능
- `#30` Community/Skills/Jobs ARIA landmark 부족

**S7DS2 벤치마크 연결:**
- `[COMP-FOCUS]` Stripe/Vercel: Focus ring 2px Indigo + 2px offset — 접근성 + 브랜드 일관성
- `[MOTION-REDUCED]` 공통: `prefers-reduced-motion` 전역 적용 필수

### 5.3 Do / Don't (최소 3쌍)

| ✅ Do | ❌ Don't |
|------|---------|
| 모든 인터랙티브 요소에 `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2` | `outline: none` 으로 포커스 링 제거 |
| `--text-muted` 값을 WCAG AA(4.5:1) 이상 보장하는 `neutral-400`(다크 기준) 이상으로 조정 | 디자인 심미성을 위해 옅은 텍스트 색상 사용 — 대비율 검증 생략 |
| `<button>`, `<a>`, `<input>` 시맨틱 태그 사용 + `aria-label` 명시 | `<div onClick>` 패턴 — 스크린리더 접근 불가 |
| `role="tab"`, `aria-selected`, `aria-current="page"` 네비게이션 탭에 부여 | 시각적으로는 탭처럼 보이지만 ARIA role 없는 탭 |
| 색상 대비율 검증을 컴포넌트 구현 완료의 필수 조건으로 정의 | 시각 디자인 후 접근성 검토는 "나중에" |

### 5.4 판단 기준 (Decision Rule)

> "마우스를 치우고 Tab 키만으로 이 기능에 접근하고 완료할 수 있는가?"
> → 불가능하다면 Accessible by Default 위반.

### 5.5 MCW 적용 예시

**AS-IS (create/ui.tsx):**
```js
formInput: { ..., outline: 'none' }
```
**TO-BE (Tailwind):**
```tsx
className="... focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
```

**AS-IS:** `--text-muted`가 `#64748B` (neutral-500) — `--bg-base`(`#0F172A`) 위에서 대비율 3.8:1
**TO-BE:** `--text-muted`를 `#94A3B8` (neutral-400) 이상으로 조정 → 대비율 4.6:1 (AA 충족)

---

## 6. 원칙 #6: 한국어가 일등 시민이다 (Korean First Citizen)

### 6.1 선언문 (Statement)

> "한국어 텍스트는 영문과 동등한 가독성과 미학적 품질로 표시되어야 한다."

### 6.2 이유 (Why)

**S7DS1 진단 연결:**
- `#17` Hero 텍스트 반응형 불일치 — `text-5xl md:text-7xl` vs `text-[48px]` 혼재. 한국어 긴 문자열에서 줄바꿈 위치가 의미 단위를 깬다
- `#18` Create 위저드 내부 spacing이 `rem` 직접 사용 — 한국어 텍스트는 영문 대비 시각 무게가 달라 간격 표준화가 중요
- `#19` `app/jobs/hire/page.tsx` `'Noto Sans KR', 'Inter'` 별도 지정 — Pretendard 이탈, 폰트 일관성 파괴
- `#34` 어드민 페이지 타이포 스케일 비표준 — 한국어 UI 가독성 저하

**S7DS2 벤치마크 연결:**
- `[FONT-INTER]` Linear: Inter + Inter Tight — 화면 최적화, 영문 UI 표준
- `[FONT-PRETENDARD]` MCW 독자: Pretendard — KR 웹 최적 한글 폰트
- `[FONT-SCALE-9]` 9-step 타이포 스케일 (12~48px) — 한국어 소폰트(13px) 포함
- `[FONT-LETTERSPACING]` letter-spacing 크기 비례 감소 규칙

**MCW 고유 컨텍스트 (S7DS2 섹션 9):**
- 한국어 `word-break: keep-all` 의무 — 단어 중간 줄바꿈 방지
- 한국어 line-height: 영문 대비 +0.1em 추가 (body 1.5 → 1.6)
- 버튼 한국어: letter-spacing 0 (한글 자간 조정 불필요)

### 6.3 Do / Don't (최소 3쌍)

| ✅ Do | ❌ Don't |
|------|---------|
| `--font-sans: 'Pretendard', 'Inter', sans-serif` 전역 적용 | 페이지별로 `'Noto Sans KR'`, `'Apple SD Gothic Neo'` 별도 지정 |
| 한국어 본문 `word-break: keep-all` 전역 또는 컴포넌트별 명시 | `word-break: break-all` — "가격" 같은 단어가 "가\n격"으로 쪼개짐 |
| 한국어 body line-height 1.6 (영문 1.5 대비 +0.1) | 영문·한국어 동일 line-height — 한국어 글자 겹침 또는 답답한 느낌 |
| 버튼, 레이블 한국어 `letter-spacing: 0` | 한국어에 `letter-spacing: -0.01em` 적용 — 글자 겹침 |
| 타이포 스케일 `xs(13px)` 포함 — 한국어 UI 작은 레이블용 | 영문 기준 `sm(14px)`을 최소로 사용 — 한국어 작은 UI 텍스트 표현 불가 |

### 6.4 판단 기준 (Decision Rule)

> "한국어 텍스트 3줄 이상을 이 컴포넌트에 넣었을 때 가독성이 유지되고 줄바꿈이 자연스러운가?"
> → 유지되지 않는다면 Korean First Citizen 위반.

### 6.5 MCW 적용 예시

**AS-IS:**
```css
/* app/jobs/hire/page.tsx */
fontFamily: "'Noto Sans KR', 'Inter', sans-serif"
```
**TO-BE:**
```tsx
/* globals.css --font-sans 사용 */
className="font-sans"
/* 전역에서 var(--font-sans): 'Pretendard', 'Inter', -apple-system, sans-serif */
```

**AS-IS (Hero 텍스트):** `text-[48px]` 고정값 — 모바일에서 한국어 긴 타이틀이 한 줄을 넘을 때 어색하게 잘림
**TO-BE:** `text-4xl md:text-5xl lg:text-6xl` + `word-break: keep-all` — 반응형 + 자연스러운 줄바꿈

---

## 7. 원칙 #7: 밀도와 호흡의 균형 (Dense but Breathable)

### 7.1 선언문 (Statement)

> "MCW는 정보가 많은 플랫폼이다. 밀도는 유지하되, 위계와 여백으로 숨을 쉬어야 한다."

### 7.2 이유 (Why)

**S7DS1 진단 연결:**
- `#11` 어드민 `abadge--green/red/muted` 자체 CSS 클래스 — 공통 컴포넌트 없이 각자 만든 Badge, 크기·여백 불일치
- `#24` Pagination 컴포넌트 없음 — 마켓플레이스, 커뮤니티에서 콘텐츠가 조밀하게 쌓임
- `#25` Skeleton/Loading — `shimmer` CSS 유틸 있으나 컴포넌트 없음
- `#29` Error boundary/전역 에러 페이지 디자인 시스템 미적용
- `#31` 랜딩 마케팅 GNB와 앱 Navbar 기능 중복 — 레이아웃 구조 불일치

**S7DS2 벤치마크 연결:**
- `[SPACING-8PT]` 공통: 8pt 그리드 — 예외 없는 수학적 일관성. "빈 공간은 낭비가 아닌 설계"(Vercel)
- `[SPACING-10STEP]` 공통: 간격 10단계 4/8/12/16/20/24/32/48/64/96
- `[SHADOW-4LEVEL]` Vercel: Elevation 4단 Shadow — 공간 위계 명확화
- `[LAYOUT-CONTAINER]` Vercel/Linear: 컨테이너 max-width 3종 (1200/1440/800px)

### 7.3 Do / Don't (최소 3쌍)

| ✅ Do | ❌ Don't |
|------|---------|
| 카드 내부 padding `p-4`(16px) 기본, 소형 카드 `p-3`(12px) — 8pt 배수 | `padding: '14px 18px'` — 8pt 비배수, 일관성 없음 |
| 섹션 간 spacing `space-12`(48px) 이상, 컴포넌트 간 `space-6`(24px) | 모든 간격을 `margin: 20px`으로 통일 — 위계 없음 |
| Elevation: 카드 Shadow Level 1, 드롭다운 Level 2, 모달 Level 3 | 다크 모드에서 shadow를 사용하지 않고 모든 레이어를 동일 border로 처리 (위계 붕괴) |
| 마케팅 페이지: max-width 1200px, 대시보드: 1440px, 폼: 480px | 모든 페이지에 동일 max-width 적용 — 콘텐츠 유형별 적정 너비 무시 |
| 정보가 많은 테이블/목록은 row height 48px, compact는 36px — 일관된 밀도 기준 | 각 컴포넌트마다 임의 row height — 목록마다 다른 밀도 |

### 7.4 판단 기준 (Decision Rule)

> "이 레이아웃에서 간격 수치가 8의 배수인가? 그리고 시각적으로 충분히 숨쉬고 있는가?"
> → 8pt 비배수 + 숨막히거나 너무 공허하다면 Dense but Breathable 위반.

### 7.5 MCW 적용 예시

**AS-IS (Create 위저드):** 스텝 내부 padding `rem` 직접 값, 8pt 그리드 추적 불가
**TO-BE:** `p-4` (16px 기본) or `p-6` (24px 여유) — Tailwind spacing 클래스만 사용

**AS-IS:** 마켓플레이스와 어드민 대시보드가 동일 컨테이너 너비 — 카드 목록이 너무 넓거나 좁음
**TO-BE:** 마켓플레이스 max-width 1200px, 어드민 full-width(1440px 컨테이너), 폼 480px

---

## 8. 원칙 간 상충 시 우선순위

### 8.1 우선순위 계층

```
1순위: Accessible by Default (#5)
       → 접근성 위반은 법적·윤리적 문제. 다른 어떤 원칙보다 우선.

2순위: Tokens Are Truth (#2)
       → 토큰이 없으면 다른 원칙을 구현할 수 없음. 인프라 원칙.

3순위: Dark–Light Symmetry (#3)
       → 토큰 기반이면 자연스럽게 따라오나, 별도 검증 필수.

4순위: Clarity First (#1)
       → 토큰이 올바르면 명료함이 달성됨. 논리적 상위.

5순위: Korean First Citizen (#6)
       → 한국어 UX는 MCW 정체성이나, 다른 원칙 충족 후 적용.

6순위: Dense but Breathable (#7)
       → 레이아웃/간격은 기능 후 품질 향상 영역.

7순위: Motion Tells Direction (#4)
       → 모션은 가장 마지막에 입히는 레이어. 단, 접근성과 연동.
```

### 8.2 충돌 시나리오별 처리

| 충돌 상황 | 우선 원칙 | 처리 방법 |
|----------|----------|----------|
| 밀도 높은 레이아웃 → 대비율 미달 텍스트 필요 | #5 Accessible | 밀도를 낮추거나 폰트 크기를 높여 대비율 확보 |
| 한국어 텍스트 길이 → 8pt 그리드 이탈 유혹 | #2 Tokens | 토큰 spacing으로 해결. 텍스트 길이는 CSS ellipsis/clamp 처리 |
| 생동감 있는 모션 → reduced-motion 사용자 고려 | #5 Accessible | `prefers-reduced-motion` 분기 필수. 모션 없어도 기능 동일 |
| 다크 우선 개발 → 라이트 QA 시간 부족 | #3 Dark–Light | 라이트 QA 생략 불가. 토큰 쌍 정의로 자동화 최대화 |
| Clarity를 위한 색 추가 → 토큰 외 색 필요 | #2 Tokens | 먼저 토큰 추가 후 사용. "임시 하드코딩" 금지 |

---

## 9. 원칙 적용 매트릭스 — S7 후속 Task별

| 후속 Task | 가장 중요한 원칙 Top 3 | 핵심 적용 포인트 |
|----------|----------------------|----------------|
| S7DS4 (토큰 확정) | #2 Tokens, #3 Symmetry, #6 Korean | OKLCH 11단 팔레트, Light/Dark 쌍 전수, Pretendard 폰트 스택 |
| S7DS5 (Semantic/Motion) | #4 Motion, #1 Clarity, #5 Accessible | 5단 duration, 4종 easing, reduced-motion, Semantic 컬러 4종 |
| S7FE1 (globals.css) | #2 Tokens, #3 Symmetry, #6 Korean | CSS 변수 전수 Light/Dark 쌍 완성, `--color-primary` 정의 오류 수정, Pretendard 전역 선언 |
| S7FE2 (Form 컴포넌트) | #5 Accessible, #1 Clarity, #7 Dense | Focus ring 복원, Input 40px/32px, Stripe glow, 에러 메시지 하단 텍스트 |
| S7FE3 (Overlay 컴포넌트) | #4 Motion, #5 Accessible, #7 Dense | Modal scale+opacity 200ms spring, Toast 우하단 slide-in, Elevation shadow 레벨 |
| S7FE4 (Composite 컴포넌트) | #1 Clarity, #7 Dense, #4 Motion | Badge Semantic 5종, Command Palette ⌘K, kbd 스타일, 아이콘 배경 없음 원칙 |
| S7FE5 (P0 리디자인 — Create) | #2 Tokens, #3 Symmetry, #5 Accessible | create/ui.tsx 전면 토큰 전환, outline:none 제거, 라이트 모드 검증 |
| S7FE6 (P1 리디자인) | #2 Tokens, #3 Symmetry, #6 Korean | jobs/hire 토큰 전환, Pretendard 적용, css/create.css 마이그레이션 |
| S7FE7 (P2 리디자인) | #7 Dense, #1 Clarity, #3 Symmetry | CSS 파일군 잔여 토큰 마이그레이션, Skeleton/Pagination 구축 |
| S7FE8 (Motion 시스템) | #4 Motion, #5 Accessible, #1 Clarity | 5단 duration 전역 적용, spring ease 팝업, reduced-motion 전역 |
| S7TS1 (A11y 감사) | #5 Accessible, #3 Symmetry, #1 Clarity | WCAG AA 전수 대비율 검증, focus ring 커버리지 감사, ARIA landmark 감사 |
| S7DC1 (DESIGN.md v2.0) | 전체 7개 | 본 문서(S7DS3_principles.md)의 내용을 DESIGN.md 최상단에 통합 |

---

## 10. 자가 검증 체크리스트

디자인 결정을 내릴 때 아래 체크리스트로 자가 감사:

```
[ ] 원칙 1 (Clarity First)
    → 이 색상/스타일은 단 하나의 명확한 의미를 전달하는가?
    → Accent 색이 버튼/링크/포커스 외 용도로 사용되고 있지 않은가?

[ ] 원칙 2 (Tokens Are Truth)
    → 원시 색상값(HEX, rgba), 원시 크기값(px, rem 직접값)이 코드에 없는가?
    → 필요한 토큰이 없다면 먼저 토큰을 추가했는가?

[ ] 원칙 3 (Dark–Light Symmetry)
    → 새 시맨틱 토큰을 .dark와 .light 양쪽에 정의했는가?
    → 라이트 모드로 전환하여 시각 확인을 했는가?

[ ] 원칙 4 (Motion Tells Direction)
    → 이 애니메이션이 사용자에게 방향(어디서 왔고 어디로 가는지)을 전달하는가?
    → prefers-reduced-motion 분기 처리를 했는가?

[ ] 원칙 5 (Accessible by Default)
    → Tab 키만으로 이 인터랙션을 완료할 수 있는가?
    → 텍스트와 배경의 대비율이 4.5:1 이상인가?
    → 필요한 ARIA 속성이 있는가?

[ ] 원칙 6 (Korean First Citizen)
    → Pretendard 폰트를 사용하고 있는가?
    → word-break: keep-all 이 적용되어 있는가?
    → 한국어 텍스트 3줄 이상에서 가독성을 확인했는가?

[ ] 원칙 7 (Dense but Breathable)
    → 모든 간격이 8pt 배수인가?
    → 이 페이지의 max-width가 콘텐츠 유형에 맞는 값인가?
    → Elevation shadow 레벨이 공간 위계를 올바르게 반영하는가?
```

---

## 11. S7DS1 문제점 35건 원칙 귀속 매핑

| 이슈 # | 영향도 | 귀속 원칙 |
|--------|:-----:|----------|
| 1 | High | #2 Tokens Are Truth |
| 2 | High | #1 Clarity First |
| 3 | High | #5 Accessible by Default |
| 4 | High | #2 Tokens Are Truth |
| 5 | High | #2 Tokens Are Truth |
| 6 | High | #3 Dark–Light Symmetry |
| 7 | High | #2 Tokens, #3 Symmetry |
| 8 | High | #7 Dense but Breathable |
| 9 | High | #5 Accessible by Default |
| 10 | High | #3 Dark–Light Symmetry |
| 11 | Med | #7 Dense but Breathable |
| 12 | Med | #5 Accessible by Default |
| 13 | Med | #2 Tokens Are Truth |
| 14 | Med | #1 Clarity First |
| 15 | Med | #2 Tokens Are Truth |
| 16 | Med | #2 Tokens Are Truth |
| 17 | Med | #6 Korean First Citizen |
| 18 | Med | #6 Korean First Citizen |
| 19 | Med | #6 Korean First Citizen |
| 20 | Med | #4 Motion Tells Direction |
| 21 | Med | #3 Dark–Light Symmetry |
| 22 | Low | #2 Tokens Are Truth |
| 23 | Low | #2 Tokens Are Truth |
| 24 | Med | #7 Dense but Breathable |
| 25 | Med | #7 Dense but Breathable |
| 26 | Med | #4 Motion Tells Direction |
| 27 | Med | #5 Accessible by Default |
| 28 | Med | #4 Motion Tells Direction |
| 29 | Low | #7 Dense but Breathable |
| 30 | Med | #5 Accessible by Default |
| 31 | Low | #7 Dense but Breathable |
| 32 | Med | #1 Clarity First |
| 33 | Low | #3 Dark–Light Symmetry |
| 34 | Low | #6 Korean First Citizen |
| 35 | Med | #2 Tokens Are Truth |

**원칙별 이슈 귀속 수:**
| 원칙 | High 이슈 수 | Med 이슈 수 | Low 이슈 수 | 합계 |
|------|:-----------:|:-----------:|:-----------:|:----:|
| #1 Clarity First | 1 | 3 | 0 | 4 |
| #2 Tokens Are Truth | 5 | 5 | 3 | 13 |
| #3 Dark–Light Symmetry | 2 | 2 | 1 | 5 |
| #4 Motion Tells Direction | 0 | 3 | 0 | 3 |
| #5 Accessible by Default | 2 | 4 | 0 | 6 |
| #6 Korean First Citizen | 0 | 3 | 1 | 4 |
| #7 Dense but Breathable | 1 | 5 | 1 | 7 |

> **#2 Tokens Are Truth (13건)**와 **#7 Dense but Breathable (7건)**가 가장 많은 이슈를 포괄.
> S7 작업의 절반 이상이 토큰 시스템 정착에 집중되어야 함을 수치로 확인.

---

## 12. S7DS2 채택 25개 태그 원칙 귀속 매핑

| 태그 | 원칙 |
|------|------|
| [COLOR-OKLCH] | #2 Tokens Are Truth |
| [COLOR-NEUTRAL-11] | #2 Tokens Are Truth |
| [COLOR-TOKEN-PAIR] | #2 Tokens, #3 Dark–Light Symmetry |
| [COLOR-ACCENT-INDIGO] | #1 Clarity First, #2 Tokens |
| [COLOR-ACCENT-RULE] | #1 Clarity First |
| [COLOR-SEMANTIC-4] | #1 Clarity First, #2 Tokens |
| [FONT-INTER] | #6 Korean First Citizen |
| [FONT-PRETENDARD] | #6 Korean First Citizen |
| [FONT-SCALE-9] | #6 Korean First Citizen, #7 Dense |
| [FONT-LETTERSPACING] | #6 Korean First Citizen |
| [SPACING-8PT] | #7 Dense but Breathable |
| [SPACING-10STEP] | #7 Dense but Breathable |
| [SHADOW-4LEVEL] | #7 Dense but Breathable |
| [MOTION-5STEP] | #4 Motion Tells Direction |
| [MOTION-4EASE] | #4 Motion Tells Direction |
| [MOTION-SPRING] | #4 Motion Tells Direction |
| [MOTION-REDUCED] | #4 Motion, #5 Accessible by Default |
| [COMP-COMMAND-PALETTE] | #1 Clarity First, #4 Motion |
| [COMP-KBD] | #1 Clarity First |
| [COMP-TOAST] | #4 Motion Tells Direction |
| [COMP-FOCUS] | #5 Accessible by Default, #3 Symmetry |
| [COMP-INPUT-STRIPE] | #5 Accessible, #7 Dense |
| [COMP-MODAL-MOTION] | #4 Motion Tells Direction |
| [COMP-CONTEXT-BLUR] | #7 Dense but Breathable, #4 Motion |
| [LAYOUT-CONTAINER] | #7 Dense but Breathable |

---

*리포트 종료 — S7DS3 원칙 7개 확정. 이 문서는 S7 모든 Task의 디자인 판단 기준으로 활용됩니다.*
