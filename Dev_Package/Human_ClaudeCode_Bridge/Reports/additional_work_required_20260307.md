# 추가 작업 필요 항목 — My Chatbot World
> 작성일: 2026-03-07 | 작성자: Claude Sonnet 4.6

---

## 왜 이런 상황이 발생했는가 — 원인 분석

### 원인 1. Task 의존성 설계 오류 (가장 근본적인 원인)

S3F12(Skills 구현), S3F14(Learning 구현) Task를 설계할 때
**선행 Task에 DB Task와 BA(API) Task가 없었음.**

```
잘못된 의존성:
S3F12(Skills 프론트) → dependency: S2F8(대메뉴)만

올바른 의존성:
S3DB_Skills(스킬 DB 테이블) → S3BA_Skills(스킬 API) → S3F12(스킬 프론트)
```

DB 없이 프론트부터 만들 수 있게 Task를 설계한 것 자체가 잘못.
의존성에 DB Task가 없으니 프론트 단독으로 "완료" 처리가 가능했음.

---

### 원인 2. S3DB3 범위가 Jobs/Community/Admin만 포함

S3DB3 Task(DB 스키마 확장)의 범위를 `bot_jobs`, `community_*` 테이블로만 한정했고,
**`mcw_skills`, `learning_courses` 테이블은 누락.**

이 Task가 통과되면서 Skills/Learning DB 없이 전체 S3 Stage가 완료 처리됨.

---

### 원인 3. Verification(검증) 에이전트가 하드코딩을 문제로 잡지 않음

S3F12, S3F14 Task 검증 시:
- UI 렌더링 ✅, 필터 작동 ✅, 설치 로직 ✅ → PASS 처리
- **"데이터가 DB에서 오는가?"** 를 검증 항목에 포함시키지 않음

Verification Instruction에 "데이터 소스 DB 연결 여부" 항목이 없었기 때문.

---

### 원인 4. "기능 구현"의 정의를 UI 기능으로만 해석

Task명이 **"Skills 마켓플레이스 기능 구현"** 이었는데,
이를 **검색·필터·설치 UI 기능** 구현으로만 해석하고 실행했음.

본래 의미는 **DB-API-프론트 풀스택 기능** 구현이었어야 했으나,
Task Instruction에 DB 연결 요구사항이 명시되지 않았고,
이를 지적하지 않고 프론트만 만든 것이 오류.

---

### 원인 5. 빠른 구현 편의주의 + 임시 처리를 완료로 처리

JS 배열로 데이터를 하드코딩하면 빠르게 UI를 구현할 수 있음.
"일단 하드코딩으로 만들고 나중에 DB로 전환"하는 임시 접근법을 사용했는데,
**나중에 전환하는 작업을 Task로 등록하지 않고 그냥 완료 처리.**

MVP 개발에서 흔한 기술 부채 발생 패턴인데,
이걸 검증 단계에서 잡아야 했으나 통과시킨 것이 핵심 실수.

---

### 재발 방지 대책

앞으로 F(프론트) Task 실행 전 반드시 확인:
1. **데이터 소스 확인**: 이 페이지의 데이터는 어디서 오는가? (DB? API? 하드코딩?)
2. **선행 Task 확인**: DB Task → BA Task → F Task 순서 지켜졌는가?
3. **Verification 항목 추가**: "데이터를 Supabase API에서 fetch하는가?" 체크
4. **하드코딩 금지 원칙**: JS 파일 내 배열로 도메인 데이터를 정의하지 않음

---

## 배경

현재 79개 Task 중 78개 완료(99%)로 기록되어 있으나,
핵심 기능 3개(Skills·Jobs·Learning)의 데이터 레이어가 Supabase DB가 아닌
JavaScript 하드코딩으로 구현되어 있음.

이는 구현 당시 DB→API→프론트 순서를 지키지 않고 프론트만 완성한 결함임.

---

## 긴급 — Supabase 수동 실행 필요 (SQL)

다음 2개 SQL은 이미 파일로 작성되어 있으나 Supabase SQL Editor에서 실행이 필요합니다.

| # | 파일 경로 | 내용 | 상태 |
|---|-----------|------|------|
| 1 | `Dev_Package/Process/S3_개발-2차/Database/community_bot_redesign.sql` | 봇카페 리디자인 — community_madangs·community_bookmarks·karma 트리거 | ✅ 이번 세션 실행 완료 |
| 2 | `Dev_Package/Process/S3_개발-2차/Database/add_community_votes_table.sql` | 업보트/다운보트 — community_votes 테이블·posts/comments upvotes 컬럼 | ❌ **미실행** |

---

## 추가 구현 필요 항목

### 1. Skills 스킬장터 — DB 연결

**문제**: 24개 스킬 데이터가 `js/app.js` 배열에 하드코딩되어 있음. Supabase와 무관하게 동작.

**필요 작업**:
- [ ] Supabase `mcw_skills` 테이블 생성
  ```sql
  CREATE TABLE mcw_skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    category TEXT,
    description TEXT,
    system_prompt TEXT,
    is_free BOOLEAN DEFAULT true,
    price INTEGER DEFAULT 0,
    installs INTEGER DEFAULT 0,
    rating DECIMAL(3,1) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [ ] 24개 스킬 mock 데이터 INSERT (현재 app.js 배열 → DB 이관)
- [ ] `skill-list.js` API 신규 생성 (`GET /api/Backend_APIs/skill-list`)
- [ ] `js/app.js` skills 하드코딩 배열 제거 → API 호출로 전환
- [ ] `js/skills.js` init()에서 MCW.skills 대신 API fetch로 변경

**관련 파일**: `js/app.js` L193-260, `js/skills.js` L280-285

---

### 2. Jobs 구봇구직 — mock 데이터 삽입

**문제**: `job-list.js` API는 완성되어 있으나 `bot_jobs` 테이블이 비어 있어 항상 JS 내부 fallback mock 함수로 표시됨.

**필요 작업**:
- [ ] `bot_jobs` 테이블에 mock 데이터 INSERT (구인 10개 + 구직 10개)
  ```sql
  -- 구인 예시
  INSERT INTO bot_jobs (title, description, job_type, category, status, salary_min, salary_max, required_skills)
  VALUES
    ('고객지원 봇 개발', '콜센터 자동응답 봇 개발', 'hire', 'customer-service', 'open', 300000, 500000, ARRAY['NLP', 'Chat API']),
    ('쇼핑몰 추천 봇', '상품 추천 AI 봇 제작', 'hire', 'commerce', 'open', 400000, 600000, ARRAY['추천 알고리즘', 'API 연동']),
    ...
  ```
- [ ] `bot_jobs` 테이블 스키마 확인 (컬럼명 일치 여부)
- [ ] `js/jobs.js` fallback mock 함수 제거 또는 경고 처리

**관련 파일**: `api/Backend_APIs/job-list.js`, `js/jobs.js` L148-154, L194-199

---

### 3. Learning 학습 — 커리큘럼 DB 연결

**문제**: `js/learning.js`의 `CURRICULUM_DATA` 배열(4개 과정)이 하드코딩.
학습 진행률만 DB 저장되고, 커리큘럼 콘텐츠 자체는 DB와 무관.

**필요 작업**:
- [ ] `learning_courses` 테이블 생성
  ```sql
  CREATE TABLE learning_courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    level TEXT,      -- basic/intermediate/advanced/master
    total_lessons INTEGER DEFAULT 0,
    scenario_id TEXT,
    order_num INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
  );
  ```
- [ ] 4개 과정 mock INSERT (기초봇마스터·심화대화·실전AI·마스터)
- [ ] `curriculum-list.js` API 신규 생성 (`GET /api/Backend_APIs/curriculum-list`)
- [ ] `js/learning.js` `CURRICULUM_DATA` 하드코딩 제거 → API 로드로 전환
- [ ] `bot_growth` 테이블 컬럼 확장
  ```sql
  ALTER TABLE bot_growth ADD COLUMN IF NOT EXISTS learning_progress JSONB DEFAULT '{}';
  ALTER TABLE bot_growth ADD COLUMN IF NOT EXISTS learning_history JSONB DEFAULT '[]';
  ```

**관련 파일**: `js/learning.js` L21-90, `api/Backend_APIs/learning-progress.js`

---

### 4. 유료 스킬 결제 시스템 (장기 로드맵)

**현재**: 유료 스킬 3개(voice-clone·3d-avatar·custom-theme)는 "준비 중" 배지로 비활성화됨.
**필요 작업**:
- [ ] PG사 연동 (KG이니시스·토스페이먼츠 등) 검토
- [ ] `skill_purchases` 테이블 설계
- [ ] 구독 플랜 설계 (월정액 vs 단품 결제)
- [ ] S3F12 Task에 후속 Task 추가 필요

---

### 5. 카카오 로그인 — S2S2 (Pending)

**현재**: Task S2S2만 Pending 상태. 유일한 미완료 공식 Task.
**필요 작업**:
- [ ] Kakao Developers 앱 등록 및 OAuth 설정
- [ ] `kakao-callback.js` API 구현
- [ ] 로그인 페이지 카카오 버튼 연결

---

### 6. school-session API (Learning 시나리오 세션)

**문제**: `js/learning.js` L200에서 `POST /api/Backend_APIs/school-session`을 호출하나 해당 API 파일이 없음.

**필요 작업**:
- [ ] `school-session.js` API 신규 생성
- [ ] 시나리오 기반 AI 대화 처리 구현
- [ ] Supabase `learning_scenarios` 테이블 연결

---

## 우선순위 정리

| 순위 | 항목 | 난이도 | 예상 소요 |
|------|------|--------|---------|
| 🔴 즉시 | `add_community_votes_table.sql` Supabase 실행 | 쉬움 | 5분 (수동) |
| 🔴 즉시 | `bot_jobs` mock 데이터 INSERT | 보통 | 1세션 |
| 🟠 단기 | Skills `mcw_skills` 테이블 + API + 하드코딩 제거 | 어려움 | 2세션 |
| 🟠 단기 | Learning `learning_courses` 테이블 + API + 하드코딩 제거 | 어려움 | 2세션 |
| 🟡 중기 | `school-session.js` API 구현 | 어려움 | 1세션 |
| 🟡 중기 | S2S2 카카오 로그인 | 보통 | 1세션 (외부 설정 필요) |
| 🟢 장기 | 유료 스킬 결제 시스템 | 매우 어려움 | 별도 프로젝트 수준 |

---

## 수동 실행 필요 항목 (PO 직접 실행)

> Supabase SQL Editor에서 직접 실행해야 하는 항목

```
1. Dev_Package/Process/S3_개발-2차/Database/add_community_votes_table.sql
   → 봇카페 업/다운보트 시스템 활성화

2. bot_growth 컬럼 확장 SQL (위 #3 항목)
   → Learning 진행률 DB 저장 정상화
```

---

*이 리포트는 다음 세션에서 추가 작업 시작점으로 활용하세요.*
