# S7FE2 Verification

## Verification Agent: `code-reviewer-core`

## 검증 체크리스트

- [ ] 10종 컴포넌트 모두 `components/ui/` 하위에 생성되었는가?
- [ ] CVA variant/size 체계가 모든 컴포넌트에 일관되게 적용되었는가?
- [ ] 모든 컴포넌트에 focus-visible ring 토큰이 적용되었는가?
- [ ] ARIA 속성 자동 전파(aria-invalid, aria-describedby 등)가 구현되었는가?
- [ ] `app/_design-system/` 페이지에서 모든 variant를 시각 확인 가능한가?
- [ ] 키보드만으로 모든 기능 조작 가능한가?
- [ ] axe-core 위반 0건인가?
- [ ] 다크/라이트 양쪽 스크린샷 캡처되었는가?
