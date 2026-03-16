'use client';

import * as React from 'react';
import { FileQuestion } from 'lucide-react';
import { AppButton } from './AppButton';
import { cn } from '@/lib/utils';

export interface AppEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function AppEmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: AppEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl',
        'border border-dashed border-slate-100 bg-slate-50/50 py-12 px-6 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <FileQuestion className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-medium text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>
      )}
      {actionLabel && onAction && (
        <AppButton
          variant="default"
          size="sm"
          className="mt-4"
          onClick={onAction}
        >
          {actionLabel}
        </AppButton>
      )}
    </div>
  );
}
