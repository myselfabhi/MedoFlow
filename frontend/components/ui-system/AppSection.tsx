'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AppSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function AppSection({
  title,
  description,
  children,
  className,
  ...props
}: AppSectionProps) {
  return (
    <section className={cn('space-y-4', className)} {...props}>
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
