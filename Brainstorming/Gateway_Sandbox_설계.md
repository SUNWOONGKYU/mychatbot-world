# MCW 게이트웨이 + 샌드박스 설계 문서

## 1. 게이트웨이 아키텍처 (Supabase Realtime)

### 현재 문제
- CPC 폴링: 2~3초 간격 REST API 호출 (비효율적)
- 실시간 타이핑 인디케이터 불가
- 멀티 세션 동시 관리 어려움

### 목표 아키텍처
```
클라이언트 (chat.js)
    ↕ Supabase Realtime (WebSocket)
Supabase PostgreSQL
    ↕ Trigger/Function
api/ (Vercel Serverless)
```

### Supabase Realtime 활용 방법

#### 테이블 이벤트 구독
```js
// 클라이언트에서 mcw_chat_logs INSERT 이벤트 구독
const channel = supabase
  .channel('chat-realtime')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'mcw_chat_logs',
    filter: `bot_id=eq.${botId}`
  }, (payload) => {
    // 새 메시지 도착 → UI 업데이트
    handleRealtimeMessage(payload.new);
  })
  .subscribe();
```

#### CPC 폴링 제거
```js
// 현재: setInterval(cpcPollTrackedCommands, 3000)
// 개선: cpc_commands 테이블 변경 이벤트 구독
const cpcChannel = supabase
  .channel('cpc-realtime')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'cpc_commands',
    filter: `status=eq.DONE`
  }, (payload) => {
    handleCpcCommandDone(payload.new);
  })
  .subscribe();
```

### 타이핑 인디케이터
Supabase Realtime의 `presence` 기능 활용:
```js
const presenceChannel = supabase.channel('typing');
// 타이핑 시작
presenceChannel.track({ user_id: userId, typing: true });
// 타이핑 종료
presenceChannel.untrack();
```

### 마이그레이션 단계
1. Supabase Realtime 활성화 (프로젝트 설정)
2. mcw_chat_logs 테이블에 Realtime 권한 추가
3. chat.js에서 구독 코드 추가 (기존 코드와 병행)
4. CPC 폴링 로직을 Realtime으로 점진적 교체
5. 안정화 후 폴링 코드 제거

---

## 2. 에이전트 샌드박스 설계

### 목표
사용자가 "이 데이터 분석해줘" → AI가 코드 생성 → 격리 환경에서 실행 → 결과 반환

### 제약조건
- Vercel Serverless: 코드 실행 환경 제공 불가 (10초 타임아웃, 파일시스템 읽기전용)
- 별도 인프라 필요

### 후보 솔루션

#### Option A: E2B (e2b.dev)
- 클라우드 기반 코드 실행 샌드박스
- Python, JS, R 지원
- API 호출로 코드 실행 → 결과 반환
- 가격: 사용량 기반 (소규모 무료)

```
api/sandbox.js → E2B API → 코드 실행 → 결과 반환
```

#### Option B: Supabase Edge Functions (Deno)
- Supabase에 내장된 서버리스 함수
- Deno 런타임 (JS/TS 실행 가능)
- 제한적이지만 간단한 코드 실행 가능

#### Option C: 자체 Docker 서버
- 가장 유연하지만 인프라 비용 발생
- Railway/Fly.io에 Docker 컨테이너 배포

### 권장 로드맵
1. **Phase 3a**: E2B 연동 프로토타입 (가장 빠르게 시작 가능)
2. **Phase 3b**: Supabase Edge Functions로 간단한 코드 실행
3. **Phase 3c**: 사용량 증가 시 자체 Docker 인프라 검토

### 인터페이스 설계
```js
// api/sandbox.js
export default async function handler(req, res) {
  const { code, language, timeout = 5000 } = req.body;

  // E2B API 호출
  const result = await e2b.execute({
    code,
    language,
    timeout
  });

  return res.json({
    output: result.stdout,
    error: result.stderr,
    exitCode: result.exitCode
  });
}
```

### 보안 고려사항
- 네트워크 격리 (외부 API 호출 제한)
- 실행 시간 제한 (최대 10초)
- 메모리 제한 (128MB)
- 파일시스템 격리 (임시 디렉토리만 쓰기 가능)
- 악성 코드 패턴 사전 필터링

---

*작성일: 2026-02-23*
*상태: 설계 완료, 구현 보류 (인프라 결정 후)*
