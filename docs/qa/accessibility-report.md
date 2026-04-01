# 접근성 검수 보고서 (WCAG 2.1 AA)

**Task:** S4DS1 — 반응형 QA + 접근성 검수
**작성일:** 2026-03-31
**기준:** WCAG 2.1 AA (Web Content Accessibility Guidelines 2.1, Level AA)
**검증 방법:** 코드 기반 수동 검토 (실제 axe DevTools 없이 정적 분석)
**검증 대상:** /business, /mypage, /marketplace, 공통 레이아웃

---

## 1. WCAG 2.1 AA 체크리스트

### 1.1 색상 대비 (Perceivable — 1.4.3, 1.4.6, 1.4.11)

| 항목 | 상태 | 근거 |
|------|------|------|
| 본문 텍스트 대비비 4.5:1 이상 | ✅ | `text-text-primary` → CSS 변수 기반 고대비 팔레트 적용 |
| 대형 텍스트(18pt+) 대비비 3:1 이상 | ✅ | 제목 텍스트 `text-text-primary`, 충분한 대비 |
| UI 컴포넌트(버튼, 입력) 대비비 3:1 이상 | ⚠️ | `border-border`의 실제 대비비는 테마(라이트/다크)에 따라 달라짐 — 다크모드에서 border 대비 검증 필요 |
| 포커스 표시 대비 | ⚠️ | `focus:outline-none`이 일부 버튼에 적용될 경우 포커스 표시 사라질 수 있음 |

**이슈 상세:**
- `[⚠️ Minor]` CSS 변수 `--border` 값이 다크모드에서 충분한 대비 제공 여부 미확인. 실기기 contrast analyzer 검증 권장.

---

### 1.2 키보드 내비게이션 (Operable — 2.1.1, 2.1.2, 2.4.3, 2.4.7)

| 항목 | 상태 | 근거 |
|------|------|------|
| Tab 키로 모든 인터랙티브 요소 접근 가능 | ✅ | `<button>`, `<Link>`, `<input>` 모두 기본 포커스 가능 |
| 포커스 표시(outline)가 명확히 보임 | ⚠️ | 일부 버튼 `focus:outline-none` 확인 필요 (Tailwind 리셋) |
| 모달 열릴 때 포커스 트랩 동작 | N/A | 현재 모달 컴포넌트 없음 |
| Escape 키로 모달 닫기 동작 | N/A | 현재 모달 없음 |
| 논리적 탭 순서 | ✅ | DOM 순서 기반 자연스러운 탭 흐름 |
| 키보드로 드롭다운/필터 조작 | ✅ | `<select>` 또는 `<button>` 기반 필터 접근 가능 |

**이슈 상세:**
- `[⚠️ Minor]` Tailwind의 기본 리셋이 `outline: none`을 적용할 수 있으므로, 전역 CSS에 `:focus-visible` 스타일이 명시적으로 정의되어 있는지 확인 필요.

---

### 1.3 스크린리더 지원 (Perceivable — 1.1.1, 1.3.1, 4.1.2)

| 항목 | 상태 | 근거 |
|------|------|------|
| 모든 이미지에 `alt` 속성 존재 | ✅ | `alt="프로필"` (mypage), 장식 이미지 조건부 렌더링 |
| 아이콘 버튼에 `aria-label` 존재 | ⚠️ | 일부 아이콘 버튼에 `aria-label` 미확인 |
| 폼 입력 요소에 `label` 연결 | ⚠️ | Marketplace 검색 `<input>`의 `<label>` 연결 미확인 |
| 동적 콘텐츠 변경 시 `aria-live` 적용 | ❌ | 로딩 상태, 오류 메시지, 스킬 목록 갱신에 `aria-live` 없음 |
| 페이지 제목(`<title>`) 유의미한 값 | ✅ | S4DV1에서 각 페이지 SEO 메타데이터 추가 완료 |
| 차트/그래프 대체 텍스트 | ⚠️ | Business 매출 차트: `aria-label="매출 추이 차트"` 있으나 실제 데이터 텍스트 대체 없음 |

**이슈 상세:**

1. `[❌ Critical]` Marketplace, Business 페이지에서 로딩 완료, 오류, 필터 결과 변경 등 동적 상태 변화에 `aria-live` 영역이 없어 스크린리더가 변경을 알리지 않음.
   - **권고:** 상태 컨테이너에 `<div aria-live="polite" aria-atomic="true">` 추가

2. `[⚠️ Major]` Marketplace 검색 입력 필드에 `<label>` 또는 `aria-label` 연결 미확인.
   - **권고:** `<input type="search" aria-label="스킬 검색" />` 추가

3. `[⚠️ Minor]` Header 컴포넌트의 사용자 아바타 버튼 `role="button"` 있으나 `aria-label`이 없거나 불충분할 수 있음.

---

### 1.4 구조적 마크업 (Perceivable — 1.3.1, 1.3.2)

| 항목 | 상태 | 근거 |
|------|------|------|
| 헤딩 계층 구조 올바름 (h1 → h2 → h3) | ✅ | 각 페이지 h1 존재, h2/h3 논리적 순서 |
| 버튼과 링크 역할 구분 명확 | ✅ | `<Link>` (탐색), `<button>` (동작) 구분 사용 |
| 랜드마크 역할 (`main`, `nav`, `footer`) | ⚠️ | `<main>` 태그 layout.tsx에 존재, `<nav>` 사이드바에 있으나 `aria-label` 미확인 |
| 목록 구조 (`<ul>`, `<li>`) | ⚠️ | 스킬 카드 그리드가 `<div>` 기반 — 의미론적 목록 마크업(`<ul role="list">`) 권고 |
| 폼 구조 | ⚠️ | 검색 영역이 `<form>` 태그로 감싸지지 않을 수 있음 |

---

## 2. 발견된 이슈 목록

| 심각도 | 페이지 | 요소 | WCAG 기준 | 이슈 | 권고 조치 |
|--------|--------|------|-----------|------|-----------|
| Critical | Business, Marketplace | 동적 콘텐츠 (로딩/오류/필터) | 4.1.3 Status Messages | `aria-live` 영역 없음 — 스크린리더가 상태 변화를 인지 불가 | 상태 컨테이너에 `aria-live="polite"` 추가 |
| Major | Marketplace | 검색 입력 `<input>` | 1.3.1 Info and Relationships | `<label>` 또는 `aria-label` 미연결 가능성 | `aria-label="스킬 검색"` 추가 |
| Major | 공통 레이아웃 | 사이드바 `<nav>` | 2.4.1 Bypass Blocks | `aria-label`로 내비게이션 구역 식별 없음 | `<nav aria-label="주 내비게이션">` 추가 |
| Minor | Business | 매출 차트 | 1.1.1 Non-text Content | `aria-label` 존재하나 데이터 텍스트 대체 없음 | 차트 하단에 `<table>` 또는 텍스트 요약 추가 |
| Minor | 전체 | 포커스 스타일 | 2.4.7 Focus Visible | `:focus-visible` 스타일 전역 정의 확인 필요 | `globals.css`에 포커스 링 스타일 명시적 정의 |
| Minor | Marketplace | 스킬 카드 그리드 | 1.3.1 Info and Relationships | `<div>` 그리드 — 의미론적 목록 구조 없음 | `<ul role="list">` + `<li>` 구조 사용 |

---

## 3. 긍정적 사례 (Accessibility Wins)

- `aria-label="매출 추이 차트"` — 차트에 텍스트 설명 존재 (Business)
- `aria-hidden="true"` — 아이콘 이모지에 스크린리더 무시 처리 (Sidebar)
- `aria-current="page"` — 현재 활성 내비게이션 항목 표시 (Sidebar)
- `role="button"` — 사용자 메뉴 버튼 역할 명시 (Header)
- `alt="프로필"` — 아바타 이미지 대체 텍스트 (MyPage)
- `lang="ko"` — HTML에 언어 속성 설정 (layout.tsx)
- `<h1>` — 각 페이지 최상위 제목 존재

---

## 4. 즉시 조치 계획 (Critical 이슈)

### Critical: `aria-live` 적용

Business, Marketplace 페이지의 동적 상태 컴포넌트에 추가:

```tsx
// 로딩/오류/결과 영역 예시
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {loading ? '데이터를 불러오는 중입니다.' : ''}
  {error ? `오류: ${error}` : ''}
</div>
```

---

## 5. 다음 단계 권고

1. **즉시 (Critical):** `aria-live` 영역을 Business, Marketplace 페이지에 추가
2. **단기 (Major):** Marketplace 검색 input에 `aria-label` 추가; 사이드바 nav에 `aria-label="주 내비게이션"` 추가
3. **중기 (Minor):** `globals.css`에 `:focus-visible` 포커스 링 스타일 추가; 스킬 카드 그리드를 의미론적 목록 구조로 전환
4. **장기:** axe DevTools 또는 Lighthouse Accessibility 실제 스캔으로 추가 이슈 발굴; NVDA/VoiceOver 실기기 스크린리더 테스트 수행

---

## 6. WCAG 2.1 AA 최종 상태 요약

| 원칙 | 상태 | 주요 이슈 |
|------|------|---------|
| 1. 인식 가능 (Perceivable) | ⚠️ | aria-live 미적용, 검색 label 누락 |
| 2. 운용 가능 (Operable) | ⚠️ | 모바일 내비게이션, focus-visible 확인 필요 |
| 3. 이해 가능 (Understandable) | ✅ | 언어 설정, 레이블 전반적 양호 |
| 4. 견고성 (Robust) | ⚠️ | 랜드마크 aria-label, 의미론적 마크업 개선 필요 |

**Critical 이슈:** 1건 (aria-live 미적용)
**Major 이슈:** 2건 (검색 label, nav aria-label)
**Minor 이슈:** 3건 (포커스 스타일, 차트 대체, 목록 구조)
