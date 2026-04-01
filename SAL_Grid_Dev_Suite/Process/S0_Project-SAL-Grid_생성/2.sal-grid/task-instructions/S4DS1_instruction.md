# Task Instruction - S4DS1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

### Stage 명칭
- **S4** = 개발 3차 (Advanced Development)

### Area 명칭
- **DS** = Design (UI/UX 디자인)

---

# Task Instruction - S4DS1

## Task ID
S4DS1

## Task Name
반응형 QA + 접근성 검수

## Task Goal
S4에서 구현된 모든 페이지(Business, MyPage, Marketplace)에 대해 모바일/태블릿/데스크톱 반응형 레이아웃을 검증하고, WCAG 2.1 AA 기준의 접근성 검수를 수행한다. 발견된 이슈를 보고서로 작성한다.

## Prerequisites (Dependencies)
- S4FE1 — Business 페이지
- S4FE2 — MyPage 페이지
- S4FE3 — Marketplace 페이지

## Specific Instructions

### 1. 반응형 검증 (`docs/qa/responsive-report.md`)
- 검증 대상 뷰포트:
  - 모바일: 375px (iPhone SE), 390px (iPhone 14)
  - 태블릿: 768px (iPad), 1024px (iPad Pro)
  - 데스크톱: 1280px, 1440px
- 각 페이지 × 뷰포트 매트릭스 체크리스트:

  | 페이지 | 375px | 768px | 1280px |
  |--------|-------|-------|--------|
  | /business | - | - | - |
  | /mypage | - | - | - |
  | /marketplace | - | - | - |

- 검증 항목:
  - 레이아웃 깨짐 없음 (가로 스크롤 발생 여부)
  - 터치 영역 최소 44x44px 준수
  - 텍스트 잘림(text-overflow) 없음
  - 이미지 비율 유지
  - 테이블/카드 뷰 모바일 전환 확인
  - 네비게이션 모바일 메뉴 동작
- 이슈 발견 시 스크린샷 플레이스홀더 + 설명 기재

### 2. 접근성 검수 (`docs/qa/accessibility-report.md`)
- WCAG 2.1 AA 기준 체크리스트:

  **색상 대비:**
  - [ ] 본문 텍스트 대비비 4.5:1 이상
  - [ ] 대형 텍스트(18pt+) 대비비 3:1 이상
  - [ ] UI 컴포넌트 대비비 3:1 이상

  **키보드 네비게이션:**
  - [ ] Tab 키로 모든 인터랙티브 요소 접근 가능
  - [ ] 포커스 표시(outline)가 명확히 보임
  - [ ] 모달 열릴 때 포커스 트랩 동작
  - [ ] Escape 키로 모달 닫기 동작

  **스크린리더 지원:**
  - [ ] 모든 이미지에 `alt` 속성 존재
  - [ ] 아이콘 버튼에 `aria-label` 존재
  - [ ] 폼 입력 요소에 `label` 연결
  - [ ] 동적 콘텐츠 변경 시 `aria-live` 적용
  - [ ] 페이지 제목(`<title>`) 유의미한 값 설정

  **구조적 마크업:**
  - [ ] 헤딩 계층 구조 올바름 (h1 → h2 → h3)
  - [ ] 버튼과 링크 역할 구분 명확
  - [ ] 랜드마크 역할(`main`, `nav`, `footer`) 존재

- 이슈 목록 표:
  | 심각도 | 페이지 | 요소 | 이슈 | 권고 조치 |
  |--------|--------|------|------|-----------|

- 심각도 분류: Critical / Major / Minor

### 3. 자동화 도구 활용 (선택)
- axe DevTools 또는 Lighthouse Accessibility로 스캔
- 스캔 결과를 보고서에 포함

## Expected Output Files
- `Process/S4_개발_마무리/Design/docs/qa/responsive-report.md`
- `Process/S4_개발_마무리/Design/docs/qa/accessibility-report.md`

## Completion Criteria
- [ ] 반응형 보고서에 3개 뷰포트 × 3개 페이지 매트릭스가 완성되어 있다
- [ ] 접근성 보고서에 WCAG 2.1 AA 체크리스트가 작성되어 있다
- [ ] 발견된 이슈가 심각도별로 분류되어 있다
- [ ] Critical 이슈가 0개이거나 즉시 조치 계획이 명시되어 있다
- [ ] 키보드 네비게이션 검증이 완료되어 있다

## Tech Stack
- Markdown (보고서)
- 브라우저 DevTools (반응형 검증)
- axe DevTools 또는 Lighthouse (접근성 검사)

## Tools
- 없음 (문서 작업)

## Execution Type
AI-Only

## Remarks
- 스크린샷은 `[스크린샷: 설명]` 플레이스홀더로 대체 가능
- 실제 접근성 도구 결과가 없을 경우 코드 기반 수동 검토로 대체
- Design Area는 Production 자동 복사 대상 아님

---

## ⚠️ 작업 결과물 저장 규칙

### Stage + Area 폴더에 저장
- S4DS1 → `Process/S4_개발_마무리/Design/`
- Design Area는 Production 자동 복사 대상 아님

---

## 📝 파일 명명 규칙
- kebab-case: `responsive-report.md`, `accessibility-report.md`
