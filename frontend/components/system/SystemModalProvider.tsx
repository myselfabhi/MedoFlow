'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { SystemModal } from '@/components/system/SystemModal';

export interface SystemModalOptions {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface SystemModalContextType {
  showModal: (options: SystemModalOptions) => void;
}

const SystemModalContext = createContext<SystemModalContextType | undefined>(undefined);

export function SystemModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<SystemModalOptions | null>(null);

  const showModal = useCallback((options: SystemModalOptions) => {
    setModalState(options);
  }, []);

  const handleClose = useCallback(() => {
    setModalState(null);
  }, []);

  const handleAction = useCallback(() => {
    modalState?.onAction?.();
    setModalState(null);
  }, [modalState]);

  return (
    <SystemModalContext.Provider value={{ showModal }}>
      {children}
      <SystemModal
        open={!!modalState}
        title={modalState?.title ?? ''}
        description={modalState?.description ?? ''}
        actionLabel={modalState?.actionLabel}
        onAction={modalState?.actionLabel ? handleAction : undefined}
        onClose={handleClose}
      />
    </SystemModalContext.Provider>
  );
}

export function useSystemModal() {
  const context = useContext(SystemModalContext);
  if (context === undefined) {
    throw new Error('useSystemModal must be used within a SystemModalProvider');
  }
  return context;
}
