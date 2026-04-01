# Verification Instruction - S4DS1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S4DS1

## Task Name
반응형 QA + 접근성 검수

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Design/docs/qa/responsive-report.md` 존재
- [ ] `Process/S4_개발_마무리/Design/docs/qa/accessibility-report.md` 존재

### 2. 반응형 보고서 검증 (`responsive-report.md`)
- [ ] 검증 대상 뷰포트 명시 (375px, 768px, 1280px 최소 3개)
- [ ] 검증 대상 페이지 명시 (`/business`, `/mypage`, `/marketplace`)
- [ ] 페이지 × 뷰포트 매트릭스 테이블 존재
- [ ] 각 셀에 통과/실패/이슈 결과 기재
- [ ] 발견된 이슈 목록 존재 (없으면 "이슈 없음" 명시)

### 3. 접근성 보고서 검증 (`accessibility-report.md`)
- [ ] WCAG 2.1 AA 체크리스트 포함
- [ ] **색상 대비** 검증 결과 포함 (4.5:1 기준)
- [ ] **키보드 네비게이션** 검증 결과 포함
  - Tab 키 이동 가능 여부
  - 포커스 표시 여부
  - 모달 포커스 트랩 여부
- [ ] **스크린리더** 검증 결과 포함
  - `alt` 속성 존재 여부
  - `aria-label` 존재 여부
  - 폼 `label` 연결 여부
- [ ] **구조적 마크업** 검증 결과 포함
  - 헤딩 계층 구조 확인
- [ ] 이슈 목록이 심각도(Critical/Major/Minor)로 분류됨
- [ ] Critical 이슈가 0개이거나 조치 계획이 명시됨

### 4. 문서 품질 검증
- [ ] 마크다운 형식 문법 오류 없음
- [ ] 결과 항목이 Pass/Fail/N/A 명확히 표시됨

### 5. 통합 검증
- [ ] S4FE1, S4FE2, S4FE3 페이지가 모두 검증 대상에 포함됨

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Design/docs/qa/"

# 뷰포트 3개 포함 확인
grep -n "375\|768\|1280" \
  "Process/S4_개발_마무리/Design/docs/qa/responsive-report.md"

# WCAG 항목 포함 확인
grep -n "WCAG\|대비\|키보드\|스크린리더\|aria" \
  "Process/S4_개발_마무리/Design/docs/qa/accessibility-report.md"

# 심각도 분류 확인
grep -n "Critical\|Major\|Minor" \
  "Process/S4_개발_마무리/Design/docs/qa/accessibility-report.md"
```

## Expected Results
- 2개 파일이 모두 존재한다
- 반응형 보고서에 3개 뷰포트 × 3개 페이지 매트릭스가 있다
- 접근성 보고서에 WCAG 2.1 AA 기준 체크리스트가 있다
- 이슈가 심각도별로 분류되어 있다
- Critical 이슈가 0개이거나 조치 계획이 명시된다

## Verification Agent
qa-specialist

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 반응형 매트릭스 완성 확인 (3페이지 × 3뷰포트)
- [ ] WCAG 2.1 AA 체크리스트 완성 확인
- [ ] Critical 이슈 0개 또는 조치 계획 명시
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 문서가 `S4_개발_마무리/Design/`에 저장되었는가?
- [ ] Design Area는 Production 자동 복사 대상이 아님을 확인
