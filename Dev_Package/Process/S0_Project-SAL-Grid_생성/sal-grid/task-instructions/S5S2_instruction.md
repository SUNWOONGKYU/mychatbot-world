# S5S2: 보안 취약점 신고 채널 구축

## Task 정보
- **Task ID**: S5S2
- **Task Name**: 보안 취약점 신고 채널 구축
- **Stage**: S5 (품질 개선)
- **Area**: S (Security)
- **Dependencies**: S4S1

## Task 목표

RFC 9116(security.txt) 표준에 따라 보안 취약점 신고 채널을 구축한다. 외부 보안 연구자가 취약점을 책임감 있게 신고할 수 있는 경로를 제공한다.

## 구현 범위

### 1. security.txt 파일
- 경로: `public/.well-known/security.txt`
- 포함 내용: Contact(이메일), Expires, Policy(URL), Preferred-Languages

### 2. 보안 정책 페이지
- 경로: `/security` 또는 `/security-policy`
- 취약점 신고 절차, 대응 SLA, 범위(in-scope/out-of-scope) 명시

### 3. 보안 문의 이메일 처리
- 보안 전용 이메일 주소 지정 (security@mychatbotworld.com 등)
- 자동 응답 템플릿

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `public/.well-known/security.txt` | RFC 9116 표준 security.txt 생성 |
| `app/security/page.tsx` | 보안 정책 페이지 신규 생성 |

## 완료 기준

- [ ] `/.well-known/security.txt` 접근 가능
- [ ] security.txt에 Contact, Expires, Policy 포함
- [ ] 보안 정책 페이지 접근 가능
- [ ] 신고 절차가 명확히 안내됨
