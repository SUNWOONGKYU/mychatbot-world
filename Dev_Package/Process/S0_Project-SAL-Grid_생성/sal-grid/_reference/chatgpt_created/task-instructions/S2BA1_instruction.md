# S2BA1: FastAPI 기본 구조 설정

> **Task ID**: S2BA1  
> **Task Name**: FastAPI 기본 구조 설정  
> **Stage**: S2 (개발 1차)  
> **Area**: BA (Backend_APIs)  
> **Agent**: backend-developer  
> **Dependencies**: S1BI1, S1BI2

---

## 🎯 Task 목표

FastAPI 애플리케이션의 기본 구조를 설정하고 라우터를 구성합니다.

---

## 📋 작업 내용

### 1. FastAPI 앱 생성
- `app/main.py` - 메인 애플리케이션
- CORS, 미들웨어 설정
- Health check 엔드포인트

### 2. 설정 관리
- `app/config.py` - 환경 변수 로드

### 3. 라우터 구조
- `app/api/v1/router.py` - API v1 라우터

---

## ✅ 완료 조건

- [ ] FastAPI 앱 실행 성공
- [ ] `/health` 엔드포인트 작동
- [ ] CORS 설정 완료

---

**작성일**: 2026-02-09
