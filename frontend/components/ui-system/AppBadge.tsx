'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AppBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'destructive' | 'danger' | 'accent' | 'outline' | 'default' | 'secondary' | 'neutral';
}

function AppBadge({ className, variant = 'outline', ...props }: AppBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variant === 'success' && 'bg-success/10 text-success border-success/20',
        variant === 'warning' && 'bg-warning/10 text-warning border-warning/20',
        (variant === 'destructive' || variant === 'danger') && 'bg-destructive/10 text-destructive border-destructive/20',
        (variant === 'accent' || variant === 'default') && 'bg-accent/10 text-accent border-accent/20',
        (variant === 'neutral' || variant === 'secondary') && 'bg-muted/10 text-muted-foreground border-border',
        variant === 'outline' && 'border-border text-muted-foreground bg-transparent',
        className
      )}
      {...props}
    />
  );
}

export { AppBadge };
