# S11QA2: 전체 모바일 회귀 검증

## Task 정보
- **Task ID**: S11QA2
- **Stage**: S11, **Area**: TS
- **Dependencies**: S11FE1, S11FE2, S11FE3, S11FE4, S11FE5, S11FE6, S11FE7, S11FE8, S11FE9, S11FE10, S11FE11, S11FE12
- **Agent**: `test-runner-core`

## Task 목표

S11FE1~12 적용 후 `scripts/mobile-audit.mjs`를 재실행하여 KPI 4종을 재측정하고, 주요 페이지에 Lighthouse mobile 점수를 측정한다.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `scripts/mobile-audit-final.json` | 최종 KPI 측정 결과 |
| `scripts/screenshots/mobile-audit-final/*.png` | 최종 스크린샷 |
| `scripts/mobile-lighthouse-report.html` | Lighthouse 리포트 |

## 완료 기준

- 가로 스크롤 발생 페이지 = 0 (예외 페이지는 화이트리스트에 사유 명시)
- 터치 타겟 <44px = 0%
- 폰트 <12px 본문 = 0
- Lighthouse mobile ≥80 (home, skills, jobs, community, mypage)
- 베이스라인(S11QA1) vs 최종 비교 표 작성
