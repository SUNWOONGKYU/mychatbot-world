// @task S5FE7 - 관리자 토스트 훅
'use client';

import { useState, useCallback, useRef } from 'react';

export function useAdminToast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  const ToastEl = (
    <div className={`admin-toast${visible ? ' show' : ''}`}>
      {message}
    </div>
  );

  return { showToast, ToastEl };
}
