# Task Instruction - S3BA4

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

### Stage 명칭
- **S3** = 개발 2차 (Additional Development)

### Area 명칭
- **BA** = Backend APIs (백엔드 API)

---

# Task Instruction - S3BA4

## Task ID
S3BA4

## Task Name
Community API 강화 (DB 정합성, 스레딩, 실시간)

## Task Goal
기존 S3BA6(소급)의 커뮤니티 API를 고도화한다. 게시글/댓글 스레딩, Supabase Realtime 기반 실시간 알림, 데이터 정합성 트리거, 마당(광장) 기능을 추가하여 완전한 커뮤니티 플랫폼 API를 구현한다.

## Prerequisites (Dependencies)
- S1DB1 — 기본 DB 테이블 완료 (posts, comments 등)
- S3SC1 — API 인증 미들웨어 완료 (Rate Limiting 적용)

## Specific Instructions

### 1. 게시글/댓글 스레딩 강화

**`app/api/community/route.ts`**
```typescript
/**
 * @task S3BA4
 * @description 커뮤니티 게시글 API — 스레딩 지원
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 게시글 목록 (카테고리/정렬/페이지네이션)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') ?? 'latest'; // 'latest', 'popular', 'trending'
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 20;

  const supabase = createClient();
  let query = supabase.from('posts').select('*, comments(count)');

  if (category) query = query.eq('category', category);
  if (sort === 'popular') query = query.order('likes', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  query = query.range((page - 1) * limit, page * limit - 1);
  const { data } = await query;
  return NextResponse.json({ posts: data });
}

// POST: 게시글 작성
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from('posts')
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  return NextResponse.json({ post: data });
}
```

### 2. 댓글 스레딩 (대댓글)
- `app/api/community/[id]/comments/route.ts` 작성
- `parent_id` 필드로 대댓글 계층 구조 지원
- 최대 2 depth 스레딩
- 댓글 작성 시 게시글 `comment_count` 자동 업데이트 (트리거 또는 API 내 로직)

### 3. Supabase Realtime 기반 실시간 알림

**`app/api/community/realtime/route.ts`**
```typescript
/**
 * @task S3BA4
 * @description Supabase Realtime 채널 설정 + 알림 발송 API
 */
// POST: 실시간 알림 발송 (댓글, 좋아요 등)
// Supabase Realtime broadcast 채널 활용
// channel: 'community-{post_id}'
// event: 'new_comment', 'new_like', 'new_reply'
```

**`lib/realtime-client.ts`**
```typescript
/**
 * @task S3BA4
 * @description Supabase Realtime 클라이언트 유틸리티
 */
import { createClient } from '@supabase/supabase-js';

export function subscribeToPost(postId: string, callback: (payload: any) => void) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabase
    .channel(`community-${postId}`)
    .on('broadcast', { event: 'new_comment' }, callback)
    .on('broadcast', { event: 'new_like' }, callback)
    .subscribe();
}
```

### 4. 데이터 정합성 처리
- 게시글 삭제 시 연관 댓글 CASCADE 삭제 확인
- 좋아요 중복 방지 (UNIQUE 제약 또는 upsert)
- 댓글 수 정합성 유지 로직

### 5. 마당(광장) 기능
- `app/api/community/yard/route.ts` 작성
- 마당 = 실시간 자유 토론 공간 (채팅형)
- Supabase Realtime Presence 활용 (접속자 수 표시)
- 마당 메시지는 24시간 후 자동 만료

## Expected Output Files
- `Process/S3_개발-2차/Backend_APIs/app/api/community/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/community/realtime/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/community/[id]/comments/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/community/yard/route.ts`
- `Process/S3_개발-2차/Backend_APIs/lib/realtime-client.ts`

## Completion Criteria
- [ ] 게시글 목록/작성/수정/삭제 API 동작
- [ ] 댓글 대댓글(parent_id) 스레딩 구현
- [ ] Supabase Realtime 채널 구성 및 브로드캐스트
- [ ] 마당(Yard) 실시간 채팅 API 구현
- [ ] 데이터 정합성 (CASCADE, 중복 방지) 처리
- [ ] TypeScript 타입 오류 없음

## Tech Stack
- TypeScript, Next.js (App Router)
- Supabase (PostgreSQL + Auth + Realtime)

## Tools
- npm
- supabase CLI

## Task Agent
`backend-developer-core`

## Verification Agent
`code-reviewer-core`

## Execution Type
AI-Only

## Remarks
- 기존 S3BA6 소급 파일(`api/Backend_APIs/community-*.js`)과 기능 중복 확인
- Realtime은 클라이언트 사이드 구독 필요 (FE Task에서 구현)
- 마당 메시지 만료는 DB 트리거 또는 cron job으로 처리 (S4에서 고도화)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3BA4 → `Process/S3_개발-2차/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_APIs/`

---

## 📝 파일 명명 규칙
- Next.js App Router 파일명: `route.ts`
- 폴더명: kebab-case (`community/realtime/`, `community/yard/`)
- 파일 상단 `@task S3BA4` 주석 필수
