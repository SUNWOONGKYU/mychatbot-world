# S7FE9: 라이트 모드 가독성 강화 (WCAG AA 충족)

## Task 정보
- **Task ID**: S7FE9
- **Task Name**: 라이트 모드 가독성 강화 (WCAG AA 충족)
- **Stage**: S7 (디자인 시스템 & 성능)
- **Area**: FE (Frontend)
- **Dependencies**: S7FE1(토큰 시스템), S7DS5(Semantic Tokens)

## Task 목표

`/skills`, `/jobs`, `/community` 페이지의 라이트 모드에서 "잘 안 보여" 피드백(PO) 대응.
WCAG AA 기준(본문 4.5:1, 보조 3:1) 충족을 위한 색상 토큰 재조정 + 하드코딩 색상 제거.

## 배경

PO 피드백 (2026-04-21): "스킬 잡 커뮤니티 라이트 모드에서 가독성을 더 개선 — 잘 안 보여"

### 진단 결과
1. **`.light` 시맨틱 토큰 자체의 대비 부족**
   - `--text-muted` = neutral-400(#94A3B8) → 흰 배경 위 2.85:1 (AA 실패)
   - `--text-secondary-rgb` = neutral-500(#64748B) → 4.5:1 (경계선)
   - `--border` = neutral-200(#E2E8F0) → 거의 불가시

2. **`/jobs` 하드코딩 `text-white`/`bg-white/[0.06]`**
   - 봇/일감 탭 정렬 드롭다운 → 라이트 모드에서 흰 배경에 흰 텍스트
   - 빈 상태("일감 찾을 수 없습니다") 동일 이슈

3. **`/community` 페이지네이션/배지**
   - 현재 페이지: `#22d3ee` (밝은 사이안) + 15% 배경 → 흰 배경 위 불가시
   - 마당 배지: `${color}22` (13% opacity) → 너무 연함

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/globals.css` | `.light` 토큰 strengthen — secondary: n-500→n-600, muted: n-400→n-500, border: n-200→n-300, border-subtle: n-100→n-200, border-strong: n-300→n-400, border-primary: primary-300→primary-400 |
| `app/jobs/page.tsx` | 봇 탭 + 일감 탭 정렬 드롭다운 2곳 하드코딩 `text-white` → 토큰 기반. 빈 상태 텍스트 토큰화 |
| `app/community/page.tsx` | 페이지네이션 현재 페이지 cyan → `var(--color-primary)` + fontWeight 700. 마당 배지 opacity 13%→18% + 30% 보더 추가 |

## 기대 효과

- `/skills` 카드 설명·메타 자동 개선 (토큰 연동)
- `/jobs` 봇/일감 설명·메타 자동 개선 (토큰 연동) + 드롭다운 가시 확보
- `/community` 봇 정보·미리보기·푸터 카운트 자동 개선 + 페이지네이션/배지 가시 확보

## WCAG 대비비 목표

| 토큰 | BEFORE | AFTER | AA 기준 |
|------|--------|-------|---------|
| `--text-muted` on #FFF | 2.85:1 ✗ | 4.54:1 ✓ | 4.5:1 |
| `--text-secondary-rgb` on #FFF | 4.54:1 ⚠ | 7.23:1 ✓ | 4.5:1 |
| `--border` on #FFF | 1.30:1 | 1.95:1 | 3:1 (UI) |

## 범위 외

- `/jobs/search`: 의도적 다크 테마(`bg-[#0f0c29]` 전역) — 라이트 모드에서도 동일 동작, 별개 재설계 필요
- 다크 모드 토큰: 무변경
