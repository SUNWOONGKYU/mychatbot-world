# S5BA3: chat/route.ts 복잡도 분리 리팩토링

## Task 정보
- **Task ID**: S5BA3
- **Task Name**: chat/route.ts 복잡도 분리 리팩토링
- **Stage**: S5 (품질 개선)
- **Area**: BA (Backend APIs)
- **Dependencies**: S3BA1

## Task 목표

현재 `app/api/chat/route.ts` 단일 파일에 400줄 이상의 로직이 집중되어 있다. 라우팅, 검증, AI 호출, 응답 처리 레이어를 분리하여 유지보수성을 향상시킨다.

## 구현 범위

### 현재 문제
- 단일 파일에 인증, 검증, 감정 분석, AI 라우팅, 대화 저장 로직 혼재
- 인지 복잡도(Cognitive Complexity) 높음 → 버그 추적 어려움
- 테스트 작성 어려움

### 분리 구조
```
lib/chat/
├── validate-chat-request.ts  ← 입력 검증
├── resolve-persona.ts        ← 페르소나/챗봇 설정 로드
├── route-to-ai.ts            ← AI 모델 라우팅
└── save-conversation.ts      ← 대화 저장
```

### 리팩토링 원칙
- 각 함수 단일 책임
- 순수 함수 우선 (side-effect 최소화)
- 기존 동작 100% 유지 (리팩토링은 기능 변경 아님)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/chat/validate-chat-request.ts` | 검증 레이어 분리 |
| `lib/chat/resolve-persona.ts` | 페르소나 로드 분리 |
| `lib/chat/route-to-ai.ts` | AI 라우팅 분리 |
| `lib/chat/save-conversation.ts` | 저장 레이어 분리 |
| `app/api/chat/route.ts` | 오케스트레이션만 남기고 위임 |

## 완료 기준

- [ ] route.ts 파일 100줄 이하로 축소
- [ ] 각 분리 모듈 단위 테스트 가능 구조
- [ ] 기존 채팅 기능 정상 동작 확인
- [ ] 빌드 성공
