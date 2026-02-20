# S3C2: Custom Skills 다운로드 라이브러리 구축 - 검증 지침

## 검증 정보
- **Task ID**: S3C2
- **Verification Agent**: code-reviewer

## 검증 항목

### 1. 빌드 검증
- [ ] `node scripts/build-web-assets.js --custom-skills` 성공
- [ ] `custom-skills.js` 파일 생성 확인
- [ ] `P3_프로토타입_제작/Frontend/Prototype/custom-skills.js`에 복사 확인

### 2. 코드 검증
- [ ] `skills-list.json` 유효한 JSON 형식
- [ ] `generate-custom-skills-js.js` 정상 실행
- [ ] index.html에 사이드바 섹션 정상 삽입
- [ ] index.html에 모달 관련 JS 함수 존재 (openCustomSkill, copyCustomSkillContent, downloadCustomSkillContent, renderCustomSkillsList)
- [ ] script 태그로 custom-skills.js 로드 확인

### 3. 기능 테스트
- [ ] 스킬 0개일 때 빈 상태 메시지 표시
- [ ] 스킬 클릭 시 모달 열림 + 마크다운 렌더링
- [ ] 복사 버튼 → 클립보드 복사
- [ ] 다운로드 버튼 → SKILL.md 파일 다운로드
- [ ] 모달 드래그 이동 기능
- [ ] 모달 닫기 (X 버튼 + 배경 클릭)

### 4. 통합 검증
- [ ] 기존 사이드바 섹션 (학습용 Books, 실전 Tips) 정상 동작 유지
- [ ] 기존 서비스 가이드 모달 정상 동작 유지

## 통과 기준

모든 검증 항목 통과 시 Verified.

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |
