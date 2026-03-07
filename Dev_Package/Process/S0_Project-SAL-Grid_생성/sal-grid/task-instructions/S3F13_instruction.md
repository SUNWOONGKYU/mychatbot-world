# S3F13: Birth 위자드 데이터 영속화 + 랜딩 연결 + 온보딩

## Task 정보
- **Task ID**: S3F13
- **Task Name**: Birth 위자드 데이터 영속화 + 랜딩 연결 + 온보딩
- **Stage**: S3 (개발 2차)
- **Area**: F (Frontend)
- **Dependencies**: S3F4

## Task 목표

Birth 생성 위자드(create.js)의 Steps 6-8에서 수집하는 아바타/테마/음성 데이터가 봇 객체에 실제 저장되도록 수정한다.
Birth 랜딩 페이지의 4개 기능 카드를 create 위자드의 해당 Step으로 직접 연결한다.
생성 완료 후 온보딩 가이드를 표시한다.

## 배경 및 목적

현재 create.js의 `completeCreation()` 함수가 Steps 6-8에서 선택한 값들을 수집만 하고 봇 데이터에 저장하지 않는다:
- `selectedAvatarEmoji` — 수집되나 봇 객체에 미반영
- `selectedThemeMode`, `selectedThemeColor` — 수집되나 미반영
- 음성 선택 — 미반영

Birth 랜딩의 4개 카드("챗봇 생성", "성격 설정", "외형 설정", "아바타")는 create 페이지로만 이동하고 특정 Step으로 이동하지 않는다.

## 기능 요구사항

### 1. create.js Steps 6-8 데이터 영속화
- `completeCreation()` 또는 최종 저장 함수에서:
  - `botData.avatar = selectedAvatarEmoji` 또는 `botData.avatarImage = _avatarImageData`
  - `botData.theme = { mode: selectedThemeMode, color: selectedThemeColor }`
  - `botData.voice = selectedVoice`
- localStorage `mcw_bots` 배열의 해당 봇 객체에 위 필드 추가

### 2. Birth 랜딩 → Create Step 직접 연결
- "챗봇 생성" 카드 → `create/index.html` (기존 동일)
- "성격 설정" 카드 → `create/index.html?step=2`
- "외형 설정" 카드 → `create/index.html?step=7`
- "아바타" 카드 → `create/index.html?step=6`
- create.js에서 `?step=N` URL 파라미터 감지 → 해당 Step으로 이동

### 3. 생성 완료 후 온보딩 가이드
- Step 8 (배포) 완료 후 온보딩 섹션 표시:
  - "지금 대화해보기" → `/pages/bot/index.html?id={botId}`
  - "FAQ 추가하기" → `/pages/home/index.html` (지식베이스 패널)
  - "스킬 장착하기" → `/pages/skills/index.html`
- 간단한 3-카드 UI

## 코드 작성 기준
- 파일 상단에 `@task S3F13` 주석 필수
- 기존 create.js의 Step 로직, DOM ID 보존
- URL 파라미터 처리: `URLSearchParams` 사용

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `js/create.js` | Steps 6-8 데이터 저장 로직 추가, URL 파라미터 Step 이동 |
| `pages/birth/index.html` | 4개 카드 href를 Step별 링크로 변경 |

## 완료 기준
- [ ] 아바타 이모지/이미지가 봇 데이터에 저장된다
- [ ] 테마 모드/색상이 봇 데이터에 저장된다
- [ ] 음성 선택이 봇 데이터에 저장된다
- [ ] Birth 카드 클릭 시 create 위자드의 해당 Step으로 이동한다
- [ ] 생성 완료 후 온보딩 3-카드가 표시된다
