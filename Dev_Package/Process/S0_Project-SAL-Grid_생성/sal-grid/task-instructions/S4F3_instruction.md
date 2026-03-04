# S4F3: 비즈니스 대시보드 UI

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S4F3 |
| Task 이름 | 비즈니스 대시보드 UI |
| Stage | S4 — 개발 마무리 |
| Area | F — Frontend |
| Dependencies | S3F7, S4BA2 |
| 실행 방식 | AI-Only |

## 배경 및 목적

수익 활동을 하는 챗봇 소유자를 위한 비즈니스 대시보드를 제공한다. 마켓플레이스 수익, 정산 내역, 봇별 수익 현황을 시각화한다.

## 세부 작업 지시

1. pages/business/ 폴더 생성 및 페이지 작성:
   - index.html: 비즈니스 메인 대시보드 (총 수익, 이번 달 수익)
   - revenue.html: 수익 상세 페이지 (봇별, 기간별 수익)
   - settlement.html: 정산 내역 페이지 (정산 요청, 내역 조회)

2. 수익 차트:
   - 월별 수익 추이 (Canvas 기반 간단한 라인 차트)
   - 봇별 수익 비율 (파이 차트 또는 막대 차트)

3. S4BA2 /api/revenue/:botId 연동

4. 정산 요청 버튼 (최소 금액 제한 표시)

5. 대시보드 메인 네비게이션에 "비즈니스" 메뉴 추가

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| pages/business/index.html | 비즈니스 대시보드 신규 생성 |
| pages/business/revenue.html | 수익 상세 페이지 신규 생성 |
| pages/business/settlement.html | 정산 내역 페이지 신규 생성 |
| pages/dashboard/index.html | 비즈니스 메뉴 링크 추가 |

## 완료 기준
- [ ] pages/business/ 3개 페이지 생성
- [ ] 총 수익 및 이번 달 수익 표시
- [ ] 수익 차트 렌더링
- [ ] 정산 내역 목록 표시
- [ ] /api/revenue API 데이터 연동
- [ ] @task S4F3 주석 포함
- [ ] 모바일 반응형
