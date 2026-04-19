/**
 * Channel Adapter - Abstract Layer for Multi-Channel Support
 *
 * Provides a unified interface for sending/receiving messages
 * across different channels (webchat, Telegram, Kakao, etc.)
 *
 * Integration plan:
 *  - chat.js addMessage() → WebChatAdapter.send()
 *  - telegram.js sendMessage → TelegramAdapter.send()
 *  - New channels: implement ChannelAdapter subclass + register with ChannelManager
 */

class ChannelAdapter {
  constructor(name) {
    this.name = name;
    this._connected = false;
  }

  async send(target, text, media) {
    throw new Error('send() not implemented for ' + this.name);
  }

  async onMessage(handler) {
    throw new Error('onMessage() not implemented for ' + this.name);
  }

  getStatus() {
    return this._connected ? 'connected' : 'disconnected';
  }

  disconnect() {
    this._connected = false;
  }
}

/**
 * WebChat Adapter — default browser-based chat
 * Wraps the existing addMessage() / DOM interaction
 */
class WebChatAdapter extends ChannelAdapter {
  constructor() {
    super('webchat');
    this._connected = true;
    this._messageHandler = null;
  }

  async send(target, text, media) {
    if (typeof addMessage === 'function') {
      addMessage('bot', text);
    }
    return { sent: true, channel: 'webchat' };
  }

  async onMessage(handler) {
    this._messageHandler = handler;
  }

  // Called by sendMessage() to relay user input
  relayUserMessage(text) {
    if (this._messageHandler) {
      this._messageHandler({ text, channel: 'webchat', timestamp: new Date().toISOString() });
    }
  }
}

/**
 * Telegram Adapter — Telegram Bot API
 */
class TelegramAdapter extends ChannelAdapter {
  constructor(botToken) {
    super('telegram');
    this._token = botToken;
    this._connected = !!botToken;
  }

  async send(chatId, text, media) {
    if (!this._token) return { sent: false, error: 'No bot token' };

    const payload = { chat_id: chatId, text };
    if (media && media.parseMode) payload.parse_mode = media.parseMode;

    try {
      const resp = await fetch(`https://api.telegram.org/bot${this._token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      return { sent: data.ok, messageId: data.result?.message_id };
    } catch (e) {
      return { sent: false, error: e.message };
    }
  }

  async onMessage(handler) {
    // Telegram uses webhooks — handler would be registered server-side
    console.log('[TelegramAdapter] Use webhook for incoming messages');
  }
}

/**
 * Channel Manager — registry for all active adapters
 */
class ChannelManager {
  constructor() {
    this._adapters = {};
  }

  register(adapter) {
    this._adapters[adapter.name] = adapter;
    return this;
  }

  get(name) {
    return this._adapters[name] || null;
  }

  getAll() {
    return { ...this._adapters };
  }

  async broadcast(text, media) {
    const results = {};
    for (const [name, adapter] of Object.entries(this._adapters)) {
      try {
        results[name] = await adapter.send(null, text, media);
      } catch (e) {
        results[name] = { sent: false, error: e.message };
      }
    }
    return results;
  }
}

// Export globally
window.ChannelAdapter = ChannelAdapter;
window.WebChatAdapter = WebChatAdapter;
window.TelegramAdapter = TelegramAdapter;
window.ChannelManager = ChannelManager;

// Register default webchat adapter with CoCoBot
if (typeof CoCoBot !== 'undefined') {
  CoCoBot.channels = new ChannelManager();
  CoCoBot.channels.register(new WebChatAdapter());
}
