# S3F7: 사용량 대시보드 UI

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S3F7 |
| Task 이름 | 사용량 대시보드 UI |
| Stage | S3 — 개발 2차 |
| Area | F — Frontend |
| Dependencies | S3F1, S2BA4 |
| 실행 방식 | AI-Only |

## 배경 및 목적

사용자가 자신의 월별 AI 사용량, 무료 티어 잔여량, 대화 횟수 등을 한눈에 확인할 수 있는 사용량 대시보드를 제공한다. S2BA4의 /api/usage 데이터를 시각화한다.

## 세부 작업 지시

1. pages/dashboard/usage.html 생성:
   - 월별 사용량 진행 바 (무료 한도 대비)
   - 이번 달 대화 횟수, 메시지 수
   - 봇별 사용량 분포 (간단한 막대 차트)
   - 무료 티어 소진 시 업그레이드 유도 배너

2. 차트 구현:
   - 외부 차트 라이브러리 사용 금지 (순수 CSS/Canvas)
   - 또는 CDN으로 Chart.js 사용 (bundle size 최소화)

3. /api/usage 엔드포인트 연동:
   - 페이지 로드 시 데이터 fetch
   - 로딩 스켈레톤 표시

4. 대시보드 메인(S3F1)에 사용량 섹션 링크 추가

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| pages/dashboard/usage.html | 사용량 대시보드 페이지 신규 생성 |
| pages/dashboard/index.html | 사용량 페이지 링크 추가 |

## 완료 기준
- [ ] pages/dashboard/usage.html 생성
- [ ] /api/usage 데이터 정상 표시
- [ ] 월별 사용량 진행 바 표시
- [ ] 무료 한도 소진 비율 시각화
- [ ] 로딩 상태 스켈레톤 UI 존재
- [ ] @task S3F7 주석 포함
- [ ] 모바일 반응형 레이아웃
