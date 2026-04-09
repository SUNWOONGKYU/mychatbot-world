# S5FE7: 관리자 대시보드 구현 — 섹션1~4 (개요/공지/회원/결제)

## Task 정보
- **Task ID**: S5FE7
- **Task Name**: 관리자 대시보드 구현 — 섹션1~4 (개요/공지/회원/결제)
- **Stage**: S5 (디자인 혁신)
- **Area**: FE (Frontend)
- **Dependencies**: S5DS4, S5FE1, S5FE2

## Task 목표

MCW 관리자 대시보드(/admin) 8섹션 중 섹션1~4(개요/공지/회원/결제)를 구현한다. PO 확정 스펙(2026-04-07), SSAL Works 관리자 패턴 참고. SPA 구조로 섹션 간 전환 구현.

## 구현 항목

### 섹션1. 대시보드 개요 (/admin)
- KPI 카드 5개: 총 회원 / 총 챗봇 / 총 매출 / 오늘 활성 유저 / 미처리 건수
- 매출 추이 차트 (최근 4주, Chart.js)
- 회원 가입 추이 차트 (최근 7일)
- 최근 활동 타임라인
- 긴급 처리 필요 알림 (입금대기/스킬검수/신고)

### 섹션2. 공지사항 관리 (/admin/notices)
- 공지 CRUD (제목/본문/카테고리)
- 상단 고정 핀
- 대상 설정 (전체/특정 등급)
- 예약 발행
- 알림센터 푸시 버튼

### 섹션3. 회원 관리 (/admin/users)
- 회원 목록 (이메일/이름/가입일/크레딧/상태)
- 검색/필터
- 상태 변경 (활성/비활성/정지)
- 크레딧 직접 조정 (사유 입력 필수)
- 회원 상세 (보유 챗봇/스킬/수익 현황)
- 회원 삭제

### 섹션4. 입금/결제 관리 (/admin/payments)
- 입금 신청 목록 (대기/승인/거부) — 사이드바 배지로 미처리 건수 표시
- 승인 → 크레딧 자동 충전 (SSAL Works 패턴 참고)
- 거부 → 사유 입력 필수
- 크레딧 거래 내역 (charge/grant/usage 타입 구분)
- 결제 내역 전체 조회

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/admin/page.tsx` | 관리자 대시보드 메인 (섹션1 개요) |
| `app/admin/notices/page.tsx` | 공지사항 관리 |
| `app/admin/users/page.tsx` | 회원 관리 |
| `app/admin/payments/page.tsx` | 입금/결제 관리 |
| `components/admin/AdminSidebar.tsx` | 관리자 사이드바 (8섹션 + 미처리 배지) |
| `components/admin/KpiCard.tsx` | KPI 카드 컴포넌트 |
| `components/admin/ActivityTimeline.tsx` | 최근 활동 타임라인 |
