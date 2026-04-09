# S5FE12: 디자인 Quick Win 6개 적용 (CSS 변수 튜닝)

## Task 정보
- **Task ID**: S5FE12
- **Task Name**: 디자인 Quick Win 6개 적용 (CSS 변수 튜닝)
- **Stage**: S5 (디자인 혁신)
- **Area**: FE (Frontend)
- **Dependencies**: S5FE1 (디자인 시스템 구현)

## Task 목표

벤치마크 분석(Vercel/Linear/Stripe/Notion/Supabase) 결과에 기반하여, globals.css CSS 변수 수정만으로 즉시 세련도를 높이는 Quick Win 6개를 적용한다. 컴포넌트 재작성 없이 토큰/변수 레벨에서만 작업한다.

## Quick Win 목록

### QW-1: 다크 모드 보더 — 반투명 화이트로 전환
- 현재: `--border: var(--neutral-700)` (솔리드 #334155)
- 변경: `--border: 255 255 255 / 0.08` (Linear 스타일 반투명)
- 추가: `--border-subtle`, `--border-strong` 단계 토큰
- 라이트 모드는 현행 유지

### QW-2: Hero 타이포그래피 letter-spacing 픽셀 스케일
- 현재: `letter-spacing: -0.02em` (상대값 하나)
- 변경: 유틸 클래스 추가 — `.text-hero(-1.5px)`, `.text-display(-1.0px)`, `.text-h1(-0.6px)`, `.text-h2(-0.3px)`

### QW-3: 라이트 모드 카드 그림자 — Notion 5-layer 방식
- 현재: 단일 레이어 `rgb(0 0 0 / 0.1)`
- 변경: 4-5 레이어 누적 (max opacity 0.04~0.05 per layer)

### QW-4: 다크 모드 카드 그림자 불투명도 낮추기
- 현재: 0.4~0.7
- 변경: 0.25~0.4

### QW-5: 카드 호버 퍼플 글로우 확장
- 현재: CTA 버튼에만 퍼플 글로우
- 변경: `.card-hover:hover` 유틸 클래스 추가 (퍼플 보더 + 글로우)

### QW-6: Pretendard OpenType Feature 활성화
- 현재: 없음
- 변경: `font-feature-settings: "liga" 1, "kern" 1` + `.tabular-nums` 클래스

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/globals.css` | CSS 변수 수정 + 유틸 클래스 추가 |

## 수용 기준

1. 다크 모드 보더가 반투명 화이트로 표시됨
2. 라이트 카드 그림자가 다층 레이어로 자연스러움
3. 다크 카드 그림자가 이전보다 가벼움
4. tsc --noEmit 통과
5. 기존 페이지 레이아웃 깨지지 않음
