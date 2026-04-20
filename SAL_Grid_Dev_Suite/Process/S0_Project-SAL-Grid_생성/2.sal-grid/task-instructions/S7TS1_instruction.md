# S7TS1: 접근성 검증

## Task 정보
- **Task ID**: S7TS1
- **Stage**: S7 / **Area**: TS
- **Dependencies**: S7FE5, S7FE6, S7FE7
- **Task Agent**: `test-runner-core`

## Task 목표

S7 리디자인 대상 전 페이지의 접근성·성능을 자동+수동 검증한다.

## 검증 도구

| 도구 | 범위 | 목표 |
|------|------|------|
| axe-core | 모든 페이지 | critical/serious 위반 0건 |
| Lighthouse | Performance, A11y, Best Practices, SEO | A11y 95+, Performance 85+, BP 95+ |
| Playwright 키보드 테스트 | 모든 인터랙티브 요소 | Tab 순서, focus trap, ESC |
| 수동 스크린리더 | 주요 플로우 3개 | 읽기 순서 자연스러움 |

## 산출물

| 파일 | 내용 |
|------|------|
| `Process/S0_*/2.sal-grid/task-results/S7TS1_a11y_report.md` | 페이지별 결과 표 |
| `Process/S0_*/2.sal-grid/task-results/S7TS1_lighthouse/` | Lighthouse JSON 리포트 덤프 |

## 실행 스크립트

```bash
# axe-core + Playwright
npm run test:a11y

# Lighthouse (로컬 빌드 후)
npx lighthouse http://localhost:3000/{page} --output=json
```

## 성공 기준

- 위반 0건의 페이지 20+ 확보
- 위반이 있으면 이슈 등록 + FE 팀에 재작업 요청
