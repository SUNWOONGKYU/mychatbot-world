# S3F4: 챗봇 생성 위저드 8단계 확장 - Verification

## Verification 정보
- **Task ID**: S3F4
- **Verification Agent**: code-reviewer
- **검증 기준**: 8단계 위저드 UI/로직/스타일 정상 구현 여부

## 검증 항목

### 1. Unit Test
- [ ] 각 단계(Step 5~8) UI 렌더링 확인
- [ ] 단계 간 이동(Next/Back) 동작 확인
- [ ] 단계별 유효성 검사 동작 확인

### 2. Build Verification
- [ ] HTML/JS/CSS 파일 문법 오류 없음
- [ ] 기존 5단계 기능 회귀 없음

### 3. Integration Verification
- [ ] 8단계 완료 후 챗봇 생성 데이터 정상 저장
- [ ] 아바타/스킬/테마/채널 선택값 DB 저장 확인

### 4. Blockers
- [ ] 종속 Task(S2F1~S2F4) 완료 여부 확인
