# S5F1 검증 지침: 접근성 개선 WCAG 2.2

## 검증 에이전트
`qa-specialist`

## 검증 항목

### 1. 자동화 도구 검사
- [ ] axe-core 또는 Lighthouse 접근성 검사 오류 0건
- [ ] WCAG 2.2 AA 위반 없음

### 2. 이미지 alt 텍스트
- [ ] 의미 있는 이미지에 alt 텍스트 존재
- [ ] 장식용 이미지는 alt=""

### 3. ARIA 레이블
- [ ] 아이콘 버튼에 aria-label 존재
- [ ] 모달/다이얼로그에 role="dialog" 및 aria-labelledby 존재

### 4. 키보드 내비게이션
- [ ] Tab 키로 모든 인터랙티브 요소 접근 가능
- [ ] 포커스 인디케이터 시각적으로 명확

### 5. 색상 대비
- [ ] 주요 텍스트 색상 대비 4.5:1 이상

### 6. 빌드
- [ ] `npm run build` 성공

## 합격 기준
위 모든 항목 Pass 시 Verified 처리
