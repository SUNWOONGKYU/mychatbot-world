# CPC (Claude Platoons Control) 연동 변경 내역

> 작성일: 2026-02-16
> 작업자: 소대장 세션 (CPC 마이그레이션 작업 중 수정)

## 개요

mychatbot-world 챗봇(Sunny Bot)에서 CPC 시스템으로 직접 명령을 전달할 수 있도록 연동 코드를 추가/수정했다.
이전에는 로컬 Express.js 서버(`localhost:4100`)를 사용했으나, CPC가 Vercel + Supabase 클라우드로 마이그레이션되면서 해당 코드를 업데이트했다.

---

## 수정 파일 3개

### 1. `js/chat.js`

**변경 내용:**

- 구 코드 (`CLAUDE_SQUAD_API_BASE`, `/api/squads`, `csc*` 함수) 삭제
- 신규 코드로 교체:

```
CPC_API_BASE = 'https://claude-platoons-control.vercel.app'
```

| 구 함수 | 신규 함수 | 용도 |
|---------|----------|------|
| `cscGetSquads()` | `cpcGetPlatoons()` | 소대 목록 조회 |
| `cscAddSquadCommand()` | `cpcAddCommand()` | 소대에 명령 추가 |
| `cscGetPendingCommands()` | `cpcGetPendingCommands()` | PENDING 명령 조회 |

**추가된 함수:**

- `cpcShowBar()` — CPC 소대 선택 바 표시. API에서 15개 소대를 동적 로딩하여 프로젝트별 그룹핑
- `cpcHideBar()` — 바 숨김

**sendMessage() 수정:**

```js
// 업무 도우미 페르소나 + 소대 선택 시 해당 소대로 명령 전달
if (currentPersona.id === 'sunny_helper_work' && _cpcSelectedId) {
    cpcAddCommand(_cpcSelectedId, text, 'chatbot');
}
```

- 이전: `mychatbot-1` 하드코딩
- 현재: `_cpcSelectedId` 변수 (사용자가 드롭다운에서 선택한 소대)

**switchPersona() 수정:**

- `sunny_helper_work` 페르소나 전환 시 `cpcShowBar()` 호출
- 다른 페르소나 전환 시 `cpcHideBar()` 호출

**loadBotData() 수정:**

- URL 파라미터로 `?persona=sunny_helper_work` 직접 진입 시에도 `cpcShowBar()` 자동 호출

### 2. `pages/bot/index.html`

**추가 위치:** 채팅 입력창(`chat-input-area`) 바로 위

```html
<div class="cpc-bar" id="cpcBar" style="display:none">
    <div class="cpc-bar-inner">
        <span class="cpc-bar-label">CPC</span>
        <select class="cpc-select" id="cpcPlatoonSelect">
            <option value="">소대 선택...</option>
        </select>
        <span class="cpc-status" id="cpcStatus"></span>
    </div>
</div>
```

### 3. `css/chat.css`

**추가 위치:** 파일 맨 아래

- `.cpc-bar` — 바 컨테이너 (초록색 테마, `rgba(16, 185, 129, 0.08)`)
- `.cpc-bar-label` — "CPC" 라벨
- `.cpc-select` — 소대 드롭다운 (프로젝트별 optgroup)
- `.cpc-status` — "연결됨" 상태 표시
- 라이트 모드 대응 (`.chat-body.light .cpc-*`)

---

## 동작 흐름

```
1. Sunny Bot 접속 (mychatbot-world.vercel.app/pages/bot/index.html)
2. "업무 도우미" 페르소나 선택
3. CPC 소대 선택 바 자동 표시
4. 소대 드롭다운에서 대상 소대 선택 (15개, API에서 동적 로딩)
5. 메시지 입력 → 전송
6. AI 응답 + 동시에 CPC API로 선택된 소대에 PENDING 명령 전달
```

## CPC API 엔드포인트

| 메서드 | URL | 용도 |
|--------|-----|------|
| GET | `/api/platoons` | 전체 소대 목록 |
| POST | `/api/platoons/{id}/commands` | 소대에 명령 추가 |
| GET | `/api/platoons/{id}/commands?status=PENDING` | PENDING 명령 조회 |

Base URL: `https://claude-platoons-control.vercel.app`

## 소대 목록 (15개)

| 프로젝트 | 소대 ID |
|----------|---------|
| SSALWorks | ssalworks-1, ssalworks-2, ssalworks-3 |
| My Chatbot World | mychatbot-1, mychatbot-2, mychatbot-3 |
| AI Study Circle | studycircle-1, studycircle-2, studycircle-3 |
| Politician Finder | politician-1, politician-2, politician-3 |
| ValueLink | valuelink-1, valuelink-2, valuelink-3 |

## 확장성

소대 목록은 CPC API에서 동적으로 가져오므로, CPC 대시보드에서 소대를 추가하면 챗봇 드롭다운에 자동 반영된다.
하드코딩된 값 없음.

## 관련 시스템

- CPC 대시보드: https://claude-platoons-control.vercel.app
- CPC 소스: G:\내 드라이브\claude-platoons-control\
- CPC Supabase: hlpovizxnrnspobddxmq (Claude_Platoons_Control, Seoul)
- Engage 커맨드: ~/.claude/commands/cpc-engage-1/2/3.md

## 기존 스킬 마켓 (MCW 내장)

mychatbot-world에는 이미 스킬 검색/설치 시스템이 구현되어 있다:

- `js/app.js` — `MCW.skills` 배열: 21개 스킬 정의 (통계분석, 감정분석, 욕설필터, PDF업로드 등)
- `js/app.js` — `MCW.storage.installSkill()`, `uninstallSkill()`, `getInstalledSkills()`
- `js/home.js` — 스킬 마켓 UI (검색, 설치 버튼)
- 위치: 홈 페이지 대시보드 내 "스킬 마켓" 섹션

## Find Skills (Vercel Labs 오픈소스)

AI 에이전트 스킬을 검색하고 설치하는 CLI 도구.
글로벌 설치 완료 (2026-02-16).

- 출처: https://github.com/vercel-labs/skills
- 레지스트리: https://skills.sh/
- 설치 위치: `~/.agents/skills/find-skills`
- 지원 에이전트: Claude Code, Codex, Gemini CLI, GitHub Copilot, Continue, Antigravity

### 사용법

```bash
# 스킬 검색
npx skills find "검색어"

# 스킬 설치 (글로벌)
npx skills add owner/repo@skill-name -g -y

# 예시
npx skills find "react performance"
npx skills find "pr review"
npx skills add anthropics/claude-code@frontend-design -g -y
```
