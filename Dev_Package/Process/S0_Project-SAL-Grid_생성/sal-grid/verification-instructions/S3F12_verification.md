# S3F12 검증 지시서

## 검증 정보
| 항목 | 값 |
|------|---|
| Task ID | S3F12 |
| Task Name | Skills 마켓플레이스 기능 구현 |
| Verification Agent | code-reviewer-core |

## 검증 체크리스트

### 1. 파일 존재 확인
- [ ] `pages/skills/index.html` — `@task S3F12` 주석 존재
- [ ] `pages/skills/detail.html` — `@task S3F12` 주석 존재
- [ ] `pages/skills/my.html` — `@task S3F12` 주석 존재
- [ ] `js/skills.js` — `@task S3F12` 주석 존재
- [ ] `css/skills.css` — 마켓플레이스 스타일 포함

### 2. 코드 품질 검증
- [ ] 하드코딩된 API 키, 비밀번호 없음
- [ ] XSS 방지 — 사용자 입력 escape 처리
- [ ] 에러 핸들링 — API 실패 시 fallback 동작
- [ ] 반응형 — 768px 이하 레이아웃 정상

### 3. 기능 검증
- [ ] 23개 스킬이 카드 그리드로 렌더링되는가
- [ ] 7개 카테고리 필터가 동작하는가
- [ ] 검색(스킬명/설명)이 동작하는가
- [ ] 정렬(인기/평점/가격)이 동작하는가
- [ ] 스킬 카드 클릭 → detail.html 이동하는가
- [ ] detail.html에서 설치/제거가 동작하는가
- [ ] my.html에서 장착 스킬 목록이 표시되는가
- [ ] 프리셋 원클릭 설치가 동작하는가

### 4. 통합 검증
- [ ] `CoCoBot.skills` 데이터와 정상 연동
- [ ] `CoCoBot.skillPresets` 데이터와 정상 연동
- [ ] navbar 링크가 모든 서브페이지에서 정상 작동
- [ ] 다크 테마 (#10b981 accent) 일관성

## 검증 결과 기록 형식
검증 완료 후 `grid_records/S3F12.json` 업데이트:
- verification_status: "Verified" 또는 "Needs Fix"
- test_result, build_verification, integration_verification, blockers, comprehensive_verification 기록
