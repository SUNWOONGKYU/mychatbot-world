# S8FE2: 채팅창 음성/텍스트 모드 토글 UX

## Task 정보
- **Task ID**: S8FE2
- **Stage**: S8
- **Area**: FE
- **Dependencies**: S7FE9

## Task 목표

음성 입력 상태가 고착되어 텍스트 전환 과정이 사용자에게 보이지 않는 문제를 해결한다. 명시적인 모드 스위칭 UI를 도입한다.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `components/bot/chat-window.tsx` | `inputMode: 'text' \| 'voice'` state + pill tablist + mic 버튼 상태 반영 |

## 요구사항

- Pill tablist(⌨️ 텍스트 / 🎙️ 음성) — role="tablist", aria-selected
- 녹음 중 mic 버튼 ⏹️ 아이콘, 텍스트 모드에선 opacity 0.5
- 녹음 중 textarea placeholder: "🔴 녹음 중 — 버튼을 다시 누르면 정지"
- 음성→텍스트 전환 시 녹음 중이면 자동 정지(`toggleStt` 호출)
- 기존 STT/TTS API 불변
