# Task Instruction - S5BA1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S5BA1

## Task Name
API 버그 수정 및 최적화

## Task Goal
Serverless API 성능 개선 및 버그 수정

## Prerequisites (Dependencies)
- S5O1 (배포상황 최종 검증) 완료

## Specific Instructions

### 1. 성능 모니터링 및 분석

```javascript
// API 응답 시간 측정 미들웨어
function withPerformanceLogging(handler) {
    return async (req, res) => {
        const startTime = Date.now();
        const originalJson = res.json.bind(res);

        res.json = (data) => {
            const duration = Date.now() - startTime;

            // 느린 API 로깅 (1초 이상)
            if (duration > 1000) {
                console.warn(`Slow API: ${req.url} took ${duration}ms`);
            }

            return originalJson({
                ...data,
                _meta: { responseTime: duration }
            });
        };

        return handler(req, res);
    };
}
```

### 2. 일반적인 API 버그 유형 및 해결

#### 2.1 N+1 쿼리 문제
```javascript
// 수정 전: N+1 쿼리
const users = await supabase.from('users').select('id');
for (const user of users.data) {
    const projects = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);
}

// 수정 후: 조인 쿼리
const usersWithProjects = await supabase
    .from('users')
    .select(`
        id,
        projects (*)
    `);
```

#### 2.2 에러 핸들링 개선
```javascript
// 수정 전: 에러 정보 노출
catch (error) {
    res.status(500).json({ error: error.message });
}

// 수정 후: 안전한 에러 처리
catch (error) {
    console.error('API Error:', error);

    // 사용자에게는 일반 메시지만
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        // 개발 환경에서만 상세 정보
        ...(process.env.NODE_ENV === 'development' && {
            details: error.message
        })
    });
}
```

#### 2.3 응답 캐싱
```javascript
// Vercel Edge Cache 활용
function withCache(handler, maxAge = 60) {
    return async (req, res) => {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `s-maxage=${maxAge}, stale-while-revalidate`);
        }
        return handler(req, res);
    };
}

// 적용 예시
module.exports = withCache(async (req, res) => {
    const { data } = await supabase.from('ai_pricing').select('*');
    res.json({ prices: data });
}, 300); // 5분 캐시
```

### 3. API 최적화 기법

#### 3.1 병렬 처리
```javascript
// 수정 전: 순차 처리
const users = await getUsers();
const stats = await getStats();
const payments = await getPayments();

// 수정 후: 병렬 처리
const [users, stats, payments] = await Promise.all([
    getUsers(),
    getStats(),
    getPayments()
]);
```

#### 3.2 데이터베이스 쿼리 최적화
```javascript
// 수정 전: 전체 데이터 조회
const { data } = await supabase.from('users').select('*');

// 수정 후: 필요한 컬럼만 조회 + 페이지네이션
const { data } = await supabase
    .from('users')
    .select('id, email, name, subscription_status')
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });
```

#### 3.3 Cold Start 최적화
```javascript
// 전역 스코프에서 초기화 (Cold Start 시 한 번만 실행)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 함수 내부에서 매번 생성하지 않음
module.exports = async (req, res) => {
    // supabase 재사용
    const { data } = await supabase.from('users').select('*');
    res.json(data);
};
```

### 4. 버그 수정 체크리스트

```markdown
## API 버그 점검 항목

### 인증/보안
- [ ] 인증 토큰 검증 누락 없음
- [ ] Rate limiting 적용
- [ ] 입력 값 유효성 검사
- [ ] SQL Injection 방지

### 에러 처리
- [ ] 모든 API에 try-catch 적용
- [ ] 에러 로깅 정상 작동
- [ ] 적절한 HTTP 상태 코드 반환
- [ ] 민감 정보 노출 없음

### 성능
- [ ] N+1 쿼리 없음
- [ ] 불필요한 데이터 조회 없음
- [ ] 캐싱 적용 (읽기 전용 API)
- [ ] 응답 시간 2초 미만
```

### 5. 성능 개선 적용 예시

```javascript
// api/subscription/status.js 최적화
const { createClient } = require('@supabase/supabase-js');
const { withCache } = require('../lib/cache');
const { withPerformanceLogging } = require('../lib/performance');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = withPerformanceLogging(
    withCache(async (req, res) => {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // 필요한 컬럼만 조회
        const { data, error } = await supabase
            .from('subscriptions')
            .select('status, plan, end_date')
            .eq('user_id', req.user.id)
            .single();

        if (error) {
            return res.status(404).json({
                status: 'free',
                message: 'No subscription found'
            });
        }

        res.json(data);
    }, 60) // 1분 캐시
);
```

### 6. 버그 수정 보고서 템플릿

```markdown
## API Bug Fix Report

### API: /api/xxx/xxx
### 수정일: YYYY-MM-DD

### 증상
- 현상: [설명]
- 영향: [사용자 영향]

### 원인
- [근본 원인 분석]

### 수정 내용
```javascript
// 변경 전
[코드]

// 변경 후
[코드]
```

### 성능 개선 (해당 시)
- Before: xxx ms
- After: xxx ms
- 개선율: xx%

### 테스트
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] 부하 테스트
```

## Expected Output Files
- 수정된 API 파일들
- 버그 수정 보고서
- 성능 개선 보고서

## Completion Criteria
- [ ] 보고된 API 버그 모두 수정
- [ ] 성능 병목 지점 개선
- [ ] 에러 핸들링 강화
- [ ] 응답 시간 최적화
- [ ] 모든 API 테스트 통과
- [ ] 수정 사항 문서화

## Tech Stack
- Vercel Serverless Functions
- Supabase
- Node.js

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Tools
- Write, Read
- Bash (API 테스트)

## Execution Type
AI-Only (버그 수정) / Human-Assisted (성능 모니터링)

## Remarks
- 운영 중 발생하는 버그는 지속적으로 관리
- Sentry 에러 로그 정기 확인
- 느린 API 우선 최적화
- 변경 사항은 스테이징에서 먼저 테스트

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S5BA1 → `S5_개발_마무리/Backend_APIs/`

### 제2 규칙: Production 코드는 이중 저장
- Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
