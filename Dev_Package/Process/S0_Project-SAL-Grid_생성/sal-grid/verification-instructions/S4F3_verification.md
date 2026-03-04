# S4F3 검증 지시서

## 검증 대상
- Task ID: S4F3
- Task 이름: 비즈니스 대시보드 UI

## 검증 체크리스트
- [ ] 파일 존재 확인: pages/business/index.html, revenue.html, settlement.html
- [ ] @task S4F3 주석 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] /api/revenue 연동 코드 존재
- [ ] 수익 차트 렌더링 코드 존재
- [ ] 정산 내역 목록 HTML 구조
- [ ] 하드코딩 없음
- [ ] 오류 처리 포함

## Area별 추가 검증 (F — Frontend)
- [ ] 총 수익/이번 달 수익 수치 표시 요소
- [ ] 정산 요청 버튼 및 최소 금액 표시
- [ ] 대시보드 네비게이션에 비즈니스 메뉴 링크
- [ ] 수익 없을 때 빈 상태(empty state) 처리
- [ ] 인증 없는 접근 처리
- [ ] 모바일 반응형
