# PITR 복원 드릴 리포트 — 2026 Q2

> 본 문서는 **분기별 드릴 템플릿**. 실제 드릴 실행 시 결과를 채워서 PO 승인 → 아카이브.

## 목적

Supabase Pro PITR(Point-In-Time Recovery) 기능이 프로덕션 장애 시 실제로 작동하는지 검증.

## 전제

- Supabase Pro 플랜 (PITR 7일 유지) — 활성화 상태
- Staging 브랜치 (S9DV1) 구성 완료
- 드릴 대상: 프로덕션 스냅샷을 Staging으로 복원 (**프로덕션 직접 복원 금지**)

## 드릴 체크리스트

### 사전 준비 (T-1일)

- [ ] 드릴 담당자 지정 (PO + 백업 담당 1명)
- [ ] 복원 목표 시점(RPO) 결정 — 통상 "24시간 전" 또는 "최근 알려진 good state"
- [ ] 드릴 대상 테이블 목록 확정 (mcw_profiles / mcw_bots / mcw_credits / mcw_payments / mcw_refunds)
- [ ] 드릴 전 Staging 현재 상태 스냅샷 (pg_dump 파일 보관)

### 실행 (T-0)

1. **복원 개시 시각 기록**: `_____:_____` (KST)
2. Supabase 콘솔 → Project → Database → Backups → Point in time
3. 대상 시점 선택 → Staging 브랜치로 복원
4. 복원 완료 알림 수신 대기
5. **복원 완료 시각 기록**: `_____:_____` (KST)
6. **소요 시간**: `_____분`

### 검증 (복원 직후)

- [ ] `SELECT COUNT(*) FROM mcw_profiles` — 예상치 ±오차 < 1%
- [ ] `SELECT COUNT(*) FROM mcw_bots` — 동일
- [ ] `SELECT COUNT(*) FROM mcw_payments WHERE status='pending'` — 목표 시점 기준값
- [ ] RLS 정책 전수 조회: `SELECT tablename, policyname FROM pg_policies WHERE schemaname='public'`
- [ ] RPC 함수 존재 확인: `exec_sql`, `grant_credit`, `refund_request` (존재 시)
- [ ] 샘플 쿼리 3건 — 응답 시간 프로덕션 대비 ±20% 이내

### 무결성 확인

- [ ] FK 제약 위반 없음: `SELECT COUNT(*) FROM ... LEFT JOIN ... WHERE ... IS NULL`
- [ ] UNIQUE 제약 위반 없음 (중복 email/slug 없음)
- [ ] 시퀀스/시작값 연속성 (created_at 최대값이 복원 시점 이후 아님)

### 사후 정리

- [ ] Staging 복원본을 원래 상태로 되돌리거나 archive
- [ ] 본 문서에 실측 값 기록 → Git commit
- [ ] Slack #ops 채널에 드릴 결과 요약 공유
- [ ] 다음 분기 드릴 일정 캘린더 등록

## 실측 결과 (채우기)

| 항목 | 목표 | 실측 | Pass/Fail |
|------|------|------|-----------|
| 복원 소요 시간 | < 15분 | | |
| 데이터 일관성 (행 수 오차) | < 1% | | |
| RLS 정책 유실 | 0 | | |
| 무결성 위반 | 0 | | |
| RPC 함수 정상 | 100% | | |

## 이슈 / 교훈 (해당 시)

- (없음 / 발견된 이슈와 후속 조치)

## 담당 / 서명

- **드릴 리드**: _______________
- **검증자**: _______________
- **드릴 일시**: 2026-__-__ __:__
- **승인 (PO)**: _______________

---

**다음 드릴**: 2026 Q3 (2026-07~09 중)
