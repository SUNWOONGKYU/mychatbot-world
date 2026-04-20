# S7FE8 Verification

## Verification Agent: `code-reviewer-core`

## 검증 체크리스트

- [ ] Duration 토큰 5단(75/150/250/350/500ms)이 정의되었는가?
- [ ] Easing 토큰 3종(standard/accelerate/decelerate)이 정의되었는가?
- [ ] 프리셋(fadeInUp/fadeInScale/slideInRight/listStagger)이 `lib/motion.ts`에 구현되었는가?
- [ ] 모든 페이지가 공통 프리셋을 사용하는가? (Framer 직접 사용 금지)
- [ ] Chrome DevTools Performance에서 60fps 유지되는가?
- [ ] `prefers-reduced-motion: reduce` 시 애니메이션이 무효화되는가?
