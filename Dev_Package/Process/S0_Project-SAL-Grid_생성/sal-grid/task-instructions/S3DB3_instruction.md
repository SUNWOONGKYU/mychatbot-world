# S3DB3: Jobs/Community/Admin DB 스키마 확장

## Task 정보
- **Task ID**: S3DB3
- **Task Name**: Jobs/Community/Admin DB 스키마 확장
- **Stage**: S3 (개발 2차)
- **Area**: DB (Database)
- **Dependencies**: S3DB1

## Task 목표
구봇구직/봇마당/어드민에 필요한 DB 테이블 생성. bot_jobs, job_applications, job_reviews, community_posts, community_comments, admin_roles, admin_audit_logs, bot_reports. profiles 테이블에 role 컬럼 추가.

## 생성/수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/add_bot_jobs_table.sql` | bot_jobs 테이블 생성 |
| `supabase/migrations/add_job_applications_table.sql` | job_applications 테이블 생성 |
| `supabase/migrations/add_job_reviews_table.sql` | job_reviews 테이블 생성 |
| `supabase/migrations/add_community_posts_table.sql` | community_posts 테이블 생성 |
| `supabase/migrations/add_community_comments_table.sql` | community_comments 테이블 생성 |
| `supabase/migrations/add_admin_roles_table.sql` | admin_roles 테이블 생성 |
| `supabase/migrations/add_admin_audit_logs_table.sql` | admin_audit_logs 테이블 생성 |
| `supabase/migrations/add_bot_reports_table.sql` | bot_reports 테이블 생성 |
| `supabase/migrations/add_role_to_profiles.sql` | profiles 테이블에 role 컬럼 추가 |
