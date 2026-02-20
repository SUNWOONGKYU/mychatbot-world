# S4D2: user_notifications 테이블 생성 - 검증 지침

## 검증 정보
- **Task ID**: S4D2
- **Verification Agent**: database-specialist

## 검증 항목

### 1. 테이블 구조 검증
- [ ] `user_notifications` 테이블이 존재하는가
- [ ] 모든 컬럼이 정의된 대로 생성되었는가
- [ ] `user_id` 외래키가 `auth.users(id)`를 참조하는가
- [ ] `ON DELETE CASCADE`가 적용되었는가

### 2. 인덱스 검증
- [ ] `idx_user_notifications_user_id` 인덱스 존재
- [ ] `idx_user_notifications_created_at` 인덱스 존재
- [ ] `idx_user_notifications_is_read` 인덱스 존재

### 3. RLS 정책 검증
- [ ] RLS가 활성화되었는가
- [ ] SELECT 정책: 사용자가 자신의 알림만 조회 가능
- [ ] UPDATE 정책: 사용자가 자신의 알림만 수정 가능
- [ ] INSERT 정책: 서비스 역할이 알림 생성 가능

### 4. CRUD 테스트
- [ ] INSERT: 알림 생성 성공
- [ ] SELECT: 알림 조회 성공
- [ ] UPDATE: 읽음 처리 (is_read = true, read_at 설정)
- [ ] DELETE: 필요시 삭제 가능

## 통과 기준

1. REST API로 테이블 접근 시 Status 200 반환
2. 테스트 알림 INSERT 시 Status 201 반환
3. RLS 정책에 따라 권한 제어 정상 작동

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |
