# Verification Instruction - S1DB1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S1DB1

## Task Name
기본 DB 스키마 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `supabase/migrations/20260331_initial_schema.sql` 존재 (또는 유사 날짜의 초기 스키마 파일)
- [ ] `Process/S1_개발_준비/Database/schema.sql` 원본 파일 존재

### 2. 테이블 존재 검증 (Supabase Dashboard 또는 CLI)
- [ ] `mcw_bots` 테이블 존재
- [ ] `mcw_personas` 테이블 존재
- [ ] `mcw_kb_items` 테이블 존재
- [ ] `mcw_chat_logs` 테이블 존재
- [ ] `usage_logs` 테이블 존재
- [ ] `bot_templates` 테이블 존재

### 3. 스키마 컬럼 검증
- [ ] `mcw_bots`: `id`, `user_id`, `name`, `description`, `is_active`, `settings` 컬럼 존재
- [ ] `mcw_personas`: `id`, `user_id`, `name`, `system_prompt`, `tone` 컬럼 존재
- [ ] `mcw_kb_items`: `id`, `bot_id`, `user_id`, `title`, `content`, `embedding` 컬럼 존재
- [ ] `mcw_chat_logs`: `id`, `bot_id`, `session_id`, `user_message`, `bot_response`, `tokens_used` 컬럼 존재
- [ ] `usage_logs`: `id`, `user_id`, `bot_id`, `action`, `credits_used` 컬럼 존재
- [ ] `bot_templates`: `id`, `name`, `category`, `system_prompt`, `is_featured` 컬럼 존재

### 4. RLS 정책 검증
- [ ] 모든 6개 테이블에 RLS 활성화 (`row security enabled = true`)
- [ ] `mcw_bots`: 소유자만 수정/삭제, 공개 봇 조회 가능
- [ ] `mcw_personas`: 소유자만 수정/삭제, 공개 페르소나 조회 가능
- [ ] `mcw_kb_items`: 소유자만 CRUD
- [ ] `mcw_chat_logs`: 봇 소유자만 조회
- [ ] `usage_logs`: 소유자만 조회
- [ ] `bot_templates`: 전체 공개 읽기

### 5. 인덱스 검증
- [ ] `idx_mcw_bots_user_id` 인덱스 존재
- [ ] `idx_mcw_chat_logs_bot_id` 인덱스 존재
- [ ] `idx_usage_logs_user_id` 인덱스 존재

### 6. 기능 검증
- [ ] `mcw_bots`에 테스트 데이터 INSERT/SELECT 성공
- [ ] RLS 정책: 다른 사용자 데이터 접근 차단 확인
- [ ] `bot_templates` 공개 읽기 정책 확인

### 7. 통합 검증
- [ ] `api/_shared.js`의 Supabase 클라이언트로 테이블 쿼리 가능
- [ ] S1DB2의 새 테이블 추가를 위한 기반 스키마 완성
- [ ] `auth.users` 외래키 연결 정상

### 8. 저장 위치 검증
- [ ] `Process/S1_개발_준비/Database/`에 SQL 파일 저장됨

## Test Commands
```bash
# 테이블 목록 확인 (Supabase CLI)
supabase db status

# 특정 테이블 존재 확인 (psql 또는 Supabase REST API)
# curl -X GET \
#   'https://[project-ref].supabase.co/rest/v1/mcw_bots?limit=1' \
#   -H 'apikey: [anon-key]'

# RLS 확인
# Supabase Dashboard > Database > Tables > mcw_bots > RLS 탭

# 마이그레이션 파일 존재 확인
ls supabase/migrations/
```

## Expected Results
- 6개 테이블 모두 Supabase에 존재
- 각 테이블 RLS 활성화 상태
- `mcw_bots` 테스트 INSERT/SELECT 성공
- `bot_templates` anon 사용자로 SELECT 성공

## Verification Agent
database-developer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 6개 테이블 존재 및 스키마 정확
- [ ] RLS 정책 올바르게 적용
- [ ] Blocker 없음

## ⚠️ Human-AI Task 검증 주의사항
이 Task는 **Human-AI** 유형입니다.
- Supabase Dashboard 접속은 PO가 직접 수행
- 실제 테이블 존재 여부는 Supabase Dashboard Table Editor에서 확인
- pgvector 확장 활성화는 PO가 Supabase Dashboard > Database > Extensions에서 수행
