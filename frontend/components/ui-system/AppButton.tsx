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
          isPrimary && 'bg-accent text-accent-foreground hover:bg-accent/90',
          variant === 'secondary' && 'bg-muted/20 text-foreground hover:bg-muted/30',
          variant === 'outline' && 'border-border text-foreground hover:bg-subtle',
          isDanger && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          variant === 'ghost' && 'text-muted-foreground hover:bg-subtle hover:text-foreground',
          className
        )}
        {...props}
      />
    );
  }
);
AppButton.displayName = 'AppButton';

export { AppButton };
