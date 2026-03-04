# S1O1: CI/CD 파이프라인 설정

> **Task ID**: S1O1  
> **Task Name**: CI/CD 파이프라인 설정  
> **Stage**: S1 (개발 준비)  
> **Area**: O (DevOps)  
> **Agent**: devops-engineer  
> **Dependencies**: S1BI1

---

## 🎯 Task 목표

GitHub Actions를 사용하여 자동 테스트, 린트, 빌드, 배포 파이프라인을 구축합니다.

---

## 📋 작업 내용

### 1. GitHub Actions 워크플로우

**위치**: `.github/workflows/`

**워크플로우**:
- `test.yml` - 자동 테스트 및 코드 품질 검사
- `deploy.yml` - 자동 배포
- `security.yml` - 보안 스캔 (선택)

### 2. 테스트 워크플로우

**트리거**: Push, Pull Request (main, develop)

**단계**:
1. 코드 체크아웃
2. Python 환경 설정
3. 의존성 설치
4. Lint (Black, Flake8, MyPy)
5. 테스트 실행 (pytest)
6. 커버리지 업로드

### 3. 배포 워크플로우

**트리거**: Push to main (태그)

**단계**:
1. 빌드
2. Docker 이미지 생성
3. 레지스트리에 푸시
4. 배포 (선택)

---

## ✅ 완료 조건

- [ ] test.yml 작성
- [ ] deploy.yml 작성
- [ ] 워크플로우 테스트 성공

---

## 📝 산출물

1. `.github/workflows/test.yml`
2. `.github/workflows/deploy.yml`
3. `docs/developer/ci-cd-guide.md`

---

## 🔍 참고 사항

- GitHub Actions 공식 문서
- Secrets 관리

---

**작성일**: 2026-02-09  
**작성자**: 써니봇2
