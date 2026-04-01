import { Suspense } from 'react';
import GuestPageInner from './page-client';

export default function GuestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <GuestPageInner />
    </Suspense>
  );
}
