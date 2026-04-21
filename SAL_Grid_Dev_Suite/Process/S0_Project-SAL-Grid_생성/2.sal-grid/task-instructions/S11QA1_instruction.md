# S11QA1: 모바일 뷰포트 감사 (베이스라인)

## Task 정보
- **Task ID**: S11QA1
- **Task Name**: 모바일 뷰포트 감사 (베이스라인)
- **Stage**: S11 (모바일 반응형 최적화)
- **Area**: TS
- **Dependencies**: —
- **Agent**: `test-runner-core`

## Task 목표

48개 페이지를 390px(iPhone 12/13)와 768px(태블릿) 뷰포트에서 Playwright로 캡처하고, MBO의 KPI 4종을 베이스라인으로 측정한다.

## 측정 KPI

1. 가로 스크롤 발생 페이지 (`scrollWidth > viewportWidth`)
2. 터치 타겟 <44px 요소 개수 (버튼·링크·입력)
3. 폰트 <12px 본문 요소 개수
4. 페이지별 모바일 스크린샷 (screenshots/mobile-audit/)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `scripts/mobile-audit.mjs` | Playwright 기반 전 페이지 감사 스크립트 |
| `scripts/screenshots/mobile-audit/*.png` | 페이지별 390px/768px 스크린샷 |
| `scripts/mobile-audit-baseline.json` | KPI 베이스라인 JSON |

## 완료 기준

- 48개 페이지 전부 캡처 완료 (로그인 필요 페이지는 auth 주입)
- KPI 4종 수치 JSON으로 저장
- 수치를 S11FE1~12의 수정 대상 선정에 활용
