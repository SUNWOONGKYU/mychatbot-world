# S7FE7 통합 리포트 — P2 보조 플로우 리디자인

**작업일:** 2026-04-20
**Task ID:** S7FE7
**담당:** frontend-developer-core (서브에이전트)
**의존성:** S7FE6 (랜딩/마케팅 페이지 완료)

---

## 1. 작업 범위 요약

S7 OKLCH Semantic 토큰 시스템을 보조 플로우 4개 영역에 전면 적용한다:
- **MyPage**: 8탭 통합 레이아웃 셸 + 개별 탭 컴포넌트
- **Admin 대시보드**: KPI 카드, 8섹션 네비게이션, DataTable
- **Jobs**: 채용공고 상세 페이지 (MatchCard, ReviewCard, 사이드바)
- **Community**: 글쓰기 폼 (Field, Textarea, 이미지 업로드)

---

## 2. 수정 파일 목록

### MyPage (5개 파일)

| 파일 | 변경 내용 |
|------|----------|
| `app/mypage/page-client.tsx` | 8탭 셸: TabNav → role="tablist"/role="tab"/aria-selected, ProfileHeader semantic tokens, SkeletonBlock, EmptyState, role="tabpanel" |
| `components/mypage/Tab2BotManage.tsx` | BotStatusBadge (state-success/warning/surface-2), BotCard→article, UrlPanel, PersonaPanel, ToolPanel aria-pressed, BotSettingsPanel fieldset |
| `components/mypage/Tab3Learning.tsx` | rgb(var(--xxx)) → var(--yyy) 전면 치환: surface-0/1/2, text-primary/secondary/tertiary, interactive-primary, state-* |
| `components/mypage/Tab5Operations.tsx` | text-text-xxx/bg-bg-xxx/border-border → var(--text-*/surface-*/border-default) 전면 치환 |
| `components/mypage/Tab7Credits.tsx` | 동일 패턴 치환 + text-accent → var(--interactive-primary) |
| `components/mypage/DeleteAccountSection.tsx` | border-border-default/text-text-xxx → semantic vars, focus:ring-error → var(--state-danger-fg) |

### Admin 대시보드 (6개 파일)

| 파일 | 변경 내용 |
|------|----------|
| `app/admin/page.tsx` | adminStyles :root 변수 블록: 하드코딩 hex → S7 Semantic 토큰 브리지 (`--admin-bg: var(--surface-0)` 등 전 변수) |
| `app/admin/layout.tsx` | background: var(--surface-0), task comment 업데이트 |
| `app/admin/components/AdminSidebar.tsx` | nav aria-label, surface-1/border-default, active/disabled/badge semantic tokens, aria-current="page" |
| `app/admin/sections/SectionBots.tsx` | STATUS_BADGE_CLASS(Tailwind) → STATUS_BADGE_STYLE(React.CSSProperties), DataTable semantic border/hover/empty |
| `app/admin/sections/SectionNotices.tsx` | task comment → S7FE7 브리지 적용 표기 (admin-* CSS 클래스 기존 유지, :root bridge 통해 S7 토큰 반영) |
| `app/admin/sections/SectionSkills.tsx` | task comment → S7FE7 브리지 적용 표기 (동일) |

### Jobs (1개 파일)

| 파일 | 변경 내용 |
|------|----------|
| `app/jobs/[id]/page.tsx` | STATUS_COLORS(Tailwind) → STATUS_STYLE(CSSProperties), DetailSkeleton aria-busy, MatchCard(surface-1/state-info-bg/interactive-primary), ReviewCard(border-subtle/surface-2), 매칭결과 섹션, 리뷰 섹션, 사이드바(지원하기 카드/정산 안내), button type="button", focus-visible |

### Community (1개 파일)

| 파일 | 변경 내용 |
|------|----------|
| `app/community/write/page.tsx` | inputStyle/selectStyle → surface-1/border-default/text-primary, 헤더 button type, 봇없음 state-warning, 에러 state-danger, 마당버튼 aria-pressed, required/aria-required, 이미지 업로드 드래그앤드롭 semantic, submit button interactive-primary |

---

## 3. S7 Semantic 토큰 적용 현황

### 구 패턴 → 신 패턴 매핑

| 구 패턴 (제거) | 신 패턴 (S7) |
|--------------|-------------|
| `rgb(var(--bg-surface))` | `var(--surface-1)` |
| `rgb(var(--bg-subtle))` | `var(--surface-2)` |
| `rgb(var(--bg-base))` | `var(--surface-0)` |
| `rgb(var(--text-muted))` | `var(--text-tertiary)` |
| `rgb(var(--color-primary))` | `var(--interactive-primary)` |
| `rgb(var(--color-error))` | `var(--state-danger-fg)` |
| `text-text-primary` | `text-[var(--text-primary)]` |
| `bg-bg-surface` | `bg-[var(--surface-1)]` |
| `border-border` | `border-[var(--border-default)]` |
| `text-accent` | `text-[var(--interactive-primary)]` |
| `#818cf8`, `#34d399` 등 하드코딩 hex | `var(--interactive-primary)`, `var(--state-success-fg)` 등 |
| `bg-violet-600`, `text-gray-900` 등 Tailwind 색상 | `var(--interactive-primary)`, `var(--text-primary)` 등 |

---

## 4. A11y 개선 사항

- `<nav aria-label="관리자 메뉴">`, `<main aria-label="마이페이지">` 등 landmark 추가
- `role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`, `aria-labelledby` 완비
- `aria-current="page"` — AdminSidebar 활성 항목
- `aria-pressed` — BotCard 도구 토글, 마당 선택 버튼
- `aria-busy="true"` — 스켈레톤/로딩 상태
- `aria-required="true"` — 필수 입력 필드
- `focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]` — 모든 인터랙티브 요소
- `role="button"` + `tabIndex={0}` + `onKeyDown` — 키보드 접근성
- `[word-break:keep-all]` — 모든 한국어 본문 및 레이블
- `aria-label` 한국어 — 이미지 제거 버튼, 업로드 영역 등

---

## 5. 비즈니스 로직 보존 확인

- Supabase fetch/API 핸들러 무변경: `fetchJob`, `fetchReviews`, `handleApply`, `loadMatches`
- 상태 관리 무변경: `useState`, `useEffect`, `useCallback` 훅 시그니처 동일
- 라우팅 무변경: `useRouter`, `useParams`, `Link` href
- 폼 제출 로직 무변경: `handleSubmit`, `handleSave`, `handleDelete` 등
- 토스트/모달 시스템 무변경: `useAdminToast`, modal open/close

---

## 6. 반응형 브레이크포인트

모든 파일에서 기존 반응형 구조 보존:
- 360px: 스택 레이아웃, 전체폭 버튼
- 768px: sm: breakpoint 활용 (MatchCard flex-row 등)
- 1024px: lg:grid-cols-3 (Jobs 상세 사이드바)
- 1920px: max-w-[1100px] 중앙 정렬

---

## 7. Admin CSS 브리지 전략

`app/admin/page.tsx`의 `adminStyles` `:root` 블록에서 하드코딩 hex를 S7 Semantic 토큰 별칭으로 교체:

```css
/* 이전 */
--admin-primary: #818cf8;
--admin-success: #34d399;

/* 이후 */
--admin-primary: var(--interactive-primary);
--admin-success: var(--state-success-fg);
```

이 방식으로 기존 `admin-btn-primary`, `admin-badge-success` 등 모든 admin CSS 클래스가 자동으로 S7 토큰을 참조한다. SectionNotices/SectionSkills는 코드 수정 없이 토큰 시스템에 편입된다.

---

## 8. 통합 검증 체크리스트

- [x] S7 Semantic 토큰 전용 사용 (primitive 직접 참조 없음)
- [x] 하드코딩 hex/rgb 제거 (--admin-* 브리지 포함)
- [x] 비즈니스 로직 무변경
- [x] 8탭 모두 유지 (탭 삭제 없음)
- [x] TypeScript 타입 에러 없음 (React.CSSProperties 사용)
- [x] A11y WCAG 2.1 AA 수준 적용
- [x] Korean word-break:keep-all 적용
- [x] focus-visible ring 전체 적용
- [x] button type="button" 명시
- [x] aria-label 한국어 작성
