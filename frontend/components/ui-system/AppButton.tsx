'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'rounded-[var(--radius)] font-medium transition-colors',
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'outline' && 'border-slate-200 text-slate-700 hover:bg-slate-50',
          variant === 'ghost' && 'text-slate-700 hover:bg-slate-100',
          variant === 'destructive' && 'bg-danger text-white hover:bg-danger/90',
          variant === 'secondary' && 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          className
        )}
        {...props}
      />
    );
  }
);
AppButton.displayName = 'AppButton';

export { AppButton };
