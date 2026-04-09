'use client';

/**
 * @page /customer-service
 * @description My Chatbot World 고객센터
 */

import { useState } from 'react';

const INQUIRY_TYPES = [
  '일반 문의',
  '기술 지원',
  '결제·환불',
  '계정 관련',
  '제휴·협력',
  '기타',
];

interface FormData {
  type: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  content: string;
}

export default function CustomerServicePage() {
  const [form, setForm] = useState<FormData>({
    type: '',
    name: '',
    email: '',
    phone: '',
    subject: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type || !form.name || !form.email || !form.subject || !form.content) {
      alert('필수 항목을 모두 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    // TODO: Supabase 연동
    setTimeout(() => {
      setSubmitting(false);
      alert('문의가 접수되었습니다.\n영업일 기준 1~2일 내에 답변 드리겠습니다.');
      setForm({ type: '', name: '', email: '', phone: '', subject: '', content: '' });
    }, 600);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'rgb(var(--bg-base))',
        color: 'rgb(var(--text-primary))',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgb(var(--primary-900)), rgb(var(--primary-950, 13 6 56)))',
          paddingTop: '64px',
          paddingBottom: '64px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '12px',
          }}
        >
          고객센터
        </h1>
        <p style={{ fontSize: '15px', color: 'rgb(255 255 255 / 0.7)' }}>
          궁금한 점이 있으신가요? 무엇이든 도와드리겠습니다.
        </p>
      </div>

      {/* 본문 */}
      <div
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '60px 24px 80px',
        }}
      >
        {/* 안내 배너 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '48px',
          }}
        >
          {[
            { icon: '📧', label: '이메일 문의', value: 'support@mychatbotworld.com' },
            { icon: '⏰', label: '운영 시간', value: '평일 10:00 ~ 18:00' },
            { icon: '📅', label: '답변 기간', value: '영업일 1~2일 이내' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '20px 24px',
                background: 'rgb(var(--bg-subtle))',
                borderRadius: '12px',
                border: '1px solid rgb(var(--text-muted) / 0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgb(var(--color-primary))',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: 'rgb(var(--text-secondary))',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* 문의 폼 */}
        <div
          style={{
            background: 'rgb(var(--bg-surface))',
            borderRadius: '16px',
            border: '1px solid rgb(var(--text-muted) / 0.12)',
            padding: '40px',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '32px',
              color: 'rgb(var(--text-primary))',
            }}
          >
            문의하기
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 문의 유형 */}
            <Field label="문의 유형" required>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="">선택해 주세요</option>
                {INQUIRY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            {/* 이름 + 이메일 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="이름" required>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  style={inputStyle}
                />
              </Field>
              <Field label="이메일" required>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* 연락처 */}
            <Field label="연락처">
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="010-0000-0000 (선택)"
                style={inputStyle}
              />
            </Field>

            {/* 제목 */}
            <Field label="제목" required>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="문의 제목을 입력해 주세요"
                style={inputStyle}
              />
            </Field>

            {/* 내용 */}
            <Field label="문의 내용" required>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="문의 내용을 상세히 입력해 주세요.&#10;스크린샷이 필요한 경우 이메일로 별도 첨부해 주세요."
                rows={7}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '160px',
                }}
              />
            </Field>

            {/* 개인정보 동의 */}
            <p
              style={{
                fontSize: '13px',
                color: 'rgb(var(--text-muted))',
                lineHeight: '1.7',
              }}
            >
              문의 접수를 위해 입력하신 개인정보(이름, 이메일, 연락처)는 문의 처리 및 답변 발송 목적으로만 사용되며,
              처리 완료 후 1년간 보유 후 삭제됩니다.
            </p>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: '8px',
                padding: '14px 32px',
                background: submitting
                  ? 'rgb(var(--text-muted))'
                  : 'rgb(var(--color-primary))',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
                alignSelf: 'flex-start',
              }}
            >
              {submitting ? '제출 중...' : '문의 제출'}
            </button>
          </form>
        </div>

        {/* FAQ 링크 영역 */}
        <div
          style={{
            marginTop: '32px',
            padding: '24px',
            background: 'rgb(var(--color-primary) / 0.06)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '14px', color: 'rgb(var(--text-secondary))' }}>
            자주 묻는 질문은{' '}
            <a
              href="/bot/faq"
              style={{
                color: 'rgb(var(--color-primary))',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              FAQ 페이지
            </a>
            에서 먼저 확인해 보세요.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── 스타일 상수 ── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgb(var(--bg-base))',
  border: '1px solid rgb(var(--text-muted) / 0.25)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'rgb(var(--text-primary))',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'auto',
};

/* ── 필드 래퍼 ── */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'rgb(var(--text-secondary))',
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'rgb(var(--color-error))', marginLeft: '3px' }}>*</span>
        )}
      </label>
      {children}
    </div>
  );
}
