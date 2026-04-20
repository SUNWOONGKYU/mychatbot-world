# S5S2 검증 지침: 보안 취약점 신고 채널 구축

## 검증 에이전트
`code-reviewer-core`

## 검증 항목

### 1. security.txt 접근
- [ ] `/.well-known/security.txt` 응답 200
- [ ] `Contact:` 필드 포함
- [ ] `Expires:` 필드 포함 (유효 날짜)
- [ ] `Policy:` 필드 포함

### 2. 보안 정책 페이지
- [ ] `/security` 라우트 접근 가능
- [ ] 취약점 신고 절차 명시
- [ ] 담당자 연락처 또는 이메일 명시

### 3. RFC 9116 형식 준수
- [ ] UTF-8 인코딩
- [ ] 각 필드가 `Field: value` 형식

## 합격 기준
위 모든 항목 Pass 시 Verified 처리
