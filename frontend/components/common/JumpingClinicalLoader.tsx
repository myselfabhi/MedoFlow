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
  { icon: Stethoscope, delay: '0ms' },
  { icon: Activity, delay: '200ms' },
  { icon: Pill, delay: '400ms' },
];

export function JumpingClinicalLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {ICONS.map((item, index) => (
        <div 
          key={index}
          className="animate-subtle-float"
          style={{ animationDelay: item.delay }}
        >
          <item.icon className="h-6 w-6 text-primary-600/60" strokeWidth={2} />
        </div>
      ))}
    </div>
  );
}
