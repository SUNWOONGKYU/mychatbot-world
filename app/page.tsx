/**
 * @task S2FE4 - Landing 페이지 React 전환
 * @description 루트 "/" 경로 → (public)/page.tsx로 위임
 *              Next.js App Router: (public) 그룹은 URL에 영향 없음.
 *              "/" 요청 → app/(public)/page.tsx 렌더링.
 *
 * 이 파일은 (public) 그룹이 동일한 "/" 세그먼트를 커버하므로
 * 실제 사용되지 않습니다. 라우터 우선순위:
 *   app/(public)/page.tsx > app/page.tsx
 *
 * 하위 호환을 위해 유지 (삭제 시 (public)/page.tsx가 자동 서빙됨).
 */
export { default } from './(public)/page';
