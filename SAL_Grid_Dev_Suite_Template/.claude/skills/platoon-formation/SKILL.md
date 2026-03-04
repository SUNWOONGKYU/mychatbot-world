---
description: "소대 편제 방식 팀구성 - 소대장+연락병+3분대(Alpha/Bravo/Charlie) 편성"
user-invocable: true
---

# Platoon Formation (소대 편제 방식 팀구성)

현재 프로젝트 디렉토리 이름을 기반으로 Agent Teams 소대를 편성하고, 용병(CLI/API/MCP)을 전략적으로 활용하여 임무를 수행한다.

---

## Phase 1. 팀 생성 및 소대 편성

### Step 1: 팀 생성
- 현재 작업 디렉토리의 폴더명을 추출하여 `{폴더명}-platoon` 이름으로 TeamCreate 실행
- 예: 작업 디렉토리가 `mychatbot-world`이면 → `mychatbot-platoon`

### Step 1-1: HQ 편성 (본부)

| 직책 | 역할 | 모델 | 비고 |
|------|------|------|------|
| **소대장** (team-lead) | Orchestrator, 전략적 의사결정 | opus | 직접 코딩 최소화 |
| **연락병** (Chatbot) | 지휘관(User) ↔ 소대장 간 연락 | - | 채팅 인터페이스 |

### Step 2: 분대장 스폰 (NATO 호출부호)

3명의 Teammate를 백그라운드로 스폰한다. 역할은 임무 배정 시 동적으로 결정한다.

| 호출부호 | 직책 | 기본 역할 | 모델 |
|---------|------|----------|------|
| **Alpha** | 1분대장 | 역할 미정 (임무 시 배정) | sonnet |
| **Bravo** | 2분대장 | 역할 미정 (임무 시 배정) | sonnet |
| **Charlie** | 3분대장 | 역할 미정 (임무 시 배정) | sonnet |

### Step 2-1: 표준 정규병 10명 (각 분대 공통)

각 분대에 10명의 정규병(Sub-Agent)을 배치한다. 분대장이 Task 도구로 투입.

| # | Sub-Agent | 역할 | 기본 모델 |
|---|-----------|------|----------|
| 1 | **frontend-developer** | 프론트엔드 UI 개발 | sonnet |
| 2 | **backend-developer** | 백엔드 API / 서버 로직 | sonnet |
| 3 | **database-developer** | DB 스키마 / 쿼리 최적화 | sonnet |
| 4 | **ui-designer** | UI/UX 디자인 | sonnet |
| 5 | **code-reviewer** | 코드 리뷰 / 품질 검증 | sonnet |
| 6 | **test-runner** | 테스트 실행 / 자동화 | haiku |
| 7 | **debugger** | 디버깅 / 문제 해결 | sonnet |
| 8 | **security-specialist** | 보안 점검 / 취약점 분석 | sonnet |
| 9 | **documentation-writer** | 문서 작성 / README / 가이드 | haiku |
| 10 | **devops-troubleshooter** | 배포 / 환경 / CI-CD / 인프라 | sonnet |

**투입 원칙:** 단순 반복 = haiku, 복잡한 코드/분석 = sonnet, opus 사용 금지

**스폰 프롬프트 템플릿:**
```markdown
너는 "{호출부호}", {프로젝트명}-platoon 소대의 분대장이다.

## 소속 및 역할
- 소대: {프로젝트명}-platoon
- 직책: {분대명} 분대장
- 기본 역할: {역할 설명}
- 임무 배정 방식: 소대장(team-lead)이 지시

## 작전 수행 절차
1. **임무 수령**: 소대장으로부터 TaskAssignment 메시지 수신
2. **작업 확인**: TaskList에서 할당된 작업 확인
3. **작업 Claim**: TaskUpdate로 owner를 자신으로 설정, status를 in_progress로 변경
4. **병력 동원**:
   - 정규병(SubAgent): Task 도구로 haiku/sonnet 모델 투입 (10명 표준 편제)
   - 용병(외부 AI CLI): Bash에서 headless 모드로 호출 (4개 공유 풀)
5. **진행 보고**: 작업 중 중요 변경점이나 블로커 발생 시 SendMessage로 소대장에게 보고
6. **임무 완료**: TaskUpdate로 status를 completed로 변경 후 결과 보고

## 병력 활용 원칙
- **정규병 우선**: 일반적인 작업은 SubAgent(haiku/sonnet)로 처리
- **용병 선택적 투입**: 특화된 작업(대용량 컨텍스트, 빠른 실행)에만 사용
- **용병은 공유 자산**: 소대장·분대장 누구나 호출 가능
- **병렬 투입**: 독립적인 작업은 동시에 여러 병력 투입

## 제약사항
- 직접 코딩 최소화 (병력을 동원하라)
- 완료 보고 없이 대기 상태로 두지 않기
- 작업 실패 시 원인 분석 후 재투입 또는 소대장 보고

## 대기 상태
현재 역할 미정. 소대장의 임무 배정을 대기하라.
```

---

## Phase 2. 용병 투입 전략 (외부 AI — 공유 풀)

용병 4명은 **공유 자산**. 소대장·분대장 누구나 필요 시 호출한다.

### 용병 풀 (Mercenary Pool — Shared)

| # | 용병명 | 제공 | 호출 방법 | 특장점 | 투입 시점 |
|---|-------|------|----------|--------|----------|
| 1 | **Codex** | OpenAI | `codex -p "프롬프트" --full-auto -C "디렉토리"` | 코드 자동 생성/실행 | 새 프로젝트 스캐폴딩, 보일러플레이트 |
| 2 | **Gemini** | Google | `gemini -p "프롬프트" --context-window=2M` | 대용량 컨텍스트(200만 토큰) | 전체 코드베이스 분석, 대규모 리팩토링 |
| 3 | **Grok** | xAI | `grok -p "프롬프트" --fast` | 빠른 응답, 실시간 검색 | 빠른 프로토타이핑, 트렌드 조사 |
| 4 | **Perplexity** | Perplexity | MCP/API (`perplexity_ask` 또는 curl) | 실시간 웹 검색, 리서치 | 최신 정보, API 사양, 베스트 프랙티스 |

### 호출 방법

**CLI 용병 (Codex, Gemini, Grok):**
```bash
# Bash에서 headless 모드로 호출, 결과를 파일로 저장
{CLI 명령어} > /tmp/{용병명}_output.txt 2>&1
```

**리서치 용병 (Perplexity):**
```bash
# 방법 1: MCP 서버 (설정 시)
perplexity_ask 도구 사용

# 방법 2: API 직접 호출
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar","messages":[{"role":"user","content":"질문"}]}' \
  | jq -r '.choices[0].message.content'
```

### 용병 투입 판단 기준

| 용병 | 투입 시점 |
|------|----------|
| **Codex** | 빈 디렉토리에 프로젝트 구조를 빠르게 생성할 때 |
| **Gemini** | 수백 개 파일을 동시에 분석해야 할 때 (Claude 컨텍스트 초과 시) |
| **Grok** | 단순 반복 작업을 빠르게 처리하거나 실시간 트렌드 조사 |
| **Perplexity** | 외부 문서, 최신 정보, Claude 지식 컷오프 이후 정보 필요 시 |

### 핵심: 공유 자산

```
┌────────────────────────────────────────────────────────────┐
│  용병은 특정 분대에 소속되지 않는다!                           │
│  소대장, Alpha, Bravo, Charlie 누구나 호출 가능               │
│  임무에 맞는 용병을 골라 투입하면 된다                         │
└────────────────────────────────────────────────────────────┘
```

---

## Phase 3. 커맨드 연동 (다른 커맨드와의 시너지)

### /deploy-subagent 커맨드와 연동

분대장이 SubAgent를 투입할 때 `/deploy-subagent` 커맨드의 3단계 Fallback 전략을 활용한다.

**연동 방식:**
1. 분대장이 임무를 받으면 `/deploy-subagent`의 Phase 1 탐색 로직 적용
   - 1순위: `~/.claude/agents/` 커스텀 에이전트
   - 2순위: 내장 subagent_type (`general-purpose`, `Explore`, `Plan`, `Bash`)
   - 3순위: 외부 탐색 또는 신규 생성
2. 적합한 에이전트를 찾으면 Task 도구로 투입
3. 에이전트가 없으면 `/deploy-subagent`의 커스텀 에이전트 생성 템플릿 사용

**예시:**
```
Alpha 분대장이 "API 설계" 임무를 받음
→ `~/.claude/agents/api-design-agent.md` 확인
→ 없으면 `Plan` 타입 subagent 사용
→ 결과를 파일로 저장 후 소대장에게 보고
```

### /create-image 커맨드와 연동

이미지 생성이 필요한 임무는 `/create-image` 커맨드의 Decision Tree를 따른다.

**연동 방식:**
1. 분대장이 "다이어그램 생성" 임무를 받음
2. `/create-image`의 Phase 1 Decision Tree로 방식 결정
   - 시퀀스 다이어그램 → Mermaid
   - 대시보드 → HTML→PNG
   - 조직도 → SVG
3. `/create-image`의 Phase 2 템플릿을 사용하여 SubAgent 투입
4. 생성된 이미지 경로를 소대장에게 보고

**예시:**
```
Bravo 분대장이 "시스템 아키텍처 다이어그램" 임무를 받음
→ /create-image Decision Tree 확인
→ 조직도로 판단 → SVG 방식 선택
→ haiku 모델로 SubAgent 투입
→ C:/Users/home/Desktop/architecture.svg 생성
→ 소대장에게 파일 경로 보고
```

---

## Phase 3-1. 스킬 장착 체계 (Skills System)

분대장과 서브에이전트 모두 **스킬(슬래시 커맨드)**을 장착하여 능력을 강화한다.

### 스킬 = 슬래시 커맨드

스킬은 `~/.claude/commands/` (전역) 또는 `.claude/commands/` (프로젝트)에 저장된 재사용 가능한 커맨드다.

**특징**:
- **호출 방법**: `Skill` 도구로 실행 (예: `Skill({skill: "deploy-subagent"})`)
- **공용 가능**: 소대장, 분대장, 서브에이전트 누구나 사용 가능
- **전문성 부여**: 복잡한 전략을 캡슐화하여 즉시 활용

### 현재 장착 스킬 (Available Skills)

| # | 스킬 | 계층 | 용도 | 소대장 | 분대장 | 서브에이전트 |
|---|------|------|------|--------|--------|-------------|
| 1 | `/sal-grid-dev` | Methodology | SAL Grid Dev Suite (9-PART) | O | O | O |
| 2 | `/cpc-engage-1/2/3` | C2 | CPC 소대 투입 (15개 소대) | O | X | X |
| 3 | `/review-evaluate` | C2 | 검토 및 5기준 평가 (통제 프로세스) | O | O | O |
| 4 | `/deploy-subagent` | Deployment | 최정예 서브에이전트 편성 및 투입 | O | O | X (중첩 금지) |
| 5 | `/deploy-skill` | Deployment | 최강 스킬 조합 편성 | O | O | O |
| 6 | `/create-image` | Capability | 이미지 생성 (SVG/HTML/Mermaid/Pillow) | O | O | O |
| 7 | `/doc-generator` | Capability | 문서 생성 (PDF/DOCX/PPTX/XLSX/HWP) | O | O | O |
| 8 | `/youtube-generate` | Capability | YouTube 영상 올인원 제작 | O | O | O |
| 9 | `/deal-news` | Capability | 뉴스 수집 + 이메일 자동화 | O | O | O |
| 10 | `/find-skills` | Capability | 스킬 검색 + 설치 (skills.sh) | O | O | O |

**4-Tier 아키텍처:**
- **Methodology** (1): 개발 방법론 (SAL Grid)
- **C2 — Command & Control** (2): 원격 소대 지휘·통제 (CPC) + 검토·평가 (통제 프로세스)
- **Deployment** (2): 에이전트·스킬 투입 전략
- **Capability** (5): 실무 능력 (이미지, 문서, 검색, 영상, 뉴스)

**총 12 Skills, 6,060+ Lines of Prompt**

### 스킬 활용 방법

#### 분대장이 스킬 사용

분대장은 임무 수행 중 필요한 스킬을 직접 호출:

```javascript
// 예: Alpha 분대장이 서브에이전트 투입 필요 시
Skill({
  skill: "deploy-subagent",
  args: "API 설계 전문 에이전트 투입"
})
```

#### 서브에이전트가 스킬 사용

분대장이 서브에이전트 투입 시, 프롬프트에 스킬 사용 지시:

```javascript
Task({
  description: "이미지 생성 작업",
  prompt: `
너는 디자인 전문 에이전트다.

임무: 시스템 아키텍처 다이어그램 생성

방법:
1. Skill 도구로 /create-image 스킬 호출
2. 조직도 타입 → SVG 방식 선택
3. 생성된 파일 경로 보고

Skill({skill: "create-image", args: "시스템 아키텍처 조직도 SVG"})
`,
  subagent_type: "general-purpose",
  model_preference: "haiku"
})
```

### 스킬 장착 원칙 (3가지 소스)

스킬도 에이전트처럼 3가지 소스에서 확보한다.

| 소스 | 위치 | 확보 방법 | 예시 |
|------|------|----------|------|
| **1. 기본 제공** | `~/.claude/commands/` | Claude Code 설치 시 포함 | deploy-subagent, create-image |
| **2. 사용자 생성** | `.claude/commands/` (프로젝트) | 프로젝트별 커스텀 스킬 작성 | my-deploy.md, custom-test.md |
| **3. 외부 커뮤니티** | GitHub, npm 등 | 공유된 스킬 다운로드 | awesome-claude-skills |

**확보 전략**:
1. 기본 제공 스킬로 충분한지 확인
2. 반복 작업이면 프로젝트별 커스텀 스킬 생성
3. 특수 도메인이면 커뮤니티에서 검색

### 스킬 조합 전략 (Skill Combo)

여러 스킬을 조합하여 복합 임무 수행:

**예시: API 개발 + 문서화 + 이미지 생성**
```javascript
// 1. 서브에이전트 투입으로 API 개발
Skill({skill: "deploy-subagent", args: "API 구현"})

// 2. 문서 생성 (프로젝트 커스텀 스킬)
Skill({skill: "generate-api-docs"})

// 3. 아키텍처 다이어그램 생성
Skill({skill: "create-image", args: "API 아키텍처 다이어그램"})
```

### 스킬 개발 가이드 (신규 스킬 생성)

프로젝트 특화 스킬이 필요하면 `.claude/commands/`에 생성:

**템플릿** (`.claude/commands/my-skill.md`):
```markdown
# My Skill (스킬 이름)

## 목적
[이 스킬이 하는 일]

## 사용법
[호출 방법 및 인자]

## 실행 로직
[단계별 수행 절차]

## 예시
[실제 사용 예시 코드]
```

**생성 후**:
- Skill 도구로 즉시 호출 가능
- 분대장/서브에이전트 모두 사용 가능

---

## Phase 4. 소대 운영 원칙 (최적화 전략)

### 1. 비용 최적화 + 편제표

| 역할 | 인원 | 모델 | 근거 |
|------|------|------|------|
| 소대장 (team-lead) | 1 | opus | 오케스트레이션, 전략적 의사결정 |
| 연락병 (Chatbot) | 1 | - | 지휘관(User) ↔ 소대장 연락 |
| 분대장 (Teammate) | 3 | sonnet | 중간 복잡도 작업, 가성비 최고 |
| 정규병 (SubAgent) | 30 | haiku / sonnet | 10명/분대, 작업 복잡도에 따라 선택 |
| 용병 (외부 AI) | 4 | 타사 모델 | 공유 풀, 특화 작업 |
| **합계** | **39** | | |

**편제 공식:** HQ(2) + 3 Squads × 11(Leader+10) + 4 Mercenaries(Shared) = 39

**원칙:** 정규병 모델은 적재적소 — 단순 반복=haiku, 복잡한 코드/분석/창작=sonnet. opus는 소대장 전용.

### 2. 병렬 처리

독립적인 작업은 **반드시 병렬**로 투입한다.

**좋은 예:**
```
Alpha → API 설계 (Plan)
Bravo → 프론트엔드 구현 (general-purpose)
Charlie → 테스트 작성 (general-purpose)
```

**나쁜 예:**
```
Alpha → 완료 대기 → Bravo → 완료 대기 → Charlie (시간 낭비)
```

### 3. 단일 책임 원칙

각 분대장은 자신의 전문 분야에 집중한다.

| 분대 | 전문 분야 | 주요 작업 예시 |
|------|----------|---------------|
| Alpha | 설계/분석 | 아키텍처 설계, 요구사항 분석, 리서치 |
| Bravo | 개발/구현 | 코드 작성, API 구현, 빌드/배포 |
| Charlie | 문서/QA | 테스트 작성, 문서화, 코드 리뷰 |

### 4. 실패 처리

작업 실패 시 3단계 대응:

1. **재시도**: 동일 방법으로 1회 재시도
2. **대안 투입**: 다른 병력/도구로 재투입
3. **상위 보고**: 2회 실패 시 소대장에게 보고

---

## Phase 5. 대기 상태 보고

편성 완료 후 소대 현황을 표로 보고:

```
╔════════════════════════════════════════════════════════════╗
║      {프로젝트명}-platoon 소대 편성 완료 (39명)             ║
╚════════════════════════════════════════════════════════════╝

[HQ] 소대장(Opus) + 연락병(Chatbot) = 2명

| 분대 | 분대장 | 역할 | 정규병 | 상태 |
|------|--------|------|--------|------|
| 1분대 | Alpha   | 역할 미정 | 10명 (Sub-Agent) | 대기 |
| 2분대 | Bravo   | 역할 미정 | 10명 (Sub-Agent) | 대기 |
| 3분대 | Charlie | 역할 미정 | 10명 (Sub-Agent) | 대기 |

[용병 풀] 공유 자산 — 소대장/분대장 누구나 호출 가능
- Codex (코드 생성)
- Gemini (대용량 분석)
- Grok (실시간 검색)
- Perplexity (리서치)

[스킬] 12 Skills / 6,060+ Lines / 4-Tier Architecture

편제: HQ(2) + 3 x 11(Leader+10) + 4 Mercenaries = 39명
소대 편성 완료. 임무 부여해 주십시오!
```

---

## Phase 6. 임무 수행 흐름도

```mermaid
sequenceDiagram
    participant User
    participant Lead as 소대장 (team-lead)
    participant Alpha as Alpha 분대장
    participant Bravo as Bravo 분대장
    participant Charlie as Charlie 분대장
    participant Agent as SubAgent/용병

    User->>Lead: 임무 부여
    Lead->>Lead: TaskCreate (작업 분해)
    Lead->>Alpha: TaskAssignment (설계)
    Lead->>Bravo: TaskAssignment (개발)
    Lead->>Charlie: TaskAssignment (검증)

    Alpha->>Alpha: TaskUpdate (claim, in_progress)
    Alpha->>Agent: SubAgent 투입 (Plan)
    Agent-->>Alpha: 설계 결과
    Alpha->>Lead: SendMessage (보고)
    Alpha->>Alpha: TaskUpdate (completed)

    Bravo->>Bravo: TaskUpdate (claim, in_progress)
    Bravo->>Agent: 용병 투입 (Codex)
    Agent-->>Bravo: 코드 생성
    Bravo->>Lead: SendMessage (보고)
    Bravo->>Bravo: TaskUpdate (completed)

    Charlie->>Charlie: TaskUpdate (claim, in_progress)
    Charlie->>Agent: SubAgent 투입 (general-purpose)
    Agent-->>Charlie: 테스트 결과
    Charlie->>Lead: SendMessage (보고)
    Charlie->>Charlie: TaskUpdate (completed)

    Lead->>User: 최종 보고
```

---

## Phase 7. 고급 전략

### 1. 동적 역할 전환

임무 특성에 따라 분대장 역할을 유연하게 조정한다.

**예시:**
- 대규모 리팩토링: Alpha(분석), Bravo(코드), Charlie(검증)
- 긴급 버그 픽스: Bravo(개발), Charlie(테스트), Alpha(문서화)
- 신규 기능 추가: Alpha(설계), Bravo(구현), Charlie(문서)

### 2. 용병 조합 전략

여러 용병을 조합하여 복잡한 작업 해결.

**예시:**
```
Gemini (전체 코드 분석) → Codex (코드 생성) → Puppeteer (스크린샷 생성)
```

### 3. 정찰병 활용 최적화

Perplexity를 적극 활용하여 최신 정보 확보.

**활용 시나리오:**
- 새로운 프레임워크 버전 확인
- 베스트 프랙티스 조사
- 에러 메시지 해결 방법 검색
- 경쟁 제품 분석

### 4. 커스텀 에이전트 축적

반복되는 작업은 커스텀 에이전트로 저장.

**절차:**
1. 작업 수행 중 반복 패턴 발견
2. `~/.claude/agents/` 디렉토리에 .md 파일 생성
3. `/deploy-subagent` 템플릿 형식으로 작성
4. 다음 임무부터 재사용

---

## Phase 8. 트러블슈팅

### 문제: 분대장이 응답하지 않는다
- **원인:** Teammate 스폰 실패 또는 메시지 전달 오류
- **해결:** TeamList로 팀 상태 확인 후 재스폰

### 문제: 용병 CLI가 작동하지 않는다
- **원인:** 미설치 또는 환경변수 미설정
- **해결:**
  - CLI 설치 확인: `which {cli명령어}`
  - API 키 확인: `echo $API_KEY_NAME`
  - 설치: 공식 문서 참조

### 문제: 작업이 무한 대기 상태다
- **원인:** TaskUpdate 누락 또는 blockedBy 미해결
- **해결:** TaskList로 블로킹 확인 후 의존성 해소

### 문제: SubAgent 결과가 기대와 다르다
- **원인:** 프롬프트 불명확 또는 모델 선택 오류
- **해결:** 프롬프트 재작성 또는 모델 변경 (haiku→sonnet)

---

## 요약 (Quick Reference)

### 편성 절차
1. TeamCreate (`{폴더명}-platoon`)
2. Alpha, Bravo, Charlie 스폰 (sonnet 모델, 각 10명 정규병)
3. 39명 편제 보고

### 편제표 (39명)
```
HQ (2명)
├── 소대장 (Opus) — Orchestrator
└── 연락병 (Chatbot) — User ↔ 소대장

1분대 (11명): Alpha + 정규병 10명
2분대 (11명): Bravo + 정규병 10명
3분대 (11명): Charlie + 정규병 10명

용병 풀 (4명, 공유): Codex / Gemini / Grok / Perplexity
```

### 정규병 10명 (분대 공통)
frontend-developer, backend-developer, database-developer,
ui-designer, code-reviewer, test-runner, debugger,
security-specialist, documentation-writer, devops-troubleshooter

### 용병 선택 기준
- **Codex**: 새 프로젝트, 보일러플레이트
- **Gemini**: 대용량 컨텍스트 분석
- **Grok**: 빠른 프로토타이핑, 실시간 검색
- **Perplexity**: 최신 정보 리서치

### 스킬 생태계 (12 Skills, 4-Tier)
- **Methodology**: sal-grid-dev
- **C2**: cpc-engage, review-evaluate
- **Deployment**: deploy-subagent, deploy-skill
- **Capability**: create-image, doc-generator, youtube-generate, deal-news, find-skills

### 비용 최적화
- 소대장(opus) → 분대장(sonnet) → 정규병(haiku/sonnet) → 용병(타사)

### 병렬 처리 원칙
- 독립 작업은 반드시 병렬 투입
- 의존 관계 있으면 순차 진행
