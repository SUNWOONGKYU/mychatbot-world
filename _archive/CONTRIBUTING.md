# 기여 가이드 (CONTRIBUTING)

AI Avatar Chat Platform 프로젝트에 관심을 가져주셔서 감사합니다! 🎉

---

## 📋 기여 방법

### 1. 이슈 생성
버그 리포트, 기능 제안, 질문은 [GitHub Issues](../../issues)를 통해 제출해주세요.

**버그 리포트 포함 사항**:
- 현재 동작
- 예상 동작
- 재현 방법
- 환경 (OS, 브라우저, Python/Node 버전)

**기능 제안 포함 사항**:
- 기능 설명
- 사용 사례
- 예상 효과

---

### 2. Pull Request

#### 브랜치 전략

```
main (프로덕션)
  ↑
develop (개발)
  ↑
feature/* (기능 개발)
bugfix/* (버그 수정)
hotfix/* (긴급 수정)
```

**브랜치 명명 규칙**:
- `feature/S2BA1-chat-api` - Task ID 포함
- `bugfix/fix-avatar-rendering`
- `hotfix/security-patch`

#### PR 프로세스

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/ai-chatbot-avatar-project.git
   cd ai-chatbot-avatar-project
   ```

2. **브랜치 생성**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **변경 사항 작성**
   - 코드 작성
   - 테스트 추가
   - 문서 업데이트

4. **커밋**
   ```bash
   git add .
   git commit -m "feat(S2BA1): Add chat API endpoint"
   ```

5. **Push & PR 생성**
   ```bash
   git push origin feature/your-feature-name
   ```
   GitHub에서 Pull Request 생성

---

## 📝 커밋 메시지 규칙

### Conventional Commits 사용

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 등

**Scope** (선택):
- Task ID (예: `S2BA1`, `S3F1`)
- 또는 영역 (예: `backend`, `frontend`, `docs`)

**예시**:
```
feat(S2BA1): Add POST /api/v1/chat endpoint

- Implement streaming response
- Add Claude API integration
- Add error handling

Closes #123
```

---

## 🎨 코딩 스타일

### Python (백엔드)
- **Formatter**: Black
- **Linter**: Flake8
- **타입 힌트** 필수
- **Docstring**: Google 스타일

```python
def create_chat_response(message: str, user_id: str) -> dict:
    """
    채팅 응답 생성

    Args:
        message: 사용자 메시지
        user_id: 사용자 ID

    Returns:
        응답 딕셔너리
    """
    pass
```

### JavaScript/TypeScript (프론트엔드)
- **Formatter**: Prettier
- **Linter**: ESLint
- **컴포넌트**: 함수형 컴포넌트
- **Hooks** 우선 사용

```javascript
/**
 * 채팅 창 컴포넌트
 */
const ChatWindow = ({ messages }) => {
  // ...
};
```

---

## ✅ PR 체크리스트

PR 생성 전 확인:

- [ ] 코드가 Lint 규칙을 통과하는가?
- [ ] 테스트가 추가/업데이트되었는가?
- [ ] 테스트가 모두 통과하는가?
- [ ] 문서가 업데이트되었는가?
- [ ] 커밋 메시지가 규칙을 따르는가?
- [ ] 변경 사항이 명확하게 설명되었는가?

---

## 🧪 테스트

### 백엔드 테스트
```bash
cd src/backend
pytest
pytest --cov=app  # 커버리지 포함
```

### 프론트엔드 테스트
```bash
cd src/frontend
npm test
npm run test:coverage
```

**최소 테스트 커버리지**: 80%

---

## 📚 개발 환경 설정

### 1. 환경 변수
`.env.sample`을 `.env`로 복사하고 필요한 값 입력

### 2. Pre-commit Hook 설정
```bash
pip install pre-commit
pre-commit install
```

### 3. 의존성 설치
```bash
# 백엔드
cd src/backend
pip install -r requirements-dev.txt

# 프론트엔드
cd src/frontend
npm install
```

---

## 🔍 코드 리뷰 가이드

### 리뷰어
- 건설적인 피드백
- 코드 품질, 성능, 보안 검토
- 24시간 내 응답 (가능한 경우)

### 기여자
- 피드백 수용적 태도
- 변경 요청 시 빠른 대응
- 리뷰 후 감사 표현

---

## 🚫 금지 사항

- **절대 금지**:
  - API 키, 비밀번호 등 민감 정보 커밋
  - 대용량 바이너리 파일 (> 10MB)
  - 저작권 침해 코드
  - 테스트 없이 critical 기능 변경

- **권장하지 않음**:
  - 한 PR에 여러 기능 포함
  - 코딩 스타일 무시
  - 문서화 생략

---

## 💡 도움이 필요하신가요?

- **문서**: `Dev_Package/Process/` 폴더 참고
- **이슈**: GitHub Issues에 질문 등록
- **실시간 대화**: [Discord/Slack 링크 추후 추가]

---

## 🎖️ 기여자 명예의 전당

기여해주신 모든 분들께 감사드립니다!

[Contributors](../../graphs/contributors)

---

**마지막 업데이트**: 2026-02-09  
**버전**: 1.0
