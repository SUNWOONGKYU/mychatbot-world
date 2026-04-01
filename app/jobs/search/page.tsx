import { Suspense } from 'react';
import JobSearchPageInner from './page-client';

export default function JobSearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <JobSearchPageInner />
    </Suspense>
  );
}
