# 【서류명】 명세서 (Part 3/6)

---

#### E. Scheduler/Leveler (스케줄러/레벨러)

##### E.1 개요

Scheduler/Leveler는 Graph Builder가 생성한 DAG를 입력받아, 실행 순서를 결정하고, 자원 제약을 고려하여 최적의 스케줄을 산출하는 모듈이다.

##### E.2 용어 정의

**스케줄링(Scheduling):**
생성된 그래프를 바탕으로 작업 실행 순서를 정하고, 동시에 자원 제약(인력, 장비, 시간)을 고려하여 어떤 작업을 언제 병렬로 배치할지 결정하는 최적화 과정이다.

**레벨링(Leveling):**
자원 제약이나 기타 조건에 의해 Level 값을 재조정하는 과정이다. SAL ID의 Level은 논리적 의존 계층을 나타내지만, 실제 실행에서는 자원 가용성 등에 의해 조정이 필요할 수 있다.

##### E.3 기능 상세

**기능 1: 위상정렬(Topological Sort)**

DAG의 노드들을 의존 관계를 만족하는 순서로 정렬한다. 본 발명에서는 Kahn's Algorithm 또는 DFS(Depth-First Search) 기반 알고리즘을 사용한다.

Kahn's Algorithm 개요:
1. 진입 차수(in-degree)가 0인 노드를 큐에 추가
2. 큐에서 노드를 꺼내 결과 리스트에 추가
3. 해당 노드의 모든 후행 노드의 진입 차수를 1 감소
4. 진입 차수가 0이 된 노드를 큐에 추가
5. 큐가 빌 때까지 반복

**기능 2: 자원 제약 고려**

다음과 같은 자원 제약을 모델링하고 고려한다:

| 자원 유형 | 설명 | 제약 조건 예시 |
|----------|------|--------------|
| 인력 | 담당자별 동시 작업 수 | 한 사람이 동시에 3개 이상 작업 불가 |
| 장비 | 공유 자원 제약 | 테스트 서버는 동시에 2개 작업만 가능 |
| 시간 슬롯 | 동시 실행 수 제한 | 전체 시스템에서 동시 10개 작업 제한 |
| 예산 | 비용 제약 | 일일 외주 비용 상한 |

**기능 3: 우선순위/마감(Deadline) 고려**

각 Task의 우선순위와 마감 기한을 고려하여 스케줄을 조정한다:
- 높은 우선순위 Task는 먼저 자원 할당
- 마감이 임박한 Task에 우선권 부여
- Critical Path 상의 Task 우선 처리

**기능 4: 병렬 슬롯팅(Parallel Slotting)**

자원 제약 내에서 병렬 실행 가능한 Task들을 그룹화하고, 각 시간 슬롯에 배치한다.

**기능 5: 충돌/교착 회피**

자원 경합으로 인한 충돌이나 교착 상태(Deadlock)를 탐지하고 회피한다.

**기능 6: 레벨 자동 재배치**

자원 제약이나 최적화 결과에 따라 Task의 실행 레벨을 재배치한다. 이때 SAL ID 자체는 변경하지 않고, 내부적으로 "실행 레벨"을 별도 관리하거나, 필요시 ID Chain을 통해 이동을 기록한다.

**기능 7: 병목(Critical Cell/Task) 탐지**

스케줄 분석을 통해 병목 후보를 탐지하고 표시한다:
- 진입 차수가 높은 노드 (많은 선행 작업에 의존)
- 진출 차수가 높은 노드 (많은 후행 작업에 영향)
- Critical Path 상의 노드
- 자원 사용률이 높은 시간대

**기능 8: KPI/위험점수 산출**

스케줄 분석 결과로 다음과 같은 KPI와 위험 점수를 산출한다:
- Makespan: 전체 완료까지 소요 시간
- 자원 사용률: 각 자원의 활용도
- 대기 시간: Task들의 평균 대기 시간
- 위험 점수: 마감 미준수 가능성

##### E.4 비용함수

스케줄 최적화를 위한 비용함수는 다음과 같이 정의된다:

```
J = α·makespan + β·대기시간 + γ·자원과부하 + δ·리스크
```

| 파라미터 | 의미 | 범위 |
|---------|------|------|
| α | Makespan(전체 완료 시간) 가중치 | 0~1 |
| β | 대기시간 가중치 | 0~1 |
| γ | 자원 과부하 가중치 | 0~1 |
| δ | 리스크 가중치 | 0~1 |

이 파라미터들은 도메인과 프로젝트 특성에 따라 조정할 수 있다. 예를 들어:
- 납기가 중요한 프로젝트: α를 높게 설정
- 인력 부담을 줄여야 하는 경우: γ를 높게 설정
- 리스크 회피가 중요한 경우: δ를 높게 설정

##### E.5 스케줄링 알고리즘 의사코드

```python
def schedule(dag: DAG, resources: ResourcePool) -> Schedule:
    """
    DAG와 자원 풀을 입력받아 최적 스케줄을 산출한다.

    Args:
        dag: 작업 의존 관계 그래프
        resources: 사용 가능한 자원 풀

    Returns:
        최적화된 스케줄 객체
    """
    schedule = Schedule()

    # 1. 위상정렬
    topo_order = topological_sort(dag)

    # 2. 초기 슬롯 할당
    for task_id in topo_order:
        task = dag.get_node(task_id)

        # 선행 작업 완료 시점 계산
        earliest_start = 0
        for pred_id in dag.predecessors(task_id):
            pred_end = schedule.get_end_time(pred_id)
            earliest_start = max(earliest_start, pred_end)

        # 자원 가용성 확인
        available_slot = resources.find_available_slot(
            task=task,
            after=earliest_start,
            required_resources=task.resource_requirements
        )

        # 슬롯 할당
        schedule.assign(task_id, available_slot)
        resources.reserve(task, available_slot)

    # 3. 비용함수 계산
    current_cost = calculate_cost(schedule)

    # 4. 최적화 반복
    max_iterations = 1000
    for i in range(max_iterations):
        # 개선 가능한 이동 탐색
        best_move = find_best_improvement(schedule, dag, resources)

        if best_move is None:
            break  # 더 이상 개선 불가

        # 이동 적용
        schedule.apply_move(best_move)

        # 비용 재계산
        new_cost = calculate_cost(schedule)

        if new_cost >= current_cost:
            schedule.revert_move(best_move)
            break

        current_cost = new_cost

    # 5. 레벨 재배치 (필요시)
    if has_constraint_violation(schedule):
        schedule = adjust_levels(schedule, dag)

    # 6. Critical Path 표시
    schedule.mark_critical_path(dag.get_critical_path())

    return schedule


def calculate_cost(schedule: Schedule) -> float:
    """비용함수 J를 계산한다."""
    alpha, beta, gamma, delta = get_hyperparameters()

    makespan = schedule.get_makespan()
    wait_time = schedule.get_total_wait_time()
    overload = schedule.get_resource_overload()
    risk = schedule.get_risk_score()

    return alpha * makespan + beta * wait_time + gamma * overload + delta * risk
```

##### E.6 증분 재계산(Incremental Computation)

입력의 일부만 변경되었을 때 전체를 다시 계산하지 않고, 변경된 부분과 그 영향을 받는 부분만 선택적으로 재계산하는 기법이다.

```python
def incremental_update(schedule: Schedule, dag: DAG, changed_task: Task):
    """
    특정 Task가 변경되었을 때 증분적으로 스케줄을 갱신한다.

    Args:
        schedule: 기존 스케줄
        dag: 작업 그래프
        changed_task: 변경된 Task
    """
    # 1. 변경 감지 및 마킹
    changed_nodes = {changed_task.sal_id}

    # 2. 영향 범위 추적 (DAG 상에서 후속 노드들)
    affected_nodes = set()
    queue = [changed_task.sal_id]

    while queue:
        node_id = queue.pop(0)
        for successor_id in dag.successors(node_id):
            if successor_id not in affected_nodes:
                affected_nodes.add(successor_id)
                queue.append(successor_id)

    # 3. 영향받는 노드들만 재계산
    for node_id in topological_sort_subset(dag, affected_nodes):
        task = dag.get_node(node_id)

        # 기존 할당 해제
        schedule.unassign(node_id)

        # 새로운 earliest_start 계산
        earliest_start = 0
        for pred_id in dag.predecessors(node_id):
            pred_end = schedule.get_end_time(pred_id)
            earliest_start = max(earliest_start, pred_end)

        # 재할당
        new_slot = find_available_slot(task, earliest_start)
        schedule.assign(node_id, new_slot)

    # 4. 영향받지 않은 노드들은 이전 결과 유지
    # (별도 처리 불필요 - 이미 유지되어 있음)
```

증분 재계산의 이점:
- 처리 시간 단축: 전체 재계산 대비 평균 70~90% 시간 절약
- 시스템 반응성 향상: 사용자 조작에 즉각 반응
- 자원 효율성: CPU/메모리 사용량 감소

---

#### F. 3D Renderer/UI (렌더러/사용자 인터페이스)

##### F.1 개요

3D Renderer/UI는 스케줄링된 Task들을 SAL 3D Grid에 매핑하여 시각화하고, 사용자와의 상호작용을 처리하는 모듈이다.

##### F.2 용어 정의

**매핑(Mapping):**
추출된 구조화 데이터(Stage, Area, Level)를 좌표계나 레이아웃에 대응시키는 과정이다. SAL에서는 Stage=X, Area=Y, Level=Z에 해당 작업을 해당 Cell로 배치하는 것을 의미한다.

**시각화(Visualization):**
매핑된 결과를 사용자가 이해하기 쉽게 화면으로 표현하는 과정이다. 셀과 작업을 3D Grid 상에 색상, 라벨, 아이콘, 툴팁, 진행률 등으로 표시하고, 상태 변화, 병목, 의존 관계를 한눈에 파악할 수 있도록 인터랙션(줌, 필터, 드래그)을 제공한다.

##### F.3 시각화 규칙

**좌표 매핑:**

| 축 | SAL 요소 | 시각화 방향 | 의미 |
|---|---------|-----------|------|
| X | Stage | 좌→우 | 시간/단계 진행 |
| Y | Area | 앞→뒤 | 영역/모듈 구분 |
| Z | Level | 아래→위 | 의존 계층 |

**Task 표현 방식:**

Task는 다음과 같은 형태로 표현될 수 있다:
- **점(Point):** 간략한 뷰에서 위치만 표시
- **카드(Card):** 상세 정보(이름, 담당자, 상태)를 포함
- **스택(Stack):** 동일 Cell 내 복수 Task를 겹쳐서 표시

**상태별 색상 코드:**

| 상태 | 색상 | RGB 값 | 의미 |
|------|------|--------|------|
| Pending | 회색 | #9E9E9E | 대기 중 |
| In Progress | 파란색 | #2196F3 | 진행 중 |
| Completed | 녹색 | #4CAF50 | 완료 |
| Blocked | 빨간색 | #F44336 | 차단됨 |
| At Risk | 주황색 | #FF9800 | 위험 |
| On Hold | 보라색 | #9C27B0 | 보류 |

**진행률 표시:**
각 Task 카드에 진행률을 프로그레스 바 또는 퍼센트로 표시한다.

**의존 엣지 표시:**
Task 간 의존 관계를 3D 공간에서 화살표 선으로 연결한다. Critical Path 상의 엣지는 굵은 빨간색으로 강조한다.

##### F.4 상호작용 폐루프

사용자의 UI 조작이 시스템 전체에 반영되는 폐루프(Closed Loop) 구조:

```
사용자 조작 (Drag&Drop/편집)
        ↓
SAL ID 수정/생성
        ↓
Parser 재파싱
        ↓
Graph Builder 재구성
        ↓
Scheduler 재계산
        ↓
3D Renderer 재렌더링
        ↓
UI 업데이트 → 사용자에게 반영
```

##### F.5 상호작용 기능

**Drag & Drop:**
사용자가 Task를 다른 Cell로 드래그하면:
1. 새로운 좌표(Stage, Area, Level) 계산
2. ID Chain에 새 SAL ID 추가 (이동 기록)
3. DAG 재구성
4. 스케줄 재계산
5. 화면 갱신

**인라인 편집:**
Task 카드를 클릭하여 속성을 직접 편집:
- 담당자 변경
- 일정 조정
- 우선순위 변경
- 선행 Task 추가/제거

**필터/검색:**
다양한 조건으로 Task를 필터링하거나 검색:
- SAL ID 패턴 (예: "S2*" - Stage 2의 모든 Task)
- 상태별 필터
- 담당자별 필터
- 날짜 범위 필터
- 태그 필터

**뷰 전환:**
- 3D 뷰: 전체 구조 파악
- 2D 슬라이스: 특정 Stage, Area, 또는 Level만 표시
- 간트 뷰: 전통적 간트 차트 형식
- 리스트 뷰: 테이블 형식

**줌/회전/팬:**
3D 공간에서 자유롭게 시점을 변경하여 원하는 각도에서 구조를 확인한다.

##### F.6 히스토리/감사 기능

모든 변경 사항을 기록하고 추적:
- 변경 이력 조회 (누가, 언제, 무엇을 변경했는지)
- 스냅샷 저장 및 복원
- 변경 비교 (diff) 뷰
- 감사 로그 자동 생성

---

#### G. Blockchain-style ID Chain (블록체인 스타일 ID 체인)

##### G.1 개요

Blockchain-style ID Chain은 본 발명의 핵심 혁신 중 하나로, 작업의 이동/변경 이력을 불변(Immutable)하게 보존하는 메커니즘이다.

##### G.2 핵심 개념

작업 이동/변경 시 새 SAL ID를 원본 SAL ID 뒤에 언더바(_)로 연결해 순차적으로 누적하는 체인을 구성한다.

**예시:**
```
원본 Task 생성:  S1DE1a
첫 번째 이동:    S1DE1a_S2DE2a
두 번째 이동:    S1DE1a_S2DE2a_S3QA3a
세 번째 이동:    S1DE1a_S2DE2a_S3QA3a_S4QA1
```

**문법:**
```
SALID_chain := SALID ( "_" SALID )*
```

##### G.3 핵심 속성

| 속성 | 설명 | 보장 사항 |
|------|------|----------|
| **Append-only** | 추가만 가능 | 중간 삽입/삭제/수정 금지 |
| **시간순 불변** | 체인은 시간순으로만 증가 | 과거 재작성 불가 |
| **완전 추적성** | 전체 이력의 완전한 추적 가능 | 어떤 경로로 현재에 도달했는지 확인 가능 |

##### G.4 "블록체인 스타일"의 의미

본 발명에서 "블록체인 스타일"이라 함은, 실제 블록체인 기술(분산 합의, 암호학적 해시, P2P 네트워크 등)을 구현하는 것이 아니라, 블록체인의 핵심 개념인 **불변성(Immutability)**과 **추적성(Traceability)**을 차용한 것이다.

구체적으로:
- 분산 합의 프로토콜: 사용하지 않음 (중앙집중식)
- 암호학적 해시 체인: 사용하지 않음 (단순 문자열 연결)
- P2P 네트워크: 사용하지 않음 (단일 서버)
- Append-only 로그: **사용함** (핵심)
- 이력 불변성: **보장함** (핵심)
- 완전 추적성: **보장함** (핵심)

##### G.5 실행 규칙

**현재 노드 규칙:**
체인의 **마지막 SAL ID만** "현재 실행/스케줄/그래프 노드"로 취급한다.

예시:
- 체인: S1DE1a_S2DE2a_S3QA3a
- 현재(current_id): S3QA3a
- 히스토리: S1DE1a, S2DE2a

이 규칙에 의해:
- DAG에서 노드로 참여하는 것은 S3QA3a
- 스케줄링 대상도 S3QA3a
- UI에서 표시되는 위치도 S3QA3a의 좌표 (Stage 3, Area QA, Level 3)

**참조 해석 규칙:**
다른 Task나 문서에서 과거 SAL ID(예: S1DE1a)를 참조하는 경우:
- 기본 모드: 리졸버가 자동으로 최신 SAL ID(S3QA3a)로 해석
- 과거 시점 모드: 명시적으로 해당 시점의 SAL ID로 고정 해석

##### G.6 무결성 규칙

**규칙 1: Append-only**
체인에는 새로운 SAL ID를 끝에 추가하는 것만 허용된다. 중간 삽입, 삭제, 수정은 금지된다.

**규칙 2: 체인 사이클 금지**
체인 내에서 동일한 SAL ID가 중복되어서는 안 된다.

**규칙 3: 길이 제한**
체인의 최대 길이를 제한한다 (예: 32 hop). 이를 초과하면 압축 정책을 적용한다.

**규칙 4: 정정 기록(Roll-forward)**
잘못된 이동이 발생한 경우, 이전 상태로 "롤백"하는 것이 아니라, 정정 이동을 새로 추가(roll-forward)한다.

예시:
```
잘못된 이동: S1DE1a → S1DE1a_S2BE1
정정 이동:   S1DE1a_S2BE1 → S1DE1a_S2BE1_S1DE1a (원래 위치로 이동 기록)
```

##### G.7 데이터 스키마

```sql
-- tasks 테이블
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_id VARCHAR(20) NOT NULL UNIQUE,      -- 현재(최신) SAL ID
    chain_text TEXT,                              -- 전체 체인 문자열 "S1DE1a_S2DE2a_S3QA3a"
    chain_list JSONB DEFAULT '[]',                -- 체인 배열 ["S1DE1a", "S2DE2a", "S3QA3a"]
    chain_length INTEGER DEFAULT 1,               -- 체인 길이
    original_id VARCHAR(20),                      -- 최초 SAL ID
    status VARCHAR(20) DEFAULT 'Pending',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner VARCHAR(100),
    priority INTEGER DEFAULT 5,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    estimated_hours DECIMAL(10,2),
    predecessors JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 제약 조건
    CONSTRAINT chain_length_check CHECK (chain_length >= 1 AND chain_length <= 32)
);

-- chain_events 테이블 (감사 로그)
CREATE TABLE chain_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sal_id VARCHAR(20) NOT NULL,                  -- 추가된 SAL ID
    previous_id VARCHAR(20),                      -- 이전 SAL ID
    action VARCHAR(50) NOT NULL,                  -- 'CREATE', 'MOVE', 'SPLIT', 'MERGE'
    reason TEXT,                                  -- 이동/변경 사유
    actor VARCHAR(100) NOT NULL,                  -- 수행자
    metadata JSONB DEFAULT '{}',                  -- 추가 메타데이터
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- 인덱스를 위한 추가 컬럼
    stage INTEGER,
    area VARCHAR(2),
    level INTEGER
);

-- 인덱스
CREATE INDEX idx_tasks_current_id ON tasks(current_id);
CREATE INDEX idx_tasks_original_id ON tasks(original_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_owner ON tasks(owner);
CREATE UNIQUE INDEX idx_tasks_chain_text ON tasks(chain_text);

CREATE INDEX idx_chain_events_task_id ON chain_events(task_id);
CREATE INDEX idx_chain_events_sal_id ON chain_events(sal_id);
CREATE INDEX idx_chain_events_timestamp ON chain_events(timestamp);
CREATE INDEX idx_chain_events_actor ON chain_events(actor);

-- GIN 인덱스 (JSONB 검색용)
CREATE INDEX idx_tasks_chain_list ON tasks USING GIN (chain_list);
CREATE INDEX idx_tasks_predecessors ON tasks USING GIN (predecessors);
CREATE INDEX idx_tasks_tags ON tasks USING GIN (tags);
```

##### G.8 API 예시

| API | 설명 | 응답 |
|-----|------|------|
| `GET /tasks/{any_sal_id}?resolve=latest` | 과거 ID로 조회해도 최신 Task 반환 | current_id 기준 Task |
| `GET /tasks/{any_sal_id}?mode=historical` | 해당 시점 스냅샷 반환 | 당시 상태 |
| `POST /tasks/{sal_id}/move` | 새 위치로 이동 (체인 Append) | 갱신된 Task |
| `GET /tasks/{sal_id}/chain` | 전체 이동 이력 조회 | 체인 배열 + 이벤트 로그 |
| `GET /tasks/{sal_id}/resolve/{target_id}` | 특정 ID가 현재 어디인지 확인 | 최신 위치 |

##### G.9 체인 Append 알고리즘

```python
def append_chain(task: Task, new_sal_id: str, reason: str, actor: str) -> Task:
    """
    Task의 ID 체인에 새 SAL ID를 추가한다.

    Args:
        task: 대상 Task
        new_sal_id: 새로운 SAL ID
        reason: 이동/변경 사유
        actor: 수행자

    Returns:
        갱신된 Task 객체
    """
    # 1. 새 SAL ID 유효성 검증
    parsed = parse_sal_id(new_sal_id)

    # 2. 중복 검사 (체인 내 동일 ID 금지)
    if new_sal_id in task.chain_list:
        raise ValidationError(f"Duplicate ID in chain: {new_sal_id}")

    # 3. 길이 제한 검사
    if task.chain_length >= MAX_CHAIN_LENGTH:
        raise ChainLengthError(f"Chain length exceeds limit: {MAX_CHAIN_LENGTH}")

    # 4. 이전 current_id 저장
    previous_id = task.current_id

    # 5. 체인 갱신
    task.chain_list.append(new_sal_id)
    task.chain_text = "_".join(task.chain_list)
    task.current_id = new_sal_id
    task.chain_length = len(task.chain_list)
    task.updated_at = now()

    # 6. 감사 로그 기록
    event = ChainEvent(
        task_id=task.id,
        sal_id=new_sal_id,
        previous_id=previous_id,
        action="MOVE",
        reason=reason,
        actor=actor,
        stage=parsed["stage"],
        area=parsed["area"],
        level=parsed["level"],
        timestamp=now()
    )
    save_chain_event(event)

    # 7. Task 저장
    save_task(task)

    # 8. 그래프/스케줄 재계산 트리거
    trigger_incremental_update(task)

    return task
```

---

**(Part 3 끝 - Part 4에서 계속)**
