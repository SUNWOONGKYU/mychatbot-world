/**
 * @task S2FE2, S5F4
 * @description 채팅 창 컴포넌트 — Vanilla chat.js 기능 완전 전환
 *
 * Vanilla → React 전환 항목:
 * - 다크/라이트 테마 토글 (localStorage 동기)
 * - 페르소나 선택 칩 (avatar/helper 행 분리, chip-public/chip-private)
 * - 음성 선택 드롭다운 (6종)
 * - TTS 토글 + 음성 선택 연동
 * - STT 버튼 (VAD 미지원 → MediaRecorder fallback)
 * - 메시지 버블: user / bot / system 타입
 * - 타이핑 인디케이터 (3-dot bounce)
 * - 환영 화면 + FAQ 퀵 버튼
 * - CPC 바 (도우미 페르소나 전용, 소대 선택 + 자율모드 토글)
 * - SSE 스트리밍 응답 (1차) + /api/chat 폴백 (2차)
 * - Per-message TTS 버튼 (🔊)
 * - 모바일 visualViewport 키보드 fix
 * - 자동 높이 조절 textarea
 */

'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  KeyboardEvent,
} from 'react';

// ============================================================
// HTML Sanitizer (XSS 방지)
// ============================================================

/** 허용 태그/속성 목록 기반 간이 sanitize — DOMPurify 미설치 환경용 */
function sanitizeHtml(dirty: string): string {
  const ALLOWED_TAGS = ['a', 'b', 'i', 'em', 'strong', 'br', 'span', 'p', 'ul', 'ol', 'li', 'code', 'pre'];
  const ALLOWED_ATTRS = ['class', 'style', 'href'];
  // 서버사이드(SSR) 실행 방지
  if (typeof window === 'undefined') return '';
  const doc = new DOMParser().parseFromString(dirty, 'text/html');
  function clean(node: Element) {
    Array.from(node.children).forEach((child) => {
      if (!ALLOWED_TAGS.includes(child.tagName.toLowerCase())) {
        child.replaceWith(document.createTextNode(child.textContent ?? ''));
        return;
      }
      Array.from(child.attributes).forEach((attr) => {
        if (!ALLOWED_ATTRS.includes(attr.name.toLowerCase())) child.removeAttribute(attr.name);
      });
      clean(child);
    });
  }
  clean(doc.body);
  return doc.body.innerHTML;
}

// ============================================================
// 타입 정의
// ============================================================

export interface Persona {
  id: string;
  name: string;
  role?: string;
  model?: string;
  category?: string; // 'avatar' | 'helper' | undefined
  isVisible?: boolean;
  isPublic?: boolean;
  greeting?: string;
  faqs?: FaqItem[];
  userTitle?: string;
  cpcPlatoonId?: string; // 도우미 페르소나 전용
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface BotData {
  id: string;
  botName: string;
  username?: string;
  personality?: string;
  greeting?: string;
  tone?: string;
  voice?: string;
  faqs?: FaqItem[];
  personas: Persona[];
  ownerId?: string;
  dmPolicy?: string;
  allowedUsers?: string[];
  pairingCode?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  streaming?: boolean;
  ragSource?: 'wiki' | 'chunk' | 'none';
  isHtml?: boolean; // system 메시지 전용
  extraClass?: string; // e.g. 'cpc-result'
}

type Theme = 'dark' | 'light';

const VOICE_OPTIONS = [
  { value: 'fable', label: 'Fable - 부드러운' },
  { value: 'nova', label: 'Nova - 밝고 친근' },
  { value: 'shimmer', label: 'Shimmer - 따뜻한' },
  { value: 'alloy', label: 'Alloy - 중성 균형' },
  { value: 'echo', label: 'Echo - 차분한' },
  { value: 'onyx', label: 'Onyx - 깊고 낮은' },
];

// ============================================================
// 유틸리티
// ============================================================

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getDefaultUserTitle(persona: Persona | null): string {
  if (!persona) return '';
  if (persona.name === 'Claude Code') return '지휘관님';
  return persona.category === 'avatar' ? '고객님' : '님';
}

function cpcIsHelper(persona: Persona | null): boolean {
  if (!persona) return false;
  return (
    persona.name === 'Claude Code' ||
    persona.name === 'Trader' ||
    persona.category === 'helper' ||
    (persona.isPublic === false && persona.category !== 'avatar')
  );
}

// ============================================================
// 훅: 테마
// ============================================================

function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('mcw_theme') as Theme) || 'dark';
    setTheme(saved);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mcw_theme', next);
      return next;
    });
  }, []);

  return { theme, toggle };
}

// ============================================================
// 훅: TTS
// ============================================================

function useTTS(voice: string) {
  const [enabled, setEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fallbackPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fallbackPlayerRef.current = new Audio();
  }, []);

  const unlockAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
    } catch { /* ignore */ }
  }, []);

  const stopCurrent = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch { /* ignore */ }
      audioSourceRef.current = null;
    }
    if (fallbackPlayerRef.current) {
      fallbackPlayerRef.current.pause();
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!enabled || !text) return;
    const clean = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().slice(0, 4096);
    if (!clean) return;

    stopCurrent();

    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch { /* ignore */ }
    }

    // 1차: /api/tts → AudioContext
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice }),
      });
      if (!res.ok) throw new Error('TTS API ' + res.status);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('audio')) throw new Error('Not audio');

      const arrayBuf = await res.arrayBuffer();
      if (!audioCtxRef.current) throw new Error('No AudioContext');
      const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuf);

      if (!enabled) return;
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtxRef.current.destination);
      source.start(0);
      audioSourceRef.current = source;
      return;
    } catch { /* fallback */ }

    // 2차: SpeechSynthesis
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = 'ko-KR';
        window.speechSynthesis.speak(u);
        return;
      } catch { /* ignore */ }
    }

    // 3차: Google Translate TTS
    if (fallbackPlayerRef.current) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(clean)}`;
      fallbackPlayerRef.current.src = url;
      void fallbackPlayerRef.current.play().catch(() => { /* ignore */ });
    }
  }, [enabled, voice, stopCurrent]);

  const toggle = useCallback(() => {
    setEnabled((v) => {
      if (v) stopCurrent();
      return !v;
    });
  }, [stopCurrent]);

  return { enabled, toggle, speak, stopCurrent, unlockAudio };
}

// ============================================================
// 훅: STT (MediaRecorder, 폴백: 4초 무음 타이머)
// ============================================================

function useSTT(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        if (blob.size < 5000) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await fetch('/api/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64, language: 'ko' }),
            });
            if (res.ok) {
              const data = (await res.json()) as { text?: string };
              if (data.text?.trim()) onTranscript(data.text.trim());
            }
          } catch { /* ignore */ }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        alert('마이크 접근 권한이 없습니다. 브라우저 설정에서 마이크를 허용해주세요.');
      }
      setIsRecording(false);
    }
  }, [onTranscript]);

  const toggle = useCallback(() => {
    if (isRecording) {
      stop();
    } else {
      void start();
    }
  }, [isRecording, start, stop]);

  return { isRecording, toggle };
}

// ============================================================
// Props
// ============================================================

interface ChatWindowProps {
  botData: BotData;
  botId: string;
  /** 대화 ID (선택) */
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function ChatWindow({
  botData,
  botId,
  conversationId = '',
  onConversationCreated,
}: ChatWindowProps) {
  // ── 테마 ──────────────────────────────────────────────────
  const { theme, toggle: toggleTheme } = useTheme();

  // ── 페르소나 ───────────────────────────────────────────────
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(
    () => botData.personas?.[0] ?? null
  );

  // ── 음성 ───────────────────────────────────────────────────
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('mcw_tts_voice') || botData.voice || 'fable';
  });

  const handleVoiceChange = useCallback((v: string) => {
    setSelectedVoice(v);
    localStorage.setItem('mcw_tts_voice', v);
  }, []);

  // ── TTS ────────────────────────────────────────────────────
  const { enabled: ttsEnabled, toggle: toggleTts, speak, unlockAudio } = useTTS(selectedVoice);

  // ── STT ────────────────────────────────────────────────────
  const handleTranscript = useCallback((text: string) => {
    setInputText((prev) => (prev ? `${prev} ${text}` : text));
  }, []);
  const { isRecording, toggle: toggleStt } = useSTT(handleTranscript);

  // ── 메시지 상태 ────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // ── 입력 ───────────────────────────────────────────────────
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef<string>(conversationId);

  // ── CPC 바 ─────────────────────────────────────────────────
  const [cpcVisible, setCpcVisible] = useState(false);
  const [cpcPlatoons, setCpcPlatoons] = useState<Array<{ id: string; name: string; status?: string }>>([]);
  const [cpcSelectedId, setCpcSelectedId] = useState<string>(
    () => localStorage.getItem('cpc_selected_platoon') || 'mychatbot-1'
  );
  const [cpcStatus, setCpcStatus] = useState<string>('');
  const [autonomousMode, setAutonomousMode] = useState(false);

  // ── 히스토리 ───────────────────────────────────────────────
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);

  // conversationId 동기화
  useEffect(() => {
    convIdRef.current = conversationId;
  }, [conversationId]);

  // ── 자동 스크롤 ────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── 모바일 키보드 visualViewport fix ────────────────────────
  useEffect(() => {
    if (!window.visualViewport) return;
    const initialHeight = window.visualViewport.height;

    function onViewportChange() {
      const vvHeight = window.visualViewport!.height;
      const keyboardOpen = initialHeight - vvHeight > 100;
      if (keyboardOpen) {
        document.documentElement.style.setProperty('--chat-vh', vvHeight + 'px');
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      } else {
        document.documentElement.style.removeProperty('--chat-vh');
      }
    }

    window.visualViewport.addEventListener('resize', onViewportChange);
    return () => window.visualViewport!.removeEventListener('resize', onViewportChange);
  }, []);

  // ── 초기 시스템 메시지 ─────────────────────────────────────
  useEffect(() => {
    setTimeout(() => {
      addMessage({ role: 'system', content: '대화할 준비가 되었습니다.' });
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── CPC 소대 목록 로드 ─────────────────────────────────────
  const loadCpcPlatoons = useCallback(async () => {
    try {
      const res = await fetch('/api/platoons');
      if (!res.ok) return;
      const data = (await res.json()) as Array<{ id: string; name: string; status?: string }>;
      setCpcPlatoons(data);
    } catch { /* ignore */ }
  }, []);

  // ── 페르소나 전환 ──────────────────────────────────────────
  const switchPersona = useCallback((id: string) => {
    const newPersona = botData.personas?.find((p) => String(p.id) === String(id));
    if (!newPersona || currentPersona?.id === newPersona.id) return;

    setCurrentPersona(newPersona);
    historyRef.current = [];
    setShowWelcome(false);

    addMessage({
      role: 'system',
      content: `✅ <strong>${escapeHtml(newPersona.name)}</strong> 역할로 전환되었습니다.<br><span style="font-size:0.7em;opacity:0.7;">${escapeHtml(newPersona.role || '')} | ${escapeHtml((newPersona.model || 'MODEL').toUpperCase())}</span>`,
      isHtml: true,
    });

    if (ttsEnabled) {
      void speak(`지금부터 ${newPersona.name} 역할로 도와드릴게요.`);
    }

    // CPC 바 표시/숨김
    if (cpcIsHelper(newPersona)) {
      setCpcVisible(true);
      void loadCpcPlatoons();
    } else {
      setCpcVisible(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botData.personas, currentPersona, ttsEnabled, speak, loadCpcPlatoons]);

  // ── 페르소나 초기화 시 CPC 바 ──────────────────────────────
  useEffect(() => {
    if (currentPersona && cpcIsHelper(currentPersona)) {
      setCpcVisible(true);
      void loadCpcPlatoons();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 메시지 추가 헬퍼 ───────────────────────────────────────
  function addMessage(msg: Omit<ChatMessage, 'id'>): ChatMessage {
    const full: ChatMessage = { id: uid(), ...msg };
    setMessages((prev) => [...prev, full]);
    return full;
  }

  // ── FAQ 전송 ───────────────────────────────────────────────
  const askFaq = useCallback((q: string, a: string) => {
    unlockAudio();
    setShowWelcome(false);
    addMessage({ role: 'user', content: q });
    setTimeout(() => {
      addMessage({ role: 'bot', content: a });
      if (ttsEnabled) void speak(a);
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsEnabled, speak, unlockAudio]);

  // ── CPC 소대장 직결 ────────────────────────────────────────
  const sendToCpc = useCallback(async (text: string): Promise<boolean> => {
    if (!cpcSelectedId) return false;
    try {
      const res = await fetch(`/api/platoons/${encodeURIComponent(cpcSelectedId)}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: 'chatbot' }),
      });
      if (!res.ok) return false;
      const cmd = (await res.json()) as { id: string };
      const cmdId = cmd.id;

      addMessage({
        role: 'system',
        content: `[소대장] ${escapeHtml(cpcSelectedId)} 에게 전달 완료 · 응답 대기 중...`,
      });

      // 폴링: 결과 대기 (최대 120초)
      const POLL_INTERVAL = 3000;
      const MAX_POLL = 40;
      let pollCount = 0;

      const poll = async () => {
        if (pollCount >= MAX_POLL) {
          addMessage({ role: 'system', content: '[CPC] 응답 시간 초과. 소대장이 처리 중일 수 있습니다.' });
          return;
        }
        pollCount++;
        try {
          const r = await fetch(`/api/platoons/${encodeURIComponent(cpcSelectedId)}/commands?status=DONE`);
          if (r.ok) {
            const cmds = (await r.json()) as Array<{ id: string; result?: string; status?: string }>;
            const done = cmds.find((c) => c.id === cmdId);
            if (done?.result) {
              addMessage({
                role: 'system',
                content: done.result,
                extraClass: 'cpc-result',
              });
              return;
            }
          }
        } catch { /* ignore */ }
        setTimeout(() => void poll(), POLL_INTERVAL);
      };
      setTimeout(() => void poll(), POLL_INTERVAL);
      return true;
    } catch {
      addMessage({ role: 'system', content: '[CPC] 소대장 전달 실패. 다시 시도해주세요.' });
      return false;
    }
  }, [cpcSelectedId]);

  // ── 메시지 전송 ────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    unlockAudio();
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setShowWelcome(false);
    setIsSending(true);

    addMessage({ role: 'user', content: text });
    historyRef.current.push({ role: 'user', content: text });

    // CPC 직결 모드
    if (cpcVisible && cpcSelectedId) {
      setIsSending(false);
      await sendToCpc(text);
      return;
    }

    // 타이핑 인디케이터
    const typingId = uid();
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: 'bot', content: '', streaming: true },
    ]);

    const payload = {
      message: text,
      botId,
      botConfig: {
        botName: botData.botName,
        personality: currentPersona?.role || botData.personality,
        tone: botData.tone || '',
        faqs: (currentPersona?.faqs?.length ? currentPersona.faqs : botData.faqs) || [],
        personaName: currentPersona?.name,
        personaCategory: currentPersona?.category,
        userTitle: currentPersona?.userTitle || getDefaultUserTitle(currentPersona),
        personaId: currentPersona?.id,
        ownerId: botData.ownerId,
      },
      history: historyRef.current.slice(-10),
      emotionLevel: 50,
      conversationId: convIdRef.current || undefined,
    };

    const safetyTimer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, content: '[네트워크 지연] 응답이 늦어지고 있습니다. 잠시 후 다시 시도해주세요.', streaming: false }
            : m
        )
      );
      setIsSending(false);
    }, 15000);

    // 1차: SSE 스트리밍
    try {
      const streamRes = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 402: 크레딧 부족
      if (streamRes.status === 402) {
        clearTimeout(safetyTimer);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === typingId
              ? {
                  ...m,
                  content:
                    '💳 크레딧 잔액이 부족합니다. <a href="/home?tab=credits" class="underline text-blue-400">충전하기 →</a>',
                  streaming: false,
                  isHtml: true,
                }
              : m
          )
        );
        setIsSending(false);
        inputRef.current?.focus();
        return;
      }


      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        // 타이핑 인디케이터를 스트리밍 버블로 교체
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') continue;
              try {
                const parsed = JSON.parse(raw) as { text?: string; conversationId?: string };
                if (parsed.text) {
                  fullText += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === typingId
                        ? { ...m, content: fullText, streaming: true }
                        : m
                    )
                  );
                }
                if (parsed.conversationId && !convIdRef.current) {
                  convIdRef.current = parsed.conversationId;
                  onConversationCreated?.(parsed.conversationId);
                }
              } catch { /* skip */ }
            }
          }
        }

        if (fullText) {
          clearTimeout(safetyTimer);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === typingId ? { ...m, content: fullText, streaming: false } : m
            )
          );
          historyRef.current.push({ role: 'assistant', content: fullText });
          if (ttsEnabled) void speak(fullText);
          setIsSending(false);
          inputRef.current?.focus();
          return;
        }
        // 빈 응답 → 폴백
        setMessages((prev) => prev.filter((m) => m.id !== typingId));
      }
    } catch { /* fallback */ }

    // 2차: /api/chat 폴백
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 402) {
        clearTimeout(safetyTimer);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === typingId
              ? {
                  ...m,
                  content:
                    '💳 크레딧 잔액이 부족합니다. <a href="/home?tab=credits" class="underline text-blue-400">충전하기 →</a>',
                  streaming: false,
                  isHtml: true,
                }
              : m
          )
        );
        setIsSending(false);
        inputRef.current?.focus();
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { reply?: string };
        if (data.reply) {
          clearTimeout(safetyTimer);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === typingId ? { ...m, content: data.reply!, streaming: false } : m
            )
          );
          historyRef.current.push({ role: 'assistant', content: data.reply });
          if (ttsEnabled) void speak(data.reply);
          setIsSending(false);
          inputRef.current?.focus();
          return;
        }
      }
    } catch { /* ignore */ }

    clearTimeout(safetyTimer);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === typingId
          ? { ...m, content: '죄송합니다. 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', streaming: false }
          : m
      )
    );
    setIsSending(false);
    inputRef.current?.focus();
  }, [
    inputText, isSending, botId, botData, currentPersona,
    cpcVisible, cpcSelectedId, sendToCpc,
    ttsEnabled, speak, unlockAudio, onConversationCreated,
  ]);

  // ── Enter 키 전송 ──────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  // ── 자동 높이 조절 ─────────────────────────────────────────
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  // ── 페르소나 목록 필터 ─────────────────────────────────────
  const visiblePersonas = (botData.personas || []).filter((p) => p.isVisible !== false);
  const avatarPersonas = visiblePersonas.filter((p) => p.category === 'avatar');
  const helperPersonas = visiblePersonas.filter((p) => p.category !== 'avatar');
  const hasMultiplePersonas = visiblePersonas.length > 1;

  // ── FAQ 목록 ───────────────────────────────────────────────
  const faqs = (currentPersona?.faqs?.length ? currentPersona.faqs : botData.faqs) || [];

  // ── 환영 제목/설명 ─────────────────────────────────────────
  const welcomeTitle = hasMultiplePersonas ? botData.botName : (currentPersona?.name || botData.botName);
  const welcomeDesc = hasMultiplePersonas
    ? (botData.greeting || '페르소나를 선택해주세요!')
    : (currentPersona?.greeting || currentPersona?.role || botData.greeting || '');

  // ── isDark ─────────────────────────────────────────────────
  const isDark = theme === 'dark';

  // ============================================================
  // 렌더
  // ============================================================
  return (
    <div
      className={`chat-body-react flex flex-col overflow-hidden`}
      style={{
        height: 'var(--chat-vh, 100dvh)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        background: 'rgb(var(--bg-base))',
      }}
    >
      {/* ── 헤더 ────────────────────────────────────────────── */}
      <header
        className="flex flex-col z-10 flex-shrink-0"
        style={{
          padding: '12px 16px',
          gap: 6,
          background: 'rgb(var(--bg-muted) / 0.95)',
          borderBottom: '1px solid rgb(var(--border))',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* 1줄: 봇 이름 + 헤더 버튼 */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <h1
                className="font-bold truncate"
                style={{
                  color: 'rgb(var(--text-primary))',
                  fontSize: '1rem',
                }}
              >
                {botData.botName}
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: '#22c55e',
                }}
              >
                ● 온라인
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* 음성 선택 */}
            <select
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              title="음성 선택"
              style={{
                height: 30,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: 12,
                color: isDark ? 'rgba(255,255,255,0.8)' : '#333',
                fontSize: '0.7rem',
                padding: '0 6px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.value} value={v.value} style={{ background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#333' }}>
                  {v.label}
                </option>
              ))}
            </select>

            {/* TTS 토글 */}
            <HeaderBtn
              onClick={toggleTts}
              title={ttsEnabled ? '음성 출력 ON' : '음성 출력 OFF'}
              isDark={isDark}
            >
              {ttsEnabled ? '🔊' : '🔇'}
            </HeaderBtn>

            {/* 홈 버튼 */}
            <HeaderBtn
              onClick={() => { window.location.href = '/'; }}
              title="홈으로"
              isDark={isDark}
            >
              🏠
            </HeaderBtn>

            {/* 테마 토글 */}
            <HeaderBtn
              onClick={toggleTheme}
              title="다크/라이트 모드"
              isDark={isDark}
            >
              {isDark ? '☀️' : '🌙'}
            </HeaderBtn>
          </div>
        </div>

        {/* 2~3줄: 페르소나 선택 칩 */}
        {hasMultiplePersonas && (
          <div className="flex flex-col gap-1 w-full" style={{ paddingBottom: 4 }}>
            {/* 대외용 (avatar) */}
            {avatarPersonas.length > 0 && (
              <div className="flex gap-1 w-full">
                {avatarPersonas.map((p) => (
                  <PersonaChip
                    key={p.id}
                    persona={p}
                    isActive={currentPersona?.id === p.id}
                    type="public"
                    onClick={switchPersona}
                  />
                ))}
              </div>
            )}
            {/* 대내용 (helper) */}
            {helperPersonas.length > 0 && (
              <div className="flex gap-1 w-full">
                {helperPersonas.map((p) => (
                  <PersonaChip
                    key={p.id}
                    persona={p}
                    isActive={currentPersona?.id === p.id}
                    type="private"
                    onClick={switchPersona}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── 메시지 영역 ─────────────────────────────────────── */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto flex flex-col gap-3"
        style={{
          padding: '12px 16px 16px',
          minHeight: 0,
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
        }}
      >
        {/* 환영 화면 */}
        {showWelcome && (
          <div className="text-center" style={{ padding: '12px 16px' }}>
            <h2 style={{ color: isDark ? 'white' : '#1a1a2e', marginBottom: 8 }}>
              {welcomeTitle}
            </h2>
            <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: '0.875rem' }}>
              {welcomeDesc}
            </p>
          </div>
        )}

        {/* FAQ 퀵 버튼 */}
        {showWelcome && faqs.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center" style={{ padding: '0 16px' }}>
            {faqs.map((f, i) => (
              <button
                key={i}
                onClick={() => askFaq(f.q, f.a)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9999,
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: isDark ? '#a5b4fc' : '#4f46e5',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  maxWidth: 200,
                  textAlign: 'center',
                  transition: 'all 150ms',
                }}
              >
                {f.q}
              </button>
            ))}
          </div>
        )}

        {/* 메시지 목록 */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isDark={isDark}
            ttsEnabled={ttsEnabled}
            selectedVoice={selectedVoice}
          />
        ))}
      </main>

      {/* ── CPC 바 (도우미 페르소나 전용) ──────────────────── */}
      {cpcVisible && (
        <div
          className="flex-shrink-0"
          style={{
            padding: '4px 12px',
            background: 'rgba(16,185,129,0.08)',
            borderTop: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.05em', flexShrink: 0 }}>
              CPC
            </span>
            <select
              value={cpcSelectedId}
              onChange={(e) => {
                const id = e.target.value;
                setCpcSelectedId(id);
                localStorage.setItem('cpc_selected_platoon', id);
              }}
              style={{
                flex: 1,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 4,
                color: isDark ? 'rgba(255,255,255,0.85)' : '#1a1a2e',
                fontSize: '0.8rem',
                padding: '3px 6px',
                height: 28,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">소대 선택...</option>
              {cpcPlatoons.map((p) => (
                <option key={p.id} value={p.id} style={{ background: isDark ? '#1e293b' : '#fff' }}>
                  {p.name || p.id} {p.status ? `(${p.status})` : ''}
                </option>
              ))}
            </select>
            {cpcStatus && (
              <span style={{ fontSize: '0.65rem', color: '#10b981', flexShrink: 0, fontWeight: 600 }}>
                {cpcStatus}
              </span>
            )}
            <button
              onClick={() => {
                setAutonomousMode((v) => !v);
                setCpcStatus(autonomousMode ? '' : '자율모드 ON');
              }}
              title={autonomousMode ? '자율모드 ON' : '자율모드 OFF'}
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                border: autonomousMode ? '1px solid #e04040' : '1px solid rgba(160,160,160,0.3)',
                background: autonomousMode ? 'rgba(220,40,40,0.15)' : 'transparent',
                color: autonomousMode ? '#e04040' : '#999',
                fontSize: '1.05rem',
                cursor: 'pointer',
                marginLeft: 'auto',
                transition: 'all 0.2s',
              }}
            >
              {autonomousMode ? '♥' : '♡'}
            </button>
          </div>
        </div>
      )}

      {/* ── 입력 영역 ────────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'rgb(var(--bg-muted) / 0.95)',
          borderTop: '1px solid rgb(var(--border))',
          zIndex: 20,
        }}
      >
        <div
          className="flex items-end gap-2"
          style={{
            background: 'rgb(var(--bg-surface))',
            border: '1.5px solid rgb(var(--border))',
            borderRadius: 24,
            padding: '4px 8px',
          }}
        >
          {/* STT (음성 입력) 버튼 */}
          <button
            onClick={() => { unlockAudio(); toggleStt(); }}
            title="음성 입력"
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: isRecording ? 'rgba(239,68,68,0.2)' : 'transparent',
              fontSize: '1.2rem',
              cursor: 'pointer',
              animation: isRecording ? 'pulse-record 1.5s infinite' : undefined,
            }}
          >
            🎙️
          </button>

          {/* 텍스트 입력 */}
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? '음성 입력 중...' : '메시지를 입력하세요...'}
            rows={1}
            disabled={isSending}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'rgb(var(--text-primary))',
              fontSize: 16, // iOS 자동 줌 방지
              padding: '8px 0',
              resize: 'none',
              maxHeight: 120,
              minHeight: 40,
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
            onFocus={() => {
              setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }, 350);
            }}
          />

          {/* 전송 버튼 */}
          <button
            onClick={() => { unlockAudio(); void sendMessage(); }}
            disabled={isSending || !inputText.trim()}
            title="전송"
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: isSending || !inputText.trim() ? 'rgb(var(--color-primary) / 0.3)' : 'rgb(var(--color-primary))',
              color: 'white',
              cursor: isSending || !inputText.trim() ? 'default' : 'pointer',
              transition: 'background 150ms',
            }}
          >
            {isSending ? (
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 애니메이션 keyframes */}
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-record {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        @keyframes pulse-speaker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 헤더 버튼
// ============================================================

function HeaderBtn({
  onClick,
  title,
  isDark,
  children,
}: {
  onClick: () => void;
  title?: string;
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center"
      style={{
        width: 30,
        height: 30,
        minWidth: 44,
        minHeight: 44,
        borderRadius: 12,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        border: 'none',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'background 150ms',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      } as React.CSSProperties}
    >
      {children}
    </button>
  );
}

// ============================================================
// 서브 컴포넌트: 페르소나 칩
// ============================================================

function PersonaChip({
  persona,
  isActive,
  type,
  onClick,
}: {
  persona: Persona;
  isActive: boolean;
  type: 'public' | 'private';
  onClick: (id: string) => void;
}) {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 4px',
    borderRadius: 9999,
    fontSize: '0.72rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flex: '1 1 0',
    minWidth: 0,
    textAlign: 'center',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    minHeight: 44,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    fontWeight: 600,
    border: '1px solid',
  };

  let style: React.CSSProperties;
  if (isActive) {
    style = {
      ...baseStyle,
      background: type === 'public' ? 'rgb(var(--color-primary))' : 'rgb(var(--color-success))',
      borderColor: type === 'public' ? 'rgb(var(--color-primary-hover))' : 'rgb(var(--color-success))',
      color: 'white',
      boxShadow: type === 'public'
        ? 'var(--shadow-primary-glow)'
        : '0 4px 12px rgb(var(--color-success) / 0.3)',
    };
  } else if (type === 'public') {
    style = {
      ...baseStyle,
      background: 'rgb(var(--color-primary) / 0.12)',
      borderColor: 'rgb(var(--color-primary) / 0.25)',
      color: 'rgb(var(--color-primary))',
    };
  } else {
    style = {
      ...baseStyle,
      background: 'rgb(var(--color-success) / 0.1)',
      borderColor: 'rgb(var(--color-success) / 0.2)',
      color: 'rgb(var(--color-success))',
    };
  }

  return (
    <button style={style} onClick={() => onClick(persona.id)}>
      {persona.name}
    </button>
  );
}

// ============================================================
// 서브 컴포넌트: 메시지 버블
// ============================================================

function MessageBubble({
  msg,
  isDark,
  ttsEnabled: _ttsEnabled,
  selectedVoice,
}: {
  msg: ChatMessage;
  isDark: boolean;
  ttsEnabled: boolean;
  selectedVoice: string;
}) {
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playMsgTts = useCallback(async () => {
    if (!msg.content) return;
    const clean = msg.content.replace(/<[^>]*>/g, '').trim().slice(0, 4096);
    if (!clean) return;

    if (ttsPlaying) {
      audioRef.current?.pause();
      setTtsPlaying(false);
      return;
    }

    setTtsPlaying(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice: selectedVoice }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setTtsPlaying(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setTtsPlaying(false); URL.revokeObjectURL(url); };
      void audio.play();
    } catch {
      // SpeechSynthesis fallback
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(clean);
          u.lang = 'ko-KR';
          u.onend = () => setTtsPlaying(false);
          window.speechSynthesis.speak(u);
          return;
        } catch { /* ignore */ }
      }
      setTtsPlaying(false);
    }
  }, [msg.content, selectedVoice, ttsPlaying]);

  // system 메시지
  if (msg.role === 'system') {
    return (
      <div
        className="flex justify-center"
        style={{ animation: 'slideUp 0.3s ease', maxWidth: '90%', margin: '0 auto' }}
      >
        <div
          style={{
            background: msg.extraClass === 'cpc-result'
              ? 'rgba(56,189,248,0.08)'
              : 'transparent',
            color: msg.extraClass === 'cpc-result'
              ? '#7dd3fc'
              : isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.4)',
            fontSize: msg.extraClass === 'cpc-result' ? '0.82rem' : '0.78rem',
            textAlign: 'center',
            padding: msg.extraClass === 'cpc-result' ? '6px 12px' : '8px',
            borderRadius: 8,
          }}
          // system 메시지는 내부 HTML 허용 (XSS: 서버에서 온 것 아님, 클라이언트 생성)
          dangerouslySetInnerHTML={msg.isHtml ? { __html: sanitizeHtml(msg.content) } : undefined}
        >
          {!msg.isHtml && msg.content}
        </div>
      </div>
    );
  }

  // 타이핑 인디케이터 (streaming + 내용 없음)
  if (msg.role === 'bot' && msg.streaming && !msg.content) {
    return (
      <div className="flex gap-2" style={{ maxWidth: '85%', alignSelf: 'flex-start', animation: 'slideUp 0.3s ease' }}>
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)', fontSize: '0.9rem' }}
        >
          🤖
        </div>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 16,
            borderBottomLeftRadius: 6,
            background: 'rgb(var(--chat-bot-bg))',
            display: 'flex',
            gap: 4,
          }}
        >
          {[0, 0.2, 0.4].map((delay, i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgb(var(--text-muted))',
                display: 'inline-block',
                animation: `typingBounce 1.4s ${delay}s infinite ease-in-out`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // user / bot 버블
  const isUser = msg.role === 'user';
  return (
    <div
      className="flex gap-2"
      style={{
        maxWidth: '85%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
        animation: 'slideUp 0.3s ease',
      }}
    >
      {/* 아바타 */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isUser
            ? 'linear-gradient(135deg, rgb(var(--primary-300)), rgb(var(--primary-500)))'
            : 'var(--gradient-primary)',
          fontSize: '0.9rem',
        }}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* 버블 */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 6 : 16,
          borderBottomLeftRadius: isUser ? 16 : 6,
          background: isUser
            ? 'rgb(var(--chat-user-bg))'
            : 'rgb(var(--chat-bot-bg))',
          color: isUser
            ? 'rgb(var(--chat-user-text))'
            : 'rgb(var(--chat-bot-text))',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          maxWidth: '100%',
          wordBreak: 'break-word',
        }}
      >
        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>

        {/* 스트리밍 커서 */}
        {msg.streaming && (
          <span style={{ color: 'rgb(var(--text-muted))', animation: 'typingBounce 1.4s infinite' }}>▌</span>
        )}

        {/* Per-message TTS 버튼 (봇 메시지만) */}
        {!isUser && !msg.streaming && (
          <button
            onClick={() => void playMsgTts()}
            title="이 메시지 읽기"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              opacity: ttsPlaying ? 1 : 0.4,
              padding: '2px 4px',
              marginLeft: 4,
              verticalAlign: 'middle',
              transition: 'opacity 0.2s',
              animation: ttsPlaying ? 'pulse-speaker 1s infinite' : undefined,
              color: 'rgb(var(--text-secondary))',
            } as React.CSSProperties}
          >
            🔊
          </button>
        )}

        {/* Wiki 소스 배지 (S5F4) */}
        {!isUser && !msg.streaming && msg.ragSource && msg.ragSource !== 'none' && (
          <div style={{ marginTop: 6 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: '0.625rem',
                fontWeight: 500,
                background: msg.ragSource === 'wiki' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                color: msg.ragSource === 'wiki' ? '#059669' : '#2563eb',
              }}
            >
              {msg.ragSource === 'wiki' ? 'Wiki 기반' : 'KB 기반'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
