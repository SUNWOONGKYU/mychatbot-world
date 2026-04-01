/**
 * @task S3FE2
 * @description 스킬 실행 UI 컴포넌트 — 파라미터 입력 폼 + POST /api/skills/execute
 * 실행 결과 스트리밍 또는 일반 응답 표시
 */
'use client';

import { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';

// ── 타입 ────────────────────────────────────────────────────────

export interface SkillParameter {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  default_value?: string;
}

interface SkillRunnerProps {
  skillId: string;
  skillName: string;
  parameters: SkillParameter[];
}

type RunState = 'idle' | 'running' | 'done' | 'error';

// ── 컴포넌트 ────────────────────────────────────────────────────

export function SkillRunner({ skillId, skillName, parameters }: SkillRunnerProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(parameters.map((p) => [p.name, p.default_value ?? ''])),
  );
  const [runState, setRunState] = useState<RunState>('idle');
  const [output, setOutput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 폼 값 변경
  const handleChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // 유효성 검증
  const validate = (): string | null => {
    for (const param of parameters) {
      if (param.required && !formValues[param.name]?.trim()) {
        return `"${param.label}" 필드를 입력해주세요.`;
      }
    }
    return null;
  };

  // 실행
  const handleRun = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    // 이전 요청 취소
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setRunState('running');
    setOutput('');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/skills/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_id: skillId,
          parameters: formValues,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      // 스트리밍 응답 처리
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
        setIsStreaming(true);
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // SSE 형식 파싱 (data: ... 형태)
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed?.choices?.[0]?.delta?.content ?? parsed?.text ?? data;
                  setOutput((prev) => prev + text);
                } catch {
                  setOutput((prev) => prev + data);
                }
              } else if (line && !line.startsWith(':')) {
                setOutput((prev) => prev + line);
              }
            }
            // 스크롤 자동 이동
            outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
          }
        }
        setIsStreaming(false);
      } else {
        // 일반 JSON 응답
        const data = await res.json();
        const result = data?.result ?? data?.output ?? JSON.stringify(data, null, 2);
        setOutput(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      }

      setRunState('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setRunState('error');
      setIsStreaming(false);
      setErrorMessage(err instanceof Error ? err.message : '실행 중 오류가 발생했습니다.');
    }
  }, [skillId, formValues, parameters]);

  // 실행 취소
  const handleCancel = () => {
    abortRef.current?.abort();
    setRunState('idle');
    setIsStreaming(false);
  };

  // 결과 초기화
  const handleReset = () => {
    setRunState('idle');
    setOutput('');
    setErrorMessage(null);
  };

  // ── 렌더 ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* 파라미터 폼 */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            {skillName} 실행
          </h2>
          {parameters.length > 0 && (
            <span className="text-xs text-text-muted">{parameters.length}개 파라미터</span>
          )}
        </div>

        {parameters.length === 0 ? (
          <p className="text-sm text-text-muted py-2">
            이 스킬은 별도의 입력 파라미터가 필요하지 않습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {parameters.map((param) => (
              <div key={param.name} className="space-y-1.5">
                <label
                  htmlFor={`param-${param.name}`}
                  className="block text-sm font-medium text-text-primary"
                >
                  {param.label}
                  {param.required && (
                    <span className="ml-1 text-error text-xs">*</span>
                  )}
                </label>

                {param.type === 'textarea' ? (
                  <textarea
                    id={`param-${param.name}`}
                    value={formValues[param.name] ?? ''}
                    onChange={(e) => handleChange(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    rows={4}
                    className={clsx(
                      'w-full px-3 py-2 rounded-lg text-sm resize-y',
                      'border border-border bg-bg-base text-text-primary',
                      'placeholder:text-text-muted',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                      'transition-colors',
                    )}
                  />
                ) : param.type === 'select' && param.options ? (
                  <select
                    id={`param-${param.name}`}
                    value={formValues[param.name] ?? ''}
                    onChange={(e) => handleChange(param.name, e.target.value)}
                    className={clsx(
                      'w-full px-3 py-2 rounded-lg text-sm',
                      'border border-border bg-bg-base text-text-primary',
                      'focus:outline-none focus:ring-2 focus:ring-primary',
                    )}
                  >
                    <option value="">선택하세요</option>
                    {param.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`param-${param.name}`}
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={formValues[param.name] ?? ''}
                    onChange={(e) => handleChange(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    className={clsx(
                      'w-full px-3 py-2 rounded-lg text-sm',
                      'border border-border bg-bg-base text-text-primary',
                      'placeholder:text-text-muted',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                      'transition-colors',
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 유효성 에러 */}
        {errorMessage && runState !== 'error' && (
          <p className="text-sm text-error">{errorMessage}</p>
        )}

        {/* 실행 버튼 */}
        <div className="flex gap-3">
          {runState === 'running' ? (
            <button
              onClick={handleCancel}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium',
                'border border-border text-text-secondary',
                'hover:bg-surface-hover transition-colors',
              )}
            >
              <span className="animate-spin text-xs">⟳</span>
              <span>취소</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleRun}
                className={clsx(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold',
                  'bg-primary text-white',
                  'hover:bg-primary-hover transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                )}
              >
                <span>▶</span>
                <span>실행</span>
              </button>
              {(runState === 'done' || runState === 'error') && (
                <button
                  onClick={handleReset}
                  className={clsx(
                    'px-4 py-2.5 rounded-lg text-sm font-medium',
                    'border border-border text-text-secondary',
                    'hover:bg-surface-hover transition-colors',
                  )}
                >
                  초기화
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 실행 결과 */}
      {(output || runState === 'running' || runState === 'error') && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* 결과 헤더 */}
          <div
            className={clsx(
              'flex items-center justify-between px-5 py-3 border-b border-border',
              runState === 'error' ? 'bg-error/5' : 'bg-bg-subtle',
            )}
          >
            <div className="flex items-center gap-2">
              {runState === 'running' && (
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              )}
              {runState === 'done' && (
                <span className="w-2 h-2 rounded-full bg-success" />
              )}
              {runState === 'error' && (
                <span className="w-2 h-2 rounded-full bg-error" />
              )}
              <span className="text-xs font-medium text-text-secondary">
                {runState === 'running'
                  ? isStreaming
                    ? '스트리밍 중...'
                    : '실행 중...'
                  : runState === 'done'
                  ? '실행 완료'
                  : '실행 오류'}
              </span>
            </div>
            {output && (
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
                title="복사"
              >
                복사
              </button>
            )}
          </div>

          {/* 결과 본문 */}
          <div
            ref={outputRef}
            className="p-5 max-h-96 overflow-y-auto"
          >
            {runState === 'error' && errorMessage ? (
              <p className="text-sm text-error">{errorMessage}</p>
            ) : (
              <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono leading-relaxed">
                {output || (runState === 'running' ? '' : '')}
                {runState === 'running' && (
                  <span className="inline-block w-0.5 h-4 bg-text-primary animate-pulse ml-0.5 align-text-bottom" />
                )}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
