# Chat Endpoint Example

채팅 API 엔드포인트 상세 예시입니다.

---

## POST /api/v1/chat

AI 챗봇과 대화하는 메인 엔드포인트입니다.

---

## 📋 Request

### Endpoint
```
POST /api/v1/chat
```

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Body (JSON)
```json
{
  "message": "Can you help me schedule a meeting for tomorrow at 2 PM?",
  "persona_id": "business-assistant",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Parameters**:
- `message` (string, required): 사용자 메시지
- `persona_id` (string, required): 챗봇 페르소나 ID
- `conversation_id` (string, optional): 기존 대화 ID (없으면 새 대화 생성)

---

## ✅ Response (Success)

### Status: 200 OK

```json
{
  "response": "Of course! I'll help you schedule a meeting for tomorrow at 2 PM. To do this, I'll need a few more details:\n\n1. What is the meeting title/subject?\n2. Who should attend this meeting?\n3. How long should the meeting last?\n4. Would you like me to send calendar invites?",
  "emotion": "happy",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-09T18:00:00Z"
}
```

**Fields**:
- `response` (string): AI 챗봇 응답
- `emotion` (string): 감정 표현 (neutral, happy, sad, angry, surprised, thinking, concerned)
- `conversation_id` (string): 대화 ID
- `timestamp` (string): 응답 시간 (ISO 8601)

---

## ❌ Error Responses

### 401 Unauthorized (인증 실패)
```json
{
  "error": "Unauthorized",
  "detail": "Invalid or expired token",
  "status_code": 401
}
```

### 400 Bad Request (validation 실패)
```json
{
  "error": "Validation Error",
  "detail": "persona_id must be one of: business-assistant, customer-service, education-tutor, healthcare-advisor, entertainment-bot, personal-assistant",
  "status_code": 400
}
```

### 429 Too Many Requests (rate limit)
```json
{
  "error": "Rate Limit Exceeded",
  "detail": "You have exceeded the maximum of 100 requests per minute",
  "status_code": 429
}
```

---

## 💻 Code Examples

### cURL
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you help me schedule a meeting for tomorrow at 2 PM?",
    "persona_id": "business-assistant"
  }'
```

### Python (requests)
```python
import requests

url = "http://localhost:8000/api/v1/chat"
headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "message": "Can you help me schedule a meeting for tomorrow at 2 PM?",
    "persona_id": "business-assistant"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

print(f"Response: {result['response']}")
print(f"Emotion: {result['emotion']}")
```

### JavaScript (fetch)
```javascript
const url = 'http://localhost:8000/api/v1/chat';
const token = 'YOUR_JWT_TOKEN';

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Can you help me schedule a meeting for tomorrow at 2 PM?',
    persona_id: 'business-assistant'
  })
});

const result = await response.json();
console.log('Response:', result.response);
console.log('Emotion:', result.emotion);
```

### Python (httpx - async)
```python
import httpx
import asyncio

async def chat():
    url = "http://localhost:8000/api/v1/chat"
    headers = {
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    }
    data = {
        "message": "Can you help me schedule a meeting for tomorrow at 2 PM?",
        "persona_id": "business-assistant"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        result = response.json()
        return result

# Run
result = asyncio.run(chat())
print(result['response'])
```

---

## 🔄 Streaming Response (WebSocket)

실시간 스트리밍 응답을 원하면 WebSocket을 사용하세요:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat?token=YOUR_JWT_TOKEN');

ws.onopen = () => {
  ws.send(JSON.stringify({
    message: 'Can you help me schedule a meeting for tomorrow at 2 PM?',
    persona_id: 'business-assistant'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'chunk') {
    // 응답 조각을 화면에 점진적으로 표시
    console.log(data.content);
  } else if (data.type === 'complete') {
    // 응답 완료
    console.log('Done!', data.emotion);
  }
};
```

---

## 📊 Response Time

일반적인 응답 시간:

- **REST API**: 1-3초 (전체 응답 대기)
- **WebSocket**: 0.1-0.3초 (첫 chunk), 1-3초 (전체 완료)

---

## 🎭 Persona-Specific Examples

### Business Assistant
```json
{
  "message": "Analyze this quarter's sales data and give me insights",
  "persona_id": "business-assistant"
}
```

### Education Tutor
```json
{
  "message": "Can you explain photosynthesis in simple terms?",
  "persona_id": "education-tutor"
}
```

### Healthcare Advisor
```json
{
  "message": "What are some healthy breakfast options?",
  "persona_id": "healthcare-advisor"
}
```

---

**마지막 업데이트**: 2026-02-09
