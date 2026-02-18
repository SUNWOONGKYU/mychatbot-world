---
description: "최강 스킬 조합 편성 및 장착 전략"
user-invocable: true
---

# /deploy-skill — 최강 스킬 조합 편성 및 장착 전략 (세계 최고 수준)

**최강 스킬(슬래시 커맨드) 선발 및 장착 커맨드**. 3가지 소스에서 최적의 스킬을 찾아 분대장의 능력을 확장한다.

> 이것은 범용 스킬 장착 시스템이다. `/deploy-subagent`가 "사람(에이전트)"을 선발하듯, `/deploy-skill`은 "무기(스킬)"를 편성한다.

---

## 핵심 개념: 분대장 직접 수행 + 스킬로 능력 확장

**분대장(Teammate)은 맨손으로 싸우지 않는다.** 스킬(무기)을 장착하여 능력을 확장한다.

| 역할 | 직접 수행 | 스킬 사용 |
|------|----------|---------|
| **소대장** (Claude Code) | X — 지휘/조율만 | O — 전략 수립용 스킬 |
| **분대장** (Teammate) | **O — 직접 일함** | **O — 능력 확장용 스킬** |
| **분대원** (SubAgent) | O — 위임받은 일 | O — 프롬프트로 스킬 호출 |

**분대장이 스킬을 사용하는 3가지 상황**:
1. **복잡한 전략** — 다단계 프로세스를 캡슐화 (예: /deploy-subagent)
2. **반복 작업** — 자주 쓰는 워크플로우 자동화 (예: /create-image)
3. **전문 도메인** — 특수 분야 지식 활용 (예: /api-design, /test-suite)

스킬은 분대장을 **대체하는 게 아니라, 능력을 확장**한다.

---

## 최강 스킬 편성: 3가지 스킬 풀

| 소스 | 위치 | 특징 | 사용 시점 |
|------|------|------|----------|
| **1. 기본 제공** | `~/.claude/commands/` | 즉시 사용 가능, 검증됨 | 표준 작업 |
| **2. 사용자 생성** | `.claude/commands/` (프로젝트)<br>`~/.claude/commands/` (전역) | 프로젝트 특화, 커스텀 | 반복 작업 |
| **3. 외부 커뮤니티** | GitHub, npm, 공유 리포 | 전문성, 다양성, 최신 트렌드 | 특수 도메인 |

**선발 원칙**: 기존 활용 → 커뮤니티 검색 → 신규 생성 → 성과 중심

---

## 핵심 원칙 (5대 철칙)

1. **분대장 주도**: 스킬은 분대장의 도구, 능력 확장 수단
2. **기존 우선**: 이미 있는 스킬 최우선 활용
3. **커뮤니티 활용**: 없으면 외부에서 검색/다운로드
4. **신규 생성**: 그래도 없으면 직접 만들기 (재사용 가능)
5. **비용 최소화**: 스킬은 무료 (코드일 뿐, API 비용 없음)

---

## Phase 1. 스킬 탐색 (4단계 복합 전략)

작업에 적합한 스킬을 **순서대로** 탐색. 먼저 찾은 것 우선 사용.

**탐색 순서**: 현재 보유 스킬 → 기본 제공 → 외부 커뮤니티 → 신규 생성

### 1순위: 현재 보유 스킬 확인

사전 정의된 전문 스킬을 최우선 탐색. 커스텀 스킬은 프로젝트 특화 워크플로우와 도메인 지식을 내장하고 있다.

#### 탐색 방법

```bash
# 1. 전역 스킬 확인 (모든 프로젝트에서 사용 가능)
ls ~/.claude/commands/*.md

# 2. 프로젝트 스킬 확인 (현재 프로젝트만)
ls .claude/commands/*.md

# 3. 스킬 메타데이터 확인 (있는 경우)
cat ~/.claude/commands/skills-config.json
cat .claude/commands/skills-config.json
```

#### 스킬 구분: 프로젝트별 vs 전역

| 구분 | 위치 | 우선순위 | 용도 | 예시 |
|------|------|----------|------|------|
| **프로젝트 스킬** | `.claude/commands/` | 1순위 | 현재 프로젝트 전용 도구 | `deploy-to-vercel`, `sync-supabase` |
| **전역 스킬** | `~/.claude/commands/` | 2순위 | 모든 프로젝트 공통 도구 | `deploy-subagent`, `create-image` |

**탐색 우선순위**: 프로젝트 스킬 → 전역 스킬 (같은 이름이면 프로젝트 버전 우선)

#### 현재 보유 중인 기본 스킬

**장착 가능 4종** (전역 스킬):

| 스킬 | 파일 | 용도 | 소대장 | 분대장 | 서브에이전트 |
|------|------|------|--------|--------|-------------|
| `/deploy-subagent` | deploy-subagent.md | 분대원 편성 투입 | O | O | X (서브가 서브 호출 시 중첩 문제) |
| `/deploy-skill` | deploy-skill.md | 스킬 조합 편성 | O | O | O |
| `/create-image` | create-image.md | 이미지 생성 (SVG/HTML/Mermaid/Pillow) | O | O | O |
| `/review-evaluate` | review-evaluate.md | 검토 및 평가 | O | O | O |

*(출처: `~/.claude/commands/`)*

> **참고**: `/platoon-formation`은 소대장 전용 편성 커맨드이므로 "장착 스킬" 목록에서 제외
>
> **TODO**: `C:/Users/home/Desktop/platoon_formation.svg`의 스킬 카드 하단 "소대장 · 분대장 · 서브에이전트 공용" 텍스트를 위 권한 테이블에 맞게 수정 필요

#### 커스텀 스킬 파일 구조

커스텀 스킬 작성 시 표준 구조:

```markdown
# [스킬명] (제목)

[간단한 설명 1-2줄]

## Phase 1. [단계명]
[작업 내용]

## Phase 2. [단계명]
[작업 내용]

## 사용 예시
```javascript
Skill({
  skill: "스킬명",
  args: "인자"
})
```

**필수 요소**:
- 명확한 제목과 설명
- 단계별 실행 로직 (Phase 1, 2, 3...)
- 사용 예시 (코드 블록)
- 인자 설명 (ARGUMENTS 섹션)

#### 매칭 전략 (키워드 기반 자동 선택)

작업 설명에서 키워드를 추출하여 적합한 스킬 자동 매칭:

| 키워드 | 매칭 스킬 | 이유 |
|--------|----------|------|
| "분대원", "에이전트", "팀 편성", "투입" | `/deploy-subagent` | 서브에이전트 투입 전문 |
| "스킬 조합", "장착", "능력 강화" | `/deploy-skill` | 스킬 편성 전문 |
| "이미지", "다이어그램", "SVG", "차트" | `/create-image` | 시각화 생성 전문 |
| "평가", "검증", "품질", "리뷰" | `/review-evaluate` | 품질 체크 전문 |

**사용 방법**:
```javascript
// 1. Skill 도구로 직접 호출
Skill({
  skill: "deploy-subagent",
  args: "API 설계 전문 에이전트 투입"
})

// 2. 키워드 기반 자동 매칭
// "이미지 생성 필요" → create-image 자동 선택
// "분대원 투입 필요" → deploy-subagent 자동 선택
```

---

### 2순위: 기본 제공 스킬 (Claude Code 내장)

Anthropic이 공식 제공하는 시스템 내장 스킬. 검증되고 최적화된 범용 도구.

#### 시스템 스킬 목록

**전역 스킬** (`~/.claude/commands/`):

| 스킬 | 파일 | 카테고리 | 용도 | 특징 |
|------|------|----------|------|------|
| `/deploy-subagent` | deploy-subagent.md | 팀 관리 | 서브에이전트 투입 전략 | 3-tier 소싱, 용병 투입 |
| `/deploy-skill` | deploy-skill.md | 팀 관리 | 스킬 조합 편성 | 4단계 복합 전략 |
| `/platoon-formation` | platoon-formation.md | 팀 관리 | 소대 편제 방식 팀구성 | 소대장 전용 |
| `/create-image` | create-image.md | 시각화 | 이미지/다이어그램 생성 | Mermaid/SVG/HTML/Pillow |
| `/review-evaluate` | review-evaluate.md | 품질 관리 | 품질 평가 및 검증 | 체크리스트 기반 |
| `/keybindings-help` | keybindings-help.md | 설정 | 키보드 단축키 커스터마이징 | keybindings.json 편집 |

*(설치 시 자동 포함, 추가 설정 불필요)*

#### 확인 방법

```javascript
// 1. 파일 시스템으로 직접 확인
Glob("~/.claude/commands/*.md")

// 2. Read로 스킬 내용 확인
Read("~/.claude/commands/deploy-subagent.md")

// 3. 시스템 리마인더에서 확인
// <system-reminder>에 사용 가능한 스킬 목록 표시됨
```

#### 스킬 비교표 (내장 vs 커스텀)

| 구분 | 내장 스킬 | 커스텀 스킬 |
|------|----------|------------|
| **제공자** | Anthropic 공식 | 사용자 작성 |
| **위치** | `~/.claude/commands/` | `.claude/commands/` 또는 `~/.claude/commands/` |
| **품질** | 검증됨, 최적화됨 | 프로젝트 특화 |
| **범용성** | 모든 프로젝트 | 특정 프로젝트/도메인 |
| **업데이트** | 자동 (Claude Code 업데이트) | 수동 (사용자 관리) |
| **우선순위** | 2순위 | 1순위 (프로젝트 스킬) |

#### 사용 예시

```javascript
// 예시 1: 팀 편성 스킬
Skill({
  skill: "platoon-formation",
  args: "프로젝트 전체 팀 편성"
})

// 예시 2: 이미지 생성 스킬
Skill({
  skill: "create-image",
  args: "C:/Users/home/Desktop/architecture.svg"
})

// 예시 3: 품질 평가 스킬
Skill({
  skill: "evaluate",
  args: "코드 품질 종합 평가"
})
```

#### 스킬 활용 전략

**언제 내장 스킬 사용:**
- 범용적인 작업 (이미지 생성, 팀 편성, 품질 검증)
- 검증된 워크플로우 필요
- 빠른 실행 (설정 불필요)

**언제 커스텀 스킬 작성:**
- 프로젝트 특화 도구 필요 (예: deploy-to-aws, sync-database)
- 반복 작업 자동화 (예: daily-report, backup-data)
- 도메인 전문성 필요 (예: medical-compliance-check, fintech-audit)

---

### 3순위: 외부 커뮤니티 스킬 탐색

다른 개발자들이 공유한 검증된 스킬을 활용. **외부 탐색의 최우선 전략**.

**전략 순서**: GitHub Awesome 리스트 → npm/pip Registry → MCP Marketplace → 웹 검색

---

#### 3-1. GitHub Awesome 리스트

```javascript
// 1. WebSearch로 awesome 리스트 찾기
WebSearch("awesome claude code skills commands github 2026")

// 결과 예시:
// - https://github.com/awesome-claude/skills
// - https://github.com/VoltAgent/claude-code-skills
// - 100+ 전문 스킬 모음

// 2. WebFetch로 리스트 내용 확인
WebFetch({
  url: "https://github.com/awesome-claude/skills",
  prompt: "API 설계 스킬의 raw 파일 URL을 찾아라."
})
// 결과: https://raw.githubusercontent.com/.../api-design.md

// 3. Bash로 스킬 다운로드
Task({
  description: "커뮤니티 스킬 다운로드",
  prompt: `
curl -o ~/.claude/commands/api-design.md \
  https://raw.githubusercontent.com/awesome-claude/skills/main/api-design.md

다운로드 완료 후 파일 확인하고 "downloaded" 보고.
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})

// 4. 다운로드한 스킬 즉시 사용
Skill({skill: "api-design", args: "RESTful API 설계"})
```

---

#### 3-2. npm/pip Registry

```javascript
// npm에서 claude-code 관련 패키지 검색
WebSearch("npm claude-code skills helper toolkit 2026")

// 발견한 패키지 설치 및 스킬 생성
Task({
  description: "npm 패키지로 스킬 생성",
  prompt: `
1. npm install -g claude-skills-toolkit
2. claude-skills generate --type "api-tester" --output ~/.claude/commands/api-tester.md
3. 생성된 파일 확인 후 "generated" 보고
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})

// pip (Python 스킬)
Task({
  description: "pip 패키지로 스킬 설치",
  prompt: `
1. pip install claude-skill-utils
2. claude-skill install --name "data-viz" --target ~/.claude/commands/
3. "installed" 보고
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})
```

---

#### 3-3. MCP Marketplace

**MCP (Model Context Protocol) 서버**를 스킬로 활용. MCP 서버는 외부 시스템(DB, API, 파일 시스템)과의 연결을 제공.

```javascript
// MCP 서버 검색
WebSearch("modelcontextprotocol server marketplace filesystem 2026")
WebFetch({
  url: "https://github.com/modelcontextprotocol/servers",
  prompt: "파일 시스템 MCP 서버 설치 방법 찾기"
})

// MCP 서버 설치
Task({
  description: "MCP 서버 설치",
  prompt: `
1. npm install -g @modelcontextprotocol/server-filesystem
2. ~/.claude/mcp.json에 서버 설정 추가:
   {
     "mcpServers": {
       "filesystem": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
       }
     }
   }
3. "mcp installed" 보고
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})

// MCP 기능을 스킬처럼 사용
// (MCP 서버가 제공하는 도구를 Claude가 직접 호출 가능)
```

**주요 MCP 서버** (스킬 대체 가능):

| MCP 서버 | 제공 기능 | 스킬 대체 효과 |
|----------|----------|---------------|
| `server-filesystem` | 파일 시스템 접근 | 파일 읽기/쓰기 스킬 |
| `server-postgres` | PostgreSQL DB 조회/수정 | 데이터베이스 관리 스킬 |
| `server-github` | GitHub API 호출 | Git 작업 자동화 스킬 |
| `server-google-drive` | Google Drive 연동 | 클라우드 스토리지 스킬 |
| `server-puppeteer` | 브라우저 자동화 | 웹 스크래핑/테스트 스킬 |

**MCP vs 스킬 비교**:

| 항목 | MCP 서버 | 스킬 (.md) |
|------|----------|-----------|
| **구현** | 별도 프로세스 (Node.js/Python 서버) | 마크다운 파일 |
| **성능** | 빠름 (네이티브 코드) | 중간 (프롬프트 기반) |
| **재사용** | 여러 에이전트 공유 | 프로젝트별 |
| **설정** | mcp.json 필요 | 파일 복사만 |
| **용도** | 외부 시스템 연결 | 워크플로우 자동화 |

---

#### 3-4. 커뮤니티 탐색 체크리스트

외부 스킬/MCP를 탐색할 때 필수 확인 항목:

**탐색 체크리스트**:
- [ ] **검색어**: "awesome claude code skills", "claude-code-{도메인}", "mcp server {기능}"
- [ ] **GitHub**: README, 예시 코드, 이슈 확인
- [ ] **npm/pip**: 설치 명령어, 의존성 확인
- [ ] **MCP**: modelcontextprotocol organization 확인

**선택 체크리스트**:
- [ ] **최신성**: 6개월 이내 업데이트
- [ ] **검증**: GitHub stars 50+ (스킬), 100+ (MCP)
- [ ] **문서화**: README 완성도, 사용 예시, API 문서
- [ ] **라이센스**: MIT, Apache (상업적 사용 가능)
- [ ] **활성도**: 이슈 응답 속도, PR 머지 빈도

**보안 체크리스트** (필수):
- [ ] **코드 리뷰**: 설치 전 스크립트 내용 확인
- [ ] **권한 확인**: 파일 시스템 접근, 네트워크 요청 범위
- [ ] **의존성 검증**: package.json/requirements.txt에서 위험한 패키지 확인
- [ ] **출처 신뢰**: 공식 organization 또는 검증된 개발자
- [ ] **샌드박싱**: 테스트 환경에서 먼저 실행

**위험 신호** (즉시 제외):
- ❌ 최근 1년 업데이트 없음
- ❌ Stars < 10 (신생 프로젝트)
- ❌ README 없음 또는 불완전
- ❌ 라이센스 불명확
- ❌ 의존성에 deprecated 패키지 포함
- ❌ 코드에 eval(), exec(), shell 명령 직접 실행

---

#### 3-5. 설치 후 검증

외부 스킬 설치 후 반드시 검증:

```javascript
// 1. 스킬 파일 확인
Read("~/.claude/commands/downloaded-skill.md")

// 2. 테스트 실행 (안전한 인자로)
Skill({
  skill: "downloaded-skill",
  args: "--test --dry-run"
})

// 3. 로그 확인 (예상치 못한 동작 감지)
Bash("tail -f ~/.claude/logs/skill-execution.log")

// 4. 문제 발견 시 즉시 제거
Bash("rm ~/.claude/commands/downloaded-skill.md")
```

**평가 기준 요약**:
- ✅ **최신성**: 6개월 이내 업데이트
- ✅ **검증**: GitHub stars 50+ (스킬), 100+ (MCP)
- ✅ **문서화**: README, 사용 예시 완비
- ✅ **라이센스**: MIT, Apache
- ✅ **보안**: 코드 리뷰, 권한 확인, 샌드박싱
- ✅ **활성도**: 이슈/PR 활발

**커뮤니티 스킬 활용 시 원칙**:
1. **신뢰 > 편의**: 불명확하면 사용 안 함
2. **테스트 필수**: 프로덕션 전 샌드박스 환경 테스트
3. **최소 권한**: 필요한 최소 권한만 부여
4. **지속 모니터링**: 업데이트 추적, 보안 이슈 확인

---

### 4순위: 신규 스킬 생성

위 모두 없으면 직접 스킬 생성.

**신규 스킬 템플릿**:

**파일명**: `~/.claude/commands/[스킬명].md` (전역) 또는 `.claude/commands/[스킬명].md` (프로젝트)

**템플릿**:
```markdown
# [스킬명] (예: API Design Skill)

## 목적
[이 스킬이 하는 일을 한 줄로]

## 사용법
\```javascript
Skill({skill: "[스킬명]", args: "[인자]"})
\```

## 실행 로직

### Step 1: [단계 1 제목]
[무엇을 하는가]

### Step 2: [단계 2 제목]
[무엇을 하는가]

### Step 3: [단계 3 제목]
[무엇을 하는가]

## 제약사항
- [금지 사항 1]
- [금지 사항 2]

## 출력
- [기대 결과물]

## 예시
\```javascript
// 실제 사용 예시
Skill({
  skill: "[스킬명]",
  args: "구체적인 작업 내용"
})
\```
```

**생성 후 즉시 활용**:
```javascript
// 1. 새 스킬 작성
Write("~/.claude/commands/api-design.md", [템플릿 내용])

// 2. 즉시 사용
Skill({skill: "api-design", args: "User 엔티티 RESTful API 설계"})
```

---

## Phase 2. 스킬 조합 전략 (Skill Combo)

역할별 최적 스킬 세트 편성.

### 역할별 스킬 프로파일 (Skill Profile)

| 역할 | 필수 스킬 | 선택 스킬 | 용도 |
|------|----------|----------|------|
| **코딩 분대장** | `/deploy-subagent`<br>`/deploy-skill`<br>`/create-image` | `/api-design`<br>`/test-suite` | API 개발, 이미지 생성 |
| **QA 분대장** | `/deploy-subagent`<br>`/review-evaluate` | `/test-suite`<br>`/code-review` | 테스트/검증 자동화 |
| **디자인 분대장** | `/create-image`<br>`/review-evaluate` | `/ui-prototype`<br>`/component-library` | UI/UX 설계, 프로토타입 |
| **범용 분대장** | `/deploy-subagent`<br>`/deploy-skill`<br>`/create-image`<br>`/review-evaluate` | 프로젝트별 커스텀 | 모든 작업 대응 |

### 프로파일 자동 추천 (키워드 매칭)

작업 키워드에서 권장 스킬 자동 추천.

| 작업 키워드 | 권장 스킬 |
|-----------|----------|
| "API", "엔드포인트", "REST" | `/api-design`, `/deploy-subagent` |
| "테스트", "검증", "QA" | `/test-suite`, `/deploy-subagent` |
| "다이어그램", "이미지", "시각화" | `/create-image` |
| "UI", "컴포넌트", "디자인" | `/ui-prototype`, `/create-image` |
| "문서", "README", "가이드" | `/generate-docs`, `/deploy-subagent` |

### 스킬 조합 예시 (Combo)

**시나리오 1: 완전한 API 개발**
```javascript
// 1. API 설계
Skill({skill: "api-design", args: "User CRUD API 설계"})

// 2. 서브에이전트로 구현
Skill({skill: "deploy-subagent", args: "API 구현"})

// 3. 테스트 스위트 생성
Skill({skill: "test-suite", args: "User API 테스트"})

// 4. API 문서 생성
Skill({skill: "generate-docs", args: "User API 문서화"})

// 5. 아키텍처 다이어그램
Skill({skill: "create-image", args: "API 아키텍처 다이어그램 SVG"})
```

**시나리오 2: QA/검증 파이프라인**
```javascript
// 1. 코드 리뷰 에이전트 투입
Skill({skill: "deploy-subagent", args: "코드 리뷰"})

// 2. 테스트 자동 생성
Skill({skill: "test-suite", args: "전체 테스트 커버리지"})

// 3. 성능 벤치마크
Skill({skill: "performance-test", args: "API 성능 측정"})

// 4. 검증 리포트 생성
Skill({skill: "generate-report", args: "QA 리포트"})
```

---

## Phase 3. 스킬 설치 및 관리

### 외부 스킬 자동 설치

**WebSearch + WebFetch + Write 자동화**:

```javascript
// 전체 자동 설치 함수
async function installSkill(skillName) {
  // 1. GitHub에서 스킬 검색
  const searchResult = await WebSearch(`${skillName} claude code skill github 2026`);

  // 2. 첫 번째 결과 URL 추출
  const repoUrl = searchResult.urls[0];

  // 3. Raw 파일 URL 확인
  const rawUrl = await WebFetch({
    url: repoUrl,
    prompt: `${skillName}.md의 raw 파일 URL을 찾아라.`
  });

  // 4. 다운로드 및 설치
  await Task({
    description: `${skillName} 스킬 설치`,
    prompt: `
curl -o ~/.claude/commands/${skillName}.md ${rawUrl}
다운로드 완료 후 파일 확인하고 "installed ${skillName}" 보고.
`,
    subagent_type: "Bash",
    model_preference: "haiku"
  });

  // 5. 즉시 사용 가능
  console.log(`${skillName} 설치 완료. Skill({skill: "${skillName}"})로 사용 가능.`);
}

// 사용 예시
installSkill("api-design");
```

### 스킬 업데이트

```bash
# 전역 스킬 모두 업데이트 (Git 기반)
cd ~/.claude/commands/
git pull origin main

# 또는 개별 스킬 재다운로드
curl -o ~/.claude/commands/api-design.md \
  https://raw.githubusercontent.com/awesome-claude/skills/main/api-design.md
```

### 스킬 제거

```bash
# 사용하지 않는 스킬 제거
rm ~/.claude/commands/[스킬명].md
```

---

## Phase 4. 스킬 프로파일 (임무별 권장)

### 프로젝트 시작 단계

**권장 스킬** (분대장용):
- `/deploy-skill` — 필요 스킬 조합 편성
- `/deploy-subagent` — 초기 탐색/설계
- `/create-image` — 프로토타입 다이어그램

### 개발 단계

**권장 스킬** (분대장용):
- `/deploy-subagent` — 개발 에이전트 투입
- `/deploy-skill` — 스킬 조합 최적화
- `/api-design` — API 설계 (커스텀)
- `/test-suite` — 테스트 작성 (커스텀)
- `/review-evaluate` — 코드 품질 평가

### 배포 단계

**권장 스킬** (분대장용):
- `/deploy-subagent` — 배포 자동화
- `/review-evaluate` — 최종 품질 검증
- `/generate-docs` — 문서 생성 (커스텀)
- `/create-image` — 최종 다이어그램

> **참고**: 소대 편성(/platoon-formation)은 소대장이 프로젝트 시작 전에 실행

---

## Phase 5. 스킬 개발 가이드 (신규 스킬 생성)

### 스킬 생성 체크리스트

- [ ] **목적 명확**: 이 스킬이 해결하는 문제는?
- [ ] **재사용 가능**: 여러 번 쓸 수 있는가?
- [ ] **단일 책임**: 하나의 명확한 목적만?
- [ ] **문서화**: 사용법, 예시 포함?
- [ ] **테스트**: 실제로 작동하는가?

### 스킬 작성 원칙

1. **간결함**: 500줄 이내 권장
2. **명확한 Step**: 단계별 실행 로직
3. **예시 포함**: 실제 사용 코드
4. **제약 명시**: 하지 말아야 할 것
5. **출력 정의**: 기대 결과물

### 고품질 스킬 특징

**좋은 스킬**:
- 목적이 명확 (예: `/api-design` — API 설계만)
- 재사용 가능 (프로젝트 간)
- 문서화 완벽 (README, 예시)
- 테스트됨 (실제 사용 이력)

**나쁜 스킬**:
- 너무 범용적 (예: `/do-everything`)
- 일회성 (한 번만 쓰고 버림)
- 문서 없음 (사용법 불명확)
- 검증 안 됨 (작동 안 할 수 있음)

### 스킬 공유 (커뮤니티 기여)

좋은 스킬은 GitHub에 공유:

```bash
# 1. 스킬 리포지토리 생성
git init my-claude-skills
cd my-claude-skills

# 2. 스킬 파일 추가
cp ~/.claude/commands/api-design.md ./
cp ~/.claude/commands/test-suite.md ./

# 3. README 작성
cat > README.md << 'EOF'
# My Claude Code Skills

## 스킬 목록
- api-design.md — API 설계 스킬
- test-suite.md — 테스트 자동 생성

## 설치 방법
\```bash
curl -o ~/.claude/commands/api-design.md \
  https://raw.githubusercontent.com/[user]/my-claude-skills/main/api-design.md
\```
EOF

# 4. GitHub에 푸시
git add .
git commit -m "Add API design and test suite skills"
git push origin main
```

---

## 고급 전략: 스킬 자동 선택

### 작업 키워드 기반 자동 추천

```javascript
function recommendSkills(taskDescription) {
  const keywords = {
    'api|rest|endpoint': ['/api-design', '/deploy-subagent'],
    'test|qa|검증': ['/test-suite', '/deploy-subagent'],
    'image|diagram|시각화': ['/create-image'],
    'ui|component|디자인': ['/ui-prototype', '/create-image'],
    'doc|readme|문서': ['/generate-docs', '/deploy-subagent']
  };

  const recommended = [];
  for (const [pattern, skills] of Object.entries(keywords)) {
    if (new RegExp(pattern, 'i').test(taskDescription)) {
      recommended.push(...skills);
    }
  }

  return [...new Set(recommended)]; // 중복 제거
}

// 사용 예시
const task = "User API 엔드포인트 설계 및 테스트 작성";
const skills = recommendSkills(task);
console.log("권장 스킬:", skills);
// 출력: ['/api-design', '/deploy-subagent', '/test-suite']
```

### 스킬 체인 (Skill Chain)

여러 스킬을 순차 실행:

```javascript
async function executeSkillChain(skills, context) {
  let result = context;

  for (const {skill, args} of skills) {
    console.log(`실행 중: ${skill}`);
    result = await Skill({skill, args: args || result});
  }

  return result;
}

// 사용 예시: API 개발 전체 파이프라인
executeSkillChain([
  {skill: 'api-design', args: 'User CRUD API'},
  {skill: 'deploy-subagent', args: 'API 구현'},
  {skill: 'test-suite', args: 'API 테스트 생성'},
  {skill: 'generate-docs', args: 'API 문서화'},
  {skill: 'create-image', args: 'API 다이어그램'}
], 'User 관리 시스템');
```

---

## 금지 사항 (안티 패턴)

❌ **절대 하지 말 것**:

1. **스킬 남발**: 단순 작업에 스킬 쓰지 마. 직접 하는 게 빠름.
2. **중복 스킬**: 같은 기능 여러 스킬로 분산 금지.
3. **거대 스킬**: 1000줄 넘는 스킬은 분리하라.
4. **문서 없음**: 사용법 모르는 스킬은 쓸모없음.
5. **미검증 스킬**: 테스트 안 한 스킬 공유하지 마.

---

## 요약 (TL;DR)

1. **탐색**: 현재 보유 → 기본 제공 → 외부 커뮤니티 → 신규 생성 (4단계)
   - 현재: `ls ~/.claude/commands/*.md`
   - 기본: deploy-subagent, create-image, platoon-formation
   - 외부: GitHub awesome 리스트, npm
   - 신규: 직접 .md 파일 작성
2. **조합**: 역할별 스킬 프로파일 (코딩/QA/디자인/범용)
3. **설치**: WebSearch + WebFetch + Write 자동화
4. **개발**: 템플릿 기반 신규 스킬 생성
5. **공유**: GitHub에 공유하여 커뮤니티 기여

**이 커맨드는 최강 스킬 조합 편성 도구다. 분대장의 능력을 확장하는 무기를 선택하고 장착한다.**

---

## 부록: 스킬 vs 에이전트 비교

| 구분 | 스킬 (Skill) | 에이전트 (SubAgent) |
|------|-------------|-------------------|
| **정의** | 슬래시 커맨드 (.md 파일) | Task로 투입되는 AI |
| **위치** | `~/.claude/commands/` | `~/.claude/agents/` 또는 내장 |
| **호출** | `Skill({skill: "name"})` | `Task({subagent_type: "type"})` |
| **비용** | 무료 (코드) | API 비용 (haiku/sonnet) |
| **용도** | 복잡한 전략 캡슐화 | 실제 작업 수행 |
| **예시** | /deploy-subagent, /create-image | general-purpose, Explore |
| **관계** | 에이전트를 호출하는 상위 전략 | 스킬이 호출하는 실행자 |

**원칙**: 스킬로 전략 수립 → 에이전트로 실행
