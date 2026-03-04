# Task Instruction - S5D1

---

## 📌 필수 참조 규칙 파일 (2025-12-22)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S5D1

## Task Name
Supabase 백업 설정 확인

## Task Goal
Supabase 자동 백업 설정 확인 및 복구 방법 문서화

## Prerequisites (Dependencies)
- S5O1 (배포상황 최종 검증) 완료

## Specific Instructions

### 1. Supabase 자동 백업 확인

Supabase는 플랜에 따라 자동 백업을 제공합니다:

| 플랜 | 백업 주기 | 보존 기간 |
|------|----------|----------|
| Free | 없음 | - |
| Pro | 매일 | 7일 |
| Team | 매일 | 14일 |
| Enterprise | 매일 | 커스텀 |

**확인 방법:**
1. Supabase Dashboard 접속
2. Settings > Database > Backups
3. 백업 상태 및 보존 기간 확인
4. 스크린샷 저장

### 2. Point-in-Time Recovery (PITR) 확인

Pro 플랜 이상에서 PITR 지원:
- 특정 시점으로 데이터베이스 복원 가능
- Dashboard에서 복원 시점 선택

### 3. 복구 절차 문서화

**Supabase Dashboard에서 복원:**
1. Dashboard > Database > Backups
2. 원하는 시점 선택
3. "Restore" 클릭
4. 복원 완료 대기

## Expected Output Files
- `S5_개발_마무리/Database/S5D1_backup_verification.md` (확인 결과)

## Completion Criteria
- [ ] Supabase 백업 설정 확인 완료
- [ ] 백업 상태 스크린샷 저장
- [ ] 복구 절차 문서화

## Tech Stack
- Supabase Dashboard

## Task Agent
`database-specialist`

## Verification Agent
`qa-specialist`

## Tools
- 웹 브라우저 (Supabase Dashboard)

## Execution Type
AI-Only

## Remarks
- Supabase 자동 백업으로 충분 (별도 스크립트 불필요)
- Pro 플랜 이상 사용 중이면 자동 백업 활성화됨
- 복구 테스트는 필요 시 수동으로 진행

---

## ⚠️ 작업 결과물 저장 규칙

- S5D1 → `S5_개발_마무리/Database/`
