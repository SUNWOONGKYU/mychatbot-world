import { Suspense } from 'react';
import SkillsMarketPageInner from './page-client';

export default function SkillsMarketPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <SkillsMarketPageInner />
    </Suspense>
  );
}
