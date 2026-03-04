# Verification Instruction - S2M2

---

## 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |

---

## Task ID
S2M2

## Task Name
프로젝트 등록 프로세스 문서화

## Verification Agent
`code-reviewer`

---

## 검증 항목

### 1. 문서 존재 확인

- [ ] `S2_개발-1차/Documentation/Project_Registration_Process.md` 존재
- [ ] `S2_개발-1차/Documentation/Guides/Project_Registration.md` 존재
- [ ] `S2_개발-1차/Documentation/Guides/Pledge_Agreement.md` 존재

### 2. 프로세스 문서 내용 검증

- [ ] 프로젝트 등록 개요 섹션 존재
- [ ] 등록 전 조건 명시
- [ ] 등록 프로세스 흐름 (Step 1~3) 상세 설명
- [ ] 서약서 동의 절차 문서화
- [ ] 권한 부여 로직 설명
- [ ] 관련 파일 참조 명시

### 3. 안내문 복사본 검증

- [ ] 원본과 복사본 내용 일치
- [ ] 원본 위치: `Briefings_OrderSheets/Briefings/Situational/Project_Registration.md`
- [ ] 복사본 위치: `S2_개발-1차/Documentation/Guides/Project_Registration.md`

### 4. 서약서 복사본 검증

- [ ] 원본과 복사본 내용 일치
- [ ] 원본 위치: `Briefings_OrderSheets/Briefings/Situational/Pledge_Agreement.md`
- [ ] 복사본 위치: `S2_개발-1차/Documentation/Guides/Pledge_Agreement.md`

### 5. Markdown 형식 검증

- [ ] 제목 계층 구조 적절
- [ ] 표 형식 올바름
- [ ] 링크/참조 작동

---

## 통과 기준

1. **문서 완전성**: 모든 필수 섹션 포함
2. **정확성**: 프로세스 설명이 실제 구현과 일치
3. **일관성**: 원본과 복사본 내용 동일
4. **형식**: Markdown 문법 오류 없음

---

## 검증 결과 기록

### Test Result
```json
{
    "unit_test": "N/A - Documentation Task",
    "integration_test": "N/A - Documentation Task",
    "edge_cases": "N/A - Documentation Task",
    "manual_test": "✅/❌ 문서 내용 수동 확인"
}
```

### Build Verification
```json
{
    "compile": "N/A - Markdown 문서",
    "lint": "✅/❌ Markdown 문법 검증",
    "deploy": "N/A",
    "runtime": "N/A"
}
```

### Integration Verification
```json
{
    "dependency_propagation": "N/A",
    "cross_task_connection": "✅/❌ 관련 안내문/서약서 연결 확인",
    "data_flow": "N/A"
}
```

### Blockers
```json
{
    "dependency": "None",
    "environment": "None",
    "external_api": "None",
    "status": "No Blockers ✅"
}
```

---

## Remarks
- Documentation Task이므로 코드 테스트는 해당 없음
- 문서 내용의 정확성과 완전성이 핵심 검증 포인트
