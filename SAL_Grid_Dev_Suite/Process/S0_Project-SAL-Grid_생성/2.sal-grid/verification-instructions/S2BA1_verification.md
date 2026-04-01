# Verification Instruction - S2BA1

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2BA1

## Task Name
Create API 강화 (AI 분석 → FAQ 자동생성 → 배포 URL+QR)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/app/api/create-bot/route.ts` 존재
- [ ] `Process/S2_개발-1차/Backend_APIs/app/api/create-bot/analyze/route.ts` 존재
- [ ] `Process/S2_개발-1차/Backend_APIs/app/api/create-bot/faq/route.ts` 존재
- [ ] `Process/S2_개발-1차/Backend_APIs/app/api/create-bot/deploy/route.ts` 존재
- [ ] 각 파일 `@task S2BA1` 주석 존재

### 2. 기능 검증
- [ ] POST /api/create-bot 요청 시 전체 파이프라인(analyze → faq → deploy) 순서대로 실행
- [ ] analyze API가 페르소나 객체(`name, personality, tone, expertise, greeting`)를 반환
- [ ] faq API가 5개 이상의 FAQ 쌍을 반환
- [ ] deploy API가 `deployUrl`과 `qrUrl`을 반환
- [ ] 인증 없는 요청 시 401 응답 반환
- [ ] Supabase `bots`, `personas`, `faqs` 테이블에 레코드 저장 확인
- [ ] DB에 mock/하드코딩 데이터 없이 실제 AI 분석 결과 저장

### 3. 통합 검증
- [ ] S1DB1(DB 스키마)의 테이블 구조와 맞는 데이터 형식으로 insert
- [ ] S1SC1(인증 미들웨어)와 연동하여 토큰 검증 정상 동작
- [ ] 하위 API 개별 호출도 정상 동작

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Backend_APIs/` 에 원본 저장되었는가?
- [ ] git commit 후 `api/Backend_APIs/` 로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Backend_APIs/app/api/create-bot/

# 타입 검사
npx tsc --noEmit

# 빌드 확인
npm run build

# API 호출 테스트 (로컬 서버 실행 후)
curl -X POST http://localhost:3000/api/create-bot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"name":"테스트봇","description":"테스트용 챗봇"}'
```

## Expected Results
- 전체 파이프라인 1회 호출로 botId, deployUrl, qrUrl 반환
- Supabase에 bots(1건), personas(1건), faqs(5건 이상) 저장
- TypeScript 컴파일 에러 0개

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
