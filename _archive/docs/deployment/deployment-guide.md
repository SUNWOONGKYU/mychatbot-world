# Deployment Guide

프로덕션 배포 가이드입니다.

---

## 🚀 배포 방법

### Option 1: Vercel (프론트엔드) + Railway (백엔드)

**프론트엔드 (Vercel)**:
```bash
cd src/frontend
vercel --prod
```

**백엔드 (Railway)**:
```bash
railway login
railway init
railway up
```

### Option 2: AWS (전체 스택)

**Terraform으로 인프라 구축**:
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

### Option 3: Docker Compose (간단 배포)

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📋 배포 전 체크리스트

- [ ] 모든 테스트 통과
- [ ] 환경 변수 설정 (.env)
- [ ] DATABASE_URL 설정
- [ ] SECRET_KEY 변경 (32자 이상)
- [ ] CORS_ORIGINS 업데이트
- [ ] DEBUG=false 설정
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 백업 설정
- [ ] 모니터링 설정 (Sentry 등)

---

## 🔄 배포 프로세스

1. **코드 푸시** → GitHub
2. **CI/CD 실행** → GitHub Actions
3. **테스트** → 자동 실행
4. **빌드** → Docker 이미지
5. **배포** → 프로덕션 환경
6. **검증** → Health check

---

## 📊 모니터링

- **Sentry**: 에러 추적
- **Grafana**: 메트릭 대시보드
- **CloudWatch/DataDog**: 로그

---

**배포 소요 시간**: 약 10-15분
