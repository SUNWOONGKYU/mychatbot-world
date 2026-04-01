/**
 * @task S2FE1
 * @description 음성 녹음 컴포넌트 — MediaRecorder API 기반
 *
 * - 녹음 시작/중지/재생 UI
 * - 녹음 완료 시 Blob → base64 변환 (STT API 준비)
 * - S2EX1(STT API) 연동 준비 완료 (실제 호출은 S2EX1에서)
 * - 반응형 디자인, 접근성 지원
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import clsx from 'clsx';

// ── 타입 정의 ────────────────────────────────────────────────────────────────

/** 녹음 상태 */
type RecordingState = 'idle' | 'recording' | 'stopped';

/** 녹음 완료 콜백 데이터 */
export interface RecordingData {
  /** 녹음 Blob (audio/webm 또는 audio/ogg) */
  blob: Blob;
  /** base64 인코딩된 오디오 데이터 (STT 전송용) */
  base64: string;
  /** MIME 타입 */
  mimeType: string;
  /** 녹음 시간 (초) */
  durationSeconds: number;
}

/** VoiceRecorder props */
interface VoiceRecorderProps {
  /** 녹음 완료 콜백 */
  onRecordingComplete?: (data: RecordingData) => void;
  /** 녹음 취소/초기화 콜백 */
  onRecordingReset?: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 최대 녹음 시간 (초, 기본 120초) */
  maxDurationSeconds?: number;
}

// ── 유틸리티 ─────────────────────────────────────────────────────────────────

/**
 * Blob을 base64 문자열로 변환한다.
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // data:audio/webm;base64,XXXX → XXXX 추출
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 지원 MIME 타입 탐색 (WebM → OGG → MP4 순서로 시도)
 */
function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

/**
 * 초를 mm:ss 형식으로 변환
 */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

/**
 * VoiceRecorder — 브라우저 MediaRecorder API 기반 음성 녹음 컴포넌트
 *
 * 사용 예:
 * ```tsx
 * <VoiceRecorder
 *   onRecordingComplete={(data) => console.log(data.base64)}
 *   maxDurationSeconds={120}
 * />
 * ```
 */
export function VoiceRecorder({
  onRecordingComplete,
  onRecordingReset,
  disabled = false,
  maxDurationSeconds = 120,
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  // 타이머 정리
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 스트림 정리
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [clearTimer, stopStream, audioUrl]);

  /** 녹음 시작 */
  const handleStartRecording = useCallback(async () => {
    setErrorMsg(null);

    // 마이크 권한 요청
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg('마이크 접근 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.');
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : undefined;

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch {
      setErrorMsg('이 브라우저는 녹음을 지원하지 않습니다.');
      stopStream();
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const mType = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mType });
      audioBlobRef.current = blob;

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setRecordingState('stopped');

      // base64 변환 후 콜백
      if (onRecordingComplete) {
        setIsConverting(true);
        try {
          const base64 = await blobToBase64(blob);
          onRecordingComplete({
            blob,
            base64,
            mimeType: mType,
            durationSeconds: elapsed,
          });
        } catch {
          setErrorMsg('오디오 변환 중 오류가 발생했습니다.');
        } finally {
          setIsConverting(false);
        }
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250); // 250ms 간격으로 데이터 수집
    setRecordingState('recording');
    setElapsed(0);

    // 타이머 시작
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= maxDurationSeconds) {
          // 최대 시간 도달 시 자동 중지
          handleStopRecording();
        }
        return next;
      });
    }, 1000);
  }, [elapsed, maxDurationSeconds, onRecordingComplete, stopStream]);

  /** 녹음 중지 */
  const handleStopRecording = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopStream();
  }, [clearTimer, stopStream]);

  /** 재생/일시정지 토글 */
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setErrorMsg('오디오 재생 중 오류가 발생했습니다.');
      });
    }
  }, [audioUrl, isPlaying]);

  /** 녹음 초기화 */
  const handleReset = useCallback(() => {
    clearTimer();
    stopStream();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingState('idle');
    setElapsed(0);
    setIsPlaying(false);
    setErrorMsg(null);
    audioBlobRef.current = null;
    chunksRef.current = [];
    onRecordingReset?.();
  }, [audioUrl, clearTimer, stopStream, onRecordingReset]);

  // 오디오 이벤트 바인딩
  const handleAudioRef = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
    if (el) {
      el.onplay = () => setIsPlaying(true);
      el.onpause = () => setIsPlaying(false);
      el.onended = () => setIsPlaying(false);
    }
  }, []);

  // ── 렌더링 ────────────────────────────────────────────────────────────────

  const isRecording = recordingState === 'recording';
  const isStopped = recordingState === 'stopped';
  const isIdle = recordingState === 'idle';
  const progressRatio = elapsed / maxDurationSeconds;

  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-4 p-5 rounded-xl',
        'bg-bg-subtle border border-border',
        'transition-all duration-200',
      )}
      role="region"
      aria-label="음성 녹음"
    >
      {/* 상태 표시 원형 버튼 영역 */}
      <div className="flex flex-col items-center gap-3">
        {/* 메인 녹음 버튼 */}
        <button
          type="button"
          onClick={isIdle ? handleStartRecording : handleStopRecording}
          disabled={disabled || isConverting || isStopped}
          className={clsx(
            'relative flex items-center justify-center',
            'w-16 h-16 rounded-full',
            'transition-all duration-200 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            isRecording
              ? 'bg-error text-white shadow-lg shadow-error/30 scale-110 animate-pulse'
              : 'bg-primary text-white hover:bg-primary-hover shadow-md',
          )}
          aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
          aria-pressed={isRecording}
        >
          {isRecording ? (
            /* 중지 아이콘 */
            <span className="w-5 h-5 bg-white rounded-sm" aria-hidden="true" />
          ) : (
            /* 마이크 아이콘 */
            <svg
              className="w-7 h-7"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h-3v2h8v-2h-3v-2.06A9 9 0 0 0 21 12v-2h-2z" />
            </svg>
          )}
        </button>

        {/* 타이머 표시 */}
        {(isRecording || isStopped) && (
          <div
            className={clsx(
              'flex items-center gap-1.5 text-sm font-mono',
              isRecording ? 'text-error' : 'text-text-secondary',
            )}
            aria-live="polite"
            aria-label={`녹음 시간 ${formatDuration(elapsed)}`}
          >
            {isRecording && (
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" aria-hidden="true" />
            )}
            <span>{formatDuration(elapsed)}</span>
            <span className="text-text-muted">/ {formatDuration(maxDurationSeconds)}</span>
          </div>
        )}

        {/* 상태 텍스트 */}
        <p
          className={clsx(
            'text-xs text-center',
            isRecording ? 'text-error' : 'text-text-secondary',
          )}
        >
          {isIdle && '버튼을 눌러 음성을 녹음하세요'}
          {isRecording && '녹음 중... 완료하려면 다시 누르세요'}
          {isStopped && isConverting && '변환 중...'}
          {isStopped && !isConverting && '녹음 완료'}
        </p>
      </div>

      {/* 진행 바 (녹음 중) */}
      {isRecording && (
        <div
          className="w-full bg-border rounded-full h-1.5 overflow-hidden"
          role="progressbar"
          aria-valuenow={elapsed}
          aria-valuemin={0}
          aria-valuemax={maxDurationSeconds}
          aria-label="녹음 진행"
        >
          <div
            className="h-full bg-error rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(progressRatio * 100, 100)}%` }}
          />
        </div>
      )}

      {/* 오디오 재생 영역 (녹음 완료 후) */}
      {isStopped && audioUrl && (
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={isConverting}
            className={clsx(
              'flex items-center justify-center',
              'w-9 h-9 rounded-full shrink-0',
              'bg-primary/10 text-primary hover:bg-primary/20',
              'transition-colors focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-primary',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          {/* 오디오 엘리먼트 (숨김) */}
          <audio ref={handleAudioRef} src={audioUrl} className="sr-only" />

          <div className="flex-1 text-xs text-text-secondary">
            녹음 완료 ({formatDuration(elapsed)})
          </div>

          {/* 재녹음 버튼 */}
          <button
            type="button"
            onClick={handleReset}
            className={clsx(
              'text-xs text-text-muted hover:text-error',
              'transition-colors focus-visible:outline-none',
              'focus-visible:underline',
            )}
            aria-label="녹음 다시 하기"
          >
            다시 녹음
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {errorMsg && (
        <p
          className="text-xs text-error text-center w-full"
          role="alert"
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}
