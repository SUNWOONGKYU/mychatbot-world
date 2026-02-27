# 【서류명】 명세서 (Part 5/6)

---

### 2. SAL 3D Grid 및 데이터 모델 상세

#### 2.1 좌표계 구현

도 1을 참조하면, SAL 3D Grid (10)는 다음과 같이 구현된다:

**Stage 축 (11) 구현:**
Stage는 데이터베이스에서 INTEGER 타입으로 저장된다. 유효 범위는 1~99이며, 애플리케이션 레벨에서 범위 검사를 수행한다. Stage 0은 "미배치" 상태를 나타내는 특수 값으로 예약될 수 있다.

```sql
-- Stage 컬럼 정의
stage INTEGER NOT NULL CHECK (stage >= 1 AND stage <= 99)
```

**Area 축 (12) 구현:**
Area는 2자 대문자 문자열로 저장된다. 별도의 area_codes 테이블에서 유효한 Area 코드를 관리하며, 외래키 제약으로 무결성을 보장한다.

```sql
-- Area 코드 테이블
CREATE TABLE area_codes (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7),  -- HEX 색상 코드
    icon VARCHAR(50),
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터 예시
INSERT INTO area_codes (code, name, description, sort_order) VALUES
('FE', 'Frontend', '사용자 인터페이스', 1),
('BE', 'Backend', '서버 로직', 2),
('DE', 'Design', 'UI/UX 디자인', 3),
('QA', 'Quality Assurance', '품질 보증', 4),
('IF', 'Infrastructure', '인프라/DevOps', 5),
('DA', 'Data/Analytics', '데이터 처리', 6),
('SE', 'Security', '보안', 7),
('DO', 'Documentation', '문서화', 8);
```

**Level 축 (13) 구현:**
Level은 INTEGER 타입으로 저장되며, 1~99 범위를 갖는다. Level은 동일 Stage, Area 내에서의 의존 계층을 나타내므로, (stage, area) 조합 내에서 연속적인 값을 갖는 것이 권장되나 강제되지는 않는다.

#### 2.2 Cell 모델

Cell (20)은 물리적으로 별도 저장되지 않고, Task의 (stage, area, level) 조합으로 논리적으로 정의된다. 그러나 시각화 및 분석 목적으로 Cell 정보를 집계하는 뷰를 생성할 수 있다:

```sql
-- Cell 집계 뷰
CREATE VIEW cell_summary AS
SELECT
    t.stage,
    ac.code as area,
    ac.name as area_name,
    t.level,
    COUNT(*) as task_count,
    COUNT(*) FILTER (WHERE t.status = 'Completed') as completed_count,
    COUNT(*) FILTER (WHERE t.status = 'In Progress') as in_progress_count,
    COUNT(*) FILTER (WHERE t.status = 'Blocked') as blocked_count
FROM tasks t
JOIN area_codes ac ON t.area = ac.code
GROUP BY t.stage, ac.code, ac.name, t.level
ORDER BY t.stage, ac.sort_order, t.level;
```

#### 2.3 Task 모델 상세

Task (30)는 시스템의 핵심 엔티티로서, 다음과 같은 완전한 스키마를 갖는다:

```sql
CREATE TABLE tasks (
    -- 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_id VARCHAR(20) NOT NULL UNIQUE,

    -- ID 체인
    chain_text TEXT,
    chain_list JSONB DEFAULT '[]',
    chain_length INTEGER DEFAULT 1,
    original_id VARCHAR(20),

    -- SAL 좌표 (current_id에서 파싱된 값, 인덱싱용)
    stage INTEGER NOT NULL,
    area VARCHAR(2) NOT NULL REFERENCES area_codes(code),
    level INTEGER NOT NULL,
    variant VARCHAR(1),

    -- 기본 정보
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Blocked', 'On Hold', 'Cancelled')),

    -- 담당/일정
    owner VARCHAR(100),
    assignees JSONB DEFAULT '[]',
    start_date DATE,
    end_date DATE,
    actual_start DATE,
    actual_end DATE,

    -- 수치
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

    -- 의존성
    predecessors JSONB DEFAULT '[]',
    successors JSONB DEFAULT '[]',  -- 캐시 (Graph Builder가 갱신)

    -- 자원
    resource_requirements JSONB DEFAULT '{}',
    allocated_resources JSONB DEFAULT '{}',

    -- 메타데이터
    tags JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- 제약 조건
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT valid_actual_dates CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end >= actual_start)
);

-- 복합 인덱스
CREATE INDEX idx_tasks_coordinates ON tasks(stage, area, level);
CREATE INDEX idx_tasks_cell ON tasks(stage, area, level, variant);
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority DESC);
CREATE INDEX idx_tasks_owner_status ON tasks(owner, status);
CREATE INDEX idx_tasks_dates ON tasks(start_date, end_date);

-- 전문 검색 인덱스
CREATE INDEX idx_tasks_name_search ON tasks USING GIN (to_tsvector('english', name));
CREATE INDEX idx_tasks_tags ON tasks USING GIN (tags);
```

### 3. SAL ID 상세 구현

#### 3.1 파서 구현

도 3을 참조하면, Parser/Normalizer 모듈 (50)의 상세 구현은 다음과 같다:

```python
import re
from dataclasses import dataclass
from typing import Optional, Tuple
from enum import Enum

class ParseError(Exception):
    """SAL ID 파싱 오류"""
    pass

class ValidationError(Exception):
    """유효성 검사 오류"""
    pass

@dataclass
class ParsedSALID:
    """파싱된 SAL ID 구조체"""
    raw: str
    stage: int
    area: str
    level: int
    variant: Optional[str]
    sort_key: str
    cell_key: Tuple[int, str, int]
    unique_key: Tuple[int, str, int, Optional[str]]

class SALIDParser:
    """SAL ID 파서/검증기"""

    # 정규식 패턴
    PATTERN = re.compile(r'^S(\d{1,2})([A-Z]{2})(\d{1,2})([a-z])?$')

    # 범위 상수
    MIN_STAGE = 1
    MAX_STAGE = 99
    MIN_LEVEL = 1
    MAX_LEVEL = 99

    def __init__(self, area_code_table: set, existing_keys: set = None):
        """
        Args:
            area_code_table: 유효한 Area 코드 집합
            existing_keys: 기존에 사용된 고유키 집합 (중복 검사용)
        """
        self.area_code_table = area_code_table
        self.existing_keys = existing_keys or set()

    def parse(self, sal_id: str, check_duplicate: bool = True) -> ParsedSALID:
        """
        SAL ID를 파싱하고 검증한다.

        Args:
            sal_id: SAL ID 문자열
            check_duplicate: 중복 검사 여부

        Returns:
            ParsedSALID 객체

        Raises:
            ParseError: 형식 오류
            ValidationError: 유효성 검사 오류
        """
        # 1. 정규식 매칭
        match = self.PATTERN.match(sal_id)
        if not match:
            raise ParseError(
                f"Invalid SAL ID format: '{sal_id}'. "
                f"Expected format: S{{stage}}{{AREA}}{{level}}{{variant?}}"
            )

        # 2. 구성요소 추출
        stage = int(match.group(1))
        area = match.group(2)
        level = int(match.group(3))
        variant = match.group(4)  # None if not captured

        # 3. Stage 범위 검증
        if not (self.MIN_STAGE <= stage <= self.MAX_STAGE):
            raise ValidationError(
                f"Stage out of range: {stage}. "
                f"Valid range: {self.MIN_STAGE}-{self.MAX_STAGE}"
            )

        # 4. Area 코드표 검증
        if area not in self.area_code_table:
            raise ValidationError(
                f"Invalid area code: '{area}'. "
                f"Valid codes: {sorted(self.area_code_table)}"
            )

        # 5. Level 범위 검증
        if not (self.MIN_LEVEL <= level <= self.MAX_LEVEL):
            raise ValidationError(
                f"Level out of range: {level}. "
                f"Valid range: {self.MIN_LEVEL}-{self.MAX_LEVEL}"
            )

        # 6. 고유키 생성
        unique_key = (stage, area, level, variant)
        cell_key = (stage, area, level)

        # 7. 중복 검사
        if check_duplicate and unique_key in self.existing_keys:
            raise ValidationError(f"Duplicate SAL ID: '{sal_id}'")

        # 8. 정렬키 생성 (패딩 적용)
        sort_key = f"{stage:02d}_{area}_{level:02d}_{variant or ''}"

        return ParsedSALID(
            raw=sal_id,
            stage=stage,
            area=area,
            level=level,
            variant=variant,
            sort_key=sort_key,
            cell_key=cell_key,
            unique_key=unique_key
        )

    def generate_sal_id(self, stage: int, area: str, level: int,
                        variant: Optional[str] = None) -> str:
        """
        구성요소로부터 SAL ID를 생성한다.

        Args:
            stage: Stage 값
            area: Area 코드
            level: Level 값
            variant: Variant (선택)

        Returns:
            생성된 SAL ID 문자열
        """
        sal_id = f"S{stage}{area}{level}"
        if variant:
            sal_id += variant
        return sal_id

    def normalize(self, sal_id: str) -> str:
        """
        SAL ID를 정규화된 형식으로 변환한다.
        (예: "S01FE01a" -> "S1FE1a")

        Args:
            sal_id: 입력 SAL ID

        Returns:
            정규화된 SAL ID
        """
        parsed = self.parse(sal_id, check_duplicate=False)
        return self.generate_sal_id(
            parsed.stage, parsed.area, parsed.level, parsed.variant
        )
```

### 4. Graph Builder 상세 구현

#### 4.1 DAG 자료 구조

도 4를 참조하면, Graph Builder 모듈 (60)은 다음과 같은 DAG 자료 구조를 사용한다:

```python
from collections import defaultdict
from typing import Dict, List, Set, Optional, Any
from dataclasses import dataclass, field

@dataclass
class DAGNode:
    """DAG 노드"""
    sal_id: str
    task: Any  # Task 객체
    stage: int
    area: str
    level: int
    variant: Optional[str]

    # 그래프 메타데이터 (Graph Builder가 설정)
    in_degree: int = 0
    out_degree: int = 0
    is_critical: bool = False
    is_bottleneck: bool = False
    earliest_start: float = 0.0
    latest_start: float = float('inf')
    slack: float = float('inf')

class DAG:
    """방향성 비순환 그래프"""

    def __init__(self):
        self.nodes: Dict[str, DAGNode] = {}
        self.edges: Dict[str, Set[str]] = defaultdict(set)  # predecessor -> successors
        self.reverse_edges: Dict[str, Set[str]] = defaultdict(set)  # successor -> predecessors
        self._critical_path: List[str] = []

    def add_node(self, sal_id: str, task: Any, parsed: 'ParsedSALID') -> DAGNode:
        """노드 추가"""
        node = DAGNode(
            sal_id=sal_id,
            task=task,
            stage=parsed.stage,
            area=parsed.area,
            level=parsed.level,
            variant=parsed.variant
        )
        self.nodes[sal_id] = node
        return node

    def add_edge(self, from_id: str, to_id: str) -> bool:
        """엣지 추가"""
        if from_id not in self.nodes or to_id not in self.nodes:
            return False

        if to_id not in self.edges[from_id]:
            self.edges[from_id].add(to_id)
            self.reverse_edges[to_id].add(from_id)
            self.nodes[from_id].out_degree += 1
            self.nodes[to_id].in_degree += 1
            return True
        return False

    def remove_edge(self, from_id: str, to_id: str) -> bool:
        """엣지 제거"""
        if to_id in self.edges[from_id]:
            self.edges[from_id].remove(to_id)
            self.reverse_edges[to_id].remove(from_id)
            self.nodes[from_id].out_degree -= 1
            self.nodes[to_id].in_degree -= 1
            return True
        return False

    def predecessors(self, sal_id: str) -> Set[str]:
        """선행 노드 목록"""
        return self.reverse_edges.get(sal_id, set())

    def successors(self, sal_id: str) -> Set[str]:
        """후행 노드 목록"""
        return self.edges.get(sal_id, set())

    def has_node(self, sal_id: str) -> bool:
        return sal_id in self.nodes

    def get_node(self, sal_id: str) -> Optional[DAGNode]:
        return self.nodes.get(sal_id)

    def detect_cycles(self) -> List[List[str]]:
        """순환 탐지 (DFS 기반)"""
        cycles = []
        visited = set()
        rec_stack = set()
        path = []

        def dfs(node_id: str):
            visited.add(node_id)
            rec_stack.add(node_id)
            path.append(node_id)

            for successor in self.successors(node_id):
                if successor not in visited:
                    dfs(successor)
                elif successor in rec_stack:
                    # 사이클 발견
                    cycle_start = path.index(successor)
                    cycles.append(path[cycle_start:] + [successor])

            path.pop()
            rec_stack.remove(node_id)

        for node_id in self.nodes:
            if node_id not in visited:
                dfs(node_id)

        return cycles

    def topological_sort(self) -> List[str]:
        """위상정렬 (Kahn's Algorithm)"""
        in_degree = {node_id: node.in_degree for node_id, node in self.nodes.items()}
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []

        while queue:
            # 우선순위 고려 (선택적)
            queue.sort(key=lambda x: (self.nodes[x].stage, self.nodes[x].level))
            node_id = queue.pop(0)
            result.append(node_id)

            for successor in self.successors(node_id):
                in_degree[successor] -= 1
                if in_degree[successor] == 0:
                    queue.append(successor)

        if len(result) != len(self.nodes):
            raise GraphError("Graph contains cycles - topological sort impossible")

        return result

    def compute_critical_path(self) -> List[str]:
        """Critical Path 계산"""
        topo_order = self.topological_sort()

        # Forward pass: earliest start/finish
        for node_id in topo_order:
            node = self.nodes[node_id]
            duration = getattr(node.task, 'estimated_hours', 1) or 1

            for successor_id in self.successors(node_id):
                successor = self.nodes[successor_id]
                successor.earliest_start = max(
                    successor.earliest_start,
                    node.earliest_start + duration
                )

        # Find project completion time
        max_finish = max(
            node.earliest_start + (getattr(node.task, 'estimated_hours', 1) or 1)
            for node in self.nodes.values()
        )

        # Backward pass: latest start/finish
        for node_id in reversed(topo_order):
            node = self.nodes[node_id]
            duration = getattr(node.task, 'estimated_hours', 1) or 1

            if not self.successors(node_id):
                node.latest_start = max_finish - duration
            else:
                node.latest_start = min(
                    self.nodes[succ].latest_start
                    for succ in self.successors(node_id)
                ) - duration

            node.slack = node.latest_start - node.earliest_start
            node.is_critical = (node.slack == 0)

        # Extract critical path
        self._critical_path = [
            node_id for node_id, node in self.nodes.items()
            if node.is_critical
        ]

        return self._critical_path
```

#### 4.2 Graph Builder 구현

```python
class GraphBuilder:
    """DAG 자동 구성기"""

    BOTTLENECK_IN_DEGREE_THRESHOLD = 5
    CRITICAL_OUT_DEGREE_THRESHOLD = 5

    def __init__(self, parser: SALIDParser):
        self.parser = parser

    def build(self, tasks: List[Any]) -> DAG:
        """
        Task 목록으로부터 DAG를 자동 구성한다.

        Args:
            tasks: Task 객체 목록 (각 Task는 sal_id, predecessors 속성을 가짐)

        Returns:
            구성된 DAG 객체
        """
        dag = DAG()

        # 1. 모든 Task를 노드로 추가
        for task in tasks:
            parsed = self.parser.parse(task.current_id, check_duplicate=False)
            dag.add_node(task.current_id, task, parsed)

        # 2. Cell 기준 그룹화
        cell_groups = defaultdict(list)
        for task in tasks:
            node = dag.get_node(task.current_id)
            cell_key = (node.stage, node.area, node.level)
            cell_groups[cell_key].append(task.current_id)

        # 3. 규칙 1: 동일 Cell 내부는 엣지 없음 (자동 적용 - 엣지 미추가)

        # 4. 규칙 2: Level 후행 연결
        for task in tasks:
            node = dag.get_node(task.current_id)

            # 같은 Stage, Area에서 낮은 Level의 노드들 찾기
            lower_level_nodes = [
                (sal_id, dag.nodes[sal_id])
                for sal_id in dag.nodes
                if dag.nodes[sal_id].stage == node.stage
                and dag.nodes[sal_id].area == node.area
                and dag.nodes[sal_id].level < node.level
            ]

            if lower_level_nodes:
                # 가장 높은 Level만 직접 연결 (중간 Level은 이미 연결됨)
                max_lower_level = max(n.level for _, n in lower_level_nodes)
                direct_predecessors = [
                    sal_id for sal_id, n in lower_level_nodes
                    if n.level == max_lower_level
                ]

                for pred_id in direct_predecessors:
                    dag.add_edge(pred_id, task.current_id)

        # 5. 규칙 3: 외부 의존 병합
        for task in tasks:
            for pred_id in (task.predecessors or []):
                if dag.has_node(pred_id):
                    dag.add_edge(pred_id, task.current_id)
                # 존재하지 않는 predecessor는 무시 (또는 경고 로그)

        # 6. 순환 검출
        cycles = dag.detect_cycles()
        if cycles:
            raise GraphError(f"Cycles detected in DAG: {cycles}")

        # 7. 병목 후보 마킹
        for sal_id, node in dag.nodes.items():
            if node.in_degree >= self.BOTTLENECK_IN_DEGREE_THRESHOLD:
                node.is_bottleneck = True
            if node.out_degree >= self.CRITICAL_OUT_DEGREE_THRESHOLD:
                node.is_critical = True

        # 8. Critical Path 계산
        dag.compute_critical_path()

        return dag
```

### 5. 실시예

#### 실시예 1: 소프트웨어 개발/DevOps

도 9(a)를 참조하면, 소프트웨어 개발 프로젝트에 본 발명을 적용한 실시예는 다음과 같다.

**프로젝트 설정:**
- Stage 정의: S1(계획), S2(개발), S3(테스트), S4(배포)
- Area 정의: FE(Frontend), BE(Backend), API(API 개발), INF(Infrastructure), QA(Quality Assurance)
- 전체 Task 수: 45개

**SAL ID 할당 예시:**

| SAL ID | Task 명 | 담당자 |
|--------|---------|--------|
| S1FE1 | UI 요구사항 분석 | Kim |
| S1BE1 | API 요구사항 분석 | Lee |
| S2FE1 | 로그인 화면 개발 | Kim |
| S2FE2a | 대시보드 UI - 차트 영역 | Park |
| S2FE2b | 대시보드 UI - 테이블 영역 | Choi |
| S2BE1 | 인증 API 개발 | Lee |
| S2BE2 | 데이터 조회 API 개발 | Lee |
| S3QA1 | 단위 테스트 | QA팀 |
| S3QA2 | 통합 테스트 | QA팀 |
| S4INF1 | 스테이징 배포 | DevOps |
| S4INF2 | 프로덕션 배포 | DevOps |

**자동 생성된 의존 관계:**
- S1FE1 → S2FE1 (Level 1 → Level 1, Stage 증가)
- S2FE1 → S2FE2a, S2FE2b (Level 1 → Level 2, 동일 Stage/Area)
- S2FE2a, S2FE2b는 병렬 실행 가능 (동일 Cell)
- S3QA1 predecessors: [S2FE2a, S2FE2b, S2BE2] → 크로스 Area 의존성

**효과:**
- 병렬성 극대화: S2FE2a, S2FE2b 동시 개발로 2주 → 1주 단축
- 자동 DAG 생성으로 의존 관계 정의 시간 80% 절감
- ID 체인으로 스프린트 간 Task 이동 완전 추적

**ID 체인 활용 사례:**
```
Task "대시보드 UI - 차트 영역"이 스프린트 이동:
Sprint 1: S2FE2a (개발 시작)
Sprint 2: S2FE2a_S2FE3a (복잡도 증가로 Level 상향)
Sprint 3: S2FE2a_S2FE3a_S3FE1a (테스트 단계 직접 이동)

체인: S2FE2a_S2FE3a_S3FE1a
현재 위치: S3FE1a (Stage 3, FE, Level 1)
전체 이력 보존 ✓
```

#### 실시예 2: 장기 제조 (선박/항공기)

도 9(b)를 참조하면, 선박 건조 프로젝트에 본 발명을 적용한 실시예는 다음과 같다.

**프로젝트 설정:**
- Stage 정의: S1(설계), S2(조달), S3(조립), S4(검수), S5(인도)
- Area 정의: HU(Hull/선체), EN(Engine/동력), AV(Avionics/항전), IN(Interior/내부), QA(Quality Assurance)
- 전체 Task 수: 2,340개
- 프로젝트 기간: 36개월

**SAL ID 할당 예시:**

| SAL ID | Task 명 | 예상 기간 |
|--------|---------|----------|
| S1HU1 | 선체 기본 설계 | 3개월 |
| S1HU2 | 선체 상세 설계 | 2개월 |
| S2EN1 | 엔진 발주 | 1개월 |
| S2EN2 | 엔진 납품 대기 | 6개월 |
| S3HU1 | 블록 A 조립 | 2개월 |
| S3HU1a | 블록 A-1 용접 | 3주 |
| S3HU1b | 블록 A-2 용접 | 3주 |
| S4QA1 | 비파괴 검사 | 1개월 |
| S4QA2 | 해상 시운전 | 2주 |

**효과:**
- 리드타임 단축: 병렬 조립 최적화로 전체 공기 10% 단축
- 재작업 감소: 명확한 의존 관계로 선후 작업 오류 방지
- 규제 대응: ID 체인으로 모든 공정 이력 완전 보존

**ID 체인 활용 사례:**
```
품질 이슈 발생 시 역추적:
문제 발견: S4QA1 (비파괴 검사 불합격)
체인 조회: S3HU1a_S3HU2a_S4QA1
원인 추적: S3HU1a (블록 A-1 용접) 단계에서 품질 이슈 발생
담당자/일시/작업 내용 즉시 확인 가능
```

#### 실시예 3: 회계감사/내부통제

도 9(c)를 참조하면, 연간 회계감사 프로젝트에 본 발명을 적용한 실시예는 다음과 같다.

**프로젝트 설정:**
- Stage 정의: S1(계획), S2(현장감사), S3(분석), S4(보고)
- Area 정의: FI(Financial/재무), PU(Purchase/구매), SL(Sales/판매), HR(Human Resource/인사), IT(Information Technology)
- 전체 Task 수: 180개

**SAL ID 할당 예시:**

| SAL ID | Task 명 | 위험 수준 |
|--------|---------|----------|
| S1FI1 | 재무제표 예비 분석 | 중 |
| S2FI1a | 매출채권 실사 - A분기 | 고 |
| S2FI1b | 매출채권 실사 - B분기 | 고 |
| S2FI2 | 재고자산 실사 | 고 |
| S2PU1 | 구매 승인 프로세스 검토 | 중 |
| S3FI1 | 분석적 검토 절차 | 고 |
| S3FI2 | 이슈 분석 및 질의 | 고 |
| S4FI1 | 감사보고서 초안 작성 | - |

**효과:**
- 누락 최소화: 모든 감사 절차가 Grid에 배치되어 누락 방지
- 증빙 자동 추적: ID 체인으로 샘플링→확장테스트→심층분석 경로 기록
- 보고서 자동 생성: 진행 현황, 발견사항 요약 자동화

#### 실시예 4: 데이터/ML 파이프라인

도 9(d)를 참조하면, ML 모델 개발 파이프라인에 본 발명을 적용한 실시예는 다음과 같다.

**프로젝트 설정:**
- Stage 정의: S1(수집), S2(정제), S3(피처 엔지니어링), S4(학습), S5(배포)
- Area 정의: DA(Data), FE(Feature), MO(Model), INF(Infrastructure), QA(Quality)
- 전체 Task 수: 85개

**SAL ID 할당 예시:**

| SAL ID | Task 명 | 의존성 |
|--------|---------|--------|
| S1DA1 | 원천 데이터 수집 | - |
| S1DA2 | 데이터 스키마 검증 | S1DA1 |
| S2DA1 | 결측치 처리 | S1DA2 |
| S2DA2 | 이상치 제거 | S1DA2 |
| S3FE1 | 피처 추출 | S2DA1, S2DA2 |
| S3FE2 | 피처 선택 | S3FE1 |
| S4MO1 | 모델 학습 | S3FE2 |
| S4MO2 | 하이퍼파라미터 튜닝 | S4MO1 |
| S5INF1 | 모델 서빙 배포 | S4MO2 |

**효과:**
- DAG 자동 복원: SAL ID만으로 전체 파이프라인 구조 재현
- 캐시 최적화: 변경된 Stage부터만 재실행
- 형상 관리 강화: ID 체인으로 모델 버전과 학습 데이터 추적

---

**(Part 5 끝 - Part 6에서 계속)**
