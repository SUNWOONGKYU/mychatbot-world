/**
 * useSkillsStore — localStorage 기반 설치 상태 전역 훅
 * 여러 컴포넌트에서 동기화된 상태를 공유하기 위해 커스텀 이벤트 패턴 사용
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getInstalledIds, installSkillById, removeSkillById } from './skills-data';

const EVENT_KEY = 'mcw_skills_change';

function dispatchChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

export function useSkillsStore() {
  const [installedIds, setInstalledIds] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setInstalledIds(getInstalledIds());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(EVENT_KEY, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(EVENT_KEY, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const install = useCallback((skillId: string) => {
    installSkillById(skillId);
    dispatchChange();
    refresh();
  }, [refresh]);

  const remove = useCallback((skillId: string) => {
    removeSkillById(skillId);
    dispatchChange();
    refresh();
  }, [refresh]);

  const isInstalled = useCallback((skillId: string) => {
    return installedIds.includes(skillId);
  }, [installedIds]);

  return { installedIds, install, remove, isInstalled, count: installedIds.length };
}
