// 텔레그램 봇 명령어 메뉴 설정 스크립트
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8515896355:AAE6_oXxsPfQgStNVo3GiZCFj2IojcKcRBI';

const commands = [
  { command: 'start', description: '봇 시작 및 도움말' },
  { command: 'search', description: '인터넷 검색 (예: /search 날씨)' },
  { command: 'model', description: 'AI 모델 선택' },
  { command: 'clear', description: '대화 기록 초기화' },
  { command: 'memory', description: '기억된 대화 수 확인' }
];

async function setCommands() {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands })
  });

  const result = await response.json();
  console.log('Commands set:', result);
}

setCommands();
