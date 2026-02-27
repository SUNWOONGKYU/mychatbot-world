# 【서류명】 명세서 (Part 2/6)

---

### 【과제의 해결 수단】

본 발명은 상기 과제를 해결하기 위해 다음과 같은 기술적 수단을 제공한다. 본 발명의 시스템은 크게 8개의 핵심 구성요소로 이루어진다: (A) SAL 3D Grid 좌표계, (B) SAL ID 스키마, (C) Parser/Normalizer, (D) Graph Builder, (E) Scheduler/Leveler, (F) 3D Renderer/UI, (G) Blockchain-style ID Chain, (H) Reporting/Analytics.

---

#### A. SAL 3D Grid 좌표계

##### A.1 좌표계의 정의

본 발명의 SAL 3D Grid는 3개의 직교 축으로 구성되는 3차원 좌표계이다. 각 축의 정의는 다음과 같다:

**Stage (X축) - 단계/시점:**
Stage는 프로젝트의 시간적 진행 또는 절차적 단계를 나타내는 축이다. 정수 1~99 범위의 값을 가지며, 낮은 숫자가 프로젝트 초기 단계를, 높은 숫자가 후기 단계를 나타낸다.

Stage의 예시적 구성:
- S1: 기획(Planning) - 요구사항 정의, 범위 설정
- S2: 설계(Design) - 아키텍처 설계, 상세 설계
- S3: 개발(Development) - 구현, 코딩
- S4: 테스트(Testing) - 단위 테스트, 통합 테스트
- S5: 배포(Deployment) - 스테이징, 프로덕션 배포
- S6: 운영(Operation) - 모니터링, 유지보수

Stage 값은 도메인에 따라 유연하게 재정의할 수 있다. 예를 들어, 제조 도메인에서는 S1=설계, S2=조달, S3=조립, S4=검수, S5=인도로 정의할 수 있다.

**Area (Y축) - 영역/모듈:**
Area는 프로젝트 내의 기능적 영역, 모듈, 부서, 또는 도메인을 나타내는 축이다. 2자의 대문자 알파벳 코드로 표현되며, 시스템에서 관리되는 코드표(Code Table)에 의해 유효성이 검증된다.

Area의 예시적 코드:
- FE: Frontend - 사용자 인터페이스
- BE: Backend - 서버 로직
- DE: Design - UI/UX 디자인
- QA: Quality Assurance - 품질 보증
- INF: Infrastructure - 인프라, DevOps
- DA: Data/Analytics - 데이터 처리, 분석
- SE: Security - 보안
- DO: Documentation - 문서화

Area 코드표는 프로젝트 초기에 정의되며, 필요에 따라 확장할 수 있다. 최대 26×26=676개의 고유 Area를 정의할 수 있으나, 실무적으로는 10~30개 범위가 일반적이다.

**Level (Z축) - 의존 계층:**
Level은 작업 간 의존성과 수행 순서의 계층을 나타내는 축이다. 정수 1~99 범위의 값을 가지며, 낮은 Level의 작업이 선행(Predecessor), 높은 Level의 작업이 후행(Successor)이 된다.

Level의 의미:
- Level 1: 해당 Stage와 Area에서 가장 먼저 수행되어야 하는 기초 작업
- Level 2: Level 1 작업에 의존하는 2차 작업
- Level 3: Level 2 작업에 의존하는 3차 작업
- ...이하 동일

Level은 동일한 Stage와 Area 내에서의 선후 관계를 나타낸다. 서로 다른 Area 간의 의존성은 별도의 predecessors 속성으로 명시적으로 선언한다.

##### A.2 Cell의 정의

Cell은 SAL 3D Grid에서 특정 (Stage, Area, Level) 좌표에 해당하는 공간적 단위이다. Cell의 특성은 다음과 같다:

**속성 비보유:**
Cell 자체는 어떠한 속성(이름, 설명, 담당자 등)도 갖지 않는다. Cell은 순수하게 좌표 공간을 나타내는 구조적 개념이다.

**병렬 실행 단위:**
동일 Cell 내에 배치된 복수의 Task들은 상호 간에 의존 엣지가 없으므로 병렬 실행이 가능하다. 이것은 본 발명의 핵심 규칙 중 하나이다.

**좌표 주소:**
각 Cell은 (Stage, Area, Level) 튜플로 고유하게 식별된다. 예: (3, "FE", 2)는 Stage 3, Area FE, Level 2에 해당하는 Cell을 나타낸다.

##### A.3 Task의 정의

Task는 실제 실행되는 작업 단위로서, SAL ID에 의해 고유하게 식별된다. Cell이 구조적 자리(Placeholder)라면, Task는 그 자리에 배치되는 실체(Entity)이다.

**Task의 필수 속성:**
- sal_id: SAL ID (고유 식별자)
- name: 작업명
- description: 상세 설명
- status: 상태 (Pending, In Progress, Completed, Blocked 등)

**Task의 선택 속성:**
- owner: 담당자
- start_date: 시작 예정일
- end_date: 종료 예정일
- actual_start: 실제 시작일
- actual_end: 실제 종료일
- priority: 우선순위
- estimated_hours: 예상 소요 시간
- predecessors: 외부 의존 SAL ID 목록
- tags: 태그 목록
- attachments: 첨부 파일
- comments: 코멘트

**Task와 Cell의 관계:**
하나의 Cell에는 0개 이상의 Task가 배치될 수 있다. Task는 반드시 하나의 Cell에 속하며, SAL ID의 Stage, Area, Level 값이 해당 Cell의 좌표를 결정한다.

---

#### B. SAL ID 스키마

##### B.1 형식 정의

SAL ID는 본 발명의 핵심 식별자로서, 다음 형식을 따른다:

```
S{stage}{AREA}{level}{variant?}
```

각 구성요소의 상세 정의:

| 구성요소 | 형식 | 범위 | 필수 여부 | 설명 |
|---------|------|------|----------|------|
| 접두사 | "S" | 고정 | 필수 | SAL ID임을 나타내는 접두사 |
| stage | 1~2자리 정수 | 1~99 | 필수 | Stage 좌표 |
| AREA | 2자 대문자 | A~Z | 필수 | Area 코드 |
| level | 1~2자리 정수 | 1~99 | 필수 | Level 좌표 |
| variant | 1자 소문자 | a~z | 선택 | 동일 Cell 내 병렬 분기 식별자 |

##### B.2 SAL ID 예시

다음은 유효한 SAL ID의 예시이다:

| SAL ID | Stage | Area | Level | Variant | 의미 |
|--------|-------|------|-------|---------|------|
| S1FE1 | 1 | FE | 1 | (없음) | Stage 1, Frontend, Level 1의 단일 작업 |
| S1FE1a | 1 | FE | 1 | a | Stage 1, Frontend, Level 1의 첫 번째 병렬 분기 |
| S1FE1b | 1 | FE | 1 | b | Stage 1, Frontend, Level 1의 두 번째 병렬 분기 |
| S2BE2 | 2 | BE | 2 | (없음) | Stage 2, Backend, Level 2 |
| S3QA1 | 3 | QA | 1 | (없음) | Stage 3, QA, Level 1 |
| S10DA5c | 10 | DA | 5 | c | Stage 10, Data, Level 5의 세 번째 병렬 분기 |

##### B.3 정규식(Regular Expression)

SAL ID의 유효성을 검증하기 위한 정규식은 다음과 같다:

```regex
^S(\d{1,2})([A-Z]{2})(\d{1,2})([a-z])?$
```

정규식 구성요소 설명:
- `^` : 문자열 시작
- `S` : 리터럴 "S"
- `(\d{1,2})` : 1~2자리 숫자 (캡처 그룹 1: stage)
- `([A-Z]{2})` : 2자 대문자 (캡처 그룹 2: area)
- `(\d{1,2})` : 1~2자리 숫자 (캡처 그룹 3: level)
- `([a-z])?` : 선택적 1자 소문자 (캡처 그룹 4: variant)
- `$` : 문자열 끝

##### B.4 BNF 문법(Backus-Naur Form)

SAL ID의 형식 문법을 BNF로 표현하면 다음과 같다:

```bnf
<SALID>   ::= "S" <STAGE> <AREA> <LEVEL> <VARIANT>?
<STAGE>   ::= <digit> | <digit> <digit>
<AREA>    ::= <upper> <upper>
<LEVEL>   ::= <digit> | <digit> <digit>
<VARIANT> ::= <lower>
<digit>   ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
<upper>   ::= "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J"
            | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T"
            | "U" | "V" | "W" | "X" | "Y" | "Z"
<lower>   ::= "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j"
            | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t"
            | "u" | "v" | "w" | "x" | "y" | "z"
```

##### B.5 설계 목표

SAL ID 스키마의 설계 목표는 다음과 같다:

**인간 가독성(Human Readable):**
SAL ID는 사람이 읽고 즉시 의미를 파악할 수 있도록 설계되었다. "S2FE3a"를 보면 "Stage 2, Frontend 영역, Level 3, 분기 a"임을 직관적으로 알 수 있다.

**기계 처리 용이성(Machine Processable):**
정규식과 BNF 문법이 명확하게 정의되어 있어, 파싱, 검증, 정렬, 검색, 인덱싱이 효율적으로 수행된다.

**간결성(Conciseness):**
최소 5자(예: S1FE1)에서 최대 8자(예: S99ZZ99z)로, 매우 간결한 형식을 유지한다.

**확장성(Extensibility):**
Stage 99개, Area 676개, Level 99개, Variant 26개의 조합으로 최대 99×676×99×27 ≈ 1.78억 개의 고유 SAL ID를 생성할 수 있다.

**정렬 안정성(Sort Stability):**
문자열 정렬 시 Stage → Area → Level → Variant 순으로 자연스럽게 정렬되도록 설계되었다. 필요시 패딩(S01FE01a)을 적용하여 완전한 사전식 정렬을 보장한다.

---

#### C. Parser/Normalizer (파서/정규화기)

##### C.1 개요

Parser/Normalizer는 SAL ID 문자열을 입력받아 파싱하고, 유효성을 검증하며, 정규화된 데이터 구조를 반환하는 모듈이다.

##### C.2 기능 상세

**기능 1: 정규식/BNF 기반 파싱**

입력된 SAL ID 문자열을 정규식과 매칭하여 각 구성요소(stage, area, level, variant)를 추출한다.

```
입력: "S2FE3a"
출력: {
    raw: "S2FE3a",
    stage: 2,
    area: "FE",
    level: 3,
    variant: "a"
}
```

**기능 2: 유효성 검사**

다음 항목을 검증한다:

- 형식 유효성: 정규식 패턴 매칭
- Stage 범위: 1 ≤ stage ≤ 99
- Area 코드표: 시스템에 등록된 유효한 Area 코드인지 확인
- Level 범위: 1 ≤ level ≤ 99
- Variant 형식: 소문자 a~z 중 하나

**기능 3: 충돌 방지**

(stage, area, level, variant) 튜플은 시스템 전체에서 고유해야 한다. 새로운 SAL ID 생성 시 기존 ID와의 충돌 여부를 검사한다.

**기능 4: 정렬키 생성**

문자열 정렬 시 올바른 순서를 보장하기 위한 정렬키를 생성한다:

```
정렬키 형식: "{stage:02d}_{area}_{level:02d}_{variant or ''}"
예시: S2FE3a → "02_FE_03_a"
```

##### C.3 의사코드

```python
def parse_sal_id(sal_id: str) -> dict:
    """
    SAL ID를 파싱하여 구성요소를 추출하고 유효성을 검증한다.

    Args:
        sal_id: SAL ID 문자열 (예: "S2FE3a")

    Returns:
        파싱된 구성요소 딕셔너리

    Raises:
        ValidationError: 유효하지 않은 SAL ID인 경우
    """
    # 1. 정규식 매칭
    pattern = r"^S(\d{1,2})([A-Z]{2})(\d{1,2})([a-z])?$"
    match = re.match(pattern, sal_id)

    if not match:
        raise ValidationError(f"Invalid SAL ID format: {sal_id}")

    # 2. 구성요소 추출
    stage = int(match.group(1))
    area = match.group(2)
    level = int(match.group(3))
    variant = match.group(4)  # None if not present

    # 3. Stage 범위 검증
    if not (1 <= stage <= 99):
        raise ValidationError(f"Stage out of range (1-99): {stage}")

    # 4. Area 코드표 검증
    if area not in AREA_CODE_TABLE:
        raise ValidationError(f"Invalid area code: {area}")

    # 5. Level 범위 검증
    if not (1 <= level <= 99):
        raise ValidationError(f"Level out of range (1-99): {level}")

    # 6. 고유키 충돌 검사
    unique_key = (stage, area, level, variant)
    if unique_key in EXISTING_KEYS:
        raise ValidationError(f"Duplicate SAL ID: {sal_id}")

    # 7. 정렬키 생성
    sort_key = f"{stage:02d}_{area}_{level:02d}_{variant or ''}"

    return {
        "raw": sal_id,
        "stage": stage,
        "area": area,
        "level": level,
        "variant": variant,
        "sort_key": sort_key,
        "cell_key": (stage, area, level),
        "unique_key": unique_key
    }
```

##### C.4 오류 처리

Parser/Normalizer는 다음과 같은 오류를 감지하고 보고한다:

| 오류 코드 | 설명 | 예시 |
|----------|------|------|
| ERR_FORMAT | 형식 불일치 | "S2fe3" (area 소문자) |
| ERR_STAGE_RANGE | Stage 범위 초과 | "S100FE1" |
| ERR_AREA_INVALID | 유효하지 않은 Area | "S2XX1" (XX가 코드표에 없음) |
| ERR_LEVEL_RANGE | Level 범위 초과 | "S2FE100" |
| ERR_DUPLICATE | 중복 SAL ID | 이미 존재하는 ID |

---

#### D. Graph Builder (DAG 자동 구성기)

##### D.1 개요

Graph Builder는 파싱된 SAL ID들과 Task 정보를 입력받아, 규칙 기반으로 DAG(Directed Acyclic Graph)를 자동 구성하는 모듈이다. 이것은 본 발명의 핵심 혁신 중 하나로, 종래 기술에서 수동으로 정의해야 했던 그래프를 자동으로 생성한다.

##### D.2 핵심 규칙

**규칙 1: 동일 Cell 병렬 (Same-Cell Parallelism)**

동일한 Cell(Stage, Area, Level이 모두 같음)에 속하는 Task들 사이에는 의존 엣지를 생성하지 않는다. 이 규칙에 의해 동일 Cell 내 Task들은 병렬 실행이 가능하다.

예시:
- S2FE1a, S2FE1b, S2FE1c는 모두 Cell (2, FE, 1)에 속함
- 이들 사이에는 엣지가 없으므로 동시 실행 가능

**규칙 2: Level 후행 (Level Succession)**

동일한 Stage와 Area 내에서, Level 값이 더 큰 Task는 Level 값이 더 작은 Task의 후행이 된다. 즉, Level이 낮은 작업이 완료되어야 Level이 높은 작업을 시작할 수 있다.

예시:
- S2FE1 → S2FE2 → S2FE3 (Level 1 → 2 → 3 순으로 의존)

**규칙 3: 외부 의존 병합 (External Dependency Merge)**

Task의 predecessors 속성에 명시된 외부 SAL ID를 의존 관계에 병합한다. 이를 통해 서로 다른 Area 간의 의존성, 또는 Level 규칙으로 표현되지 않는 특수한 의존성을 선언할 수 있다.

예시:
- Task S3QA1의 predecessors가 ["S2FE3", "S2BE3"]이면, S2FE3→S3QA1, S2BE3→S3QA1 엣지가 추가됨

##### D.3 DAG 구성 알고리즘

```python
def build_dag(tasks: List[Task]) -> DAG:
    """
    Task 목록으로부터 DAG를 자동 구성한다.

    Args:
        tasks: Task 객체 목록

    Returns:
        구성된 DAG 객체
    """
    dag = DAG()

    # 1. 모든 Task를 노드로 추가
    for task in tasks:
        dag.add_node(task.sal_id, task)

    # 2. Cell 기준 그룹화
    cell_groups = defaultdict(list)
    for task in tasks:
        cell_key = (task.stage, task.area, task.level)
        cell_groups[cell_key].append(task)

    # 3. 규칙 1 적용: 동일 Cell 내부는 엣지 없음 (병렬)
    # → 별도 처리 불필요 (엣지를 추가하지 않음으로써 자동 적용)

    # 4. 규칙 2 적용: Level 후행 연결
    for task in tasks:
        # 같은 Stage, Area에서 Level이 낮은 Task들 찾기
        same_stage_area_tasks = [
            t for t in tasks
            if t.stage == task.stage
            and t.area == task.area
            and t.level < task.level
        ]

        if same_stage_area_tasks:
            # 가장 높은 Level의 Task들만 직접 연결 (중간 Level은 이미 연결됨)
            max_lower_level = max(t.level for t in same_stage_area_tasks)
            direct_predecessors = [
                t for t in same_stage_area_tasks
                if t.level == max_lower_level
            ]

            for pred in direct_predecessors:
                dag.add_edge(pred.sal_id, task.sal_id)

    # 5. 규칙 3 적용: 외부 의존 병합
    for task in tasks:
        for pred_id in (task.predecessors or []):
            if dag.has_node(pred_id):
                dag.add_edge(pred_id, task.sal_id)
            else:
                # 경고: 참조된 predecessor가 존재하지 않음
                log_warning(f"Missing predecessor {pred_id} for {task.sal_id}")

    # 6. 순환 검출
    cycles = dag.detect_cycles()
    if cycles:
        raise GraphError(f"Cycles detected: {cycles}")

    # 7. 병목 후보 마킹
    for node_id in dag.nodes():
        in_degree = dag.in_degree(node_id)
        out_degree = dag.out_degree(node_id)

        # 진입 차수가 높은 노드: 많은 작업이 완료되어야 시작 가능
        if in_degree >= BOTTLENECK_THRESHOLD:
            dag.mark_as_potential_bottleneck(node_id, "high_in_degree")

        # 진출 차수가 높은 노드: 많은 후행 작업에 영향
        if out_degree >= CRITICAL_THRESHOLD:
            dag.mark_as_critical(node_id, "high_out_degree")

    # 8. Critical Path 계산
    dag.compute_critical_path()

    return dag
```

##### D.4 차별점

본 발명의 Graph Builder가 종래 기술과 차별화되는 핵심 포인트는 **"ID를 입력으로"** 하여 **그래프를 출력으로** 생성한다는 것이다.

종래 기술에서는:
1. 사용자가 노드(Task)를 정의하고
2. 사용자가 엣지(의존 관계)를 명시적으로 정의하고
3. 시스템이 이를 파싱하여 그래프를 구성

본 발명에서는:
1. 사용자가 SAL ID를 포함한 Task를 정의하고
2. 시스템이 SAL ID를 파싱하고
3. 규칙(동일 Cell 병렬, Level 후행, 외부 의존 병합)에 따라 자동으로 그래프 구성

이로써 사용자는 수백 개의 의존 관계를 수동으로 정의하는 대신, 각 Task에 적절한 SAL ID만 부여하면 된다.

---

**(Part 2 끝 - Part 3에서 계속)**
