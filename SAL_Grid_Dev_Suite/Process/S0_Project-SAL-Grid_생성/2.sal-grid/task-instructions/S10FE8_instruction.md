# S10FE8: Tab2 페르소나 섹션 제거 + AI 자동생성 입력 UX

## Task 정보
- **Task ID**: S10FE8
- **Task Name**: 페르소나 1:1 복원 + AI 자동생성 UX
- **Stage**: S10
- **Area**: FE
- **Dependencies**: S10FE7

## 배경 (PO 피드백)

마이페이지 Tab2 의 봇 카드 안에 "페르소나 N/10 + 추가" 패널이 있어 PO 가 강하게 지적:
- **1 코코봇 = 1 페르소나** 가 올바른 멘탈모델
- "페르소나를 10개로 확장" 은 잘못된 UX
- 또한 "AI 인사말 자동생성", "FAQ 자동생성" 버튼이 단순 트리거만 있고 사용자 입력/편집 불가

## Task 목표

1. `PersonaPanel` 컴포넌트 완전 제거 (봇 카드 내부의 페르소나 리스트+추가 UI)
2. 봇 카드에서 "페르소나 N/10" 카운터 제거
3. 최상단 `+ 새 코코봇` 버튼 → `+ 새 코코봇 페르소나` 로 리네임 (신규 페르소나는 Step8 위저드에서 생성)
4. `GreetingAutoGen` 컴포넌트 추가: 힌트 입력 → `/api/create-bot/analyze` → `suggestedGreeting` 수신 → 편집 textarea → PATCH `/api/bots/{id}` (greeting)
5. `FaqAutoGen` 컴포넌트 추가: 키워드 입력 → `/api/create-bot/faq` → `data.faqs[]` 수신 → 항목별 체크박스+편집 → 선택 항목 POST `/api/faq`

## 응답 파싱 주의
- `analyze` 는 `suggestedGreeting` (d.data.suggestedGreeting 또는 d.suggestedGreeting) 반환
- `faq` 는 `{ success, data: { faqs: [{question, answer}] } }` 반환

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `components/mypage/Tab2BotManage.tsx` | PersonaPanel 제거, GreetingAutoGen/FaqAutoGen 추가, 버튼 라벨 변경 |

## 커밋
- `d8ae5ae fix(mypage-tab2): 페르소나 1:1 복원 + AI 자동생성 입력 UX`
