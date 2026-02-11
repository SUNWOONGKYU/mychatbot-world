# CI/CD Guide

GitHub Actions를 사용한 CI/CD 파이프라인 가이드입니다.

---

## 🔄 CI/CD 파이프라인 개요

### 워크플로우

1. **test.yml** - 자동 테스트 및 코드 품질
2. **deploy.yml** - Docker 빌드 및 배포
3. **dependency-review.yml** - 의존성 보안 검토

---

## 📋 test.yml - 테스트 워크플로우

### 트리거

- **Push**: `main`, `develop` 브랜치
- **Pull Request**: `main`, `develop` 브랜치

### Jobs

#### 1. test-backend
- Python 3.11 환경 설정
- PostgreSQL 15, Redis 7 서비스 실행
- 의존성 설치
- 코드 품질 검사:
  - Black (포맷팅)
  - isort (import 정렬)
  - Flake8 (린트)
  - MyPy (타입 체크)
- 데이터베이스 마이그레이션
- pytest 테스트 실행 (커버리지 포함)
- Codecov 업로드

#### 2. test-frontend
- Node.js 18 환경 설정
- npm 의존성 설치
- ESLint (린트)
- Prettier (포맷 체크)
- Jest 테스트 실행
- 커버리지 업로드

#### 3. security-scan
- Trivy 보안 스캔
- 취약점 리포트 업로드

---

## 🚀 deploy.yml - 배포 워크플로우

### 트리거

- **Push to main** - 자동 배포
- **Tags (v*)** - 릴리스 배포
- **Manual** - 수동 트리거

### Jobs

#### 1. build-and-push
- Docker Buildx 설정
- GitHub Container Registry 로그인
- Docker 이미지 빌드
- 이미지 푸시 (태그: branch, version, sha)

#### 2. deploy-staging
- **조건**: `develop` 브랜치 푸시
- **환경**: staging
- 스테이징 서버에 배포

#### 3. deploy-production
- **조건**: `v*` 태그 푸시
- **환경**: production
- 프로덕션 서버에 배포
- GitHub Release 생성

---

## 🔐 Secrets 설정

GitHub Repository → Settings → Secrets and variables → Actions

### 필수 Secrets

| Secret 이름 | 설명 | 예시 |
|-------------|------|------|
| `ANTHROPIC_API_KEY` | Claude API 키 | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API 키 (선택) | `sk-...` |
| `STAGING_DEPLOY_KEY` | 스테이징 배포 키 | SSH 키 또는 토큰 |
| `PRODUCTION_DEPLOY_KEY` | 프로덕션 배포 키 | SSH 키 또는 토큰 |

### 선택 Secrets

- `CODECOV_TOKEN` - Codecov 업로드용
- `SENTRY_AUTH_TOKEN` - Sentry 통합
- `DOCKER_REGISTRY_TOKEN` - 외부 레지스트리 사용 시

---

## 🏷️ 브랜치 전략

```
main (프로덕션)
  ↑ PR + 승인
develop (개발)
  ↑ PR
feature/S2BA1-chat-api (기능 개발)
```

### 브랜치별 동작

**main**:
- PR 머지 시: 테스트 실행
- 푸시 시: 빌드 + 배포 (자동)
- 태그 푸시 시: 프로덕션 배포 + Release

**develop**:
- PR 머지 시: 테스트 실행
- 푸시 시: 스테이징 배포

**feature/***:
- PR 생성 시: 테스트 실행
- Dependency review

---

## 📦 릴리스 프로세스

### 1. 버전 태그 생성

```bash
# 버전 번호 결정 (Semantic Versioning)
# MAJOR.MINOR.PATCH (예: 1.0.0)

git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 2. 자동 프로세스

1. GitHub Actions 트리거
2. Docker 이미지 빌드 (태그: v1.0.0, 1.0, latest)
3. 이미지 푸시 (GitHub Container Registry)
4. 프로덕션 환경 배포
5. GitHub Release 생성 (자동 릴리스 노트)

### 3. 확인

- Actions 탭에서 워크플로우 실행 확인
- Releases 탭에서 릴리스 확인
- 프로덕션 환경 동작 확인

---

## 🧪 로컬에서 워크플로우 테스트

### act 사용 (GitHub Actions Local Runner)

```bash
# act 설치
# Windows (Chocolatey):
choco install act-cli

# macOS:
brew install act

# 워크플로우 실행
act -j test-backend

# 특정 이벤트 시뮬레이션
act push
act pull_request
```

### Docker Compose로 테스트 환경

```bash
# CI 환경과 동일하게 테스트
docker-compose -f docker-compose.yml -f docker-compose.test.yml up
```

---

## 🔍 트러블슈팅

### 테스트 실패

**증상**: pytest 실패

**확인 사항**:
1. 로컬에서 테스트 통과 확인
2. PostgreSQL/Redis 서비스 헬스체크
3. 환경 변수 설정 확인

```bash
# 로컬 테스트
cd src/backend
pytest
```

### 빌드 실패

**증상**: Docker 이미지 빌드 실패

**확인 사항**:
1. Dockerfile 문법
2. 의존성 설치 오류
3. 빌드 로그 확인

```bash
# 로컬 빌드 테스트
cd src/backend
docker build -t test-build .
```

### 배포 실패

**증상**: 배포 단계 실패

**확인 사항**:
1. Secrets 설정 확인
2. 배포 스크립트 권한
3. 대상 서버 접근 가능 여부

---

## 📊 모니터링

### GitHub Actions

- **Actions 탭**: 워크플로우 실행 이력
- **Status 뱃지**: README에 추가

```markdown
![Test](https://github.com/username/repo/actions/workflows/test.yml/badge.svg)
![Deploy](https://github.com/username/repo/actions/workflows/deploy.yml/badge.svg)
```

### Codecov

- 커버리지 리포트: https://codecov.io/gh/username/repo
- PR 코멘트에 자동 표시

---

## 🎯 Best Practices

### 1. 빠른 피드백
- 린트/포맷 체크를 먼저 실행 (빠름)
- 테스트는 병렬로 실행
- 캐시 활용 (pip, npm)

### 2. 보안
- Secrets 절대 하드코딩 금지
- 최소 권한 원칙
- Dependency review 활성화

### 3. 안정성
- 스테이징 환경에서 먼저 테스트
- 롤백 계획 준비
- 모니터링 설정

### 4. 효율성
- Docker 레이어 캐싱
- 조건부 실행 (changed-files)
- 병렬 job 실행

---

## 📚 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Docker Buildx](https://docs.docker.com/buildx/working-with-buildx/)
- [Semantic Versioning](https://semver.org/)

---

**작성일**: 2026-02-09  
**버전**: 1.0
