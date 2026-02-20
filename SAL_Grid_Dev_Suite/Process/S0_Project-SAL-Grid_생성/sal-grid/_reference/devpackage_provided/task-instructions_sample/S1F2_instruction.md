# Task Instruction - S1F2

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
S1F2

## Task Name
vercel.json 설정

## Task Goal
Vercel 배포 설정, 라우팅, 보안 헤더, CORS 설정을 위한 vercel.json 파일 작성

## Prerequisites (Dependencies)
- S1F1 (Vercel 프로젝트 설정) 완료

## Specific Instructions

### 1. 파일 생성
- 위치: `P3_프로토타입_제작/Frontend/Prototype/vercel.json`

### 2. 기본 설정
```json
{
  "version": 2,
  "buildCommand": "",
  "outputDirectory": ".",
  "cleanUrls": true,
  "trailingSlash": false
}
```

### 3. 보안 헤더 설정
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### 4. API 라우팅 설정
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ]
}
```

### 5. CORS 설정 (API용)
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

### 6. 정적 파일 캐싱
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

## Expected Output Files
- `P3_프로토타입_제작/Frontend/Prototype/vercel.json`

## Completion Criteria
- [ ] vercel.json 파일 생성
- [ ] 보안 헤더 설정 완료
- [ ] CORS 설정 완료
- [ ] 라우팅 설정 완료
- [ ] Vercel 재배포 후 헤더 확인 (curl -I)
- [ ] JSON 문법 검증

## Tech Stack
- Vercel Configuration
- JSON

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Tools
- Write, Read
- Bash (curl로 헤더 확인)

## Execution Type
AI-Only

## Remarks
- CORS는 프로덕션에서 도메인 제한 필요 (S5O2 이후)
- 보안 헤더는 OWASP 권장사항 기반

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content

