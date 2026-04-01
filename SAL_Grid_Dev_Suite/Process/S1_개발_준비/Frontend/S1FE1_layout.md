# S1FE1 — 공통 레이아웃 + 사이드바 컴포넌트

**Task ID**: S1FE1
**Stage**: S1 개발 준비
**Area**: Frontend
**Date**: 2026-03-31

---

## 생성된 파일

### components/common/sidebar.tsx
- `'use client'` — Next.js Link + usePathname 사용
- 12개 NAV_ITEMS (dashboard → help)
- 활성 항목: `bg-primary/10 text-primary font-medium`
- 비활성 항목: `text-text-secondary hover:bg-surface-hover`
- `hidden md:flex` — 데스크탑(768px+) 전용
- 상단 "MCW" 로고, `w-sidebar`(260px), `h-header`(60px) 정렬
- `clsx` 조건부 클래스 사용

### components/common/header.tsx
- `'use client'`
- 좌측: `<MobileNav />` (모바일 햄버거) + 타이틀 "My Chatbot World"
- 우측: `<ThemeToggle />` + 유저 아바타 플레이스홀더 (8x8 circle, "U")
- `h-header` 고정 높이, `border-b border-border bg-surface`
- `sticky top-0 z-30`

### components/common/mobile-nav.tsx
- `'use client'`, `useState` open/close
- 햄버거 버튼(☰) → 오버레이(`bg-black/50`) + 좌측 슬라이드 드로어
- 드로어 내 동일 12개 NAV_ITEMS
- 링크 클릭 시 드로어 자동 닫힘 (`close()`)
- `translate-x-0` / `-translate-x-full` CSS transition

## 수정된 파일

### app/layout.tsx
- Sidebar + Header import 추가
- 앱 셸 구조:
  ```
  <div class="flex h-screen overflow-hidden">
    <Sidebar />                          ← 데스크탑 사이드바
    <div class="flex flex-1 flex-col">
      <Header />                         ← 헤더 (sticky)
      <main class="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  </div>
  ```

## 디자인 토큰 사용

| 토큰 | 용도 |
|------|------|
| `bg-surface` | 사이드바/헤더 배경 |
| `border-border` | 구분선 |
| `text-text-primary/secondary` | 텍스트 색상 |
| `bg-primary/10`, `text-primary` | 활성 메뉴 강조 |
| `hover:bg-surface-hover` | 호버 상태 |
| `w-sidebar` (260px) | 사이드바 너비 |
| `h-header` (60px) | 헤더 높이 |

## 반응형

- `md` 브레이크포인트(768px) 기준
- `< md`: 사이드바 숨김, 헤더에 햄버거 + MobileNav 드로어
- `>= md`: 고정 사이드바 표시, 햄버거 숨김
