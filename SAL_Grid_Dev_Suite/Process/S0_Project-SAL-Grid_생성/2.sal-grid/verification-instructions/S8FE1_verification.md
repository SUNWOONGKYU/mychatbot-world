# S8FE1 검증

## 검증 항목
- [ ] `@/lib/supabase` import 제거됨
- [ ] `/api/bots/public/[botId]` fetch 호출로 대체됨
- [ ] `personas` 매핑이 `json.data.personas` 에서 옴
- [ ] 'AI Assistant' 하드코딩 제거됨
- [ ] 폴백 이름이 `decodeURIComponent(botId).replace(/-/g,' ')` 기반
- [ ] TypeScript 컴파일 클린
- [ ] 배포 후 `/bot/gim-byeonhosa` 1번째 페르소나 이름 정상 표시 (manual)

## Agent
- code-reviewer-core
