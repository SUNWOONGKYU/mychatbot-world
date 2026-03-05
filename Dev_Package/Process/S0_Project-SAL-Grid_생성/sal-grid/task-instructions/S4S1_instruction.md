# S4S1: 어드민 권한 체계 + 감사 로그

## Task 정보
- **Task ID**: S4S1
- **Task Name**: 어드민 권한 체계 + 감사 로그
- **Stage**: S4 (개발 마무리)
- **Area**: S (Security)
- **Dependencies**: S3DB3, S2S1

## Task 목표
profiles.role ENUM(user/moderator/admin) 설정, RLS 정책(admin만 관리 테이블 접근), 감사 로그 트리거(admin 행동 자동 기록), admin_audit_logs 테이블 운영.

## 생성/수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `api/Security/admin-middleware.js` | 어드민 권한 체크 미들웨어 - role ENUM 검증 |
| `supabase/migrations/admin-rls-policies.sql` | RLS 정책 설정 - admin 전용 테이블 접근 제어 |
| `supabase/migrations/admin-audit-trigger.sql` | 감사 로그 자동 기록 트리거 |
| `supabase/schema/admin_audit_logs.sql` | admin_audit_logs 테이블 스키마 |
