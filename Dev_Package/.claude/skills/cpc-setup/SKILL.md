---
description: "CPC (Claude Platoons Control) 인프라 구축 - Supabase + Vercel + 소대 등록 + 연락병 배포"
user-invocable: true
---

# /cpc-setup — CPC 인프라 구축

CPC(Claude Platoons Control System)을 **처음부터 끝까지** 자동으로 구축한다.
Supabase DB + Vercel 배포 + 15개 소대 등록 + 연락병(Web UI) 설치까지 완결.

## Usage
/cpc-setup $ARGUMENTS

## Description
1회성 설치 스킬. CPC가 없으면 새로 만들고, 있으면 상태 점검 + 복구.

## Parameters
- $ARGUMENTS: (선택) `check` = 상태 점검만, `reset` = 초기화, 생략 = 전체 설치

---

## 아키텍처 개요

```
소대장 (Claude Code)  ←─ engage ──→  연락병 (CPC Web UI)
       │                                   │
       └────────── CPC API ────────────────┘
                     │
              ┌──────┴──────┐
              │  Supabase   │  cpc_platoons (15개)
              │  (서울)      │  cpc_commands (명령 큐)
              └─────────────┘

소대장 = /cpc-engage-1/2/3 으로 접속
연락병 = CPC Web UI (Vercel) 에서 명령 전송
API    = Vercel Serverless Functions
DB     = Supabase (PostgreSQL + RLS)
```

**3단 분리 원칙:**
| 스킬/커맨드 | 역할 | 시점 |
|------------|------|------|
| `/cpc-setup` (이 스킬) | 인프라 구축 | 최초 1회 |
| `/platoon-formation` | 소대 편제 팀구성 | 프로젝트 시작 |
| `/cpc-engage-1/2/3` | 소대장 접속 | 매 세션 |

---

## Phase 0: Pre-flight 점검

### 0-1. CPC 존재 여부 확인

```bash
# 기존 CPC 동작 확인
curl -s https://claude-platoons-control.vercel.app/api/health
```

| 결과 | 다음 단계 |
|------|----------|
| 200 응답 | Phase 0-2로 (상태 점검) |
| 실패/타임아웃 | Phase 1로 (신규 설치) |

### 0-2. 기존 CPC 상태 점검 (이미 있을 때)

```bash
# 소대 목록 확인
curl -s https://claude-platoons-control.vercel.app/api/platoons | python -m json.tool

# 15개 소대 전부 등록되어 있는지 확인
# 누락된 소대 있으면 Phase 4로 건너뛰어 보충 등록
```

사용자에게 결과 보고 후 필요한 단계만 실행.

### 0-3. 필수 도구 확인

```bash
# Vercel CLI
vercel --version

# Supabase CLI (선택 — SQL Editor 웹으로 대체 가능)
supabase --version

# Node.js
node --version

# Git
git --version
```

**미설치 시 안내:**
```
"CPC 설치를 위해 다음 도구가 필요합니다.

1. Vercel CLI:
   npm install -g vercel
   vercel login

2. Node.js: https://nodejs.org/ (LTS 권장)

설치 완료 후 다시 /cpc-setup 실행해주세요."
```

---

## Phase 1: Supabase 설정

### 1-1. Supabase 프로젝트

**이미 있는 경우** (ref: `hlpovizxnrnspobddxmq`, 서울 리전):
- URL: `https://hlpovizxnrnspobddxmq.supabase.co`
- → Phase 1-2로

**새로 만드는 경우:**
사용자에게 안내:
```
"Supabase 프로젝트 생성이 필요합니다.

1. https://supabase.com/dashboard 접속
2. 'New Project' 클릭
3. 이름: Claude_Platoons_Control
4. Region: Northeast Asia (Seoul) 권장
5. 비밀번호 설정 후 생성

생성 완료 후 다음 정보를 알려주세요:
- Project URL (https://xxxxx.supabase.co)
- anon/public API Key (Settings → API → anon key)
"
```

### 1-2. 테이블 생성

Supabase SQL Editor에서 실행 (또는 사용자에게 안내):

```sql
-- ============================================
-- CPC 테이블 생성 (1회 실행)
-- ============================================

-- 소대 테이블
CREATE TABLE IF NOT EXISTS cpc_platoons (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  purpose     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'IDLE',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 명령 테이블
CREATE TABLE IF NOT EXISTS cpc_commands (
  id          TEXT PRIMARY KEY,
  platoon_id  TEXT NOT NULL REFERENCES cpc_platoons(id),
  text        TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'operator',
  status      TEXT NOT NULL DEFAULT 'PENDING',
  result      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS 정책 (anon 전체 허용)
-- ============================================
ALTER TABLE cpc_platoons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_platoons" ON cpc_platoons
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE cpc_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_commands" ON cpc_commands
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

**상태값 정의:**

| 테이블 | 필드 | 값 | 의미 |
|--------|------|------|------|
| cpc_platoons | status | `IDLE` | 대기 중 |
| | | `RUNNING` | 소대장 접속 중 |
| | | `PAUSED` | 일시 중단 |
| | | `DONE` | 임무 완료 |
| cpc_commands | status | `PENDING` | 대기 (연락병이 보냄) |
| | | `ACKED` | 소대장 수신 확인 |
| | | `DONE` | 처리 완료 |

---

## Phase 2: 프로젝트 파일 생성

### 2-1. 소스 디렉토리 확인

```bash
# 기존 소스가 있는지 확인
ls "G:/내 드라이브/claude-platoons-control/" 2>/dev/null
```

**있으면**: 기존 소스 사용 → Phase 3로
**없으면**: 아래 파일들을 새로 생성

### 2-2. 프로젝트 구조

```
claude-platoons-control/
├── api/
│   ├── _lib/
│   │   └── supabase.js          ← Supabase 클라이언트
│   ├── health.js                ← GET /api/health
│   ├── platoons/
│   │   ├── index.js             ← GET+POST /api/platoons
│   │   └── [id]/
│   │       ├── status.js        ← PATCH /api/platoons/:id/status
│   │       └── commands/
│   │           └── index.js     ← GET+POST /api/platoons/:id/commands
│   └── commands/
│       ├── broadcast.js         ← POST /api/commands/broadcast
│       └── [id]/
│           ├── ack.js           ← PATCH /api/commands/:id/ack
│           └── done.js          ← PATCH /api/commands/:id/done
├── assets/
│   ├── css/
│   │   └── main.css             ← 다크 테마 UI
│   └── js/
│       └── platoons.js          ← 프론트엔드 로직
├── index.html                   ← Web UI 메인 페이지
├── package.json
└── vercel.json
```

### 2-3. 핵심 파일 내용

**`package.json`:**
```json
{
  "name": "claude-platoons-control",
  "version": "1.0.0",
  "type": "module",
  "description": "Claude Platoons Control System",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

**`vercel.json`:**
```json
{
  "version": 2,
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PATCH, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

**`api/_lib/supabase.js`:**
```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

**`api/health.js`:**
```javascript
export default function handler(req, res) {
  res.json({ status: 'ok', service: 'CPC', timestamp: new Date().toISOString() });
}
```

**`api/platoons/index.js`:**
```javascript
import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('cpc_platoons').select('*').order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { id, name, purpose, status } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { data, error } = await supabase
      .from('cpc_platoons')
      .upsert({ id, name: name || '', purpose: purpose || '', status: status || 'IDLE', updated_at: new Date().toISOString() })
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'OPTIONS') return res.status(200).end();
  return res.status(405).json({ error: 'Method not allowed' });
}
```

**`api/platoons/[id]/status.js`:**
```javascript
import { supabase } from '../../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'PATCH only' });

  const { id } = req.query;
  const { status } = req.body;
  if (!['IDLE','RUNNING','PAUSED','DONE'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  const { data, error } = await supabase
    .from('cpc_platoons')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
}
```

**`api/platoons/[id]/commands/index.js`:**
```javascript
import { supabase } from '../../../_lib/supabase.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    let query = supabase.from('cpc_commands').select('*').eq('platoon_id', id).order('created_at', { ascending: false });
    if (req.query.status) query = query.eq('status', req.query.status);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { text, source } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const cmdId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const { data, error } = await supabase
      .from('cpc_commands')
      .insert({ id: cmdId, platoon_id: id, text, source: source || 'operator', status: 'PENDING' })
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'OPTIONS') return res.status(200).end();
  return res.status(405).json({ error: 'Method not allowed' });
}
```

**`api/commands/[id]/ack.js`:**
```javascript
import { supabase } from '../../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'PATCH only' });

  const { id } = req.query;
  const { data, error } = await supabase
    .from('cpc_commands')
    .update({ status: 'ACKED', updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
}
```

**`api/commands/[id]/done.js`:**
```javascript
import { supabase } from '../../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'PATCH only' });

  const { id } = req.query;
  const { result } = req.body || {};
  const update = { status: 'DONE', updated_at: new Date().toISOString() };
  if (result) update.result = result;

  const { data, error } = await supabase
    .from('cpc_commands').update(update).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
}
```

**`api/commands/broadcast.js`:**
```javascript
import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { text, source, platoonIds } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  let ids = platoonIds;
  if (!ids || ids === 'ALL') {
    const { data } = await supabase.from('cpc_platoons').select('id');
    ids = data.map(p => p.id);
  }

  const results = [];
  for (const pid of ids) {
    const cmdId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const { data, error } = await supabase
      .from('cpc_commands')
      .insert({ id: cmdId, platoon_id: pid, text, source: source || 'operator', status: 'PENDING' })
      .select().single();
    results.push(error ? { platoon_id: pid, error: error.message } : data);
  }
  return res.status(201).json({ sent: results.length, results });
}
```

### 2-4. Web UI (index.html)

Web UI는 다크 테마 단일 페이지.
- 좌측 사이드바: 소대 목록 + 신규 등록 폼
- 우측 메인: 선택 소대 정보, 명령 목록 (상태 필터), 명령 입력

**구현 시 핵심:**
- Vanilla JS (프레임워크 없음)
- `fetch()` 로 모든 API 호출
- 상태 뱃지: IDLE=회색, RUNNING=초록, PAUSED=노랑, DONE=파랑
- 명령 상태: PENDING=주황, ACKED=파랑, DONE=초록
- 반응형 (모바일 대응)

**기존 소스가 있으면** (`G:\내 드라이브\claude-platoons-control\index.html` + `assets/`) 그대로 사용.
**없으면** 위 사양에 맞춰 신규 생성.

---

## Phase 3: Vercel 배포

### 3-1. npm 의존성 설치

```bash
cd "G:/내 드라이브/claude-platoons-control"
npm install
```

### 3-2. Vercel 배포

```bash
# 첫 배포 (프로젝트 연결)
vercel

# 프로덕션 배포
vercel --prod
```

**Vercel 설정 확인:**
- Framework Preset: Other
- Root Directory: ./
- Build Command: (없음)
- Output Directory: (없음 — 기본값)

### 3-3. 환경 변수 설정

```bash
# Vercel 환경 변수 등록
vercel env add SUPABASE_URL
# → https://{ref}.supabase.co 입력

vercel env add SUPABASE_ANON_KEY
# → Supabase Dashboard → Settings → API → anon public key 입력
```

**또는** Vercel Dashboard에서 직접 설정:
```
Settings → Environment Variables
├── SUPABASE_URL = https://{ref}.supabase.co
└── SUPABASE_ANON_KEY = eyJhbGci...
```

환경 변수 설정 후 재배포:
```bash
vercel --prod
```

### 3-4. 배포 확인

```bash
# Health check
curl -s https://claude-platoons-control.vercel.app/api/health

# 예상 응답:
# {"status":"ok","service":"CPC","timestamp":"2026-..."}
```

---

## Phase 4: 소대 등록 (5 프로젝트 x 3소대 = 15개)

### 4-1. 소대 매핑 테이블

| 프로젝트 디렉토리 | 프로젝트명 | 소대 ID |
|------------------|-----------|---------|
| `!SSAL_Works_Private` | SSALWorks | `ssalworks-1/2/3` |
| `mychatbot-world` | My Chatbot World | `mychatbot-1/2/3` |
| `AI_Study_Circle` | AI Study Circle | `studycircle-1/2/3` |
| `Development_PoliticianFinder_com` | Politician Finder | `politician-1/2/3` |
| `ValueLink` | ValueLink | `valuelink-1/2/3` |

### 4-2. 일괄 등록 스크립트

```bash
CPC_URL="https://claude-platoons-control.vercel.app"

# SSALWorks
for N in 1 2 3; do
  curl -s -X POST "${CPC_URL}/api/platoons" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"ssalworks-${N}\",\"name\":\"SSALWorks ${N}소대\",\"purpose\":\"SSAL Works 플랫폼 개발\",\"status\":\"IDLE\"}"
  echo ""
done

# My Chatbot World
for N in 1 2 3; do
  curl -s -X POST "${CPC_URL}/api/platoons" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"mychatbot-${N}\",\"name\":\"My Chatbot World ${N}소대\",\"purpose\":\"멀티페르소나 AI 챗봇 개발\",\"status\":\"IDLE\"}"
  echo ""
done

# AI Study Circle
for N in 1 2 3; do
  curl -s -X POST "${CPC_URL}/api/platoons" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"studycircle-${N}\",\"name\":\"AI Study Circle ${N}소대\",\"purpose\":\"AI 스터디 서클 플랫폼\",\"status\":\"IDLE\"}"
  echo ""
done

# Politician Finder
for N in 1 2 3; do
  curl -s -X POST "${CPC_URL}/api/platoons" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"politician-${N}\",\"name\":\"Politician Finder ${N}소대\",\"purpose\":\"정치인 평가 시스템\",\"status\":\"IDLE\"}"
  echo ""
done

# ValueLink
for N in 1 2 3; do
  curl -s -X POST "${CPC_URL}/api/platoons" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"valuelink-${N}\",\"name\":\"ValueLink ${N}소대\",\"purpose\":\"가치 연결 플랫폼\",\"status\":\"IDLE\"}"
  echo ""
done
```

### 4-3. 등록 확인

```bash
curl -s "${CPC_URL}/api/platoons" | python -m json.tool
# 15개 소대가 모두 IDLE 상태로 표시되어야 함
```

---

## Phase 5: Engage 커맨드 설치

### 5-1. 커맨드 위치

```
~/.claude/commands/
├── cpc-engage-1.md
├── cpc-engage-2.md
└── cpc-engage-3.md
```

**이미 있으면**: 내용 확인 후 필요 시 업데이트
**없으면**: 생성

### 5-2. Engage 커맨드 핵심 구조

각 커맨드 파일의 필수 포함 사항:
1. 소대 번호 (1/2/3)
2. **디렉토리 → 소대 ID 매핑 테이블** (5개 프로젝트)
3. 실행 절차:
   - 현재 디렉토리 감지 → 소대 ID 결정
   - **CPC 연결 확인** (`curl /api/health` → 실패 시 `/cpc-setup` 안내)
   - CPC API 조회 → 소대 정보 표시
   - 상태 → RUNNING 변경
   - PENDING 명령 수신 + ACK
   - 명령 실행 → DONE 보고
   - 세션 종료 시 → IDLE 복귀

### 5-3. CPC 연결 확인 (engage에 추가할 부분)

```bash
# Engage 시작 시 CPC 연결 확인
health=$(curl -s -o /dev/null -w "%{http_code}" https://claude-platoons-control.vercel.app/api/health)
if [ "$health" != "200" ]; then
  echo "CPC 미설치. /cpc-setup 으로 먼저 설치하세요."
  exit 1
fi
```

---

## Phase 6: 검증

### 6-1. 엔드포인트 전수 테스트

```bash
CPC_URL="https://claude-platoons-control.vercel.app"

echo "=== 1. Health ==="
curl -s "${CPC_URL}/api/health"

echo -e "\n=== 2. 소대 목록 ==="
curl -s "${CPC_URL}/api/platoons" | python -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)}개 소대 등록됨')"

echo -e "\n=== 3. 소대 상태 변경 ==="
curl -s -X PATCH "${CPC_URL}/api/platoons/mychatbot-1/status" \
  -H "Content-Type: application/json" -d '{"status":"RUNNING"}'

echo -e "\n=== 4. 명령 생성 ==="
curl -s -X POST "${CPC_URL}/api/platoons/mychatbot-1/commands" \
  -H "Content-Type: application/json" -d '{"text":"테스트 명령","source":"setup-test"}'

echo -e "\n=== 5. 명령 조회 ==="
curl -s "${CPC_URL}/api/platoons/mychatbot-1/commands?status=PENDING"

echo -e "\n=== 6. 상태 복원 ==="
curl -s -X PATCH "${CPC_URL}/api/platoons/mychatbot-1/status" \
  -H "Content-Type: application/json" -d '{"status":"IDLE"}'

echo -e "\n=== 검증 완료 ==="
```

### 6-2. Web UI 확인

사용자에게 안내:
```
"CPC 설치가 완료되었습니다!

연락병 (Web UI): https://claude-platoons-control.vercel.app
- 소대 목록이 15개 표시되는지 확인
- 소대 선택 후 명령 전송 테스트
- 상태 뱃지(IDLE/RUNNING) 확인

소대장 접속 테스트:
  /cpc-engage-1 실행 → RUNNING 상태 전환 확인
"
```

### 6-3. 최종 체크리스트

```
[ ] Supabase 테이블 2개 생성 (cpc_platoons, cpc_commands)
[ ] RLS 정책 설정 (anon 전체 허용)
[ ] Vercel 배포 완료
[ ] 환경 변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY)
[ ] /api/health 200 응답
[ ] 15개 소대 등록
[ ] Web UI 접속 가능
[ ] cpc-engage-1/2/3 커맨드 설치
[ ] engage → RUNNING 전환 확인
[ ] 명령 생성 → ACK → DONE 흐름 확인
```

---

## Appendix

### A. API 엔드포인트 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/health` | 서비스 상태 |
| GET | `/api/platoons` | 소대 전체 목록 |
| POST | `/api/platoons` | 소대 등록/갱신 (upsert) |
| PATCH | `/api/platoons/{id}/status` | 소대 상태 변경 |
| GET | `/api/platoons/{id}/commands` | 명령 목록 (?status= 필터) |
| POST | `/api/platoons/{id}/commands` | 명령 추가 |
| PATCH | `/api/commands/{id}/ack` | 명령 수신 확인 |
| PATCH | `/api/commands/{id}/done` | 명령 완료 (+result) |
| POST | `/api/commands/broadcast` | 전체/선택 브로드캐스트 |

### B. 명령 흐름

```
연락병 (Web UI)           CPC API              소대장 (Claude Code)
     │                      │                        │
     │── POST command ──→   │                        │
     │                      │── PENDING ──→          │
     │                      │                        │── ACK
     │                      │←── ACKED ────          │
     │                      │                        │── 작업 수행
     │                      │←── DONE (+result) ──   │
     │←── 결과 표시 ────    │                        │
```

### C. 프로젝트 추가/삭제

**새 프로젝트 추가 시:**
1. Supabase에 소대 3개 등록 (API POST)
2. cpc-engage-1/2/3.md 매핑 테이블에 디렉토리 추가
3. MEMORY.md 소대 ID 매핑 테이블 업데이트

```bash
# 예: newproject 추가
for N in 1 2 3; do
  curl -s -X POST "${CPC_URL}/api/platoons" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"newproject-${N}\",\"name\":\"New Project ${N}소대\",\"purpose\":\"설명\"}"
done
```

**프로젝트 삭제 시:**
- Supabase에서 해당 소대 삭제 (SQL: `DELETE FROM cpc_platoons WHERE id LIKE 'xxx-%'`)
- 관련 명령도 삭제: `DELETE FROM cpc_commands WHERE platoon_id LIKE 'xxx-%'`
- 매핑 테이블에서 제거

### D. 트러블슈팅

| 문제 | 해결 |
|------|------|
| Vercel 배포 실패 | `vercel logs` 확인, env vars 설정 확인 |
| API 500 에러 | Supabase 연결 확인 (URL, Key) |
| CORS 에러 | vercel.json headers 확인 |
| 소대가 안 보임 | Phase 4 등록 스크립트 재실행 (upsert라 안전) |
| engage가 CPC 못 찾음 | `/api/health` 직접 curl → 실패면 Vercel 재배포 |
| Web UI 빈 화면 | 브라우저 콘솔 에러 확인, API URL 확인 |
