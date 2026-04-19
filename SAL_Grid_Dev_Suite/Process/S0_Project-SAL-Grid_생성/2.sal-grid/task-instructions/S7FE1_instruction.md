# S7FE1: Tailwind + globals.css 재구성

## Task 정보
- **Task ID**: S7FE1
- **Stage**: S7 / **Area**: FE
- **Dependencies**: S7DS5
- **Task Agent**: `frontend-developer-core`

## Task 목표

S7DS5의 Semantic 토큰을 실제 코드(globals.css + tailwind.config.ts)로 반영한다. 기존 컴포넌트가 깨지지 않도록 기존 변수명 alias를 유지한다.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/globals.css` | `:root` + `.dark` 블록에 Semantic 토큰 주입 (기존 변수 alias 유지) |
| `tailwind.config.ts` | `theme.extend.colors`를 토큰 기반으로 리매핑 (bg, fg, border, ring 유틸 추가) |
| `DESIGN.md` | v2.0으로 버전 업 (토큰 섹션 덮어쓰기) |

## 구현 규칙

- CSS 변수 값은 `oklch(...)` 원시 값 또는 `rgb(...)` 폴백 허용
- Tailwind border는 `<alpha-value>` 플레이스홀더 없이 정적 값으로 (S5FE12에서 이슈 발생한 회피 패턴 재사용)
- `data-theme` 속성 방식과 `.dark` 클래스 방식 모두 지원

## 하위 호환

- 기존 토큰명(`--bg-primary`, `--text-primary` 등)은 새 Semantic 토큰으로 aliasing
- Tailwind utility (`bg-white`, `text-gray-*` 등) 기본값 제거 금지

## 성공 기준

- `npx tsc --noEmit --skipLibCheck` 통과
- `npm run build` 성공
- 다크/라이트 토글 시 깨지는 페이지 0건 (스크린샷 확인)
