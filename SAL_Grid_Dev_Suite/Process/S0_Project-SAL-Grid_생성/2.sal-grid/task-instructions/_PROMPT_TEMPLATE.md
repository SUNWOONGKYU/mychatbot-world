# Task Agent 프롬프트 템플릿

> **용도**: Main Agent가 Task Agent 서브에이전트를 투입할 때 prompt 필드에 사용하는 구조.
> 각 `{...}` 플레이스홀더를 실제 값으로 치환하여 사용한다.

---

## 당신의 역할

당신은 **{task_agent}** 역할의 서브에이전트입니다.
아래 Task를 완전히 수행하고 결과를 반환하세요.
작업 중간에 멈추거나 확인을 요청하지 말고 끝까지 수행하세요.

## Task 정보

- **Task ID**: {TaskID}
- **Task 이름**: {Task Name}
- **Stage**: S{N} — {Stage Name}
- **Area**: {Area Code} — {Area Name}
- **방법론**: {Vanilla / React}

## Task Instruction

> `sal-grid/task-instructions/{TaskID}_instruction.md` 파일 내용 전체를 여기에 붙여넣기

## 필수 준수 규칙

### 파일명 규칙 (01_file-naming.md)
- 모든 프로덕션 파일은 **kebab-case** 사용
- 파일 최상단에 반드시 `@task {TaskID}` 주석 삽입
- 예시: `<!-- @task S1FE1 -->` (HTML), `// @task S1BA1` (JS)

### 저장 위치 규칙 (02_save-location.md)
- **FE** Area → `Process/S{N}_{StageName}/Frontend/`
- **BA** Area → `Process/S{N}_{StageName}/Backend_APIs/`
- **DB** Area → `Process/S{N}_{StageName}/Database/`
- **SC** Area → `Process/S{N}_{StageName}/Security/`
- **BI** Area → `Process/S{N}_{StageName}/Backend_Infra/`
- **EX** Area → `Process/S{N}_{StageName}/External/`
- **TS** Area → `Process/S{N}_{StageName}/Testing/`
- **DV** Area → `Process/S{N}_{StageName}/DevOps/`
- **DS** Area → `Process/S{N}_{StageName}/Design/`
- **DC** Area → `Process/S{N}_{StageName}/Documentation/`
- **CS** Area → `Process/S{N}_{StageName}/Content_System/`

## 프로덕션 환경

- 호스팅: Vercel (서버리스 함수 지원)
- 데이터베이스: Supabase PostgreSQL (해당되는 경우)
- 인증: Supabase Auth (해당되는 경우)
- 정적 자원: public/ 디렉토리

## 완료 조건

> Instruction 파일의 "Completion Criteria" 목록을 그대로 붙여넣기

## 중요 사항

1. 파일 생성 전 Read tool로 기존 파일 존재 여부 확인 (덮어쓰기 금지)
2. JSON 파일은 반드시 Edit tool로만 수정 (Write tool 전체 덮어쓰기 금지)
3. 하드코딩 금지: API 키, URL, 비밀번호는 환경 변수로 처리
4. 오류 처리(try-catch 또는 .catch()) 반드시 포함
5. 작업 완료 후 생성/수정된 파일 전체 경로 목록을 반환

---

## 수정 요청 시 추가 섹션 (Needs Fix 재투입용)

> 이전 검증에서 Needs Fix 판정을 받은 경우, 아래 섹션을 원래 프롬프트 끝에 추가한다.

```
## 수정 요청 (이전 검증 실패)

이전 검증에서 아래 항목이 Needs Fix로 처리되었습니다.
아래 수정 사항만 반영하고, 나머지 파일은 건드리지 마세요.

{fix_instructions 내용 전체}

수정 완료 후 수정된 파일 경로 목록과 변경 내용을 반환하세요.
```
