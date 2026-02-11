# 03. Area/Stage 규칙

> 11개 Area와 5개 Stage 매핑

---

## 1. 11개 Area 목록

| # | 코드 | 영문명 | 한글명 | 폴더명 |
|---|------|--------|--------|--------|
| 1 | **M** | Documentation | 문서화 | `Documentation/` |
| 2 | **U** | Design | UI/UX 디자인 | `Design/` |
| 3 | **F** | Frontend | 프론트엔드 | `Frontend/` |
| 4 | **BI** | Backend Infrastructure | 백엔드 기반 | `Backend_Infra/` |
| 5 | **BA** | Backend APIs | 백엔드 API | `Backend_APIs/` |
| 6 | **D** | Database | 데이터베이스 | `Database/` |
| 7 | **S** | Security | 보안/인증/인가 | `Security/` |
| 8 | **T** | Testing | 테스트 | `Testing/` |
| 9 | **O** | DevOps | 운영/배포 | `DevOps/` |
| 10 | **E** | External | 외부 연동 | `External/` |
| 11 | **C** | Content System | 콘텐츠 시스템 | `Content_System/` |

---

## 2. 5개 Stage 목록

| # | 코드 | 영문명 | 한글명 | 주요 내용 | 폴더명 |
|---|------|--------|--------|----------|--------|
| 1 | **S1** | Development Setup | 개발 준비 | 환경 설정, 초기 구성 | `Process/S1_개발_준비/` |
| 2 | **S2** | Core Development | 개발 1차 | 핵심 기능 구현 | `Process/S2_개발-1차/` |
| 3 | **S3** | Additional Development | 개발 2차 | 추가 기능 구현 | `Process/S3_개발-2차/` |
| 4 | **S4** | Advanced Development | 개발 3차 | 고급 기능 구현 | `Process/S4_개발-3차/` |
| 5 | **S5** | Development Stabilization | 개발 마무리 | 배포 준비, 안정화 | `Process/S5_개발_마무리/` |

---

## 3. Task ID 구조

**[Stage][Area][번호]**

```
S2BA1
│ │ └─ 순서: 1번째 Task
│ └─── Area: BA (Backend APIs)
└───── Stage: S2 (개발 1차)
```

**예시:**
| Task ID | Stage | Area | 순서 | 의미 |
|---------|-------|------|------|------|
| S1S1 | S1 | S | 1 | 개발준비 - 보안 - 1번 |
| S2F1 | S2 | F | 1 | 개발1차 - 프론트엔드 - 1번 |
| S2BA1 | S2 | BA | 1 | 개발1차 - 백엔드API - 1번 |
| S3E1 | S3 | E | 1 | 개발2차 - 외부연동 - 1번 |

### 3.1 SAL ID 의존성 규칙 ⭐

> **SAL ID는 의존성·병렬성·인접성을 인코딩합니다**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 의존성 방향: 선행 Task ID < 후행 Task ID                  │
│    → S1D1 → S2F1 (O)  Stage 1이 Stage 2보다 먼저           │
│    → S2F1 → S1D1 (X)  역방향 의존성 금지                    │
│                                                             │
│ 2. 병렬 실행: 동일 Stage·Area 내 Task는 병렬 가능           │
│    → S2F1, S2F2, S2F3는 동시 실행 가능                      │
│                                                             │
│ 3. 실행 순서: Stage 번호가 작을수록 먼저                     │
│    → S1 → S2 → S3 → S4 → S5                               │
│                                                             │
│ 4. 인접성: 동일 Cell(Stage×Area) 내 Task는 관련 작업        │
│    → S2F1, S2F2는 같은 Cell이므로 유사 기능                 │
└─────────────────────────────────────────────────────────────┘
```

**의존성 예시:**
| 후행 Task | dependencies | 유효성 | 이유 |
|-----------|--------------|:------:|------|
| S2F1 | S1D1 | ✅ | Stage 1 < Stage 2 |
| S3BA1 | S2F1, S2BA1 | ✅ | Stage 2 < Stage 3 |
| S2F1 | S3BA1 | ❌ | Stage 3 > Stage 2 (역방향) |
| S2F2 | S2F1 | ⚠️ | 같은 Stage (허용되나 병렬성 감소) |

**⚠️ 핵심:** SAL ID만 부여하면 의존성 정의 없이 작업 순서와 동시 실행 가능 여부가 자동으로 결정됩니다.

---

## 4. 폴더 경로 예시

| Task ID | 폴더 경로 |
|---------|----------|
| S1S1 | `Process/S1_개발_준비/Security/` |
| S1M1 | `Process/S1_개발_준비/Documentation/` |
| S2F1 | `Process/S2_개발-1차/Frontend/` |
| S2BA1 | `Process/S2_개발-1차/Backend_APIs/` |
| S3E1 | `Process/S3_개발-2차/External/` |

---

## 5. Area별 Production 저장 여부

| Area | Production 저장 | 이유 |
|------|:---------------:|------|
| F | ✅ | 배포 필요 |
| BA | ✅ | 배포 필요 |
| S | ✅ | 배포 필요 |
| BI | ✅ | 배포 필요 |
| E | ✅ | 배포 필요 |
| M | ❌ | 문서 |
| U | ❌ | 디자인 |
| D | ❌ | DB 직접 실행 |
| T | ❌ | 테스트 |
| O | ❌ | 설정 |
| C | ❌ | DB 저장 |

---

## 6. Area별 담당 Agent

| Area | Task Agent | Verification Agent |
|------|------------|-------------------|
| M | documentation-specialist | code-reviewer |
| U | frontend-developer | qa-specialist |
| F | frontend-developer | code-reviewer |
| BI | backend-developer | code-reviewer |
| BA | backend-developer | code-reviewer |
| D | database-specialist | database-specialist |
| S | security-specialist | security-auditor |
| T | test-engineer | qa-specialist |
| O | devops-troubleshooter | code-reviewer |
| E | backend-developer | code-reviewer |
| C | content-specialist | qa-specialist |

---

## 체크리스트

- [ ] Task ID에서 Stage, Area 정확히 파악했는가?
- [ ] 해당 Stage 폴더에 저장했는가?
- [ ] 해당 Area 폴더에 저장했는가?
- [ ] Production 저장 대상인지 확인했는가?
