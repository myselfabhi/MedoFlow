'use client';

import React from 'react';
import { AppCard, AppCardContent } from './AppCard';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPIStatCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function KPIStatCard({
  label,
  value,
  description,
  trend,
  icon: Icon,
  iconClassName,
  className,
}: KPIStatCardProps) {
  return (
    <AppCard className={cn('overflow-hidden', className)}>
      <AppCardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
          {Icon && (
            <div className={cn('p-2 rounded-xl bg-slate-50', iconClassName)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-slate-900 leading-none">
            {value}
          </h3>
          {trend && (
            <span className={cn(
              'flex items-center text-xs font-semibold',
              trend.isUp ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {trend.value}%
            </span>
          )}
        </div>
        {description && (
          <p className="mt-2 text-xs text-slate-400 font-medium">{description}</p>
        )}
      </AppCardContent>
    </AppCard>
  );
}
