# S10FE8 Verification

## 검증 범위
- 봇 카드에 "페르소나 N/10" / "페르소나 추가" UI 부재
- 최상단 버튼 라벨 "+ 새 코코봇 페르소나"
- GreetingAutoGen: 힌트 입력 + AI 생성 + 편집 textarea + 저장
- FaqAutoGen: 키워드 입력 + AI 생성 + 항목별 체크/편집 + 선택 저장

## 검증 방법
1. `tsc --noEmit` 통과
2. grep "PersonaPanel" → Tab2BotManage.tsx 에서 0 건
3. grep "새 코코봇 페르소나" → 존재
4. 런타임: 실제 봇 생성 후 마이페이지에서 버튼 동작 확인

## 합격 기준
- 빌드 성공
- PO 피드백 3건 모두 반영
- 기존 S10FE7 BotSettings 와 충돌 없음
