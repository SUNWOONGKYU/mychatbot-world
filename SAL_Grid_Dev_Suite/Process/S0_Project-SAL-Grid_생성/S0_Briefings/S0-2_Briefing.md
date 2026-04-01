# sal-grid

## 개요

프로젝트의 **실제 SAL Grid**를 설계하고 생성합니다. 매뉴얼에서 배운 개념을 적용하여 본인 프로젝트에 맞는 Task 계획을 수립합니다.

## SAL Grid 설계 요소

### Stage 정의 (동적 — 프로젝트 규모에 따라 N개)

- S0: Project SAL Grid 생성
- S1: 개발 준비
- S2: 개발 1차
- S3: 개발 2차
- S4: 개발 마무리
- (프로젝트에 따라 Stage 추가/삭제 가능)

### Area 정의 (11개)

| 코드 | 영문명 | 한글명 |
|------|--------|--------|
| FE | Frontend | 프론트엔드 |
| BA | Backend APIs | 백엔드 API |
| DB | Database | 데이터베이스 |
| SC | Security | 보안/인증 |
| BI | Backend Infra | 백엔드 인프라 |
| EX | External | 외부 연동 |
| TS | Testing | 테스트 |
| DV | DevOps | 배포/운영 |
| DS | Design | 디자인 시스템 |
| DC | Documentation | 문서화 |
| CS | Content System | 콘텐츠 시스템 |

### Task ID 규칙

**형식**: S[Stage][Area][Level]

```
S2BA1
│ │ └─ Level: 1 (첫 번째 Task)
│ └─── Area: BA (Backend APIs)
└───── Stage: S2 (개발 1차)
```

## 생성할 파일

- `TASK_PLAN.md`: 전체 Task 계획서
- `5x11_MATRIX.md`: 5×11 Stage-Area 매트릭스
- `TASK_DEPENDENCY_DIAGRAM.md`: Task 의존성 다이어그램
- `task-instructions/*.md`: 각 Task별 상세 지침
- `verification-instructions/*.md`: 각 Task별 검증 지침
- `stage-gates/*.md`: Stage Gate 검증 리포트

## 작업 순서

1. **Task Plan 작성**: 전체 작업 범위와 Task 목록 정의
2. **5×11 매트릭스 작성**: Stage-Area 교차점에 Task 배치
3. **Task Instruction 작성**: 각 Task별 상세 수행 지침
4. **Verification Instruction 작성**: 각 Task별 검증 기준
5. **의존성 다이어그램 작성**: Task 간 선후행 관계 정의

## 저장 위치

```
S0_Project-SAL-Grid_생성/
└── 2.sal-grid/
    ├── TASK_PLAN.md
    ├── task-instructions/
    │   ├── S1FE1_instruction.md
    │   └── ...
    ├── verification-instructions/
    │   ├── S1FE1_verification.md
    │   └── ...
    ├── task-results/
    └── stage-gates/
        ├── S1GATE_verification_report.md
        └── ...
```

