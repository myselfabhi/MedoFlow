'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
AppCard.displayName = 'AppCard';

const AppCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'border-b border-slate-200/60 px-6 py-4',
      className
    )}
    {...props}
  />
));
AppCardHeader.displayName = 'AppCardHeader';

const AppCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref as React.Ref<HTMLHeadingElement>}
    className={cn('text-lg font-semibold text-slate-900', className)}
    {...props}
  />
));
AppCardTitle.displayName = 'AppCardTitle';

const AppCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6', className)} {...props} />
));
AppCardContent.displayName = 'AppCardContent';

const AppCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center gap-2 border-t border-slate-200/60 px-6 py-4',
      className
    )}
    {...props}
  />
));
AppCardFooter.displayName = 'AppCardFooter';

export { AppCard, AppCardHeader, AppCardTitle, AppCardContent, AppCardFooter };
