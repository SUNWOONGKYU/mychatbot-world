# S3F12: Skills 마켓플레이스 기능 구현

## Task 정보
- **Task ID**: S3F12
- **Task Name**: Skills 마켓플레이스 기능 구현
- **Stage**: S3 (개발 2차)
- **Area**: F (Frontend)
- **Dependencies**: S2F8

## Task 목표

Skills(스킬장터) 페이지를 정적 소개 페이지에서 실제 동작하는 마켓플레이스로 전환한다.
`app.js`에 이미 정의된 23개 스킬 데이터(`CoCoBot.skills`)를 활용하여 스킬 탐색, 상세 조회, 설치/제거, 마이스킬 관리 기능을 구현한다.

## 배경 및 목적

현재 Skills 페이지는 `js/skills.js`가 없고 4개 기능 카드와 인기 스킬 칩만 정적으로 표시된다.
`home.js`에 `installSkill()` 로직이 이미 있으며, `app.js`의 `CoCoBot.skills` 배열(23개)과 `CoCoBot.skillPresets`(6종)를 프론트엔드에서 렌더링해야 한다.

## 기능 요구사항

### 1. Skills 메인 페이지 (`pages/skills/index.html` 개편)
- 23개 스킬을 카드 그리드로 렌더링
- 7개 카테고리 필터 (분석, 보안, 관리, 지식, UI, 비즈니스, 연동 + 전체)
- 검색 기능 (스킬명, 설명 대상)
- 정렬 (인기순/평점순/가격순)
- 무료/유료 필터 토글
- 스킬 프리셋 6종 원클릭 설치 섹션

### 2. Skills 상세 페이지 (`pages/skills/detail.html` 신규)
- URL 파라미터 `?id=skillId`로 스킬 조회
- 스킬 상세 정보: 이름, 아이콘, 카테고리, 설명, systemPrompt, 평점, 설치수, 가격
- 설치/제거 버튼 (로그인 상태 확인)
- 유료 스킬: 구매 확인 모달 (시뮬레이션 — 포인트 차감 없이 UX만 구현)

### 3. 마이 스킬 페이지 (`pages/skills/my.html` 신규)
- 내 챗봇에 장착된 스킬 목록 표시
- 스킬별 활성/비활성 토글
- 제거 버튼
- 빈 상태: "장착된 스킬이 없습니다. 마켓플레이스에서 스킬을 추가하세요."

### 4. `js/skills.js` (신규 생성)
- `CoCoBot.skills` 데이터를 렌더링하는 메인 로직
- 필터/검색/정렬 상태 관리
- 카드 클릭 → detail.html 이동
- 설치/제거 → `CoCoBot.storage` 또는 localStorage 사용
- 프리셋 설치 → `CoCoBot.skillPresets` 활용

### 5. `css/skills.css` 확장
- 스킬 카드 그리드 (반응형 2열→1열)
- 상세 페이지 레이아웃
- 마이스킬 리스트 스타일
- 다크 테마 (#10b981 에메랄드 accent)

## 코드 작성 기준
- 파일 상단에 `@task S3F12` 주석 필수
- `CoCoBot.skills` 데이터 구조: `{ id, name, icon, category, description, systemPrompt, isFree, price, installs, rating }`
- `CoCoBot.skillPresets` 구조: `{ id, name, description, skills: [skillId, ...] }`
- 스킬 저장: `mcw_skills_{botId}_{personaId}` (localStorage)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `pages/skills/index.html` | 정적→동적 마켓플레이스 전환 |
| `pages/skills/detail.html` | 스킬 상세 페이지 (신규) |
| `pages/skills/my.html` | 마이 스킬 관리 페이지 (신규) |
| `js/skills.js` | 스킬 마켓플레이스 메인 로직 (신규) |
| `css/skills.css` | 마켓플레이스 스타일 확장 |

## 완료 기준
- [ ] 23개 스킬이 카드 그리드로 렌더링된다
- [ ] 카테고리 필터, 검색, 정렬이 동작한다
- [ ] 스킬 상세 페이지에서 설치/제거가 동작한다
- [ ] 마이스킬 페이지에서 장착 스킬 목록이 표시된다
- [ ] 프리셋 원클릭 설치가 동작한다
- [ ] 반응형 레이아웃 (768px 이하)
