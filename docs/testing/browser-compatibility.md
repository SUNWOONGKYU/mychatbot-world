# Browser Compatibility Testing

크로스 브라우저 테스트 계획입니다.

---

## 🌐 지원 브라우저

### Desktop
- ✅ Chrome 120+ (우선)
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### Mobile
- ✅ Chrome Mobile (Android)
- ✅ Safari Mobile (iOS)

---

## 🧪 테스트 항목

### 기본 기능
- [ ] 페이지 로딩
- [ ] 로그인/회원가입
- [ ] 채팅 입력 및 전송
- [ ] 3D 아바타 렌더링 (WebGL)
- [ ] WebSocket 연결

### 스타일링
- [ ] 레이아웃 정렬
- [ ] 반응형 디자인 (모바일/태블릿/데스크톱)
- [ ] 폰트 렌더링
- [ ] 색상 표시

### 고급 기능
- [ ] 음성 입력 (MediaRecorder API)
- [ ] 파일 업로드
- [ ] 로컬 스토리지

---

## 🛠️ 테스트 도구

- **BrowserStack**: 실제 디바이스 테스트
- **Can I Use**: 기능 호환성 확인
- **수동 테스트**: 주요 브라우저 직접 확인

---

## ⚠️ 알려진 제한사항

- Safari < 17: WebGL 성능 제한
- IE 11: 지원 안 함
- Firefox < 100: 일부 CSS 기능 제한

---

**목표**: 주요 4개 브라우저에서 모든 핵심 기능 작동
