# S1M1: 프로젝트 문서화 설정

> **Task ID**: S1M1  
> **Task Name**: 프로젝트 문서화 설정  
> **Stage**: S1 (개발 준비)  
> **Area**: M (Documentation)  
> **Agent**: doc-writer

---

## 🎯 Task 목표

프로젝트 루트에 기본 문서 구조를 설정하고, README.md와 CONTRIBUTING.md를 작성합니다.

---

## 📋 작업 내용

### 1. README.md 작성

**위치**: `프로젝트 루트/README.md`

**포함 내용**:
- 프로젝트 개요 (한 줄 소개)
- 주요 기능 (6가지 챗봇 페르소나)
- 기술 스택
- 빠른 시작 가이드
- 폴더 구조 개요
- 라이선스

**형식**: Markdown

---

### 2. CONTRIBUTING.md 작성

**위치**: `프로젝트 루트/CONTRIBUTING.md`

**포함 내용**:
- 기여 방법
- 브랜치 전략 (main, develop, feature/*)
- 커밋 메시지 규칙
- Pull Request 프로세스
- 코딩 스타일 가이드

---

### 3. docs/ 폴더 구조 생성

**위치**: `프로젝트 루트/docs/`

**폴더**:
```
docs/
├── api/              # API 문서
├── architecture/     # 아키텍처 문서
├── user-guide/       # 사용자 가이드
└── developer/        # 개발자 문서
```

각 폴더에 `.gitkeep` 파일 생성

---

## ✅ 완료 조건

- [ ] README.md 작성 완료
- [ ] CONTRIBUTING.md 작성 완료
- [ ] docs/ 폴더 구조 생성
- [ ] Git에 커밋

---

## 📝 산출물

1. `README.md`
2. `CONTRIBUTING.md`
3. `docs/` 폴더 (하위 폴더 포함)

---

## 🔍 참고 사항

- README는 신규 개발자가 5분 내 이해할 수 있도록 작성
- CONTRIBUTING은 명확하고 간결하게
- 기존 P0~P3, S0 문서 내용 참고

---

**작성일**: 2026-02-09  
**작성자**: 써니봇2
