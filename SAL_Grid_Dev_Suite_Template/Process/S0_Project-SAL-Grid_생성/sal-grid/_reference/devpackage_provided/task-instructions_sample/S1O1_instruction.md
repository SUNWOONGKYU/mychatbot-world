# Task Instruction - S1O1

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
S1O1

## Task Name
DNS 설정 및 도메인 연결

## Task Goal
커스텀 도메인 DNS 설정 및 Vercel 프로젝트에 연결

## Prerequisites (Dependencies)
- 없음 (독립 Task)
- 도메인 구매 완료

## Specific Instructions

### 1. 도메인 현황 확인
- 구매한 도메인 확인
- 도메인 등록 업체 (Registrar) 확인
- DNS 관리 패널 접속 방법 확인

### 2. Vercel DNS 레코드 설정
- Vercel 연결에 필요한 레코드:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Vercel 프로젝트에 도메인 연결
- Vercel Dashboard → 프로젝트 선택
- Settings → Domains
- 도메인 추가 및 DNS 검증

### 4. DNS 전파 확인
```bash
# A 레코드 확인
dig @8.8.8.8 [도메인] A

# CNAME 확인
dig @8.8.8.8 www.[도메인] CNAME

# 또는 온라인 도구
# https://www.whatsmydns.net/
```

### 5. SSL 인증서 확인
- Vercel에서 자동 발급
- HTTPS 접속 확인

## Expected Output Files
- `S1_개발_준비/DevOps/DNS_SETUP.md` (선택)

## Completion Criteria
- [ ] DNS 레코드 설정 완료
- [ ] Vercel에 도메인 연결 완료
- [ ] DNS 전파 완료 (사이트 접속 가능)
- [ ] SSL 인증서 적용 확인 (HTTPS)

## Tech Stack
- DNS
- Vercel
- Domain Management

## Task Agent
`devops-troubleshooter`

## Verification Agent
`qa-specialist`

## Tools
- Vercel Dashboard
- 도메인 등록 업체 DNS 관리 패널

## Execution Type
Human-AI (도메인 등록 업체 및 Vercel 접속 필요)

## Remarks
- DNS 전파에 최대 48시간 소요 가능 (보통 몇 시간)
- OAuth, 이메일 등 외부 서비스 테스트에 실제 도메인 필요
- S2 개발 전에 완료 권장

---

## 완료 상태 (2025-12-17)

**Status: ✅ 완료**

- 도메인: ssalworks.ai.kr
- 등록업체: 후이즈
- Vercel 연결: 완료
- SSL: 자동 적용됨
- 테스트: Google OAuth 정상 작동 확인

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1O1 → `S1_개발_준비/DevOps/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
