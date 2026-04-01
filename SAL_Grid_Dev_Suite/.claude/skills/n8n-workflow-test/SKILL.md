---
description: "n8n 워크플로우 JSON 정적 분석 + 데이터 체인 모의테스트 (드라이런)"
user-invocable: true
---

# /n8n-workflow-test

n8n 워크플로우 JSON 파일을 분석하고, 데이터 흐름을 처음부터 끝까지 추적하여
**실제 실행 전에** 버그와 잠재적 오류를 탐지한다.

`/review-evaluate`가 놓치는 **런타임 데이터 체인 단절** 문제를 이 스킬로 잡는다.

---

## 사용법

```
/n8n-workflow-test [워크플로우 JSON 파일 경로] [--trigger-data='{...}']
```

| 인자 | 필수 | 설명 |
|------|------|------|
| `파일 경로` | ✅ | 검사할 n8n 워크플로우 JSON |
| `--trigger-data` | ❌ | 트리거 입력 데이터 (기본: `{politician_id:"test0001", politician_name:"테스트"}`) |

---

## 실행 순서

```
Phase 1: 정적 구조 분석  (노드/연결 이상 탐지)
     ↓
Phase 2: 데이터 체인 드라이런  (처음부터 끝까지 흐름 추적)
     ↓
Phase 3: 위험 패턴 전수 검사  (return=minimal / $input / Loop / Merge)
     ↓
Phase 4: 통합·환경 점검  ($env 변수 / API 엔드포인트 / Supabase 제한)
     ↓
Phase 5: 버그 수정 + 최종 보고서
```

---

## Phase 1: 정적 구조 분석

### 1-1. 노드 목록 추출
- 전체 노드 수, 노드 ID·이름·타입 목록 작성
- 노드 타입 분류: `code` / `httpRequest` / `if` / `splitInBatches` / `merge` / `webhook` / 기타

### 1-2. 연결 그래프 검증

**고아 노드 탐지 (Orphan Node)**
```
연결 없는 노드 = 실행 불가 노드
→ connections에 한 번도 등장하지 않는 node ID 탐지
```

**단방향 연결 검증**
```
A → B 연결 시:
  - A의 connections에 B가 있는가?
  - B가 실제로 nodes[]에 존재하는가?
  → 존재하지 않는 노드로의 연결 = 즉시 오류
```

**트리거 노드 확인**
```
- webhook / schedule / 수동 트리거 노드가 반드시 1개 이상 존재해야 함
- 트리거 노드가 실제로 연결의 출발점인가?
```

**SplitInBatches 루프 확인**
```
- main[0] (배치 처리) 연결 존재?
- main[1] (루프 종료) 연결 존재?
- 두 출력 모두 연결 없으면 루프가 걸림
```

**Merge waitForAll 확인**
```
- numberInputs: N → 실제 연결된 입력이 N개인가?
- 부족하면 영원히 대기
```

### 1-3. 결과 보고
```
📋 Phase 1 구조 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 노드: N개
  - Code: N개
  - HTTP Request: N개
  - IF: N개
  - SplitInBatches: N개
  - Merge: N개
  - 기타: N개

🚨 고아 노드: [이름, 이름, ...]
🚨 연결 오류: [이름 → 존재하지않는노드]
🚨 루프 미연결: [이름 main[1] 누락]
🚨 Merge 입력 불일치: [이름 numberInputs=3 실제=2]
✅ 트리거 노드: [이름]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phase 2: 데이터 체인 드라이런

**가장 중요한 단계.** 트리거부터 최종 노드까지 데이터 흐름을 직접 추적한다.

### 2-1. 드라이런 규칙

**트리거 입력 설정**
```
기본 테스트 데이터:
  { politician_id: "1e43d6f1", politician_name: "이재준", party: "더불어민주당" }
또는 --trigger-data 인자 사용
```

**노드별 추적 형식**
```
[NodeName] (노드타입)
  입력:  { ... }  ← 이전 노드 출력
  로직:  <핵심 로직 설명>
  출력:  { ... }  ← 이 노드가 내보내는 데이터
  경로:  → 다음노드명  (IF/SplitInBatches는 분기별로)
```

**핵심 추적 원칙**

1. **HTTP Request 노드 출력 규칙**
   ```
   Prefer: return=minimal → 204/201 빈 body → 출력 = {}
   Prefer: return=representation → 실제 데이터 포함
   Prefer: count=exact → headers만 (body = [])
   ```

2. **Code 노드의 $input 해석**
   ```
   $input.first().json → 바로 직전 노드의 출력
   $('NodeName').first().json → 해당 노드의 출력 (직접 참조)

   ⚠️ 직전 노드가 return=minimal이면 $input = {}
   ✅ $('NodeName') 패턴은 직전 노드와 무관하게 안전
   ```

3. **SplitInBatches 출력**
   ```
   main[0] = 현재 배치 아이템 (배치 처리 중)
   main[1] = 완료 신호 (모든 배치 소진)
   ```

4. **Merge waitForAll 출력**
   ```
   모든 입력 도착 후 → append 모드면 모든 아이템 배열로 합침
   ```

### 2-2. 분기 처리

```
IF 노드 → true/false 두 경로 모두 추적
  - 각 분기의 데이터 흐름을 별도로 기술
  - "정상 경로"와 "오류 경로" 구분

SplitInBatches → 루프 반복 N회 시뮬레이션
  - 1회차: 첫 번째 배치 데이터 추적
  - N회차: 마지막 배치 → main[1] 출력 추적
```

### 2-3. 크래시 지점 탐지

추적 중 아래 상황 발생 시 **🚨 CRASH** 표시:
```
- undefined.property 접근 (p = {} 인데 p.name 접근)
- Object.entries(undefined)
- Array.isArray(undefined)
- undefined가 Supabase URL에 포함됨 (?id=eq.undefined)
```

---

## Phase 3: 위험 패턴 전수 검사

Phase 2 드라이런과 별개로, 워크플로우 전체를 스캔한다.

### 패턴 A: return=minimal 체인 단절 (★★★ 최고위험)

V50 모의테스트에서 발견된 핵심 패턴.

```
검사 방법:
1. HTTP Request 노드 중 Prefer 헤더에 return=minimal 포함된 것 전부 목록화
2. 각 노드의 "다음 노드"를 연결에서 추적
3. 다음 노드가 Code 노드인 경우:
   → 해당 Code 노드가 $input.first().json을 사용하는가?
   → 사용하면 → 🚨 CRITICAL: 빈 객체 수신 위험
   → $('NodeName').first().json 패턴이면 → ✅ 안전

⚠️ "Status 노드만 고쳤다" = 패턴을 완전히 해결한 게 아님
→ 모든 HTTP return=minimal 노드에 대해 전수 검사 필수
```

```
검사 대상 예시:
  Status: collecting    → 다음: Generate Collection Prompts → $('Validate Input') 참조 ✅
  Supabase: Save Scores → 다음: P5: Generate HTML       → $input.first().json 사용 🚨
```

### 패턴 B: Loop 피드백 연결 누락

```
SplitInBatches → [처리] → [저장] → (다시 SplitInBatches로 돌아가야 함)

검사:
  저장 노드의 다음 연결이 SplitInBatches main[0]으로 돌아가는가?
  돌아가지 않으면 → 배치 루프가 1회만 실행됨
```

### 패턴 C: Merge numberInputs 불일치

```
Merge 노드의 numberInputs 값과 실제 연결된 입력 수 비교
  numberInputs: 4, 실제 연결: 3 → 영원히 대기 (데드락)
  numberInputs: 3, 실제 연결: 4 → 4번째 입력 무시됨
```

### 패턴 D: $json vs $input 혼용

```
n8n Code 노드에서:
  $json = 현재 아이템 (SplitInBatches 루프 내부에서 유용)
  $input.first().json = 직전 노드 첫 번째 출력

혼용 시 루프 내부에서 의도치 않은 데이터 참조 발생 가능
```

### 패턴 E: 환경변수 undefined

```
$env.SUPABASE_URL 등이 Code 노드 내부에서:
  const url = $env.SUPABASE_URL;  → undefined면 HTTP 요청 실패

→ 워크플로우에서 사용된 모든 $env.X 목록화
→ 실제 존재해야 할 환경변수 목록으로 정리
```

### 패턴 검사 결과 보고
```
🔍 Phase 3 위험 패턴 스캔
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[패턴 A] return=minimal 체인 단절
  검사 대상: N개 HTTP 노드
  🚨 위험: [노드명] → [다음노드명] ($input 사용)
  ✅ 안전: [노드명] → [다음노드명] ($('...') 사용)

[패턴 B] 루프 피드백 누락
  ✅ 이상 없음 / 🚨 [SplitInBatches 노드명] 피드백 누락

[패턴 C] Merge 불일치
  ✅ 이상 없음 / 🚨 [Merge 노드명] numberInputs=N 실제=M

[패턴 D] $json/$input 혼용
  ✅ 이상 없음 / ⚠️ [노드명] 혼용 확인 필요

[패턴 E] 환경변수 목록
  필수 환경변수:
    - SUPABASE_URL
    - SUPABASE_SERVICE_ROLE_KEY
    - GEMINI_API_KEY
    - [기타 탐지된 변수들]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phase 4: 통합·환경 점검

### 4-1. API 엔드포인트 확인
```
- URL에 하드코딩된 엔드포인트 목록화
- $env 변수로 조립되는 동적 URL 패턴 확인
- 잘못된 URL 구성 탐지 (이중 슬래시, 빠진 경로 등)
```

### 4-2. Supabase 1000행 제한
```
Supabase REST API는 기본 limit=1000

검사:
  GET 요청에 &limit= 파라미터가 없는 경우 → 1000행 초과 시 누락 발생
  올바른 패턴: while 루프 + offset pagination
  잘못된 패턴: 단일 GET 요청으로 전체 데이터 가정

탐지:
  - Code 노드 내 httpRequest GET 호출에 limit 없으면 ⚠️ 경고
  - while(true) + offset 패턴 있으면 ✅
```

### 4-3. 타임아웃 설정
```
- HTTP 요청 timeout 미설정 노드 목록화
- 장시간 API (AI 평가, 대량 수집): 최소 60000ms 권장
- 단기 상태 업데이트: 10000~15000ms 적절
```

### 4-4. 에러 처리 경로
```
- IF 노드의 false 분기가 에러 처리로 연결되는가?
- try/catch 없는 Code 노드에서 외부 API 호출 탐지
- 게이트 실패(Gate Fail) 노드가 status=error로 기록하는가?
```

---

## Phase 5: 버그 수정 + 최종 보고서

### 5-1. 발견된 버그 수정

**Critical** 버그: 즉시 수정 (워크플로우 크래시 유발)
**High** 버그: 우선 수정 (데이터 유실, 루프 중단)
**Medium** 버그: 개선 권장 (성능, 안정성)
**Low** 버그: 선택적 개선

수정 후 해당 노드 코드를 직접 편집한다.

### 5-2. 최종 보고서 형식

```
✅ n8n 워크플로우 테스트 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 검사 파일: [파일 경로]
📊 총 노드: N개 | 연결: M개

🔍 Phase 1 구조 분석: ✅ 이상 없음 / 🚨 N건 발견
🔗 Phase 2 드라이런:  ✅ 전체 흐름 정상 / 🚨 N건 CRASH
⚠️ Phase 3 패턴 검사: ✅ 이상 없음 / 🚨 N건 위험
🔌 Phase 4 통합 점검: ✅ 이상 없음 / ⚠️ N건 경고

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
발견된 버그:

[Critical] N건
  • [노드명]: [문제 설명]
    원인: [원인]
    수정: [수정 내용]

[High] N건
  • [노드명]: [문제 설명]

[Medium] N건
[Low] N건

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
수정 완료: N건
잔여 이슈: N건

드라이런 추적 경로:
  Webhook → Validate Input → P0: Register
  → Status: collecting → Generate Prompts
  → [루프 40회] → Gate 1 → ...
  → P5: Generate HTML → Storage Upload → done ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 핵심 교훈 (V50 모의테스트에서 도출)

### 왜 `/review-evaluate`만으로는 부족한가

| 검사 방법 | 발견 가능 | 발견 불가 |
|-----------|----------|----------|
| `/review-evaluate` | 코드 로직 오류, 명명 일관성, 문서 정확성 | 런타임 데이터 체인 단절 |
| `/n8n-workflow-test` | 데이터 흐름 단절, return=minimal 버그, 루프 피드백 누락 | — |

### 패턴 기반 수정의 함정

```
❌ 잘못된 접근:
  "Status 노드들이 HTTP + return=minimal → Code 노드로 교체"
  → 같은 패턴이 다른 노드(Supabase: Save Scores)에도 있었음
  → 발견 못 함

✅ 올바른 접근:
  "return=minimal을 쓰는 모든 HTTP 노드를 전수 목록화"
  → 각각의 다음 노드를 확인
  → $input 사용 여부 검증
  → 패턴 A 전수 검사
```

### 드라이런이 필요한 시점

```
1. 새 워크플로우 처음 작성 완료 후
2. 기존 워크플로우에 노드 추가/수정 후
3. 특정 Phase에서 예상치 못한 동작 발생 시
4. /review-evaluate 이후 (코드 품질 ✅ 후 런타임 검증)
```

---

## 참조

```
외부 스킬 참조:
  proffesor-for-testing/agentic-qe@n8n-workflow-testing-fundamentals
  proffesor-for-testing/agentic-qe@n8n-integration-testing-patterns

내부 프로젝트 참조:
  V50/n8n/v50_single_politician_workflow.json (실전 적용 사례)
  V50/database/v50_schema.sql
```
