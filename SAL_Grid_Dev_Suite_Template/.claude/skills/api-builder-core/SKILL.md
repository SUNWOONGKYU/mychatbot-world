# /api-builder-core

> **SAL Grid Dev Suite** — RESTful API 엔드포인트 설계 및 구현 전문 스킬
>
> **사용 시점**: API 엔드포인트를 신규 설계하거나 기존 API에 CRUD를 추가할 때
> **적용 대상**: Vanilla 및 React/Next.js 모두 적용 가능

---

## 전문 분야

RESTful API 설계/구현 전문가

- **Vanilla**: `pages/api/` 또는 별도 서버리스 함수 (Vercel Functions 등)
- **React/Next.js**: `app/api/` (App Router) 또는 `pages/api/` (Pages Router)

---

## 핵심 역할

1. **API 엔드포인트 설계**: RESTful 원칙에 따른 API 구조 설계
2. **Request/Response 처리**: 쿼리 파라미터, Body, 헤더 처리
3. **데이터 검증**: Zod 등을 사용한 입력 검증
4. **에러 핸들링**: 표준화된 에러 응답
5. **API 문서화**: OpenAPI/Swagger 스펙 작성

---

## API 설계 원칙

### RESTful 규칙
```
GET    /api/items        # 목록 조회
GET    /api/items/[id]   # 단일 조회
POST   /api/items        # 생성
PUT    /api/items/[id]   # 전체 수정
PATCH  /api/items/[id]   # 부분 수정
DELETE /api/items/[id]   # 삭제
```

> 위 예시에서 `items`는 이 프로젝트의 주요 리소스 이름으로 대체합니다.

### 응답 형식 표준화
```typescript
// 성공 응답
{
  "data": { /* 실제 데이터 */ },
  "pagination": { /* 페이지네이션 정보 (목록 API만) */ }
}

// 에러 응답
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "사용자 친화적 메시지",
    "details": { /* 상세 정보 */ }
  }
}
```

---

## 표준 API Route 템플릿

### GET (목록 조회)

**React/Next.js (App Router)**
```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Validation
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: 'Invalid pagination parameters' } },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let query = supabase
      .from('items')
      .select('*', { count: 'exact' });

    // Filters
    if (status) query = query.eq('status', status);

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

**Vanilla (Vercel Serverless Function)**
```javascript
// api/items/index.js
import { createClient } from '../lib/supabase-client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: 'Invalid pagination parameters' } });
    }

    const supabase = createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('items')
      .select('*', { count: 'exact' })
      .range(from, to);

    if (error) throw error;

    return res.status(200).json({
      data,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
}
```

### GET (단일 조회)
```typescript
// app/api/items/[id]/route.ts  (Next.js App Router)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ID', message: 'Invalid resource ID' } },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

### POST (생성)
```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.string().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const validated = createItemSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validated.error.flatten()
          }
        },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('items')
      .insert(validated.data)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

### PUT/PATCH (수정)
```typescript
// app/api/items/[id]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    // Validation (부분 업데이트)
    const updateSchema = createItemSchema.partial();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('items')
      .update(validated.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

### DELETE (삭제)
```typescript
// app/api/items/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const supabase = createClient();
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

---

## 인증이 필요한 API

```typescript
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 권한 확인 (예: 관리자만)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // 실제 로직
    // ...

  } catch (error) {
    // 에러 핸들링
  }
}
```

---

## 에러 코드 표준

```typescript
// lib/api/errors.ts
export const API_ERRORS = {
  // 400 Bad Request
  INVALID_PARAMS: 'Invalid request parameters',
  VALIDATION_ERROR: 'Input validation failed',
  INVALID_ID: 'Invalid resource ID',

  // 401 Unauthorized
  UNAUTHORIZED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',

  // 403 Forbidden
  FORBIDDEN: 'Insufficient permissions',

  // 404 Not Found
  NOT_FOUND: 'Resource not found',

  // 409 Conflict
  ALREADY_EXISTS: 'Resource already exists',

  // 500 Internal Server Error
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
};
```

---

## API 테스트 가이드

### curl로 테스트
```bash
# GET 목록
curl http://localhost:3000/api/items?page=1&limit=10

# GET 단일
curl http://localhost:3000/api/items/1

# POST 생성
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"새 항목","description":"설명","status":"active"}'

# PATCH 수정
curl -X PATCH http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"description":"업데이트된 설명"}'

# DELETE 삭제
curl -X DELETE http://localhost:3000/api/items/1
```

### Postman/Insomnia Collection
```json
{
  "name": "{PROJECT_NAME} API",
  "requests": [
    {
      "name": "Get Items",
      "method": "GET",
      "url": "{{baseUrl}}/api/items?page=1&limit=10"
    },
    {
      "name": "Get Item by ID",
      "method": "GET",
      "url": "{{baseUrl}}/api/items/:id"
    }
  ]
}
```

---

## 성능 최적화

### 1. Caching
```typescript
export async function GET(request: NextRequest) {
  // 캐시 헤더 추가
  const response = NextResponse.json({ data });
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  return response;
}
```

### 2. Database 쿼리 최적화
```typescript
// Bad: 모든 컬럼 조회
const { data } = await supabase.from('items').select('*');

// Good: 필요한 컬럼만
const { data } = await supabase
  .from('items')
  .select('id, title, status, created_at');
```

### 3. Pagination
```typescript
// 항상 limit 적용
const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
```

---

## API 문서화 (OpenAPI)

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: {PROJECT_NAME} API
  version: 1.0.0

paths:
  /api/items:
    get:
      summary: Get list of items
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Item'
```

---

## 작업 완료 보고 템플릿

```markdown
=== API 구축 완료 보고 ===

## 구현된 엔드포인트
- GET /api/items (목록 조회)
- GET /api/items/[id] (단일 조회)
- POST /api/items (생성)
- PATCH /api/items/[id] (수정)
- DELETE /api/items/[id] (삭제)

## 기능
- 페이지네이션 (page, limit)
- 필터링 (status 등 프로젝트별 필드)
- 데이터 검증 (Zod)
- 표준 에러 응답
- 인증/권한 확인

## 생성 파일
- Vanilla: api/items/index.js, api/items/[id].js, api/lib/errors.js
- React:   app/api/items/route.ts, app/api/items/[id]/route.ts, lib/api/errors.ts

## 테스트 결과
- GET /api/items - 200 OK
- POST /api/items - 201 Created
- 잘못된 파라미터 - 400 Bad Request
- 존재하지 않는 리소스 - 404 Not Found

## 다음 단계
- API 문서 자동 생성 (Swagger)
- Rate limiting 추가
- 로깅 시스템 통합
```

---

**이 스킬을 사용하면 표준화되고 안전하며 성능 좋은 API를 구축할 수 있습니다.**
