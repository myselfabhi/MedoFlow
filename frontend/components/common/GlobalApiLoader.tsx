'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppLogo } from './AppLogo';

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
      "bg-white/40 backdrop-blur-sm animate-in fade-in duration-500",
      isNavigating && "bg-white/60"
    )}>
      <div className="space-y-6 text-center">
        <AppLogo showText={false} size="xl" animated={false} className="justify-center scale-[2.4] sm:scale-[2.8]" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-600 tracking-wide">
            Medoflow
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {isNavigating ? 'Updating Module' : 'Synchronizing Data'}
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
