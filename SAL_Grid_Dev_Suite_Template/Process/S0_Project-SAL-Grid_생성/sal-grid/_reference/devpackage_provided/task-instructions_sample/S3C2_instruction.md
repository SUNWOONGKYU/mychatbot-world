# S3C2: Custom Skills 다운로드 라이브러리 구축

## Task 정보
- **Task ID**: S3C2
- **Task Name**: Custom Skills 다운로드 라이브러리 구축
- **Stage**: S3 (개발 2차)
- **Area**: C (Content System)
- **Dependencies**: S2F1

## Task 목표

SSAL Works가 만든 Custom Skills를 우측 사이드바에서 이용자가 개별 다운로드/복사할 수 있는 라이브러리 구축.
이용자는 다운로드한 SKILL.md를 자신의 프로젝트 `.claude/skills/{name}/SKILL.md`에 배치하여 사용.

## 구현 항목

### 1. 콘텐츠 폴더 구조
```
부수적_고유기능/콘텐츠/Custom_Skills/
├── skills-list.json                  ← 스킬 메타데이터
├── generate-custom-skills-js.js      ← 번들 생성 스크립트
├── custom-skills.js                  ← 자동 생성 번들 (window.CUSTOM_SKILLS)
└── skills/                           ← 개별 스킬 폴더
    └── {skill-name}/
        └── SKILL.md
```

### 2. 번들 생성 스크립트 + 빌드 시스템 연동
- `generate-custom-skills-js.js`: skills/ 하위 폴더 순회 → `custom-skills.js` 생성
- `window.CUSTOM_SKILLS = { "skill-id": { content: "...", meta: {...} } }`
- `scripts/build-web-assets.js`에 Custom Skills 빌드 단계 추가

### 3. 우측 사이드바 섹션 (index.html)
- "학습용 Books"와 "실전 Tips" 사이에 Custom Skills 섹션 삽입
- 스킬 목록은 `window.CUSTOM_SKILLS`에서 JS로 동적 렌더링
- 0개일 때: "아직 등록된 스킬이 없습니다" 표시

### 4. 모달 뷰어 + 복사/다운로드 (index.html)
- `openCustomSkill(skillId)`: 모달 열기 (보라색 그라데이션 #6B5CCC)
- `copyCustomSkillContent()`: 클립보드 복사
- `downloadCustomSkillContent()`: SKILL.md로 다운로드
- 안내 문구: "다운로드한 SKILL.md를 .claude/skills/{name}/SKILL.md에 저장하세요"
- 드래그 이동 기능 (기존 패턴 재사용)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `index.html` | 사이드바 HTML + JS 함수 + script 태그 |
| `scripts/build-web-assets.js` | Custom Skills 빌드 단계 추가 |
| `부수적_고유기능/콘텐츠/Custom_Skills/skills-list.json` | 스킬 메타데이터 |
| `부수적_고유기능/콘텐츠/Custom_Skills/generate-custom-skills-js.js` | 번들 생성기 |
| `부수적_고유기능/콘텐츠/Custom_Skills/custom-skills.js` | 자동 생성 번들 |

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
