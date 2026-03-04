# /troubleshoot-core

> **SAL Grid Dev Suite** — 문제 진단, 로그 분석, 근본 원인 분석(RCA) 및 긴급 대응 스킬
>
> **사용 시점**: 에러 발생 시, 서비스 장애 시, 성능 저하 시, 원인 불명 버그 추적이 필요할 때
> **적용 대상**: Vanilla 및 React/Next.js 모두 적용 가능

---

## 프로젝트 컨텍스트

**프로젝트**: {PROJECT_NAME}
**기술 스택**:
- Frontend/Backend: Vanilla HTML/JS 또는 Next.js/React, TypeScript
- Database: Supabase (PostgreSQL)
- Deployment: Vercel 또는 기타 플랫폼

---

## AI-only 개발 원칙 (필수 준수)

### 허용
- CLI 명령어로 로그 분석
- 코드 검사 도구 사용
- 자동화된 디버깅 스크립트

### 금지
- 웹 브라우저에서 수동 디버깅
- GUI 디버거 수동 사용
- 사용자에게 수동 문제 해결 요청

**위반 발견 시 즉시 작업 중단 및 대안 탐색**

---

## 역할 및 책임

당신은 이 프로젝트의 트러블슈터입니다:

1. **문제 진단**: 에러 메시지 분석 및 원인 파악
2. **로그 분석**: 로그 파일에서 패턴 찾기
3. **근본 원인 분석**: RCA (Root Cause Analysis) 수행
4. **해결책 제시**: 단기 및 장기 해결 방안 제시
5. **문서화**: 문제 해결 과정 기록

---

## 문제 해결 프로세스

### 1. 문제 인식 및 재현

```bash
#!/bin/bash
# scripts/reproduce-issue.sh

echo "문제 재현 시도..."

# 1. 환경 정보 수집
echo "환경 정보:"
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "OS: $(uname -a)"

# 2. 재현 단계 실행
echo "재현 단계 실행 중..."
# 여기에 재현 단계 입력

# 3. 에러 로그 캡처
echo "에러 로그:"
# 에러 로그 저장
```

---

### 2. 로그 분석

#### React/Next.js 로그 확인
```bash
# 개발 서버 로그
npm run dev 2>&1 | tee dev.log

# 빌드 로그
npm run build 2>&1 | tee build.log

# 프로덕션 로그 (Vercel)
vercel logs --follow
```

#### Vanilla 프로젝트 로그 확인
```bash
# 로컬 서버 로그
npx serve . 2>&1 | tee serve.log

# 서버리스 함수 로그 (Vercel)
vercel logs --follow
```

#### 에러 패턴 검색
```bash
# 특정 에러 검색
grep -r "Error:" logs/ --color

# 시간대별 에러 빈도
grep "Error" logs/app.log | cut -d' ' -f1-2 | uniq -c

# 최다 발생 에러 Top 10
grep "Error" logs/app.log | sort | uniq -c | sort -rn | head -10
```

---

## 일반적인 문제 및 해결책

### Next.js / React 관련

#### 1. "Module not found" 에러

**증상**:
```
Error: Cannot find module '@/components/SomeComponent'
```

**원인**:
- 파일 경로 오류
- tsconfig.json paths 설정 오류
- 파일이 실제로 존재하지 않음

**해결책**:
```bash
# 1. 파일 존재 확인
ls -la src/components/SomeComponent.tsx

# 2. tsconfig.json 확인
cat tsconfig.json | jq '.compilerOptions.paths'

# 올바른 paths 설정:
# {
#   "compilerOptions": {
#     "paths": {
#       "@/*": ["./src/*"]
#     }
#   }
# }

# 3. 캐시 삭제 후 재시작
rm -rf .next
npm run dev
```

---

#### 2. "Hydration failed" 에러

**증상**:
```
Error: Hydration failed because the initial UI does not match
what was rendered on the server.
```

**원인**:
- 서버와 클라이언트 렌더링 불일치
- 조건부 렌더링 문제
- 브라우저 확장 프로그램 간섭

**해결책**:
```typescript
// 나쁜 예: 서버와 클라이언트 불일치
export default function Component() {
  return <div>{new Date().toISOString()}</div>; // 매번 다른 값!
}

// 좋은 예: useEffect로 클라이언트 전용 처리
'use client';
import { useEffect, useState } from 'react';

export default function Component() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(new Date().toISOString());
  }, []);

  return <div>{time || 'Loading...'}</div>;
}

// 또는 suppressHydrationWarning 사용
<div suppressHydrationWarning>
  {new Date().toISOString()}
</div>
```

---

#### 3. API Route 404 에러 (Next.js)

**증상**:
```
GET /api/items 404 (Not Found)
```

**원인**:
- 파일 위치 오류 (app/ vs pages/)
- export 함수명 오류
- 라우팅 설정 문제

**해결책**:
```bash
# 1. 파일 구조 확인
# React (App Router): src/app/api/items/route.ts
# React (Pages Router): pages/api/items.ts
# Vanilla: api/Backend_APIs/items.js
ls -la src/app/api/items/

# 2. export 함수명 확인 (App Router)
# 올바른 형식: export async function GET(request) { ... }
grep "export async function" src/app/api/items/route.ts

# 3. 서버 재시작
# Next.js 개발 서버 재시작 필요
```

#### 3-b. API 404 에러 (Vanilla / 서버리스)

```bash
# Vanilla 프로젝트 API 파일 구조 확인
# 올바른 위치: api/Backend_APIs/items.js
ls -la api/Backend_APIs/

# export default 함수 확인
grep "export default" api/Backend_APIs/items.js
# 올바른 형식: export default async function handler(req, res) { ... }
```

---

### Supabase 관련

#### 1. "Invalid API key" 에러

**증상**:
```
Error: Invalid API key
```

**원인**:
- 환경변수 미설정
- 잘못된 API 키
- 환경변수 로딩 실패

**해결책**:
```bash
# 1. 환경변수 확인
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. .env.local 파일 확인
cat .env.local

# 3. 환경변수 다시 로드
# .env.local 수정 후 서버 재시작

# 4. Vercel 환경변수 확인 (배포 환경)
vercel env ls

# 5. 올바른 값으로 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

---

#### 2. "Row Level Security policy violation" 에러

**증상**:
```
Error: new row violates row-level security policy for table "your_table"
```

**원인**:
- RLS 정책이 요청을 차단
- 인증되지 않은 사용자
- 권한 부족

**해결책**:
```bash
# 1. RLS 정책 확인
npx supabase db dump --table your_table --schema public
```

```sql
-- 현재 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- 정책 수정 예시
ALTER POLICY "Users can insert own records"
ON your_table
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

#### 3. "Connection timeout" 에러

**증상**:
```
Error: Connection to database timed out
```

**원인**:
- 네트워크 문제
- Supabase 서비스 장애
- 쿼리 실행 시간 초과

**해결책**:
```typescript
// 1. 타임아웃 설정 증가
const supabase = createClient(url, key, {
  db: {
    timeout: 10000, // 10초
  },
});

// 2. 재시도 로직 추가
async function queryWithRetry(queryFn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await queryFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// 3. 쿼리 최적화
// 불필요한 JOIN 제거, 인덱스 추가 등
```

---

### TypeScript 관련

#### 1. "Type 'X' is not assignable to type 'Y'" 에러

**증상**:
```typescript
Type 'string | null' is not assignable to type 'string'.
```

**해결책**:
```typescript
// 나쁜 예
const name: string = item.name; // name이 null일 수 있음

// 좋은 예 1: 타입 가드
if (item.name) {
  const name: string = item.name;
}

// 좋은 예 2: null 병합 연산자
const name: string = item.name ?? 'Unknown';

// 좋은 예 3: 옵셔널 타입
const name: string | null = item.name;
```

---

#### 2. "Property 'X' does not exist on type 'Y'" 에러

**증상**:
```typescript
Property 'custom_field' does not exist on type 'Item'.
```

**해결책**:
```typescript
// 1. 타입 정의 확인 및 수정
interface Item {
  id: string;
  name: string;
  custom_field?: string; // 누락된 속성 추가
}

// 2. 또는 동적 속성 허용 (권장하지 않음)
interface Item {
  id: string;
  name: string;
  [key: string]: any; // 동적 속성 허용
}
```

---

### 성능 관련

> **성능 저하 문제 대응 순서**: 먼저 `/performance-check-core`로 병목 지점을 측정 → 원인 파악 후 이 스킬(troubleshoot-core)로 수정 처리

#### 1. 느린 페이지 로딩

**증상**: 페이지 로드 시간 > 3초

**진단**:
```bash
# 1. Lighthouse 실행
npx lighthouse http://localhost:3000 --view

# 2. 번들 크기 분석 (Next.js)
ANALYZE=true npm run build

# Vanilla: 개발자 도구 Network 탭 직접 확인
```

**해결책** (React/Next.js):
```typescript
// 1. 이미지 최적화
import Image from 'next/image';

<Image
  src="/image.jpg"
  width={400}
  height={300}
  alt="Image"
  loading="lazy"
/>

// 2. 코드 스플리팅
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});

// 3. 데이터 fetching 최적화 (React Query)
const { data } = useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  staleTime: 5 * 60 * 1000, // 5분 캐싱
});
```

**해결책** (Vanilla):
```javascript
// 1. 이미지 lazy loading
<img src="image.jpg" loading="lazy" alt="Image">

// 2. 스크립트 지연 로딩
<script src="heavy.js" defer></script>

// 3. 불필요한 API 호출 줄이기
// 응답 캐싱 적용
const cache = new Map();
async function fetchWithCache(url) {
  if (cache.has(url)) return cache.get(url);
  const data = await fetch(url).then(r => r.json());
  cache.set(url, data);
  return data;
}
```

---

#### 2. 메모리 누수

**증상**: 브라우저 메모리 사용량 지속 증가

**해결책** (React):
```typescript
// 나쁜 예: 정리되지 않은 이벤트 리스너
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // cleanup 함수 없음!
}, []);

// 좋은 예: cleanup 함수 포함
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

// 나쁜 예: 정리되지 않은 타이머
useEffect(() => {
  setInterval(() => fetchData(), 1000);
}, []);

// 좋은 예: cleanup으로 타이머 정리
useEffect(() => {
  const timer = setInterval(() => fetchData(), 1000);
  return () => clearInterval(timer);
}, []);
```

**해결책** (Vanilla):
```javascript
// 나쁜 예: 이벤트 리스너 누적
function init() {
  document.getElementById('btn').addEventListener('click', handler);
  // 반복 호출 시 리스너 누적!
}

// 좋은 예: 기존 리스너 제거 후 추가
function init() {
  const btn = document.getElementById('btn');
  btn.removeEventListener('click', handler); // 기존 제거
  btn.addEventListener('click', handler);    // 새로 추가
}
```

---

## 디버깅 도구

### 1. Next.js 디버그 모드

```bash
# 디버그 로그 활성화
DEBUG=* npm run dev

# 특정 모듈만
DEBUG=next:* npm run dev
```

### 2. Supabase CLI 디버깅

```bash
# 로컬 Supabase 로그
npx supabase logs

# 특정 서비스 로그
npx supabase logs db
npx supabase logs api
```

### 3. curl로 API 직접 테스트

```bash
# GET 요청 테스트
curl -X GET "http://localhost:3000/api/Backend_APIs/items" \
  -H "Authorization: Bearer YOUR_TOKEN"

# POST 요청 테스트
curl -X POST "http://localhost:3000/api/Backend_APIs/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "테스트", "value": 1}'
```

---

## 근본 원인 분석 (RCA) 템플릿

```markdown
# 근본 원인 분석 보고서

**문제 ID**: #123
**보고 날짜**: [YYYY-MM-DD]
**분석자**: Claude Code

---

## 문제 요약

### 증상
- API 호출 시 500 에러 발생
- 발생 빈도: 10회 중 8회
- 영향 범위: 모든 사용자

### 타임라인
- 14:30 - 첫 에러 보고
- 14:35 - 문제 재현 확인
- 14:40 - 로그 분석 시작
- 15:00 - 근본 원인 파악
- 15:30 - 수정 완료
- 16:00 - 배포 및 검증

---

## 근본 원인

### 직접 원인
- POST /api/Backend_APIs/items 엔드포인트에서 입력 검증 로직 누락

### 근본 원인
- 코드 리뷰 시 입력 검증 체크리스트 미준수
- 단위 테스트 커버리지 부족

### 기여 요인
- 급하게 배포한 핫픽스
- 테스트 케이스 작성 누락

---

## 영향 분석

### 비즈니스 영향
- 80% API 호출 실패
- 사용자 기능 이용 불가

### 기술적 영향
- API 에러율: 5% → 25%
- 서버 부하 증가 (재시도 요청)

---

## 해결 과정

### 1. 즉각 조치 (Immediate Fix)
```typescript
// 입력 검증 추가
if (!isValidInput(input)) {
  return NextResponse.json(
    { error: 'Invalid input' },
    { status: 400 }
  );
}
```

### 2. 단기 조치 (Short-term)
- 해당 엔드포인트에 단위 테스트 추가
- 입력 검증 라이브러리 도입 (Zod)

### 3. 장기 조치 (Long-term)
- 모든 API 엔드포인트에 입력 검증 강화
- 테스트 커버리지 80% 이상 유지
- 코드 리뷰 체크리스트 업데이트

---

## 재발 방지

### 프로세스 개선
1. 배포 전 필수 테스트 커버리지 확인
2. 입력 검증 자동화 (Zod 스키마)
3. 코드 리뷰 시 보안 체크리스트 필수 확인

### 모니터링 강화
1. API 에러율 알람 설정 (> 5%)
2. 입력 검증 실패 로깅
3. 주간 에러 리포트 자동 생성

---

## 교훈

### 잘한 점
- 빠른 문제 인식 및 대응 (30분 내 수정)
- 명확한 에러 로깅으로 원인 파악 용이

### 개선할 점
- 배포 전 테스트 강화 필요
- 입력 검증 표준화 필요
- 코드 리뷰 프로세스 개선

---

## 액션 아이템

- [ ] 입력 검증 라이브러리 (Zod) 도입 (기한: 1주)
- [ ] 테스트 커버리지 80% 달성 (기한: 2주)
- [ ] 코드 리뷰 체크리스트 업데이트 (기한: 즉시)
- [ ] API 모니터링 알람 설정 (기한: 1주)
```

---

## 일반적인 디버깅 체크리스트

### 프론트엔드
- [ ] 브라우저 콘솔 에러 확인
- [ ] Network 탭에서 API 요청/응답 확인
- [ ] 캐시 삭제 후 재시도
- [ ] 다른 브라우저에서 테스트

### 백엔드
- [ ] 서버 로그 확인
- [ ] 데이터베이스 연결 확인
- [ ] 환경변수 설정 확인
- [ ] API 엔드포인트 직접 호출 (curl)
- [ ] 데이터베이스 쿼리 직접 실행

### 인프라
- [ ] Vercel 배포 로그 확인
- [ ] Supabase 상태 확인
- [ ] DNS 설정 확인
- [ ] SSL 인증서 확인
- [ ] 네트워크 연결 확인

---

## 긴급 상황 대응 플레이북

### 1. 서비스 완전 다운

**증상**: 사이트 접속 불가

**조치**:
```bash
# 1. 헬스 체크
curl -I https://{PROJECT_DOMAIN}

# 2. Vercel 상태 확인
vercel ls

# 3. 최근 배포 롤백
vercel promote [PREVIOUS_DEPLOYMENT_URL]

# 4. 로그 확인
vercel logs
```

### 2. 데이터베이스 연결 실패

**증상**: "Database connection failed"

**조치**:
```bash
# 1. Supabase 상태 확인
curl https://status.supabase.com/api/v2/status.json

# 2. 연결 테스트
npx supabase db ping

# 3. 환경변수 확인
vercel env ls | grep SUPABASE

# 4. 대기 또는 백업 DB 전환 (있는 경우)
```

### 3. 높은 에러율

**증상**: 에러율 > 10%

**조치**:
```bash
# 1. 에러 로그 확인
vercel logs | grep "Error"

# 2. 최근 배포 확인
vercel ls --json | jq '.[0]'

# 3. 필요시 롤백
vercel promote [PREVIOUS_DEPLOYMENT_URL]

# 4. 근본 원인 분석 시작
```

---

**이 스킬을 활성화하면, 이 프로젝트의 모든 문제를 체계적으로 진단하고 해결하여 서비스 안정성을 보장합니다.**
