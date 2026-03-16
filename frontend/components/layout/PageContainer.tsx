'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn('mx-auto max-w-7xl px-8 py-10', className)}
      {...props}
    >
      {children}
    </div>
  );
}
