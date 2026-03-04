# Verification Instruction - S1F1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S1F1

## Task Name
Vercel 프로젝트 설정

## Verification Checklist

### 1. Vercel 프로젝트 생성 검증
- [ ] Vercel Dashboard에서 프로젝트 존재 확인
- [ ] 프로젝트명: `ssalworks`

### 2. GitHub 연결 검증
- [ ] GitHub 저장소 `SUNWOONGKYU/SSALWorks` 연결 완료
- [ ] Production Branch: `master` 설정
- [ ] Auto-deploy on push 활성화

### 3. 프레임워크 설정 검증
- [ ] Framework Preset: `Other`
- [ ] Root Directory 설정 완료
- [ ] Output Directory 설정 완료

### 4. ⭐ 실제 배포 테스트 (필수!)
- [ ] 초기 배포 성공
- [ ] 배포 URL 접속 가능 (예: `ssalworks.vercel.app`)
- [ ] 기본 페이지 정상 표시

## Test Commands
```bash
# Vercel CLI로 프로젝트 확인
vercel list

# 배포 URL 접속 테스트
curl -I https://ssalworks.vercel.app
```

## Expected Results
- Vercel 프로젝트 생성 및 GitHub 연결 완료
- 자동 배포 설정 완료
- 배포 URL 접속 가능

## Verification Agent
devops-troubleshooter

## Pass Criteria
- Vercel 프로젝트 생성 완료
- GitHub 저장소 연결 완료
- **⭐ 배포 URL 접속 성공 (필수)**

## ⚠️ Human-AI Task 검증 주의사항

이 Task는 **Human-AI** 유형입니다.
- **PO가 Vercel Dashboard에서 프로젝트를 생성해야 합니다**
- **PO가 GitHub 저장소를 연결해야 합니다**
- 실제 배포 테스트 성공 시에만 완료 처리

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Vercel 프로젝트 설정이 완료되었는가? (외부 서비스)
- [ ] 배포 URL이 정상 동작하는가?
