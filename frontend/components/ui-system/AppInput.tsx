'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface AppInputProps
  extends React.ComponentProps<typeof Input> {}

const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn(
        'rounded-[12px] border-slate-200/80 bg-white text-slate-900 placeholder:text-muted',
        'focus-visible:ring-accent/20 focus-visible:border-accent',
        className
      )}
      {...props}
    />
  )
);
AppInput.displayName = 'AppInput';

export { AppInput };
