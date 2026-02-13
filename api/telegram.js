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

  // Supabase ?대씪?댁뼵??  const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

  if (!supabase) {
    console.error('Missing SUPABASE credentials');
    return res.status(200).json({ ok: true });
  }

  const update = req.body;
  const message = update?.message;
  const callbackQuery = update?.callback_query;

  // ?뱁썒?쇰줈 諛쏆? 遊??좏겙 ?뺤씤 (?붾젅洹몃옩? bot_token???ㅻ뜑??蹂대궡吏 ?딆쑝誘濡? 硫붿떆吏?먯꽌 遊??뺣낫 異붿텧)
  // ???誘몃━ ?깅줉??遊?紐⑸줉?먯꽌 留ㅼ묶
  let botToken = null;
  let botId = null;

  // 硫붿떆吏 ?먮뒗 肄쒕갚?먯꽌 遊??뺣낫 ?뺤씤
  const botUsername = message?.chat?.username || callbackQuery?.message?.chat?.username;

  // Supabase?먯꽌 ?쒖꽦?붾맂 紐⑤뱺 遊?議고쉶 (泥?踰덉㎏ ?붿껌 ??
  const { data: bots } = await supabase
    .from('chatbots')
    .select('id, bot_token, bot_username')
    .eq('is_active', true);

  if (!bots || bots.length === 0) {
    console.error('No active bots found');
    return res.status(200).json({ ok: true });
  }

  // ?꾩옱???⑤땲遊뉖쭔 ?덉쑝誘濡?泥?踰덉㎏ 遊??ъ슜 (?섏쨷??webhook URL濡?援щ텇 媛??
  // TODO: ?뱁썒 URL??/api/telegram/{bot_id} ?뺥깭濡?留뚮뱾?댁꽌 援щ텇
  const bot = bots[0];
  botToken = bot.bot_token;
  botId = bot.id;

  // 肄쒕갚 荑쇰━ 泥섎━ (踰꾪듉 ?대┃)
  if (callbackQuery) {
    const queryData = callbackQuery.data;
    const queryChatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    // 紐⑤뜽 ?좏깮 踰꾪듉 ?대┃
    if (queryData.startsWith('model:')) {
      const selectedModel = queryData.replace('model:', '');

      // Supabase???ъ슜???좏샇 紐⑤뜽 ???      const { data: existing } = await supabase
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
        'random': '?쒕뜡 (5媛?紐⑤뜽 以?'
      };

      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: `??${modelNames[selectedModel]} ?좏깮??
        })
      });

      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: queryChatId,
          message_id: messageId,
          text: `???좏깮??紐⑤뜽: ${modelNames[selectedModel]}\n\n?ㅼ떆 ?좏깮?섎젮硫?/model 紐낅졊?대? ?ъ슜?섏꽭??`
        })
      });

      return res.status(200).json({ ok: true });
    }
  }

  if (!message?.chat?.id) {
    return res.status(200).json({ ok: true });
  }

  const chatId = message.chat.id;

  // ?뚯꽦 硫붿떆吏 泥섎━
  if (message.voice) {
    if (!openaiKey) {
      await sendTelegram(botToken, chatId, '?좑툘 ?뚯꽦 ?몄떇 湲곕뒫???ㅼ젙?섏? ?딆븯?듬땲??\n?띿뒪?몃줈 蹂대궡二쇱꽭??');
      return res.status(200).json({ ok: true });
    }

    const voiceFileId = message.voice.file_id;
    try {
      await sendTelegram(botToken, chatId, '?렎 ?뚯꽦???몄떇?섍퀬 ?덉뒿?덈떎...');

      // 1. ?붾젅洹몃옩?먯꽌 ?뚯꽦 ?뚯씪 ?뺣낫 媛?몄삤湲?      const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${voiceFileId}`);
      const fileInfo = await fileInfoRes.json();

      if (!fileInfo.ok) {
        await sendTelegram(botToken, chatId, '?좑툘 ?뚯꽦 ?뚯씪??媛?몄삱 ???놁뒿?덈떎.');
        return res.status(200).json({ ok: true });
      }

      const filePath = fileInfo.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

      // 2. ?뚯꽦 ?뚯씪 ?ㅼ슫濡쒕뱶
      const audioRes = await fetch(fileUrl);
      const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

      // 3. OpenAI Whisper API濡??뚯꽦?믫뀓?ㅽ듃 蹂??      const formData = new FormData();
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
        await sendTelegram(botToken, chatId, '?좑툘 ?뚯꽦 ?몄떇???ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?쒕룄?댁＜?몄슂.');
        return res.status(200).json({ ok: true });
      }

      const transcription = await whisperRes.json();
      const userText = transcription.text;

      if (!userText || userText.trim() === '') {
        await sendTelegram(botToken, chatId, '?좑툘 ?뚯꽦???몄떇?섏? 紐삵뻽?듬땲?? ??紐낇솗?섍쾶 留먯??댁＜?몄슂.');
        return res.status(200).json({ ok: true });
      }

      // 4. ?몄떇???띿뒪???쒖떆
      await sendTelegram(botToken, chatId, `?렎 ?몄떇?? "${userText}"`);

      // 5. ?쇰컲 硫붿떆吏? ?숈씪?섍쾶 泥섎━
      return await processMessage(botId, chatId, userText, supabase, openrouterKey, openaiKey, botToken);

    } catch (error) {
      console.error('Voice processing error:', error);
      await sendTelegram(botToken, chatId, '?좑툘 ?뚯꽦 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
      return res.status(200).json({ ok: true });
    }
  }

  // ?띿뒪??硫붿떆吏
  if (!message.text) {
    return res.status(200).json({ ok: true });
  }

  const userText = message.text;

  // /start 紐낅졊??  if (userText === '/start') {
    await sendTelegram(botToken, chatId, '?덈뀞?섏꽭?? AI 梨쀫큸 ?⑤땲遊뉗엯?덈떎 ?쨼\n\n???띿뒪??硫붿떆吏 OK\n???뚯꽦 硫붿떆吏 OK (?먮룞 ?몄떇)\n?????留λ씫 湲곗뼲\n???명꽣??寃??OK\n\n紐낅졊??\n/search [寃?됱뼱] - ?명꽣??寃??n/model - AI 紐⑤뜽 ?좏깮\n/clear - ???湲곕줉 珥덇린??n/memory - 湲곗뼲????????뺤씤');
    return res.status(200).json({ ok: true });
  }

  // /model 紐낅졊??- 紐⑤뜽 ?좏깮 踰꾪듉
  if (userText === '/model') {
    await sendModelSelection(botToken, chatId);
    return res.status(200).json({ ok: true });
  }

  // /clear 紐낅졊??- ???湲곕줉 ??젣
  if (userText === '/clear') {
    await supabase.from('chatbot_memory').delete().eq('bot_id', botId).eq('chat_id', chatId);
    await sendTelegram(botToken, chatId, '?뿊截????湲곕줉??珥덇린?붾릺?덉뒿?덈떎. ?덈줈????붾? ?쒖옉?섏꽭??');
    return res.status(200).json({ ok: true });
  }

  // /memory 紐낅졊??- 湲곗뼲????????뺤씤
  if (userText === '/memory') {
    const { count } = await supabase
      .from('chatbot_memory')
      .select('*', { count: 'exact', head: true })
      .eq('bot_id', botId)
      .eq('chat_id', chatId);
    await sendTelegram(botToken, chatId, `?쭬 ?꾩옱 湲곗뼲????? ${count || 0}媛?硫붿떆吏`);
    return res.status(200).json({ ok: true });
  }

  // /search 紐낅졊??- ?명꽣??寃??(Perplexity 媛뺤젣 ?ъ슜)
  if (userText.startsWith('/search ')) {
    const searchQuery = userText.replace('/search ', '').trim();
    if (!searchQuery) {
      await sendTelegram(botToken, chatId, '?좑툘 寃?됱뼱瑜??낅젰?댁＜?몄슂.\n?? /search ?ㅻ뒛 ?좎뵪');
      return res.status(200).json({ ok: true });
    }
    await sendTelegram(botToken, chatId, '?뵇 ?명꽣??寃??以?..');
    return await processMessage(botId, chatId, searchQuery, supabase, openrouterKey, openaiKey, botToken, 'perplexity/sonar');
  }

  return await processMessage(botId, chatId, userText, supabase, openrouterKey, openaiKey, botToken);
}

async function processMessage(botId, chatId, userText, supabase, openrouterKey, openaiKey, botToken, forceModel = null) {
  try {
    // 1. ?ъ슜???좏샇 紐⑤뜽 ?뺤씤 (媛뺤젣 紐⑤뜽???놁쓣 ?뚮쭔)
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

    // 2. ?댁쟾 ???湲곕줉 遺덈윭?ㅺ린 (理쒓렐 20媛?
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

    // 3. 硫붿떆吏 援ъ꽦 (?쒖뒪??+ ?댁쟾???+ ??硫붿떆吏)
    const systemPrompt = forceModel === 'perplexity/sonar'
      ? '?뱀떊? ?명꽣??寃???꾨Ц AI?낅땲?? ?ъ슜??吏덈Ц?????理쒖떊 ?뺣낫瑜??명꽣?룹뿉??寃?됲븯???뺥솗?섍퀬 理쒖떊???뺣낫瑜??쒓났?섏꽭?? ??긽 ?쒓뎅?대줈 ?듬??섍퀬, 異쒖쿂媛 ?덈떎硫?媛꾨떒???멸툒?섏꽭??'
      : '?뱀떊? 移쒖젅???쒓뎅??AI ?댁떆?ㅽ꽩??"?⑤땲遊??낅땲?? ??긽 ?쒓뎅?대줈 ?듬??섏꽭?? ?붾젅洹몃옩 硫붿떊?濡???뷀븯怨??덉쑝誘濡?媛꾧껐?섍쾶 ?듬??섏꽭?? ?댁쟾 ???留λ씫??李멸퀬?섏뿬 ?먯뿰?ㅻ읇寃???붾? ?댁뼱媛?몄슂.';

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

    // 4. ?ъ슜??硫붿떆吏 ???    await supabase.from('chatbot_memory').insert({
      bot_id: botId,
      chat_id: chatId,
      role: 'user',
      content: userText
    });

    // 5. AI ?몄텧 (?좏샇 紐⑤뜽 ?먮뒗 ?대갚 ?ъ떆??
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

    // ?좏샇 紐⑤뜽???덉쑝硫??곗꽑 ?쒕룄, ?놁쑝硫??쒕뜡
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

        // 5. AI ?묐떟 ???        await supabase.from('chatbot_memory').insert({
          bot_id: botId,
          chat_id: chatId,
          role: 'assistant',
          content: responseText,
          model: tryModel
        });

        // 6. 寃?됱씤 寃쎌슦 search_history?먮룄 ???        if (forceModel === 'perplexity/sonar') {
          await supabase.from('chatbot_search_history').insert({
            bot_id: botId,
            chat_id: chatId,
            query: userText,
            result: responseText,
            model: tryModel
          });
        }

        const displayName = modelDisplayNames[tryModel] || tryModel;
        await sendTelegram(botToken, chatId, `?쨼 ${displayName}\n\n${responseText}`);
        replied = true;
        break;
      } catch (err) {
        console.error(`Telegram: Model ${tryModel} error:`, err.message);
        continue;
      }
    }

    if (!replied) {
      // ?ㅽ뙣 ????ν븳 ?ъ슜??硫붿떆吏 ??젣
      await supabase.from('chatbot_memory')
        .delete()
        .eq('bot_id', botId)
        .eq('chat_id', chatId)
        .eq('role', 'user')
        .eq('content', userText)
        .order('created_at', { ascending: false })
        .limit(1);
      await sendTelegram(botToken, chatId, '?좑툘 ?쇱떆?곸쑝濡??묐떟???앹꽦?????놁뒿?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄?댁＜?몄슂.');
    }

  } catch (error) {
    console.error('Telegram bot error:', error);
    await sendTelegram(botToken, chatId, '?좑툘 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄?댁＜?몄슂.');
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
      text: '?쨼 ?ъ슜??AI 紐⑤뜽???좏깮?섏꽭??',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '?뵶 GPT-4o', callback_data: 'model:openai/gpt-4o' },
            { text: '?뵷 Gemini 3 Pro', callback_data: 'model:google/gemini-3-pro-preview' }
          ],
          [
            { text: '?윢 Claude Sonnet 4.5', callback_data: 'model:anthropic/claude-sonnet-4.5' },
            { text: '?윟 Perplexity Sonar', callback_data: 'model:perplexity/sonar' }
          ],
          [
            { text: '??Free Model', callback_data: 'model:openrouter/free' },
            { text: '?렡 ?쒕뜡', callback_data: 'model:random' }
          ]
        ]
      }
    })
  });
}
