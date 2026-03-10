'use client';

import { useCallback } from 'react';
import { useSelectedClinicId } from '@/contexts/ClinicContext';
import { useSystemModal } from '@/hooks/useSystemModal';

export function useClinicGuard() {
  const clinicId = useSelectedClinicId();
  const { showModal } = useSystemModal();

  const ensureClinicSelected = useCallback(() => {
    if (!clinicId) {
      showModal({
        title: 'No Clinic Selected',
        description:
          'You must select a clinic before performing this action.',
        actionLabel: 'Select Clinic',
      });
      return false;
    }
    return true;
  }, [clinicId, showModal]);

  return { clinicId, ensureClinicSelected };
}
