# Verification Instruction - S5S1

---

## Task ID
S5S1

## Task Name
보안 점검 및 패치

## Verification Agent
security-auditor

## Verification Criteria

### 1. 보안 점검 수행 확인
- [ ] OWASP Top 10 체크리스트 점검
- [ ] 인증/인가 취약점 점검
- [ ] 입력 검증 취약점 점검
- [ ] API 보안 점검

### 2. 발견된 취약점 분류
- [ ] Critical (즉시 수정 필요)
- [ ] High (24시간 내 수정)
- [ ] Medium (1주 내 수정)
- [ ] Low (다음 배포 시 수정)

### 3. 취약점 패치 확인
- [ ] Critical 취약점 100% 패치
- [ ] High 취약점 100% 패치
- [ ] 패치 내역 문서화

### 4. 보안 헤더 검증
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security 설정
- [ ] Content-Security-Policy 설정

### 5. 의존성 보안 점검
- [ ] npm audit 실행
- [ ] 취약한 패키지 업데이트
- [ ] 불필요한 의존성 제거

### 6. 보안 점검 보고서 확인
- [ ] 점검 일자
- [ ] 발견된 취약점 목록
- [ ] 조치 내역
- [ ] 잔존 위험 평가

## Test Commands
```bash
# 의존성 보안 점검
npm audit

# 보안 헤더 확인
curl -I https://ssalworks.ai.kr | grep -E "X-Content|X-Frame|Strict|Content-Security"

# HTTPS 확인
curl -vI https://ssalworks.ai.kr 2>&1 | grep -i ssl

# 보안 점검 스크립트 실행
node scripts/security-check.js
```

## Build Verification
- [ ] 빌드 성공
- [ ] 보안 관련 경고 없음
- [ ] 보안 테스트 통과

## Integration Verification
- [ ] S5O1 프로덕션 배포 후 점검
- [ ] S1S1 기본 보안 설정과 일관성
- [ ] 외부 보안 스캔 도구 점검

## Expected Files
- S5_개발_마무리/Security/SECURITY_AUDIT_REPORT.md
- S5_개발_마무리/Security/VULNERABILITY_PATCHES.md

## Pass Criteria
- Critical/High 취약점 100% 패치
- 보안 헤더 전체 설정
- npm audit 취약점 0개

---

## 저장 위치 검증 항목
- [ ] S5_개발_마무리/Security/ 폴더에 보고서 저장되었는가?

