'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import { JumpingClinicalLoader } from './JumpingClinicalLoader';
import { cn } from '@/lib/utils';

function GlobalApiLoaderContent() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Trigger loader on route changes
  useEffect(() => {
    setIsNavigating(true);
    const timeout = setTimeout(() => setIsNavigating(false), 600);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  // Debounce the API loader
  useEffect(() => {
    const isApiActive = isFetching > 0 || isMutating > 0;
    
    let timeout: NodeJS.Timeout;
    if (isApiActive) {
      timeout = setTimeout(() => setIsVisible(true), 400);
    } else {
      setIsVisible(false);
    }

    return () => clearTimeout(timeout);
  }, [isFetching, isMutating]);

  const showLoader = isVisible || isNavigating;

  if (!showLoader) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
      "bg-white/70 backdrop-blur-md animate-in fade-in duration-300",
      isNavigating && "bg-slate-50/80" // Slightly different look for navigation
    )}>
      <div className="space-y-12 text-center">
        <JumpingClinicalLoader />
        <div className="space-y-2">
          <p className="text-xl font-black text-slate-900 tracking-tight uppercase italic">
            {isNavigating ? 'Loading Clinic Module' : 'Synchronizing Clinical Data'}
          </p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">
            Medoflow Clinical OS
          </p>
        </div>
      </div>
    </div>
  );
}

export function GlobalApiLoader() {
  return (
    <Suspense fallback={null}>
      <GlobalApiLoaderContent />
    </Suspense>
  );
}
