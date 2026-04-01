/**
 * @task S2FE2
 * @description 채팅 창 컴포넌트
 *
 * 기능:
 * - 메시지 버블 UI (user: 우측, bot: 좌측)
 * - 스크롤 자동 하단 이동
 * - 텍스트 입력 + 전송 버튼 + STT 버튼
 * - SSE 스트리밍 응답 표시 (fetch + ReadableStream)
 * - /api/chat/stream 엔드포인트 사용
 * - TTS/STT 토글 컨트롤
 */

'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  KeyboardEvent,
} from 'react';

// ============================
// 타입 정의
// ============================

/** 단일 채팅 메시지 */
interface ChatMessage {
  /** 고유 ID (클라이언트 생성) */
  id: string;
  /** 발신자 역할 */
  role: 'user' | 'bot';
  /** 메시지 내용 */
  content: string;
  /** 스트리밍 중 여부 */
  streaming?: boolean;
}

/** SSE model_selected 이벤트 데이터 */
interface ModelSelectedData {
  modelId: string;
  modelName: string;
  emotionTier: string;
  conversationId: string;
}

/** SSE content 이벤트 데이터 */
interface ContentData {
  text: string;
}

/** SSE done 이벤트 데이터 */
interface DoneData {
  messageId: string;
}

/** SSE error 이벤트 데이터 */
interface ErrorData {
  error: string;
}

// ============================
// Props
// ============================

interface ChatWindowProps {
  /** 봇 ID */
  botId: string;
  /** 봇 표시 이름 */
  botName: string;
  /** 감성 슬라이더 값 (1~100) */
  emotionLevel: number;
  /** 기존 대화 ID (없으면 서버에서 신규 생성) */
  conversationId: string;
  /** 서버에서 새 conversationId 생성 시 콜백 */
  onConversationCreated: (conversationId: string) => void;
}

// ============================
// 유틸리티
// ============================

/** 유니크 ID 생성 */
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** SSE 텍스트 라인 파싱 → { event, data } */
function parseSSELine(line: string): { event: string; data: string } | null {
  if (line.startsWith('event:')) {
    return null; // event 라인은 별도 처리
  }
  if (line.startsWith('data:')) {
    return { event: '', data: line.slice(5).trim() };
  }
  return null;
}

// ============================
// STT Hook
// ============================

/**
 * MediaRecorder 기반 STT 훅
 * 마이크 입력 → /api/stt → 텍스트 반환
 */
function useSTT(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        try {
          const res = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const json = (await res.json()) as { text?: string };
            if (json.text) onTranscript(json.text);
          }
        } catch {
          // STT API 미완성 시 무시
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      // 마이크 권한 거부 등
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return { isRecording, toggleRecording };
}

// ============================
// TTS Hook
// ============================

/**
 * Web Audio API / /api/tts 기반 TTS 훅
 * 텍스트 → /api/tts → 오디오 재생
 */
function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
}

// ============================
// 메인 컴포넌트
// ============================

/**
 * ChatWindow
 *
 * SSE 스트리밍, TTS/STT 통합 채팅 창
 */
export default function ChatWindow({
  botId,
  botName,
  emotionLevel,
  conversationId,
  onConversationCreated,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [sttEnabled, setSttEnabled] = useState(false);
  const [activeModel, setActiveModel] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const convIdRef = useRef<string>(conversationId);

  // conversationId prop 변경 시 ref 동기화
  useEffect(() => {
    convIdRef.current = conversationId;
  }, [conversationId]);

  // ──────────────────────────────────────────
  // STT
  // ──────────────────────────────────────────
  const handleTranscript = useCallback((text: string) => {
    setInputText((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const { isRecording, toggleRecording } = useSTT(handleTranscript);

  // ──────────────────────────────────────────
  // TTS
  // ──────────────────────────────────────────
  const { isSpeaking, speak, stop: stopTTS } = useTTS();

  // ──────────────────────────────────────────
  // 스크롤 자동 하단 이동
  // ──────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ──────────────────────────────────────────
  // 메시지 전송 (SSE 스트리밍)
  // ──────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    // 1. 입력창 초기화 + 사용자 메시지 즉시 표시
    setInputText('');
    setIsSending(true);

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text,
    };
    const botPlaceholder: ChatMessage = {
      id: uid(),
      role: 'bot',
      content: '',
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, botPlaceholder]);
    const botMsgId = botPlaceholder.id;

    try {
      // 2. /api/chat/stream POST 요청
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          message: text,
          emotionLevel,
          conversationId: convIdRef.current || undefined,
        }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
      let fullBotReply = '';

      // 3. ReadableStream 청크 처리
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr) as
                | ModelSelectedData
                | ContentData
                | DoneData
                | ErrorData;

              if (currentEvent === 'model_selected') {
                const d = parsed as ModelSelectedData;
                setActiveModel(d.modelName);
                if (!convIdRef.current && d.conversationId) {
                  convIdRef.current = d.conversationId;
                  onConversationCreated(d.conversationId);
                }
              } else if (currentEvent === 'content') {
                const d = parsed as ContentData;
                fullBotReply += d.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, content: fullBotReply, streaming: true }
                      : m
                  )
                );
              } else if (currentEvent === 'done') {
                // 스트리밍 완료
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId ? { ...m, streaming: false } : m
                  )
                );
                // TTS 자동 재생
                if (ttsEnabled && fullBotReply) {
                  void speak(fullBotReply);
                }
              } else if (currentEvent === 'error') {
                const d = parsed as ErrorData;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, content: `오류: ${d.error}`, streaming: false }
                      : m
                  )
                );
              }
            } catch {
              // JSON 파싱 실패 무시
            }

            currentEvent = '';
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '전송 실패';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, content: `오류: ${errMsg}`, streaming: false }
            : m
        )
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [
    inputText,
    isSending,
    botId,
    emotionLevel,
    ttsEnabled,
    speak,
    onConversationCreated,
  ]);

  // ──────────────────────────────────────────
  // Enter 키 전송 (Shift+Enter = 줄바꿈)
  // ──────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  // ──────────────────────────────────────────
  // STT 토글 (sttEnabled 변경 시 버튼 색상만 변경)
  // ──────────────────────────────────────────
  const handleSttToggle = useCallback(() => {
    setSttEnabled((v) => !v);
  }, []);

  // ──────────────────────────────────────────
  // TTS 토글
  // ──────────────────────────────────────────
  const handleTtsToggle = useCallback(() => {
    if (isSpeaking) stopTTS();
    setTtsEnabled((v) => !v);
  }, [isSpeaking, stopTTS]);

  // ──────────────────────────────────────────
  // 렌더
  // ──────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-neutral-400">
              {botName}에게 말을 걸어보세요!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* 봇 아바타 */}
            {msg.role === 'bot' && (
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                {botName.charAt(0)}
              </div>
            )}

            {/* 말풍선 */}
            <div
              className={[
                'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-white text-neutral-800 rounded-bl-sm border border-neutral-100',
              ].join(' ')}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.streaming && (
                <span className="inline-block mt-1 text-neutral-400 animate-pulse">
                  ▌
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 모델 표시 */}
      {activeModel && (
        <div className="px-4 py-1 text-center">
          <span className="text-[11px] text-neutral-400">
            {activeModel} 응답 중
          </span>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="px-3 pb-3 pt-2 bg-white border-t border-neutral-200">
        {/* TTS / STT 토글 */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleTtsToggle}
            title={ttsEnabled ? 'TTS 끄기' : 'TTS 켜기'}
            className={[
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              ttsEnabled
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200',
            ].join(' ')}
          >
            <TtsIcon /> TTS
          </button>

          <button
            onClick={handleSttToggle}
            title={sttEnabled ? 'STT 끄기' : 'STT 켜기'}
            className={[
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              sttEnabled
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200',
            ].join(' ')}
          >
            <MicIcon /> STT
          </button>
        </div>

        {/* 텍스트 입력 + 버튼 묶음 */}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter 전송)"
            rows={1}
            disabled={isSending}
            className="flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-neutral-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />

          {/* STT 마이크 버튼 */}
          {sttEnabled && (
            <button
              onClick={toggleRecording}
              title={isRecording ? '녹음 중지' : '음성 입력'}
              className={[
                'h-10 w-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              ].join(' ')}
            >
              <MicIcon />
            </button>
          )}

          {/* 전송 버튼 */}
          <button
            onClick={() => void sendMessage()}
            disabled={isSending || !inputText.trim()}
            title="전송"
            className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isSending ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================
// 아이콘 컴포넌트
// ============================

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
      <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
    </svg>
  );
}

function TtsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
      <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.061z" />
    </svg>
  );
}
