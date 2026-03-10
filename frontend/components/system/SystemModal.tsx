'use client';

import React from 'react';
import { AppModal } from '@/components/ui-system';

interface SystemModalProps {
  open: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

export function SystemModal({
  open,
  title,
  description,
  actionLabel,
  onAction,
  onClose,
}: SystemModalProps) {
  const handleAction = () => {
    onAction?.();
    onClose();
  };

  return (
    <AppModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={title}
      description={description}
      primaryAction={
        actionLabel && onAction
          ? { label: actionLabel, onClick: handleAction }
          : undefined
      }
      secondaryAction={{
        label: actionLabel ? 'Cancel' : 'OK',
        onClick: onClose,
      }}
    />
  );
}
