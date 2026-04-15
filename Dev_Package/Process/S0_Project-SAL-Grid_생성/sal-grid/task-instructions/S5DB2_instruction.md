# S5DB2: Supabase RLS 전면 감사

## Task 정보
- **Task ID**: S5DB2
- **Task Name**: Supabase RLS 전면 감사
- **Stage**: S5 (품질 개선)
- **Area**: DB (Database)
- **Dependencies**: S4S1, S4DB1

## Task 목표

전체 Supabase 테이블의 Row Level Security(RLS) 정책을 감사하여 누락된 테이블에 RLS를 활성화하고, 과도하게 허용적인 정책을 수정한다.

## 구현 범위

### 1. 감사 체크리스트
- 모든 테이블에 RLS 활성화 여부 확인
- 각 테이블의 SELECT/INSERT/UPDATE/DELETE 정책 검토
- `anon` 역할에 불필요한 권한 부여 여부 확인
- Service Role을 통한 우회 가능성 검토

### 2. 수정 대상 (예상)
- RLS 비활성화 테이블 → `ALTER TABLE xxx ENABLE ROW LEVEL SECURITY`
- 과도한 anon 권한 → 정책 수정 또는 삭제
- 누락된 소유자 기반 정책 → `auth.uid() = user_id` 패턴 추가

### 3. 정책 테스트
각 주요 정책에 대해 SQL 테스트 케이스 작성:
```sql
-- 테스트: 다른 사용자의 데이터에 접근 불가
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"other-user-id"}';
SELECT * FROM chatbots WHERE user_id = 'my-user-id'; -- 0 rows
```

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `Process/S5_품질_개선/Database/S5DB2_rls_audit.sql` | RLS 감사 및 수정 SQL |
| `Process/S5_품질_개선/Database/S5DB2_rls_test.sql` | RLS 정책 테스트 케이스 |

## 완료 기준

- [ ] 전체 테이블 RLS 활성화 상태 확인
- [ ] 감사 SQL 스크립트 작성 완료
- [ ] 취약한 정책 수정 완료
- [ ] 정책 테스트 케이스 작성 및 통과
