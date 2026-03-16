'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'primary';
  showText?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  xs: { height: 16 },
  sm: { height: 20 },
  md: { height: 28 },
  lg: { height: 36 },
  xl: { height: 48 },
};

export function AppLogo({ 
  className, 
  showText = true,
  size = 'md' 
}: AppLogoProps) {
  
  const activeHeight = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div 
        style={{ height: activeHeight.height }}
        className="relative w-auto aspect-[1376/768] shrink-0"
      >
        <Image 
          src="/Medoflow-logo.svg" 
          alt="Medoflow" 
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
