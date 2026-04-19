/**
 * @task S5FE6
 * @description 마이페이지 탭1 — 프로필 관리
 * S5 디자인 토큰 기반, 다크/라이트 동시 지원
 */
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  notification_enabled: boolean;
  language: 'ko' | 'en';
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}

function ToggleSwitch({ checked, onChange, disabled, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50',
        checked
          ? 'bg-[rgb(var(--color-primary))]'
          : 'bg-[rgb(var(--border-strong))]',
      )}
      aria-label={label}
    >
      <span
        className={clsx(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

function AvatarDisplay({ profile }: { profile: UserProfile }) {
  const initials = profile.full_name?.trim()?.[0]?.toUpperCase()
    ?? profile.email[0].toUpperCase();
  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt="프로필 사진"
        width={128}
        height={128}
        className="w-32 h-32 rounded-full object-cover border-2 border-[rgb(var(--color-primary)/0.3)]"
      />
    );
  }
  return (
    <div className="w-32 h-32 rounded-full bg-[rgb(var(--color-primary-muted))] border-2 border-[rgb(var(--color-primary)/0.3)] flex items-center justify-center text-4xl font-bold text-[rgb(var(--color-primary))]">
      {initials}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('mcw_access_token') || sessionStorage.getItem('mcw_access_token') || '';
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

interface Tab1ProfileProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
}

export default function Tab1Profile({ profile, onProfileUpdate }: Tab1ProfileProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.full_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [notif, setNotif] = useState(profile.notification_enabled);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ full_name: name.trim() || null, bio: bio.trim() || null }),
      });
      if (!res.ok) throw new Error('저장에 실패했습니다.');
      const data = await res.json();
      onProfileUpdate({ ...profile, ...data });
      setSaveSuccess(true);
      setEditing(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotifToggle = async (v: boolean) => {
    setNotif(v);
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ notification_enabled: v }),
      });
      onProfileUpdate({ ...profile, notification_enabled: v });
    } catch {
      setNotif(!v); // rollback
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const token = getToken();
      const res = await fetch('/api/auth/me/avatar', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('업로드 실패');
      const data = await res.json();
      onProfileUpdate({ ...profile, avatar_url: data.avatar_url });
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 카드: 아바타 + 기본 정보 */}
      <div
        className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-6"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex flex-col sm:flex-row gap-6">
          {/* 아바타 영역 */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <AvatarDisplay profile={profile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={clsx(
                'text-sm px-4 py-1.5 rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                'bg-[rgb(var(--bg-surface-hover))] text-[rgb(var(--text-secondary))]',
                'hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-strong))]',
                'transition-colors disabled:opacity-50',
              )}
            >
              {uploading ? '업로드 중...' : '사진 변경'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {/* 기본 정보 영역 */}
          <div className="flex-1 space-y-4">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">기본 정보</h2>

            {/* 닉네임 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">
                닉네임
              </label>
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  maxLength={30}
                  className={clsx(
                    'w-full px-3 py-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                    'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))]',
                    'placeholder:text-[rgb(var(--text-muted))]',
                    'focus:outline-none focus:border-[rgb(var(--color-primary))]',
                    'focus:ring-1 focus:ring-[rgb(var(--color-primary)/0.3)]',
                    'transition-colors',
                  )}
                />
              ) : (
                <p className="text-[rgb(var(--text-primary))] font-medium">
                  {profile.full_name || '—'}
                </p>
              )}
            </div>

            {/* 이메일 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">
                이메일
              </label>
              <p className="text-[rgb(var(--text-secondary))]">{profile.email}</p>
            </div>

            {/* 가입일 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">
                가입일
              </label>
              <p className="text-[rgb(var(--text-secondary))]">{formatDate(profile.created_at)}</p>
            </div>

            {/* 자기소개 */}
            {editing && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">
                  자기소개
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="간단한 소개를 입력하세요"
                  className={clsx(
                    'w-full px-3 py-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                    'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))]',
                    'placeholder:text-[rgb(var(--text-muted))]',
                    'focus:outline-none focus:border-[rgb(var(--color-primary))]',
                    'focus:ring-1 focus:ring-[rgb(var(--color-primary)/0.3)]',
                    'transition-colors resize-none',
                  )}
                />
              </div>
            )}

            {/* 에러/성공 메시지 */}
            {saveError && (
              <p className="text-sm text-[rgb(var(--color-error))]">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-sm text-[rgb(var(--color-success))]">저장되었습니다.</p>
            )}

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={clsx(
                      'px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold',
                      'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]',
                      'hover:bg-[rgb(var(--color-primary-hover))] transition-colors',
                      'disabled:opacity-50',
                    )}
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setName(profile.full_name ?? '');
                      setBio(profile.bio ?? '');
                      setSaveError('');
                    }}
                    className={clsx(
                      'px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium',
                      'border border-[rgb(var(--border))]',
                      'text-[rgb(var(--text-secondary))]',
                      'hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-strong))]',
                      'transition-colors',
                    )}
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={clsx(
                    'px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium',
                    'border border-[rgb(var(--border))]',
                    'text-[rgb(var(--text-secondary))]',
                    'hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-strong))]',
                    'transition-colors',
                  )}
                >
                  수정
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 알림 설정 카드 */}
      <div
        className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-6"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">알림 설정</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">이메일 알림</p>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
              상속 동의, 입금 완료, 스킬 업데이트 등 중요 알림을 받습니다.
            </p>
          </div>
          <ToggleSwitch
            checked={notif}
            onChange={handleNotifToggle}
            label="이메일 알림 토글"
          />
        </div>
      </div>
    </div>
  );
}
