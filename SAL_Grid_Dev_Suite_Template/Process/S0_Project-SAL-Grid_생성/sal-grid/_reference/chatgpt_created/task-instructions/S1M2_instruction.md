# S1M2: API 문서 템플릿 작성

> **Task ID**: S1M2  
> **Task Name**: API 문서 템플릿 작성  
> **Stage**: S1 (개발 준비)  
> **Area**: M (Documentation)  
> **Agent**: doc-writer  
> **Dependencies**: S1M1

---

## 🎯 Task 목표

FastAPI와 함께 사용할 OpenAPI 스펙 템플릿을 작성하고, API 문서 구조를 정의합니다.

---

## 📋 작업 내용

### 1. OpenAPI 스펙 템플릿 작성

**위치**: `docs/api/openapi-template.yaml`

**포함 내용**:
- OpenAPI 3.0 기본 구조
- 서버 정보
- 인증 스키마 (JWT Bearer)
- 주요 엔드포인트 템플릿:
  - `/api/v1/auth/` (인증)
  - `/api/v1/chat/` (채팅)
  - `/api/v1/conversations/` (대화 관리)
  - `/ws/chat` (WebSocket)

### 2. API 문서 가이드 작성

**위치**: `docs/api/README.md`

**포함 내용**:
- API 개요
- 인증 방법
- 요청/응답 형식
- 에러 코드 목록
- 버전 관리 정책

### 3. 예시 API 명세서

**위치**: `docs/api/examples/chat-endpoint.md`

**포함 내용**:
- 엔드포인트 설명
- Request/Response 예시 (JSON)
- cURL 예시
- Python/JavaScript 클라이언트 예시

---

## ✅ 완료 조건

- [ ] `openapi-template.yaml` 작성 완료
- [ ] `docs/api/README.md` 작성 완료
- [ ] 예시 API 명세서 작성 완료
- [ ] FastAPI 자동 문서화 설정 확인

---

## 📝 산출물

1. `docs/api/openapi-template.yaml`
2. `docs/api/README.md`
3. `docs/api/examples/chat-endpoint.md`

---

## 🔍 참고 사항

- OpenAPI 3.0 스펙 준수
- FastAPI 자동 문서화와 호환
- Swagger UI에서 테스트 가능하도록 구성

---

**작성일**: 2026-02-09  
**작성자**: 써니봇2
