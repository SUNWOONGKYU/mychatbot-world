# S5DS2: 컬러 시스템 + 디자인 토큰 정의 — 검증 지침

## 검증 정보
- **Task ID**: S5DS2
- **Verification Agent**: qa-specialist
- **검증 유형**: 설계 문서 완전성 검증

## 검증 항목

### 1. 컬러 팔레트 완전성
- [ ] Primary 퍼플 팔레트가 50~950 스케일로 정의되었는가?
- [ ] Accent 앰버 팔레트가 50~900 스케일로 정의되었는가?
- [ ] Neutral 슬레이트 팔레트가 0~950 스케일로 정의되었는가?
- [ ] Semantic 컬러(success/warning/error/info)가 라이트/다크 각각 정의되었는가?

### 2. 다크 모드 설계
- [ ] 다크 모드 퍼스트 원칙이 반영되었는가?
- [ ] :root(라이트) + .dark 구조가 정의되었는가?
- [ ] Primary 다크 모드 기준색(primary-400)이 명시되었는가?

### 3. Tailwind 연동
- [ ] CSS 변수 → Tailwind 매핑 방식이 정의되었는가?
- [ ] RGB 포맷(`rgb(var(--token) / <alpha>)`)이 사용되었는가?
- [ ] tailwind.config.ts extend 코드가 포함되었는가?

### 4. 글로벌 설정
- [ ] 폰트(Pretendard, JetBrains Mono)가 정의되었는가?
- [ ] 그라데이션 변수(--gradient-hero 등)가 정의되었는가?

## 완료 기준

모든 항목이 산출물(`2026_04_07__P2_컬러시스템_디자인토큰.md`)에 포함되어 있으면 Verified.
