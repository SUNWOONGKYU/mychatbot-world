# S2S2: 카카오 소셜 로그인

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S2S2 |
| Task 이름 | 카카오 소셜 로그인 |
| Stage | S2 — 개발 1차 |
| Area | S — Security |
| Dependencies | S2S1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

한국 사용자를 위한 카카오 소셜 로그인을 추가한다. 기존 보안 미들웨어(S2S1)와 통합하여 Supabase Auth의 Kakao OAuth 프로바이더를 활성화한다. 카카오 개발자 앱 등록은 PO가 직접 수행해야 하는 Human-AI 태스크이다.

## 세부 작업 지시

1. PO 작업 (AI가 가이드 제공):
   - https://developers.kakao.com/ 에서 앱 등록
   - REST API 키, 카카오 로그인 활성화
   - Redirect URI: {프로젝트URL}/auth/callback
2. Supabase Auth 설정 (AI 가이드):
   - Authentication > Providers > Kakao 활성화
   - Client ID (REST API 키), Client Secret 입력
3. 로그인 UI에 카카오 로그인 버튼 추가:
   - 카카오 공식 버튼 디자인 가이드라인 준수
   - 노란색 배경, "카카오로 시작하기" 텍스트
4. Supabase signInWithOAuth({ provider: 'kakao' }) 호출 코드 추가

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| Supabase Auth 설정 | Kakao 프로바이더 활성화 (대시보드에서 설정) |
| pages/auth/login.html | 카카오 로그인 버튼 추가 |
| js/auth.js | signInWithOAuth kakao 호출 추가 |

## 완료 기준
- [ ] Supabase Auth에 Kakao 프로바이더 활성화
- [ ] 로그인 페이지에 카카오 버튼 표시
- [ ] 카카오 버튼 클릭 시 OAuth 플로우 시작
- [ ] 로그인 완료 후 대시보드 리다이렉트
- [ ] 카카오 API 키 환경변수로 관리 (하드코딩 금지)
- [ ] 기존 이메일/구글 로그인과 공존
