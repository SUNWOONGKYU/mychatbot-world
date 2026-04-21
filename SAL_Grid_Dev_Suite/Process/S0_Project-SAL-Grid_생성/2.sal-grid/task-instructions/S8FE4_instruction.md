# S8FE4: 마이페이지 관리자 링크 사이드바 이동

## Task 정보
- **Task ID**: S8FE4
- **Stage**: S8
- **Area**: FE
- **Dependencies**: S8FE3

## Task 목표

`/mypage` 하단 중앙에 있던 관리자 링크를 사이드바(TabNav) 하단으로 이동하여 UX 일관성을 확보한다.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/mypage/page-client.tsx` | TabNav에 `isAdmin` prop 추가, 사이드바 NAV_ITEMS 뒤에 조건부 구분선+링크, 기존 하단 중앙 블록 삭제 |

## 요구사항

- `isAdmin?: boolean` optional prop (기본값 false)
- `<TabNav ... isAdmin={!!profile?.is_admin} />`
- 구분선 + "🔒 관리자 대시보드" 링크(`aria-label="관리자 대시보드 이동"`)
- 비관리자 계정은 링크 비노출
- 네비 4대 메뉴(Birth/Skills/Jobs/Community) 유지 — 메모리 규칙 준수
