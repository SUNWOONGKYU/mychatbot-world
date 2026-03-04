# S5U1: 디자인 QA 및 일관성 점검

## Task 개요
- **Task ID**: S5U1
- **Task Name**: 디자인 QA 및 일관성 점검
- **Area**: U (Design)
- **Stage**: S5 (개발 마무리)
- **Dependencies**: S5O1 (배포상황 최종 검증)
- **Task Agent**: `design-qa-specialist`
- **Verification Agent**: `code-reviewer`

## 목적
프로덕션 환경에서 디자인 일관성과 품질을 점검하여 사용자 경험을 보장한다.

## 점검 항목

### 1. UI 일관성 점검
- [ ] 색상 시스템 준수 (Primary: #2C4A8A, Secondary: #F59E0B, Accent: #10B981)
- [ ] 폰트 일관성 (Malgun Gothic, Apple SD Gothic Neo)
- [ ] 간격/여백 일관성 (8px 배수 시스템)
- [ ] 버튼 스타일 통일성
- [ ] 카드 컴포넌트 통일성
- [ ] 아이콘 스타일 일관성

### 2. 반응형 디자인 점검
- [ ] 데스크톱 (1920px, 1440px, 1280px)
- [ ] 태블릿 (1024px, 768px)
- [ ] 모바일 (425px, 375px, 320px)
- [ ] 레이아웃 깨짐 없음
- [ ] 텍스트 가독성 유지
- [ ] 터치 타겟 크기 적절 (최소 44px)

### 3. 디자인 시스템 준수
- [ ] 헤더/푸터 일관성
- [ ] 네비게이션 스타일
- [ ] 폼 요소 스타일 (input, select, checkbox)
- [ ] 에러 상태 표시
- [ ] 성공 상태 표시
- [ ] 로딩 상태 표시

### 4. 시각적 계층 구조
- [ ] 중요도에 따른 폰트 크기
- [ ] CTA 버튼 강조
- [ ] 섹션 구분 명확
- [ ] 정보 그룹핑 적절

## 점검 대상 페이지
1. index.html (메인 대시보드)
2. pages/auth/login.html
3. pages/auth/signup.html
4. pages/auth/reset-password.html
5. pages/mypage/*.html
6. viewer.html
7. admin-dashboard.html

## 사용 도구
- browser-mcp: 브라우저 렌더링 확인
- playwright-mcp: 반응형 스크린샷
- Chrome DevTools: 스타일 검사

## 결과물
- `S5_개발_마무리/Documentation/S5U1_design_qa_report.md`
- 발견된 이슈 목록
- 수정 권장사항

## 완료 기준
- [ ] 모든 페이지 점검 완료
- [ ] 디자인 이슈 0개 또는 문서화됨
- [ ] 반응형 테스트 통과
- [ ] 리포트 작성 완료
