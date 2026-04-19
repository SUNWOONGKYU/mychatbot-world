/**
 * @task S2FE1 / S4GA1
 * @description 코코봇 생성 위저드 스텝 컴포넌트
 *
 * Step 0: 템플릿 선택 (신규 — S4GA1)
 * Step 1: 기본 정보 입력 (코코봇 이름, 설명)
 * Step 2: 음성/텍스트 입력 → AI 분석 (S2BA1 analyze API)
 * Step 3: AI 분석 결과 확인 및 FAQ 검토/편집
 * Step 4: 배포 완료 — URL + QR 코드 표시
 *
 * - 낙관적 업데이트 (FAQ 편집)
 * - 반응형 디자인
 * - 접근성 지원
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { VoiceRecorder, RecordingData } from '@/components/create/voice-recorder';
import type { AnalyzeResult } from '@/app/api/create-bot/analyze/route';
import type { FaqItem } from '@/app/api/create-bot/faq/route';
import type { BotTemplate } from '@/app/api/templates/route';

// ── 타입 정의 ────────────────────────────────────────────────────────────────

/** 전체 위저드 상태 */
export interface WizardState {
  // Step 0 (template)
  selectedTemplateId: string | null;  // null = 직접 만들기
  // Step 1
  name: string;
  description: string;
  // Step 2
  voiceText: string;
  recordingData: RecordingData | null;
  // Step 3
  analyzeResult: AnalyzeResult | null;
  faqs: FaqItem[];
  botId: string | null;
  // Step 4
  deployUrl: string | null;
  qrSvg: string | null;
}

/** API 에러 */
interface ApiError {
  message: string;
}

// ── 공통 UI ──────────────────────────────────────────────────────────────────

/**
 * 섹션 레이블
 */
function Label({ htmlFor, children, required }: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-text-primary mb-1.5"
    >
      {children}
      {required && <span className="ml-0.5 text-error" aria-label="필수">*</span>}
    </label>
  );
}

/**
 * 텍스트 입력 필드
 */
function TextInput({
  id, value, onChange, placeholder, maxLength, disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={clsx(
          'w-full px-3 py-2.5 text-sm rounded-lg',
          'bg-surface border border-border',
          'text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
        )}
      />
      {maxLength && (
        <span className="absolute right-2.5 bottom-2.5 text-xs text-text-muted pointer-events-none">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

/**
 * 텍스트에어리어 필드
 */
function Textarea({
  id, value, onChange, placeholder, maxLength, rows = 4, disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className={clsx(
          'w-full px-3 py-2.5 text-sm rounded-lg resize-none',
          'bg-surface border border-border',
          'text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
        )}
      />
      {maxLength && (
        <span className="absolute right-2.5 bottom-2.5 text-xs text-text-muted pointer-events-none">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

/**
 * 에러 배너
 */
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div
      className={clsx(
        'flex items-start gap-2 p-3 rounded-lg',
        'bg-error/10 border border-error/20 text-error',
        'text-sm',
      )}
      role="alert"
    >
      <span className="shrink-0 mt-0.5">⚠</span>
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-error/60 hover:text-error transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * 로딩 스피너
 */
function Spinner({ label = '처리 중...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8" role="status" aria-label={label}>
      <svg
        className="w-5 h-5 animate-spin text-primary"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  );
}

// ── Step 0: 템플릿 선택 ───────────────────────────────────────────────────────

/** 카테고리 → 표시 이름 매핑 */
const CATEGORY_LABELS: Record<string, string> = {
  cafe: '카페·베이커리',
  restaurant: '음식점',
  shop: '쇼핑몰·매장',
  clinic: '병원·클리닉',
  salon: '미용실·뷰티',
  gym: '헬스·피트니스',
  lawyer: '법률',
  realtor: '부동산',
  academy: '학원·교육',
  studio: '스튜디오',
  school: '학교',
};

interface Step0Props {
  state: WizardState;
  onUpdate: (patch: Partial<WizardState>) => void;
  onNext: () => void;
}

/**
 * Step0TemplateSelect — 템플릿 선택 또는 직접 만들기 선택
 * 선택 시 name, description, (향후 persona) 자동 채움
 */
export function Step0TemplateSelect({ state, onUpdate, onNext }: Step0Props) {
  const [templates, setTemplates] = useState<BotTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(state.selectedTemplateId);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (!res.ok) throw new Error('템플릿을 불러오지 못했습니다.');
        const data = await res.json() as { templates: BotTemplate[] };
        setTemplates(data.templates);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplates();
  }, []);

  function handleSelect(templateId: string | null) {
    setSelected(templateId);

    if (templateId === null) {
      // 직접 만들기: 기존 입력 유지, templateId만 초기화
      onUpdate({ selectedTemplateId: null });
    } else {
      const tpl = templates.find((t) => t.id === templateId);
      if (tpl) {
        onUpdate({
          selectedTemplateId: tpl.id,
          // 기본 정보 자동 채움 (Step 1에서 수정 가능)
          name: tpl.template_name,
          description: tpl.persona_prompt.slice(0, 500),
        });
      }
    }
  }

  function handleNext() {
    // 선택 여부 관계없이 진행 허용 (직접 만들기 포함)
    onNext();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 안내 */}
      <p className="text-xs text-text-secondary">
        업종에 맞는 템플릿을 선택하면 기본 정보가 자동으로 채워집니다. 건너뛰고 직접 입력할 수도 있습니다.
      </p>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <svg className="w-5 h-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          <span className="ml-2 text-sm text-text-secondary">템플릿 불러오는 중...</span>
        </div>
      )}

      {/* 에러 */}
      {fetchError && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error" role="alert">
          {fetchError}
        </div>
      )}

      {/* 템플릿 카드 그리드 */}
      {!isLoading && !fetchError && (
        <div
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
          role="radiogroup"
          aria-label="봇 템플릿 선택"
        >
          {templates.map((tpl) => {
            const isSelected = selected === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelect(isSelected ? null : tpl.id)}
                className={clsx(
                  'relative flex flex-col items-start gap-1.5 p-3 rounded-xl text-left',
                  'border transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'border-border bg-surface hover:border-primary/50 hover:bg-bg-subtle',
                )}
              >
                {/* 선택 체크 */}
                {isSelected && (
                  <span
                    className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
                {/* 카테고리 배지 */}
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {CATEGORY_LABELS[tpl.category] ?? tpl.category}
                </span>
                {/* 템플릿 이름 */}
                <span className="text-xs font-semibold text-text-primary leading-snug line-clamp-2">
                  {tpl.template_name}
                </span>
                {/* FAQ 샘플 수 */}
                <span className="text-[10px] text-text-muted">
                  FAQ {tpl.sample_faqs?.length ?? 0}개 포함
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 직접 만들기 옵션 */}
      {!isLoading && (
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={clsx(
            'w-full py-3 rounded-xl border text-sm font-medium text-center transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            selected === null
              ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/30'
              : 'border-border bg-surface text-text-secondary hover:border-primary/50 hover:text-text-primary',
          )}
          role="radio"
          aria-checked={selected === null}
        >
          {selected === null ? '✓ ' : ''}직접 만들기 (템플릿 없이 시작)
        </button>
      )}

      {/* 다음 버튼 */}
      <button
        type="button"
        onClick={handleNext}
        disabled={isLoading}
        className={clsx(
          'w-full py-3 rounded-xl text-sm font-semibold',
          'bg-primary text-white hover:opacity-90',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-opacity focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        )}
      >
        {selected && selected !== null ? '이 템플릿으로 시작하기' : '직접 만들기'}
      </button>
    </div>
  );
}

// ── Step 1: 기본 정보 입력 ────────────────────────────────────────────────────

interface Step1Props {
  state: WizardState;
  onUpdate: (patch: Partial<WizardState>) => void;
  onNext: () => void;
}

/**
 * Step1BasicInfo — 코코봇 이름과 설명 입력
 */
export function Step1BasicInfo({ state, onUpdate, onNext }: Step1Props) {
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!state.name.trim()) newErrors.name = '코코봇 이름을 입력해 주세요.';
    else if (state.name.trim().length > 100) newErrors.name = '100자 이내로 입력해 주세요.';
    if (!state.description.trim()) newErrors.description = '코코봇 설명을 입력해 주세요.';
    else if (state.description.trim().length < 10)
      newErrors.description = '설명을 10자 이상 입력해 주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Label htmlFor="bot-name" required>코코봇 이름</Label>
        <TextInput
          id="bot-name"
          value={state.name}
          onChange={(v) => {
            onUpdate({ name: v });
            if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
          }}
          placeholder="예: 우리 카페 봇, 법률 상담 AI"
          maxLength={100}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-error" role="alert">{errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="bot-description" required>코코봇 설명</Label>
        <Textarea
          id="bot-description"
          value={state.description}
          onChange={(v) => {
            onUpdate({ description: v });
            if (errors.description) setErrors((e) => ({ ...e, description: undefined }));
          }}
          placeholder="어떤 비즈니스를 위한 코코봇인지 설명해 주세요. 운영 시간, 주요 서비스, 특이사항 등을 포함하면 더 좋은 FAQ가 생성됩니다."
          maxLength={2000}
          rows={5}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-error" role="alert">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-text-muted">
          자세히 입력할수록 AI가 더 정확한 FAQ를 만들어 드립니다.
        </p>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className={clsx(
          'w-full py-3 rounded-xl text-sm font-semibold',
          'bg-primary text-white hover:bg-primary-hover',
          'transition-colors focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        )}
      >
        다음 단계
      </button>
    </div>
  );
}

// ── Step 2: 음성/텍스트 입력 + AI 분석 ───────────────────────────────────────

interface Step2Props {
  state: WizardState;
  onUpdate: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Step2VoiceInput — 음성/텍스트로 추가 정보 입력 후 AI 분석 요청
 */
export function Step2VoiceInput({ state, onUpdate, onNext, onBack }: Step2Props) {
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback((data: RecordingData) => {
    onUpdate({ recordingData: data });
  }, [onUpdate]);

  const handleAnalyze = async () => {
    setError(null);
    setIsAnalyzing(true);

    try {
      // S2BA1 analyze API 호출
      const res = await fetch('/api/create-bot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name,
          description: state.description,
        }),
      });

      const json = (await res.json()) as { success: boolean; data?: AnalyzeResult; error?: string };

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'AI 분석에 실패했습니다.');
      }

      onUpdate({ analyzeResult: json.data ?? null });

      // S2BA1 faq API 호출
      const faqRes = await fetch('/api/create-bot/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name,
          description: state.description,
          businessType: json.data?.businessType,
          tone: json.data?.tone,
          keywords: json.data?.keywords,
        }),
      });

      const faqJson = (await faqRes.json()) as {
        success: boolean;
        data?: { faqs: FaqItem[] };
        error?: string;
      };

      if (!faqRes.ok || !faqJson.success) {
        throw new Error(faqJson.error ?? 'FAQ 생성에 실패했습니다.');
      }

      onUpdate({ faqs: faqJson.data?.faqs ?? [] });
      onNext();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? 'AI 분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return <Spinner label="AI가 코코봇을 분석하고 FAQ를 생성하는 중..." />;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 코코봇 정보 요약 */}
      <div className={clsx(
        'p-3 rounded-lg bg-primary/5 border border-primary/20',
        'text-sm',
      )}>
        <p className="font-medium text-primary">{state.name}</p>
        <p className="mt-0.5 text-text-secondary line-clamp-2">{state.description}</p>
      </div>

      {/* 입력 모드 탭 */}
      <div className="flex gap-2">
        {(['text', 'voice'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setInputMode(mode)}
            className={clsx(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              inputMode === mode
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover',
            )}
            aria-pressed={inputMode === mode}
          >
            {mode === 'text' ? '✏️ 텍스트' : '🎤 음성'}
          </button>
        ))}
      </div>

      {/* 텍스트 입력 */}
      {inputMode === 'text' && (
        <div>
          <Label htmlFor="voice-text">추가 정보 입력 (선택)</Label>
          <Textarea
            id="voice-text"
            value={state.voiceText}
            onChange={(v) => onUpdate({ voiceText: v })}
            placeholder="코코봇에 대한 추가 정보를 입력해 주세요. 자주 묻는 질문, 특별 서비스 등을 자유롭게 적어주세요. (생략 가능)"
            maxLength={1000}
            rows={4}
          />
        </div>
      )}

      {/* 음성 입력 */}
      {inputMode === 'voice' && (
        <div>
          <p className="text-sm text-text-secondary mb-3">
            음성으로 코코봇에 대한 추가 정보를 말씀해 주세요.
            <br />
            <span className="text-xs text-text-muted">
              STT 처리는 이후 단계에서 자동으로 진행됩니다.
            </span>
          </p>
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            onRecordingReset={() => onUpdate({ recordingData: null })}
            maxDurationSeconds={120}
          />
          {state.recordingData && (
            <p className="mt-2 text-xs text-success">
              ✓ 음성 녹음 완료 ({state.recordingData.durationSeconds}초)
            </p>
          )}
        </div>
      )}

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className={clsx(
            'flex-1 py-3 rounded-xl text-sm font-medium',
            'bg-surface border border-border text-text-secondary',
            'hover:bg-surface-hover transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleAnalyze}
          className={clsx(
            'flex-[2] py-3 rounded-xl text-sm font-semibold',
            'bg-primary text-white hover:bg-primary-hover',
            'transition-colors focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
        >
          AI 분석 시작
        </button>
      </div>
    </div>
  );
}

// ── Step 3: FAQ 검토 및 편집 ──────────────────────────────────────────────────

interface Step3Props {
  state: WizardState;
  onUpdate: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Step3FaqReview — AI 분석 결과 확인 및 FAQ 편집 (낙관적 업데이트)
 */
export function Step3FaqReview({ state, onUpdate, onNext, onBack }: Step3Props) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState<FaqItem>({ question: '', answer: '' });

  const analysis = state.analyzeResult;

  /** FAQ 항목 편집 시작 */
  const handleEditStart = (idx: number) => {
    setEditingIndex(idx);
    setEditBuffer({ ...state.faqs[idx] });
  };

  /** FAQ 편집 저장 (낙관적 업데이트) */
  const handleEditSave = () => {
    if (editingIndex === null) return;
    const updated = state.faqs.map((f, i) =>
      i === editingIndex ? { ...editBuffer } : f,
    );
    // 낙관적 업데이트: 저장 전 UI 먼저 반영
    onUpdate({ faqs: updated });
    setEditingIndex(null);
  };

  /** FAQ 항목 삭제 */
  const handleDelete = (idx: number) => {
    const updated = state.faqs.filter((_, i) => i !== idx);
    onUpdate({ faqs: updated });
    if (editingIndex === idx) setEditingIndex(null);
  };

  /** FAQ 배열 순서 이동 */
  const handleMove = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= state.faqs.length) return;
    const updated = [...state.faqs];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onUpdate({ faqs: updated });
  };

  /** 새 FAQ 추가 */
  const handleAddFaq = () => {
    const newFaq: FaqItem = { question: '', answer: '' };
    const updated = [...state.faqs, newFaq];
    onUpdate({ faqs: updated });
    setEditingIndex(updated.length - 1);
    setEditBuffer(newFaq);
  };

  /** FAQ 저장 후 배포 */
  const handleDeploy = async () => {
    setError(null);
    setIsDeploying(true);

    try {
      // FAQ 수정된 경우 저장
      if (state.faqs.length > 0) {
        const faqSaveRes = await fetch('/api/create-bot/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.name,
            description: state.description,
            businessType: analysis?.businessType,
            tone: analysis?.tone,
            keywords: analysis?.keywords,
            customFaqs: state.faqs, // 수정된 FAQ 전달
          }),
        });

        if (!faqSaveRes.ok) {
          const j = (await faqSaveRes.json()) as { error?: string };
          throw new Error(j.error ?? 'FAQ 저장에 실패했습니다.');
        }
      }

      onNext();
    } catch (err) {
      const e = err as ApiError;
      setError(e.message ?? '처리 중 오류가 발생했습니다.');
    } finally {
      setIsDeploying(false);
    }
  };

  if (isDeploying) {
    return <Spinner label="FAQ를 저장하고 배포를 준비하는 중..." />;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* AI 분석 결과 뱃지 */}
      {analysis && (
        <div className={clsx(
          'flex flex-wrap gap-2 p-3 rounded-lg',
          'bg-bg-subtle border border-border',
        )}>
          <span className="text-xl">{analysis.suggestedEmoji}</span>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-1.5">
              <span className={clsx(
                'px-2 py-0.5 text-xs rounded-full',
                'bg-primary/10 text-primary font-medium',
              )}>
                {analysis.businessType}
              </span>
              <span className={clsx(
                'px-2 py-0.5 text-xs rounded-full',
                'bg-info/10 text-info font-medium',
              )}>
                {analysis.tone}
              </span>
              {analysis.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 text-xs rounded-full bg-bg-muted text-text-secondary"
                >
                  #{kw}
                </span>
              ))}
            </div>
            <p className="text-xs text-text-muted italic">"{analysis.suggestedGreeting}"</p>
          </div>
        </div>
      )}

      {/* FAQ 목록 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">
            FAQ 목록 ({state.faqs.length}개)
          </h3>
          <button
            type="button"
            onClick={handleAddFaq}
            className={clsx(
              'text-xs text-primary hover:text-primary-hover',
              'transition-colors focus-visible:outline-none focus-visible:underline',
            )}
          >
            + 항목 추가
          </button>
        </div>

        <div className="flex flex-col gap-3" role="list" aria-label="FAQ 목록">
          {state.faqs.length === 0 && (
            <p className="text-sm text-text-muted text-center py-6">
              FAQ 항목이 없습니다. 항목을 추가해 주세요.
            </p>
          )}

          {state.faqs.map((faq, idx) => (
            <div
              key={idx}
              className={clsx(
                'rounded-lg border transition-colors',
                editingIndex === idx
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface',
              )}
              role="listitem"
            >
              {editingIndex === idx ? (
                /* 편집 모드 */
                <div className="p-3 flex flex-col gap-2">
                  <input
                    type="text"
                    value={editBuffer.question}
                    onChange={(e) => setEditBuffer((b) => ({ ...b, question: e.target.value }))}
                    placeholder="질문"
                    className={clsx(
                      'w-full px-3 py-2 text-sm rounded-lg',
                      'bg-surface border border-border',
                      'text-text-primary focus:outline-none',
                      'focus:ring-2 focus:ring-primary focus:border-primary',
                    )}
                    aria-label="질문 편집"
                  />
                  <textarea
                    value={editBuffer.answer}
                    onChange={(e) => setEditBuffer((b) => ({ ...b, answer: e.target.value }))}
                    placeholder="답변"
                    rows={3}
                    className={clsx(
                      'w-full px-3 py-2 text-sm rounded-lg resize-none',
                      'bg-surface border border-border',
                      'text-text-primary focus:outline-none',
                      'focus:ring-2 focus:ring-primary focus:border-primary',
                    )}
                    aria-label="답변 편집"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleEditSave}
                      className={clsx(
                        'text-xs font-medium px-3 py-1 rounded-md',
                        'bg-primary text-white hover:bg-primary-hover transition-colors',
                      )}
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                /* 보기 모드 */
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary flex-1">
                      <span className="text-primary mr-1.5">Q.</span>
                      {faq.question || <span className="text-text-muted italic">질문 없음</span>}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* 순서 이동 */}
                      <button
                        type="button"
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                        aria-label="위로 이동"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === state.faqs.length - 1}
                        className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                        aria-label="아래로 이동"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditStart(idx)}
                        className="p-1 text-text-muted hover:text-primary transition-colors"
                        aria-label="편집"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="p-1 text-text-muted hover:text-error transition-colors"
                        aria-label="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-text-secondary leading-relaxed pl-5">
                    <span className="font-medium text-text-muted mr-1">A.</span>
                    {faq.answer || <span className="italic">답변 없음</span>}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* 버튼 영역 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className={clsx(
            'flex-1 py-3 rounded-xl text-sm font-medium',
            'bg-surface border border-border text-text-secondary',
            'hover:bg-surface-hover transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleDeploy}
          className={clsx(
            'flex-[2] py-3 rounded-xl text-sm font-semibold',
            'bg-primary text-white hover:bg-primary-hover',
            'transition-colors focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
        >
          배포하기
        </button>
      </div>
    </div>
  );
}

// ── Step 4: 배포 완료 ─────────────────────────────────────────────────────────

interface Step4Props {
  state: WizardState;
  onFinish: () => void;
}

/**
 * Step4DeployComplete — 배포 URL과 QR 코드 표시
 */
export function Step4DeployComplete({ state, onFinish }: Step4Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!state.deployUrl) return;
    try {
      await navigator.clipboard.writeText(state.deployUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: execCommand
      const el = document.createElement('textarea');
      el.value = state.deployUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* 성공 아이콘 */}
      <div
        className={clsx(
          'flex items-center justify-center',
          'w-16 h-16 rounded-full',
          'bg-success/10 text-success',
          'text-3xl',
        )}
        aria-hidden="true"
      >
        ✓
      </div>

      <div>
        <h3 className="text-lg font-bold text-text-primary">
          {state.name} 코코봇이 배포되었습니다!
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          아래 URL이나 QR 코드로 코코봇에 접근할 수 있습니다.
        </p>
      </div>

      {/* 배포 URL */}
      {state.deployUrl && (
        <div className="w-full">
          <p className="text-xs text-text-muted mb-1.5 text-left">배포 URL</p>
          <div className={clsx(
            'flex items-center gap-2 p-3 rounded-lg',
            'bg-bg-subtle border border-border',
          )}>
            <span className="flex-1 text-sm font-mono text-primary truncate text-left">
              {state.deployUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={clsx(
                'shrink-0 px-3 py-1.5 rounded-md text-xs font-medium',
                'transition-colors focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary',
                copied
                  ? 'bg-success/10 text-success'
                  : 'bg-primary/10 text-primary hover:bg-primary/20',
              )}
              aria-label="URL 복사"
            >
              {copied ? '복사됨 ✓' : '복사'}
            </button>
          </div>
        </div>
      )}

      {/* QR 코드 */}
      {state.qrSvg && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-text-muted">QR 코드</p>
          <div
            className="p-3 rounded-lg bg-white border border-border shadow-sm"
            aria-label="코코봇 QR 코드"
            dangerouslySetInnerHTML={{ __html: state.qrSvg }}
          />
          <p className="text-xs text-text-muted">
            스마트폰으로 스캔하면 바로 연결됩니다
          </p>
        </div>
      )}

      {/* 완료 버튼 */}
      <button
        type="button"
        onClick={onFinish}
        className={clsx(
          'w-full py-3 rounded-xl text-sm font-semibold',
          'bg-primary text-white hover:bg-primary-hover',
          'transition-colors focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        )}
      >
        완료 — 내 봇 보기
      </button>
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────

interface ProgressBarProps {
  /** 현재 스텝 (1~4) */
  currentStep: number;
  /** 총 스텝 수 */
  totalSteps: number;
}

/** 스텝 메타 */
const STEP_LABELS = ['템플릿', '기본 정보', 'AI 분석', 'FAQ 검토', '배포 완료'];

/**
 * WizardProgressBar — 스텝 진행 표시바
 */
export function WizardProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="w-full" role="navigation" aria-label="위저드 단계">
      {/* 스텝 레이블 */}
      <div
        className="flex justify-between mb-2"
        aria-label={`${currentStep}단계 / ${totalSteps}단계`}
      >
        {STEP_LABELS.slice(0, totalSteps).map((label, idx) => {
          const step = idx + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          return (
            <div
              key={step}
              className="flex flex-col items-center gap-1 flex-1"
              aria-current={isActive ? 'step' : undefined}
            >
              {/* 스텝 원형 */}
              <div
                className={clsx(
                  'flex items-center justify-center',
                  'w-7 h-7 rounded-full text-xs font-semibold',
                  'transition-colors duration-200',
                  isCompleted
                    ? 'bg-primary text-white'
                    : isActive
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-bg-muted text-text-muted',
                )}
              >
                {isCompleted ? '✓' : step}
              </div>
              {/* 레이블 */}
              <span
                className={clsx(
                  'text-xs hidden sm:block transition-colors',
                  isActive ? 'text-primary font-medium' : 'text-text-muted',
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 연결선 진행 바 */}
      <div className="relative flex items-center h-1 mx-3.5 mb-1">
        <div className="absolute inset-0 bg-border rounded-full" />
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`${currentStep}/${totalSteps} 단계`}
        />
      </div>
    </div>
  );
}
