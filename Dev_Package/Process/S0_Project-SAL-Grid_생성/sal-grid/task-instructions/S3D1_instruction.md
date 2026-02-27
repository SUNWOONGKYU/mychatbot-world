# S3D1: DB 스키마 확장 (15개 신규 테이블)

## Task 정보
- **Task ID**: S3D1
- **Task Name**: DB 스키마 확장 (15개 신규 테이블)
- **Stage**: S3 (개발 3차)
- **Area**: D (Database)
- **Dependencies**: S1D1

## Task 목표

프로토타입 추가 기능을 지원하기 위한 DB 스키마를 확장한다.
아바타, 스킬 프리셋, 테마, 채널, Obsidian 지식베이스, 스킬 API 연동,
유료 스킬, 수익활동 중개, 크레딧 결제 관련 15개 신규 테이블 추가.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `sql/schema_v2_additions.sql` | (NEW) 15개 신규 테이블 DDL (avatars, skill_presets, themes, channels, kb_chunks, skill_integrations, paid_skills, revenue_activities, credits 등) |
