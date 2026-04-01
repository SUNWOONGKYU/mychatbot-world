# Database Schema Design

AI Avatar Chat Platform 데이터베이스 스키마 설계 문서입니다.

---

## 🗄️ Database: PostgreSQL 15+

---

## 📋 테이블 목록

1. **users** - 사용자 정보
2. **conversations** - 대화 세션
3. **messages** - 대화 메시지
4. **chatbot_personas** - 챗봇 페르소나 정의
5. **user_preferences** - 사용자 설정

---

## 1️⃣ users

사용자 계정 정보를 저장합니다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | NO | uuid_generate_v4() | Primary Key |
| email | VARCHAR(255) | NO | - | 이메일 (UNIQUE) |
| username | VARCHAR(50) | NO | - | 사용자명 (UNIQUE) |
| password_hash | VARCHAR(255) | NO | - | 암호화된 비밀번호 |
| is_active | BOOLEAN | NO | true | 활성 상태 |
| is_verified | BOOLEAN | NO | false | 이메일 인증 여부 |
| last_login_at | TIMESTAMP | YES | - | 마지막 로그인 시간 |
| created_at | TIMESTAMP | NO | NOW() | 생성 시간 |
| updated_at | TIMESTAMP | NO | NOW() | 수정 시간 |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (email)
- UNIQUE (username)
- INDEX (email) - 로그인 조회 최적화

---

## 2️⃣ conversations

사용자와 챗봇 간의 대화 세션을 저장합니다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | NO | uuid_generate_v4() | Primary Key |
| user_id | UUID | NO | - | Foreign Key → users(id) |
| persona_id | VARCHAR(50) | NO | - | Foreign Key → chatbot_personas(id) |
| title | VARCHAR(200) | YES | - | 대화 제목 (첫 메시지에서 자동 생성) |
| message_count | INTEGER | NO | 0 | 메시지 개수 |
| created_at | TIMESTAMP | NO | NOW() | 생성 시간 |
| updated_at | TIMESTAMP | NO | NOW() | 마지막 메시지 시간 |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (user_id, updated_at DESC) - 사용자별 대화 목록 조회
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (persona_id) REFERENCES chatbot_personas(id)

---

## 3️⃣ messages

대화 세션 내의 개별 메시지를 저장합니다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | NO | uuid_generate_v4() | Primary Key |
| conversation_id | UUID | NO | - | Foreign Key → conversations(id) |
| role | VARCHAR(20) | NO | - | 'user' 또는 'assistant' |
| content | TEXT | NO | - | 메시지 내용 |
| emotion | VARCHAR(20) | YES | - | 감정 표현 (assistant만 해당) |
| tokens_used | INTEGER | YES | - | 사용된 토큰 수 (비용 추적) |
| created_at | TIMESTAMP | NO | NOW() | 생성 시간 |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (conversation_id, created_at ASC) - 대화 내 메시지 조회
- FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE

---

## 4️⃣ chatbot_personas

6가지 챗봇 페르소나 정의를 저장합니다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | VARCHAR(50) | NO | - | Primary Key (예: 'business-assistant') |
| name | VARCHAR(100) | NO | - | 페르소나 이름 |
| description | TEXT | NO | - | 페르소나 설명 |
| system_prompt | TEXT | NO | - | AI 시스템 프롬프트 |
| avatar_model | VARCHAR(100) | YES | - | 3D 아바타 모델 경로 |
| is_active | BOOLEAN | NO | true | 활성 상태 |
| created_at | TIMESTAMP | NO | NOW() | 생성 시간 |
| updated_at | TIMESTAMP | NO | NOW() | 수정 시간 |

**Indexes**:
- PRIMARY KEY (id)

**Initial Data**:
- business-assistant
- customer-service
- education-tutor
- healthcare-advisor
- entertainment-bot
- personal-assistant

---

## 5️⃣ user_preferences

사용자 개인 설정을 저장합니다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | NO | uuid_generate_v4() | Primary Key |
| user_id | UUID | NO | - | Foreign Key → users(id) |
| preferred_persona | VARCHAR(50) | YES | - | 선호 페르소나 |
| avatar_customization | JSONB | YES | {} | 아바타 커스터마이징 설정 |
| voice_enabled | BOOLEAN | NO | false | 음성 기능 활성화 |
| theme | VARCHAR(20) | NO | 'light' | UI 테마 ('light', 'dark') |
| language | VARCHAR(10) | NO | 'en' | 언어 설정 |
| created_at | TIMESTAMP | NO | NOW() | 생성 시간 |
| updated_at | TIMESTAMP | NO | NOW() | 수정 시간 |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (user_id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

---

## 🔗 관계 (Relationships)

```
users (1) ─────────────────── (N) conversations
  │                                    │
  │                                    │
  │                              (N) messages
  │
  └─ (1) user_preferences

chatbot_personas (1) ───────── (N) conversations
```

---

## 📊 데이터 볼륨 예상

**초기 (베타)**:
- Users: 100-1,000
- Conversations: 1,000-10,000
- Messages: 10,000-100,000

**1년 후**:
- Users: 10,000-100,000
- Conversations: 100,000-1M
- Messages: 1M-10M

---

## 🚀 성능 최적화

### Indexes
- `users.email` - 로그인 조회
- `conversations.user_id, updated_at` - 대화 목록
- `messages.conversation_id, created_at` - 메시지 조회

### Partitioning (향후)
- `messages` 테이블: created_at 기준 월별 파티셔닝

### Archiving
- 6개월 이상 비활성 대화 → 아카이브 테이블 이동

---

## 🔐 보안 고려사항

1. **비밀번호**: bcrypt 해싱 (rounds=12)
2. **민감 정보**: 암호화 필요 시 PostgreSQL pgcrypto 사용
3. **Row Level Security**: 사용자별 데이터 접근 제어

---

## 🔄 마이그레이션 전략

- **도구**: Alembic
- **버전 관리**: Git
- **롤백**: 모든 마이그레이션에 downgrade 스크립트 포함

---

**작성일**: 2026-02-09  
**버전**: 1.0
