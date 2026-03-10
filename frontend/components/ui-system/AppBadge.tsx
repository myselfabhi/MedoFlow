'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AppBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
}

function AppBadge({ className, variant = 'default', ...props }: AppBadgeProps) {
  return (
    <Badge
      variant={variant === 'default' ? 'default' : variant === 'secondary' ? 'secondary' : 'outline'}
      className={cn(
        'rounded-md border px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-primary text-primary-foreground border-transparent',
        variant === 'secondary' && 'bg-slate-100 text-slate-700 border-transparent',
        variant === 'outline' && 'border-slate-200 text-slate-700',
        variant === 'success' && 'bg-success/10 text-success border-success/20',
        variant === 'warning' && 'bg-warning/10 text-warning border-warning/20',
        variant === 'danger' && 'bg-danger/10 text-danger border-danger/20',
        className
      )}
      {...props}
    />
  );
}

export { AppBadge };
