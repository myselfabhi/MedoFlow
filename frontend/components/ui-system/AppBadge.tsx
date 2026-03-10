'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AppBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default' | 'secondary' | 'outline';
}

function AppBadge({ className, variant = 'neutral', ...props }: AppBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-md border px-2.5 py-0.5 text-xs font-medium',
        variant === 'success' && 'bg-success/10 text-success border-success/20',
        variant === 'warning' && 'bg-warning/10 text-warning border-warning/20',
        variant === 'danger' && 'bg-danger/10 text-danger border-danger/20',
        (variant === 'info' || variant === 'default') && 'bg-primary-100/80 text-primary-700 border-primary-200',
        (variant === 'neutral' || variant === 'secondary') && 'bg-slate-100 text-slate-700 border-slate-200',
        variant === 'outline' && 'border-slate-200 text-slate-700 bg-transparent',
        className
      )}
      {...props}
    />
  );
}

export { AppBadge };
