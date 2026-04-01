import { Suspense } from 'react';
import MarketplacePageInner from './page-client';

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <MarketplacePageInner />
    </Suspense>
  );
}
