# Verification Instruction - S4DV1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S4DV1

## Task Name
프로덕션 배포 최적화 (성능, SEO, PWA)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/DevOps/next.config.js` 존재 (최적화 버전)
- [ ] `Process/S4_개발_마무리/DevOps/app/manifest.ts` 존재
- [ ] `Process/S4_개발_마무리/DevOps/public/sw.js` 존재
- [ ] `Process/S4_개발_마무리/DevOps/components/seo/meta.tsx` 존재

### 2. `next.config.js` 설정 검증
- [ ] `compress: true` 설정 존재
- [ ] `swcMinify: true` 설정 존재
- [ ] 보안 헤더 설정 (`X-Frame-Options`, `X-Content-Type-Options`) 존재
- [ ] `images.domains` 설정 존재

### 3. SEO 컴포넌트 검증 (`meta.tsx`)
- [ ] `<SEOMeta>` 컴포넌트 구현
- [ ] Open Graph 태그 생성 (`og:title`, `og:description`, `og:image`)
- [ ] Twitter Card 태그 생성
- [ ] `title`, `description`, `ogImage`, `canonicalUrl` props 지원

### 4. PWA 매니페스트 검증 (`manifest.ts`)
- [ ] `name`, `short_name`, `description` 존재
- [ ] `start_url: '/'` 설정
- [ ] `display: 'standalone'` 설정
- [ ] 아이콘 정의 (192x192, 512x512) 존재

### 5. Service Worker 검증 (`sw.js`)
- [ ] 오프라인 폴백 캐싱 구현
- [ ] 정적 자원 캐시 전략 구현
- [ ] 개발 환경 비활성화 로직 존재 (또는 Next.js 설정에서 처리)

### 6. 빌드 검증
- [ ] `npm run build` 에러 없이 완료
- [ ] 보안 헤더가 HTTP 응답에 포함됨

### 7. 통합 검증
- [ ] S4TS1, S4TS2 의존성: 테스트 통과 후 최적화 작업
- [ ] 다른 파일과 충돌 없음

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/DevOps/"

# 보안 헤더 설정 확인
grep -n "X-Frame-Options\|X-Content-Type\|Referrer-Policy" \
  "Process/S4_개발_마무리/DevOps/next.config.js"

# PWA 매니페스트 필수 필드 확인
grep -n "standalone\|start_url\|short_name" \
  "Process/S4_개발_마무리/DevOps/app/manifest.ts"

# OG 태그 생성 확인
grep -n "og:title\|og:image\|og:description" \
  "Process/S4_개발_마무리/DevOps/components/seo/meta.tsx"

# 빌드 테스트 (루트에서 실행)
npm run build
```

## Expected Results
- 4개 파일이 모두 존재한다
- `next.config.js`에 보안 헤더가 설정된다
- `<SEOMeta>` 컴포넌트가 OG/Twitter 태그를 생성한다
- PWA 매니페스트가 `standalone` 모드로 설정된다
- `npm run build` 가 에러 없이 완료된다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 성공 확인
- [ ] 보안 헤더 설정 확인
- [ ] PWA 매니페스트 필수 필드 확인
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/DevOps/`에 저장되었는가?
- [ ] DevOps Area는 Production 자동 복사 대상이 아님을 확인
