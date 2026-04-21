# S8BA1 검증

## 검증 항목
- [ ] `app/api/bots/public/[username]/route.ts` 생성됨
- [ ] `createClient(URL, SERVICE_KEY, { auth:{ persistSession:false } })` 적용
- [ ] `.or('id.eq.X,username.eq.X')` 단건 조회
- [ ] `mcw_personas` 조회 select에 민감 필드 없음 (dm_policy, pairing_code 제외)
- [ ] 봇 미존재 시 404 반환
- [ ] TypeScript 컴파일 클린

## Agent
- code-reviewer-core
