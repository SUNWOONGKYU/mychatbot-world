---
description: "최정예 서브에이전트(분대원) 편성 및 복합 투입 전략"
user-invocable: true
---

# /deploy-subagent — 최정예 분대원 편성 및 복합 투입 전략 (세계 최고 수준)

**최정예 서브 에이전트 선발 및 투입 커맨드**. 3가지 소스에서 최적의 에이전트를 찾아 분대장의 전투력을 확장한다.

> 이것은 범용 서브 에이전트 투입 시스템이다. 팀 편성(`/platoon-formation`)과는 별개로, 단일 또는 복수의 서브 에이전트를 전략적으로 투입하는 데 사용한다.

---

## 핵심 개념: 분대장 직접 수행 + 서브에이전트 보조

**분대장(Teammate)은 위임만 하는 지휘관이 아니다.** 자기도 총 쏘면서 분대원을 지휘하는 실전 지휘관이다.

| 역할 | 직접 수행 | 서브에이전트 투입 |
|------|----------|-----------------|
| **소대장** (Claude Code) | X — 지휘/조율만 | 분대장에게 임무 부여 |
| **분대장** (Teammate) | **O — 직접 일함** | 필요시 서브에이전트/용병 소환 |
| **분대원** (SubAgent) | O — 위임받은 일 | X |
| **용병** (외부 AI) | O — 전문 분야 | X |

**분대장이 서브에이전트를 투입하는 3가지 상황**:
1. **전문성 부족** — 자기가 못 하는 특수 분야 (예: Rust 최적화, DB 튜닝)
2. **병렬 처리** — 자기 일 하면서 동시에 다른 작업 진행 (예: 코딩하면서 테스트)
3. **대량 반복** — 단순하지만 양이 많은 작업 위임 (예: 100개 파일 포맷 변환)

서브에이전트는 분대장을 **대체하는 게 아니라, 능력을 확장**한다.

---

## 최정예 분대원 편성: 3가지 인력 풀

| 소스 | 위치 | 특징 | 사용 시점 |
|------|------|------|----------|
| **1. Anthropic 내장** | Claude Code 기본 제공 | 즉시 사용 가능, 검증됨 | 표준 작업 |
| **2. 사용자 커스텀** | `~/.claude/agents/*.md` | 프로젝트 특화, 워크플로우 최적화 | 반복 작업 |
| **3. 외부 커뮤니티** | GitHub, npm, MCP marketplace | 전문성, 다양성, 최신 트렌드 | 특수 도메인 |

**선발 원칙**: 적재적소 배치 → 우선순위 준수 → 복합 활용 → 성과 중심

---

## 핵심 원칙 (7대 철칙)

1. **분대장 주도**: 분대장이 직접 일하며, 서브에이전트는 능력 확장 수단
2. **커스텀 우선**: `~/.claude/agents/` 커스텀 에이전트를 최우선 탐색
3. **내장 활용**: Anthropic 제공 내장 타입(Explore, Plan, general-purpose, Bash) 적극 활용
4. **외부 탐색**: 커뮤니티/마켓플레이스, 전문 도구, MCP 연결, 신규 생성
5. **용병 투입**: 서브 에이전트로 안 되면 외부 AI (Codex, Gemini, Grok, Perplexity) 활용
6. **병렬 투입**: 독립적 작업은 동시 실행 (시간 절약)
7. **모델 적합 선택**: 작업 복잡도에 따라 haiku/sonnet 선택 → opus 절대 금지

---

## Phase 1. 에이전트 탐색 (4단계 복합 전략)

작업에 적합한 에이전트/용병을 **순서대로** 탐색. 먼저 찾은 것 우선 사용.

**탐색 순서**: 커스텀 에이전트 → 내장 subagent → 용병(외부 AI) → 외부 탐색/신규 생성

### 1순위: 커스텀 에이전트 (`~/.claude/agents/`)

사전 정의된 전문 에이전트를 최우선 탐색. 커스텀 에이전트는 프로젝트 특화 지식과 워크플로우를 내장하고 있다.

#### 탐색 방법
```bash
# 1. 모든 커스텀 에이전트 목록 확인
ls ~/.claude/agents/*.md

# 2. agents-config.json에서 메타데이터 확인 (우선순위, 워크플로우 등)
cat ~/.claude/agents/agents-config.json
```

#### 현재 보유 중인 커스텀 에이전트

| ID | 이름 | 역할 | Type | Priority | 용도 |
|----|------|------|------|----------|------|
| `qa-review-agent` | QA/Review Agent | 검토 및 분석 | general-purpose | 1 | 코드베이스 스캔, 문제 식별, Root cause 분석 |
| `fixer-agent` | Fixer Agent | 수정 및 구현 | general-purpose | 2 | 코드 수정, 빌드 검증, Git 커밋/푸시 |
| `reviewer-agent` | Reviewer Agent | 최종 검증 | general-purpose | 3 | 수정사항 검증, 배포 준비 확인 |
| `project-manager-agent` | Project Manager | 프로젝트 관리 | general-purpose | 0 | 전체 조율, 진행상황 추적, 리포트 |

*(출처: `/c/Users/home/.claude/agents/agents-config.json`)*

#### 표준 워크플로우

**기본 3단계 워크플로우**:
```
QA Review Agent (분석)
  → Fixer Agent (수정)
    → Reviewer Agent (검증)
```

**Project Manager 포함 5단계 워크플로우**:
```
Project Manager (계획)
  → QA Review (분석)
    → Fixer (수정)
      → Reviewer (검증)
        → Project Manager (리포트)
```

#### 매칭 전략 (키워드 기반 자동 선택)

작업 설명에서 키워드를 추출하여 적합한 에이전트 자동 매칭:

| 키워드 | 매칭 에이전트 | 이유 |
|--------|--------------|------|
| "분석", "검토", "문제점", "스캔" | `qa-review-agent` | 코드 분석 전문 |
| "수정", "구현", "빌드", "커밋" | `fixer-agent` | 코드 수정 전문 |
| "검증", "확인", "배포 준비", "테스트" | `reviewer-agent` | 품질 검증 전문 |
| "계획", "조율", "관리", "리포트" | `project-manager-agent` | 프로젝트 관리 전문 |

#### 투입 예시 (커스텀 에이전트 활용)

**예시 1: QA Review Agent 투입**
```javascript
// 1. 에이전트 정의 읽기
const agentDef = Read("~/.claude/agents/qa-review-agent.md")
const agentConfig = Read("~/.claude/agents/agents-config.json")

// 2. 정의 기반 프롬프트 작성 및 투입
Task({
  description: "전체 코드베이스 분석 및 문제점 파악",
  prompt: `
너는 QA/Review Agent다.

역할: 코드베이스 분석 및 모든 문제점 파악 (${agentDef.role})

임무:
1. G:/프로젝트/src/ 폴더의 모든 파일 스캔
2. 색상 시스템, 레이아웃, 데이터 표시 검증
3. 문제점을 Critical/High/Medium/Low로 분류
4. Root cause 분석 포함

출력:
- 파일: G:/프로젝트/qa-report.json
- 형식: { "critical": [...], "high": [...], "medium": [...], "low": [...] }

제약:
- 수정하지 마 (검토만)
- 모든 발견사항 문서화

완료 기준:
- 100% 파일 스캔 완료
- 리포트 저장 완료 후 "done" 보고
`,
  subagent_type: "general-purpose",
  model_preference: "sonnet"  // 분석 작업은 sonnet
})
```

**예시 2: Fixer Agent 투입 (QA 리포트 기반)**
```javascript
Task({
  description: "QA 리포트 기반 코드 수정",
  prompt: `
너는 Fixer Agent다.

역할: 코드 수정 및 기능 구현

입력:
- QA 리포트: G:/프로젝트/qa-report.json 읽기
- 수정 대상: Critical과 High 문제만

임무:
1. 리포트의 각 문제를 순차적으로 수정
2. 각 수정 후 빌드 테스트 (npm run build)
3. 빌드 성공 시 Git 커밋
4. 모든 수정 완료 후 Git 푸시

출력:
- Git 커밋 로그
- 수정 완료 리포트

제약:
- QA 리포트에 없는 것은 수정하지 마
- 빌드 실패 시 롤백
- 각 커밋 메시지에 문제 ID 포함

완료 기준:
- 모든 Critical/High 문제 해결
- 빌드 성공
- Git 푸시 완료 후 "done" 보고
`,
  subagent_type: "general-purpose",
  model_preference: "sonnet"  // 코드 수정은 sonnet
})
```

**예시 3: 표준 워크플로우 전체 실행 (병렬 불가, 순차 실행)**
```javascript
// Step 1: QA Review (먼저 실행)
Task({ /* QA Agent 프롬프트 */ })
// 대기 → 결과 확인 → qa-report.json 생성됨

// Step 2: Fixer (QA 완료 후 실행)
Task({ /* Fixer Agent 프롬프트, qa-report.json 참조 */ })
// 대기 → 결과 확인 → 수정 완료, Git 커밋됨

// Step 3: Reviewer (Fixer 완료 후 실행)
Task({
  description: "최종 검증 및 배포 준비 확인",
  prompt: `
너는 Reviewer/Verification Agent다.

역할: 모든 수정사항 최종 검증

검증 체크리스트:
- [ ] 모든 색상 클래스 변환 완료
- [ ] npm run build 성공
- [ ] 에러 없음
- [ ] Git 상태 clean (모두 커밋됨)
- [ ] 배포 준비 완료

출력:
- 검증 결과: OK 또는 FAILED
- 발견된 문제 (있으면)
- 배포 승인/거부

완료 기준:
- 모든 체크리스트 통과 시 "APPROVED" 보고
- 문제 발견 시 "REJECTED: [이유]" 보고
`,
  subagent_type: "general-purpose",
  model_preference: "haiku"  // 검증은 haiku로 충분
})
```

#### 커스텀 에이전트 신규 생성 템플릿

`~/.claude/agents/` 디렉토리에 없는 전문 분야가 필요하면 신규 에이전트 정의 파일 작성:

**파일명**: `~/.claude/agents/[역할명]-agent.md`

**템플릿**:
```markdown
# [에이전트명] Agent

## 역할
[한 줄 설명: 이 에이전트가 담당하는 핵심 책임]

## 책임 (Responsibilities)
- [책임 1]
- [책임 2]
- [책임 3]

## 사용 시나리오
1. **[시나리오 1 제목]**
   - [상세 설명]

2. **[시나리오 2 제목]**
   - [상세 설명]

## 실행 방식
\```bash
Task {
  description: "[작업 설명]",
  prompt: "[상세한 지시사항]",
  subagent_type: "general-purpose"  # 또는 Explore, Plan, Bash
}
\```

## 작업 단계 (옵션)
1. [단계 1]
2. [단계 2]
3. [단계 3]

## 출력 형식
- [기대 결과물 1]
- [기대 결과물 2]

## 제약사항
- [금지 사항 1]
- [금지 사항 2]
```

**agents-config.json에 추가** (옵션):
```json
{
  "agents": [
    // ... 기존 에이전트들 ...
    {
      "id": "new-agent",
      "name": "New Agent",
      "role": "역할 설명",
      "type": "general-purpose",
      "priority": 4,
      "status": "active",
      "description": "에이전트 설명",
      "responsibilities": ["책임1", "책임2"],
      "input": "입력 데이터",
      "output": "출력 결과",
      "trigger": "투입 조건"
    }
  ]
}
```

---

### 2순위: 내장 에이전트 (Anthropic 제공 `subagent_type`)

커스텀 에이전트에 적합한 것이 없으면 내장 타입 사용.

| subagent_type | 용도 | 사용 가능 도구 | 적합한 작업 |
|---------------|------|---------------|------------|
| `general-purpose` | 범용 작업 | 전체 (Read, Write, Edit, Bash, etc.) | 파일 수정, 코드 작성, 실행, 테스트 |
| `Explore` | 코드베이스 조사 | Read, Grep, Glob (읽기 전용) | 대규모 검색, 패턴 분석, 문서 조사 |
| `Plan` | 설계/계획 수립 | Read, Grep, Glob (읽기 전용) | 아키텍처 분석, 작업 계획, 설계 문서 |
| `Bash` | CLI 명령 전용 | Bash만 | Git 작업, 패키지 설치, 빌드 실행 |

**선택 가이드**:
- 파일 수정/생성 필요 → `general-purpose`
- 조사/검색/분석만 → `Explore` (메인 컨텍스트 보호)
- 설계/계획/아키텍처 → `Plan` (읽기만, 메인 컨텍스트 보호)
- CLI 명령만 실행 → `Bash`

**언제 Explore/Plan을 쓰는가?**
- 메인 세션 컨텍스트가 가득 찼을 때
- 대규모 파일/디렉토리 검색 필요 시
- 결과물이 많아 메인 세션을 오염시킬 우려가 있을 때

**예시**:
```javascript
// 코드베이스 전체 조사 → Explore
Task({
  description: "전체 CSS 파일에서 색상 변수 사용 패턴 조사",
  prompt: "모든 .css/.scss 파일을 검색하여 색상 변수 사용 현황 리포트 작성. 누락된 파일 목록 제공.",
  subagent_type: "Explore",
  model_preference: "haiku"
})

// 파일 수정 필요 → general-purpose
Task({
  description: "CSS 변수를 모든 컴포넌트에 적용",
  prompt: "[파일 목록]의 하드코딩된 색상을 CSS 변수로 교체. 완료 후 빌드 테스트.",
  subagent_type: "general-purpose",
  model_preference: "sonnet"
})
```

---

### 3순위: 용병 투입 (외부 AI 활용)

커스텀 에이전트, 내장 에이전트로 해결 안 되면 **외부 AI (용병)** 투입.

#### 용병 개요

Claude Code 서브 에이전트만으로 부족한 경우:
- 특수 도메인 전문성 (Codex의 코드 생성, Gemini의 대용량 컨텍스트)
- 실시간 웹 검색/조사 (Perplexity)
- 빠른 응답 필요 (Grok)

용병은 **Bash 타입 서브 에이전트**가 CLI 또는 API로 호출하여 투입.

---

#### Type A: CLI 용병 (Headless 모드)

Bash 서브 에이전트 또는 직접 CLI에서 호출 가능한 외부 AI.

| 용병 | 제공사 | CLI 명령 | 전문 분야 | 비용 |
|------|--------|----------|----------|------|
| **Codex** | OpenAI | `codex -p "프롬프트" --full-auto -C "디렉토리"` | 코드 자동 생성/실행, 버그 수정 | $$$ |
| **Gemini** | Google | `gemini -p "프롬프트"` | 대용량 컨텍스트 (1M+ 토큰), 멀티모달 | $$ |
| **Grok** | xAI | `grok -p "프롬프트"` | 빠른 응답, 실시간 데이터 | $ |

**투입 방법**:

```javascript
// Codex 용병 투입 예시 (코드 자동 생성)
Task({
  description: "Codex 용병: 전체 API 엔드포인트 자동 생성",
  prompt: `
Bash에서 Codex CLI를 호출하여 RESTful API를 자동 생성하라.

명령:
codex -p "Create a complete RESTful API with CRUD operations for User, Post, Comment entities. Use Express.js, MongoDB, JWT authentication. Generate all files in ./api/" --full-auto -C "./api"

Codex가 생성한 파일들을 확인하고, 생성된 파일 목록을 보고하라.
완료 후 "Codex deployment done" 보고.
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})

// Gemini 용병 투입 예시 (대용량 컨텍스트 분석)
Task({
  description: "Gemini 용병: 전체 코드베이스 아키텍처 분석",
  prompt: `
Bash에서 Gemini CLI를 호출하여 전체 프로젝트를 분석하라.

1. 모든 소스 파일을 하나의 텍스트로 결합:
   find ./src -name "*.js" -exec cat {} \\; > all-code.txt

2. Gemini에게 분석 요청:
   gemini -p "Analyze this entire codebase and identify architectural issues, dependencies, and refactoring opportunities. Provide a detailed report." < all-code.txt > gemini-report.md

3. gemini-report.md 내용을 읽어 요약 보고.
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})

// Grok 용병 투입 예시 (빠른 응답)
Task({
  description: "Grok 용병: 최신 기술 트렌드 조사",
  prompt: `
Grok CLI를 사용하여 최신 React 18 best practices를 조사하라.

명령:
grok -p "What are the latest React 18 best practices for server components and streaming SSR in 2026? Provide code examples."

결과를 react-best-practices.md에 저장하고 "Grok research done" 보고.
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})
```

**CLI 용병 사용 시점**:
- 서브 에이전트로 해결 안 되는 복잡한 코드 생성
- 1M+ 토큰 대용량 컨텍스트 필요 (Gemini)
- 실시간 최신 정보 필요 (Grok)

---

#### Type B: API/MCP 용병

API 또는 MCP 서버를 통해 호출하는 외부 AI.

##### Perplexity (실시간 웹 검색/조사 전문)

**1순위: MCP 서버** (설치된 경우)
```javascript
// Perplexity MCP 서버를 통해 조사
Task({
  description: "Perplexity MCP: 최신 기술 조사",
  prompt: `
perplexity_ask 도구를 사용하여 다음을 조사:
- "Best practices for Supabase real-time subscriptions in 2026"
- "How to optimize Next.js 15 app router performance"

각 질문의 답변을 markdown으로 정리하여 research-report.md에 저장.
`,
  subagent_type: "general-purpose",
  model_preference: "haiku"
})
```

**2순위: API 직접 호출** (MCP 없는 경우)
```javascript
Task({
  description: "Perplexity API: 기술 조사",
  prompt: `
Bash에서 Perplexity API를 직접 호출하여 조사하라.

환경변수 확인:
echo $PERPLEXITY_API_KEY

API 호출:
curl -s https://api.perplexity.ai/chat/completions \\
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "sonar",
    "messages": [
      {
        "role": "user",
        "content": "What are the latest best practices for React Server Components and streaming in 2026? Include code examples and performance benchmarks."
      }
    ]
  }' | jq -r '.choices[0].message.content' > perplexity-result.md

결과 확인하고 "Perplexity research done" 보고.
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})
```

**Perplexity 사용 시점**:
- 실시간 웹 검색 필요 (최신 문서, 라이브러리 버전)
- 기술 스택 조사
- 벤치마크 데이터 수집
- Claude의 지식 컷오프 이후 정보

---

#### 용병 투입 Decision Tree

```
작업 분석
  ├─ 커스텀 에이전트 있음?
  │   └─ YES → 1순위: 커스텀 에이전트 투입
  │
  ├─ 내장 subagent_type으로 가능?
  │   └─ YES → 2순위: general-purpose/Explore/Plan/Bash 투입
  │
  ├─ 특수 전문성 필요? (코드 자동 생성, 대용량 컨텍스트)
  │   └─ YES → 3순위: CLI 용병 (Codex/Gemini/Grok)
  │
  ├─ 실시간 웹 검색 필요?
  │   └─ YES → 3순위: API/MCP 용병 (Perplexity)
  │
  └─ 위 모두 불가
      └─ 4순위: 외부 탐색 및 신규 생성
```

---

#### 용병 투입 Best Practices

**1. 용병은 마지막 수단**
- 커스텀 → 내장 → 용병 순서 준수
- 용병은 비용이 높고 통합이 복잡함
- 가능하면 서브 에이전트로 해결

**2. Bash 타입으로 래핑**
- CLI 용병은 항상 Bash 서브 에이전트가 호출
- 직접 호출하지 말고 Task(Bash)로 위임

**3. 환경변수 사전 확인**
- API 키 필요 시 `echo $API_KEY`로 먼저 확인
- 없으면 에러 처리

**4. 결과 파일로 저장**
- 용병 결과는 항상 파일로 저장 (예: `result.md`, `report.json`)
- 서브 에이전트가 파일 읽어서 후속 작업

**5. 비용 모니터링**
- Codex(OpenAI): $$$ (고비용)
- Gemini: $$ (중간)
- Grok: $ (저렴)
- Perplexity: $ (저렴)

---

#### 용병 활용 예시 (복합 전략)

**시나리오: 최신 기술 스택 조사 → 코드 자동 생성 → 검증**

```javascript
// Step 1: Perplexity로 최신 기술 조사 (병렬)
Task({
  description: "Perplexity: React 18 최신 트렌드 조사",
  prompt: "perplexity_ask로 React 18 Server Components best practices 조사. react-trends.md 저장.",
  subagent_type: "general-purpose",
  model_preference: "haiku"
})

Task({
  description: "Perplexity: Next.js 15 성능 최적화 조사",
  prompt: "perplexity_ask로 Next.js 15 app router 최적화 기법 조사. nextjs-perf.md 저장.",
  subagent_type: "general-purpose",
  model_preference: "haiku"
})
// 병렬 실행 → 2개 동시 진행

// Step 2: Codex로 코드 자동 생성 (조사 완료 후)
Task({
  description: "Codex: React 18 + Next.js 15 앱 생성",
  prompt: `
react-trends.md와 nextjs-perf.md를 참고하여 Codex에게 앱 생성 지시:

codex -p "Create a Next.js 15 app with React Server Components, streaming SSR, and optimized performance based on these best practices: $(cat react-trends.md nextjs-perf.md)" --full-auto -C "./generated-app"

생성 완료 후 파일 목록 보고.
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})

// Step 3: 서브 에이전트로 검증
Task({
  description: "생성된 코드 검증",
  prompt: "./generated-app 폴더의 코드를 검토하여 best practices 준수 여부 확인. 문제 발견 시 수정.",
  subagent_type: "general-purpose",
  model_preference: "sonnet"
})
```

---

### 4순위: 외부 탐색 및 신규 생성

용병으로도 해결 안 되면 외부에서 찾거나 새로 만든다.

**전략 순서**: 커뮤니티 에이전트 → 웹 검색 → 패키지 설치 → MCP 연결 → 신규 생성

---

#### 4-0. 커뮤니티/마켓플레이스 에이전트 탐색 (최우선)

다른 개발자들이 공유한 검증된 에이전트를 활용. **외부 탐색의 최우선 전략**.

##### GitHub Awesome 리스트

```javascript
// 1. WebSearch로 awesome 리스트 찾기
WebSearch("awesome claude code subagents github 2026")
// 결과: https://github.com/VoltAgent/awesome-claude-code-subagents

// 2. WebFetch로 리스트 내용 확인
WebFetch({
  url: "https://github.com/VoltAgent/awesome-claude-code-subagents",
  prompt: "SEO 최적화 전문 에이전트의 raw 파일 URL을 찾아라."
})
// 결과: https://raw.githubusercontent.com/.../seo-expert-agent.md

// 3. Bash로 에이전트 다운로드
Task({
  description: "커뮤니티 에이전트 다운로드",
  prompt: `
curl -o ~/.claude/agents/seo-expert-agent.md \
  https://raw.githubusercontent.com/VoltAgent/awesome-claude-code-subagents/main/agents/seo-expert.md

다운로드 완료 후 파일 확인하고 "downloaded" 보고.
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})

// 4. 다운로드한 에이전트 즉시 투입
Task({
  description: "커뮤니티 SEO 에이전트 투입",
  prompt: Read("~/.claude/agents/seo-expert-agent.md") + "\n\n모든 HTML 파일 메타태그 최적화.",
  subagent_type: "general-purpose",
  model_preference: "haiku"
})
```

##### npm/pip Registry

```javascript
// npm에서 claude-code 관련 패키지 검색
WebSearch("npm claude-code agent helper toolkit 2026")

// 발견한 패키지 설치 및 에이전트 생성
Task({
  description: "npm 패키지로 에이전트 생성",
  prompt: `
1. npm install -g claude-agent-toolkit
2. claude-agent-toolkit generate --type "api-tester" --output ~/.claude/agents/api-tester.md
3. 생성된 파일 확인 후 "generated" 보고
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})
```

##### MCP Marketplace

```javascript
// MCP 서버 검색
WebSearch("modelcontextprotocol server marketplace postgres 2026")
WebFetch({
  url: "https://github.com/modelcontextprotocol/servers",
  prompt: "PostgreSQL MCP 서버 설치 방법 찾기"
})

// MCP 서버 설치
Task({
  description: "MCP 서버 설치",
  prompt: `
1. npm install -g @modelcontextprotocol/server-postgres
2. ~/.claude/mcp.json에 서버 설정 추가
3. "mcp installed" 보고
`,
  subagent_type: "Bash",
  model_preference: "haiku"
})
```

**평가 기준**:
- 최신성 (6개월 이내 업데이트)
- 검증 (GitHub stars 100+)
- 문서화 (README, 예시)
- 라이센스 (MIT, Apache)
- 보안 (코드 리뷰)

---

#### 4-1. 웹 검색 (전문 도구 탐색)
해당 분야 전문 라이브러리/도구를 WebSearch로 탐색.

```javascript
// 예: 이미지 최적화 작업
WebSearch("best CLI tool for batch image optimization 2026")
// 결과: imagemagick, sharp-cli, squoosh-cli 등 발견
```

#### 4-2. 패키지/도구 설치
npm, pip, brew 등으로 설치 가능한 CLI 도구 활용.

```javascript
// 예: sharp-cli 설치 후 Bash 타입으로 투입
Task({
  description: "이미지 최적화 실행",
  prompt: "npm install -g sharp-cli를 실행하고, /images/ 폴더의 모든 이미지를 WebP로 변환.",
  subagent_type: "Bash",
  model_preference: "haiku"
})
```

#### 4-3. MCP 서버 연결
관련 MCP 서버가 있으면 연결하여 활용 (예: database, filesystem, API 접근).

#### 4-4. 커스텀 에이전트 신규 생성
위 모두 없으면 `~/.claude/agents/`에 새 전문 에이전트 정의 파일 작성.

**신규 에이전트 템플릿**:
```markdown
# [에이전트명] (예: SEO Optimizer Agent)

## 역할
[한 줄 설명: 이 에이전트가 하는 일]

## 전문 분야
- [분야 1: 예: HTML 메타태그 최적화]
- [분야 2: 예: 구조화된 데이터 생성]

## 작업 절차
1. [단계 1: 예: 모든 HTML 파일 스캔]
2. [단계 2: 예: 메타태그 누락 파악]
3. [단계 3: 예: Open Graph, Twitter Card 추가]

## 제약사항
- [금지 사항: 예: 기존 content 내용 변경 금지]
- [준수 사항: 예: HTML5 표준 준수]

## 출력 형식
- [기대 결과물: 예: 수정된 파일 목록, SEO 점수 리포트]
```

**생성 후 즉시 활용**:
```javascript
// 1. 새 에이전트 정의 작성
Write("~/.claude/agents/seo-optimizer-agent.md", [템플릿 내용])

// 2. 즉시 읽어서 투입
Read("~/.claude/agents/seo-optimizer-agent.md")
Task({
  description: "SEO 최적화",
  prompt: "너는 SEO Optimizer Agent다. [작업 지시]",
  subagent_type: "general-purpose",
  model_preference: "haiku"
})
```

---

## Phase 2. 모델 선택 (작업 복잡도 기반)

**원칙**: 작업 복잡도에 따라 적합한 모델 선택. 무조건 haiku가 아니라 **적재적소**.

| 작업 유형 | 모델 | 근거 | 예시 |
|----------|------|------|------|
| 단순 파일 생성/편집 | `haiku` | 빠르고 저렴 | 텍스트 정리, JSON 포맷팅, CSS 변수 교체 |
| 디자인/포맷 변환 | `haiku` | 템플릿 기반 작업 | Markdown → HTML, 이미지 리사이징 |
| 단순 검색/조사 | `haiku` | 읽기 전용 | 파일 목록, 패턴 검색, 설정 확인 |
| **코드 작성/수정** | `sonnet` | 논리적 추론 필요 | 버그 수정, 리팩토링, API 구현 |
| **복잡한 분석** | `sonnet` | 깊은 이해 필요 | 아키텍처 분석, Root cause 파악 |
| **테스트 작성** | `sonnet` | 엣지 케이스 고려 | Unit test, E2E test |
| **문서/PPT 생성** | `sonnet` | 구조화/창작 필요 | 보고서, 발표자료, 기획서 |
| **디자인 생성** | `sonnet` | 레이아웃 판단 필요 | 복잡한 SVG, HTML 대시보드 |
| **사용 금지** | `opus` | 메인 세션 전용 | (서브 에이전트는 절대 opus 사용 금지) |

**판단 기준**:
1. **단순 반복/변환 → haiku** (예: 100개 파일에서 같은 패턴 교체, PNG 변환)
2. **논리적 추론/창작 → sonnet** (예: 코드 작성, 문서 구조화, 디자인 판단)
3. **애매하면 sonnet** — 품질 우선. 비용 아끼려다 재작업하면 더 비쌈

---

## Phase 3. 프롬프트 작성 원칙 (4-요소 필수)

서브 에이전트 투입 프롬프트는 반드시 **4가지 요소** 포함:

### 1. 역할 (Role)
"너는 ~~ 전문가다" 형태로 명확히 정의.

```
좋은 예: "너는 CSS 리팩토링 전문가다."
나쁜 예: "CSS를 고쳐줘." (역할 불명확)
```

### 2. 입출력 (Input/Output)
- 입력: 어떤 파일/디렉토리/데이터를 읽는가?
- 출력: 어디에 저장하는가? 어떤 형식으로 보고하는가?

```
좋은 예: "G:/project/css/ 폴더의 모든 .css 파일을 읽고, 각 파일을 수정하여 같은 경로에 저장. 수정 목록을 result.json에 저장."
나쁜 예: "CSS 파일 수정해." (입출력 불명확)
```

### 3. 제약 (Constraints)
하지 말아야 할 것, 건드리지 말아야 할 것.

```
좋은 예: "기존 JavaScript 로직은 절대 건드리지 마. HTML 구조 변경 금지. CSS만 수정."
나쁜 예: (제약 없음 → 예상 외 수정 발생 위험)
```

### 4. 완료 기준 (Done Criteria)
무엇이 되면 작업 완료인지, 어떻게 보고하는지.

```
좋은 예: "모든 파일 수정 완료 후 npm run build 실행. 성공하면 'BUILD SUCCESS'와 함께 수정된 파일 목록 보고. 실패하면 에러 로그와 함께 'BUILD FAILED' 보고."
나쁜 예: "다 되면 알려줘." (완료 기준 모호)
```

**전체 예시 (4-요소 모두 포함)**:
```javascript
Task({
  description: "CSS 색상 변수 일괄 적용",
  prompt: `
너는 CSS 리팩토링 전문가다. (역할)

G:/project/css/ 폴더의 모든 .css 파일을 읽고, 하드코딩된 색상 값(#hex, rgb())을 CSS 변수로 교체한다.
교체 후 같은 경로에 저장하고, 수정된 파일 목록을 G:/project/result.json에 저장한다. (입출력)

제약사항:
- .js, .html 파일은 절대 건드리지 마.
- 기존 CSS 레이아웃(display, position 등)은 변경 금지.
- 색상 관련 속성(color, background, border)만 수정. (제약)

완료 기준:
- 모든 .css 파일 수정 완료
- npm run build 실행하여 빌드 성공 확인
- 빌드 성공 시 "BUILD SUCCESS: [수정된 파일 수]개 파일 완료" 보고
- 빌드 실패 시 "BUILD FAILED: [에러 내용]" 보고 (완료 기준)
`,
  subagent_type: "general-purpose",
  model_preference: "haiku"
})
```

---

## Phase 4. 투입 실행 전략

### 4-1. 권한 모드 선택

| 권한 모드 | 사용 시점 | 예시 |
|----------|----------|------|
| `bypassPermissions` | 단순하고 안전한 작업 | 파일 읽기, 검색, 텍스트 정리 |
| `default` | 파일 수정/생성 포함 | 코드 수정, 새 파일 생성 |
| `plan` | 대규모 변경 전 검토 필요 | 100개 이상 파일 수정, 시스템 설정 변경 |

**선택 가이드**:
- 읽기만 → `bypassPermissions`
- 파일 1~10개 수정 → `default`
- 파일 10개 이상 또는 중요 시스템 파일 → `plan`

---

### 4-2. 병렬 투입 (성능 극대화)

독립적인 작업은 **반드시 동시에** 투입한다.

**좋은 예 (병렬)**:
```javascript
// 3개 작업을 동시에 투입 (서로 의존성 없음)
Task({ description: "CSS 정리", prompt: "...", model_preference: "haiku" })
Task({ description: "JS 린트", prompt: "...", model_preference: "haiku" })
Task({ description: "HTML 검증", prompt: "...", model_preference: "haiku" })

// 3개 동시 실행 → 총 소요시간 = max(CSS, JS, HTML) ≈ 1개 시간
```

**나쁜 예 (순차)**:
```javascript
Task({ ... }) → 대기 → 완료 → Task({ ... }) → 대기 → 완료 → Task({ ... })
// 총 소요시간 = CSS 시간 + JS 시간 + HTML 시간 (3배 느림)
```

**언제 병렬 투입하는가?**
- 서로 다른 파일/디렉토리 작업
- 서로 다른 기능 (예: 검색 + 수정 + 테스트)
- 결과가 서로 영향 없음

**언제 순차 투입하는가?**
- 이전 작업 결과가 다음 작업 입력으로 필요 (예: 분석 → 수정 → 검증)
- 같은 파일을 동시 수정 (충돌 위험)

---

### 4-3. 백그라운드 실행

오래 걸리는 작업은 `run_in_background: true`로 실행.

**사용 시점**:
- 10분 이상 소요 예상
- 대규모 빌드/테스트
- 외부 API 호출 대기

**예시**:
```javascript
Task({
  description: "전체 테스트 스위트 실행",
  prompt: "npm test를 실행하고 결과를 test-results.json에 저장.",
  subagent_type: "Bash",
  model_preference: "haiku",
  run_in_background: true  // 백그라운드 실행
})

// 백그라운드로 돌리고, 다른 작업 계속 진행
Task({
  description: "문서 업데이트",
  prompt: "README.md를 최신 상태로 업데이트.",
  model_preference: "haiku"
})
```

---

## 실행 체크리스트

이 커맨드(/deploy-subagent)가 호출되면 아래 순서대로 진행:

### 1. 작업 분석
- [ ] 작업 유형 파악 (검색, 수정, 분석, 실행 등)
- [ ] 필요한 에이전트 수 결정 (1개? 여러 개?)
- [ ] 병렬 가능 여부 판단

### 2. 에이전트 탐색 (3단계)
- [ ] **1순위**: `~/.claude/agents/*.md` 확인 → 적합한 커스텀 에이전트 있나?
- [ ] **2순위**: 없으면 내장 `subagent_type` (general-purpose, Explore, Plan, Bash) 선택
- [ ] **3순위**: 그것도 안 맞으면 외부 도구 탐색 or 신규 에이전트 생성

### 3. 모델 배정
- [ ] 단순 작업 → `haiku`
- [ ] 복잡한 코드/분석 → `sonnet`
- [ ] opus는 절대 사용 금지

### 4. 프롬프트 작성 (4-요소)
- [ ] **역할**: "너는 ~~ 전문가다"
- [ ] **입출력**: 읽을 파일, 저장할 위치, 결과 형식
- [ ] **제약**: 하지 말아야 할 것
- [ ] **완료 기준**: "done" 보고 조건

### 5. 투입 실행
- [ ] 권한 모드 선택 (bypassPermissions / default / plan)
- [ ] 병렬 가능하면 동시 투입
- [ ] 오래 걸리면 백그라운드 실행

### 6. 결과 취합
- [ ] 각 에이전트 결과 수집
- [ ] 성공/실패 여부 확인
- [ ] 최종 리포트 작성 및 보고

---

## 고급 패턴: 복합 전략 예시

### 패턴 1: QA → Fix → Verify (3단계 파이프라인)

```javascript
// 1단계: 커스텀 QA Agent로 분석 (순차)
Task({
  description: "코드베이스 분석",
  prompt: Read("~/.claude/agents/qa-review-agent.md") + "\n전체 CSS 파일 분석하여 문제점 리포트 작성.",
  subagent_type: "general-purpose",
  model_preference: "sonnet"
})
// 대기 → 결과 확인

// 2단계: 커스텀 Fixer Agent로 수정 (순차)
Task({
  description: "문제 수정",
  prompt: Read("~/.claude/agents/fixer-agent.md") + "\nQA 리포트 기반으로 모든 문제 수정.",
  subagent_type: "general-purpose",
  model_preference: "sonnet"
})
// 대기 → 결과 확인

// 3단계: 커스텀 Reviewer Agent로 검증 (순차)
Task({
  description: "최종 검증",
  prompt: Read("~/.claude/agents/reviewer-agent.md") + "\n수정 완료 후 빌드 및 배포 준비 검증.",
  subagent_type: "general-purpose",
  model_preference: "haiku"
})
```

---

### 패턴 2: 병렬 탐색 + 통합

```javascript
// 독립적인 4개 탐색을 동시에 (병렬)
Task({ description: "CSS 파일 탐색", prompt: "모든 CSS 파일에서 색상 변수 사용 패턴 조사", subagent_type: "Explore", model_preference: "haiku" })
Task({ description: "JS 파일 탐색", prompt: "모든 JS 파일에서 API 호출 패턴 조사", subagent_type: "Explore", model_preference: "haiku" })
Task({ description: "HTML 파일 탐색", prompt: "모든 HTML 파일에서 접근성 이슈 조사", subagent_type: "Explore", model_preference: "haiku" })
Task({ description: "의존성 분석", prompt: "package.json 및 node_modules 분석", subagent_type: "Explore", model_preference: "haiku" })

// 4개 결과가 모두 도착하면 → 통합 리포트 작성
```

---

### 패턴 3: 대규모 병렬 수정 (Map-Reduce)

```javascript
// 1단계: 파일 목록 수집
const files = Glob("**/*.css")  // 100개 파일

// 2단계: 파일을 10개씩 묶어서 10개 Task로 병렬 투입 (Map)
const chunks = chunkArray(files, 10)  // [[file1~10], [file11~20], ...]
chunks.forEach(chunk => {
  Task({
    description: `CSS 변수 적용 (${chunk.length}개 파일)`,
    prompt: `${chunk.join(", ")} 파일들의 색상을 CSS 변수로 교체.`,
    subagent_type: "general-purpose",
    model_preference: "haiku"
  })
})

// 3단계: 모든 Task 완료 후 결과 통합 (Reduce)
// → 수정된 파일 총 개수, 빌드 테스트 실행
```

---

## 금지 사항 (안티 패턴)

❌ **절대 하지 말 것**:

1. **Opus 사용 금지**: 서브 에이전트는 haiku/sonnet만 사용. opus는 메인 세션 전용.
2. **순차 실행 남발**: 독립적인 작업은 반드시 병렬 투입.
3. **프롬프트 4-요소 누락**: 역할, 입출력, 제약, 완료 기준 반드시 포함.
4. **커스텀 에이전트 무시**: `~/.claude/agents/`에 적합한 것 있으면 반드시 우선 사용.
5. **모델 과다 사용**: haiku로 되는데 sonnet 쓰지 마. 비용 낭비.
6. **용병 남용**: 서브 에이전트로 되는데 용병(Codex, Gemini) 쓰지 마. 비용 폭증.

---

## 요약 (TL;DR)

1. **탐색**: 커스텀 → 내장 → 용병 → 외부/신규 (4단계)
   - 커스텀: `~/.claude/agents/` (프로젝트 특화)
   - 내장: general-purpose, Explore, Plan, Bash
   - 용병: Codex, Gemini, Grok, Perplexity (특수 전문성)
   - 외부: 웹 검색, 패키지 설치, 신규 생성
2. **모델**: 단순=haiku, 복잡=sonnet (적재적소) → opus 금지
3. **프롬프트**: 역할 + 입출력 + 제약 + 완료 기준 (4-요소 필수)
4. **실행**: 병렬 투입 + 백그라운드 실행
5. **권한**: bypassPermissions (읽기) / default (수정) / plan (대규모)

**이 커맨드는 범용 서브 에이전트 및 용병 투입 도구다. 최적의 에이전트/용병을 찾아 위임하고, 병렬로 투입하여 시간과 비용을 최소화한다.**

---

## 부록: 용병 vs 서브 에이전트 비교

| 구분 | 서브 에이전트 | 용병 (외부 AI) |
|------|--------------|---------------|
| **제공** | Claude Code 내장 | 외부 AI 회사 (OpenAI, Google, xAI 등) |
| **호출** | Task() 도구 | CLI 또는 API (Bash 타입으로 래핑) |
| **비용** | Claude API 비용 (haiku: $, sonnet: $$) | 외부 API 비용 (Codex: $$$, Gemini: $$) |
| **통합** | 네이티브 (도구 사용 가능) | Bash 래핑 필요 (결과 파일로 전달) |
| **전문성** | 범용 코딩 | 특수 도메인 (Codex: 코드 자동 생성, Perplexity: 웹 검색) |
| **사용 시점** | 기본 (1~2순위) | 특수 케이스 (3순위) |

**원칙**: 서브 에이전트로 되면 서브 에이전트. 안 되면 용병. 용병도 안 되면 외부 탐색.
