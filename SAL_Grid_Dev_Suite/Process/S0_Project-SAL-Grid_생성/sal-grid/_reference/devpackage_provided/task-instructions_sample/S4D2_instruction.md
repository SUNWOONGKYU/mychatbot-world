# S4D2: user_notifications 테이블 생성

## Task 정보
- **Task ID**: S4D2
- **Task Name**: user_notifications 테이블 생성
- **Stage**: S4 (개발-3차)
- **Area**: D (Database)
- **Dependencies**: S1D1

## Task 목표

인앱 알림 시스템을 위한 `user_notifications` 테이블을 Supabase에 생성한다.

## 수행 내용

### 1. 테이블 구조

```sql
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 2. 인덱스 생성

- `idx_user_notifications_user_id` - 사용자별 조회 최적화
- `idx_user_notifications_created_at` - 최신순 정렬 최적화
- `idx_user_notifications_is_read` - 읽지 않은 알림 필터링

### 3. RLS 정책

- 사용자는 자신의 알림만 조회 가능 (SELECT)
- 사용자는 자신의 알림 읽음 처리 가능 (UPDATE)
- 서비스 역할은 모든 알림 생성 가능 (INSERT)

### 4. notification_type 값

| 유형 | 설명 |
|------|------|
| `credit_low` | 잔액 부족 (1,000원 미만) |
| `credit_charged` | 크레딧 충전 완료 |
| `deposit_confirmed` | 입금 확인 완료 |
| `free_period_ending` | 무료 기간 종료 예정 |
| `payment_failed` | 자동 결제 실패 |
| `system` | 시스템 공지/안내 |

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `S4_개발-3차/Database/user_notifications_table.sql` | 테이블 생성 SQL 스크립트 |

## Task Agent
- **Task Agent**: database-specialist
- **Verification Agent**: database-specialist

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
