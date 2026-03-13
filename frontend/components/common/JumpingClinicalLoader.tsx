'use client';

import React from 'react';
import { 
  Stethoscope, 
  Syringe, 
  Activity, 
  Pill, 
  Thermometer
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = [
  { icon: Stethoscope, color: 'text-primary-600', delay: '0ms' },
  { icon: Syringe, color: 'text-emerald-600', delay: '150ms' },
  { icon: Activity, color: 'text-rose-600', delay: '300ms' },
  { icon: Pill, color: 'text-amber-600', delay: '450ms' },
  { icon: Thermometer, color: 'text-blue-600', delay: '600ms' },
];

export function JumpingClinicalLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-6", className)}>
      {ICONS.map((item, index) => (
        <div 
          key={index}
          className="animate-clinical-jump"
          style={{ animationDelay: item.delay }}
        >
          <item.icon className={cn("h-12 w-12", item.color)} strokeWidth={3} />
        </div>
      ))}
    </div>
  );
}
