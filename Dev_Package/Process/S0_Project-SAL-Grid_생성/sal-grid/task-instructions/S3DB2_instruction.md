# S3DB2: Phase 2 DB 스키마 (bot_growth)

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S3DB2 |
| Task 이름 | Phase 2 DB 스키마 (bot_growth) |
| Stage | S3 — 개발 2차 |
| Area | DB — Database |
| Dependencies | S3DB1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

챗봇 성장 시스템(S3BA5)을 지원하기 위한 bot_growth 테이블을 추가한다. S3DB1의 확장된 스키마를 기반으로 하는 마이그레이션 파일이다.

## 세부 작업 지시

1. supabase/migrations/ 폴더에 마이그레이션 파일 생성:
   파일명: 20260304000002_phase2_bot_growth.sql

2. bot_growth 테이블:
   ```sql
   CREATE TABLE bot_growth (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     bot_id UUID REFERENCES bots(id) ON DELETE CASCADE UNIQUE,
     experience INTEGER DEFAULT 0,
     level INTEGER DEFAULT 1,
     total_conversations INTEGER DEFAULT 0,
     total_messages INTEGER DEFAULT 0,
     school_sessions_completed INTEGER DEFAULT 0,
     last_activity_at TIMESTAMPTZ DEFAULT NOW(),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. RLS 정책:
   - 봇 소유자만 SELECT/UPDATE
   - INSERT는 service_role

4. 인덱스:
   - bot_growth(bot_id)
   - bot_growth(level)

5. updated_at 자동 갱신 트리거 추가

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| supabase/migrations/20260304000002_phase2_bot_growth.sql | bot_growth 테이블 생성 마이그레이션 |

## 완료 기준
- [ ] bot_growth 테이블 생성 SQL 작성
- [ ] bot_id UNIQUE 제약 포함
- [ ] RLS 정책 포함
- [ ] updated_at 자동 갱신 트리거 포함
- [ ] 마이그레이션 파일명 규칙 준수
- [ ] bots 테이블 외래키 CASCADE DELETE 설정
