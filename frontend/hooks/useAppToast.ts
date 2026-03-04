'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

type ToastVariant = 'success' | 'error' | 'info';

export function useAppToast() {
  const show = useCallback((variant: ToastVariant, message: string) => {
    switch (variant) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
        toast.info(message);
        break;
    }
  }, []);

  const success = useCallback((message: string) => show('success', message), [show]);
  const error = useCallback((message: string) => show('error', message), [show]);
  const info = useCallback((message: string) => show('info', message), [show]);

  return { success, error, info, show };
}
