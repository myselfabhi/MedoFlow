'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AppFormFieldProps {
  label: string;
  description?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AppFormField({
  label,
  description,
  error,
  htmlFor,
  required,
  children,
  className,
}: AppFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
