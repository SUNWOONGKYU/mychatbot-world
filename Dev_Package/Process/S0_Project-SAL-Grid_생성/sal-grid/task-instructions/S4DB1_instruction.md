# S4DB1: Phase 3 DB (revenue, marketplace, inheritance)

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S4DB1 |
| Task 이름 | Phase 3 DB (revenue, marketplace, inheritance) |
| Stage | S4 — 개발 마무리 |
| Area | DB — Database |
| Dependencies | S3DB2 |
| 실행 방식 | AI-Only |

## 배경 및 목적

마켓플레이스, 수익 추적, 상속 기능을 지원하기 위한 3개 테이블을 추가한다. S3DB2 이후의 최종 DB 스키마 확장이다.

## 세부 작업 지시

1. supabase/migrations/ 폴더에 마이그레이션 파일 생성:
   파일명: 20260304000003_phase3_revenue_marketplace_inheritance.sql

2. bot_revenue_events 테이블:
   ```sql
   CREATE TABLE bot_revenue_events (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     bot_id UUID REFERENCES bots(id),
     event_type TEXT NOT NULL, -- 'skill_sale', 'consultation', 'subscription'
     amount INTEGER NOT NULL, -- 크레딧 단위
     buyer_user_id UUID REFERENCES auth.users(id),
     skill_id UUID,
     settled BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. skill_marketplace 테이블:
   ```sql
   CREATE TABLE skill_marketplace (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     owner_bot_id UUID REFERENCES bots(id),
     skill_name TEXT NOT NULL,
     description TEXT,
     category TEXT,
     price INTEGER DEFAULT 0, -- 0이면 무료
     install_count INTEGER DEFAULT 0,
     is_active BOOLEAN DEFAULT TRUE,
     review_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. bot_inheritance 테이블:
   ```sql
   CREATE TABLE bot_inheritance (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     owner_user_id UUID REFERENCES auth.users(id),
     heir_email TEXT NOT NULL,
     bot_ids UUID[] NOT NULL,
     condition_months INTEGER DEFAULT 12,
     status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'transferred'
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

5. RLS 정책 및 인덱스 포함

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| supabase/migrations/20260304000003_phase3_revenue_marketplace_inheritance.sql | Phase 3 테이블 3개 생성 마이그레이션 |

## 완료 기준
- [ ] bot_revenue_events 테이블 생성 SQL
- [ ] skill_marketplace 테이블 생성 SQL
- [ ] bot_inheritance 테이블 생성 SQL
- [ ] RLS 정책 3개 테이블 모두 포함
- [ ] 적절한 인덱스 포함
- [ ] 마이그레이션 파일명 규칙 준수
- [ ] 기존 테이블과 충돌 없음
