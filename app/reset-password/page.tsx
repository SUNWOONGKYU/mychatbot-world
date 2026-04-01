import { Suspense } from 'react';
import ResetPasswordPageInner from './page-client';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
