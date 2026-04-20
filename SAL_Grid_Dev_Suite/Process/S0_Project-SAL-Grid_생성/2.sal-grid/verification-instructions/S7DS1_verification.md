# S7DS1 Verification

## Verification Agent: `qa-specialist`

## 검증 체크리스트

- [ ] 25+ 페이지 전수 스크린샷이 리포트에 첨부되어 있는가?
- [ ] 문제점 최소 30건 이상 식별되었는가?
- [ ] 각 문제점에 영향도(High/Med/Low) 표시가 있는가?
- [ ] Nielsen 10 Heuristics 기반 평가표가 페이지별로 있는가?
- [ ] 토큰/타이포/간격/모션/접근성 5개 축 모두 진단되었는가?
- [ ] 경쟁 벤치마크 대비 갭 스코어 표가 존재하는가?

## Test Result 필드 작성 예시

```json
{
  "unit_test": "N/A",
  "integration_test": "N/A",
  "edge_cases": "PASS — 진단 누락 페이지 없음",
  "manual_test": "PASS — 진단 리포트 검토 완료"
}
```
