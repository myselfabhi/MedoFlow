'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AppButton } from './AppButton';
import { cn } from '@/lib/utils';

export interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  content?: React.ReactNode;
  children?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  content,
  children,
  primaryAction,
  secondaryAction,
  className,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'rounded-3xl border-slate-100 bg-card shadow-card max-w-lg',
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-slate-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {(content || children) && (
          <div className="py-4">{content ?? children}</div>
        )}
        {(primaryAction || secondaryAction) && (
          <DialogFooter className="gap-2 sm:gap-0">
            {primaryAction && (
              <AppButton
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </AppButton>
            )}
            {secondaryAction && (
              <AppButton
                variant="outline"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </AppButton>
            )}
            {!secondaryAction && primaryAction && (
              <AppButton
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </AppButton>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
