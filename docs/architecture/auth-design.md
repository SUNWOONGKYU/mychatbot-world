# Authentication System Design

AI Avatar Chat Platform JWT 인증 시스템 설계 문서입니다.

---

## 🔐 인증 방식

**JWT (JSON Web Token)** 기반 인증 사용

- **Access Token**: 단기 토큰 (1시간)
- **Refresh Token**: 장기 토큰 (7일)

---

## 📋 JWT 토큰 구조

### Access Token

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "550e8400-e29b-41d4-a716-446655440000",  // user_id
    "email": "user@example.com",
    "username": "johndoe",
    "exp": 1707502800,  // 만료 시간 (1시간)
    "iat": 1707499200,  // 발급 시간
    "type": "access"
  },
  "signature": "..."
}
```

### Refresh Token

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "550e8400-e29b-41d4-a716-446655440000",
    "exp": 1708104000,  // 만료 시간 (7일)
    "iat": 1707499200,
    "type": "refresh"
  },
  "signature": "..."
}
```

---

## 🔄 인증 플로우

### 1. 회원가입 (Register)

```
Client → POST /api/v1/auth/register
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!"
}

Server:
1. 이메일/사용자명 중복 확인
2. 비밀번호 검증 (정책 확인)
3. bcrypt로 비밀번호 해싱 (rounds=12)
4. users 테이블에 저장
5. Access Token + Refresh Token 생성
6. 응답 반환

← 201 Created
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 2. 로그인 (Login)

```
Client → POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Server:
1. 이메일로 사용자 조회
2. 비밀번호 검증 (bcrypt.verify)
3. 계정 활성 상태 확인 (is_active)
4. last_login_at 업데이트
5. Access Token + Refresh Token 생성
6. 응답 반환

← 200 OK
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 3. 토큰 갱신 (Refresh)

```
Client → POST /api/v1/auth/refresh
{
  "refresh_token": "eyJhbGc..."
}

Server:
1. Refresh Token 검증
2. type="refresh" 확인
3. 만료 확인
4. 사용자 존재 및 활성 상태 확인
5. 새 Access Token 생성
6. (선택) 새 Refresh Token 생성 (Refresh Token Rotation)

← 200 OK
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",  // 새 Refresh Token (optional)
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 4. 보호된 엔드포인트 접근

```
Client → GET /api/v1/conversations
Authorization: Bearer eyJhbGc...

Server:
1. Authorization 헤더 확인
2. Access Token 추출
3. 서명 검증
4. 만료 확인
5. type="access" 확인
6. 사용자 정보 로드 (payload.sub)
7. 요청 처리

← 200 OK (또는 401 Unauthorized)
```

---

## 🔒 비밀번호 보안

### 해싱 알고리즘

**bcrypt** 사용 (passlib 라이브러리)

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 해싱
hashed = pwd_context.hash("SecurePass123!")
# $2b$12$...

# 검증
is_valid = pwd_context.verify("SecurePass123!", hashed)
```

**bcrypt rounds**: 12 (2^12 = 4,096 iterations)

### 비밀번호 정책

- 최소 길이: 8자
- 포함 필수:
  - 대문자 1개 이상
  - 소문자 1개 이상
  - 숫자 1개 이상
  - 특수문자 1개 이상 (권장)
- 금지:
  - 연속된 문자 3개 이상 (예: "aaa", "123")
  - 사용자명 포함
  - 일반적인 비밀번호 (top 10,000 목록)

---

## 🗄️ 토큰 저장

### 클라이언트 측

**권장 방법**:
1. **httpOnly Cookie** (CSRF 토큰과 함께) - 가장 안전
2. **LocalStorage** (XSS 위험 있음, 주의 필요)
3. **Memory** (새로고침 시 소실)

**예시 (httpOnly Cookie)**:
```python
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=True,  # HTTPS only
    samesite="lax",
    max_age=3600
)
```

### 서버 측

**Refresh Token 저장 (선택)**:
- 데이터베이스에 해시 저장
- Redis에 저장 (빠른 조회, TTL)
- 토큰 무효화 (로그아웃, 보안 이벤트) 지원

**예시 (Redis)**:
```python
# 저장
redis.setex(f"refresh_token:{user_id}", 604800, token_hash)

# 조회
stored_hash = redis.get(f"refresh_token:{user_id}")

# 삭제 (로그아웃)
redis.delete(f"refresh_token:{user_id}")
```

---

## 🚫 로그아웃

### 클라이언트 측 로그아웃

```
Client → POST /api/v1/auth/logout

Server:
1. Access Token에서 user_id 추출
2. Redis에서 Refresh Token 삭제
3. (선택) 블랙리스트에 Access Token 추가 (만료 전까지)

← 204 No Content
```

### 토큰 블랙리스트 (선택)

```python
# Redis에 저장 (TTL = 남은 유효 시간)
redis.setex(f"blacklist:{token}", remaining_seconds, "1")

# 검증 시 확인
is_blacklisted = redis.exists(f"blacklist:{token}")
```

---

## 🔄 Refresh Token Rotation

보안 강화를 위해 **Refresh Token Rotation** 사용 (선택):

1. Refresh Token 사용 시마다 새 Refresh Token 발급
2. 이전 Refresh Token 무효화
3. 토큰 재사용 감지 → 모든 토큰 무효화

---

## 🛡️ 보안 고려사항

### 1. SECRET_KEY 관리
- 최소 32자 이상
- 환경 변수로 관리
- 프로덕션에서는 Key Management Service 사용 (AWS KMS, Vault)

### 2. 토큰 탈취 대응
- 짧은 Access Token 유효기간 (1시간)
- Refresh Token Rotation
- IP 변경 감지 (선택)
- 디바이스 핑거프린팅 (선택)

### 3. HTTPS 필수
- 모든 인증 관련 통신은 HTTPS
- Secure 쿠키 플래그

### 4. Rate Limiting
- 로그인: 5 attempts / 15분
- 회원가입: 3 attempts / 시간
- Refresh: 10 attempts / 시간

---

## 📊 인증 상태 관리

### 프론트엔드

```javascript
// Zustand 스토어 예시
const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  
  login: async (email, password) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    set({ 
      user: data.user,
      accessToken: data.access_token,
      isAuthenticated: true
    });
  },
  
  logout: () => {
    set({ user: null, accessToken: null, isAuthenticated: false });
  }
}));
```

---

## 🧪 테스트 시나리오

1. ✅ 회원가입 성공
2. ✅ 이메일 중복 확인
3. ✅ 비밀번호 정책 위반
4. ✅ 로그인 성공
5. ✅ 잘못된 비밀번호
6. ✅ 비활성 계정 로그인 거부
7. ✅ Access Token 검증
8. ✅ 만료된 토큰 거부
9. ✅ Refresh Token으로 갱신
10. ✅ 로그아웃 후 토큰 무효화

---

**작성일**: 2026-02-09  
**버전**: 1.0
