'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'primary';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AppLogo({ 
  className, 
  variant = 'primary', // Kept for compatibility, though we use an image now
  showText = true,
  size = 'md' 
}: AppLogoProps) {
  
  const sizeMap = {
    sm: { height: 24, width: showText ? 100 : 24 },
    md: { height: 32, width: showText ? 133 : 32 },
    lg: { height: 48, width: showText ? 200 : 48 },
    xl: { height: 64, width: showText ? 266 : 64 },
  };

  const activeSize = sizeMap[size];

  // We are using the high-res PNGs now. 
  // If showText is true, we use the full logo, else just the icon.
  const src = showText ? '/medoflow-logo.png' : '/medoflow-icon.png';

  // Ensure styling uses CSS to contain the original logo safely, 
  // as the images might have padding.
  return (
    <div className={cn("flex items-center select-none", className)}>
      <div 
        style={{ height: activeSize.height }}
        className="relative flex items-center"
      >
        <Image 
          src={src} 
          alt="Medoflow Logo" 
          width={1376}
          height={768}
          className="h-[150%] w-auto object-contain -ml-4" // Compensate for potential padding in the image
          priority
        />
      </div>
    </div>
  );
}
