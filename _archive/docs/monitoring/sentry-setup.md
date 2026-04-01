# Sentry Monitoring Setup

Sentry 에러 추적 설정 가이드입니다.

---

## 🔧 설정

### 1. Sentry 프로젝트 생성

https://sentry.io → 새 프로젝트 생성

### 2. 백엔드 통합

```python
# app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment=settings.ENVIRONMENT,
    traces_sample_rate=1.0 if settings.DEBUG else 0.1,
    integrations=[FastApiIntegration()]
)
```

### 3. 프론트엔드 통합

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

---

## 📊 대시보드

- **Issues**: 에러 발생 추적
- **Performance**: 응답 시간 모니터링
- **Releases**: 배포 추적

---

**목표**: 에러 0개, 평균 응답 시간 < 500ms
