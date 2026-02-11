// Vercel Serverless Function - Telegram Bot Webhook with Memory
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!openrouterKey) {
    console.error('Missing OPENROUTER_API_KEY');
    return res.status(200).json({ ok: true });
  }

  // Supabase 클라이언트
  const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

  if (!supabase) {
    console.error('Missing SUPABASE credentials');
    return res.status(200).json({ ok: true });
  }

  const update = req.body;
  const message = update?.message;
  const callbackQuery = update?.callback_query;

  // 웹훅으로 받은 봇 토큰 확인 (텔레그램은 bot_token을 헤더에 보내지 않으므로, 메시지에서 봇 정보 추출)
  // 대신 미리 등록된 봇 목록에서 매칭
  let botToken = null;
  let botId = null;

  // 메시지 또는 콜백에서 봇 정보 확인
  const botUsername = message?.chat?.username || callbackQuery?.message?.chat?.username;

  // Supabase에서 활성화된 모든 봇 조회 (첫 번째 요청 시)
  const { data: bots } = await supabase
    .from('chatbots')
    .select('id, bot_token, bot_username')
    .eq('is_active', true);

  if (!bots || bots.length === 0) {
    console.error('No active bots found');
    return res.status(200).json({ ok: true });
  }

  // 현재는 써니봇만 있으므로 첫 번째 봇 사용 (나중에 webhook URL로 구분 가능)
  // TODO: 웹훅 URL을 /api/telegram/{bot_id} 형태로 만들어서 구분
  const bot = bots[0];
  botToken = bot.bot_token;
  botId = bot.id;

  // 콜백 쿼리 처리 (버튼 클릭)
  if (callbackQuery) {
    const queryData = callbackQuery.data;
    const queryChatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    // 모델 선택 버튼 클릭
    if (queryData.startsWith('model:')) {
      const selectedModel = queryData.replace('model:', '');

      // Supabase에 사용자 선호 모델 저장
      const { data: existing } = await supabase
        .from('chatbot_memory')
        .select('id')
        .eq('bot_id', botId)
        .eq('chat_id', queryChatId)
        .eq('role', 'system')
        .eq('content', 'preferred_model')
        .single();

      if (existing) {
        await supabase.from('chatbot_memory')
          .update({ model: selectedModel })
          .eq('id', existing.id);
      } else {
        await supabase.from('chatbot_memory').insert({
          bot_id: botId,
          chat_id: queryChatId,
          role: 'system',
          content: 'preferred_model',
          model: selectedModel
        });
      }

      const modelNames = {
        'openai/gpt-4o': 'GPT-4o',
        'google/gemini-3-pro-preview': 'Gemini 3 Pro',
        'perplexity/sonar': 'Perplexity Sonar',
        'anthropic/claude-sonnet-4.5': 'Claude Sonnet 4.5',
        'openrouter/free': 'Free Model',
        'random': '랜덤 (5개 모델 중)'
      };

      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: `✅ ${modelNames[selectedModel]} 선택됨`
        })
      });

      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: queryChatId,
          message_id: messageId,
          text: `✅ 선택된 모델: ${modelNames[selectedModel]}\n\n다시 선택하려면 /model 명령어를 사용하세요.`
        })
      });

      return res.status(200).json({ ok: true });
    }
  }

  if (!message?.chat?.id) {
    return res.status(200).json({ ok: true });
  }

  const chatId = message.chat.id;

  // 음성 메시지 처리
  if (message.voice) {
    if (!openaiKey) {
      await sendTelegram(botToken, chatId, '⚠️ 음성 인식 기능이 설정되지 않았습니다.\n텍스트로 보내주세요.');
      return res.status(200).json({ ok: true });
    }

    const voiceFileId = message.voice.file_id;
    try {
      await sendTelegram(botToken, chatId, '🎤 음성을 인식하고 있습니다...');

      // 1. 텔레그램에서 음성 파일 정보 가져오기
      const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${voiceFileId}`);
      const fileInfo = await fileInfoRes.json();

      if (!fileInfo.ok) {
        await sendTelegram(botToken, chatId, '⚠️ 음성 파일을 가져올 수 없습니다.');
        return res.status(200).json({ ok: true });
      }

      const filePath = fileInfo.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

      // 2. 음성 파일 다운로드
      const audioRes = await fetch(fileUrl);
      const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

      // 3. OpenAI Whisper API로 음성→텍스트 변환
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'voice.ogg',
        contentType: 'audio/ogg'
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'ko');

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!whisperRes.ok) {
        const errorText = await whisperRes.text();
        console.error('Whisper API error:', errorText);
        await sendTelegram(botToken, chatId, '⚠️ 음성 인식에 실패했습니다. 다시 시도해주세요.');
        return res.status(200).json({ ok: true });
      }

      const transcription = await whisperRes.json();
      const userText = transcription.text;

      if (!userText || userText.trim() === '') {
        await sendTelegram(botToken, chatId, '⚠️ 음성을 인식하지 못했습니다. 더 명확하게 말씀해주세요.');
        return res.status(200).json({ ok: true });
      }

      // 4. 인식된 텍스트 표시
      await sendTelegram(botToken, chatId, `🎤 인식됨: "${userText}"`);

      // 5. 일반 메시지와 동일하게 처리
      return await processMessage(botId, chatId, userText, supabase, openrouterKey, openaiKey, botToken);

    } catch (error) {
      console.error('Voice processing error:', error);
      await sendTelegram(botToken, chatId, '⚠️ 음성 처리 중 오류가 발생했습니다.');
      return res.status(200).json({ ok: true });
    }
  }

  // 텍스트 메시지
  if (!message.text) {
    return res.status(200).json({ ok: true });
  }

  const userText = message.text;

  // /start 명령어
  if (userText === '/start') {
    await sendTelegram(botToken, chatId, '안녕하세요! AI 챗봇 써니봇입니다 🤖\n\n✅ 텍스트 메시지 OK\n✅ 음성 메시지 OK (자동 인식)\n✅ 대화 맥락 기억\n✅ 인터넷 검색 OK\n\n명령어:\n/search [검색어] - 인터넷 검색\n/model - AI 모델 선택\n/clear - 대화 기록 초기화\n/memory - 기억된 대화 수 확인');
    return res.status(200).json({ ok: true });
  }

  // /model 명령어 - 모델 선택 버튼
  if (userText === '/model') {
    await sendModelSelection(botToken, chatId);
    return res.status(200).json({ ok: true });
  }

  // /clear 명령어 - 대화 기록 삭제
  if (userText === '/clear') {
    await supabase.from('chatbot_memory').delete().eq('bot_id', botId).eq('chat_id', chatId);
    await sendTelegram(botToken, chatId, '🗑️ 대화 기록이 초기화되었습니다. 새로운 대화를 시작하세요!');
    return res.status(200).json({ ok: true });
  }

  // /memory 명령어 - 기억된 대화 수 확인
  if (userText === '/memory') {
    const { count } = await supabase
      .from('chatbot_memory')
      .select('*', { count: 'exact', head: true })
      .eq('bot_id', botId)
      .eq('chat_id', chatId);
    await sendTelegram(botToken, chatId, `🧠 현재 기억된 대화: ${count || 0}개 메시지`);
    return res.status(200).json({ ok: true });
  }

  // /search 명령어 - 인터넷 검색 (Perplexity 강제 사용)
  if (userText.startsWith('/search ')) {
    const searchQuery = userText.replace('/search ', '').trim();
    if (!searchQuery) {
      await sendTelegram(botToken, chatId, '⚠️ 검색어를 입력해주세요.\n예: /search 오늘 날씨');
      return res.status(200).json({ ok: true });
    }
    await sendTelegram(botToken, chatId, '🔍 인터넷 검색 중...');
    return await processMessage(botId, chatId, searchQuery, supabase, openrouterKey, openaiKey, botToken, 'perplexity/sonar');
  }

  return await processMessage(botId, chatId, userText, supabase, openrouterKey, openaiKey, botToken);
}

async function processMessage(botId, chatId, userText, supabase, openrouterKey, openaiKey, botToken, forceModel = null) {
  try {
    // 1. 사용자 선호 모델 확인 (강제 모델이 없을 때만)
    let preferredModel = forceModel;
    if (!forceModel) {
      const { data: modelPref } = await supabase
        .from('chatbot_memory')
        .select('model')
        .eq('bot_id', botId)
        .eq('chat_id', chatId)
        .eq('role', 'system')
        .eq('content', 'preferred_model')
        .single();

      if (modelPref?.model && modelPref.model !== 'random') {
        preferredModel = modelPref.model;
      }
    }

    // 2. 이전 대화 기록 불러오기 (최근 20개)
    let conversationHistory = [];
    const { data: history } = await supabase
      .from('chatbot_memory')
      .select('role, content')
      .eq('bot_id', botId)
      .eq('chat_id', chatId)
      .neq('role', 'system')
      .order('created_at', { ascending: true })
      .limit(20);

    if (history && history.length > 0) {
      conversationHistory = history.map(h => ({
        role: h.role,
        content: h.content
      }));
    }

    // 3. 메시지 구성 (시스템 + 이전대화 + 새 메시지)
    const systemPrompt = forceModel === 'perplexity/sonar'
      ? '당신은 인터넷 검색 전문 AI입니다. 사용자 질문에 대해 최신 정보를 인터넷에서 검색하여 정확하고 최신의 정보를 제공하세요. 항상 한국어로 답변하고, 출처가 있다면 간단히 언급하세요.'
      : '당신은 친절한 한국어 AI 어시스턴트 "써니봇"입니다. 항상 한국어로 답변하세요. 텔레그램 메신저로 대화하고 있으므로 간결하게 답변하세요. 이전 대화 맥락을 참고하여 자연스럽게 대화를 이어가세요.';

    const msgPayload = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userText
      }
    ];

    // 4. 사용자 메시지 저장
    await supabase.from('chatbot_memory').insert({
      bot_id: botId,
      chat_id: chatId,
      role: 'user',
      content: userText
    });

    // 5. AI 호출 (선호 모델 또는 폴백 재시도)
    const models = [
      'openai/gpt-4o',
      'google/gemini-3-pro-preview',
      'perplexity/sonar',
      'anthropic/claude-sonnet-4.5',
      'openrouter/free'
    ];

    const modelDisplayNames = {
      'openai/gpt-4o': 'GPT-4o',
      'google/gemini-3-pro-preview': 'Gemini 3 Pro',
      'perplexity/sonar': 'Perplexity Sonar',
      'anthropic/claude-sonnet-4.5': 'Claude Sonnet 4.5',
      'openrouter/free': 'Free Model'
    };

    // 선호 모델이 있으면 우선 시도, 없으면 랜덤
    const tryOrder = preferredModel
      ? [preferredModel, ...models.filter(m => m !== preferredModel).sort(() => Math.random() - 0.5)]
      : models.sort(() => Math.random() - 0.5);

    let replied = false;

    for (const tryModel of shuffled) {
      try {
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-chatbot-avatar-project.vercel.app',
            'X-Title': 'AI Avatar Chat - Telegram'
          },
          body: JSON.stringify({
            model: tryModel,
            max_tokens: 500,
            messages: msgPayload
          })
        });

        if (!aiResponse.ok) {
          console.error(`Telegram: Model ${tryModel} failed`);
          continue;
        }

        const data = await aiResponse.json();
        const responseText = data.choices?.[0]?.message?.content;
        if (!responseText) continue;

        // 5. AI 응답 저장
        await supabase.from('chatbot_memory').insert({
          bot_id: botId,
          chat_id: chatId,
          role: 'assistant',
          content: responseText,
          model: tryModel
        });

        // 6. 검색인 경우 search_history에도 저장
        if (forceModel === 'perplexity/sonar') {
          await supabase.from('chatbot_search_history').insert({
            bot_id: botId,
            chat_id: chatId,
            query: userText,
            result: responseText,
            model: tryModel
          });
        }

        const displayName = modelDisplayNames[tryModel] || tryModel;
        await sendTelegram(botToken, chatId, `🤖 ${displayName}\n\n${responseText}`);
        replied = true;
        break;
      } catch (err) {
        console.error(`Telegram: Model ${tryModel} error:`, err.message);
        continue;
      }
    }

    if (!replied) {
      // 실패 시 저장한 사용자 메시지 삭제
      await supabase.from('chatbot_memory')
        .delete()
        .eq('bot_id', botId)
        .eq('chat_id', chatId)
        .eq('role', 'user')
        .eq('content', userText)
        .order('created_at', { ascending: false })
        .limit(1);
      await sendTelegram(botToken, chatId, '⚠️ 일시적으로 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }

  } catch (error) {
    console.error('Telegram bot error:', error);
    await sendTelegram(botToken, chatId, '⚠️ 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }

  return res.status(200).json({ ok: true });
}

async function sendTelegram(botToken, chatId, text) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}

async function sendModelSelection(botToken, chatId) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🤖 사용할 AI 모델을 선택하세요:',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔴 GPT-4o', callback_data: 'model:openai/gpt-4o' },
            { text: '🔵 Gemini 3 Pro', callback_data: 'model:google/gemini-3-pro-preview' }
          ],
          [
            { text: '🟣 Claude Sonnet 4.5', callback_data: 'model:anthropic/claude-sonnet-4.5' },
            { text: '🟢 Perplexity Sonar', callback_data: 'model:perplexity/sonar' }
          ],
          [
            { text: '⚪ Free Model', callback_data: 'model:openrouter/free' },
            { text: '🎲 랜덤', callback_data: 'model:random' }
          ]
        ]
      }
    })
  });
}
