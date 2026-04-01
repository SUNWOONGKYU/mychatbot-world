# Task Instruction - S3FE4

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
- **FE** = Frontend (프론트엔드)

---

## ⚠️ FE Task 필수 사전 확인

> **작업 전 반드시 확인!**

- [ ] S1DB1 완료 — `posts`, `comments` 테이블 존재
- [ ] S3BA4 완료 — Community API (`/api/community`, `/api/community/realtime`) 존재
- [ ] 하드코딩 금지: `const MOCK_POSTS = [...]` 절대 금지

---

# Task Instruction - S3FE4

## Task ID
S3FE4

## Task Name
Community 페이지 React 전환

## Task Goal
커뮤니티 섹션의 게시판/글쓰기/상세/갤러리 페이지를 Next.js App Router 기반 React 컴포넌트로 구현한다. 실시간 마당(Yard) 기능과 Supabase Realtime 구독을 포함한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js 기본 레이아웃 완료
- S3BA4 — Community API 완료 (Realtime 포함)

## Specific Instructions

### 1. 커뮤니티 게시판 페이지

**`app/community/page.tsx`**
```typescript
/**
 * @task S3FE4
 * @description 커뮤니티 게시판 — 목록, 카테고리, 정렬
 */
'use client';
import { useState, useEffect } from 'react';

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');

  useEffect(() => {
    const params = new URLSearchParams({ category, sort });
    fetch(`/api/community?${params}`).then(r => r.json()).then(d => setPosts(d.posts ?? []));
  }, [category, sort]);

  return (
    <div>
      {/* 카테고리 탭 */}
      {/* 정렬 옵션 */}
      {/* 게시글 목록 */}
      {posts.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
```

### 2. 글쓰기 페이지
- `app/community/write/page.tsx` 작성
- 제목, 카테고리, 본문 입력
- 이미지 첨부 (optional)
- POST `/api/community` 호출
- 작성 완료 후 게시글 상세로 이동

### 3. 게시글 상세 페이지

**`app/community/[id]/page.tsx`**
- 게시글 내용, 작성자, 좋아요 수 표시
- 댓글 목록 (대댓글 스레딩 포함)
- Supabase Realtime 구독 (새 댓글 실시간 수신)

```typescript
/**
 * @task S3FE4
 */
'use client';
import { useEffect, useState } from 'react';
import { subscribeToPost } from '@/lib/realtime-client';

export default function PostDetail({ params }: { params: { id: string } }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetch(`/api/community/${params.id}/comments`).then(r => r.json()).then(d => setComments(d.comments));

    // 실시간 댓글 구독
    const channel = subscribeToPost(params.id, (payload) => {
      if (payload.event === 'new_comment') {
        setComments(prev => [...prev, payload.data]);
      }
    });

    return () => channel.unsubscribe();
  }, [params.id]);

  // ...
}
```

### 4. 갤러리 뷰
- `app/community/gallery/page.tsx` 작성
- 이미지 첨부 게시글 갤러리 그리드 뷰
- 이미지 클릭 시 게시글 상세로 이동

### 5. 실시간 마당(Yard) 컴포넌트
- `components/community/yard.tsx` 작성
- 채팅형 실시간 메시지 표시
- Supabase Realtime Presence (접속자 수 표시)
- 메시지 입력/전송

## Expected Output Files
- `Process/S3_개발-2차/Frontend/app/community/page.tsx`
- `Process/S3_개발-2차/Frontend/app/community/write/page.tsx`
- `Process/S3_개발-2차/Frontend/app/community/[id]/page.tsx`
- `Process/S3_개발-2차/Frontend/app/community/gallery/page.tsx`
- `Process/S3_개발-2차/Frontend/components/community/yard.tsx`

## Completion Criteria
- [ ] 게시판 목록에서 실제 API fetch (하드코딩 없음)
- [ ] 글쓰기 폼 동작
- [ ] 댓글 스레딩 (대댓글) UI 표시
- [ ] Supabase Realtime 구독 (새 댓글 실시간 표시)
- [ ] 마당(Yard) 채팅 UI 동작
- [ ] TypeScript 타입 오류 없음
- [ ] 반응형 레이아웃

## Tech Stack
- TypeScript, React, Next.js (App Router)
- Tailwind CSS
- Supabase Realtime (클라이언트 구독)

## Tools
- npm
- supabase CLI (Realtime 채널 테스트)

## Task Agent
`frontend-developer-core`

## Verification Agent
`code-reviewer-core`

## Execution Type
AI-Only

## Remarks
- **하드코딩 절대 금지**: 게시글/댓글 더미 데이터 배열 금지
- Realtime 구독은 컴포넌트 언마운트 시 `unsubscribe()` 필수
- 댓글 대댓글은 시각적 들여쓰기로 depth 표현

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3FE4 → `Process/S3_개발-2차/Frontend/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `pages/`

---

## 📝 파일 명명 규칙
- Next.js App Router: `page.tsx`
- 컴포넌트: `kebab-case.tsx` (`yard.tsx`)
- 파일 상단 `@task S3FE4` 주석 필수
