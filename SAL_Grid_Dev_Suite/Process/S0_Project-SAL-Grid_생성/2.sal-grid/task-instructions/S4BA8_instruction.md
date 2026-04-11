# S4BA8: SMS 스킬 데이터 DB 이관 — JSON 파일 → mcw_skills 테이블

## Task 정보
- **Task ID**: S4BA8
- **Task Name**: SMS 스킬 데이터 DB 이관 — JSON 파일 → mcw_skills 테이블
- **Stage**: S4 (개발 마무리)
- **Area**: BA (Backend APIs)
- **Dependencies**: S4DB4

## Task 목표

현재 `skill-market/prompt-skills/*.json` (23개) + `skill-market/integration-skills/*/skill.json` (4개) 에
하드코딩된 스킬 데이터를 Supabase `mcw_skills` 테이블로 이관.

이후 `lib/skills-data.ts` 하드코딩 제거 → `/api/skills` 엔드포인트를 DB 조회로 전환.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `scripts/migrate-skills-to-db.js` | JSON→DB 이관 스크립트 (1회성) |
| `app/api/skills/route.ts` | mcw_skills DB 조회로 전환 (JSON 파일 대신) |
| `lib/skills-data.ts` | 하드코딩 SKILLS[] 배열 제거, DB 조회 함수로 교체 |

## 이관 대상

- `skill-market/prompt-skills/`: 23개 JSON → mcw_skills INSERT (origin='ready-made')
- `skill-market/integration-skills/*/skill.json`: 4개 → mcw_skills INSERT (origin='ready-made')

## JSON → DB 필드 매핑

| JSON 필드 | DB 컬럼 |
|-----------|---------|
| id | metadata.legacy_id |
| name | name |
| description | description |
| category | category |
| price | price |
| systemPrompt | skill_content |
| isFree | (price=0으로 판단) |
| tags, icon, examples | metadata JSONB |

## 검증 항목

- [ ] mcw_skills 테이블에 27개 스킬 INSERT됨
- [ ] /api/skills GET 응답이 DB 데이터를 반환함
- [ ] lib/skills-data.ts 하드코딩 배열이 제거됨
- [ ] 기존 설치/실행/리뷰 기능 정상 동작 확인
