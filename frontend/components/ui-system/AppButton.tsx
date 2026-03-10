'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'default' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const variantMap = {
      primary: 'default',
      default: 'default',
      secondary: 'secondary',
      outline: 'outline',
      danger: 'destructive',
      destructive: 'destructive',
      ghost: 'ghost',
    } as const;

    const isPrimary = variant === 'primary' || variant === 'default';
    const isDanger = variant === 'danger' || variant === 'destructive';

    return (
      <Button
        ref={ref}
        variant={variantMap[variant]}
        size={size}
        className={cn(
          'rounded-xl font-medium transition-colors',
          isPrimary && 'bg-primary-600 text-white hover:bg-primary-700',
          variant === 'secondary' && 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          variant === 'outline' && 'border-slate-200 text-slate-700 hover:bg-slate-50',
          isDanger && 'bg-danger text-white hover:bg-danger/90',
          variant === 'ghost' && 'text-slate-700 hover:bg-slate-100',
          className
        )}
        {...props}
      />
    );
  }
);
AppButton.displayName = 'AppButton';

export { AppButton };
