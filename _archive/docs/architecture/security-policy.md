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

## CPC 원격 운용 보안 모델

Claude Platoons Control System(CPC)을 통한 원격 운용 시 적용되는 보안 모델입니다. (v21.0 + v22.0 Tailscale 추가)

### bypassPermissions 트레이드오프

**편의성 (설정)**:
- `settings.local.json` — `defaultMode: bypassPermissions`
- 모든 도구 호출에 대한 y/n 프롬프트 자동 허용
- 원격 운용 중 터미널이 사용자 입력 대기로 멈추지 않음
- CPC 명령이 무중단으로 자동 처리됨

**보안 위험**:
- 사람의 개입 없이 모든 파일 수정, 명령 실행 가능
- 악의적 CPC 명령이 주입될 경우 무조건 실행될 수 있음

**완화 조치**:
- PreToolUse Hook이 위험 명령을 가로채어 사람의 승인을 강제함 (아래 참조)
- CPC API 접근은 Supabase RLS + API 키로 제한됨

### PreToolUse Hook — 위험 명령 안전망

**Hook 위치**: `.claude/hooks/dangerous-cmd-approval.py`

**감지 패턴** (Bash 도구 호출 직전에 실행):

| 카테고리 | 패턴 |
|----------|------|
| 파일 삭제 | `rm`, `del`, `rmdir` |
| 프로세스 종료 | `taskkill` |
| Git 위험 작업 | `git push`, `git reset --hard` |
| 배포 | `vercel --prod` |
| DB 파괴적 쿼리 | `DROP TABLE`, `DELETE FROM` |
| 패키지 삭제 | `npm uninstall` |

**동작 흐름**:

```
Claude Code → Bash 도구 호출 시도
    │
    ▼
PreToolUse Hook 개입 (dangerous-cmd-approval.py)
    │ 위험 패턴 감지 여부 확인
    │
    ├─ [미감지] → 그대로 실행 허용
    │
    └─ [감지] → request_cpc_approval MCP 호출
                    │ CPC에 승인 요청 INSERT
                    │ 챗봇에 승인/거부 버튼 표시
                    ▼
               wait_cpc_approval MCP 호출 (최대 120초 대기)
                    │
                    ├─ [승인] → 명령 실행
                    ├─ [거부] → 명령 차단
                    └─ [120초 타임아웃] → 자동 거부 (fail-secure)
```

### CPC 승인 흐름 2가지

**승인 흐름 A — Hook 자동 감지 (시스템 강제)**:
- 소대장의 판단과 무관하게 Hook이 시스템 레벨에서 강제 개입
- 위험 패턴이 일치하면 반드시 사용자 승인을 받아야 실행됨

**승인 흐름 B — 소대장 판단 (수동 요청)**:
- 소대장이 작업 도중 사용자 확인이 필요하다고 판단할 때
- `request_cpc_approval` MCP 도구를 직접 호출
- 챗봇에 질문을 표시하고 응답을 받아 이후 작업을 결정

### 120초 타임아웃 — Fail-Secure 원칙

- 승인 요청 후 120초 이내에 응답이 없으면 자동으로 **거부** 처리
- 사용자가 자리를 비운 상태에서 위험 명령이 실행되는 것을 방지
- "안전한 실패(Fail Secure)" 원칙 적용 — 불확실한 경우 차단이 기본 동작

### MCP 도구 보안 고려사항

| 도구 | 보안 역할 |
|------|-----------|
| `wait_cpc_command` | CPC 인증된 명령만 수신 |
| `report_cpc_result` | 결과를 CPC에 기록 (감사 추적) |
| `send_cpc_message` | 소대장 → 챗봇 단방향 메시지 |
| `request_cpc_approval` | 위험 작업 전 사람 개입 강제 |
| `wait_cpc_approval` | 타임아웃 fail-secure 구현 |

### v22.0 Tailscale 보안 모델

#### Tailscale vs Vercel Relay 비교

| 항목 | Vercel Relay (현재 기본) | Tailscale Direct (v22.0 신규) |
|------|------------------------|-------------------------------|
| 트래픽 경유 | Vercel 서버 통과 (Vercel이 볼 수 있음) | WireGuard E2E (아무도 볼 수 없음) |
| 암호화 방식 | HTTPS (TLS, Vercel 종단) | WireGuard (양 PC 종단) |
| 레이턴시 | 클라우드 경유 (50ms+) | 직접 P2P 8ms |
| 가용성 | Vercel/Supabase 서비스 상태 의존 | 메시 노드만 온라인이면 동작 |
| 공개 접근 | 가능 (mychatbot.world 경유) | 가능 (Funnel 활성화 완료 — https://desktop-v1sft2a.tail47a0c9.ts.net) |

#### Tailscale Funnel 공개 접근 (활성화 완료)

- 공개 URL: `https://desktop-v1sft2a.tail47a0c9.ts.net`
- Funnel 활성화로 Home PC가 공개 인터넷에서 직접 접근 가능한 HTTPS 엔드포인트 보유
- Vercel relay를 경유하지 않으므로 트래픽이 Vercel 서버를 통과하지 않음
- 보안 고려사항: Funnel 엔드포인트에 대한 인증 레이어 설계 필요 (현재 Tailscale ACL이 1차 방어)

#### HTTP Bridge (cpc_http_bridge.py) 보안 고려사항

- 포트 8443은 Tailscale 메시 내부에만 노출 — 공개 인터넷 미노출
- Funnel URL(`desktop-v1sft2a.tail47a0c9.ts.net`)은 공개 접근 가능 — 추가 인증 레이어 권장
- HTTP Bridge는 내부 메시 통신 전용 — 인증 없이 동작하므로 Tailscale 접근 제어가 1차 방어선

#### Tailscale 접근 제어

- Tailscale ACL로 허가된 장치만 메시 참여 가능
- 새 장치 추가 시 admin 계정 승인 필요
- Funnel 활성화 완료 (2026-03-25)

---

## 로깅 및 모니터링 (v21.0 이전 기존)

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
**최종 업데이트**: 2026-03-25
**버전**: 1.2 (v22.1 Tailscale Funnel 활성화 완료 — 공개 URL 부여, 보안 고려사항 업데이트)
**검토 주기**: 분기별
