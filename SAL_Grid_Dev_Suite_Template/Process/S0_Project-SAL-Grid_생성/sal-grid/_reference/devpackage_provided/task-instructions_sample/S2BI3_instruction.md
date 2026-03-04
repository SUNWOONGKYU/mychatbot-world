# Task Instruction - S2BI3

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S2BI3

## Task Name
이메일 도메인 인증 (Resend)

## Task Goal
Resend에서 ssalworks.ai.kr 도메인을 인증하여 모든 수신자에게 이메일 발송 가능하도록 설정

## Prerequisites (Dependencies)
- S2BI1 (Resend 이메일 서비스 설정) 완료
- ssalworks.ai.kr 도메인 소유 (Whois 등록 완료)

## ⚠️ Human-AI Task 주의사항

이 Task는 **Human-AI** 유형입니다.
- **가이드 문서 작성만으로는 완료가 아닙니다!**
- **PO가 실제로 Whois DNS 설정을 완료해야 합니다!**
- **Resend 도메인 인증 완료 확인이 필수입니다!**

### 작업 절차
1. AI: 설정 가이드 제공
2. **PO: Resend에서 도메인 추가 (Human 필수)**
3. **PO: Whois DNS 고급설정에서 레코드 추가 (Human 필수)**
4. DNS 전파 대기 (6-48시간)
5. **Resend 도메인 인증 완료 확인 시에만 "완료" 처리**

## Specific Instructions

### 1. Resend에서 도메인 추가

**경로**: https://resend.com/domains

1. **Add Domain** 클릭
2. 도메인 입력: `ssalworks.ai.kr`
3. Resend가 요구하는 DNS 레코드 확인:

```
필요한 레코드 (Resend에서 제공):
- SPF 레코드 (TXT)
- DKIM 레코드 (CNAME 또는 TXT)
- 선택적: MX 레코드
```

### 2. Whois DNS 고급설정 접근

**⚠️ 중요: 일반 DNS 관리가 아닌 "네임서버 고급설정"을 사용해야 합니다!**

```
Whois 로그인
  ↓
도메인 관리
  ↓
부가서비스 → 네임서버 변경/부가서비스
  ↓
네임서버 고급설정
  ↓
- SPF(TXT) 레코드 관리
- CNAME 레코드 관리
```

### 3. DNS 레코드 추가 (Whois 고급설정)

#### SPF 레코드 (TXT)
```
호스트명: @ (또는 비워둠)
값: v=spf1 include:_spf.resend.com ~all
```

#### DKIM 레코드
Resend에서 제공하는 DKIM 값을 입력:
```
호스트명: resend._domainkey
값: (Resend Dashboard에서 복사)
```

### 4. DNS 전파 대기

- **소요 시간**: 6시간 ~ 48시간
- **확인 방법**:
```bash
# SPF 레코드 확인
nslookup -type=TXT ssalworks.ai.kr

# DKIM 레코드 확인
nslookup -type=TXT resend._domainkey.ssalworks.ai.kr
```

### 5. Resend 도메인 인증 확인

1. Resend Dashboard > Domains 접속
2. ssalworks.ai.kr 상태 확인
3. **"Verified"** (초록색 체크) 확인

### 6. 발신자 이메일 설정

도메인 인증 완료 후 사용 가능한 발신자:
```
noreply@ssalworks.ai.kr
support@ssalworks.ai.kr
hello@ssalworks.ai.kr
```

### 7. 코드 업데이트

도메인 인증 후 resend.js에서 발신자 변경:
```javascript
// 변경 전
from: 'onboarding@resend.dev'

// 변경 후
from: 'noreply@ssalworks.ai.kr'
```

## Expected Output Files
- `S2_개발-1차/Backend_Infra/RESEND_EMAIL_DOMAIN_WHOIS_DNS_SETUP.md` - Resend 이메일 도메인 Whois DNS 설정 가이드
- `S2_개발-1차/Backend_Infra/RESEND_DOMAIN_SETUP_REPORT.md` - 설정 완료 보고서
- Resend Dashboard에서 도메인 "Verified" 상태

## Completion Criteria
- [ ] Resend에 ssalworks.ai.kr 도메인 추가 **(PO 실행)**
- [ ] Whois DNS 고급설정에서 SPF 레코드 추가 **(PO 실행)**
- [ ] Whois DNS 고급설정에서 DKIM 레코드 추가 **(PO 실행)**
- [ ] DNS 전파 완료 확인
- [ ] **⭐ Resend 도메인 "Verified" 상태 확인 (필수!)**
- [ ] **⭐ noreply@ssalworks.ai.kr로 테스트 이메일 발송 성공 (필수!)**

## Tech Stack
- Resend
- Whois DNS
- DNS (SPF, DKIM)

## Task Agent
`devops-troubleshooter`

## Verification Agent
`qa-specialist`

## Tools
- WebFetch (Resend Dashboard, Whois)
- Bash (nslookup, dig)
- Write

## Execution Type
Human-AI (Whois DNS 설정 필요)

## Remarks
- 한국 .ai.kr 도메인은 Whois "네임서버 고급설정"에서만 TXT/CNAME 설정 가능
- 일반 DNS 관리 화면에서는 특수문자(_) 입력 불가
- DNS 전파에 최대 48시간 소요될 수 있음
- 도메인 인증 없이도 onboarding@resend.dev로 등록 이메일에는 발송 가능

## 참고 문서
- PoliticianFinder 도메인 설정 보고서: `P3BA30_Whois_Vercel_Domain_Setup_Report.md`

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S2BI3 → `S2_개발-1차/Backend_Infra/`

### 제2 규칙: Production 코드는 이중 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장
- BI는 Backend_Infra이므로 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
