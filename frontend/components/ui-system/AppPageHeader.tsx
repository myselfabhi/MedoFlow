'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AppPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function AppPageHeader({
  title,
  description,
  actions,
  className,
}: AppPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-2xl border border-[#E5E7EB] bg-white px-6 py-6 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-[#64748B]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
