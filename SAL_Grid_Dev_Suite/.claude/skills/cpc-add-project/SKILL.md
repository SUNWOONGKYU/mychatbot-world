# /cpc-add-project

새 프로젝트를 CPC에 연결한다: 소대 등록 → Agent Server 폴더 생성 → 바로 실행 가능 상태.

## 사용법

```
/cpc-add-project
/cpc-add-project ValueLink
```

## 실행 절차

### Step 1: 프로젝트 정보 확인

사용자에게 다음을 확인한다 (인자로 안 주었으면 질문):

| 항목 | 예시 | 설명 |
|------|------|------|
| 프로젝트명 | ValueLink | 사람이 읽는 이름 |
| 소대 키 | valuelink | CPC 소대 ID 접두사 (소문자, 하이픈 가능) |
| 소대 수 | 3 | 기본 3개 (1/2/3) |
| 프로젝트 경로 | G:/내 드라이브/ValueLink/ | Agent SDK cwd 경로 |
| 실행 PC | 개발 PC / 별도 PC | agent server를 어디서 실행할지 |

### Step 2: CPC 소대 등록

각 소대를 CPC API로 등록한다 (소대 수는 Step 1에서 확인한 값 사용):

```bash
# 소대 수 변수 사용 (예: 소대_수=3)
for i in $(seq 1 ${소대_수}); do
  curl -s -X POST https://claude-platoons-control.vercel.app/api/platoons \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"${소대키}-${i}\",\"name\":\"${프로젝트명} ${i}소대\",\"status\":\"IDLE\"}"
  echo ""
done
```

등록 성공 확인: `GET /api/platoons` 에서 새 소대 보이는지 확인.

### Step 3: Agent Server 폴더 생성

프로젝트 루트에 `cpc-agent-server/` 폴더를 생성한다.
이미 존재하는 `mychatbot-world/cpc-agent-server/`를 템플릿으로 사용하되,
다음 값만 프로젝트에 맞게 변경한다:

#### config.py

```python
PROJECT_CWD = os.getenv('PROJECT_CWD', '${프로젝트_경로}')
```

#### server.py

```python
# 소대 수에 맞게 조정 (소대 수가 3개면 -1, -2, -3 / 2개면 -1, -2)
TARGET_PREFIXES = tuple(f'${소대키}-{i}' for i in range(1, 소대_수 + 1))
```

시스템 프롬프트도 프로젝트 성격에 맞게 조정:

```python
DEV_PROMPT = """
너는 ${프로젝트명} 개발 소대장이다.
대표님의 개발 명령을 실행한다: 코드 읽기, 수정, 검색, 분석, 배포.
결과는 마크다운 없이 순수 텍스트로 보고한다.
"""
```

#### .env.example

```
SUPABASE_URL=https://hlpovizxnrnspobddxmq.supabase.co
SUPABASE_KEY=eyJ...anon-key
ANTHROPIC_API_KEY=sk-ant-...
# PROJECT_CWD=${프로젝트_경로}
```

#### requirements.txt

```
claude-agent-sdk
supabase
httpx
python-dotenv
```

### Step 4: MEMORY.md 업데이트

`~/.claude/projects/memory/MEMORY.md` 파일의 **소대 ID 매핑** 섹션 테이블에 새 프로젝트 행을 추가한다:

```
| ${디렉토리명} | ${프로젝트명} | ${소대키}-N |
```

### Step 5: cpc-engage 매핑 테이블 업데이트

`~/.claude/skills/cpc-engage/SKILL.md`의 **1단계: 프로젝트 식별** 테이블에 새 프로젝트 행을 추가한다:

| 디렉토리 패턴 | 프로젝트 | 소대 키 접두사 |
|---------------|---------|---------------|
| `${디렉토리명}` | ${프로젝트명} | `${소대키}` |

### Step 6: 완료 보고

다음 형식으로 보고한다:

```
=== CPC 프로젝트 추가 완료 ===

프로젝트: ${프로젝트명}
소대: ${소대키}-1, ${소대키}-2, ${소대키}-3 (IDLE)
Agent Server: ${프로젝트_경로}/cpc-agent-server/

실행 방법:
  cd ${프로젝트_경로}/cpc-agent-server
  pip install -r requirements.txt
  cp .env.example .env  # SUPABASE_KEY 입력
  python server.py
```

## 참고

- CPC API Base: `https://claude-platoons-control.vercel.app`
- Supabase: `hlpovizxnrnspobddxmq` (서울 리전)
- Agent SDK: `claude-agent-sdk` pip 패키지
- 템플릿: `mychatbot-world/cpc-agent-server/` (최초 구현체)
- 예산 기본값: $1.00/명령, permission_mode: bypassPermissions
