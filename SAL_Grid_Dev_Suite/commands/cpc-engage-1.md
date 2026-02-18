# /cpc-engage-1 — 1소대 투입

CPC(Claude Platoons Control System) 1소대장으로 투입한다.

## 설정

- **CPC API**: `https://claude-platoons-control.vercel.app`
- **소대 번호**: 1

## 디렉토리 → 소대 ID 매핑

| 디렉토리 폴더명 | 소대 ID |
|-----------------|---------|
| `!SSAL_Works_Private` | `ssalworks-1` |
| `mychatbot-world` | `mychatbot-1` |
| `AI_Study_Circle` | `studycircle-1` |
| `Development_PoliticianFinder_com` | `politician-1` |
| `ValueLink` | `valuelink-1` |

## 실행 절차

### 1단계: 프로젝트 자동 감지 + 소대 ID 결정

1. 현재 작업 디렉토리(Primary working directory)의 **폴더명**을 확인한다.
2. 위 매핑 테이블에서 해당 폴더명에 맞는 **소대 ID**를 결정한다.
3. 매핑에 없는 디렉토리면 사용자에게 어느 프로젝트인지 물어본다.

### 2단계: CPC API 조회 + 소대장 선언

```bash
curl -s https://claude-platoons-control.vercel.app/api/platoons
```

결과에서 해당 소대 ID의 name, purpose, status를 추출한 뒤 표시:

```
========================================
  CPC 1소대 투입 (ENGAGE)
  소대: {소대 name}
  프로젝트: {현재 작업 디렉토리 폴더명}
  임무: {소대 purpose}
  상태: RUNNING
========================================
```

### 3단계: 소대 상태를 RUNNING으로 변경

```bash
curl -s -X PATCH "https://claude-platoons-control.vercel.app/api/platoons/{소대ID}/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"RUNNING"}'
```

### 4단계: 대기 명령(PENDING) 수신

```bash
curl -s "https://claude-platoons-control.vercel.app/api/platoons/{소대ID}/commands?status=PENDING"
```

### 5단계: 명령 처리

수신된 PENDING 명령이 있으면:

1. 명령 목록 표시:
   ```
   [수신 명령 N건]
   1. cmd-xxx: "작업 내용..." (source: web-ui)
   ```

2. 각 명령 수신 확인(ACK):
   ```bash
   curl -s -X PATCH "https://claude-platoons-control.vercel.app/api/commands/{commandId}/ack" \
     -H "Content-Type: application/json"
   ```

3. 사용자에게 어떤 명령부터 처리할지 물어본다.

4. 완료 시 보고(DONE):
   ```bash
   curl -s -X PATCH "https://claude-platoons-control.vercel.app/api/commands/{commandId}/done" \
     -H "Content-Type: application/json"
   ```

수신 명령이 없으면:
```
[1소대 대기 명령 없음]
웹 UI: https://claude-platoons-control.vercel.app
```

### 6단계: 세션 종료 시

소대 상태를 IDLE로 복귀:

```bash
curl -s -X PATCH "https://claude-platoons-control.vercel.app/api/platoons/{소대ID}/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"IDLE"}'
```
