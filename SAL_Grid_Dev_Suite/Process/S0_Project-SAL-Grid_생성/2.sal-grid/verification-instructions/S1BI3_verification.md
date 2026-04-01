# Verification Instruction - S1BI3

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S1BI3

## Task Name
Vercel 배포 설정 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `vercel.json` 존재
- [ ] `vercel.json` 유효한 JSON 형식
- [ ] `render.yaml` 존재 (선택적)

### 2. vercel.json 내용 검증
- [ ] `"version": 2` 설정
- [ ] `"framework": "nextjs"` 설정
- [ ] `functions` 설정에 `maxDuration: 30` 포함
- [ ] `env` 섹션에 Supabase 환경변수 매핑 포함
- [ ] `headers` 섹션에 CORS 설정 포함 (`Access-Control-Allow-Origin`)

### 3. 배포 상태 검증
- [ ] Vercel Dashboard에서 최신 배포 상태 "Ready" (또는 성공)
- [ ] 프로덕션 URL 접속 가능 (HTTP 200 응답)
- [ ] API 엔드포인트 CORS 정상 동작

### 4. 환경변수 검증
- [ ] Vercel Dashboard에서 `NEXT_PUBLIC_SUPABASE_URL` Secret 설정됨
- [ ] Vercel Dashboard에서 `NEXT_PUBLIC_SUPABASE_ANON_KEY` Secret 설정됨
- [ ] Vercel Dashboard에서 `SUPABASE_SERVICE_ROLE_KEY` Secret 설정됨

### 5. 서버리스 함수 검증
- [ ] `api/` 폴더의 `.js` 파일들이 Vercel에서 서버리스 함수로 인식됨
- [ ] 함수 실행 시간 제한 30초 적용됨
- [ ] 함수 호출 시 정상 응답 (HTTP 200)

### 6. 통합 검증
- [ ] S1BI2에서 설정한 환경변수가 배포 환경에서 실제 사용됨
- [ ] Next.js 빌드 결과가 Vercel에 올바르게 배포됨
- [ ] 자동 배포(Git Push → Vercel 자동 빌드) 동작 확인

### 7. 저장 위치 검증
- [ ] `vercel.json`이 프로젝트 루트에 존재
- [ ] `Process/S1_개발_준비/Backend_Infra/`에 배포 설정 문서 저장

## Test Commands
```bash
# JSON 유효성 검증
node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8')); console.log('PASS: JSON valid')"

# Vercel CLI 배포 상태 확인
vercel ls

# 프로덕션 URL 접속 확인
curl -I https://[your-domain].vercel.app

# API CORS 헤더 확인
curl -I -X OPTIONS https://[your-domain].vercel.app/api/telegram \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST"
```

## Expected Results
- `vercel.json` JSON 파싱 성공
- `vercel ls` 출력에 현재 프로젝트 배포 목록 표시
- 프로덕션 URL HTTP 200 응답
- CORS 헤더 `Access-Control-Allow-Origin: *` 포함

## Verification Agent
devops-troubleshooter-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] Vercel 배포 상태 "Ready"
- [ ] API CORS 설정 정상
- [ ] Blocker 없음

## ⚠️ Human-AI Task 검증 주의사항
이 Task는 **Human-AI** 유형입니다.
- Vercel Dashboard 접속은 PO가 직접 수행
- Vercel Secrets 설정은 PO만 확인 가능
- CI/CD 자동 배포 트리거 테스트는 실제 Git Push로만 확인 가능
