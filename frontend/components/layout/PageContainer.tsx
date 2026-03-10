'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn('max-w-7xl mx-auto px-6 py-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}
