# S2DB1: Phase 1 DB 스키마 (usage_logs, bot_templates)

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S2DB1 |
| Task 이름 | Phase 1 DB 스키마 (usage_logs, bot_templates) |
| Stage | S2 — 개발 1차 |
| Area | DB — Database |
| Dependencies | S1DB1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

게스트 체험 모드와 직업별 템플릿 시스템을 지원하기 위한 2개 테이블을 추가한다. S1DB1의 기존 스키마를 확장하는 마이그레이션 파일로 작성한다.

## 세부 작업 지시

1. supabase/migrations/ 폴더에 마이그레이션 파일 생성:
   파일명: 20260304000001_phase1_tables.sql

2. usage_logs 테이블:
   ```sql
   CREATE TABLE usage_logs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     bot_id UUID REFERENCES bots(id),
     guest_session_id TEXT,
     action_type TEXT NOT NULL, -- 'message', 'tts', 'bot_create'
     tokens_used INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. bot_templates 테이블:
   ```sql
   CREATE TABLE bot_templates (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     category TEXT NOT NULL, -- 'lawyer', 'restaurant', etc.
     template_name TEXT NOT NULL,
     persona_prompt TEXT NOT NULL,
     greeting TEXT NOT NULL,
     sample_faqs JSONB DEFAULT '[]',
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. RLS 정책:
   - usage_logs: 본인 레코드만 SELECT/INSERT
   - bot_templates: 전체 SELECT (공개 읽기), INSERT/UPDATE는 service_role만

5. 인덱스:
   - usage_logs(user_id, created_at)
   - bot_templates(category)

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| supabase/migrations/20260304000001_phase1_tables.sql | usage_logs, bot_templates 테이블 생성 마이그레이션 |

## 완료 기준
- [ ] usage_logs 테이블 생성 SQL 작성
- [ ] bot_templates 테이블 생성 SQL 작성
- [ ] RLS 정책 포함
- [ ] 인덱스 포함
- [ ] 마이그레이션 파일명 규칙 준수 (타임스탬프_설명.sql)
- [ ] 기존 테이블과 충돌 없음
