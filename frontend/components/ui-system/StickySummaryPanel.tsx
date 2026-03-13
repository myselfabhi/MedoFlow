'use client';

import React from 'react';
import { AppCard, AppCardHeader, AppCardTitle, AppCardContent, AppCardFooter } from './AppCard';
import { cn } from '@/lib/utils';

interface SummaryItem {
  label: string;
  value: React.ReactNode;
  isTotal?: boolean;
  className?: string;
}

interface StickySummaryPanelProps {
  title: string;
  items: SummaryItem[];
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function StickySummaryPanel({
  title,
  items,
  actions,
  footer,
  className,
}: StickySummaryPanelProps) {
  return (
    <div className={cn('sticky top-24', className)}>
      <AppCard className="shadow-lg border-primary-100/50">
        <AppCardHeader className="bg-slate-50/50">
          <AppCardTitle className="text-base font-bold text-slate-900">{title}</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex justify-between items-center px-6 py-4",
                  item.isTotal ? "bg-slate-50/80 pt-6" : ""
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  item.isTotal ? "text-slate-900 font-bold text-base" : "text-slate-500"
                )}>
                  {item.label}
                </span>
                <span className={cn(
                  "text-sm font-semibold",
                  item.isTotal ? "text-primary-700 font-bold text-xl" : "text-slate-900",
                  item.className
                )}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          {actions && (
            <div className="px-6 pb-6 pt-2">
              {actions}
            </div>
          )}
        </AppCardContent>
        {footer && (
          <AppCardFooter className="bg-slate-50/30 text-xs text-slate-400 font-medium italic">
            {footer}
          </AppCardFooter>
        )}
      </AppCard>
    </div>
  );
}
