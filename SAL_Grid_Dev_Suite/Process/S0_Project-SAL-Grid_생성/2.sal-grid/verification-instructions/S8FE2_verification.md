# S8FE2 검증

## 검증 항목
- [ ] `inputMode` state 존재 (`'text' | 'voice'`)
- [ ] role="tablist" + aria-selected 적용
- [ ] mic 버튼 녹음 중 ⏹️ 아이콘으로 전환
- [ ] 텍스트 모드에서 mic 버튼 opacity 0.5
- [ ] 녹음 중 textarea placeholder 상태 반영
- [ ] 음성→텍스트 전환 시 `isRecording` 시 자동 정지 로직 존재
- [ ] 기존 STT/TTS API 호환 유지
- [ ] 배포 후 마이크 권한 후 녹음·정지·모드 전환 정상 (manual)

## Agent
- code-reviewer-core
