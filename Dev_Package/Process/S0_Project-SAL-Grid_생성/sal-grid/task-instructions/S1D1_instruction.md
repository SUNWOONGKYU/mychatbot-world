# S1D1: 데이터베이스 스키마 설계

> **Task ID**: S1D1  
> **Task Name**: 데이터베이스 스키마 설계  
> **Stage**: S1 (개발 준비)  
> **Area**: D (Database)  
> **Agent**: backend-developer  
> **Dependencies**: -

---

## 🎯 Task 목표

PostgreSQL 데이터베이스 스키마를 설계하고, ERD와 SQL DDL을 작성합니다.

---

## 📋 작업 내용

### 1. 데이터베이스 스키마 설계 문서

**위치**: `docs/architecture/database-schema.md`

**포함 테이블**:
- `users` - 사용자 정보
- `conversations` - 대화 세션
- `messages` - 대화 메시지
- `chatbot_personas` - 챗봇 페르소나 정의
- `user_preferences` - 사용자 설정
- `api_keys` - API 키 관리 (선택)

### 2. ERD (Entity Relationship Diagram)

**위치**: `docs/architecture/erd.md` (또는 이미지)

**관계**:
- users 1:N conversations
- conversations 1:N messages
- chatbot_personas 1:N conversations

### 3. SQL DDL

**위치**: `sql/schema.sql`

**포함 내용**:
- CREATE TABLE 문
- Primary Key, Foreign Key 정의
- Index 정의
- 기본 데이터 INSERT (chatbot_personas)

---

## ✅ 완료 조건

- [ ] 데이터베이스 스키마 문서 작성
- [ ] ERD 작성
- [ ] SQL DDL 파일 작성
- [ ] 각 테이블에 주석 포함

---

## 📝 산출물

1. `docs/architecture/database-schema.md`
2. `docs/architecture/erd.md`
3. `sql/schema.sql`

---

## 🔍 참고 사항

- PostgreSQL 문법 사용
- UUID 타입 사용 (id 필드)
- created_at, updated_at 자동 관리
- 인덱스 최적화 고려

---

**작성일**: 2026-02-09  
**작성자**: 써니봇2
