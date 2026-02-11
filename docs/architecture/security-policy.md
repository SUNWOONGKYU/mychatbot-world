# Security Policy

AI Avatar Chat Platform 보안 정책 문서입니다.

---

## 🛡️ 보안 원칙

1. **Defense in Depth** - 다층 방어
2. **Least Privilege** - 최소 권한 원칙
3. **Fail Secure** - 안전한 실패
4. **Secure by Default** - 기본적으로 안전하게

---

## 🔒 인증 및 권한

### 비밀번호 정책

**요구사항**:
- 최소 길이: 8자
- 대문자 1개 이상
- 소문자 1개 이상
- 숫자 1개 이상
- 특수문자 1개 이상 (권장)

**금지 사항**:
- 연속된 동일 문자 3개 이상
- 사용자명 포함
- 일반적인 비밀번호 (top 10,000)
- 이전 비밀번호 재사용 (최근 5개)

**저장**:
- bcrypt (rounds=12)
- 절대 평문 저장 금지
- 로그에 비밀번호 노출 금지

### 세션 관리

**JWT 토큰**:
- Access Token: 1시간
- Refresh Token: 7일
- SECRET_KEY: 최소 32자

**쿠키 설정**:
- httpOnly: true
- secure: true (HTTPS)
- sameSite: "lax"

### 계정 잠금

**로그인 실패**:
- 5회 실패 → 15분 잠금
- 10회 실패 → 1시간 잠금
- 20회 실패 → 관리자 검토

---

## 🚦 Rate Limiting

### API 엔드포인트

| 엔드포인트 | 인증 없음 | 인증 있음 |
|------------|-----------|-----------|
| `/api/v1/auth/register` | 3/시간 | - |
| `/api/v1/auth/login` | 5/15분 | - |
| `/api/v1/auth/refresh` | 10/시간 | 10/시간 |
| `/api/v1/chat` | 10/분 | 100/분 |
| `/api/v1/conversations` | - | 200/분 |
| `/ws/chat` | - | 20 msg/분 |

### WebSocket

- 연결당 최대 메시지: 20/분
- 사용자당 최대 연결: 3개
- 메시지 크기: 최대 10KB

---

## 🌐 CORS (Cross-Origin Resource Sharing)

### 개발 환경

```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]
```

### 프로덕션 환경

```python
CORS_ORIGINS = [
    "https://yourdomain.com",
    "https://app.yourdomain.com",
]
```

**설정**:
- Allow Credentials: true
- Allowed Methods: GET, POST, PUT, DELETE, PATCH
- Allowed Headers: Content-Type, Authorization
- Max Age: 3600

---

## 🔐 데이터 보호

### 민감 정보 암호화

**암호화 필요 항목**:
- 비밀번호 (bcrypt)
- API 키 (database encryption)
- 개인 식별 정보 (PII)

**암호화 불필요**:
- 공개 데이터 (사용자명, 대화 ID)
- 로그 (단, 민감 정보 제외)

### 데이터 전송

- **HTTPS 필수** (TLS 1.2+)
- 민감 데이터는 POST body에 (URL 파라미터 금지)
- 로그에 민감 정보 노출 금지

### 데이터 저장

- PostgreSQL 데이터 암호화 (at rest)
- 정기적 백업 (암호화)
- 90일 이상 비활성 계정 아카이브

---

## 🚨 입력 검증

### 서버 측 검증 (필수)

**모든 입력 검증**:
- 타입 검증 (Pydantic)
- 길이 제한
- 형식 검증 (이메일, URL)
- 화이트리스트 방식

**SQL Injection 방어**:
- ORM 사용 (SQLAlchemy)
- Prepared Statements
- 직접 SQL 금지

**XSS 방어**:
- HTML 이스케이프
- Content-Type 헤더 명시
- CSP (Content Security Policy)

**CSRF 방어**:
- CSRF 토큰
- SameSite 쿠키
- Origin 검증

---

## 📝 로깅 및 모니터링

### 보안 이벤트 로깅

**로그 필수 항목**:
- 로그인 성공/실패
- 비밀번호 변경
- 계정 생성/삭제
- 권한 변경
- API 오류 (4xx, 5xx)

**로그 금지 항목**:
- 비밀번호 (평문)
- 토큰 (전체)
- 신용카드 번호
- API 키

### 모니터링

- 비정상적인 로그인 시도
- Rate limit 초과
- API 에러 급증
- 응답 시간 증가

---

## 🔍 취약점 관리

### 정기 점검

- **주간**: 의존성 취약점 스캔
- **월간**: 보안 코드 리뷰
- **분기**: 침투 테스트
- **연간**: 외부 보안 감사

### 의존성 관리

```bash
# 취약점 스캔
pip-audit

# 업데이트
pip list --outdated
pip install -U package_name
```

### 보안 업데이트

- Critical: 24시간 이내 패치
- High: 7일 이내 패치
- Medium: 30일 이내 패치

---

## 🚨 사고 대응

### 보안 사고 시나리오

1. **토큰 탈취**
   - 모든 사용자 세션 무효화
   - SECRET_KEY 변경
   - 사용자에게 비밀번호 재설정 요청

2. **데이터베이스 침해**
   - 즉시 서비스 중단
   - 백업에서 복원
   - 사용자 통지

3. **DDoS 공격**
   - Rate limiting 강화
   - CDN/WAF 활성화
   - 트래픽 분석

### 연락처

- **보안 이메일**: security@example.com
- **긴급 전화**: [추가 예정]

---

## 📊 보안 체크리스트

### 배포 전

- [ ] 모든 API 키를 환경 변수로
- [ ] DEBUG=false
- [ ] HTTPS 설정
- [ ] CORS 설정 확인
- [ ] Rate limiting 활성화
- [ ] 보안 헤더 설정
- [ ] 로깅 설정 확인
- [ ] 백업 설정

### 운영 중

- [ ] 주간 의존성 스캔
- [ ] 월간 로그 검토
- [ ] 분기 침투 테스트
- [ ] 연간 보안 감사

---

## 🔗 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Python Security Best Practices](https://python.readthedocs.io/en/stable/library/security_warnings.html)

---

**작성일**: 2026-02-09  
**버전**: 1.0  
**검토 주기**: 분기별
