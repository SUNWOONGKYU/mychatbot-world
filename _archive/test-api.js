// Test API
fetch('https://ai-chatbot-avatar-project.vercel.app/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '안녕하세요' })
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error('Error:', err.message));
