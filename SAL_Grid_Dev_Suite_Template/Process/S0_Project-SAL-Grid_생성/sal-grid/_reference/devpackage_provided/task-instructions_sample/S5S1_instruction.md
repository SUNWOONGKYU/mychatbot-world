# Task Instruction - S5S1

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
S5S1

## Task Name
보안 점검 및 패치

## Task Goal
프로덕션 환경 취약점 스캔, 보안 패치 적용, 의존성 업데이트

## Prerequisites (Dependencies)
- S5O1 (배포상황 최종 검증) 완료

## Specific Instructions

### 1. 의존성 보안 취약점 점검

```bash
# npm audit 실행
npm audit

# 심각도별 취약점 확인
npm audit --audit-level=high

# 자동 수정 가능한 취약점 수정
npm audit fix

# 주요 업데이트가 필요한 경우
npm audit fix --force
```

### 2. 의존성 업데이트 스크립트
- 위치: `scripts/security-update.js`

```javascript
// scripts/security-update.js
const { execSync } = require('child_process');
const fs = require('fs');

function runSecurityCheck() {
    console.log('🔒 보안 점검 시작...\n');

    // 1. npm audit
    console.log('📦 npm 의존성 취약점 점검...');
    try {
        const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
        const audit = JSON.parse(auditResult);

        if (audit.metadata.vulnerabilities.total > 0) {
            console.log(`⚠️ 취약점 발견: ${audit.metadata.vulnerabilities.total}개`);
            console.log(`  - Critical: ${audit.metadata.vulnerabilities.critical}`);
            console.log(`  - High: ${audit.metadata.vulnerabilities.high}`);
            console.log(`  - Moderate: ${audit.metadata.vulnerabilities.moderate}`);
            console.log(`  - Low: ${audit.metadata.vulnerabilities.low}`);
        } else {
            console.log('✅ npm 취약점 없음');
        }
    } catch (error) {
        console.log('⚠️ npm audit 실행 실패');
    }

    // 2. 업데이트 가능한 패키지 확인
    console.log('\n📋 업데이트 가능한 패키지 확인...');
    try {
        execSync('npm outdated', { stdio: 'inherit' });
    } catch {
        // npm outdated는 업데이트가 있으면 exit code 1 반환
    }

    console.log('\n🔒 보안 점검 완료');
}

runSecurityCheck();
```

### 3. OWASP Top 10 점검 체크리스트

```markdown
## OWASP Top 10 체크리스트

### A01:2021 - Broken Access Control
- [ ] 인증 필요 API에 토큰 검증 적용
- [ ] 관리자 전용 라우트 권한 확인
- [ ] 사용자 데이터 접근 시 소유권 확인

### A02:2021 - Cryptographic Failures
- [ ] HTTPS 강제 적용
- [ ] 비밀번호 해싱 (Supabase Auth 자동)
- [ ] API 키/시크릿 환경변수 저장

### A03:2021 - Injection
- [ ] SQL Injection 방지 (Supabase 파라미터화 쿼리)
- [ ] XSS 방지 (입력 값 이스케이프)
- [ ] CSRF 토큰 적용 (필요시)

### A04:2021 - Insecure Design
- [ ] Rate Limiting 적용
- [ ] 입력 값 유효성 검사
- [ ] 에러 메시지에 민감 정보 미포함

### A05:2021 - Security Misconfiguration
- [ ] 보안 헤더 설정 (vercel.json)
- [ ] CORS 설정 확인
- [ ] 디버그 모드 비활성화

### A06:2021 - Vulnerable Components
- [ ] npm audit 실행
- [ ] 오래된 의존성 업데이트
- [ ] 알려진 취약점 패치

### A07:2021 - Identification Failures
- [ ] 세션 타임아웃 설정
- [ ] 비밀번호 정책 적용
- [ ] 다중 로그인 시도 차단

### A08:2021 - Software Integrity Failures
- [ ] Subresource Integrity (SRI) 적용
- [ ] 패키지 무결성 확인

### A09:2021 - Logging Failures
- [ ] 보안 이벤트 로깅
- [ ] 로그에 민감 정보 미포함
- [ ] 로그 정기 모니터링

### A10:2021 - Server-Side Request Forgery
- [ ] 외부 URL 요청 시 화이트리스트 적용
- [ ] 사용자 입력 URL 검증
```

### 4. 보안 헤더 확인
```bash
# 보안 헤더 테스트
curl -I https://ssalworks.ai.kr

# 기대 결과:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: ...
```

### 5. 코드 보안 스캔
- 위치: `scripts/code-scan.js`

```javascript
// scripts/code-scan.js
const fs = require('fs');
const path = require('path');

// 민감한 패턴 검색
const SENSITIVE_PATTERNS = [
    { pattern: /sk-ant-api[a-zA-Z0-9-_]+/g, name: 'Anthropic API Key' },
    { pattern: /(test_sk_|live_sk_)[a-zA-Z0-9]+/g, name: 'Toss Secret Key' },
    { pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, name: 'JWT Token' },
    { pattern: /service_role[_\s]*[=:]\s*["']?[a-zA-Z0-9_-]+/gi, name: 'Service Role' },
    { pattern: /password[_\s]*[=:]\s*["'][^"']+["']/gi, name: 'Hardcoded Password' }
];

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    SENSITIVE_PATTERNS.forEach(({ pattern, name }) => {
        const matches = content.match(pattern);
        if (matches) {
            issues.push({ file: filePath, type: name, count: matches.length });
        }
    });

    return issues;
}

function scanDirectory(dir, extensions = ['.js', '.ts', '.html', '.json']) {
    const issues = [];

    function scan(currentDir) {
        const items = fs.readdirSync(currentDir);

        for (const item of items) {
            if (item.startsWith('.') || item === 'node_modules') continue;

            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scan(fullPath);
            } else if (extensions.some(ext => item.endsWith(ext))) {
                issues.push(...scanFile(fullPath));
            }
        }
    }

    scan(dir);
    return issues;
}

// 실행
const issues = scanDirectory('./');
if (issues.length > 0) {
    console.error('⚠️ 보안 이슈 발견:');
    issues.forEach(issue => {
        console.error(`  - ${issue.file}: ${issue.type} (${issue.count}개)`);
    });
    process.exit(1);
} else {
    console.log('✅ 보안 스캔 통과');
}
```

### 6. 패치 적용 절차

```markdown
## 보안 패치 적용 절차

### 1. 패치 확인
- npm audit 실행
- 취약점 심각도 확인
- 패치 가용성 확인

### 2. 테스트 환경 적용
- 스테이징 환경에 패치 적용
- 기능 테스트 수행
- 회귀 테스트 수행

### 3. 프로덕션 배포
- 변경 사항 커밋
- PR 생성 및 리뷰
- 프로덕션 배포

### 4. 검증
- 배포 후 헬스체크
- 보안 헤더 확인
- 에러 로그 모니터링
```

## Expected Output Files
- `scripts/security-update.js`
- `scripts/code-scan.js`
- 보안 점검 보고서 (markdown)
- 패치 적용 기록

## Completion Criteria
- [ ] npm audit 취약점 0개 (critical/high)
- [ ] OWASP Top 10 체크리스트 완료
- [ ] 보안 헤더 설정 확인
- [ ] 코드 스캔 통과
- [ ] 패치 적용 완료
- [ ] 보안 점검 보고서 작성

## Tech Stack
- Node.js
- npm audit
- Vercel

## Task Agent
`security-specialist`

## Verification Agent
`security-auditor`

## Tools
- Write, Read
- Bash (보안 스캔)

## Execution Type
AI-Only (스크립트 작성) / Human-Assisted (패치 검토)

## Remarks
- 정기적인 보안 점검 권장 (월 1회)
- Critical/High 취약점 즉시 패치
- 패치 후 반드시 테스트 수행
- 보안 이벤트 로그 정기 확인

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S5S1 → `S5_개발_마무리/Security/`

### 제2 규칙: Production 코드는 이중 저장
- Security 문서는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
